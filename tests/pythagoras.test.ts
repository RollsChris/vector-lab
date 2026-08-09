import { describe, expect, it } from "vitest";
import {
  axisAlignedRightTriangle,
  computePythagoras,
  distance,
  outwardNormal,
  rearrangedTiles,
  squareOnSide,
} from "../src/math/pythagoras";

describe("pythagoras", () => {
  it("holds for a 3-4-5 right triangle", () => {
    const triangle = axisAlignedRightTriangle(3, 4, { x: -1, y: -1 });
    const result = computePythagoras(triangle);
    expect(result.valid).toBe(true);
    expect(result.a).toBeCloseTo(4, 5); // BC vertical leg length 4
    expect(result.b).toBeCloseTo(3, 5); // AC horizontal leg length 3
    expect(result.c).toBeCloseTo(5, 5);
    expect(result.a2 + result.b2).toBeCloseTo(result.c2, 5);
    expect(result.holds).toBe(true);
    expect(result.angleC).toBeCloseTo(90, 1);
    expect(result.squares).toHaveLength(3);
  });

  it("fails when the right angle is broken", () => {
    const base = axisAlignedRightTriangle(3, 4);
    const broken = {
      ...base,
      C: { x: base.C.x + 1.2, y: base.C.y + 0.8 },
    };
    const result = computePythagoras(broken);
    expect(result.valid).toBe(true);
    expect(result.holds).toBe(false);
    expect(Math.abs(result.angleC - 90)).toBeGreaterThan(0.6);
  });

  it("builds outward squares that do not cover the triangle centroid", () => {
    const triangle = axisAlignedRightTriangle(2, 2, { x: 0, y: 0 });
    const result = computePythagoras(triangle);
    const centroid = {
      x: (triangle.A.x + triangle.B.x + triangle.C.x) / 3,
      y: (triangle.A.y + triangle.B.y + triangle.C.y) / 3,
    };
    for (const square of result.squares) {
      const mid = {
        x: square.corners.reduce((s, p) => s + p.x, 0) / 4,
        y: square.corners.reduce((s, p) => s + p.y, 0) / 4,
      };
      // Square centre should be farther from centroid than the side midpoint.
      const sideMid = {
        x: (square.corners[0].x + square.corners[1].x) / 2,
        y: (square.corners[0].y + square.corners[1].y) / 2,
      };
      expect(distance(mid, centroid)).toBeGreaterThan(distance(sideMid, centroid) - 1e-6);
    }
  });

  it("chooses the outward normal away from the interior point", () => {
    const n = outwardNormal({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 });
    expect(n.y).toBeLessThan(0);
    const sq = squareOnSide({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 });
    expect(sq[2].y).toBeLessThan(0);
  });

  it("interpolates rearrangement tiles from side squares toward a pack", () => {
    const result = computePythagoras(axisAlignedRightTriangle(3, 4));
    const start = rearrangedTiles(result, 0);
    const end = rearrangedTiles(result, 1);
    expect(start.aTile).toHaveLength(4);
    expect(end.aTile).toHaveLength(4);
    expect(distance(start.aTile[0], result.squares[0].corners[0])).toBeLessThan(1e-6);
    expect(distance(end.aTile[0], start.aTile[0])).toBeGreaterThan(0.1);
  });
});
