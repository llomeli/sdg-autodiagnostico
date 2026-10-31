import { describe, expect, it } from "vitest";
import { domains, isValidOptionalEmail, isValidOptionalWebsite, maturityLabels, totalQuestions } from "./assessment";

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
  });

  it("accepts an empty or complete http(s) website and rejects incomplete URLs", () => {
    expect(isValidOptionalWebsite("")).toBe(true);
    expect(isValidOptionalWebsite("https://empresa.com")).toBe(true);
    expect(isValidOptionalWebsite("http://www.empresa.com/contacto")).toBe(true);
    expect(isValidOptionalWebsite("www.empresa.com")).toBe(false);
    expect(isValidOptionalWebsite("empresa.com")).toBe(false);
  });

  it("accepts an empty or complete optional email and rejects malformed addresses", () => {
    expect(isValidOptionalEmail("")).toBe(true);
    expect(isValidOptionalEmail("persona@empresa.com")).toBe(true);
    expect(isValidOptionalEmail("persona@empresa")).toBe(false);
    expect(isValidOptionalEmail("persona empresa.com")).toBe(false);
  });
});
