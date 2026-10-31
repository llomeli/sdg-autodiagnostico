# Arquitectura y operación

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, tRPC React y estilos propios inspirados en SDG; tipografía Figtree servida desde archivos locales.
- **Backend:** Node.js 22, Express 4 y tRPC 11 con contratos tipados y validación de entrada Zod.
- **Persistencia:** MySQL 8.4 en la alternativa self-hosted; Drizzle ORM y migraciones. El entorno gestionado WebDev puede usar la base aprovisionada por ese proyecto.
- **Autenticación:** Manus OAuth en el entorno conectado a Manus; en modo self-hosted, login local configurado por variables y sesión firmada. El panel requiere rol `admin`.
- **Empaquetado:** Docker multi-stage y Docker Compose con volumen persistente de MySQL; script `install.sh` y respaldo `backup.sh`.

## Puntos de entrada de código

| Archivo | Qué hace |
|---|---|
| `client/src/pages/Home.tsx` | Landing, perfil, cuestionario, cálculo visual, revisión, submit y confirmación. |
| `client/src/lib/assessment.ts` | Catálogo de 46 preguntas/11 dominios, escala y validadores del primer paso. |
| `client/src/pages/Admin.tsx` | Login/gestión interna de prospectos. |
| `server/routers.ts` | Procedimientos `assessment.submit`, `admin.listSubmissions`, `admin.getSubmission`, `admin.updateStatus` y `auth.localLogin`. |
| `server/db.ts` | Insert/select/update para prospectos y respuestas. |
| `drizzle/schema.ts` | Tablas y tipos Drizzle. |
| `drizzle/*.sql`, `docker/mysql/init/001_schema.sql` | Migraciones y esquema inicial para contenedor nuevo. |
| `server/_core/index.ts`, `context.ts`, `sdk.ts`, `env.ts` | Servidor, contexto, autenticación y configuración. |
| `Dockerfile`, `docker-compose.yml`, `install.sh`, `backup.sh` | Build, servicios, primera instalación y respaldo. |

## Modelo de almacenamiento

- `prospect_submissions`: empresa/sector/tamaño/ubicación/sistemas, contacto, interlocutores serializados, preocupación, impacto, urgencia, consentimiento y timestamp, puntaje general y estado comercial.
- `assessment_responses`: una fila por respuesta con `submissionId`, dominio, `questionId`, puntaje (nullable), N/A, prioridad y texto contextual.
- `users`: identidad administrativa usada por autenticación según el modo de despliegue.

El envío se hace con la mutación pública tRPC `assessment.submit`; el frontend da paso a la confirmación cuando la mutación confirma éxito. El backend valida la forma de los datos, inserta primero el prospecto y después las respuestas. Desde v1.2.0 ambos inserts van en una transacción, el servidor valida las 46 respuestas contra el catálogo compartido (`shared/assessment.ts`, `server/submission.ts`) y recalcula el puntaje.

## Validaciones actualmente implementadas

El perfil requiere empresa, sector, rango de empleados, estado, contacto principal, puesto, correo principal, preocupación con longitud mínima, impacto, urgencia y consentimiento. El sitio web y correos de interlocutores son opcionales, pero si se proporcionan se validan desde el primer paso; errores se muestran inline y bloquean avanzar. El servidor vuelve a validar los datos, incluidos URL y email.

Las 46 respuestas deben quedar puntuadas 0–5 o marcadas N/A antes de revisar. Los controles de envío deshabilitan repeticiones mientras se guarda. La entrada de comentarios tiene límites de longitud en esquema del servidor.

## Seguridad y privacidad: controles y deuda

Ya existen: acceso admin protegido por middleware, cookie HTTP-only firmada, roles, variables de entorno, secretos no incorporados en el paquete, base de datos no publicada por defecto en Compose y botón de logout. No se recopilaron datos reales para este handoff.

Antes de captar usuarios reales, confirmar con Legal el Aviso de Privacidad y el consentimiento; configurar TLS seguro, proxy con límites y cabeceras, política de sesión, rate limit/anti-spam, proceso de derechos/borrado/retención, rotación/almacenamiento de secretos, mínimos privilegios de DB, backups cifrados y monitoreo. Revisar si `overallScore` escala 0–500 y su representación coincide con el propósito del resumen (100× promedio) y fijar pruebas de invariantes.

No hay correo transaccional ni integración de CRM. El texto “alguien del equipo se pondrá en contacto” es promesa de proceso manual; definir un dueño y SLA interno antes de publicarlo.

## Instalación y operaciones

La guía de usuario `sdg-data-governance-lead-magnet/README_SELF_HOSTING.md` documenta instalación, credenciales, compose, acceso admin, logs, backup/restore y actualizaciones. `install.sh` genera `.env` aleatorio en primera instalación, credenciales en `.admin-credentials` (permisos restringidos) y levanta los servicios. Guardar credenciales en bóveda corporativa y retirar/asegurar el archivo después del traspaso.

`backup.sh` realiza dump SQL al directorio de backup; los dumps contienen datos personales. Protegerlos con cifrado y acceso controlado, aplicar retención y probar restauración en ambiente aparte. El volumen Docker no reemplaza un backup.

## Observación de la entrega

El Dockerfile se ajustó para copiar `patches/` antes de instalar dependencias en ambas etapas. Esto responde a un log de despliegue fallido por ausencia de `patches/wouter@3.7.1.patch`. En esta sesión no se cuenta con daemon Docker para demostrar el build final; correr `docker compose build --no-cache` y un smoke test en CI/servidor de destino es **bloqueante** para producción.

## Actualización v1.2.0

Controles añadidos: límites por IP (envío y login), batching deshabilitado, cuerpo ≤256 KB, Helmet/CSP, errores enmascarados, sesión admin de 8 h ligada a la contraseña, `/healthz` y `/readyz`, contenedor no-root/read-only, app en `127.0.0.1` tras proxy HTTPS, respaldos cifrados con `backup.sh`/`restore.sh`, borrado de registros, versión del aviso por consentimiento, CI. La observación anterior sobre el build Docker queda superada: el build pasaba, pero la imagen no arrancaba por importar `vite`; corregido. Ver `09_AUDITORIA_Y_REMEDIACION_v1.2.0.md` y `10_RUNBOOK_PRODUCCION.md`.
