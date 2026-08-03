import { describe, expect, it } from "vitest";
import { miterSawCut } from "../src/math/miterSaw";

describe("miterSawCut", () => {
  it("keeps a square crosscut square", () => {
    const cut = miterSawCut({
      width: 100,
      thickness: 18,
      miterDegrees: 0,
      bevelDegrees: 0,
    });

    expect(cut.cutLineAcuteAngleDegrees).toBe(90);
    expect(cut.topFaceCutLength).toBe(100);
    expect(cut.endOffset).toBe(0);
    expect(cut.flatFrameCornerDegrees).toBe(180);
    expect(cut.cutFaceSideLength).toBe(18);
    expect(cut.cutFaceIncludedAngleDegrees).toBe(90);
    expect(cut.cutFaceArea).toBe(1800);
  });

  it("calculates a 45 degree flat mitre", () => {
    const cut = miterSawCut({
      width: 100,
      thickness: 18,
      miterDegrees: 45,
      bevelDegrees: 0,
    });

    expect(cut.cutLineAcuteAngleDegrees).toBe(45);
    expect(cut.topFaceCutLength).toBeCloseTo(100 * Math.SQRT2, 10);
    expect(cut.endOffset).toBeCloseTo(100, 10);
    expect(cut.flatFrameCornerDegrees).toBe(90);
    expect(cut.cutFaceSideLength).toBe(18);
    expect(cut.cutFaceIncludedAngleDegrees).toBe(90);
    expect(cut.cutFaceArea).toBeCloseTo(1800 * Math.SQRT2, 10);
  });

  it("calculates the parallelogram face of a compound cut", () => {
    const cut = miterSawCut({
      width: 100,
      thickness: 18,
      miterDegrees: 45,
      bevelDegrees: 30,
    });

    expect(cut.cutFaceSideLength).toBeCloseTo(18 * Math.sqrt(5 / 3), 10);
    expect(cut.cutFaceIncludedAngleDegrees).toBeCloseTo(63.4349488, 6);
    expect(cut.cutFaceArea).toBeCloseTo(1800 / (Math.cos(Math.PI / 4) * Math.cos(Math.PI / 6)), 10);
  });

  it("uses signs only to mirror the compound face", () => {
    const right = miterSawCut({
      width: 100,
      thickness: 18,
      miterDegrees: 30,
      bevelDegrees: 20,
    });
    const left = miterSawCut({
      width: 100,
      thickness: 18,
      miterDegrees: -30,
      bevelDegrees: 20,
    });

    expect(left.topFaceCutLength).toBeCloseTo(right.topFaceCutLength, 10);
    expect(left.cutFaceSideLength).toBeCloseTo(right.cutFaceSideLength, 10);
    expect(left.cutFaceArea).toBeCloseTo(right.cutFaceArea, 10);
    expect(left.cutFaceIncludedAngleDegrees + right.cutFaceIncludedAngleDegrees).toBeCloseTo(180, 10);
  });

  it("rejects stock and settings outside the usable domain", () => {
    expect(() =>
      miterSawCut({ width: 0, thickness: 18, miterDegrees: 0, bevelDegrees: 0 }),
    ).toThrow(/width/);
    expect(() =>
      miterSawCut({ width: 100, thickness: 18, miterDegrees: 90, bevelDegrees: 0 }),
    ).toThrow(/miterDegrees/);
    expect(() =>
      miterSawCut({ width: 100, thickness: 18, miterDegrees: 0, bevelDegrees: -90 }),
    ).toThrow(/bevelDegrees/);
  });
});
