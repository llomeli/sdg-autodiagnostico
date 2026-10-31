import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import {
  assessmentResponses,
  InsertUser,
  leadActivities,
  prospectSubmissions,
  users,
} from "../drizzle/schema";
import {
  dayEnd,
  dayStart,
  likePattern,
  median,
  UNASSIGNED,
  weeklySeries,
  type ListFilters,
  type ListInput,
  type Status,
} from "./admin";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Every session in UTC: DEFAULT CURRENT_TIMESTAMP and JS Dates must agree,
      // whatever the server's own time zone is (Cloud SQL is UTC; a local MySQL may not be).
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        timezone: "Z",
        connectionLimit: 10,
      });
      pool.on("connection", connection =>
        connection.query("SET time_zone = '+00:00'")
      );
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

import type { toSubmissionRecord } from "./submission";

export type SubmissionRecord = ReturnType<typeof toSubmissionRecord>;

/** Inserts the lead and its answers atomically: either all rows are stored or none. */
export async function createProspectSubmission(input: SubmissionRecord) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");

  const { responses, interlocutors, ...submission } = input;
  return db.transaction(async tx => {
    const result = await tx.insert(prospectSubmissions).values({
      ...submission,
      interlocutors: interlocutors?.length
        ? JSON.stringify(interlocutors)
        : undefined,
      consentAt: new Date(),
    });
    const submissionId = Number(result[0].insertId);
    if (responses.length > 0) {
      await tx
        .insert(assessmentResponses)
        .values(responses.map(response => ({ ...response, submissionId })));
    }
    return submissionId;
  });
}

const listColumns = {
  id: prospectSubmissions.id,
  fullName: prospectSubmissions.fullName,
  companyName: prospectSubmissions.companyName,
  jobTitle: prospectSubmissions.jobTitle,
  sector: prospectSubmissions.sector,
  urgency: prospectSubmissions.urgency,
  overallScore: prospectSubmissions.overallScore,
  status: prospectSubmissions.status,
  assignedTo: prospectSubmissions.assignedTo,
  nextAction: prospectSubmissions.nextAction,
  nextActionAt: prospectSubmissions.nextActionAt,
  lastContactAt: prospectSubmissions.lastContactAt,
  createdAt: prospectSubmissions.createdAt,
};

/** SQL conditions for the admin filters. Exported for tests. */
export function buildProspectWhere(
  filters: ListFilters,
  now = new Date()
): SQL | undefined {
  const p = prospectSubmissions;
  const conditions: SQL[] = [];
  if (filters.search) {
    const pattern = likePattern(filters.search);
    conditions.push(
      or(
        like(p.companyName, pattern),
        like(p.fullName, pattern),
        like(p.workEmail, pattern),
        like(p.legalName, pattern)
      )!
    );
  }
  if (filters.status?.length)
    conditions.push(inArray(p.status, filters.status));
  if (filters.sector) conditions.push(eq(p.sector, filters.sector));
  if (filters.urgency) conditions.push(eq(p.urgency, filters.urgency));
  if (filters.assignedTo === UNASSIGNED)
    conditions.push(or(isNull(p.assignedTo), eq(p.assignedTo, ""))!);
  else if (filters.assignedTo)
    conditions.push(eq(p.assignedTo, filters.assignedTo));
  if (filters.scoreMin !== undefined)
    conditions.push(gte(p.overallScore, Math.round(filters.scoreMin * 100)));
  if (filters.scoreMax !== undefined)
    conditions.push(
      sql`${p.overallScore} <= ${Math.round(filters.scoreMax * 100)}`
    );
  if (filters.from) conditions.push(gte(p.createdAt, dayStart(filters.from)));
  if (filters.to) conditions.push(lt(p.createdAt, dayEnd(filters.to)));
  if (filters.followUp) {
    const todayKey = new Date(now.getTime() - 6 * 3600_000)
      .toISOString()
      .slice(0, 10);
    const open = sql`${p.status} not in ('qualified','archived')`;
    if (filters.followUp === "overdue")
      conditions.push(
        and(isNotNull(p.nextActionAt), lt(p.nextActionAt, now), open)!
      );
    if (filters.followUp === "today")
      conditions.push(
        and(
          gte(p.nextActionAt, dayStart(todayKey)),
          lt(p.nextActionAt, dayEnd(todayKey))
        )!
      );
    if (filters.followUp === "week")
      conditions.push(
        and(
          gte(p.nextActionAt, now),
          lt(p.nextActionAt, new Date(now.getTime() + 7 * 24 * 3600_000))
        )!
      );
  }
  return conditions.length ? and(...conditions) : undefined;
}

