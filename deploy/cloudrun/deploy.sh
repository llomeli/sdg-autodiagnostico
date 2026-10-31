#!/usr/bin/env bash
# Despliegue del autodiagnóstico en Google Cloud Run + Cloud SQL (MySQL 8.4).
#
#   PROJECT_ID=mi-proyecto ./deploy/cloudrun/deploy.sh
#
# Variables opcionales: REGION (por defecto northamerica-south1, Querétaro),
# SERVICE, SQL_INSTANCE, SQL_TIER, ACCESS (iap | public), IAP_MEMBERS
# (p. ej. "domain:empresa.com,user:persona@empresa.com"), VITE_PRIVACY_NOTICE_URL,
# VITE_LEGAL_ENTITY_NAME, PRIVACY_NOTICE_VERSION.
#
# Requisito: el dueño ejecutó antes deploy/cloudrun/bootstrap-owner.sh (proyecto, APIs,
# cuentas agent-deployer / sdg-build / sdg-run). Este script lo corre el agente con
#   export CLOUDSDK_AUTH_ACCESS_TOKEN=<token de 1 h de agent-deployer>
# Idempotente: se puede volver a ejecutar para publicar una versión nueva.
# Los secretos se generan una sola vez y viven en Secret Manager.
set -euo pipefail

: "${PROJECT_ID:?Define PROJECT_ID}"
REGION="${REGION:-northamerica-south1}"
SERVICE="${SERVICE:-sdg-autodiagnostico}"
SQL_INSTANCE="${SQL_INSTANCE:-sdg-autodiagnostico-db}"
SQL_TIER="${SQL_TIER:-db-f1-micro}"
DB_NAME="${DB_NAME:-sdg_lead_magnet}"
DB_USER="${DB_USER:-sdg_app}"
REPO="${REPO:-sdg}"
ACCESS="${ACCESS:-iap}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}"

g() { gcloud --project "$PROJECT_ID" --quiet "$@"; }
secret_exists() { g secrets describe "$1" >/dev/null 2>&1; }
put_secret_once() { # name value
  if ! secret_exists "$1"; then
    printf '%s' "$2" | g secrets create "$1" --replication-policy=automatic --data-file=- >/dev/null
    echo "  secreto creado: $1"
  fi
}

BUILD_SA="sdg-build@${PROJECT_ID}.iam.gserviceaccount.com"
RUN_SA="sdg-run@${PROJECT_ID}.iam.gserviceaccount.com"
SRC_BUCKET="gs://${PROJECT_ID}-build-src"

echo "== 1/7 Comprobaciones"
g iam service-accounts describe "$RUN_SA" >/dev/null || { echo "Falta bootstrap-owner.sh" >&2; exit 1; }

echo "== 2/7 Artifact Registry"
g artifacts repositories describe "$REPO" --location "$REGION" >/dev/null 2>&1 || \
  g artifacts repositories create "$REPO" --repository-format=docker --location "$REGION" >/dev/null

echo "== 3/7 Cloud SQL (puede tardar ~10 min la primera vez)"
if ! g sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1; then
  g sql instances create "$SQL_INSTANCE" --database-version=MYSQL_8_4 --edition=enterprise \
    --tier="$SQL_TIER" --region="$REGION" --storage-size=10GB --storage-auto-increase \
    --backup-start-time=08:00 --enable-bin-log --retained-backups-count=7 \
    --database-flags=character_set_server=utf8mb4 >/dev/null
fi
g sql databases describe "$DB_NAME" --instance "$SQL_INSTANCE" >/dev/null 2>&1 || \
  g sql databases create "$DB_NAME" --instance "$SQL_INSTANCE" --charset=utf8mb4 --collation=utf8mb4_unicode_ci >/dev/null
CONN="$(g sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"

echo "== 4/7 Secretos"
if ! secret_exists sdg-database-url; then
  DB_PASS="$(openssl rand -hex 24)"
  g sql users create "$DB_USER" --instance "$SQL_INSTANCE" --password "$DB_PASS" --host=% >/dev/null 2>&1 || \
    g sql users set-password "$DB_USER" --instance "$SQL_INSTANCE" --password "$DB_PASS" --host=% >/dev/null
  put_secret_once sdg-database-url "mysql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?socketPath=/cloudsql/${CONN}"
fi
put_secret_once sdg-jwt-secret "$(openssl rand -hex 32)"
put_secret_once sdg-admin-password "$(openssl rand -hex 20)"

