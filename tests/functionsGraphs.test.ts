import { describe, it, expect } from "vitest";
import {
  lineFromTwoPoints,
  midpoint,
  distance,
  lineValue,
  quadraticState,
  solveLinear2,
  apTerm,
  apSum,
  gpTerm,
  gpSum,
  gpSumInfinite,
  transformedFn,
  solveLinearInequality,
  limitSamples,
  oneSidedLimit,
} from "../src/math/functionsGraphs";
import {
  matrix2Det,
  matrix2MulVec,
  matrix2Mul,
  basisImages,
  unitSquareImage,
  flipsOrientation,
} from "../src/math/matrices2";

describe("lineFromTwoPoints", () => {
  it("computes gradient and intercept for a sloped line", () => {
    const fit = lineFromTwoPoints({ x: 0, y: 1 }, { x: 2, y: 5 });
    expect(fit.vertical).toBe(false);
    expect(fit.m).toBeCloseTo(2);
    expect(fit.c).toBeCloseTo(1);
  });

  it("handles a horizontal line", () => {
    const fit = lineFromTwoPoints({ x: -3, y: 4 }, { x: 5, y: 4 });
    expect(fit.m).toBeCloseTo(0);
    expect(fit.c).toBeCloseTo(4);
  });

  it("flags a vertical line as undefined gradient", () => {
    const fit = lineFromTwoPoints({ x: 2, y: -1 }, { x: 2, y: 9 });
    expect(fit.vertical).toBe(true);
    expect(fit.m).toBeNull();
    expect(fit.c).toBeNull();
  });
});

describe("midpoint / distance / lineValue", () => {
  it("finds the midpoint", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 3 });
  });

  it("measures a 3-4-5 distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });

  it("evaluates y = m x + c", () => {
    expect(lineValue(2, 1, 3)).toBe(7);
  });
});

describe("quadraticState", () => {
  it("finds two roots, vertex and discriminant", () => {
    const q = quadraticState(1, -5, 6); // (x-2)(x-3)
    expect(q.disc).toBeCloseTo(1);
    expect(q.rootCount).toBe(2);
    expect(q.roots[0]).toBeCloseTo(2);
    expect(q.roots[1]).toBeCloseTo(3);
    expect(q.vertex.x).toBeCloseTo(2.5);
    expect(q.vertex.y).toBeCloseTo(-0.25);
    expect(q.opensUp).toBe(true);
  });

  it("detects a repeated root", () => {
    const q = quadraticState(1, -4, 4); // (x-2)^2
    expect(q.rootCount).toBe(1);
    expect(q.roots[0]).toBeCloseTo(2);
    expect(q.disc).toBeCloseTo(0);
  });

  it("reports no real roots for a negative discriminant", () => {
    const q = quadraticState(1, 0, 1); // x^2 + 1
    expect(q.rootCount).toBe(0);
    expect(q.roots).toHaveLength(0);
    expect(q.disc).toBeLessThan(0);
  });

  it("marks a downward parabola", () => {
    const q = quadraticState(-2, 0, 8); // opens down, roots ±2
    expect(q.opensUp).toBe(false);
    expect(q.roots[0]).toBeCloseTo(-2);
    expect(q.roots[1]).toBeCloseTo(2);
  });
});

describe("solveLinear2", () => {
  it("finds a unique intersection", () => {
    // x + y = 3 ; x - y = 1  -> (2, 1)
    const s = solveLinear2(1, 1, 3, 1, -1, 1);
    expect(s.type).toBe("unique");
    expect(s.x).toBeCloseTo(2);
    expect(s.y).toBeCloseTo(1);
  });

  it("reports parallel lines as no solution", () => {
    // x + y = 1 ; x + y = 4
    const s = solveLinear2(1, 1, 1, 1, 1, 4);
    expect(s.type).toBe("none");
  });

  it("reports coincident lines as infinite", () => {
    // x + y = 2 ; 2x + 2y = 4
    const s = solveLinear2(1, 1, 2, 2, 2, 4);
    expect(s.type).toBe("infinite");
  });
});

describe("arithmetic and geometric progressions", () => {
  it("computes AP term and sum (1-based n)", () => {
    // 3, 5, 7, 9, 11
    expect(apTerm(3, 2, 1)).toBe(3);
    expect(apTerm(3, 2, 5)).toBe(11);
    expect(apSum(3, 2, 5)).toBe(35);
  });

  it("computes GP term and sum", () => {
    // 2, 6, 18, 54
    expect(gpTerm(2, 3, 1)).toBe(2);
    expect(gpTerm(2, 3, 4)).toBe(54);
    expect(gpSum(2, 3, 4)).toBe(80);
  });

  it("handles r = 1 in a GP sum", () => {
    expect(gpSum(5, 1, 4)).toBe(20);
  });

  it("sums an infinite convergent GP", () => {
    expect(gpSumInfinite(1, 0.5)).toBeCloseTo(2);
    expect(gpSumInfinite(1, 2)).toBeNull();
  });
});

