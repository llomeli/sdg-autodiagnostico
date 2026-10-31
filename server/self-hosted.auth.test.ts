import { beforeEach, describe, expect, it, vi } from "vitest";

describe("self-hosted local authentication", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SELF_HOSTED_MODE", "true");
    vi.stubEnv("JWT_SECRET", "test-session-secret");
    vi.stubEnv("LOCAL_ADMIN_USERNAME", "admin");
    vi.stubEnv("LOCAL_ADMIN_PASSWORD", "correct-password");
    vi.stubEnv("LOCAL_ADMIN_NAME", "Administrador de prueba");
  });

  it("accepts the configured admin credentials and sets a session cookie", async () => {
    const { appRouter } = await import("./routers");
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      user: null,
      req: { protocol: "http", headers: {} },
      res: {
        cookie: (name: string, value: string) => cookies.push({ name, value }),
        clearCookie: () => undefined,
      },
    } as any;

    const user = await appRouter.createCaller(ctx).auth.localLogin({
      username: "admin",
      password: "correct-password",
    });

    expect(user.role).toBe("admin");
    expect(user.loginMethod).toBe("local");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe("app_session_id");
    expect(cookies[0]?.value).toBeTruthy();
  });

  it("rejects invalid admin credentials", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: { protocol: "http", headers: {} },
      res: { cookie: () => undefined, clearCookie: () => undefined },
    } as any;

    await expect(
      appRouter.createCaller(ctx).auth.localLogin({ username: "admin", password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
