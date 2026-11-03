import { describe, expect, it } from "vitest";
import { domains } from "@shared/assessment";
import { validateProductionEnv } from "./_core/env";
import { leadSchema, toSubmissionRecord } from "./submission";
import { exportHeader } from "./admin";

const responses = domains.flatMap(domain =>
  domain.questions.map(question => ({
    domain: domain.id,
    questionId: question.id,
    score: 3,
    isNotApplicable: false,
  }))
);
const lead = {
  companyName: "Empresa Sintética",
  sector: "Retail",
  employeeRange: "51-250",
  state: "CDMX",
  fullName: "Persona Sintética",
  jobTitle: "CDO",
  workEmail: "qa@example.com",
  primaryConcern: "Calidad de datos inconsistente",
  businessImpact: "Costos y eficiencia",
  urgency: "Media — relevante este año",
  consent: true,
  responses,
};

describe("v1.4.0 publicación", () => {
  it("public-only service does not require the admin password", () => {
    const env = {
      DATABASE_URL: "mysql://u:p@db:3306/x",
      JWT_SECRET: "a".repeat(48),
      SELF_HOSTED_MODE: "true",
      PUBLIC_SITE_ONLY: "true",
      PRIVACY_NOTICE_VERSION: "1.0",
    } as NodeJS.ProcessEnv;
    expect(validateProductionEnv(env).errors).toEqual([]);
  });

  it("marketing consent is optional and defaults to false", () => {
    const parsed = leadSchema.parse(lead);
    expect(toSubmissionRecord(parsed, "1.0").marketingConsent).toBe(false);
    const opted = leadSchema.parse({ ...lead, marketingConsent: true });
    expect(toSubmissionRecord(opted, "1.0").marketingConsent).toBe(true);
  });

  it("CSV export carries notice version and marketing consent", () => {
    expect(exportHeader()).toEqual(
      expect.arrayContaining([
        "Versión del aviso",
        "Acepta contenidos comerciales",
      ])
    );
  });
});
