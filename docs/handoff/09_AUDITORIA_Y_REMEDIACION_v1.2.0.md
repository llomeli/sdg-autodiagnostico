# Auditoría de código, prácticas y seguridad — v1.1.0 → v1.2.0

**Fecha:** 31 de octubre de 2026 · **Alcance:** paquete `SDG_Autodiagnostico_Gobierno_Datos_MVP_a_Produccion_v1.1.0.zip` (SHA-256 `b14eedd0…92d2`, coincide con el manifiesto entregado) · **Resultado:** v1.2.0 con remediaciones técnicas aplicadas y verificadas.

> Esta auditoría es una revisión técnica de código y configuración, con pruebas dinámicas en un entorno desechable con datos sintéticos. **No es** una certificación de seguridad, una prueba de penetración formal ni una opinión legal sobre la LFPDPPP. Las decisiones legales y de negocio siguen abiertas (sección 5).

## 1. Resumen ejecutivo

El MVP es funcional y el flujo del prospecto está bien resuelto, pero **la v1.1.0 no podía salir a producción por razones técnicas además de las legales ya conocidas**:

1. **La imagen Docker construía pero no arrancaba.** El bundle del servidor importaba `vite` (dependencia de desarrollo) y la etapa runtime solo instala dependencias de producción → `ERR_MODULE_NOT_FOUND` en bucle de reinicio. La puerta “build Docker” del handoff anterior no habría detectado esto: el build pasa, el arranque falla.
2. **Superficie pública sin controles:** sin límite de tasa, con batching de 25 envíos en una sola petición, cuerpo de hasta 50 MB, puntaje global aceptado tal como lo envía el navegador y respuestas sin validar contra el catálogo.
3. **Fuga de datos en errores:** un fallo de inserción devolvía al navegador la sentencia SQL completa con sus parámetros (correo, nombre, empresa).
4. **Runtime de edición de Manus incluido en producción:** ~360 KB de script en línea que acepta comandos `postMessage` de cualquier origen (escribir cookies, activar modo edición del DOM), sin `X-Frame-Options` ni CSP.
5. **Dependencias:** 97 avisos en dependencias de producción (2 críticos, 26 altos).
6. **El respaldo no funcionaba:** `backup.sh` ponía la contraseña en el entorno del host, que `docker compose exec` no reenvía al contenedor.

Todo lo anterior está corregido en v1.2.0 y verificado con pruebas automáticas y dinámicas (sección 4). Quedan como bloqueantes **no técnicos**: Aviso de Privacidad aprobado, dueño/SLA del lead, dominio+TLS reales y la prueba en el servidor destino con la imagen oficial `node:22-bookworm-slim` / `mysql:8.4`.

## 2. Hallazgos y estado

Prioridad: **P0** bloquea producción · **P1** antes de tráfico real o campaña · **P2** mejora. Estado: ✅ corregido en v1.2.0 · 🟡 mitigado / requiere acción de configuración · ⬜ pendiente (decisión de negocio/legal/infra).

### 2.1 Seguridad de aplicación

