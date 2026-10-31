import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateProductionEnv } from "./_core/env";

const strongEnv = {
  DATABASE_URL: "mysql://u:p@db:3306/x",
  JWT_SECRET: "a".repeat(48),
  SELF_HOSTED_MODE: "true",
  LOCAL_ADMIN_PASSWORD: "b".repeat(48),
  PRIVACY_NOTICE_VERSION: "AP-2026-11",
} as NodeJS.ProcessEnv;

describe("production configuration guard", () => {
  it("accepts strong self-hosted configuration", () => {
    expect(validateProductionEnv(strongEnv)).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("rejects short or placeholder secrets and missing database", () => {
    const { errors } = validateProductionEnv({
      SELF_HOSTED_MODE: "true",
      JWT_SECRET: "REPLACE_WITH_A_LONG_RANDOM_VALUE",
      LOCAL_ADMIN_PASSWORD: "admin",
    } as NodeJS.ProcessEnv);
    expect(errors).toHaveLength(3);
  });

  it("warns when consents would be stored without a privacy-notice version", () => {
    const { warnings } = validateProductionEnv({
      ...strongEnv,
      PRIVACY_NOTICE_VERSION: "",
    });
    expect(warnings.join(" ")).toMatch(/PRIVACY_NOTICE_VERSION/);
  });
});

describe("self-hosted admin session hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SELF_HOSTED_MODE", "true");
    vi.stubEnv("JWT_SECRET", "x".repeat(48));
    vi.stubEnv("LOCAL_ADMIN_USERNAME", "admin");
    vi.stubEnv("LOCAL_ADMIN_PASSWORD", "first-password-0123456789");
    vi.stubEnv("ADMIN_SESSION_HOURS", "8");
  });

  const login = async () => {
    const { appRouter } = await import("./routers");
    const cookies: Array<{ value: string; options: Record<string, unknown> }> =
      [];
    const ctx = {
      user: null,
      req: { protocol: "http", secure: false, headers: {} },
      res: {
        cookie: (_n: string, value: string, options: Record<string, unknown>) =>
          cookies.push({ value, options }),
        clearCookie: () => undefined,
      },
    } as any;
    await appRouter
      .createCaller(ctx)
      .auth.localLogin({
        username: "admin",
        password: "first-password-0123456789",
      });
    return cookies[0]!;
  };

  it("issues a short-lived, SameSite=Lax, HttpOnly cookie", async () => {
    const cookie = await login();
    expect(cookie.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });
  });

  it("accepts the session cookie but not a Bearer header", async () => {
    const { value } = await login();
    const { sdk } = await import("./_core/sdk");
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `app_session_id=${value}` },
      } as any)
    ).resolves.toMatchObject({ role: "admin" });
    await expect(
      sdk.authenticateRequest({
        headers: { authorization: `Bearer ${value}` },
      } as any)
    ).rejects.toBeTruthy();
  });

  it("invalidates existing sessions when the admin password is rotated", async () => {
    const { value } = await login();
    vi.resetModules();
    vi.stubEnv("LOCAL_ADMIN_PASSWORD", "rotated-password-9876543210");
    const { sdk } = await import("./_core/sdk");
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `app_session_id=${value}` },
      } as any)
    ).rejects.toBeTruthy();
  });

  it("requires an explicit confirmation token to delete a submission", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: { role: "admin", openId: "local-admin" },
      req: { headers: {} },
      res: {},
    } as any;
    await expect(
      appRouter
        .createCaller(ctx)
        .admin.deleteSubmission({ id: 1, confirm: "SI" as any })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("masks internal errors so SQL and personal data never reach the browser", async () => {
    const { router, publicProcedure } = await import("./_core/trpc");
    const failing = router({
      boom: publicProcedure.mutation(() => {
        throw new Error(
          "Failed query: insert into prospect_submissions params: persona@example.com"
        );
      }),
    });
    const caller = failing.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
    const error = await caller.boom().catch(e => e);
    const { getErrorShape } = await import(
      "@trpc/server/unstable-core-do-not-import"
    );
    const shape = getErrorShape({
      config: failing._def._config,
      error,
      type: "mutation",
      path: "boom",
      input: undefined,
      ctx: undefined,
    });
    expect(shape.message).not.toMatch(/insert|persona@example\.com/);
  });
});
