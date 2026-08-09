/** Pure helpers for the interactive Pythagoras lesson. */

export interface Point {
  x: number;
  y: number;
}

export interface RightTriangle {
  /** Right-angle vertex. */
  C: Point;
  /** End of leg a (along +x from C when axis-aligned). */
  A: Point;
  /** End of leg b (along +y from C when axis-aligned). */
  B: Point;
}

export interface SideSquare {
  /** Side the square sits on: a = BC, b = AC, c = AB (hypotenuse). */
  side: "a" | "b" | "c";
  /** Length of the side. */
  length: number;
  /** Area = length². */
  area: number;
  /** Four corners of the outward square, CCW starting at the first endpoint of the side. */
  corners: readonly [Point, Point, Point, Point];
}

export interface PythagorasResult {
  triangle: RightTriangle;
  /** Leg opposite A? Convention here: a = |BC|, b = |AC|, c = |AB|. */
  a: number;
  b: number;
  c: number;
  a2: number;
  b2: number;
  c2: number;
  /** |a² + b² − c²|. */
  residual: number;
  /** True when angle at C is 90° within tolerance and residual is tiny. */
  holds: boolean;
  /** Interior angle at C in degrees. */
  angleC: number;
  squares: readonly SideSquare[];
  valid: boolean;
  reason?: string;
}

const EPS = 1e-9;
const RIGHT_TOL_DEG = 0.6;
const RESIDUAL_TOL = 1e-3;

export function distance(p: Point, q: Point): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

export function formatNumber(value: number, digits = 2): string {
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, "");
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Build an axis-aligned right triangle with right angle at C and positive legs. */
export function axisAlignedRightTriangle(a: number, b: number, origin: Point = { x: 0, y: 0 }): RightTriangle {
  const legA = Math.max(0.2, a);
  const legB = Math.max(0.2, b);
  return {
    C: { ...origin },
    A: { x: origin.x + legA, y: origin.y },
    B: { x: origin.x, y: origin.y + legB },
  };
}

/**
 * Outward unit normal for directed edge P→Q, choosing the side that does **not**
 * contain `inside` (so squares grow away from the triangle).
 */
export function outwardNormal(P: Point, Q: Point, inside: Point): Point {
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  const len = Math.hypot(dx, dy);
  if (len < EPS) return { x: 0, y: 0 };
  // Two unit perpendiculars.
  const n1 = { x: -dy / len, y: dx / len };
  const n2 = { x: dy / len, y: -dx / len };
  const mid = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const toInside = { x: inside.x - mid.x, y: inside.y - mid.y };
  // Pick the normal whose direction is opposite the inward vector.
  const d1 = n1.x * toInside.x + n1.y * toInside.y;
  return d1 > 0 ? n2 : n1;
}

export function squareOnSide(P: Point, Q: Point, inside: Point): readonly [Point, Point, Point, Point] {
  const n = outwardNormal(P, Q, inside);
  const len = distance(P, Q);
  const ox = n.x * len;
  const oy = n.y * len;
  return [
    { ...P },
    { ...Q },
    { x: Q.x + ox, y: Q.y + oy },
    { x: P.x + ox, y: P.y + oy },
  ];
}

export function angleAt(vertex: Point, p: Point, q: Point): number {
  const u = { x: p.x - vertex.x, y: p.y - vertex.y };
  const v = { x: q.x - vertex.x, y: q.y - vertex.y };
  const du = Math.hypot(u.x, u.y);
  const dv = Math.hypot(v.x, v.y);
  if (du < EPS || dv < EPS) return 0;
  const cos = Math.min(1, Math.max(-1, (u.x * v.x + u.y * v.y) / (du * dv)));
  return Math.acos(cos);
}

/**
 * Evaluate Pythagoras on the triangle with vertices A, B, C.
 * Right-angle candidate is always C; drag C off-axis to break the theorem.
 */