/** Paginated, filtered list with only the columns the panel shows (data minimisation). */
export async function listProspectSubmissions(input: ListInput) {
  const db = await getDb();
  if (!db)
    return { rows: [], total: 0, page: input.page, pageSize: input.pageSize };
  const where = buildProspectWhere(input);
  const sortColumn = {
    createdAt: prospectSubmissions.createdAt,
    overallScore: prospectSubmissions.overallScore,
    companyName: prospectSubmissions.companyName,
    nextActionAt: prospectSubmissions.nextActionAt,
  }[input.sort];
  const order = input.dir === "asc" ? asc(sortColumn) : desc(sortColumn);
  const [rows, totalRows] = await Promise.all([
    db
      .select(listColumns)
      .from(prospectSubmissions)
      .where(where)
      .orderBy(order, desc(prospectSubmissions.id))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ n: count() }).from(prospectSubmissions).where(where),
  ]);
  return {
    rows,
    total: Number(totalRows[0]?.n ?? 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}

/** Distinct values for the filter dropdowns. */
export async function getFilterOptions() {
  const db = await getDb();
  if (!db) return { sectors: [], urgencies: [], assignees: [] };
  type TextColumn =
    | typeof prospectSubmissions.sector
    | typeof prospectSubmissions.urgency
    | typeof prospectSubmissions.assignedTo;
  const distinct = async (column: TextColumn) =>
    (
      await db
        .selectDistinct({ v: column })
        .from(prospectSubmissions)
        .where(isNotNull(column))
        .orderBy(asc(column))
    )
      .map(row => row.v)
      .filter((v): v is string => Boolean(v));
  const [sectors, urgencies, assignees] = await Promise.all([
    distinct(prospectSubmissions.sector),
    distinct(prospectSubmissions.urgency),
    distinct(prospectSubmissions.assignedTo),
  ]);
  return { sectors, urgencies, assignees };
}

export async function getProspectSubmission(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const submission = await db
    .select()
    .from(prospectSubmissions)
    .where(eq(prospectSubmissions.id, id))
    .limit(1);
  if (!submission[0]) return undefined;
  const [responses, activities] = await Promise.all([
    db
      .select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.submissionId, id)),
    db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.submissionId, id))
      .orderBy(desc(leadActivities.createdAt), desc(leadActivities.id)),
  ]);
  return { ...submission[0], responses, activities };
}

export async function updateSubmissionStatus(
  id: number,
  status: Status,
  author: string
) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  return db.transaction(async tx => {
    const current = await tx
      .select({ status: prospectSubmissions.status })
      .from(prospectSubmissions)
      .where(eq(prospectSubmissions.id, id))
      .limit(1);
    if (!current[0]) return false;
    if (current[0].status === status) return true;
    await tx
      .update(prospectSubmissions)
      .set({ status })
      .where(eq(prospectSubmissions.id, id));
    await tx
      .insert(leadActivities)
      .values({
        submissionId: id,
        type: "status",
        body: `${current[0].status} → ${status}`,
        author,
      });
    return true;
  });
}

