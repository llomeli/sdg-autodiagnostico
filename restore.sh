#!/usr/bin/env bash
# Restores a backup produced by backup.sh into the running db container.
#
#   ./restore.sh backups/sdg-sdg_lead_magnet-20261101-020000.sql.gz.enc
#
# DESTRUCTIVE: replaces the current tables. Practise it on staging first and
# record the evidence (date, file, row counts) as the restore test.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

file="${1:-}"
if [[ -z "$file" || ! -f "$file" ]]; then
  echo "Uso: ./restore.sh <archivo .sql.gz | .sql.gz.enc>" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a
PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-$ROOT_DIR/.backup-passphrase}"

if [[ "${RESTORE_CONFIRM:-}" != "yes" ]]; then
  read -r -p "Esto sobrescribe la base ${MYSQL_DATABASE}. Escribe RESTAURAR para continuar: " answer
  [[ "$answer" == "RESTAURAR" ]] || { echo "Cancelado."; exit 1; }
fi

decode() {
  case "$file" in
    *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:${PASSPHRASE_FILE}" -in "$file" | gunzip ;;
    *.gz) gunzip -c "$file" ;;
    *) cat "$file" ;;
  esac
}

decode | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'

docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" -N -e "SELECT CONCAT(\"prospectos=\", COUNT(*)) FROM prospect_submissions; SELECT CONCAT(\"respuestas=\", COUNT(*)) FROM assessment_responses;"'
echo "Restauración terminada desde $file"
