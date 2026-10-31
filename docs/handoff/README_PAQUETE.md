# SDG Group · Autodiagnóstico de Gobierno de Datos
## Paquete de transferencia y lanzamiento: MVP → primera versión de producción

**Fecha de corte:** 31 de octubre de 2026 · **Handoff:** v1.2.0 (auditoría y endurecimiento sobre v1.1.0).
**Estado:** técnicamente listo para staging. La imagen Docker construye, arranca y pasa el *smoke test*; validación de servidor, límites anti-abuso, cabeceras de seguridad, sesiones, respaldos cifrados y borrado de registros están implementados y probados. **No abrir al público** hasta cerrar las puertas no técnicas: Aviso de Privacidad aprobado, dueño/SLA de leads, dominio con HTTPS y prueba en el servidor destino con las imágenes oficiales.

## Empieza aquí

| Si eres… | Lee |
|---|---|
| Responsable técnico / DevOps | `docs/09_AUDITORIA_Y_REMEDIACION_v1.2.0.md` → `docs/10_RUNBOOK_PRODUCCION.md` → `sdg-data-governance-lead-magnet/README_SELF_HOSTING.md` |
| Producto / negocio | `docs/01_PRODUCTO_Y_MODELO.md` → sección 0 del runbook (decisiones pendientes) |
| Legal / privacidad | Sección 2.3 de la auditoría y sección 0 del runbook |
| QA | `docs/04_PRUEBAS_Y_ACEPTACION.md` |

## Qué cambió en v1.2.0

- **Bloqueante corregido:** la imagen de v1.1.0 construía pero no arrancaba (`dist/index.js` importaba `vite`, que no existe en la etapa runtime).
- **Seguridad:** validación estricta en servidor contra el catálogo de 46 preguntas y puntaje recalculado en servidor; límites por IP en envíos y login; batching deshabilitado; cuerpo máximo 256 KB; errores sin SQL ni datos personales; CSP y cabeceras con Helmet; sesión admin de 8 h, SameSite=Lax, invalidada al rotar la contraseña; runtime de vista previa Manus fuera del build self-hosted.
- **Datos:** inserción transaccional; versión del Aviso de Privacidad guardada con cada consentimiento; borrado de registros desde el panel con FK en cascada; lista del panel con campos mínimos; bitácora de acciones sin datos personales.
- **Operación:** contenedor no-root, read-only, con healthcheck; `/healthz` y `/readyz`; app publicada solo en `127.0.0.1` detrás de proxy HTTPS (`deploy/Caddyfile.example`); `backup.sh` corregido (no funcionaba) con cifrado y retención; `restore.sh`; migración `0003`; CI con build Docker y *smoke test*.
- **Dependencias:** de 97 avisos en producción (2 críticos) a 0; 45 dependencias y ~66 archivos de plantilla sin uso retirados.
- **Pruebas:** 34 (antes 11), más sondas dinámicas y recorrido en navegador documentados en la auditoría.

Detalle completo en `CHANGELOG.md` y `docs/09_AUDITORIA_Y_REMEDIACION_v1.2.0.md`.

## Instalación self-hosted rápida

Requisitos: Linux con Docker Engine 24+ y Compose v2, `openssl`, acceso a Docker Hub y al registro npm, 2 GB de RAM.

```bash
unzip SDG_Autodiagnostico_Gobierno_Datos_v1.2.0.zip
cd SDG_Autodiagnostico_Gobierno_Datos_v1.2.0/sdg-data-governance-lead-magnet
./install.sh
curl -fsS http://127.0.0.1:3000/readyz
```

El instalador genera `.env` (secretos aleatorios, permisos 600) y `.admin-credentials`. Muévelas a la bóveda corporativa y nunca las subas a Git. Para publicar: proxy HTTPS, `COOKIE_SECURE=true` y las tres variables del Aviso de Privacidad (ver `README_SELF_HOSTING.md`).

Desarrollo: Node.js 22, `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm dev`. Verificación: `pnpm check && pnpm test && pnpm build`.

## Mapa de contenidos

- `sdg-data-governance-lead-magnet/`: código (cliente React, servidor Express/tRPC, `shared/` con el catálogo de preguntas, `drizzle/` esquema y migraciones), Docker, scripts de operación, CI (`.github/workflows/ci.yml`) y proxy de referencia (`deploy/`).
- `docs/01`–`08`: producto, arquitectura, plan MVP→producción, pruebas, comunicación interna, materiales previos, distribución/PI, decisiones y supuestos.
- `docs/09_AUDITORIA_Y_REMEDIACION_v1.2.0.md`: hallazgos P0/P1/P2, estado y evidencia.
- `docs/10_RUNBOOK_PRODUCCION.md`: decisiones previas, staging, producción, operación, actualización/reversa e incidentes.
- `prompts/`: prompts reutilizables. `reference/`: Excel fuente y autodiagnóstico v2 (interno; revisar hojas ocultas antes de cualquier distribución).

## Decisiones funcionales del producto (sin cambios)

Tres momentos: perfil/contactos, 46 preguntas en 11 dominios (escala 0–5 + N/A) y revisión/envío con lectura agregada. Es un **autodiagnóstico comercial**, no una auditoría, certificación ni evaluación de cumplimiento; no revela ponderaciones ni el playbook de remediación. El envío almacena; **no envía correo ni sincroniza con CRM**: el seguimiento es manual desde `/admin`.

## Puertas pendientes antes de producción

1. Aviso de Privacidad aprobado por Legal y configurado (`PRIVACY_NOTICE_VERSION`, `VITE_PRIVACY_NOTICE_URL`, `VITE_LEGAL_ENTITY_NAME`); decisión sobre datos de interlocutores y consentimiento separado para contacto comercial.
2. Retención, procedimiento ARCO y dueño/SLA de leads.
3. Staging con imágenes oficiales: `install.sh`, recorrido, `backup.sh` → `restore.sh`, CI en verde.
4. Dominio, TLS, restricción de `/admin` por IP/VPN, monitor externo de `/readyz`, respaldos fuera del servidor.
5. Firma del responsable de negocio tras el piloto.
