/**
 * Pure triangle-centre geometry.
 *
 * Kept free of three.js so the constructions the Triangle Theorems lesson animates
 * (medians, perpendicular bisectors, angle bisectors, altitudes, the nine-point
 * circle and the Euler line) can be unit tested on their own.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface NinePointCircle {
  /** Nine-point centre N — the midpoint of OH. */
  centre: Pt;
  /** Half the circumradius. */
  radius: number;
  /** Midpoints of the three sides. */
  sideMidpoints: [Pt, Pt, Pt];
  /** Feet of the three altitudes. */
  altitudeFeet: [Pt, Pt, Pt];
  /** Euler points — midpoints of AH, BH and CH. */
  eulerPoints: [Pt, Pt, Pt];
}

export interface TriangleCentres {
  /** Centroid — medians meet here. */
  G: Pt;
  /** Circumcentre — perpendicular bisectors meet here. */
  O: Pt;
  /** Incentre — angle bisectors meet here. */
  I: Pt;
  /** Orthocentre — altitudes meet here. */
  H: Pt;
  /** Circumradius. */
  R: number;
  /** Inradius. */
  r: number;
  ninePoint: NinePointCircle;
}

export function midpoint(p: Pt, q: Pt): Pt {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}

export function distance(p: Pt, q: Pt): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

/** Twice the signed area of ABC; zero when the points are collinear. */
export function signedDoubleArea(A: Pt, B: Pt, C: Pt): number {
  return (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
}

export function triangleArea(A: Pt, B: Pt, C: Pt): number {
  return Math.abs(signedDoubleArea(A, B, C)) / 2;
}

/** True when ABC is a genuine triangle rather than three near-collinear points. */
export function isNonDegenerate(A: Pt, B: Pt, C: Pt): boolean {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  return Math.abs(d) > 1e-6 && triangleArea(A, B, C) > 1e-4;
}

export function centroid(A: Pt, B: Pt, C: Pt): Pt {
  return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
}

/** Circumcentre by the standard determinant formula; null when ABC is degenerate. */
export function circumcentre(A: Pt, B: Pt, C: Pt): Pt | null {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (!isNonDegenerate(A, B, C)) return null;
  const A2 = A.x * A.x + A.y * A.y;
  const B2 = B.x * B.x + B.y * B.y;
  const C2 = C.x * C.x + C.y * C.y;
  return {
    x: (A2 * (B.y - C.y) + B2 * (C.y - A.y) + C2 * (A.y - B.y)) / d,
    y: (A2 * (C.x - B.x) + B2 * (A.x - C.x) + C2 * (B.x - A.x)) / d,
  };
}

/** Incentre — each vertex weighted by the length of the side opposite it. */
export function incentre(A: Pt, B: Pt, C: Pt): Pt {
  const a = distance(B, C);
  const b = distance(C, A);
  const c = distance(A, B);
  const p = a + b + c;
  if (p < 1e-9) return { x: A.x, y: A.y };
  return {
    x: (a * A.x + b * B.x + c * C.x) / p,
    y: (a * A.y + b * B.y + c * C.y) / p,
  };
}

/** Orthocentre via Euler's relation H = A + B + C − 2O. */
export function orthocentre(A: Pt, B: Pt, C: Pt): Pt | null {
  const O = circumcentre(A, B, C);
  if (!O) return null;
  return { x: A.x + B.x + C.x - 2 * O.x, y: A.y + B.y + C.y - 2 * O.y };
}

/** Foot of the perpendicular from `v` onto the infinite line through p and q. */
export function altitudeFoot(v: Pt, p: Pt, q: Pt): Pt {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return { x: p.x, y: p.y };
  const t = ((v.x - p.x) * dx + (v.y - p.y) * dy) / lenSq;
  return { x: p.x + dx * t, y: p.y + dy * t };
}

/**
 * The nine-point (Feuerbach) circle: one circle of radius R/2 centred at the
 * midpoint of OH that passes through the three side midpoints, the three
 * altitude feet and the three Euler points.
 */
export function ninePointCircle(A: Pt, B: Pt, C: Pt): NinePointCircle | null {
  const O = circumcentre(A, B, C);
  const H = orthocentre(A, B, C);
  if (!O || !H) return null;
  return {
    centre: midpoint(O, H),
    radius: distance(O, A) / 2,
    sideMidpoints: [midpoint(B, C), midpoint(C, A), midpoint(A, B)],
    altitudeFeet: [altitudeFoot(A, B, C), altitudeFoot(B, C, A), altitudeFoot(C, A, B)],
    eulerPoints: [midpoint(A, H), midpoint(B, H), midpoint(C, H)],
  };
}

/** All nine concyclic points in a single list, for drawing or testing. */
export function ninePointPoints(circle: NinePointCircle): Pt[] {
  return [...circle.sideMidpoints, ...circle.altitudeFeet, ...circle.eulerPoints];
}

/** Every centre at once; null when ABC is degenerate. */
export function triangleCentres(A: Pt, B: Pt, C: Pt): TriangleCentres | null {
  const O = circumcentre(A, B, C);
  const H = orthocentre(A, B, C);
  const np = ninePointCircle(A, B, C);
  if (!O || !H || !np) return null;
  const a = distance(B, C);
  const b = distance(C, A);
  const c = distance(A, B);
  const area = triangleArea(A, B, C);
  return {
    G: centroid(A, B, C),
    O,
    I: incentre(A, B, C),
    H,
    R: distance(O, A),
    r: area / ((a + b + c) / 2),
    ninePoint: np,
  };
}
