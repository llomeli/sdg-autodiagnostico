# Ruta de MVP a primera versión de producción

## Estado en una frase

**Actualizado v1.2.0 (31-oct-2026).** Las brechas técnicas de los hitos 2, 3 y 5 están resueltas en código y verificadas (ver `09_AUDITORIA_Y_REMEDIACION_v1.2.0.md`): la imagen Docker arranca, hay validación de servidor, límites anti-abuso, cabeceras, sesiones endurecidas, inserción transaccional, borrado de registros, respaldos cifrados y CI. Siguen abiertas las puertas de Legal, negocio e infraestructura real (dominio/TLS/staging). El procedimiento operativo está en `10_RUNBOOK_PRODUCCION.md`.

## Hito 0 — Congelar alcance y dueño de producto

**Responsables:** sponsor comercial + dueño de producto.  
**Acciones:** aprobar nombre/copy, sectores/tamaños, campos, 46 preguntas, escala, resultado visible, criterio de calificación comercial, canal/SLA de seguimiento y la promesa que se hace al prospecto. Revisar que no se incluya más explicación metodológica de la prevista.  
**Salida:** alcance/copy aprobado, una persona de negocio responsable del canal y playbook de seguimiento básico.

## Hito 1 — Legal, privacidad y datos

**Responsables:** Legal/Privacidad + negocio + TI.  
**Acciones:** reemplazar `[NOMBRE DE TU EMPRESA]` y `[URL]`; verificar responsable, finalidades primarias/secundarias, consentimiento, mecanismo de oposición/revocación, transferencias a CRM, medios ARCO, retención y eliminación; definir minimización de datos y aviso visible antes de submit. Aprobar texto del check de consentimiento y registro de versión del aviso aceptado.
**Puerta de salida:** dictamen/aprobación documentada de Legal para capturar y contactar prospectos en México. No usar el texto marcador actual para tráfico real.

## Hito 2 — Infraestructura y publicación

**Responsables:** TI/DevOps.  
**Acciones:** elegir plataforma (WebDev gestionado con configuración productiva o servidor Docker propio); probar build limpio `docker compose build --no-cache`, porque la última falla registrada fue no encontrar `patches/wouter@3.7.1.patch` y Dockerfile ahora incluye el parche; completar deploy de staging; configurar DNS, TLS, proxy, encabezados seguros, health check, acceso sin publicar MySQL, credenciales fuertes y acceso admin limitado.
**Puerta de salida:** prueba de instalación reproducible y reversible, HTTPS activo, consola limpia, `/admin` inaccesible sin autenticación, no se entregan credenciales iniciales públicas. Si se usa plataforma gestionada, validar permisos, ambiente/secrets, respaldo y dominio/custom domain de acuerdo con sus controles en vez de asumir que Docker aplica.

## Hito 3 — Operación segura de información

**Responsables:** TI/Seguridad + datos/privacidad.  
**Acciones:** definir backups cifrados con retención y ubicación secundaria, ejecutar restauración en staging, procedimiento de incidente y rotación de secretos, monitorear disponibilidad/error de submit, definir rate limit/anti-spam y revisar logs para no registrar correos/teléfonos innecesarios. Definir retención en DB y backups, borrado manual/automatizado y dueño de solicitudes.
**Puerta de salida:** backup restaurado en evidencia, alerta de fallo probada, contactos operativos definidos, matriz de acceso y protocolo de incidentes vigente.

## Hito 4 — Seguimiento comercial

**Responsables:** Marketing/SDG Sales Ops.  
**Acciones:** seleccionar CRM, mapear campos y estados, revisar consentimiento antes de transferir, definir dueño de lead y SLA (p.ej. primer contacto dentro de dos días hábiles), preparar respuesta/guion de conversación, validar duplicados y medir fuente/campaña. Hasta que se integre, establecer consulta diaria/semanal del panel y una persona responsable. No asumir que el sitio envía un email: **no existe email automático** en el MVP.
**Puerta de salida:** lead de prueba entra al proceso, se asigna, se contacta y se puede marcar como contactado sin exportaciones inseguras.

