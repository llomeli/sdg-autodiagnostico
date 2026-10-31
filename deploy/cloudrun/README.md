# Publicar en Google Cloud Run (vista previa interna)

Sigue el modelo de despliegue del equipo: el agente nunca usa la sesión Owner del dueño; usa la cuenta `agent-deployer` (sin llaves) con un token de 1 hora.

## 1. Una sola vez — el dueño, en Cloud Shell

```bash
FOLDER_ID=<carpeta> BILLING_ACCOUNT=<cuenta-facturación> \
PROJECT_ID=sdg-autodiagnostico OWNER=user:llomeli@metricaas.com \
./deploy/cloudrun/bootstrap-owner.sh
```

Crea el proyecto en la carpeta indicada, habilita APIs y crea `agent-deployer`, `sdg-build` (builds) y `sdg-run` (identidad del servicio; nunca la cuenta por defecto de Compute), más el bucket de código en México con borrado a 7 días.

## 2. Cada despliegue — con aprobación del dueño

El dueño genera el token y se lo pasa al agente:

```bash
gcloud auth print-access-token --impersonate-service-account=agent-deployer@sdg-autodiagnostico.iam.gserviceaccount.com
```

El agente:

```bash
export CLOUDSDK_AUTH_ACCESS_TOKEN=<token>
PROJECT_ID=sdg-autodiagnostico IAP_MEMBERS="domain:metricaas.com" ./deploy/cloudrun/deploy.sh
```

Crea o actualiza en `northamerica-south1`: Artifact Registry, Cloud SQL MySQL 8.4 (`db-f1-micro`, respaldos diarios, 7 retenidos), secretos en Secret Manager, esquema inicial, imagen con Cloud Build (cuenta `sdg-build`) y Cloud Run (`sdg-run`, `min-instances 0`, `max-instances 2`) detrás de **IAP**: solo entran las cuentas de `IAP_MEMBERS` (`domain:…`, `user:…`, `group:…`).

La primera ejecución tarda 15–20 min (Cloud SQL); si el token de 1 h vence a medio camino, se pide otro y se vuelve a ejecutar (es idempotente).

## Notas

- Contraseña del panel: `gcloud secrets versions access latest --secret sdg-admin-password` (la lee el dueño; el agente no la imprime).
- `ACCESS=public` publica sin control de acceso: **no usar** mientras el Aviso de Privacidad no esté aprobado.
- Con el aviso aprobado: añadir `PRIVACY_NOTICE_VERSION=… VITE_PRIVACY_NOTICE_URL=… VITE_LEGAL_ENTITY_NAME="…"` y volver a ejecutar.
- `TRUST_PROXY=1`, `COOKIE_SECURE=true` y `TRUST_IAP_HEADERS=true` ya van configurados: la bitácora y el historial del panel registran la cuenta Google de quien actúa.
- El esquema de la base se actualiza solo al arrancar la nueva revisión (migraciones automáticas).
- Borrar todo: `gcloud run services delete sdg-autodiagnostico --region northamerica-south1` y `gcloud sql instances delete sdg-autodiagnostico-db` (borra los datos).
