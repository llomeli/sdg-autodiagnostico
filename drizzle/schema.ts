import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One completed public lead-magnet assessment. */
export const prospectSubmissions = mysqlTable(
  "prospect_submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    companyName: varchar("companyName", { length: 255 }).notNull(),
    legalName: varchar("legalName", { length: 255 }),
    website: varchar("website", { length: 500 }),
    sector: varchar("sector", { length: 120 }).notNull(),
    employeeRange: varchar("employeeRange", { length: 40 }).notNull(),
    state: varchar("state", { length: 120 }).notNull(),
    city: varchar("city", { length: 120 }),
    systems: text("systems"),
    keyProcesses: text("keyProcesses"),
    criticalData: text("criticalData"),
    interlocutors: text("interlocutors"),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
    area: varchar("area", { length: 255 }),
    workEmail: varchar("workEmail", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    preferredChannel: varchar("preferredChannel", { length: 40 }),
    decisionRole: varchar("decisionRole", { length: 40 }),
    primaryConcern: text("primaryConcern").notNull(),
    businessImpact: varchar("businessImpact", { length: 40 }).notNull(),
    urgency: varchar("urgency", { length: 40 }).notNull(),
    upcomingProject: text("upcomingProject"),
    expectedOutcome: text("expectedOutcome"),
    consent: boolean("consent").notNull(),
    consentAt: timestamp("consentAt").notNull(),
    /** Version/identifier of the Aviso de Privacidad shown when consent was given. */
    privacyNoticeVersion: varchar("privacyNoticeVersion", { length: 40 }),
    overallScore: int("overallScore"),
    status: mysqlEnum("status", ["new", "reviewing", "contacted", "qualified", "archived"])
      .default("new")
      .notNull(),
    source: varchar("source", { length: 80 }).default("web-autodiagnostico").notNull(),
    /** Commercial follow-up (v1.3.0). Free text so the team can assign without user accounts. */
    assignedTo: varchar("assignedTo", { length: 120 }),
    nextAction: varchar("nextAction", { length: 255 }),
    nextActionAt: timestamp("nextActionAt"),
    lastContactAt: timestamp("lastContactAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("prospect_submissions_email_idx").on(table.workEmail),
    index("prospect_submissions_created_idx").on(table.createdAt),
    index("prospect_submissions_status_idx").on(table.status),
    index("prospect_submissions_assigned_idx").on(table.assignedTo),
    index("prospect_submissions_next_action_idx").on(table.nextActionAt),
  ],
);

/** Individual answers associated with one lead-magnet submission. */
export const assessmentResponses = mysqlTable(
  "assessment_responses",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: int("submissionId")
      .notNull()
      .references(() => prospectSubmissions.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 120 }).notNull(),
    questionId: varchar("questionId", { length: 32 }).notNull(),
    score: int("score"),
    isNotApplicable: boolean("isNotApplicable").default(false).notNull(),
    priority: varchar("priority", { length: 20 }),
    responsibleRole: varchar("responsibleRole", { length: 255 }),
    processSystem: varchar("processSystem", { length: 255 }),
    comments: text("comments"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("assessment_responses_submission_idx").on(table.submissionId),
    index("assessment_responses_domain_idx").on(table.domain),
    index("assessment_responses_question_idx").on(table.questionId),
  ],
);

export const ACTIVITY_TYPES = ["note", "call", "email", "meeting", "status", "assignment"] as const;

/** Follow-up history of a submission: notes, contacts and automatic status/assignment changes. */
export const leadActivities = mysqlTable(
  "lead_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    submissionId: int("submissionId")
      .notNull()
      .references(() => prospectSubmissions.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ACTIVITY_TYPES).notNull(),
    body: text("body").notNull(),
    author: varchar("author", { length: 120 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("lead_activities_submission_idx").on(table.submissionId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ProspectSubmission = typeof prospectSubmissions.$inferSelect;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type LeadActivity = typeof leadActivities.$inferSelect;
