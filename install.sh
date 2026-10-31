#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado. Instala Docker Engine y el plugin Docker Compose antes de continuar." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Error: el plugin Docker Compose no está disponible." >&2
  exit 1
fi

random_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
  fi
}

if [[ ! -f .env ]]; then
  db_password="$(random_hex)"
  root_password="$(random_hex)"
  admin_password="$(random_hex)"
  jwt_secret="$(random_hex)"
  umask 077
  cat > .env <<EOF
APP_BIND=127.0.0.1
APP_PORT=3000
MYSQL_DATABASE=sdg_lead_magnet
MYSQL_USER=sdg_app
MYSQL_PASSWORD=${db_password}
MYSQL_ROOT_PASSWORD=${root_password}
SELF_HOSTED_MODE=true
LOCAL_ADMIN_USERNAME=admin
LOCAL_ADMIN_PASSWORD=${admin_password}
LOCAL_ADMIN_NAME="Administrador SDG"
JWT_SECRET=${jwt_secret}
ADMIN_SESSION_HOURS=8
# Proxy inverso: IP/CIDR del proxy o número de saltos (ver README_SELF_HOSTING.md)
TRUST_PROXY="loopback,uniquelocal"
COOKIE_SECURE=false
SUBMIT_RATE_LIMIT_PER_HOUR=10
LOGIN_RATE_LIMIT_PER_15MIN=10
# Aviso de Privacidad aprobado por Legal (obligatorio antes de abrir al público)
PRIVACY_NOTICE_VERSION=
VITE_PRIVACY_NOTICE_URL=
VITE_LEGAL_ENTITY_NAME=
EOF
  chmod 600 .env
  cat > .admin-credentials <<EOF
Usuario: admin
Contraseña: ${admin_password}
EOF
  chmod 600 .admin-credentials
  echo "Se generaron credenciales nuevas. Quedaron guardadas en .admin-credentials; consérvalas de forma segura."
else
  echo "Se usará la configuración existente en .env."
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

if [[ -z "${PRIVACY_NOTICE_VERSION:-}" || -z "${VITE_PRIVACY_NOTICE_URL:-}" || -z "${VITE_LEGAL_ENTITY_NAME:-}" ]]; then
  echo "AVISO: faltan PRIVACY_NOTICE_VERSION / VITE_PRIVACY_NOTICE_URL / VITE_LEGAL_ENTITY_NAME en .env."
  echo "       El formulario mostrará un marcador visible. No abras el sitio al público hasta que Legal apruebe el aviso."
fi

echo "Construyendo y levantando SDG Group | Autodiagnóstico de Gobierno de Datos..."
docker compose up -d --build

echo
echo "Contenedores activos:"
docker compose ps
echo
echo "Sitio (sólo en este servidor): http://${APP_BIND:-127.0.0.1}:${APP_PORT:-3000}/"
echo "Panel: http://${APP_BIND:-127.0.0.1}:${APP_PORT:-3000}/admin"
echo "Comprobación: curl -fsS http://${APP_BIND:-127.0.0.1}:${APP_PORT:-3000}/readyz"
echo "Para publicar: configura HTTPS con un proxy inverso (deploy/Caddyfile.example) y COOKIE_SECURE=true."
echo "Para ver logs: docker compose logs -f app"
