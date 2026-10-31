# SDG Group · Autodiagnóstico de Gobierno de Datos

Lead magnet: autodiagnóstico de madurez de gobierno de datos (46 preguntas, 11 dominios) con panel interno de prospectos. React 19 + Express/tRPC + MySQL 8.4.

- Desarrollo: Node 22, `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm dev`.
- Verificación: `pnpm check && pnpm test && pnpm build` (integración con MySQL: `TEST_DATABASE_URL=mysql://…/algo_test pnpm test`).
- Despliegue self-hosted: `README_SELF_HOSTING.md`. Google Cloud Run: `deploy/cloudrun/README.md`.
- Auditoría, runbook y documentos del handoff: `docs/handoff/`.

Los libros Excel de referencia (`reference/`) no se versionan aquí: son internos y requieren autorización para distribuirse.