describe("matrix2 as a map", () => {
  const m = { a: 2, b: 0, c: 0, d: 3 };

  it("multiplies a vector", () => {
    expect(matrix2MulVec(m, { x: 1, y: 1 })).toEqual({ x: 2, y: 3 });
  });

  it("computes the determinant as signed area", () => {
    expect(matrix2Det(m)).toBe(6);
    expect(matrix2Det({ a: 0, b: 1, c: 1, d: 0 })).toBe(-1);
  });

  it("detects an orientation flip", () => {
    expect(flipsOrientation({ a: 0, b: 1, c: 1, d: 0 })).toBe(true);
    expect(flipsOrientation(m)).toBe(false);
  });

  it("maps the basis vectors to the matrix columns", () => {
    const { i, j } = basisImages(m);
    expect(i).toEqual({ x: 2, y: 0 });
    expect(j).toEqual({ x: 0, y: 3 });
  });

  it("maps the unit square to a scaled rectangle", () => {
    const corners = unitSquareImage(m);
    expect(corners[0]).toEqual({ x: 0, y: 0 });
    expect(corners[2]).toEqual({ x: 2, y: 3 });
  });

  it("composes two maps", () => {
    // 90° rotation applied twice = 180° rotation (−I)
    const rot90 = { a: 0, b: -1, c: 1, d: 0 };
    const rot180 = matrix2Mul(rot90, rot90);
    const v = matrix2MulVec(rot180, { x: 1, y: 0 });
    expect(v.x).toBeCloseTo(-1);
    expect(v.y).toBeCloseTo(0);
  });
});

describe("transformedFn", () => {
  const base = (x: number) => x * x;

  it("applies a vertical shift", () => {
    const g = transformedFn(base, { h: 0, k: 3, a: 1, b: 1, reflectX: false, reflectY: false });
    expect(g(2)).toBe(7);
  });

  it("applies a horizontal shift", () => {
    const g = transformedFn(base, { h: 1, k: 0, a: 1, b: 1, reflectX: false, reflectY: false });
    expect(g(1)).toBe(0); // vertex moved to x = 1
    expect(g(3)).toBe(4);
  });

  it("applies a vertical stretch and reflection", () => {
    const g = transformedFn(base, { h: 0, k: 0, a: 2, b: 1, reflectX: true, reflectY: false });
    expect(g(2)).toBe(-8); // -2 * 2^2
  });

  it("reflects in the y-axis for an odd base", () => {
    const cube = (x: number) => x * x * x;
    const g = transformedFn(cube, { h: 0, k: 0, a: 1, b: 1, reflectX: false, reflectY: true });
    expect(g(2)).toBe(-8);
  });
});

describe("solveLinearInequality", () => {
  it("keeps the sign when dividing by a positive coefficient", () => {
    // 2x - 6 > 0 -> x > 3
    const s = solveLinearInequality(2, -6, ">");
    expect(s.bound).toBeCloseTo(3);
    expect(s.op).toBe(">");
    expect(s.flipped).toBe(false);
  });

  it("flips the sign when dividing by a negative coefficient", () => {
    // -2x + 4 >= 0 -> x <= 2
    const s = solveLinearInequality(-2, 4, ">=");
    expect(s.bound).toBeCloseTo(2);
    expect(s.op).toBe("<=");
    expect(s.flipped).toBe(true);
  });
});

describe("limit sampling", () => {
  it("samples approaching from the left, closest last", () => {
    const samples = limitSamples((x) => 2 * x, 1, "left", 3, 0.1);
    expect(samples).toHaveLength(3);
    expect(samples[0].x).toBeCloseTo(0.7);
    expect(samples[2].x).toBeCloseTo(0.9);
    expect(samples[2].y).toBeCloseTo(1.8);
  });

  it("samples approaching from the right", () => {
    const samples = limitSamples((x) => x * x, 2, "right", 2, 0.5);
    expect(samples[0].x).toBeCloseTo(3);
    expect(samples[1].x).toBeCloseTo(2.5);
  });

  it("estimates a one-sided limit near a hole", () => {
    // f(x) = (x^2 - 1)/(x - 1) has a hole at x = 1 but approaches 2
    const f = (x: number) => (x * x - 1) / (x - 1);
    expect(oneSidedLimit(f, 1, "left")).toBeCloseTo(2, 4);
    expect(oneSidedLimit(f, 1, "right")).toBeCloseTo(2, 4);
  });
});
