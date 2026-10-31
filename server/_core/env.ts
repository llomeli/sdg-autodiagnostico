const intFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/**
 * Express `trust proxy` setting. Default `loopback` trusts a reverse proxy on the
 * same host only. Behind Docker's bridge network use the proxy's address/CIDR or a
 * hop count (e.g. "1"). Never `true` when the app port is reachable directly:
 * clients could then forge X-Forwarded-For and evade rate limits.
 */
const parseTrustProxy = (
  raw: string | undefined
): boolean | number | string => {
  if (!raw) return "loopback";
  if (raw === "false") return false;
  if (raw === "true") return true;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  selfHosted: process.env.SELF_HOSTED_MODE === "true",
  localAdminUsername: process.env.LOCAL_ADMIN_USERNAME ?? "admin",
  localAdminPassword: process.env.LOCAL_ADMIN_PASSWORD ?? "",
  localAdminName: process.env.LOCAL_ADMIN_NAME ?? "Administrador local",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Admin session lifetime for the self-hosted login (hours). Was 1 year in v1.1.0. */
  adminSessionHours: intFromEnv("ADMIN_SESSION_HOURS", 8),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  /** Identifier of the approved Aviso de Privacidad stored with every consent. */
  privacyNoticeVersion: (process.env.PRIVACY_NOTICE_VERSION ?? "").slice(0, 40),
  submitRateLimitPerHour: intFromEnv("SUBMIT_RATE_LIMIT_PER_HOUR", 10),
  loginRateLimitPer15Min: intFromEnv("LOGIN_RATE_LIMIT_PER_15MIN", 10),
};

/**
 * Fails fast on configuration that would make production insecure or broken.
 * Returns the list of problems so tests can assert on it without exiting.
 */
export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const placeholder = /REPLACE_WITH|changeme|^admin$|^password$/i;

  if (!env.DATABASE_URL) errors.push("DATABASE_URL no está definido.");
  const jwt = env.JWT_SECRET ?? "";
  if (jwt.length < 32 || placeholder.test(jwt))
    errors.push("JWT_SECRET debe tener al menos 32 caracteres aleatorios.");

  if (env.SELF_HOSTED_MODE === "true") {
    const pwd = env.LOCAL_ADMIN_PASSWORD ?? "";
    if (pwd.length < 16 || placeholder.test(pwd))
      errors.push(
        "LOCAL_ADMIN_PASSWORD debe tener al menos 16 caracteres y no ser un marcador."
      );
    if (pwd && pwd === jwt)
      errors.push("LOCAL_ADMIN_PASSWORD y JWT_SECRET deben ser distintos.");
  } else if (!env.OAUTH_SERVER_URL) {
    errors.push("OAUTH_SERVER_URL es obligatorio fuera del modo self-hosted.");
  }

  if (!env.PRIVACY_NOTICE_VERSION) {
    warnings.push(
      "PRIVACY_NOTICE_VERSION no está definido: los consentimientos se guardarán sin versión del Aviso de Privacidad."
    );
  }
  if (env.TRUST_PROXY === "true") {
    warnings.push(
      "TRUST_PROXY=true confía en cualquier X-Forwarded-For; usa la IP/CIDR del proxy o un número de saltos."
    );
  }
  return { errors, warnings };
}