| # | P | Hallazgo (evidencia) | Impacto | Remediación v1.2.0 | Estado |
|---|---|---|---|---|---|
| A1 | P0 | El contenedor no arranca: `server/_core/index.ts` → `vite.ts` importaba `vite` y `vite.config.ts` de forma estática; `dist/index.js` falla con `Cannot find package 'vite'` (reproducido con `docker run`). | Servicio caído; restart loop. | `vite` y su config se cargan dinámicamente solo en desarrollo; `serveStatic` separado en `static.ts`. Verificado: contenedor `healthy`. | ✅ |
| A2 | P0 | Errores internos devuelven SQL + parámetros: un `domain` de 300 caracteres produjo HTTP 500 con `Failed query: insert into … params: …`. | Exposición de datos personales y del esquema. | `errorFormatter` de tRPC enmascara `INTERNAL_SERVER_ERROR`; `onError` registra solo código de error (`ER_DATA_TOO_LONG`), nunca el mensaje. Prueba `hardening.test.ts`. | ✅ |
| A3 | P0 | Sin límite de tasa ni anti-abuso: 40 envíos en 0.3 s aceptados; 25 envíos en **una** petición (batch); 50 intentos de login sin bloqueo. | Spam masivo del CRM manual, llenado de BD, fuerza bruta. | `express-rate-limit` por IP: 10 envíos/h, 10 logins fallidos/15 min (configurables). Batching deshabilitado en servidor (`allowBatching:false`) y cliente (`httpLink`). Verificado: 429 a partir del 11.º. | ✅ |
| A4 | P1 | Validación de servidor débil: acepta `overallScore=500` con todas las respuestas en 0, N/A con puntaje, `questionId` inventados/duplicados, 11–70 respuestas, `website: javascript:…`. | Datos comerciales falsificables; XSS latente al exportar a CRM. | `server/submission.ts`: exactamente 46 respuestas del catálogo compartido (`shared/assessment.ts`), dominio correcto, sin duplicados, coherencia N/A↔puntaje, prioridad en enum, URL solo http(s), longitudes = columnas BD. **El puntaje se recalcula en servidor.** 11 pruebas nuevas. | ✅ |
| A5 | P1 | Inserción no atómica de prospecto + respuestas (`db.ts`). Reproducido: 2 prospectos quedaron sin respuestas tras un error. | Registros huérfanos/incompletos. | `db.transaction` para insertar y borrar. Verificado: el error ya no deja filas. | ✅ |
| A6 | P1 | Sesión admin de 1 año, no revocable: cambiar la contraseña no invalida sesiones; `SameSite=None` sin `Secure` en HTTP (el navegador descarta la cookie: login “silenciosamente” roto sin TLS); token aceptado también por cabecera `Bearer` en self-hosted. | Sesión robada válida un año. | Sesión de 8 h (`ADMIN_SESSION_HOURS`), ligada a una huella de la contraseña vigente (rotarla cierra todas las sesiones), `SameSite=Lax`, `Secure` vía `trust proxy`/`COOKIE_SECURE`, solo cookie. Comparación de usuario y contraseña en tiempo constante. Pruebas en `hardening.test.ts`. | ✅ |
| A7 | P1 | Sin cabeceras de seguridad: sin CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`; `X-Powered-By: Express`. | Clickjacking del formulario, superficie XSS. | Helmet con CSP estricta (`script-src 'self'`, `frame-ancestors 'none'`), HSTS con `COOKIE_SECURE=true`. Verificado en navegador: 0 errores de consola con la CSP. | ✅ |
| A8 | P1 | Runtime de vista previa Manus en el build de producción (`vite-plugin-manus-runtime`): script en línea que escucha `postMessage` **sin validar origen** (`setCookie`, `enableEditMode`, `edits`) y reenvía errores con datos de usuario a `window.parent` con `"*"`. También se publicaba `/__manus__/debug-collector.js` (captura consola, red y *session replay*). | Manipulación del DOM/cookies si la página se enmarca; fuga de información. | Plugins de Manus y `jsx-loc` excluidos del build self-hosted; `__manus__/` eliminado de la imagen; ganchos de `sessionStorage`/`localStorage` desactivados en self-hosted. `index.html`: 368 KB → 0.6 KB. CI verifica que no vuelva. | ✅ (self-hosted) · 🟡 en modo gestionado Manus sigue presente por diseño |
| A9 | P1 | `express.json({limit:"50mb"})` en endpoint público; un cuerpo de 20 MB se procesó. | DoS de memoria/CPU. | Límite 256 KB (el envío legítimo máximo es < 200 KB). Verificado: 413. | ✅ |
| A10 | P2 | `findAvailablePort` en producción: si el puerto está ocupado, la app escucha en otro en silencio. | Caídas difíciles de diagnosticar. | Solo en desarrollo; en producción falla explícitamente. Cierre ordenado con SIGTERM. | ✅ |
| A11 | P2 | Sin validación de configuración: `JWT_SECRET` débil o marcadores `REPLACE_WITH…` aceptados (un secreto vacío falla al firmar, uno corto sí funciona). | Sesiones falsificables con secretos débiles. | `validateProductionEnv`: la app no arranca con `JWT_SECRET` < 32, contraseña admin < 16 o marcadores. Verificado: exit 1. | ✅ |
| A12 | P2 | `/api/*` desconocido devolvía el HTML de la SPA con 200. | Ruido para monitoreo/escáneres. | 404 JSON. | ✅ |
| A13 | P2 | Panel: lista devolvía todas las columnas de todos los prospectos sin límite; puntaje 0 mostrado como “—”. | Sobreexposición de datos en el navegador del admin. | Lista con 7 campos y tope 1000; detalle bajo demanda; corrección de `0.0`. | ✅ |

### 2.2 Infraestructura y despliegue

| # | P | Hallazgo | Remediación | Estado |
|---|---|---|---|---|
| I1 | P0 | Puerta “build Docker limpio” pendiente desde el handoff. | Ejecutado aquí `docker build --no-cache` del original (pasa) y de v1.2.0 (pasa, arranca, `healthy`). **Limitación:** Docker Hub no es accesible desde este entorno; se usó una imagen base equivalente (Node 22.23 sobre Ubuntu 24.04). Repetir con las imágenes oficiales en CI (workflow incluido). | 🟡 |
| I2 | P1 | Contenedor como `root`, sin healthcheck, escribible, con todas las capabilities. | `USER node`, `HEALTHCHECK` a `/healthz`, Compose con `read_only`, `tmpfs /tmp`, `cap_drop: ALL`, `no-new-privileges`. Imagen 918 MB → 523 MB. | ✅ |
| I3 | P1 | Puerto de la app publicado en `0.0.0.0:3000` (HTTP en claro hacia Internet). | Publicado en `127.0.0.1` por defecto (`APP_BIND`); proxy HTTPS de referencia en `deploy/Caddyfile.example` con restricción de `/admin` por IP. | ✅ · ⬜ TLS/dominio reales |
| I4 | P1 | `.dockerignore`/`.gitignore` no excluían `.admin-credentials` ni `backups/` → `COPY . .` metía credenciales y respaldos con datos personales en la capa de build. | Excluidos en ambos. | ✅ |
| I5 | P2 | Contraseña root de MySQL en la línea de comandos del healthcheck; logs sin rotación. | `MYSQL_PWD` por entorno; rotación 5×10 MB. | ✅ |
| I6 | P2 | Sin CI. | `.github/workflows/ci.yml`: typecheck, tests, build, `pnpm audit --prod --audit-level=high`, verificación de que no hay runtime Manus, build Docker sin caché y *smoke test* con MySQL real. | ✅ (no ejecutado en GitHub desde aquí) |
| I7 | P2 | `trust proxy` sin configurar: detrás de un proxy todas las IP se verían iguales. | `TRUST_PROXY` (instalador: `loopback,uniquelocal`). Verificado en red bridge: cada cliente tiene su propio contador. | ✅ |

### 2.3 Privacidad y datos personales

| # | P | Hallazgo | Remediación / acción | Estado |
|---|---|---|---|---|
| D1 | P0 | Consentimiento con marcadores `[NOMBRE DE TU EMPRESA]`/`[URL]`; el pie enlazaba la *Privacy Policy* global de SDG en inglés. | Texto y enlaces parametrizados (`VITE_LEGAL_ENTITY_NAME`, `VITE_PRIVACY_NOTICE_URL`); si faltan, se ve un marcador evidente y el servidor lo advierte. **Legal debe redactar y aprobar el aviso.** | 🟡 técnico ✅ · ⬜ legal |
| D2 | P1 | No se registraba qué versión del aviso aceptó cada prospecto. | Columna `privacyNoticeVersion` (de `PRIVACY_NOTICE_VERSION`) guardada con cada envío; migración `0003`. | ✅ |
| D3 | P1 | Sin mecanismo de cancelación/eliminación; `assessment_responses` sin FK (borrar dejaría huérfanos). | Botón “Eliminar registro” (confirmación + token `ELIMINAR`), borrado transaccional, FK `ON DELETE CASCADE`, registro en bitácora. **Falta** el procedimiento (quién recibe solicitudes, plazos, respuesta al titular). | ✅ técnico · ⬜ proceso |
| D4 | P1 | El formulario pide nombre, correo y teléfono de hasta 3 **interlocutores** (terceros) que no dieron su consentimiento. | Sin cambio de código. Recomendación: que Legal decida si se conservan; la opción más prudente es eliminar correo/teléfono de terceros y dejar solo puesto/área. | ⬜ |
| D5 | P1 | Sin retención definida; respaldos en claro, sin rotación. | Respaldos cifrados AES-256 con retención local (`BACKUP_RETENTION_DAYS`). **Falta** definir plazo de conservación de prospectos y su purga. | 🟡 |
| D6 | P2 | El consentimiento combina “contacto comercial” y “leí el aviso” en una sola casilla. | Revisar con Legal si la finalidad comercial debe ser consentimiento separado (finalidades secundarias). | ⬜ |
| D7 | P2 | Logs sin datos personales verificados; bitácora `audit` con ids y acciones (login, ver, cambiar estado, eliminar). | — | ✅ |

### 2.4 Operación, respaldo y continuidad

| # | P | Hallazgo | Remediación | Estado |
|---|---|---|---|---|
| O1 | P0 | `backup.sh` (y la guía) ponían `MYSQL_PWD` en el host; `docker compose exec` no lo reenvía → mysqldump sin contraseña → fallo. Sin cifrado ni verificación. | `backup.sh` lee la contraseña dentro del contenedor, usa la cuenta de aplicación (mínimo privilegio), `--single-transaction`, gzip + AES-256-PBKDF2, verifica tamaño, retención. `restore.sh` nuevo con confirmación y conteo de filas. Ciclo cifrar→restaurar verificado (81/3553 filas idénticas). | ✅ · ⬜ ensayo en staging con `docker compose` |
| O2 | P1 | Sin health/readiness. | `/healthz` y `/readyz` (consulta a BD). | ✅ |
| O3 | P1 | Migraciones: el esquema solo se crea con volumen vacío; no había ruta de actualización. | Migración `0003` probada sobre datos v1.1.0 y procedimiento en `README_SELF_HOSTING.md`. | ✅ |
| O4 | P2 | Límite de tasa en memoria: no se comparte entre réplicas ni sobrevive reinicios. | Documentado; suficiente para una instancia. | 🟡 |

### 2.5 Calidad de código y dependencias

| # | P | Hallazgo | Remediación | Estado |
|---|---|---|---|---|
| C1 | P0 | `pnpm audit --prod`: 97 avisos (2 críticos: `proxy-addr`, `fast-xml-parser`; altos: tRPC prototype pollution, Drizzle SQL injection, axios, zod, mysql2, path-to-regexp…). | Actualizaciones dentro de la misma versión mayor (Express 4.22, tRPC 11.22, Drizzle 0.45.4, mysql2 3.24, zod 4.6, axios 1.21) y retirada de dependencias muertas. **Producción: 0 avisos.** Desarrollo: 1 moderado (esbuild 0.18 dentro de drizzle-kit, solo servidor de desarrollo). | ✅ |
| C2 | P2 | Código de plantilla sin uso: 8 módulos de servidor (LLM, imágenes, voz, mapas, S3), 49 componentes UI, 5 componentes y 3 hooks de plantilla, la página *ComponentShowcase* y 45 dependencias (AWS SDK, mermaid, recharts…). | Eliminados (alcance verificado con el grafo de importación de esbuild). | ✅ |
| C3 | P2 | `client/src/lib/assessment.test.ts` nunca se ejecutaba (fuera del `include` de Vitest). | Incluido. Suite: **7 archivos, 34 pruebas** (antes 4/11). | ✅ |
| C4 | P2 | Catálogo de preguntas solo en el cliente. | Movido a `shared/assessment.ts`; cliente y servidor usan la misma fuente. | ✅ |
| C5 | P2 | Accesibilidad: `maximum-scale=1` impedía el zoom en móvil (WCAG 1.4.4). | Eliminado. Auditoría de accesibilidad completa (teclado, contraste, lectores) pendiente. | 🟡 |

## 3. Riesgos aceptados y fuera de alcance

- **Modo gestionado (Manus WebDev):** se conserva sin cambios funcionales (OAuth, runtime de vista previa, `SameSite=None` en iframe). Si se elige como plataforma productiva, evaluar con el proveedor la desactivación del runtime de edición en el dominio público.
- **Anti-bot:** el límite por IP no detiene bots distribuidos. Si aparece spam, añadir un CAPTCHA respetuoso de la privacidad (p. ej. Cloudflare Turnstile) o *honeypot*.
- **CSP:** `style-src 'unsafe-inline'` es necesario por estilos en línea de React y la librería de avisos; el riesgo es bajo con `script-src 'self'`.
- No se evaluó rendimiento bajo carga ni se hizo prueba de penetración externa.

## 4. Evidencia (ejecutada en este entorno, 31-oct-2026)

| Verificación | Resultado |
|---|---|
| Integridad del ZIP vs. manifiesto | SHA-256 coincide |
| `pnpm check` / `pnpm test` / `pnpm build` (v1.1.0) | OK / 11 pruebas / OK |
| `docker build --no-cache` v1.1.0 + `docker run` | Build OK · **arranque falla** (`ERR_MODULE_NOT_FOUND: vite`) |
| Sondas dinámicas v1.1.0 (script de 20 casos) | Hallazgos A2–A9, A12 reproducidos |
| `pnpm check` / `pnpm test` / `pnpm build` (v1.2.0) | OK / **34 pruebas** / OK |
| `docker build --no-cache` v1.2.0 + `docker run --read-only --cap-drop ALL` | OK · usuario `node` · `healthy` · `/readyz` con BD |
| Configuración débil | El contenedor sale con código 1 y mensajes claros |
| Sondas dinámicas v1.2.0 | Puntaje recalculado (0, no 500); N/A+puntaje, ids falsos, `javascript:`, campo largo → 400 sin SQL; batch → 400; 2 MB → 413; 11.º envío → 429; 11.º login fallido → 429; CSP/XFO/nosniff presentes; `X-Powered-By` ausente |
| Panel | Cookie `HttpOnly; SameSite=Lax; Max-Age=28800`; lista con 7 campos; borrar → respuestas eliminadas en cascada; bitácora sin datos personales |
| Navegador (Chromium, 390×844) | Perfil → 46 preguntas → revisión → envío → panel; 0 errores de consola; promedio UI 2.4 = servidor 241 |
| Migración 0003 sobre datos v1.1.0 / esquema inicial nuevo | OK / OK |
| Respaldo cifrado → restauración en BD nueva | Conteos idénticos; el archivo no es legible sin la frase |
| `shellcheck` en `install.sh`, `backup.sh`, `restore.sh` | Sin avisos |
| `pnpm audit --prod` | 0 vulnerabilidades |

**No ejecutado aquí:** imágenes oficiales `node:22-bookworm-slim` y `mysql:8.4` (registro bloqueado), `docker compose up` completo con `backup.sh`/`restore.sh` contra el contenedor de MySQL, TLS real, workflow de GitHub Actions. Son la primera tarea en staging (ver `10_RUNBOOK_PRODUCCION.md`).
