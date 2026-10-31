# Distribución, confidencialidad y propiedad intelectual

## Clasificación sugerida

Este handoff es **material interno de proyecto** hasta que SDG autorice otra clasificación. Contiene código, prompts, marca/logo, archivos tipográficos, el cuestionario SDG/DMBOK fuente y un workbook v2 adaptado. El paquete fue preparado para transferencia al equipo responsable del producto y lanzamiento, no como archivo público descargable para prospectos.

## No distribuir sin revisión

- No enviar a prospectos el Excel de referencia ni el workbook adaptado v2. El workbook v2 puede tener pestañas ocultas, trazabilidad y contenido de trabajo consultivo.
- No publicar los prompts internos de depuración/auditoría ni el plan de operación si contienen información sensible del proceso.
- No compartir `.env`, `.admin-credentials`, backups, dumps de MySQL, secretos, tokens ni el archivo de metadatos `.project-config.json`. Estos elementos fueron excluidos del paquete.
- No asumir que el código, el logo SDG, el cuestionario de origen o los activos de terceros tienen una licencia abierta por estar en el ZIP. Verificar autorizaciones y licencias antes de redistribuir o relicenciar.

## Activos y terceros

La tipografía Figtree y componentes de interfaz pueden estar sujetos a sus licencias correspondientes; conservar avisos de terceros cuando aplique. Las imágenes/logo se incluyeron desde activos facilitados para este proyecto. Validar autorización de marca/uso con SDG. El Excel fuente fue facilitado por el equipo; manejarlo conforme a clasificación y permisos internos.

## Higiene del paquete

Antes de compartir una versión nueva, comprobar que el contenido no incluya `.env`, tokens, datos de leads, exports, `node_modules`, `dist` innecesario, logs con información personal ni historial Git con secretos. Repetir el escaneo al crear releases y guardar el checksum junto al archivo.