export function computePythagoras(triangle: RightTriangle): PythagorasResult {
  const { A, B, C } = triangle;
  const a = distance(B, C); // leg opposite A? we use a = BC (horizontal leg default)
  const b = distance(A, C);
  const c = distance(A, B);
  if (a < 0.15 || b < 0.15 || c < 0.15) {
    return empty(triangle, "sides too short");
  }

  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;
  const residual = Math.abs(a2 + b2 - c2);
  const angleC = toDegrees(angleAt(C, A, B));
  const right = Math.abs(angleC - 90) <= RIGHT_TOL_DEG;
  const holds = right && residual <= Math.max(RESIDUAL_TOL, 1e-4 * c2);

  const centroid = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
  };

  const squares: SideSquare[] = [
    {
      side: "a",
      length: a,
      area: a2,
      corners: squareOnSide(B, C, centroid),
    },
    {
      side: "b",
      length: b,
      area: b2,
      corners: squareOnSide(C, A, centroid),
    },
    {
      side: "c",
      length: c,
      area: c2,
      corners: squareOnSide(A, B, centroid),
    },
  ];

  return {
    triangle,
    a,
    b,
    c,
    a2,
    b2,
    c2,
    residual,
    holds,
    angleC,
    squares,
    valid: true,
  };
}

function empty(triangle: RightTriangle, reason: string): PythagorasResult {
  return {
    triangle,
    a: 0,
    b: 0,
    c: 0,
    a2: 0,
    b2: 0,
    c2: 0,
    residual: 0,
    holds: false,
    angleC: 0,
    squares: [],
    valid: false,
    reason,
  };
}

/**
 * Rearrangement animation helper: return a blend factor's square corners for the
 * classic "move the two small squares into the large one" story.
 * progress ∈ [0,1]; at 0 squares sit on the sides, at 1 the a² and b² tiles
 * pack into the c² footprint (shear-free axis packing for the axis-aligned case).
 */
export function rearrangedTiles(
  result: PythagorasResult,
  progress: number,
): { aTile: readonly Point[]; bTile: readonly Point[] } {
  const p = Math.min(1, Math.max(0, progress));
  const { triangle, a, b } = result;
  const { C } = triangle;
  // Target packing inside a c×c box sitting on the hypotenuse is hard in general;
  // for the demo we pack into an axis-aligned c×c box above the figure's bounding box.
  const c = result.c;
  const baseY = Math.max(triangle.A.y, triangle.B.y, triangle.C.y) + 0.8 + (1 - p) * 0;
  // Keep a simple two-rectangle pack: a×a bottom-left, b×b beside/above as fits.
  const targetA: Point[] = [
    { x: C.x, y: baseY },
    { x: C.x + a, y: baseY },
    { x: C.x + a, y: baseY + a },
    { x: C.x, y: baseY + a },
  ];
  // Place b×b to the right if a+b <= c, else above a.
  const placeRight = a + b <= c + 1e-6;
  const targetB: Point[] = placeRight
    ? [
        { x: C.x + a, y: baseY },
        { x: C.x + a + b, y: baseY },
        { x: C.x + a + b, y: baseY + b },
        { x: C.x + a, y: baseY + b },
      ]
    : [
        { x: C.x, y: baseY + a },
        { x: C.x + b, y: baseY + a },
        { x: C.x + b, y: baseY + a + b },
        { x: C.x, y: baseY + a + b },
      ];

  const startA = result.squares.find((s) => s.side === "a")?.corners ?? targetA;
  const startB = result.squares.find((s) => s.side === "b")?.corners ?? targetB;
  return {
    aTile: lerpPoly(startA, targetA, p),
    bTile: lerpPoly(startB, targetB, p),
  };
}

function lerpPoly(from: readonly Point[], to: readonly Point[], t: number): Point[] {
  const n = Math.min(from.length, to.length);
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: from[i].x + (to[i].x - from[i].x) * t,
      y: from[i].y + (to[i].y - from[i].y) * t,
    });
  }
  return out;
}
