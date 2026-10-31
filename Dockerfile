# ---- build: compiles client (Vite) and server (esbuild) -------------------------
FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# patches/ must be present before install: the lockfile references patches/wouter@3.7.1.patch
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_SELF_HOSTED_MODE=true
ARG VITE_PRIVACY_NOTICE_URL=""
ARG VITE_LEGAL_ENTITY_NAME=""
ENV VITE_SELF_HOSTED_MODE=${VITE_SELF_HOSTED_MODE} \
    VITE_PRIVACY_NOTICE_URL=${VITE_PRIVACY_NOTICE_URL} \
    VITE_LEGAL_ENTITY_NAME=${VITE_LEGAL_ENTITY_NAME}
RUN pnpm build \
 && rm -rf dist/public/__manus__ \
 && chmod -R a+rX dist

# ---- runtime: production dependencies only, non-root ---------------------------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --prod --frozen-lockfile \
 && pnpm store prune \
 && rm -rf /root/.cache /root/.local/share/pnpm
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
