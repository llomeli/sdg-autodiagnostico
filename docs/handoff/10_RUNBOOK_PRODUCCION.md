# Runbook de puesta en producción y operación (v1.2.0, self-hosted)

Orden recomendado. Cada paso tiene un responsable sugerido y una evidencia de salida; no avanzar sin la evidencia.

## 0. Decisiones previas (negocio + Legal)

| Decisión | Responsable | Evidencia |
|---|---|---|
| Responsable del tratamiento (razón social), finalidades y si el contacto comercial es finalidad secundaria con consentimiento separado | Legal | Aviso de Privacidad aprobado con identificador de versión (p. ej. `AP-2026-11`) y URL pública |
| Conservar o no correo/teléfono de **interlocutores** (datos de terceros) | Legal + producto | Decisión escrita; si se eliminan, ticket de cambio en `Home.tsx` + `submission.ts` |
| Plazo de conservación de prospectos y de respaldos | Legal + TI | Política escrita (sugerencia de partida a validar: prospectos no convertidos 24 meses; respaldos 30 días) |
| Procedimiento de derechos ARCO / revocación: canal, plazos, quién ejecuta el borrado en el panel | Legal + Sales Ops | Procedimiento y responsable nombrado |
| Dueño de los leads y SLA de primer contacto | Sales Ops | Nombre + SLA + frecuencia de revisión del panel |
| Plataforma: servidor Docker propio (este runbook) o WebDev gestionado | TI | Decisión registrada |

## 1. Staging

1. Servidor Linux con Docker Engine 24+, Compose v2, `openssl`, acceso a Docker Hub.
2. Copiar el paquete; `cd sdg-data-governance-lead-magnet && ./install.sh`.
3. Verificar:
   ```bash
   docker compose ps                         # app "healthy", db "healthy"
   curl -fsS http://127.0.0.1:3000/readyz    # {"ok":true,"db":true}
   docker compose logs app | grep -i config  # solo el aviso de PRIVACY_NOTICE_VERSION si aún no hay aviso
   ```
4. **Prueba funcional** con datos sintéticos (dominio `example.com`): completar el formulario en un teléfono, ver el registro en `/admin`, cambiar estado, eliminarlo.
5. **Prueba de respaldo**: `./backup.sh` → crear BD de prueba o volumen nuevo → `./restore.sh <archivo>` → comparar conteos. Guardar `.backup-passphrase` en la bóveda.
6. **CI**: subir el repositorio a GitHub (o equivalente) y confirmar el workflow `ci` en verde (incluye build sin caché y *smoke test* con `mysql:8.4`).

Evidencia: capturas/salidas de 3–6 archivadas en el ticket de salida.

## 2. Producción

1. DNS del dominio al servidor; firewall: solo 80/443 (y SSH restringido). El 3000 no debe ser accesible desde fuera (`APP_BIND=127.0.0.1`).
2. Proxy HTTPS: instalar Caddy y adaptar `deploy/Caddyfile.example` (dominio y rangos de IP de oficina/VPN para `/admin`). Alternativa: Nginx/balanceador con TLS 1.2+, límite de cuerpo 512 KB, sin registrar cuerpos de petición.
3. `.env`: `COOKIE_SECURE=true`, `TRUST_PROXY="loopback,uniquelocal"`, `PRIVACY_NOTICE_VERSION`, `VITE_PRIVACY_NOTICE_URL`, `VITE_LEGAL_ENTITY_NAME`. Mover `.admin-credentials` a la bóveda y borrar el archivo del servidor.
4. `docker compose up -d --build`.
5. Verificar desde fuera:
   ```bash
   curl -sI https://DOMINIO/ | grep -Ei 'strict-transport|content-security|x-frame'
   curl -s -o /dev/null -w '%{http_code}\n' https://DOMINIO/api/trpc/admin.listSubmissions   # 401 (o 403 fuera de la VPN)
   ```
   y el recorrido completo en un teléfono hasta “Registro recibido”.
6. Cron de respaldos + copia fuera del servidor; monitor externo de `https://DOMINIO/readyz` cada 5 min con alerta al responsable técnico.
7. `client/index.html` tiene `noindex, nofollow`: retirarlo solo si Marketing quiere el formulario en buscadores (decisión explícita).

## 3. Lanzamiento controlado

Piloto con invitados → revisar a la semana: envíos, abandono, 429 en logs (falsos positivos del límite), tiempo de primer contacto, spam. Decidir ampliación.

## 4. Operación recurrente

| Frecuencia | Tarea |
|---|---|
| Diaria | Revisar el panel (dueño de leads); `readyz` en verde |
| Semanal | `docker compose logs app \| grep audit` para revisar accesos al panel; verificar que existen respaldos recientes fuera del servidor |
| Mensual | `pnpm audit --prod` (o el job de CI); actualizar y redesplegar si hay avisos altos/críticos |
| Trimestral | Ensayo de restauración; rotar `LOCAL_ADMIN_PASSWORD` (cierra todas las sesiones); revisar quién tiene acceso al servidor y a la bóveda |
| Según política | Purgar prospectos fuera de plazo de conservación (hoy manual desde el panel; automatizar si el volumen crece) |

## 5. Actualizar / revertir

Actualizar: `./backup.sh` → reemplazar archivos (conservar `.env`, `.backup-passphrase`, `backups/`) → aplicar migraciones nuevas de `drizzle/` si las hay (ver README_SELF_HOSTING) → `docker compose up -d --build` → verificar `/readyz` y recorrido.

Revertir: conservar el directorio de la versión anterior; `docker compose up -d --build` desde él. Si una migración no es compatible hacia atrás, restaurar el respaldo previo (`./restore.sh`). La migración 0003 sí es compatible con v1.1.0.

## 6. Incidentes

| Situación | Acción inmediata |
|---|---|
| Sospecha de acceso indebido al panel | Cambiar `LOCAL_ADMIN_PASSWORD` y `JWT_SECRET` en `.env` → `docker compose up -d` (invalida todas las sesiones); revisar líneas `audit` (`admin.login`, `admin.viewSubmission`); escalar a Legal por posible vulneración de datos personales |
| Spam masivo | Bajar `SUBMIT_RATE_LIMIT_PER_HOUR`; bloquear rangos en el proxy; evaluar CAPTCHA; marcar/eliminar registros basura |
| `readyz` en rojo | `docker compose ps`, `docker compose logs db`; espacio en disco; restaurar si hay corrupción |
| Pérdida del servidor | Servidor nuevo → `install.sh` con el `.env` de la bóveda → `restore.sh` del último respaldo externo |
| Solicitud de un titular (acceso/rectificación/cancelación/oposición) | Seguir el procedimiento de Legal; para cancelación, “Eliminar registro” en el panel y anotar fecha; los respaldos caducan según retención |
