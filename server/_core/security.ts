import type { Express } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { ENV } from "./env";

/**
 * HTTP security headers. The strict CSP and frame-ancestors only apply in
 * self-hosted mode: the managed (Manus) preview runs inside an iframe and
 * injects its own runtime script, which a strict policy would block.
 */
export function applySecurityHeaders(app: Express) {
  const strict = ENV.selfHosted || process.env.CSP_ENABLED === "true";
  app.use(
    helmet({
      contentSecurityPolicy: strict
        ? {
            useDefaults: false,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              // React inline style props and the toast library inject <style>.
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:"],
              fontSrc: ["'self'"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests:
                process.env.COOKIE_SECURE === "true" ? [] : null,
            },
          }
        : false,
      frameguard: strict ? { action: "deny" } : false,
      // HSTS only makes sense once TLS terminates in front of the app.
      strictTransportSecurity:
        process.env.COOKIE_SECURE === "true"
          ? { maxAge: 15552000, includeSubDomains: false }
          : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginEmbedderPolicy: false,
    })
  );
}

const limiterMessage = (message: string) => ({
  error: {
    json: {
      message,
      code: -32029,
      data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 },
    },
  },
});

/** Public form: N submissions per IP per hour (SUBMIT_RATE_LIMIT_PER_HOUR, default 10). */
export const submitRateLimiter = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: ENV.submitRateLimitPerHour,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limiterMessage(
      "Se alcanzó el límite de envíos desde esta red. Inténtalo más tarde."
    ),
  });

/** Admin login: failed attempts per IP per 15 minutes (LOGIN_RATE_LIMIT_PER_15MIN, default 10). */
export const loginRateLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: ENV.loginRateLimitPer15Min,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limiterMessage(
      "Demasiados intentos de acceso. Espera 15 minutos."
    ),
  });
