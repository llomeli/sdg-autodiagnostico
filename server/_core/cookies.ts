import type { CookieOptions, Request } from "express";
import { ENV } from "./env";

function isSecureRequest(req: Request) {
  // Self-hosted: rely on Express `trust proxy` (TRUST_PROXY) so only a trusted
  // reverse proxy can declare HTTPS. COOKIE_SECURE=true forces the flag.
  if (process.env.COOKIE_SECURE === "true") return true;
  if (ENV.selfHosted) return req.secure;

  // Managed (Manus) mode keeps the original behaviour: the platform proxy sets X-Forwarded-Proto.
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Self-hosted admin sessions are first-party only, so SameSite=Lax (blocks the
 * cookie on cross-site sub-requests). The managed preview runs inside an iframe
 * and needs SameSite=None, which browsers only accept together with Secure.
 */
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: ENV.selfHosted || !secure ? "lax" : "none",
    secure,
  };
}
