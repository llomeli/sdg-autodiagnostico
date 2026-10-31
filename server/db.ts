import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assessmentResponses,
  InsertUser,
  prospectSubmissions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

/** List view: only the columns the panel shows (data minimisation). */
export async function listProspectSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: prospectSubmissions.id,
      fullName: prospectSubmissions.fullName,
      companyName: prospectSubmissions.companyName,
      jobTitle: prospectSubmissions.jobTitle,
      overallScore: prospectSubmissions.overallScore,
      status: prospectSubmissions.status,
      createdAt: prospectSubmissions.createdAt,
    })
    .from(prospectSubmissions)
    .orderBy(desc(prospectSubmissions.createdAt))
    .limit(1000);
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
  const responses = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.submissionId, id));
  return { ...submission[0], responses };
}

export async function updateSubmissionStatus(
  id: number,
  status: "new" | "reviewing" | "contacted" | "qualified" | "archived"
) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  await db
    .update(prospectSubmissions)
    .set({ status })
    .where(eq(prospectSubmissions.id, id));
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