/** Responsible person and next step; logs an activity when the assignee changes. */
export async function updateFollowUp(
  input: {
    id: number;
    assignedTo?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  },
  author: string
) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  return db.transaction(async tx => {
    const current = await tx
      .select({ assignedTo: prospectSubmissions.assignedTo })
      .from(prospectSubmissions)
      .where(eq(prospectSubmissions.id, input.id))
      .limit(1);
    if (!current[0]) return false;
    const set: Partial<typeof prospectSubmissions.$inferInsert> = {};
    if (input.assignedTo !== undefined)
      set.assignedTo = input.assignedTo || null;
    if (input.nextAction !== undefined)
      set.nextAction = input.nextAction || null;
    if (input.nextActionAt !== undefined)
      set.nextActionAt = input.nextActionAt
        ? new Date(input.nextActionAt)
        : null;
    if (Object.keys(set).length)
      await tx
        .update(prospectSubmissions)
        .set(set)
        .where(eq(prospectSubmissions.id, input.id));
    const before = current[0].assignedTo || null;
    if (
      input.assignedTo !== undefined &&
      (input.assignedTo || null) !== before
    ) {
      await tx.insert(leadActivities).values({
        submissionId: input.id,
        type: "assignment",
        body: input.assignedTo
          ? `Asignado a ${input.assignedTo}`
          : "Sin responsable",
        author,
      });
    }
    return true;
  });
}

/** Note or contact. Contacts (call/email/meeting) also stamp lastContactAt. */
export async function addLeadActivity(
  input: {
    id: number;
    type: "note" | "call" | "email" | "meeting";
    body: string;
  },
  author: string
) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  return db.transaction(async tx => {
    const exists = await tx
      .select({ id: prospectSubmissions.id })
      .from(prospectSubmissions)
      .where(eq(prospectSubmissions.id, input.id))
      .limit(1);
    if (!exists[0]) return false;
    await tx
      .insert(leadActivities)
      .values({
        submissionId: input.id,
        type: input.type,
        body: input.body,
        author,
      });
    if (input.type !== "note")
      await tx
        .update(prospectSubmissions)
        .set({ lastContactAt: new Date() })
        .where(eq(prospectSubmissions.id, input.id));
    return true;
  });
}

/** Rows for CSV export (same filters as the list; hard cap). Interlocutors are never exported. */
export async function exportProspects(filters: ListFilters, cap = 5000) {
  const db = await getDb();
  if (!db)
    return {
      rows: [],
      domainAverages: new Map<number, Map<string, number>>(),
      truncated: false,
    };
  const rows = await db
    .select({
      ...listColumns,
      employeeRange: prospectSubmissions.employeeRange,
      state: prospectSubmissions.state,
      workEmail: prospectSubmissions.workEmail,
      phone: prospectSubmissions.phone,
      primaryConcern: prospectSubmissions.primaryConcern,
      businessImpact: prospectSubmissions.businessImpact,
    })
    .from(prospectSubmissions)
    .where(buildProspectWhere(filters))
    .orderBy(desc(prospectSubmissions.createdAt))
    .limit(cap + 1);
  const truncated = rows.length > cap;
  const kept = rows.slice(0, cap);
  const domainAverages = new Map<number, Map<string, number>>();
  if (kept.length) {
    const ids = kept.map(row => row.id);
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      const averages = await db
        .select({
          submissionId: assessmentResponses.submissionId,
          domain: assessmentResponses.domain,
          value: avg(assessmentResponses.score),
        })
        .from(assessmentResponses)
        .where(
          and(
            inArray(assessmentResponses.submissionId, chunk),
            eq(assessmentResponses.isNotApplicable, false)
          )
        )
        .groupBy(assessmentResponses.submissionId, assessmentResponses.domain);
      for (const row of averages) {
        if (row.value === null) continue;
        const map =
          domainAverages.get(row.submissionId) ?? new Map<string, number>();
        map.set(row.domain, Number(row.value));
        domainAverages.set(row.submissionId, map);
      }
    }
  }
  return { rows: kept, domainAverages, truncated };
}

