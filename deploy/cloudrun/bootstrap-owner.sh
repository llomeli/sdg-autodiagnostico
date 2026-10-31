#!/usr/bin/env bash
# Preparación única del proyecto GCP. La ejecuta el DUEÑO (Owner) en Cloud Shell.
#
#   FOLDER_ID=123456789012 BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX \
#   PROJECT_ID=sdg-autodiagnostico OWNER=user:llomeli@metricaas.com \
#   ./deploy/cloudrun/bootstrap-owner.sh
#
# Crea el proyecto en la carpeta indicada y tres cuentas de servicio SIN llaves:
#   agent-deployer  la que usa el agente (solo vía token de 1 h por impersonación)
#   sdg-build       con la que corren los builds de Cloud Build
#   sdg-run         identidad del servicio Cloud Run (nunca la cuenta por defecto de Compute)
# Después, para dar acceso al agente durante 1 hora:
#   gcloud auth print-access-token --impersonate-service-account=agent-deployer@${PROJECT_ID}.iam.gserviceaccount.com
set -euo pipefail

: "${PROJECT_ID:?Define PROJECT_ID}"
: "${OWNER:?Define OWNER (p. ej. user:persona@empresa.com)}"
REGION="${REGION:-northamerica-south1}"

if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  : "${FOLDER_ID:?Define FOLDER_ID (carpeta de la organización)}"
  : "${BILLING_ACCOUNT:?Define BILLING_ACCOUNT}"
  gcloud projects create "$PROJECT_ID" --folder "$FOLDER_ID"
  gcloud billing projects link "$PROJECT_ID" --billing-account "$BILLING_ACCOUNT"
fi

g() { gcloud --project "$PROJECT_ID" --quiet "$@"; }

g services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com iap.googleapis.com \
  iamcredentials.googleapis.com logging.googleapis.com storage.googleapis.com \
  cloudresourcemanager.googleapis.com

sa() { echo "$1@${PROJECT_ID}.iam.gserviceaccount.com"; }
for name in agent-deployer sdg-build sdg-run; do
  g iam service-accounts describe "$(sa $name)" >/dev/null 2>&1 || \
    g iam service-accounts create "$name" --display-name "$name"
done

bind() { g projects add-iam-policy-binding "$PROJECT_ID" --member "serviceAccount:$(sa "$1")" --role "$2" --condition=None >/dev/null; }

# agent-deployer: crea y actualiza los recursos de la app, nada de IAM de proyecto.
for role in roles/run.admin roles/cloudsql.admin roles/artifactregistry.admin roles/secretmanager.admin \
  roles/cloudbuild.builds.editor roles/storage.admin roles/iap.admin roles/serviceusage.serviceUsageConsumer \
  roles/logging.viewer roles/browser; do bind agent-deployer "$role"; done

# sdg-build: construir y publicar la imagen, escribir logs.
for role in roles/artifactregistry.writer roles/logging.logWriter roles/storage.objectViewer; do bind sdg-build "$role"; done

# sdg-run: solo conectarse a Cloud SQL (los secretos se conceden uno a uno en deploy.sh).
bind sdg-run roles/cloudsql.client

# agent-deployer puede actuar como sdg-build (builds) y asignar sdg-run al servicio.
for target in sdg-build sdg-run; do
  g iam service-accounts add-iam-policy-binding "$(sa $target)" \
    --member "serviceAccount:$(sa agent-deployer)" --role roles/iam.serviceAccountUser >/dev/null
done

# El dueño puede emitir tokens de 1 h de agent-deployer.
g iam service-accounts add-iam-policy-binding "$(sa agent-deployer)" \
  --member "$OWNER" --role roles/iam.serviceAccountTokenCreator >/dev/null

# Bucket del código fuente de los builds, en México, con borrado a los 7 días.
BUCKET="gs://${PROJECT_ID}-build-src"
gcloud storage buckets describe "$BUCKET" --project "$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud storage buckets create "$BUCKET" --project "$PROJECT_ID" --location "$REGION" --uniform-bucket-level-access
printf '{"rule":[{"action":{"type":"Delete"},"condition":{"age":7}}]}' > /tmp/lifecycle.json
gcloud storage buckets update "$BUCKET" --lifecycle-file=/tmp/lifecycle.json >/dev/null
gcloud storage buckets add-iam-policy-binding "$BUCKET" --member "serviceAccount:$(sa sdg-build)" --role roles/storage.objectViewer >/dev/null

echo
echo "Listo. Token de 1 h para el agente:"
echo "  gcloud auth print-access-token --impersonate-service-account=$(sa agent-deployer)"
