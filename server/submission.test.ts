import { describe, expect, it } from "vitest";
import { domains } from "@shared/assessment";
import {
  computeOverallScore,
  leadSchema,
  toSubmissionRecord,
} from "./submission";

const allAnswers = (score: number | null = 3) =>
  domains.flatMap(domain =>
    domain.questions.map(question => ({
      domain: domain.id,
      questionId: question.id,
      score,
      isNotApplicable: score === null,
    }))
  );

const validLead = (overrides: Record<string, unknown> = {}) => ({
  companyName: "Empresa Sintética",
  sector: "Retail",
  employeeRange: "51-250",
  state: "CDMX",
  fullName: "Persona Sintética",
  jobTitle: "CDO",
  workEmail: "QA+synthetic@Example.com",
  primaryConcern: "Calidad de datos inconsistente",
  businessImpact: "Costos y eficiencia",
  urgency: "Media — relevante este año",
  consent: true,
  responses: allAnswers(),
  ...overrides,
});

describe("public submission contract (server-side)", () => {
  it("accepts a complete, catalog-consistent submission", () => {
    expect(leadSchema.safeParse(validLead()).success).toBe(true);
  });

  it("rejects submissions that do not answer exactly the 46 catalog questions", () => {
    expect(
      leadSchema.safeParse(validLead({ responses: allAnswers().slice(0, 45) }))
        .success
    ).toBe(false);
    const fake = allAnswers();
    fake[0] = { ...fake[0], questionId: "FAKE-01" };
    expect(leadSchema.safeParse(validLead({ responses: fake })).success).toBe(
      false
    );
  });

  it("rejects duplicated questions and questions filed under another domain", () => {
    const duplicated = allAnswers();
    duplicated[1] = { ...duplicated[0] };
    expect(
      leadSchema.safeParse(validLead({ responses: duplicated })).success
    ).toBe(false);

    const wrongDomain = allAnswers();
    wrongDomain[0] = { ...wrongDomain[0], domain: "Metadatos" };
    expect(
      leadSchema.safeParse(validLead({ responses: wrongDomain })).success
    ).toBe(false);
  });

  it("rejects contradictory answers (N/A with a score, or neither)", () => {
    const both = allAnswers();
    both[0] = { ...both[0], score: 5, isNotApplicable: true };
    expect(leadSchema.safeParse(validLead({ responses: both })).success).toBe(
      false
    );

    const neither = allAnswers();
    neither[0] = { ...neither[0], score: null, isNotApplicable: false };
    expect(
      leadSchema.safeParse(validLead({ responses: neither })).success
    ).toBe(false);
  });

  it("only accepts http(s) websites", () => {
    expect(
      leadSchema.safeParse(validLead({ website: "https://empresa.mx" })).success
    ).toBe(true);
    expect(leadSchema.safeParse(validLead({ website: "" })).success).toBe(true);
    expect(
      leadSchema.safeParse(validLead({ website: "javascript:alert(1)//" }))
        .success
    ).toBe(false);
    expect(
      leadSchema.safeParse(validLead({ website: "data:text/html,hi" })).success
    ).toBe(false);
  });

  it("rejects values longer than their database columns", () => {
    const longDomain = allAnswers();
    longDomain[0] = { ...longDomain[0], domain: "D".repeat(300) };
    expect(
      leadSchema.safeParse(validLead({ responses: longDomain })).success
    ).toBe(false);
    expect(
      leadSchema.safeParse(validLead({ urgency: "U".repeat(41) })).success
    ).toBe(false);
  });

  it("requires explicit consent", () => {
    expect(leadSchema.safeParse(validLead({ consent: false })).success).toBe(
      false
    );
  });
});

describe("overall score", () => {
  it("is the simple average ×100 excluding N/A", () => {
    expect(
      computeOverallScore([
        { score: 5, isNotApplicable: false },
        { score: 2, isNotApplicable: false },
        { score: null, isNotApplicable: true },
      ])
    ).toBe(350);
  });

  it("is null when every answer is N/A", () => {
    expect(
      computeOverallScore([{ score: null, isNotApplicable: true }])
    ).toBeNull();
  });

  it("ignores a forged client score and records the privacy-notice version", () => {
    const parsed = leadSchema.parse(
      validLead({ overallScore: 500, responses: allAnswers(0) })
    );
    const record = toSubmissionRecord(parsed, "AP-2026-11");
    expect(record.overallScore).toBe(0);
    expect(record.privacyNoticeVersion).toBe("AP-2026-11");
    expect(record.workEmail).toBe("qa+synthetic@example.com");
    expect(record.responses).toHaveLength(46);
    expect("overallScore" in parsed && record.overallScore !== 500).toBe(true);
  });
});
