# SDG Group | Autodiagnóstico de Gobierno de Datos — Self-hosted (v1.2.0)

La aplicación web corre en un contenedor Node.js (usuario sin privilegios, sistema de archivos de solo lectura) y guarda prospectos y respuestas en un contenedor MySQL 8.4 persistente que no se publica fuera de la red de Docker. No depende de Manus OAuth, Manus Storage ni Google Fonts.

> `install.sh` es el instalador: despliega los servicios con Docker Compose. No es un ejecutable de escritorio.

## Requisitos

- Linux x86_64 o arm64 con Docker Engine 24+ y el plugin Docker Compose v2.
- 2 GB de RAM y 10 GB de disco libres (recomendado).
- `openssl` en el host (respaldos cifrados).
- Para uso productivo: dominio y un proxy inverso HTTPS en el mismo host (ejemplo en `deploy/Caddyfile.example`).

## Instalación

```bash
cd sdg-data-governance-lead-magnet
./install.sh
```

El instalador comprueba Docker, genera `.env` con secretos aleatorios (permisos 600) y `.admin-credentials`, construye la imagen, inicializa MySQL y levanta los servicios. La app queda en `http://127.0.0.1:3000` **solo en el propio servidor**; se publica a Internet a través del proxy HTTPS.

Antes de abrir al público, completa en `.env` los datos del Aviso de Privacidad aprobado por Legal y reconstruye:

```bash
# .env
PRIVACY_NOTICE_VERSION=AP-2026-11          # identificador de la versión aprobada
VITE_PRIVACY_NOTICE_URL=https://…/aviso    # URL pública del aviso
VITE_LEGAL_ENTITY_NAME="Razón social responsable"
COOKIE_SECURE=true                          # en cuanto haya HTTPS

docker compose up -d --build
```

Sin esos valores el formulario muestra un marcador visible `[RESPONSABLE PENDIENTE DE APROBACIÓN LEGAL]` y el servidor lo advierte en el log de arranque.

## Configuración (`.env`)

| Variable | Propósito |
|---|---|
| `APP_BIND` / `APP_PORT` | Dirección y puerto publicados en el host. Por defecto `127.0.0.1:3000`. |
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | Base de datos (las contraseñas no deben cambiarse sin rotarlas también en MySQL). |
| `LOCAL_ADMIN_USERNAME`, `LOCAL_ADMIN_PASSWORD`, `LOCAL_ADMIN_NAME` | Acceso a `/admin`. La contraseña debe tener ≥16 caracteres. **Cambiarla cierra todas las sesiones abiertas.** |
| `JWT_SECRET` | Firma de sesiones (≥32 caracteres). La app no arranca con valores cortos o marcadores. |
| `ADMIN_SESSION_HOURS` | Duración de la sesión del panel (por defecto 8). |
| `TRUST_PROXY` | En quién confiar para `X-Forwarded-For/Proto`. Con Compose y proxy en el host usa `loopback,uniquelocal` (valor del instalador): el tráfico del proxy llega al contenedor desde la puerta de enlace del bridge (172.x), no desde loopback. Si se deja `loopback`, todas las visitas parecerían venir de la misma IP y compartirían el límite de envíos. Fuera de Docker: `loopback`. También acepta saltos o IP/CIDR. |
| `COOKIE_SECURE` | `true` con HTTPS: cookie `Secure` y cabecera HSTS. |
| `SUBMIT_RATE_LIMIT_PER_HOUR`, `LOGIN_RATE_LIMIT_PER_15MIN` | Límite por IP de envíos del formulario y de intentos fallidos de login. El contador vive en memoria: se reinicia con el contenedor y no se comparte entre réplicas. |
| `PRIVACY_NOTICE_VERSION`, `VITE_PRIVACY_NOTICE_URL`, `VITE_LEGAL_ENTITY_NAME` | Aviso de Privacidad (ver arriba). Las `VITE_*` se incorporan en el build. |

## Operación

