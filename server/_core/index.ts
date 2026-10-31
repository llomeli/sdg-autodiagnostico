import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { ENV, validateProductionEnv } from "./env";
import {
  applySecurityHeaders,
  loginRateLimiter,
  submitRateLimiter,
} from "./security";
import { pingDb } from "../db";
import { runMigrations } from "./migrate";

const isDevelopment = process.env.NODE_ENV === "development";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  if (!isDevelopment) {
    const { errors, warnings } = validateProductionEnv();
    warnings.forEach(message => console.warn(`[Config] ${message}`));
    if (errors.length) {
      errors.forEach(message => console.error(`[Config] ${message}`));
      throw new Error(
        "Configuración inválida para producción; revisa las variables de entorno."
      );
    }
  }

  // Schema changes ship with the image and are applied before serving traffic.
  // The database may still be starting (MySQL's container restarts once after init;
  // Cloud SQL can be briefly unreachable on cold start), so retry before giving up.
  if (process.env.MIGRATE_ON_START !== "false") {
    const attempts = Number(process.env.MIGRATE_ATTEMPTS ?? 30);
    for (let attempt = 1; ; attempt++) {
      try {
        await runMigrations();
        break;
      } catch (error) {
        if (attempt >= attempts) throw error;
        console.warn(
          `[Migrate] intento ${attempt}/${attempts} falló (${(error as Error).message.split("\n")[0]}); reintento en 2 s`
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.set("trust proxy", ENV.trustProxy);
  applySecurityHeaders(app);

  // The largest legitimate submission (46 answers with every optional field full) is < 200 KB.
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ limit: "16kb", extended: false }));

  // Liveness (process up) and readiness (database reachable) for Docker/proxy/monitoring.
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/readyz", async (_req, res) => {
    const db = await pingDb();
    res.status(db ? 200 : 503).json({ ok: db, db });
  });

  if (!ENV.selfHosted) {
    registerStorageProxy(app);
    registerOAuthRoutes(app);
  }

  app.use("/api/trpc/assessment.submit", submitRateLimiter());
  app.use("/api/trpc/auth.localLogin", loginRateLimiter());
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // One HTTP request = one procedure, so per-path rate limits cannot be bypassed by batching.
      allowBatching: false,
      onError({ error, path }) {
        if (error.code !== "INTERNAL_SERVER_ERROR") return;
        // Log the driver error code only: messages may embed SQL parameters (personal data).
        const cause = error.cause as
          | { code?: string; errno?: number }
          | undefined;
        console.error(
          JSON.stringify({
            at: new Date().toISOString(),
            level: "error",
            path,
            code: cause?.code ?? error.name,
            errno: cause?.errno,
          })
        );
      },
    })
  );

  if (isDevelopment) {
    // Loaded lazily so the production bundle never imports `vite` (a devDependency).
    // In v1.1.0 the static import made the Docker image crash at startup.
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // Only hunt for a free port in development; in production a busy port must fail loudly.
  const port = isDevelopment
    ? await findAvailablePort(preferredPort)
    : preferredPort;

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(
      `Server running on port ${port} (${ENV.selfHosted ? "self-hosted" : "managed"} mode)`
    );
  });

  const shutdown = (signal: string) => {
    console.log(`[Server] ${signal} received, closing`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
