# Changelog

## 1.3.0 — 2026-10-31 · Portal de administración

### Prospectos
- Búsqueda (empresa, contacto, correo, razón social; comodines escapados), filtros por estatus, sector, urgencia, responsable (incl. "Sin asignar"), seguimiento (vencido / hoy / 7 días) y rango de fechas (hora de Ciudad de México); orden y paginación de 25 en servidor.
- Seguimiento comercial: responsable, siguiente paso con fecha y hora, último contacto. Historial de actividad: notas, llamadas, correos y reuniones, más registros automáticos de cambio de estatus y de asignación, con autor.
- Exportación CSV de la lista filtrada: confirmación previa, UTF-8 con BOM, fechas en hora de México, protección contra fórmulas, promedio por dominio, sin datos de interlocutores, tope de 5,000 filas y registro en bitácora.

### Tablero
- Prospectos, promedio general, nuevos sin asignar, siguientes pasos vencidos y mediana de horas al primer contacto; registros por semana (12 semanas), embudo por estatus, urgencia, madurez promedio por dominio y tabla por sector. Solo agregados.

### Plataforma
- Migraciones automáticas al arrancar (`server/_core/migrate.ts`): idempotentes, con candado en MySQL y reconocimiento de bases v1.1/v1.2 sin bitácora. `deploy.sh` ya no importa el esquema. `MIGRATE_ON_START=false` las desactiva.
- Migración `0004_admin_followup.sql` (aditiva): columnas de seguimiento y tabla `lead_activities` con FK en cascada.
- Conexiones MySQL forzadas a UTC: corrige horas desfasadas cuando el servidor de base de datos no está en UTC.
- Imagen: `drizzle/*.sql` legibles por el usuario `node`, ya que los archivos venían con permisos 600.
- En Cloud Run (`TRUST_IAP_HEADERS=true`), las acciones del panel se atribuyen a la cuenta Google que pasó por IAP.
- `bootstrap-owner.sh` habilita Cloud Resource Manager API.
- CI: pruebas de integración contra MySQL 8.4 (`TEST_DATABASE_URL`).

### Pruebas
- 51 pruebas, 6 de ellas de integración contra MySQL real. Recorridos en navegador del formulario público y del panel (escritorio y móvil) sin errores de consola.

## 1.2.0 — 2026-10-31 · Auditoría y endurecimiento para producción

### Corregido (bloqueantes)
- La imagen Docker no arrancaba: el bundle del servidor importaba `vite` (devDependency). Vite se carga dinámicamente solo en desarrollo (`server/_core/vite.ts`); el servido estático vive en `server/_core/static.ts`.
- `backup.sh` no pasaba la contraseña al contenedor (`MYSQL_PWD` del host no se reenvía con `docker compose exec`).
- Los errores internos devolvían al navegador la sentencia SQL con datos personales.

### Seguridad
- Validación de servidor (`server/submission.ts`): 46 respuestas exactas del catálogo, dominio correcto, sin duplicados, coherencia N/A/puntaje, prioridad en lista cerrada, URL solo http(s), longitudes alineadas con la BD. `overallScore` se recalcula en servidor y se ignora el del cliente.
- Límite por IP: 10 envíos/hora y 10 logins fallidos/15 min (configurables). Batching tRPC deshabilitado. Cuerpo JSON máximo 256 KB.
- Helmet: CSP estricta, `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS con `COOKIE_SECURE=true`; sin `X-Powered-By`.
- Sesión admin: 8 h (`ADMIN_SESSION_HOURS`), `SameSite=Lax`, `Secure` por `trust proxy`, ligada a la contraseña vigente, solo cookie en self-hosted, comparación en tiempo constante.
- Arranque bloqueado con secretos débiles o marcadores (`validateProductionEnv`).
- Build self-hosted sin runtime de vista previa Manus, `jsx-loc` ni `debug-collector.js`.

### Datos y privacidad
- Inserción y borrado transaccionales; FK `assessment_responses → prospect_submissions ON DELETE CASCADE`.
- `privacyNoticeVersion` guardado con cada envío; texto de consentimiento y enlaces parametrizados (`VITE_PRIVACY_NOTICE_URL`, `VITE_LEGAL_ENTITY_NAME`).
- Panel: “Eliminar registro” con confirmación; lista con campos mínimos; corrección del puntaje 0 mostrado como “—”.
- Bitácora `audit` (login, ver, cambiar estado, eliminar, envío) con ids, sin datos personales.
- Migración `drizzle/0003_privacy_version_and_fk.sql` (compatible hacia atrás) y `docker/mysql/init/001_schema.sql` actualizado.

### Operación
- Dockerfile: usuario `node`, `HEALTHCHECK`, permisos de `dist`, sin `__manus__`. Compose: publicación en `127.0.0.1`, `read_only`, `cap_drop: ALL`, `no-new-privileges`, rotación de logs, healthcheck de MySQL sin contraseña en línea de comandos.
- `/healthz` y `/readyz`; cierre ordenado con SIGTERM; puerto fijo en producción.
- `backup.sh` consistente, comprimido, cifrado (AES-256-PBKDF2), verificado y con retención; `restore.sh` nuevo.
- `.dockerignore`/`.gitignore` excluyen credenciales y respaldos.
- `deploy/Caddyfile.example` (HTTPS + restricción de `/admin`), `.github/workflows/ci.yml`.
- `deploy/cloudrun/`: despliegue en Google Cloud Run + Cloud SQL con IAP y Secret Manager.

### Dependencias y limpieza
- Express 4.22, tRPC 11.22, Drizzle ORM 0.45.4, mysql2 3.24, zod 4.6, axios 1.21, Vite 7.3, Vitest 5, pnpm 10.34.9. `pnpm audit --prod`: 0.
- Retiradas 45 dependencias y el código de plantilla sin uso (LLM, imágenes, voz, mapas, S3, 49 componentes UI, *ComponentShowcase*). Añadidas `helmet` y `express-rate-limit`.
- Catálogo de preguntas movido a `shared/assessment.ts`.
- Accesibilidad: se permite el zoom en móvil.

### Pruebas
- 34 pruebas en 7 archivos (antes 11 en 4); se incluyen las de `client/src/lib` que antes no se ejecutaban.

## 1.1.0 — 2026-10-31
- Handoff inicial: MVP funcional, variante self-hosted, documentación y prompts. Dockerfile con `patches/` en ambas etapas (build real no validado en ese corte).
