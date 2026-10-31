import { describe, expect, it } from "vitest";
import { domains, getUnansweredQuestionIds, isValidOptionalEmail, isValidOptionalWebsite, maturityLabels, totalQuestions } from "@shared/assessment";

describe("assessment catalog", () => {
  it("keeps the eleven adapted DMBOK domains available to the public flow", () => {
    expect(domains).toHaveLength(11);
    expect(domains.map(domain => domain.id)).toEqual([
      "Gobierno de datos",
      "Arquitectura de datos",
      "Modelado y diseño",
      "Seguridad de datos",
      "Almacenamiento y operación",
      "Integración e interoperabilidad",
      "Datos maestros y referencia",
      "BI y analítica",
      "Metadatos",
      "Calidad de datos",
      "Gestión del cambio",
    ]);
  });

  it("contains forty-six uniquely identified questions", () => {
    const ids = domains.flatMap(domain => domain.questions.map(question => question.id));
    expect(totalQuestions).toBe(46);
    expect(ids).toHaveLength(46);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes the complete 0–5 maturity scale", () => {
    expect(maturityLabels.map(item => item.value)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(maturityLabels.map(item => item.label)).toEqual([
      "Nivel 0",
      "Nivel 1",
      "Nivel 2",
      "Nivel 3",
      "Nivel 4",
      "Nivel 5",
    ]);
  });

  it("treats N/A as a valid response and identifies only unanswered questions", () => {
    expect(getUnansweredQuestionIds(["Q-1", "Q-2", "Q-3"], {
      "Q-1": { score: null, isNotApplicable: false },
      "Q-2": { score: null, isNotApplicable: true },
      "Q-3": { score: 0, isNotApplicable: false },
    })).toEqual(["Q-1"]);
  });

  it("accepts empty or complete website URLs and rejects incomplete URLs", () => {
    expect(isValidOptionalWebsite("")).toBe(true);
    expect(isValidOptionalWebsite("https://empresa.com")).toBe(true);
    expect(isValidOptionalWebsite("www.empresa.com")).toBe(false);
  });

  it("accepts empty or complete optional emails and rejects malformed emails", () => {
    expect(isValidOptionalEmail("")).toBe(true);
    expect(isValidOptionalEmail("persona@empresa.com")).toBe(true);
    expect(isValidOptionalEmail("persona@empresa")).toBe(false);
  });
});
