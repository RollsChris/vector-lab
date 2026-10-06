/**
 * "Grow" animation maths for the Trigonometric Functions lesson.
 *
 * Secant and cosecant are scale factors. Zoom the original triangle OHP about O by
 * sec φ = R/|x| (or cosec φ = R/|y|) and the blue base (or red height) becomes exactly R
 * long. A rigid move then lands the zoomed copy on the tangent triangle OPQ (or SPO).
 * This module is Three.js-free so the geometry can be unit-tested.
 */

export type GrowKind = "sec" | "cosec";

export interface GrowPoint {
  x: number;
  y: number;
  z: number;
}

export type GrowTriangle = [GrowPoint, GrowPoint, GrowPoint];

export interface GrowPlan {
  kind: GrowKind;
  radius: number;
  /** The zoom factor: sec φ or cosec φ as a positive length ratio. */
  scale: number;
  /** Original O, H, P. */
  source: GrowTriangle;
  /** Where O, H, P land: sec → O, P, Q; cosec → S, P, O. */
  target: GrowTriangle;
  /** Orthogonal 2×2 part of the landing move, row-major [a, b, c, d]. */
  linear: [number, number, number, number];
  translation: GrowPoint;
  /** True when the landing move mirrors the triangle (det = −1). */
  reflects: boolean;
}

export type GrowStage = "measure" | "zoom" | "place" | "done";

export interface GrowFrame {
  stage: GrowStage;
  /** Current zoom factor, 1 → plan.scale. */
  k: number;
  /** Progress through the measure stage, 0 → 1. */
  measure: number;
  vertices: GrowTriangle;
}

/** Stage boundaries on the 0→1 animation timeline. */
export const GROW_STAGES = { measureEnd: 0.3, zoomEnd: 0.65 } as const;

/** Constructions are hidden near the axes; match the lesson's threshold. */
export const GROW_MIN_COMPONENT = 0.12;

const point = (x: number, y: number, z = 0): GrowPoint => ({ x, y, z });

export function growPlan(kind: GrowKind, radius: number, angleRad: number): GrowPlan | null {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const leg = kind === "sec" ? cos : sin;
  if (!(radius > 0) || Math.abs(leg) <= GROW_MIN_COMPONENT) return null;

  const x = radius * cos;
  const y = radius * sin;
  const O = point(0, 0);
  const H = point(x, 0);
  const P = point(x, y);
  const scale = radius / Math.abs(kind === "sec" ? x : y);
  const target: GrowTriangle = kind === "sec"
    ? [O, P, point(radius / cos, 0)]
    : [point(0, radius / sin), P, O];

  // Solve A·(k·H) = target[1] − t and A·(k·P) = target[2] − t, with t = target[0].
  const t = target[0];
  const u1 = { x: scale * H.x, y: scale * H.y };
  const u2 = { x: scale * P.x, y: scale * P.y };
  const v1 = { x: target[1].x - t.x, y: target[1].y - t.y };
  const v2 = { x: target[2].x - t.x, y: target[2].y - t.y };
  const det = u1.x * u2.y - u2.x * u1.y;
  // A = [v1 v2]·[u1 u2]⁻¹
  const a = (v1.x * u2.y - v2.x * u1.y) / det;
  const b = (-v1.x * u2.x + v2.x * u1.x) / det;
  const c = (v1.y * u2.y - v2.y * u1.y) / det;
  const d = (-v1.y * u2.x + v2.y * u1.x) / det;

  return {
    kind,
    radius,
    scale,
    source: [O, H, P],
    target,
    linear: [a, b, c, d],
    translation: t,
    reflects: a * d - b * c < 0,
  };
}

const easeInOut = (s: number): number => s * s * (3 - 2 * s);

/** Rigidly move p part-way (s ∈ [0, 1]) along the plan's landing move. */
function placePoint(plan: GrowPlan, p: GrowPoint, s: number): GrowPoint {
  const [a, , c] = plan.linear;
  const t = plan.translation;
  let q: GrowPoint;
  if (plan.reflects) {
    // A 2D mirror is a half-turn about an in-plane axis in 3D, so the copy flips
    // over like a page instead of squashing through zero width.
    const beta = Math.atan2(c, a) / 2;
    const ux = Math.cos(beta);
    const uy = Math.sin(beta);
    const theta = Math.PI * s;
    const dot = ux * p.x + uy * p.y;
    const cross = ux * p.y - uy * p.x; // z of u × p
    q = point(
      p.x * Math.cos(theta) + ux * dot * (1 - Math.cos(theta)),
      p.y * Math.cos(theta) + uy * dot * (1 - Math.cos(theta)),
      cross * Math.sin(theta),
    );
  } else {
    const alpha = Math.atan2(c, a) * s;
    q = point(
      p.x * Math.cos(alpha) - p.y * Math.sin(alpha),
      p.x * Math.sin(alpha) + p.y * Math.cos(alpha),
    );
  }
  return point(q.x + t.x * s, q.y + t.y * s, q.z);
}

export function growFrame(plan: GrowPlan, progress: number): GrowFrame {
  const p = Math.min(1, Math.max(0, progress));
  const { measureEnd, zoomEnd } = GROW_STAGES;
  const measure = Math.min(1, p / measureEnd);
  const zoomS = easeInOut(Math.min(1, Math.max(0, (p - measureEnd) / (zoomEnd - measureEnd))));
  const placeS = easeInOut(Math.min(1, Math.max(0, (p - zoomEnd) / (1 - zoomEnd))));
  const k = 1 + (plan.scale - 1) * zoomS;
  const zoomed = plan.source.map((v) => point(v.x * k, v.y * k)) as GrowTriangle;
  const vertices = zoomed.map((v) => placePoint(plan, v, placeS)) as GrowTriangle;
  const stage: GrowStage = p >= 1 ? "done" : p < measureEnd ? "measure" : p < zoomEnd ? "zoom" : "place";
  return { stage, k, measure, vertices };
}