echo "== 5/7 Esquema"
if [[ "${SKIP_SCHEMA:-false}" != "true" ]]; then
  BUCKET="$SRC_BUCKET"
  SQL_SA="$(g sql instances describe "$SQL_INSTANCE" --format='value(serviceAccountEmailAddress)')"
  gcloud storage buckets add-iam-policy-binding "$BUCKET" --member "serviceAccount:${SQL_SA}" --role roles/storage.objectViewer >/dev/null
  # 001_schema.sql usa CREATE TABLE IF NOT EXISTS: es seguro reimportarlo.
  gcloud storage cp "$APP_DIR/docker/mysql/init/001_schema.sql" "$BUCKET/schema/001_schema.sql" --project "$PROJECT_ID" >/dev/null
  g sql import sql "$SQL_INSTANCE" "$BUCKET/schema/001_schema.sql" --database "$DB_NAME" >/dev/null
fi

echo "== 6/7 Imagen (Cloud Build)"
cat > /tmp/cloudbuild-sdg.yaml <<EOF
steps:
- name: gcr.io/cloud-builders/docker
  args: ["build","-t","${IMAGE}",
         "--build-arg","VITE_SELF_HOSTED_MODE=true",
         "--build-arg","VITE_PRIVACY_NOTICE_URL=${VITE_PRIVACY_NOTICE_URL:-}",
         "--build-arg","VITE_LEGAL_ENTITY_NAME=${VITE_LEGAL_ENTITY_NAME:-}","."]
images: ["${IMAGE}"]
options:
  logging: CLOUD_LOGGING_ONLY
EOF
# Siempre con cuenta propia: sin --service-account correría con la cuenta por defecto.
g builds submit "$APP_DIR" --config /tmp/cloudbuild-sdg.yaml --region "$REGION" \
  --service-account "projects/${PROJECT_ID}/serviceAccounts/${BUILD_SA}" \
  --gcs-source-staging-dir "${SRC_BUCKET}/source"

echo "== 7/7 Cloud Run"
PROJECT_NUMBER="$(g projects describe "$PROJECT_ID" --format='value(projectNumber)')"
for s in sdg-database-url sdg-jwt-secret sdg-admin-password; do
  g secrets add-iam-policy-binding "$s" --member "serviceAccount:${RUN_SA}" --role roles/secretmanager.secretAccessor >/dev/null
done

if [[ "$ACCESS" == "iap" && -z "${IAP_MEMBERS:-}" ]]; then
  echo "Define IAP_MEMBERS (p. ej. domain:empresa.com) para que alguien pueda entrar." >&2
  exit 1
fi
ACCESS_FLAGS=(--no-allow-unauthenticated)
if [[ "$ACCESS" == "iap" ]]; then ACCESS_FLAGS+=(--iap); else ACCESS_FLAGS=(--allow-unauthenticated); fi

g run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --service-account "$RUN_SA" \
  --add-cloudsql-instances "$CONN" \
  --set-secrets "DATABASE_URL=sdg-database-url:latest,JWT_SECRET=sdg-jwt-secret:latest,LOCAL_ADMIN_PASSWORD=sdg-admin-password:latest" \
  --set-env-vars "SELF_HOSTED_MODE=true,LOCAL_ADMIN_USERNAME=admin,LOCAL_ADMIN_NAME=Administrador SDG,TRUST_PROXY=1,COOKIE_SECURE=true,ADMIN_SESSION_HOURS=8,PRIVACY_NOTICE_VERSION=${PRIVACY_NOTICE_VERSION:-}" \
  --port 3000 --cpu 1 --memory 512Mi --min-instances 0 --max-instances 2 --concurrency 80 \
  "${ACCESS_FLAGS[@]}" >/dev/null

if [[ "$ACCESS" == "iap" && -n "${IAP_MEMBERS:-}" ]]; then
  # El agente de servicio de IAP debe poder invocar el servicio.
  g run services add-iam-policy-binding "$SERVICE" --region "$REGION" \
    --member "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com" --role roles/run.invoker >/dev/null
  IFS=',' read -ra members <<< "$IAP_MEMBERS"
  for m in "${members[@]}"; do
    g iap web add-iam-policy-binding --resource-type=cloud-run --service "$SERVICE" --region "$REGION" \
      --member "$m" --role roles/iap.httpsResourceAccessor >/dev/null
  done
fi

URL="$(g run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo
echo "Publicado: $URL"
echo "Panel:     $URL/admin  (usuario: admin; contraseña: secreto sdg-admin-password en Secret Manager)"
