#!/usr/bin/env bash
# Consistent, compressed and (by default) encrypted MySQL dump.
#
#   ./backup.sh                 -> backups/sdg-<db>-<timestamp>.sql.gz.enc
#
# Encryption: AES-256 (openssl, PBKDF2) with the passphrase in .backup-passphrase
# (created on first run, chmod 600). Keep a copy of that passphrase in the
# corporate vault: without it the backups cannot be restored.
# Set BACKUP_ENCRYPT=false only for a throw-away test environment.
# BACKUP_RETENTION_DAYS (default 30) deletes older local backups; copy backups
# off-host (object storage / another server) as part of your schedule.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
umask 077

if [[ ! -f .env ]]; then
  echo "Error: no existe .env. Ejecuta primero ./install.sh." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

BACKUP_ENCRYPT="${BACKUP_ENCRYPT:-true}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-$ROOT_DIR/.backup-passphrase}"

mkdir -p backups
stamp="$(date +%Y%m%d-%H%M%S)"
base="backups/sdg-${MYSQL_DATABASE}-${stamp}.sql.gz"

# The password is read from the db container's own environment. (v1.1.0 set
# MYSQL_PWD on the host, which `docker compose exec` does not forward, so the
# dump ran without a password.) Uses the application account: it has every
# privilege the dump needs on this schema and nothing else.
dump() {
  docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump -u"$MYSQL_USER" --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF "$MYSQL_DATABASE"'
}

if [[ "$BACKUP_ENCRYPT" == "true" ]]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "Error: openssl es necesario para cifrar el respaldo." >&2
    exit 1
  fi
  if [[ ! -s "$PASSPHRASE_FILE" ]]; then
    openssl rand -base64 48 > "$PASSPHRASE_FILE"
    chmod 600 "$PASSPHRASE_FILE"
    echo "Se generó $PASSPHRASE_FILE. Guárdalo en la bóveda corporativa: sin él no se puede restaurar." >&2
  fi
  output="${base}.enc"
  dump | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:${PASSPHRASE_FILE}" -out "$output"
else
  output="$base"
  dump | gzip -9 > "$output"
fi

# A dump that only contains headers means something failed upstream.
if [[ ! -s "$output" ]] || [[ "$(stat -c %s "$output")" -lt 512 ]]; then
  echo "Error: el respaldo $output está vacío o incompleto." >&2
  exit 1
fi
chmod 600 "$output"

find backups -maxdepth 1 -type f -name 'sdg-*.sql.gz*' -mtime "+${BACKUP_RETENTION_DAYS}" -delete

echo "Respaldo creado: $output"
