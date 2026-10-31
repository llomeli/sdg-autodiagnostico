# Seguimiento del proyecto

## Corrección actual

- [x] Validar sitio web opcional desde el primer paso.
- [x] Validar correos opcionales de interlocutores desde el primer paso.
- [x] Mostrar mensajes inline claros y bloquear el avance cuando haya datos inválidos.
- [x] Agregar pruebas unitarias para valores vacíos, válidos e inválidos.
- [x] Probar el flujo completo actualizado: bloqueo por datos inválidos, corrección, diagnóstico y envío final.

## Backlog de producto fuera del alcance de esta corrección

- Sustituir los marcadores del Aviso de Privacidad por la versión oficial.
- Configurar correo transaccional o CRM para seguimiento de prospectos.
- Revisar y publicar el dominio productivo.

## Auditoría v1.2.0 (hecho)

- [x] Imagen Docker arranca (vite fuera del bundle de producción).
- [x] Validación y puntaje en servidor; transacción; borrado de registros; versión del aviso.
- [x] Rate limit, CSP/Helmet, sesiones endurecidas, errores enmascarados.
- [x] Respaldos cifrados + restore; CI; dependencias sin avisos en producción.

## Siguiente (P1)

- [ ] Idempotencia de envío y deduplicación por correo/empresa.
- [ ] Export CSV con permisos y bitácora (si Marketing lo pide).
- [ ] Alerta interna de nuevo lead (sin datos del diagnóstico en el correo) o integración CRM con consentimiento.
- [ ] Purga automática según plazo de conservación aprobado.
- [ ] Revisión de accesibilidad (teclado, contraste, lector de pantalla).
