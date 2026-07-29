import { describe, expect, it } from "vitest";
import {
  COMMON_FACTORS,
  JOURNEY_PRESETS,
  buildFactorTable,
  categoryById,
  convert,
  fmt,
  formatDuration,
  journeyTimeSeconds,
  searchFactors,
  unitById,
} from "../src/lessons/unitConversions";

const mile = unitById("length", "mi");
const km = unitById("length", "km");
const metre = unitById("length", "m");
const mph = unitById("speed", "mph");
const kmh = unitById("speed", "kmh");
const mps = unitById("speed", "mps");

describe("journeyTimeSeconds", () => {
  it("divides matching units without needing a conversion", () => {
    // 10 miles at 30 mph is a third of an hour.
    expect(journeyTimeSeconds(10, mile, 30, mph)).toBeCloseTo(1200, 6);
    expect(journeyTimeSeconds(400, metre, 8, mps)).toBeCloseTo(50, 9);
  });

  it("reduces mixed units to base units before dividing", () => {
    // 26.2 mi = 42164.8128 m; 10 km/h = 10/3.6 = 2.7778 m/s → about 4 hours 13 minutes.
    const seconds = journeyTimeSeconds(26.2, mile, 10, kmh);
    expect(seconds).toBeCloseTo((26.2 * 1609.344) / (10 / 3.6), 6);
    expect(seconds / 3600).toBeCloseTo(4.2165, 3);
  });

  it("agrees with converting the distance first", () => {
    const direct = journeyTimeSeconds(10, mile, 30, mph);
    const viaKm = journeyTimeSeconds(convert(mile, km, 10), km, 30, mph);
    expect(viaKm).toBeCloseTo(direct, 6);
  });

  it("scales inversely with speed and linearly with distance", () => {
    const base = journeyTimeSeconds(10, mile, 30, mph);
    expect(journeyTimeSeconds(20, mile, 30, mph)).toBeCloseTo(base * 2, 6);
    expect(journeyTimeSeconds(10, mile, 60, mph)).toBeCloseTo(base / 2, 6);
  });

  it("returns NaN when the journey has no answer", () => {
    expect(journeyTimeSeconds(10, mile, 0, mph)).toBeNaN();
    expect(journeyTimeSeconds(10, mile, -5, mph)).toBeNaN();
    expect(journeyTimeSeconds(-10, mile, 30, mph)).toBeNaN();
    expect(journeyTimeSeconds(NaN, mile, 30, mph)).toBeNaN();
    expect(journeyTimeSeconds(10, mile, NaN, mph)).toBeNaN();
  });

  it("treats a zero-length journey as instant", () => {
    expect(journeyTimeSeconds(0, mile, 30, mph)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("writes durations the way a person would say them", () => {
    expect(formatDuration(0)).toBe("0 s");
    expect(formatDuration(50)).toBe("50 s");
    expect(formatDuration(1200)).toBe("20 min");
    expect(formatDuration(3600)).toBe("1 hr");
    expect(formatDuration(4350)).toBe("1 hr 12 min 30 s");
    expect(formatDuration(90000)).toBe("1 day 1 hr");
    expect(formatDuration(180000)).toBe("2 days 2 hr");
  });

  it("keeps precision below a second instead of collapsing to zero", () => {
    expect(formatDuration(0.25)).toBe("0.25 s");
  });

  it("caps at three terms so an estimate stays readable", () => {
    // 1 day, 1 hr, 1 min, 1 s — the seconds are dropped as noise.
    expect(formatDuration(90061)).toBe("1 day 1 hr 1 min");
  });

  it("rejects impossible durations", () => {
    expect(formatDuration(NaN)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(Infinity)).toBe("—");
  });
});

describe("journey presets", () => {
  it("reference real units and produce sensible times", () => {
    for (const preset of JOURNEY_PRESETS) {
      const distanceUnit = unitById("length", preset.distanceUnitId);
      const speedUnit = unitById("speed", preset.speedUnitId);
      const seconds = journeyTimeSeconds(preset.distance, distanceUnit, preset.speed, speedUnit);
      expect(seconds, `${preset.label} has no finite journey time`).toBeGreaterThan(0);
      expect(Number.isFinite(seconds)).toBe(true);
      expect(preset.note.length).toBeGreaterThan(20);
    }
  });

  it("opens on the 10 miles at 30 mph example", () => {
    const first = JOURNEY_PRESETS[0];
    expect(first.distance).toBe(10);
    expect(first.distanceUnitId).toBe("mi");
    expect(first.speed).toBe(30);
    expect(first.speedUnitId).toBe("mph");
  });

  it("covers a knot journey, where one knot is one nautical mile per hour", () => {
    const nmi = unitById("length", "nmi");
    const knot = unitById("speed", "kn");
    // 480 knots for 3500 nautical miles ≈ 3500/480 hours.
    const hours = journeyTimeSeconds(3500, nmi, 480, knot) / 3600;
    expect(hours).toBeCloseTo(3500 / 480, 2);
  });
});

describe("unit lookup helpers", () => {
  it("finds categories and units by id", () => {
    expect(categoryById("length").base).toBe("m");
    expect(unitById("speed", "mph").factor).toBeCloseTo(0.44704, 9);
  });

  it("throws on a typo rather than silently using the wrong unit", () => {
    expect(() => categoryById("lenght")).toThrow(/Unknown unit category/);
    expect(() => unitById("length", "furlong")).toThrow(/Unknown unit/);
  });
});

describe("common conversion factor lookup", () => {
  const rows = buildFactorTable();

  it("builds a row for every curated pair", () => {
    expect(rows).toHaveLength(COMMON_FACTORS.length);
    expect(rows.length).toBeGreaterThan(30);
  });

  it("names only units that actually exist", () => {
    // buildFactorTable throws on an unknown id, so reaching this point proves the ids
    // resolve; the assertion pins the failure message if that ever regresses.
    expect(() => buildFactorTable()).not.toThrow();
    for (const row of rows) {
      expect(() => unitById(row.categoryId, row.fromUnitId)).not.toThrow();
      expect(() => unitById(row.categoryId, row.toUnitId)).not.toThrow();
    }
  });

  it("derives values from the same engine as the converter, so they cannot drift", () => {
    for (const row of rows) {
      const from = unitById(row.categoryId, row.fromUnitId);
      const to = unitById(row.categoryId, row.toUnitId);
      expect(row.to).toBe(`${fmt(convert(from, to, 1))} ${to.symbol}`);
      expect(row.from).toBe(`1 ${from.symbol}`);
    }
  });

  it("states the reverse as the reciprocal reading", () => {
    const mile = rows.find((r) => r.fromUnitId === "mi" && r.toUnitId === "km")!;
    expect(mile.to).toBe("1.60934 km");
    expect(mile.reverse).toBe("1 km = 0.621371 mi");
    expect(mile.exact).toBe(true);
  });

  it("gets the headline everyday factors right", () => {
    const byPair = (from: string, to: string) =>
      rows.find((r) => r.fromUnitId === from && r.toUnitId === to)!;
    expect(byPair("mps", "kmh").to).toBe("3.6 km/h");
    expect(byPair("in", "cm").to).toBe("2.54 cm");
    expect(byPair("hr", "s").to).toBe("3600 s");
    expect(byPair("B", "bit").to).toBe("8 bit");
    expect(byPair("KiB", "B").to).toBe("1024 B");
    expect(byPair("ha", "m2").to).toBe("10000 m²");
    expect(byPair("kcal", "J").to).toBe("4184 J");
  });

  it("marks defined relationships exact and measured ones approximate", () => {
    const inch = rows.find((r) => r.fromUnitId === "in")!;
    const horsepower = rows.find((r) => r.fromUnitId === "hp")!;
    expect(inch.exact).toBe(true);
    expect(horsepower.exact).toBe(false);
    // The sheet is worth having only if most of it is memorable, defined fact.
    expect(rows.filter((r) => r.exact).length).toBeGreaterThan(rows.length / 2);
  });

  it("gives every row a memory hook and a category label", () => {
    for (const row of rows) {
      expect(row.hint, `${row.from} -> ${row.to} has no hint`).toBeTruthy();
      expect(row.hint!.length).toBeGreaterThan(15);
      expect(row.categoryLabel).toBeTruthy();
    }
  });

  it("groups rows so each category appears in one contiguous block", () => {
    const seen = new Set<string>();
    let previous = "";
    for (const row of rows) {
      if (row.categoryId !== previous) {
        expect(seen.has(row.categoryId), `${row.categoryId} is split across the table`).toBe(false);
        seen.add(row.categoryId);
        previous = row.categoryId;
      }
    }
  });

  it("searches on symbols, labels, categories and hints", () => {
    expect(searchFactors(rows, "").length).toBe(rows.length);
    expect(searchFactors(rows, "   ").length).toBe(rows.length);

    const miles = searchFactors(rows, "mile");
    expect(miles.length).toBeGreaterThan(0);
    expect(miles.every((r) => r.search.includes("mile"))).toBe(true);

    expect(searchFactors(rows, "pressure").every((r) => r.categoryId === "pressure")).toBe(true);
    expect(searchFactors(rows, "KG").length).toBeGreaterThan(0); // case-insensitive
    expect(searchFactors(rows, "zzzz")).toHaveLength(0);
  });

  it("treats multiple search terms as AND, in any order", () => {
    const both = searchFactors(rows, "mile kilometre");
    expect(both.length).toBeGreaterThan(0);
    expect(searchFactors(rows, "kilometre mile").length).toBe(both.length);
    for (const row of both) {
      expect(row.search).toContain("mile");
      expect(row.search).toContain("kilometre");
    }
  });

  it("has no duplicate pairs", () => {
    const keys = rows.map((r) => `${r.categoryId}:${r.fromUnitId}->${r.toUnitId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
