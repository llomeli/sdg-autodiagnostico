import type { Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

/**
 * Development only. `vite` is imported dynamically and its config is read from
 * disk, so nothing from Vite (a devDependency) ends up in the production bundle.
 */
export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const projectRoot = path.resolve(import.meta.dirname, "../..");

  const vite = await createViteServer({
    configFile: path.resolve(projectRoot, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(projectRoot, "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
