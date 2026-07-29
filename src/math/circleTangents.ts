/**
 * Pure common-tangent geometry for a pair of circles.
 *
 * Kept free of three.js so the construction the Circle Theorems lesson draws (the two
 * external/direct tangents and the two internal/transverse tangents, their touch points
 * and their segment lengths) can be unit tested on its own.
 *
 * A tangent line is returned in normal form `n · X = offset` with `|n| = 1`, which stays
 * well behaved for vertical lines where a gradient/intercept form would blow up.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Circle {
  centre: Pt;
  radius: number;
}

/**
 * `external` (direct) tangents leave both circles on the same side and do not cross the
 * line joining the centres; `internal` (transverse) tangents cross between the circles.
 */
export type TangentKind = "external" | "internal";

export interface CommonTangent {
  kind: TangentKind;
  /** Unit normal of the line `n · X = offset`. */
  normal: Pt;
  offset: number;
  /** Touch point on the first circle. */
  touchA: Pt;
  /** Touch point on the second circle. */
  touchB: Pt;
  /** Distance between the two touch points. */
  length: number;
}

export type CirclePair =
  | "separate" // 4 tangents
  | "externally-tangent" // 3
  | "intersecting" // 2
  | "internally-tangent" // 1
  | "contained" // 0
  | "identical"; // infinitely many

export interface CommonTangentResult {
  /** Distance between the centres. */
  distance: number;
  relationship: CirclePair;
  external: CommonTangent[];
  internal: CommonTangent[];
  /** √(d² − (r₁ − r₂)²) when the external tangents exist, otherwise undefined. */
  externalLength?: number;
  /** √(d² − (r₁ + r₂)²) when the internal tangents exist, otherwise undefined. */
  internalLength?: number;
}

const EPS = 1e-9;

export function classifyCirclePair(a: Circle, b: Circle, eps = 1e-6): CirclePair {
  const d = distance(a.centre, b.centre);
  const sum = a.radius + b.radius;
  const diff = Math.abs(a.radius - b.radius);
  if (d <= eps && diff <= eps) return "identical";
  if (d > sum + eps) return "separate";
  if (Math.abs(d - sum) <= eps) return "externally-tangent";
  if (d > diff + eps) return "intersecting";
  if (Math.abs(d - diff) <= eps) return "internally-tangent";
  return "contained";
}

/**
 * All common tangents of two circles.
 *
 * Solve for the unit normal `n` and offset `c` of a line `n · X = c` that touches both:
 * `n · A − c = s₁r₁` and `n · B − c = s₂r₂` with each `s = ±1` choosing which side of the
 * line the centre sits on. Subtracting removes `c` and leaves `n · û = (s₂r₂ − s₁r₁)/d`,
 * which pins the normal's component along the centre line; the perpendicular component is
 * then `±√(1 − h²)`, giving the mirrored pair of tangents. Taking `s₂ = s₁` yields the
 * external tangents and `s₂ = −s₁` the internal ones.
 */
export function commonTangents(a: Circle, b: Circle): CommonTangentResult {
  const dx = b.centre.x - a.centre.x;
  const dy = b.centre.y - a.centre.y;
  const d = Math.hypot(dx, dy);
  const relationship = classifyCirclePair(a, b);
  const result: CommonTangentResult = { distance: d, relationship, external: [], internal: [] };
  if (d < EPS) return result; // concentric: no common tangent exists

  const ux = dx / d;
  const uy = dy / d;

  for (const kind of ["external", "internal"] as const) {
    const s1 = 1;
    const s2 = kind === "external" ? 1 : -1;
    const h = (s2 * b.radius - s1 * a.radius) / d;
    if (Math.abs(h) > 1 + EPS) continue; // one circle swallows the other

    const k = Math.sqrt(Math.max(0, 1 - h * h));
    const signs = k < EPS ? [1] : [1, -1]; // the pair merges into one line when circles touch
    for (const sign of signs) {
      // n = h·û + sign·k·û⊥
      const nx = h * ux - sign * k * uy;
      const ny = h * uy + sign * k * ux;
      const offset = nx * a.centre.x + ny * a.centre.y - s1 * a.radius;
      const touchA: Pt = { x: a.centre.x - s1 * a.radius * nx, y: a.centre.y - s1 * a.radius * ny };
      const touchB: Pt = { x: b.centre.x - s2 * b.radius * nx, y: b.centre.y - s2 * b.radius * ny };
      result[kind].push({
        kind,
        normal: { x: nx, y: ny },
        offset,
        touchA,
        touchB,
        length: distance(touchA, touchB),
      });
    }
  }

  const outer = d * d - (a.radius - b.radius) ** 2;
  if (result.external.length > 0 && outer >= 0) result.externalLength = Math.sqrt(outer);
  const inner = d * d - (a.radius + b.radius) ** 2;
  if (result.internal.length > 0 && inner >= 0) result.internalLength = Math.sqrt(inner);
  return result;
}

export function distance(p: Pt, q: Pt): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

/** Perpendicular distance from a point to the line `n · X = offset`. */
export function lineDistance(tangent: Pick<CommonTangent, "normal" | "offset">, p: Pt): number {
  return Math.abs(tangent.normal.x * p.x + tangent.normal.y * p.y - tangent.offset);
}
