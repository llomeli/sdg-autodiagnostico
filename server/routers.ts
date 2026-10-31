import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import {
  addLeadActivity,
  createProspectSubmission,
  deleteProspectSubmission,
  exportProspects,
  getDashboard,
  getFilterOptions,
  getProspectSubmission,
  listProspectSubmissions,
  updateFollowUp,
  updateSubmissionStatus,
} from "./db";
import {
  activitySchema,
  actorFrom,
  exportHeader,
  exportRow,
  followUpSchema,
  listFiltersSchema,
  listInputSchema,
  STATUS_VALUES,
  toCsv,
} from "./admin";
import { leadSchema, toSubmissionRecord } from "./submission";

/** Operational audit trail: ids and actions only, never personal data. */
const audit = (action: string, details: Record<string, unknown>) =>
  console.info(
    JSON.stringify({ at: new Date().toISOString(), audit: action, ...details })
  );

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acceso administrativo requerido.",
    });
  }
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure
      .input(
        z.object({
          username: z.string().min(1).max(120),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ENV.selfHosted) {
          throw new TRPCError({
            code: "METHOD_NOT_SUPPORTED",
            message: "El login local sólo está disponible en modo self-hosted.",
          });
        }
        const user = await sdk.authenticateLocalCredentials(
          input.username,
          input.password
        );
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Usuario o contraseña incorrectos.",
          });
        }
        const sessionToken = await sdk.createLocalAdminSession();
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ENV.adminSessionHours * 60 * 60 * 1000,
        });
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
      const id = await createProspectSubmission(
        toSubmissionRecord(input, ENV.privacyNoticeVersion)
      );
      audit("assessment.submit", { submissionId: id });
      return { id };
    }),
  }),
  admin: router({
    listSubmissions: adminProcedure
      .input(listInputSchema.optional())
      .query(({ input }) =>
        listProspectSubmissions(listInputSchema.parse(input ?? {}))
      ),
    filterOptions: adminProcedure.query(() => getFilterOptions()),
    getSubmission: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const submission = await getProspectSubmission(input.id);
        if (submission)
          audit("admin.viewSubmission", {
            by: actorFrom(ctx.req, ctx.user.name || ctx.user.openId),
            submissionId: input.id,
          });
        return submission;
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(STATUS_VALUES),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const by = actorFrom(ctx.req, ctx.user.name || ctx.user.openId);
        if (!(await updateSubmissionStatus(input.id, input.status, by)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "El registro no existe.",
          });
        audit("admin.updateStatus", {
          by,
          submissionId: input.id,
          status: input.status,
        });
      }),
    updateFollowUp: adminProcedure
      .input(followUpSchema)
      .mutation(async ({ ctx, input }) => {
        const by = actorFrom(ctx.req, ctx.user.name || ctx.user.openId);
        if (!(await updateFollowUp(input, by)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "El registro no existe.",
          });
        audit("admin.updateFollowUp", {
          by,
          submissionId: input.id,
          fields: Object.keys(input).filter(key => key !== "id"),
        });
        return { success: true } as const;
      }),
    addActivity: adminProcedure
      .input(activitySchema)
      .mutation(async ({ ctx, input }) => {
        const by = actorFrom(ctx.req, ctx.user.name || ctx.user.openId);
        if (!(await addLeadActivity(input, by)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "El registro no existe.",
          });
        audit("admin.addActivity", {
          by,
          submissionId: input.id,
          type: input.type,
        });
        return { success: true } as const;
      }),
    /** CSV of the filtered list. Personal data leaves the system: every export is audited. */
    exportCsv: adminProcedure
      .input(listFiltersSchema.optional())
      .mutation(async ({ ctx, input }) => {
        const filters = input ?? {};
        const { rows, domainAverages, truncated } =
          await exportProspects(filters);
        const csv = toCsv(
          exportHeader(),
          rows.map(row =>
            exportRow(row, domainAverages.get(row.id) ?? new Map())
          )
        );
        const stamp = new Date()
          .toISOString()
          .slice(0, 16)
          .replace(/[-:T]/g, "");
        audit("admin.exportCsv", {
          by: actorFrom(ctx.req, ctx.user.name || ctx.user.openId),
          rows: rows.length,
          truncated,
          filters: Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key]) => key),
        });
        return {
          filename: `prospectos-${stamp}.csv`,
          csv,
          rows: rows.length,
          truncated,
        };
      }),
    dashboard: adminProcedure.query(() => getDashboard()),
    /** Deletion / cancellation requests (derechos ARCO). Irreversible; backups age out per retention policy. */
    deleteSubmission: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          confirm: z.literal("ELIMINAR"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteProspectSubmission(input.id);
        if (!deleted)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "El registro no existe.",
          });
        audit("admin.deleteSubmission", {
          by: actorFrom(ctx.req, ctx.user.name || ctx.user.openId),
          submissionId: input.id,
        });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
