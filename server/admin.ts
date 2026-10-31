import { z } from "zod";
import type { Request } from "express";
import { domains } from "@shared/assessment";

/** Pure helpers for the admin portal: input contracts, CSV and dashboard maths. */

export const STATUS_VALUES = [
  "new",
  "reviewing",
  "contacted",
  "qualified",
  "archived",
] as const;
export type Status = (typeof STATUS_VALUES)[number];
export const UNASSIGNED = "__sin_asignar__";

/** Business days are counted in Mexico City time (UTC−6, no DST since 2022). */
export const MX_OFFSET = "-06:00";
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha AAAA-MM-DD");

export const listFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.array(z.enum(STATUS_VALUES)).max(STATUS_VALUES.length).optional(),
  sector: z.string().trim().max(120).optional(),
  urgency: z.string().trim().max(40).optional(),
  assignedTo: z.string().trim().max(120).optional(),
  scoreMin: z.number().min(0).max(5).optional(),
  scoreMax: z.number().min(0).max(5).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  followUp: z.enum(["overdue", "today", "week"]).optional(),
});
export type ListFilters = z.infer<typeof listFiltersSchema>;

export const listInputSchema = listFiltersSchema.extend({
  sort: z
    .enum(["createdAt", "overallScore", "companyName", "nextActionAt"])
    .default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});
export type ListInput = z.infer<typeof listInputSchema>;

export const followUpSchema = z.object({
  id: z.number().int().positive(),
  assignedTo: z.string().trim().max(120).nullable().optional(),
  nextAction: z.string().trim().max(255).nullable().optional(),
  /** ISO date-time or null to clear. */
  nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const ACTIVITY_INPUT_TYPES = [
  "note",
  "call",
  "email",
  "meeting",
] as const;
export const activitySchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(ACTIVITY_INPUT_TYPES),
  body: z.string().trim().min(1).max(4000),
});

/** Escape LIKE wildcards so a search for "100%" matches literally. */
export const likePattern = (term: string) =>
  `%${term.replace(/[\\%_]/g, char => `\\${char}`)}%`;

export function dayStart(date: string) {
  return new Date(`${date}T00:00:00${MX_OFFSET}`);
}
export function dayEnd(date: string) {
  return new Date(dayStart(date).getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Who performed an admin action. Behind Cloud Run + IAP the Google identity arrives in
 * `x-goog-authenticated-user-email` ("accounts.google.com:persona@empresa.com"); only
 * trusted when TRUST_IAP_HEADERS=true (IAP is the sole invoker of the service).
 */
export function actorFrom(
  req: Pick<Request, "headers"> | undefined,
  fallback: string
) {
  if (process.env.TRUST_IAP_HEADERS === "true") {
    const raw = req?.headers?.["x-goog-authenticated-user-email"];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const email = value?.split(":").pop()?.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+$/.test(email)) return email.slice(0, 120);
  }
  return fallback.slice(0, 120);
}

// ---- CSV -------------------------------------------------------------------------

/**
 * RFC 4180 cell + protection against formula injection (CSV opened in Excel/Sheets):
 * values starting with = + - @ tab or CR are prefixed with an apostrophe.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: unknown[][]) {
  // BOM so Excel opens UTF-8 accents correctly.
  return (
    "﻿" +
    [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}

export const EXPORT_COLUMNS = [
  ["id", "ID"],
  ["createdAt", "Fecha de registro"],
  ["companyName", "Empresa"],
  ["sector", "Sector"],
  ["employeeRange", "Empleados"],
  ["state", "Estado"],
  ["fullName", "Contacto"],
  ["jobTitle", "Puesto"],
  ["workEmail", "Correo"],
  ["phone", "Teléfono"],
  ["primaryConcern", "Principal preocupación"],
  ["businessImpact", "Impacto"],
  ["urgency", "Urgencia"],
  ["overallScore", "Promedio general"],
  ["status", "Estatus"],
  ["assignedTo", "Responsable"],
  ["nextAction", "Siguiente paso"],
  ["nextActionAt", "Fecha siguiente paso"],
  ["lastContactAt", "Último contacto"],
] as const;

export function exportHeader() {
  return [
    ...EXPORT_COLUMNS.map(([, label]) => label),
    ...domains.map(domain => `Dominio: ${domain.title}`),
  ];
}

/** "2026-10-31 12:05" in Mexico City time, the way the team reads dates. */
export function mxDateTime(value: Date) {
  return new Date(value.getTime() - 6 * 3600_000)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
}

export function exportRow(
  row: Record<string, unknown>,
  domainAverages: Map<string, number>
) {
  return [
    ...EXPORT_COLUMNS.map(([key]) => {
      const value = row[key];
      if (key === "overallScore")
        return typeof value === "number" ? (value / 100).toFixed(2) : "";
      if (value instanceof Date) return mxDateTime(value);
      return value;
    }),
    ...domains.map(domain => {
      const avg = domainAverages.get(domain.id);
      return avg === undefined ? "" : avg.toFixed(2);
    }),
  ];
}

// ---- Dashboard ---------------------------------------------------------------------

/** Monday 00:00 (Mexico City) of the week containing `date`, as YYYY-MM-DD. */
export function weekKey(date: Date) {
  const local = new Date(date.getTime() - 6 * 60 * 60 * 1000); // shift to UTC−6 wall clock
  const day = (local.getUTCDay() + 6) % 7; // Monday = 0
  local.setUTCDate(local.getUTCDate() - day);
  return local.toISOString().slice(0, 10);
}

export function weeklySeries(dates: Date[], weeks: number, now = new Date()) {
  const counts = new Map<string, number>();
  for (const date of dates)
    counts.set(weekKey(date), (counts.get(weekKey(date)) ?? 0) + 1);
  const series: Array<{ week: string; count: number }> = [];
  const cursor = new Date(`${weekKey(now)}T12:00:00Z`);
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(cursor.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    series.push({ week: key, count: counts.get(key) ?? 0 });
  }
  return series;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
