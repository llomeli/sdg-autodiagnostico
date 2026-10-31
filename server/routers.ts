import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import {
  createProspectSubmission,
  deleteProspectSubmission,
  getProspectSubmission,
  listProspectSubmissions,
  updateSubmissionStatus,
} from "./db";
import { leadSchema, toSubmissionRecord } from "./submission";

/** Operational audit trail: ids and actions only, never personal data. */
const audit = (action: string, details: Record<string, unknown>) =>
  console.info(JSON.stringify({ at: new Date().toISOString(), audit: action, ...details }));

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso administrativo requerido." });
  }
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure
      .input(z.object({ username: z.string().min(1).max(120), password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.selfHosted) {
          throw new TRPCError({ code: "METHOD_NOT_SUPPORTED", message: "El login local sólo está disponible en modo self-hosted." });
        }
        const user = await sdk.authenticateLocalCredentials(input.username, input.password);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos." });
        }
        const sessionToken = await sdk.createLocalAdminSession();
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ENV.adminSessionHours * 60 * 60 * 1000 });
        audit("admin.login", { method: "local" });
        return user;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  assessment: router({
    submit: publicProcedure.input(leadSchema).mutation(async ({ input }) => {
      // Score is recomputed server-side; the client value is ignored.
      const id = await createProspectSubmission(toSubmissionRecord(input, ENV.privacyNoticeVersion));
      audit("assessment.submit", { submissionId: id });
      return { id };
    }),
  }),
  admin: router({
    listSubmissions: adminProcedure.query(() => listProspectSubmissions()),
    getSubmission: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const submission = await getProspectSubmission(input.id);
      if (submission) audit("admin.viewSubmission", { by: ctx.user.openId, submissionId: input.id });
      return submission;
    }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "reviewing", "contacted", "qualified", "archived"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateSubmissionStatus(input.id, input.status);
        audit("admin.updateStatus", { by: ctx.user.openId, submissionId: input.id, status: input.status });
      }),
    /** Deletion / cancellation requests (derechos ARCO). Irreversible; backups age out per retention policy. */
    deleteSubmission: adminProcedure
      .input(z.object({ id: z.number().int().positive(), confirm: z.literal("ELIMINAR") }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteProspectSubmission(input.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "El registro no existe." });
        audit("admin.deleteSubmission", { by: ctx.user.openId, submissionId: input.id });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