```bash
docker compose ps                     # estado (incluye healthcheck de la app)
docker compose logs -f app            # logs; incluyen la bitácora "audit" (ids, nunca datos personales)
curl -fsS http://127.0.0.1:3000/healthz   # proceso vivo
curl -fsS http://127.0.0.1:3000/readyz    # app + base de datos
docker compose up -d --build          # aplicar cambios
```

Los logs de Docker rotan (5 × 10 MB por servicio).

### Panel `/admin`

Login local con las credenciales de `.env`; sesión en cookie HttpOnly, SameSite=Lax, 8 h. Tras 10 intentos fallidos por IP en 15 minutos se bloquea temporalmente. El panel permite consultar, cambiar el estado y **eliminar definitivamente** un registro (para solicitudes de cancelación/eliminación); la eliminación queda en la bitácora `audit`. Restringe además `/admin` por IP/VPN en el proxy (ver el Caddyfile de ejemplo).

## Respaldos y restauración

```bash
./backup.sh                                          # backups/sdg-<db>-<fecha>.sql.gz.enc
./restore.sh backups/sdg-sdg_lead_magnet-AAAAMMDD-HHMMSS.sql.gz.enc
```

- El respaldo es consistente (`--single-transaction`), comprimido y cifrado (AES-256, PBKDF2). La primera ejecución crea `.backup-passphrase`: **guárdala en la bóveda corporativa**; sin ella no se puede restaurar.
- Borra respaldos locales con más de `BACKUP_RETENTION_DAYS` días (30 por defecto). Copia los respaldos fuera del servidor.
- Programa el respaldo con cron, por ejemplo diario a las 02:15: `15 2 * * * cd /opt/sdg/sdg-data-governance-lead-magnet && ./backup.sh >> backups/backup.log 2>&1`.
- `restore.sh` sobrescribe la base y pide escribir `RESTAURAR`. Ensaya la restauración en staging y guarda la evidencia.
- Los datos borrados desde el panel siguen existiendo en respaldos anteriores hasta que caduquen por retención; documenta ese plazo en el Aviso de Privacidad.

## Actualizar desde v1.1.0

1. `./backup.sh` (con la versión nueva del script; la de v1.1.0 no pasaba la contraseña al contenedor).
2. Sustituye los archivos conservando `.env` y el volumen. Añade a `.env` las variables nuevas de `config.env.template`.
3. Aplica la migración de esquema (las tablas iniciales solo se crean con un volumen vacío):

   ```bash
   sed 's/--> statement-breakpoint//' drizzle/0003_privacy_version_and_fk.sql | \
     docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"'
   ```

4. `docker compose up -d --build` y comprueba `/readyz`, el formulario y `/admin`.

Reversa: vuelve a la imagen/archivos anteriores. La migración 0003 es compatible hacia atrás (agrega una columna opcional y una llave foránea), así que v1.1.0 funciona sobre el esquema nuevo.

## Arquitectura

| Componente | Implementación |
|---|---|
| Interfaz y formulario | React 19 + TypeScript + Vite (sin runtime de vista previa de Manus en el build self-hosted) |
| Servidor | Node.js 22 + Express 4 + tRPC 11, Helmet (CSP estricta), límites de tasa |
| Persistencia | MySQL 8.4 + Drizzle ORM; inserción transaccional; FK con borrado en cascada |
| Autenticación del panel | Sesión local firmada (HS256), ligada a la contraseña vigente |
| Orquestación | Docker Compose; contenedor de app no-root, read-only, sin capabilities |

## Alcance y límites

No incluye correo automático, CRM, analítica, proxy HTTPS ni monitoreo externo; el panel es el canal de seguimiento. Los límites de tasa y la sesión están pensados para una sola instancia: para varias réplicas, mover el contador de límites a un almacén compartido (Redis).

## Verificación de esta versión

Ver `../docs/09_AUDITORIA_Y_REMEDIACION_v1.2.0.md`, sección “Evidencia”.
