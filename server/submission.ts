import { z } from "zod";
import { domains, totalQuestions } from "@shared/assessment";

/**
 * Server-side contract for the public assessment submission.
 *
 * The browser is not trusted: answers are checked against the same catalog the
 * UI renders (46 questions / 11 domains), the overall score is recomputed here,
 * and any client-supplied `overallScore` is ignored.
 */

const questionDomain = new Map<string, string>(
  domains.flatMap(domain =>
    domain.questions.map(question => [question.id, domain.id] as const)
  )
);

export const PRIORITY_VALUES = ["Alta", "Media", "Baja"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();

/** Only absolute http(s) URLs. `z.url()` alone also accepts `javascript:`. */
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine(value => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        Boolean(url.hostname)
      );
    } catch {
      return false;
    }
  }, "El sitio web debe ser una URL http(s) completa.");

const answerSchema = z
  .object({
    domain: z.string().min(1).max(120),
    questionId: z.string().min(1).max(32),
    score: z.number().int().min(0).max(5).nullable().optional(),
    isNotApplicable: z.boolean(),
    priority: z.enum(PRIORITY_VALUES).or(z.literal("")).optional(),
    responsibleRole: optionalText(255),
    processSystem: optionalText(255),
    comments: optionalText(2000),
  })
  .superRefine((answer, ctx) => {
    const hasScore = answer.score !== null && answer.score !== undefined;
    if (answer.isNotApplicable && hasScore) {
      ctx.addIssue({
        code: "custom",
        message: "Una respuesta N/A no puede tener puntaje.",
        path: ["score"],
      });
    }
    if (!answer.isNotApplicable && !hasScore) {
      ctx.addIssue({
        code: "custom",
        message: "Cada pregunta requiere un nivel 0–5 o N/A.",
        path: ["score"],
      });
    }
  });

export const leadSchema = z
  .object({
    companyName: z.string().trim().min(2).max(255),
    legalName: optionalText(255),
    website: httpUrl.or(z.literal("")).optional(),
    sector: z.string().trim().min(1).max(120),
    employeeRange: z.string().trim().min(1).max(40),
    state: z.string().trim().min(2).max(120),
    city: optionalText(120),
    systems: optionalText(2000),
    keyProcesses: optionalText(2000),
    criticalData: optionalText(2000),
    interlocutors: z
      .array(
        z.object({
          fullName: optionalText(255),
          jobTitle: optionalText(255),
          area: optionalText(255),
          email: z
            .string()
            .trim()
            .email()
            .max(320)
            .or(z.literal(""))
            .optional(),
          phone: optionalText(64),
          responsibility: optionalText(120),
        })
      )
      .max(3)
      .optional(),
    fullName: z.string().trim().min(3).max(255),
    jobTitle: z.string().trim().min(2).max(255),
    area: optionalText(255),
    workEmail: z.string().trim().toLowerCase().email().max(320),
    phone: optionalText(64),
    preferredChannel: optionalText(40),
    decisionRole: optionalText(40),
    primaryConcern: z.string().trim().min(10).max(2000),
    businessImpact: z.string().trim().min(1).max(40),
    urgency: z.string().trim().min(1).max(40),
    upcomingProject: optionalText(2000),
    expectedOutcome: optionalText(2000),
    consent: z.literal(true),
    /** Accepted for backwards compatibility with older clients; ignored. */
    overallScore: z.number().optional(),
    responses: z.array(answerSchema).length(totalQuestions),
  })
  .superRefine((lead, ctx) => {
    const seen = new Set<string>();
    lead.responses.forEach((answer, index) => {
      const expectedDomain = questionDomain.get(answer.questionId);
      if (!expectedDomain) {
        ctx.addIssue({
          code: "custom",
          message: "Pregunta desconocida.",
          path: ["responses", index, "questionId"],
        });
      } else if (expectedDomain !== answer.domain) {
        ctx.addIssue({
          code: "custom",
          message: "La pregunta no pertenece a ese dominio.",
          path: ["responses", index, "domain"],
        });
      }
      if (seen.has(answer.questionId)) {
        ctx.addIssue({
          code: "custom",
          message: "Pregunta duplicada.",
          path: ["responses", index, "questionId"],
        });
      }
      seen.add(answer.questionId);
    });
  });

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Simple average of the 0–5 answers (N/A excluded) ×100, rounded — the same
 * convention the UI uses to display "x.x / 5". Returns null when every answer
 * is N/A so the admin panel shows "—" instead of a misleading 0.
 */
export function computeOverallScore(
  responses: Array<{ score?: number | null; isNotApplicable: boolean }>
): number | null {
  const scored = responses
    .filter(r => !r.isNotApplicable && typeof r.score === "number")
    .map(r => r.score as number);
  if (!scored.length) return null;
  return Math.round(
    (scored.reduce((sum, value) => sum + value, 0) / scored.length) * 100
  );
}

const emptyToUndefined = <T extends string | undefined>(value: T) =>
  value ? value : undefined;

/** Normalizes a validated lead into the shape persisted by `createProspectSubmission`. */
export function toSubmissionRecord(
  input: LeadInput,
  privacyNoticeVersion: string | undefined
) {
  const { overallScore: _ignored, responses, interlocutors, ...lead } = input;
  return {
    ...lead,
    legalName: emptyToUndefined(lead.legalName),
    website: emptyToUndefined(lead.website),
    city: emptyToUndefined(lead.city),
    systems: emptyToUndefined(lead.systems),
    keyProcesses: emptyToUndefined(lead.keyProcesses),
    criticalData: emptyToUndefined(lead.criticalData),
    area: emptyToUndefined(lead.area),
    phone: emptyToUndefined(lead.phone),
    preferredChannel: emptyToUndefined(lead.preferredChannel),
    decisionRole: emptyToUndefined(lead.decisionRole),
    upcomingProject: emptyToUndefined(lead.upcomingProject),
    expectedOutcome: emptyToUndefined(lead.expectedOutcome),
    interlocutors: interlocutors?.filter(interlocutor =>
      Object.values(interlocutor).some(Boolean)
    ),
    overallScore: computeOverallScore(responses),
    privacyNoticeVersion: privacyNoticeVersion || undefined,
    responses: responses.map(response => ({
      domain: response.domain,
      questionId: response.questionId,
      isNotApplicable: response.isNotApplicable,
      score: response.isNotApplicable ? null : (response.score ?? null),
      priority: emptyToUndefined(response.priority),
      responsibleRole: emptyToUndefined(response.responsibleRole),
      processSystem: emptyToUndefined(response.processSystem),
      comments: emptyToUndefined(response.comments),
    })),
  };
}
