import { describe, expect, it } from "vitest";
import { assessmentResponses, prospectSubmissions } from "../drizzle/schema";

describe("lead-magnet persistence schema", () => {
  it("stores the required lead, consent and additional-interlocutor fields", () => {
    expect(prospectSubmissions.companyName.notNull).toBe(true);
    expect(prospectSubmissions.fullName.notNull).toBe(true);
    expect(prospectSubmissions.workEmail.notNull).toBe(true);
    expect(prospectSubmissions.consent.notNull).toBe(true);
    expect(prospectSubmissions.interlocutors.getSQLType()).toBe("text");
  });

  it("connects individual maturity responses to a submission", () => {
    expect(assessmentResponses.submissionId.notNull).toBe(true);
    expect(assessmentResponses.questionId.notNull).toBe(true);
    expect(assessmentResponses.domain.notNull).toBe(true);
    expect(assessmentResponses.isNotApplicable.notNull).toBe(true);
  });
});
