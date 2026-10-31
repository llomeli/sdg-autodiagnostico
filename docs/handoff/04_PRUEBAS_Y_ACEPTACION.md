# Pruebas y criterios de aceptación

## Verificaciones realizadas

**v1.2.0 (31-oct-2026):** `pnpm test` 34 pruebas en 7 archivos (validación de envío contra catálogo, puntaje en servidor, URL http(s), guardia de configuración, sesión 8 h/SameSite/rotación de contraseña, sin Bearer, borrado con confirmación, enmascarado de errores); `pnpm check` y `pnpm build` correctos; `docker build --no-cache` y arranque del contenedor `healthy`; sondas dinámicas y recorrido de navegador móvil completos. Detalle y limitaciones en `09_AUDITORIA_Y_REMEDIACION_v1.2.0.md` §4.

**v1.1.0:** 11 pruebas; validaciones de sitio/correo opcionales y envío verificados en navegador. La auditoría v1.2.0 encontró que esa imagen Docker no arrancaba.

## Comandos de verificación de código

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
```

Para probar instalación containerizada en ambiente desechable, nunca en producción sin backup:

```bash
docker compose config
docker compose build --no-cache
docker compose up -d
docker compose ps
docker compose logs --tail=200 app
curl -fsS http://127.0.0.1:3000/readyz
```

Ajustar el puerto si `APP_PORT` difiere. Luego entrar al flujo, crear registro de prueba con email de dominio `.invalid`, confirmar que aparece en el panel, cambiar su estado y borrarlo con procedimiento autorizado. Borrar también sus respuestas en el entorno de prueba.

## Casos funcionales mínimos

### Perfil

| Caso | Entrada | Resultado esperado |
|---|---|---|
| Obligatorios faltantes | Dejar empresa/contacto/consentimiento vacío | No avanza; informa que faltan campos obligatorios. |
| Sitio web vacío | Dejar opcional vacío | Permite avanzar. |
| Sitio web válido | `https://empresa.com` | No hay error; permite avanzar. |
| URL incompleta | `empresa.com`, `www.empresa.com` o esquema inválido | Error inline útil y botón bloqueado; no se guarda. |
| Email interlocutor vacío | Dejar opcional vacío | Permite avanzar. |
| Email interlocutor válido | `persona@empresa.com` | Sin error. |
| Email interlocutor inválido | `persona@empresa` | Error inline y bloqueo. |
| Corregir valor | Remplazar URL/email por válido | Error se retira y permite continuar. |

### Respuestas y resultado

| Caso | Resultado esperado |
|---|---|
| Intentar pasar dominio incompleto | Permanece en el dominio y resalta preguntas sin respuesta. |
| Nivel 0–5 | Cada opción válida cuenta como respondida; N/A también cuenta y no entra al promedio. |
| Revisar antes de terminar | Navega al primer dominio pendiente y explica cuántas respuestas faltan. |
| Submit válido | Guarda prospecto y respuestas, muestra confirmación, sin regreso/edición desde resultado. |
| Error de persistencia/validación | No muestra éxito; presenta mensaje accionable y permite reintento seguro. |
| Doble submit/reintento | El botón se deshabilita mientras guarda; no hay idempotencia de servidor (mejora P1). |
| Envío manipulado (puntaje, preguntas, N/A con puntaje, URL `javascript:`) | El servidor rechaza con 400 o recalcula el puntaje; no se guarda nada parcial. |
| Más de 10 envíos/hora desde una IP | 429 con mensaje en español. |

### Panel y seguridad

- Visitante anónimo no obtiene datos del panel (401); admin autenticado sí puede consultar, actualizar estatus y eliminar con confirmación.
- 11.º intento fallido de login en 15 min → 429. Cambiar `LOCAL_ADMIN_PASSWORD` cierra las sesiones abiertas.
- Cabeceras presentes: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` (con HTTPS).
- No hay token, cookie secreta, password ni URL de DB en bundle, archivo de release, logs públicos o Git.
- MySQL no es accesible desde Internet; usar HTTPS en todo acceso real.
- Cookies de sesión tienen `HttpOnly`, `Secure` en HTTPS, `SameSite` apropiado y expiración revisada.
- No incluir email/teléfono/respuestas en logs sin necesidad.
- Restaurar un backup de prueba y verificar integridad/responsabilidad de acceso.

## Checklist de cierre de release

Antes de ampliar campaña, registrar versión, aprobación de negocio, aprobación Legal/Privacidad, resultados de pruebas, destino de backup, URL productiva, personas autorizadas al admin, procedimiento de reversión y canal de soporte. No borrar backups ni mezclar registros sintéticos con prospectos reales.
