import { describe, expect, it } from "vitest";
import {
  axisAlignedRightTriangle,
  computePythagoras,
  distance,
  fourTriangleDissection,
  outwardNormal,
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

  it("builds two valid four-triangle dissections of the same outer square", () => {
    assertDissection(3, 4);
    assertDissection(2.8, 2.8);
  });

  it("rejects invalid dissection dimensions", () => {
    expect(() => fourTriangleDissection(0, 4)).toThrow("finite positive");
    expect(() => fourTriangleDissection(Number.NaN, 4)).toThrow("finite positive");
  });
});

function polygonArea(points: readonly { x: number; y: number }[]): number {
  return Math.abs(points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length];
    return total + point.x * next.y - point.y * next.x;
  }, 0) / 2);
}

function vector(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
  return { x: to.x - from.x, y: to.y - from.y };
}

function assertDissection(a: number, b: number): void {
  const dissection = fourTriangleDissection(a, b, { x: 2, y: -1 });
  const outerArea = polygonArea(dissection.outer);
  const c = Math.hypot(a, b);
  const expectedSides = [a, b, c].sort((left, right) => left - right);

  expect(outerArea).toBeCloseTo((a + b) ** 2);
  for (const triangle of [...dissection.legs.triangles, ...dissection.hypotenuse.triangles]) {
    const sides = [
      distance(triangle[0], triangle[1]),
      distance(triangle[1], triangle[2]),
      distance(triangle[2], triangle[0]),
    ].sort((left, right) => left - right);
    expect(sides).toEqual(expectedSides.map((side) => expect.closeTo(side, 8)));
  }

  const legsArea = dissection.legs.triangles.reduce(
    (total, triangle) => total + polygonArea(triangle),
    polygonArea(dissection.legs.aSquare) + polygonArea(dissection.legs.bSquare),
  );
  const hypotenuseArea = dissection.hypotenuse.triangles.reduce(
    (total, triangle) => total + polygonArea(triangle),
    polygonArea(dissection.hypotenuse.cSquare),
  );
  expect(legsArea).toBeCloseTo(outerArea);
  expect(hypotenuseArea).toBeCloseTo(outerArea);

  const cSquare = dissection.hypotenuse.cSquare;
  const first = vector(cSquare[0], cSquare[1]);
  const second = vector(cSquare[1], cSquare[2]);
  expect(first.x * second.x + first.y * second.y).toBeCloseTo(0);
  expect(Math.hypot(first.x, first.y)).toBeCloseTo(c);
  expect(Math.hypot(second.x, second.y)).toBeCloseTo(c);
}
