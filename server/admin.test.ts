import { afterEach, describe, expect, it, vi } from "vitest";
import {
  actorFrom,
  csvCell,
  dayStart,
  exportHeader,
  likePattern,
  listInputSchema,
  median,
  toCsv,
  weekKey,
  weeklySeries,
} from "./admin";

describe("admin list contract", () => {
  it("applies safe defaults and caps the page size", () => {
    expect(listInputSchema.parse({})).toMatchObject({
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 25,
    });
    expect(listInputSchema.safeParse({ pageSize: 500 }).success).toBe(false);
    expect(listInputSchema.safeParse({ sort: "workEmail" }).success).toBe(
      false
    );
    expect(listInputSchema.safeParse({ from: "31/10/2026" }).success).toBe(
      false
    );
  });

  it("escapes LIKE wildcards in searches", () => {
    expect(likePattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });

  it("interprets filter dates as Mexico City days", () => {
    expect(dayStart("2026-10-31").toISOString()).toBe(
      "2026-10-31T06:00:00.000Z"
    );
  });
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(
      '"\'=HYPERLINK(""http://x"")"'
    );
    expect(csvCell("+52 55 1234")).toBe("'+52 55 1234");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-1")).toBe("'-1");
  });

  it("quotes separators and line breaks and keeps accents with a BOM", () => {
    expect(csvCell("Hola, mundo")).toBe('"Hola, mundo"');
    expect(csvCell("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
    const csv = toCsv(["Empresa"], [["Química Ñandú"]]);
    expect(csv.startsWith("﻿Empresa\r\n")).toBe(true);
    expect(csv).toContain("Química Ñandú");
  });

  it("includes one column per assessment domain and never interlocutors", () => {
    const header = exportHeader();
    expect(header.filter(column => column.startsWith("Dominio:"))).toHaveLength(
      11
    );
    expect(header.join(" ").toLowerCase()).not.toContain("interlocutor");
  });
});

describe("dashboard maths", () => {
  it("groups dates into Monday-based weeks in Mexico City time", () => {
    // Monday 2026-10-26 00:30 in Mexico City = 06:30Z
    expect(weekKey(new Date("2026-10-26T06:30:00Z"))).toBe("2026-10-26");
    // Sunday 2026-10-25 23:30 in Mexico City = 2026-10-26T05:30Z -> previous week
    expect(weekKey(new Date("2026-10-26T05:30:00Z"))).toBe("2026-10-19");
  });

  it("builds a continuous weekly series ending in the current week", () => {
    const now = new Date("2026-10-31T18:00:00Z");
    const series = weeklySeries(
      [
        new Date("2026-10-27T18:00:00Z"),
        new Date("2026-10-28T18:00:00Z"),
        new Date("2026-10-14T18:00:00Z"),
      ],
      4,
      now
    );
    expect(series.map(point => point.week)).toEqual([
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
    expect(series.map(point => point.count)).toEqual([0, 1, 0, 2]);
  });

  it("computes medians", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("actor attribution", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ignores IAP headers unless explicitly trusted", () => {
    const req = {
      headers: {
        "x-goog-authenticated-user-email":
          "accounts.google.com:Ana@Metricaas.com",
      },
    };
    expect(actorFrom(req as any, "admin")).toBe("admin");
    vi.stubEnv("TRUST_IAP_HEADERS", "true");
    expect(actorFrom(req as any, "admin")).toBe("ana@metricaas.com");
    expect(actorFrom({ headers: {} } as any, "admin")).toBe("admin");
  });
});

describe("export dates", () => {
  it("are written in Mexico City time", async () => {
    const { exportRow } = await import("./admin");
    const row = exportRow(
      { createdAt: new Date("2026-10-31T18:11:00Z"), overallScore: 241 },
      new Map()
    );
    expect(row[1]).toBe("2026-10-31 12:11");
    expect(row[13]).toBe("2.41");
  });
});
