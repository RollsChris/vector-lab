import { describe, expect, it } from "vitest";
import {
  amplitudePhase,
  chordState,
  discoverBeat,
  equilateralSplit30,
  evaluateCosineWave,
  formatDegrees,
  formatNumber,
  identityResidual,
  nearestSpecialAngle,
  quadrantOf,
  quadrantSigns,
  referenceAngleDeg,
  rightTriangleState,
  smallAngleCheck,
  snapToSpecial,
  solveTriangle,
  unitCircleState,
  wrapDegrees,
} from "../src/math/trigonometryLab";

describe("trigonometryLab", () => {
  it("wraps degrees into [0, 360)", () => {
    expect(wrapDegrees(0)).toBe(0);
    expect(wrapDegrees(360)).toBe(0);
    expect(wrapDegrees(-90)).toBe(270);
    expect(wrapDegrees(450)).toBe(90);
  });

  it("formats numbers without eating trailing zeros of integers", () => {
    expect(formatNumber(60, 0)).toBe("60");
    expect(formatNumber(60, 1)).toBe("60");
    expect(formatNumber(60.5, 1)).toBe("60.5");
    expect(formatNumber(1, 3)).toBe("1");
    expect(formatNumber(0.5, 3)).toBe("0.5");
    expect(formatNumber(1.25, 3)).toBe("1.25");
    expect(formatDegrees(60, 0)).toBe("60°");
    expect(formatDegrees(60, 1)).toBe("60°");
    expect(formatDegrees(30, 1)).toBe("30°");
  });

  it("derives chord length as 2 R sin(θ/2)", () => {
    const unit = chordState(60, 1);
    expect(unit.halfAngleDeg).toBe(30);
    expect(unit.sineHalf).toBeCloseTo(0.5, 10);
    expect(unit.chord).toBeCloseTo(1, 10);

    const scaled = chordState(60, 4);
    expect(scaled.chord).toBeCloseTo(4, 10);
    expect(scaled.historicalChord).toBeCloseTo(2 * 4 * Math.sin(Math.PI / 6), 10);
  });

  it("matches SOH-CAH-TOA on a 3-4-5 style right triangle", () => {
    // angle whose tan is 3/4
    const deg = (Math.atan2(3, 4) * 180) / Math.PI;
    const tri = rightTriangleState(deg, 5);
    expect(tri.opposite).toBeCloseTo(3, 8);
    expect(tri.adjacent).toBeCloseTo(4, 8);
    expect(tri.sin).toBeCloseTo(0.6, 8);
    expect(tri.cos).toBeCloseTo(0.8, 8);
    expect(tri.tan).toBeCloseTo(0.75, 8);
  });

  it("exposes unit-circle coordinates and Pythagorean identity", () => {
    const st = unitCircleState(30, 1);
    expect(st.sin).toBeCloseTo(0.5, 10);
    expect(st.cos).toBeCloseTo(Math.sqrt(3) / 2, 10);
    expect(st.x).toBeCloseTo(st.cos, 10);
    expect(st.y).toBeCloseTo(st.sin, 10);
    expect(identityResidual(30)).toBeLessThan(1e-12);
    expect(identityResidual(210)).toBeLessThan(1e-12);
  });

  it("computes reference angles and quadrant signs", () => {
    expect(quadrantOf(20)).toBe(1);
    expect(quadrantOf(100)).toBe(2);
    expect(quadrantOf(200)).toBe(3);
    expect(quadrantOf(300)).toBe(4);
    expect(referenceAngleDeg(150)).toBeCloseTo(30, 8);
    expect(referenceAngleDeg(200)).toBeCloseTo(20, 8);
    expect(quadrantSigns(90)).toEqual({ sin: 1, cos: 0, tan: null });
    expect(quadrantSigns(270)).toEqual({ sin: -1, cos: 0, tan: null });
    expect(quadrantSigns(150)).toEqual({ sin: 1, cos: -1, tan: -1 });
    expect(quadrantSigns(200)).toEqual({ sin: -1, cos: -1, tan: 1 });
    expect(quadrantSigns(300)).toEqual({ sin: -1, cos: 1, tan: -1 });
  });

  it("snaps to exact special angles", () => {
    expect(snapToSpecial(44.5, 2)).toBe(45);
    expect(nearestSpecialAngle(150).sin).toBe("1/2");
    expect(nearestSpecialAngle(150).cos).toBe("−√3/2");
    expect(nearestSpecialAngle(90).tanValue).toBeNull();
  });

  it("solves SAS, SSS and ASA triangles", () => {
    const sas = solveTriangle({ case: "SAS", a: 7, b: 10, c: NaN, A: NaN, B: NaN, C: 60 });
    expect(sas.valid).toBe(true);
    expect(sas.c).toBeCloseTo(Math.sqrt(49 + 100 - 2 * 7 * 10 * 0.5), 8);
    expect(sas.A + sas.B + sas.C).toBeCloseTo(180, 5);
    expect(sas.area).toBeCloseTo(0.5 * 7 * 10 * Math.sin(Math.PI / 3), 8);

    const sss = solveTriangle({ case: "SSS", a: 3, b: 4, c: 5, A: NaN, B: NaN, C: NaN });
    expect(sss.valid).toBe(true);
    expect(sss.C).toBeCloseTo(90, 5);
    expect(sss.area).toBeCloseTo(6, 8);

    const asa = solveTriangle({ case: "ASA", a: NaN, b: NaN, c: 10, A: 40, B: 60, C: NaN });
    expect(asa.valid).toBe(true);
    expect(asa.C).toBeCloseTo(80, 8);
    expect(asa.a / Math.sin((asa.A * Math.PI) / 180)).toBeCloseTo(
      asa.c / Math.sin((asa.C * Math.PI) / 180),
      6,
    );

    const bad = solveTriangle({ case: "SSS", a: 1, b: 2, c: 9, A: NaN, B: NaN, C: NaN });
    expect(bad.valid).toBe(false);
  });

  it("collapses a cos + b sin into one cosine", () => {
    const ap = amplitudePhase(3, 4);
    expect(ap.R).toBeCloseTo(5, 10);
    const theta = 0.7;
    const sum = 3 * Math.cos(theta) + 4 * Math.sin(theta);
    expect(evaluateCosineWave(ap.R, ap.phiRad, theta)).toBeCloseTo(sum, 10);
  });

  it("reports small-angle errors that grow with angle", () => {
    const tiny = smallAngleCheck(5);
    const larger = smallAngleCheck(30);
    expect(tiny.sinError).toBeLessThan(larger.sinError);
    expect(tiny.sinApprox).toBeCloseTo((5 * Math.PI) / 180, 10);
  });

  it("advances discovery narrative beats", () => {
    expect(discoverBeat(0).phase).toBe("mystery");
    expect(discoverBeat(0.2).phase).toBe("ratio");
    expect(discoverBeat(0.35).phase).toBe("scale");
    expect(discoverBeat(0.5).phase).toBe("normalize");
    expect(discoverBeat(0.65).phase).toBe("thirty");
    expect(discoverBeat(0.8).phase).toBe("chord");
    expect(discoverBeat(0.95).phase).toBe("unit");
  });

  it("splits an equilateral triangle into a 30-60-90", () => {
    const eq = equilateralSplit30(2);
    expect(eq.half).toBeCloseTo(1, 10);
    expect(eq.hypotenuse).toBeCloseTo(2, 10);
    expect(eq.altitude).toBeCloseTo(Math.sqrt(3), 10);
    expect(eq.sin30).toBeCloseTo(0.5, 10);
    expect(eq.half / eq.hypotenuse).toBeCloseTo(0.5, 10);
  });
});