/** Aggregates for the dashboard. Counts and averages only, no personal data. */
export async function getDashboard(now = new Date()) {
  const db = await getDb();
  if (!db) return null;
  const p = prospectSubmissions;
  const since = new Date(
    now.getTime() - 12 * 7 * 24 * 3600_000 - 7 * 24 * 3600_000
  );
  const [
    byStatus,
    bySector,
    byUrgency,
    overall,
    recent,
    byDomain,
    followUp,
    firstContacts,
  ] = await Promise.all([
    db.select({ key: p.status, n: count() }).from(p).groupBy(p.status),
    db
      .select({ key: p.sector, n: count(), score: avg(p.overallScore) })
      .from(p)
      .groupBy(p.sector)
      .orderBy(desc(count()))
      .limit(12),
    db
      .select({ key: p.urgency, n: count() })
      .from(p)
      .groupBy(p.urgency)
      .orderBy(desc(count())),
    db.select({ n: count(), score: avg(p.overallScore) }).from(p),
    db
      .select({ createdAt: p.createdAt })
      .from(p)
      .where(gte(p.createdAt, since)),
    db
      .select({
        key: assessmentResponses.domain,
        score: avg(assessmentResponses.score),
      })
      .from(assessmentResponses)
      .where(eq(assessmentResponses.isNotApplicable, false))
      .groupBy(assessmentResponses.domain),
    db
      .select({
        overdue: sql<number>`sum(case when ${p.nextActionAt} < ${now} and ${p.status} not in ('qualified','archived') then 1 else 0 end)`,
        unassignedNew: sql<number>`sum(case when ${p.status} = 'new' and (${p.assignedTo} is null or ${p.assignedTo} = '') then 1 else 0 end)`,
      })
      .from(p),
    db
      .select({
        createdAt: p.createdAt,
        first: sql<Date>`min(${leadActivities.createdAt})`,
      })
      .from(p)
      .innerJoin(
        leadActivities,
        and(
          eq(leadActivities.submissionId, p.id),
          inArray(leadActivities.type, ["call", "email", "meeting"])
        )
      )
      .groupBy(p.id, p.createdAt),
  ]);
  const hoursToFirstContact = firstContacts
    .map(
      row =>
        (new Date(row.first).getTime() - new Date(row.createdAt).getTime()) /
        3600_000
    )
    .filter(hours => Number.isFinite(hours) && hours >= 0);
  const num = (value: unknown) =>
    value === null || value === undefined ? null : Number(value);
  return {
    total: Number(overall[0]?.n ?? 0),
    averageScore:
      num(overall[0]?.score) === null ? null : num(overall[0]?.score)! / 100,
    byStatus: Object.fromEntries(byStatus.map(row => [row.key, Number(row.n)])),
    bySector: bySector.map(row => ({
      key: row.key,
      count: Number(row.n),
      averageScore: num(row.score) === null ? null : num(row.score)! / 100,
    })),
    byUrgency: byUrgency.map(row => ({ key: row.key, count: Number(row.n) })),
    byDomain: byDomain.map(row => ({
      key: row.key,
      averageScore: num(row.score),
    })),
    weekly: weeklySeries(
      recent.map(row => new Date(row.createdAt)),
      12,
      now
    ),
    overdue: Number(followUp[0]?.overdue ?? 0),
    unassignedNew: Number(followUp[0]?.unassignedNew ?? 0),
    medianHoursToFirstContact: median(hoursToFirstContact),
    contactedWithLog: hoursToFirstContact.length,
  };
}

/** Hard delete for deletion/cancellation requests. Answers go with it (explicitly and via FK cascade). */
export async function deleteProspectSubmission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  return db.transaction(async tx => {
    await tx
      .delete(assessmentResponses)
      .where(eq(assessmentResponses.submissionId, id));
    const result = await tx
      .delete(prospectSubmissions)
      .where(eq(prospectSubmissions.id, id));
    return Number(result[0].affectedRows) > 0;
  });
}

/** Readiness probe: true when the database answers a trivial query. */
export async function pingDb() {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
