/**
 * Pure maths for the Functions & Graphs stage.
 *
 * Everything here is deliberately free of three.js so it can be unit-tested under Node
 * and reused across lessons. Functions take plain numbers and return plain data.
 */

export interface LineFit {
  /** Gradient, or null for a vertical line. */
  m: number | null;
  /** y-intercept, or null for a vertical line. */
  c: number | null;
  /** True when the two points share an x value (an undefined gradient). */
  vertical: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** Fit the straight line through two points, flagging the vertical (undefined-gradient) case. */
export function lineFromTwoPoints(p1: Point, p2: Point): LineFit {
  const dx = p2.x - p1.x;
  if (Math.abs(dx) < 1e-12) return { m: null, c: null, vertical: true };
  const m = (p2.y - p1.y) / dx;
  const c = p1.y - m * p1.x;
  return { m, c, vertical: false };
}

/** Midpoint of the segment joining two points. */
export function midpoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/** Straight-line (Euclidean) distance between two points. */
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Evaluate y = m·x + c. */
export function lineValue(m: number, c: number, x: number): number {
  return m * x + c;
}

export interface QuadraticState {
  /** Discriminant b² − 4ac. */
  disc: number;
  /** Real roots, sorted ascending; empty when the discriminant is negative. */
  roots: number[];
  /** Turning point (vertex) of the parabola. */
  vertex: Point;
  /** True when a > 0 (parabola opens upward). */
  opensUp: boolean;
  /** Number of distinct real roots: 0, 1 or 2. */
  rootCount: 0 | 1 | 2;
}

/** Everything a quadratic lesson needs about y = a·x² + b·x + c. */
export function quadraticState(a: number, b: number, c: number): QuadraticState {
  const disc = b * b - 4 * a * c;
  const vx = a === 0 ? 0 : -b / (2 * a);
  const vy = a === 0 ? c : a * vx * vx + b * vx + c;
  let roots: number[] = [];
  let rootCount: 0 | 1 | 2 = 0;
  if (a !== 0) {
    if (disc > 1e-12) {
      const s = Math.sqrt(disc);
      roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((p, q) => p - q);
      rootCount = 2;
    } else if (disc >= -1e-12) {
      roots = [-b / (2 * a)];
      rootCount = 1;
    }
  }
  return { disc, roots, vertex: { x: vx, y: vy }, opensUp: a > 0, rootCount };
}

export type LinearSystemType = "unique" | "none" | "infinite";

export interface LinearSystemSolution {
  type: LinearSystemType;
  x?: number;
  y?: number;
}

/**
 * Solve the 2×2 system
 *   a1·x + b1·y = c1
 *   a2·x + b2·y = c2
 * classifying it as a unique intersection, parallel (no solution) or coincident (infinite).
 */
export function solveLinear2(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number,
): LinearSystemSolution {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) {
    // Parallel lines: distinguish coincident from strictly parallel with a cross check.
    const cross1 = a1 * c2 - a2 * c1;
    const cross2 = b1 * c2 - b2 * c1;
    if (Math.abs(cross1) < 1e-12 && Math.abs(cross2) < 1e-12) return { type: "infinite" };
    return { type: "none" };
  }
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return { type: "unique", x, y };
}

/** nth term of an arithmetic progression (n is 1-based): a + (n−1)·d. */
export function apTerm(a: number, d: number, n: number): number {
  return a + (n - 1) * d;
}

/** Sum of the first n terms of an arithmetic progression: n/2·(2a + (n−1)d). */
export function apSum(a: number, d: number, n: number): number {
  return (n / 2) * (2 * a + (n - 1) * d);
}

/** nth term of a geometric progression (n is 1-based): a·r^(n−1). */
export function gpTerm(a: number, r: number, n: number): number {
  return a * Math.pow(r, n - 1);
}

/** Sum of the first n terms of a geometric progression, handling r = 1. */
export function gpSum(a: number, r: number, n: number): number {
  if (Math.abs(r - 1) < 1e-12) return a * n;
  return (a * (Math.pow(r, n) - 1)) / (r - 1);
}

/** Sum to infinity of a convergent geometric progression (|r| < 1), else null. */
export function gpSumInfinite(a: number, r: number): number | null {
  if (Math.abs(r) >= 1) return null;
  return a / (1 - r);
}

export interface TransformParams {
  /** Horizontal shift (positive moves the graph right). */
  h: number;
  /** Vertical shift (positive moves the graph up). */
  k: number;
  /** Vertical stretch factor. */
  a: number;
  /** Horizontal stretch factor (inside x). */
  b: number;
  /** Reflect in the x-axis (negate the output). */
  reflectX: boolean;
  /** Reflect in the y-axis (negate the input). */
  reflectY: boolean;
}

/**
 * Build the transformed function y = a·f(b·(x − h)) + k with optional reflections.
 * reflectX flips the sign of the whole output; reflectY flips the sign of the input.
 */
export function transformedFn(
  base: (x: number) => number,
  p: TransformParams,
): (x: number) => number {
  const sx = p.reflectY ? -1 : 1;
  const sy = p.reflectX ? -1 : 1;
  return (x: number) => sy * p.a * base(sx * p.b * (x - p.h)) + p.k;
}

export type InequalityOp = "<" | "<=" | ">" | ">=";

export interface LinearInequalitySolution {
  /** The boundary value x = bound. */
  bound: number;
  /** Resulting operator after any sign flip (x <op> bound). */
  op: InequalityOp;
  /** True when both sides were divided by a negative number, flipping the sign. */
  flipped: boolean;
}

/**
 * Solve the linear inequality a·x + b <op> 0 for x, tracking the sign flip that happens
 * when dividing by a negative coefficient.
 */
export function solveLinearInequality(
  a: number, b: number, op: InequalityOp,
): LinearInequalitySolution {
  if (a === 0) throw new Error("solveLinearInequality: coefficient a must be non-zero");
  const bound = -b / a;
  const flipped = a < 0;
  const flip: Record<InequalityOp, InequalityOp> = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" };
  return { bound, op: flipped ? flip[op] : op, flipped };
}

/**
 * One-sided samples of f approaching x0. Returns points at x0 ± step·r for r = 1..count,
 * from `side`, useful for illustrating a limit numerically.
 */
export function limitSamples(
  f: (x: number) => number,
  x0: number,
  side: "left" | "right",
  count = 5,
  step = 0.1,
): { x: number; y: number }[] {
  const dir = side === "left" ? -1 : 1;
  const out: { x: number; y: number }[] = [];
  for (let r = count; r >= 1; r--) {
    const x = x0 + dir * step * r;
    out.push({ x, y: f(x) });
  }
  return out;
}

/** Estimate the one-sided limit of f at x0 by sampling very close to it. */
export function oneSidedLimit(
  f: (x: number) => number,
  x0: number,
  side: "left" | "right",
): number {
  const dir = side === "left" ? -1 : 1;
  return f(x0 + dir * 1e-6);
}