## Hito 5 — QA y seguridad de producto

**Responsables:** QA + responsable técnico + Legal/UX.  
**Acciones:** casos de validación, móvil, accesibilidad teclado, usuarios admin, abuso de submit, límites/errores/duplicados, carga/latencia, errores de DB, desconexión, reintentos, timeout y resultado; revisión de autorización IDOR, XSS y dependencias; política de retención/consentimiento visible. Probar submit concurrente/doble click. Agregar transacción para insertar prospecto y sus 46 respuestas de forma atómica antes de escalar campañas.
**Puerta de salida:** suite automatizada y smoke de staging aprobados; cero defectos críticos/altos sin mitigar; responsable firma checklist.

## Hito 6 — Lanzamiento controlado y operación

**Responsables:** Product owner + Marketing + TI.  
**Acciones:** lanzamiento interno con datos sintéticos, luego piloto invitado pequeño, monitorear conversión, abandono, errores, spam y tiempo de atención; confirmar datos en panel y CRM; probar recuperación; recoger feedback. Tener plan de reversa (checkpoint/versión anterior o despliegue blue-green) y canal de soporte.
**Puerta de salida:** revisión del piloto y decisión documentada de ampliar campaña; métricas mínimas y owners definidos.

## P0 antes de compartir públicamente

Leyenda: [x] resuelto en v1.2.0 · [~] resuelto en código, falta ejecutarlo en el entorno destino · [ ] pendiente.

- [ ] Aviso de Privacidad aprobado; configurar `PRIVACY_NOTICE_VERSION`, `VITE_PRIVACY_NOTICE_URL`, `VITE_LEGAL_ENTITY_NAME` (el código ya no tiene marcadores fijos).
- [ ] Aviso/consentimiento y finalidad de seguimiento validados por Legal (incluye datos de interlocutores y consentimiento separado para contacto comercial).
- [~] Build autónomo limpio: verificado con imagen base equivalente; repetir con `node:22-bookworm-slim`/`mysql:8.4` (job `docker` del CI).
- [ ] Dominio productivo con HTTPS, proxy (`deploy/Caddyfile.example`) y `/admin` restringido por IP/VPN.
- [~] Smoke test teléfono → confirmación → registro en admin: verificado en Chromium móvil; repetir en staging con dispositivo real.
- [~] Backup cifrado y restauración: scripts corregidos y ciclo cifrado/restauración verificado; ensayar con `docker compose` en staging. [ ] Retención definida.
- [ ] Dueño del prospecto y SLA de contacto (seguimiento manual; no hay email/CRM).
- [x] Seguridad de aplicación sin hallazgos críticos/altos abiertos (rate limit, validación, cabeceras, sesiones, errores, dependencias). [ ] Protocolo de incidentes adoptado por el equipo (propuesta en el runbook).

## P1 primera mejora post-lanzamiento

- Integrar CRM con consentimiento y auditoría de transferencias; considerar alerta email interna sin enviar resultados sensibles al prospecto.
- Añadir export CSV con permisos/registro, búsqueda, filtros y deduplicación si Marketing lo requiere.
- Construir métricas agregadas de embudo sin publicar benchmarks que el instrumento no tiene.
- Versionar cuestionario/escala y resultados para que cada envío se interprete con el catálogo de ese momento.
- ~~Convertir inserts relacionados en transacción~~ (hecho en v1.2.0); añadir idempotencia ante reintentos (clave de envío) y deduplicación por correo/empresa.

## Decisiones que el usuario/equipo debe confirmar

1. Plataforma productiva y responsable de la infraestructura.
2. Entidad legal responsable del tratamiento y aviso aprobado.
3. Finalidad exacta, tiempo de retención, CRM/terceros y flujo de revocación/borrado.
4. Quién recibe los registros y en qué plazo contacta.
5. Dominio, identidad final de marca y política de publicación de los materiales internos.
