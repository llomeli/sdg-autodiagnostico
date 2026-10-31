# Decisiones, supuestos y pendientes de confirmación

## Decisiones que ya refleja el MVP

- La experiencia se presenta como herramienta gratuita de autodiagnóstico comercial para empresas mexicanas, no como método de certificación.
- Conserva el orden por 11 áreas del cuestionario de referencia y reduce la evaluación a 46 preguntas adaptadas.
- Mantiene la escala original visible de Nivel 0 a Nivel 5 más N/A. No se añaden ponderaciones o benchmarks de industria.
- Se recopila información contextual y de contacto por separado de las preguntas que generan promedio.
- El usuario ve lectura preliminar en revisión y el envío final registra respuestas/datos; la confirmación no permite regresar a modificar.
- El registro se consulta en un panel restringido. El envío no genera correo automático ni integración CRM.
- Los campos website y email de interlocutores son opcionales; si se completan, deben satisfacer formato desde el primer paso y también el servidor.
- Existe variante autónoma self-hosted con Docker, MySQL y credencial local de admin; también existe proyecto WebDev con autenticación de plataforma. No confundir credenciales, rutas ni datos entre ambientes.

## Supuestos que deben acordarse antes del piloto

- El resultado numérico es un promedio simple, no un índice calibrado ni estadísticamente validado.
- La persona que responde conoce lo suficiente para representar a su organización; no se verifica por evidencia documental.
- Los datos enviados se atenderán manualmente por el equipo hasta implementar un proceso CRM/alerta.
- El cuestionario fuente, Excel adaptado, logo y fuentes pueden usarse por el equipo dueño del proyecto, sujeto a las licencias y aprobaciones internas correspondientes.

## Decisiones aún no cerradas

- Aviso de Privacidad definitivo, responsable, finalidades, retención, mecanismo de derechos y transferencias.
- Plataforma, dominio, región/ubicación de datos, soporte, disponibilidad, RPO/RTO y costo de operación.
- Dueño de leads y SLA de primer contacto; reglas de deduplicación y rechazo de spam.
- Si integrar CRM, qué campos transferir y cómo respetar consentimiento/solicitudes de baja.
- Si y cómo guardar versión de cuestionario/aviso en cada registro y qué campos exportar.
- Aprobación interna para distribuir cualquier Excel; el workbook v2 es interno por defecto.

Este documento ayuda a separar el comportamiento implementado de decisiones comerciales, jurídicas o de infraestructura que requieren aprobación humana. No constituye una aprobación legal o de seguridad.
