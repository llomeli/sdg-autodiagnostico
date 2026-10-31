import { beforeAll, describe, expect, it } from "vitest";
import { domains } from "@shared/assessment";

/**
 * Integration tests against a real MySQL. Run only when TEST_DATABASE_URL points to a
 * database whose name ends in "_test" (they wipe its tables), e.g. in CI:
 *   TEST_DATABASE_URL=mysql://app:pass@127.0.0.1:3306/sdg_test pnpm test
 */
const url = process.env.TEST_DATABASE_URL ?? "";
const enabled = /\/[A-Za-z0-9_]+_test(\?|$)/.test(url);

describe.skipIf(!enabled)("admin portal against MySQL", () => {
  let db: typeof import("./db");
  let ids: number[] = [];

  const answers = (score: number | null) =>
    domains.flatMap(domain =>
      domain.questions.map(question => ({
        domain: domain.id,
        questionId: question.id,
        score,
        isNotApplicable: score === null,
      }))
    );

  const lead = (over: Record<string, unknown>) => ({
    companyName: "Empresa",
    sector: "Retail",
    employeeRange: "51-250",
    state: "CDMX",
    fullName: "Persona Prueba",
    jobTitle: "CDO",
    workEmail: "qa@example.com",
    primaryConcern: "Calidad de datos inconsistente",
    businessImpact: "Costos",
    urgency: "Alta",
    consent: true as const,
    responses: answers(3),
    ...over,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const { runMigrations } = await import("./_core/migrate");
    await runMigrations(() => undefined);
    db = await import("./db");
    const conn = await db.getDb();
    const { sql } = await import("drizzle-orm");
    for (const table of [
      "lead_activities",
      "assessment_responses",
      "prospect_submissions",
    ]) {
      await conn!.execute(sql.raw(`delete from \`${table}\``));
    }
    const { leadSchema, toSubmissionRecord } = await import("./submission");
    const make = (over: Record<string, unknown>) =>
      db.createProspectSubmission(
        toSubmissionRecord(leadSchema.parse(lead(over)), "test")
      );
    ids = [
      await make({
        companyName: "Alfa 100% Datos",
        sector: "Retail",
        urgency: "Alta",
        responses: answers(1),
      }),
      await make({
        companyName: "Beta Manufactura",
        sector: "Manufactura",
        urgency: "Media",
        workEmail: "beta@example.com",
        responses: answers(4),
      }),
      await make({
        companyName: "Gamma Salud",
        sector: "Salud",
        urgency: "Baja",
        fullName: "Dra. Ñandú",
        responses: answers(5),
      }),
    ];
  });

  it("searches literally (wildcards escaped) and by contact name", async () => {
    const base = {
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 25,
    } as const;
    expect(
      (await db.listProspectSubmissions({ ...base, search: "100%" })).total
    ).toBe(1);
    expect(
      (await db.listProspectSubmissions({ ...base, search: "%" })).total
    ).toBe(1);
    expect(
      (await db.listProspectSubmissions({ ...base, search: "ñandú" })).rows[0]
        ?.companyName
    ).toBe("Gamma Salud");
  });

  it("filters by sector, score range and sorts with pagination", async () => {
    const base = {
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 25,
    } as const;
    expect(
      (await db.listProspectSubmissions({ ...base, sector: "Manufactura" }))
        .total
    ).toBe(1);
    expect(
      (await db.listProspectSubmissions({ ...base, scoreMin: 3.5 })).total
    ).toBe(2);
    const sorted = await db.listProspectSubmissions({
      ...base,
      sort: "overallScore",
      dir: "asc",
      pageSize: 10,
    });
    expect(sorted.rows.map(row => row.overallScore)).toEqual([100, 400, 500]);
    const paged = await db.listProspectSubmissions({
      ...base,
      sort: "overallScore",
      dir: "asc",
      page: 2,
      pageSize: 10,
    });
    expect(paged.rows).toHaveLength(0);
    expect(paged.total).toBe(3);
  });

  it("records follow-up, assignment and status history; contacts stamp lastContactAt", async () => {
    const id = ids[0]!;
    const yesterday = new Date(Date.now() - 24 * 3600_000).toISOString();
    expect(
      await db.updateFollowUp(
        {
          id,
          assignedTo: "Ana",
          nextAction: "Llamar",
          nextActionAt: yesterday,
        },
        "tester"
      )
    ).toBe(true);
    expect(await db.updateSubmissionStatus(id, "contacted", "tester")).toBe(
      true
    );
    expect(
      await db.addLeadActivity(
        { id, type: "call", body: "Interesados en piloto" },
        "tester"
      )
    ).toBe(true);
    const detail = await db.getProspectSubmission(id);
    expect(detail?.assignedTo).toBe("Ana");
    expect(detail?.lastContactAt).toBeInstanceOf(Date);
    expect(detail?.activities.map(a => a.type).sort()).toEqual([
      "assignment",
      "call",
      "status",
    ]);
    const base = {
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 25,
    } as const;
    expect(
      (
        await db.listProspectSubmissions({ ...base, followUp: "overdue" })
      ).rows.map(r => r.id)
    ).toEqual([id]);
    expect(
      (
        await db.listProspectSubmissions({
          ...base,
          assignedTo: "__sin_asignar__",
        })
      ).total
    ).toBe(2);
    expect(
      await db.addLeadActivity(
        { id: 999999, type: "note", body: "x" },
        "tester"
      )
    ).toBe(false);
  });

  it("exports filtered rows with per-domain averages", async () => {
    const out = await db.exportProspects({ sector: "Salud" });
    expect(out.rows).toHaveLength(1);
    expect(out.domainAverages.get(out.rows[0]!.id)?.get("Metadatos")).toBe(5);
  });

  it("aggregates the dashboard without personal data", async () => {
    const dash = await db.getDashboard();
    expect(dash?.total).toBe(3);
    expect(dash?.averageScore).toBeCloseTo((1 + 4 + 5) / 3, 2);
    expect(dash?.byDomain).toHaveLength(11);
    expect(dash?.overdue).toBe(1);
    expect(dash?.weekly.at(-1)?.count).toBe(3);
    expect(JSON.stringify(dash)).not.toContain("@example.com");
  });

  it("deletes activities with their submission", async () => {
    await db.deleteProspectSubmission(ids[0]!);
    expect(await db.getProspectSubmission(ids[0]!)).toBeUndefined();
    const conn = await db.getDb();
    const { sql } = await import("drizzle-orm");
    const [rows] = (await conn!.execute(
      sql`select count(*) as n from lead_activities where submissionId = ${ids[0]!}`
    )) as unknown as [Array<{ n: number }>];
    expect(Number(rows[0]?.n)).toBe(0);
  });
});
