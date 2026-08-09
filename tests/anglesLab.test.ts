import { describe, expect, it } from "vitest";
import {
  angleFromPoint,
  computeAnglesLab,
  degreeGap,
  formatDegrees,
  sectorMidDegrees,
  wrapDegrees,
} from "../src/math/anglesLab";

describe("anglesLab", () => {
  it("wraps degrees into [0, 360)", () => {
    expect(wrapDegrees(370)).toBe(10);
    expect(wrapDegrees(-10)).toBe(350);
    expect(wrapDegrees(0)).toBe(0);
  });

  it("measures complementary pairs that sum to 90°", () => {
    const result = computeAnglesLab("complementary", [30]);
    expect(result.angles[0]).toBeCloseTo(30, 5);
    expect(result.angles[1]).toBeCloseTo(60, 5);
    expect(result.total).toBeCloseTo(90, 5);
    expect(result.holds).toBe(true);
    expect(result.rays).toHaveLength(3);
  });

  it("measures supplementary and straight-line pairs that sum to 180°", () => {
    for (const mode of ["supplementary", "adjacent-straight"] as const) {
      const result = computeAnglesLab(mode, [70]);
      expect(result.angles[0] + result.angles[1]).toBeCloseTo(180, 5);
      expect(result.holds).toBe(true);
      expect(result.target).toBe(180);
    }
  });

  it("splits a full turn into three sectors around a point", () => {
    const result = computeAnglesLab("around-point", [90, 200]);
    expect(result.angles).toHaveLength(3);
    expect(result.angles.reduce((s, v) => s + v, 0)).toBeCloseTo(360, 5);
    expect(result.holds).toBe(true);
    expect(result.rays).toHaveLength(3);
  });

  it("keeps vertically opposite angles equal", () => {
    const result = computeAnglesLab("vertically-opposite", [40]);
    expect(result.angles[0]).toBeCloseTo(result.angles[2], 5);
    expect(result.angles[1]).toBeCloseTo(result.angles[3], 5);
    expect(result.angles[0] + result.angles[1]).toBeCloseTo(180, 5);
    expect(result.holds).toBe(true);
  });

  it("reports angle from a point and formats degrees", () => {
    expect(angleFromPoint({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 5);
    expect(formatDegrees(45)).toBe("45°");
    expect(degreeGap(10, 350)).toBeCloseTo(20, 5);
    expect(sectorMidDegrees(0, 90)).toBeCloseTo(45, 5);
  });
});
