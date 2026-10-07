/** Pure geometry for the trigonometric-functions story. No THREE imports. */

export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  O: Point;
  H: Point;
  P: Point;
}

export interface StoryValues {
  phi: number;
  sin: number;
  cos: number;
  tan: number;
  sec: number;
  cosec: number;
  cot: number;
}

export interface StoryStepMeta {
  id: string;
  title: string;
  /** Whether this step offers a one-shot ▶ animation. Never auto-advances. */
  hasBeat: boolean;
}

export const PHI_MIN = 15;
export const PHI_MAX = 75;

export const STORY_STEPS: readonly StoryStepMeta[] = [
  { id: "circle", title: "One circle, radius 1", hasBeat: true },
  { id: "sin", title: "sin φ is the height", hasBeat: true },
  { id: "cos", title: "cos φ is the base", hasBeat: true },
  { id: "zoom", title: "Zooming: every side times the same number", hasBeat: true },
  { id: "tan", title: "Zoom until the base is 1 → tan φ", hasBeat: true },
  { id: "sec", title: "Same zoom, the hypotenuse → sec φ", hasBeat: true },
  { id: "cosec", title: "Zoom until the height is 1 → cosec φ", hasBeat: true },
  { id: "cot", title: "Same zoom, the base → cot φ", hasBeat: true },
  { id: "tangent-base", title: "Tangent at P → the base-1 triangle again", hasBeat: true },
  { id: "tangent-height", title: "Same tangent → the height-1 triangle", hasBeat: true },
  { id: "all", title: "All six, live", hasBeat: true },
];

/** Clamp the story angle. The picture only uses the open first quadrant. */
export function clampPhi(phiDeg: number): number {
  if (!Number.isFinite(phiDeg)) return PHI_MIN;
  return Math.min(PHI_MAX, Math.max(PHI_MIN, phiDeg));
}

/** Smoothstep ease on [0, 1]. Inputs outside the range are clamped. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function values(phiDeg: number): StoryValues {
  const phi = clampPhi(phiDeg);
  const r = (phi * Math.PI) / 180;
  const sin = Math.sin(r);
  const cos = Math.cos(r);
  return {
    phi,
    sin,
    cos,
    tan: sin / cos,
    sec: 1 / cos,
    cosec: 1 / sin,
    cot: cos / sin,
  };
}

/** Unit-radius triangle: hypotenuse OP = 1, height HP = sin φ, base OH = cos φ. */
export function baseTriangle(phiDeg: number): Triangle {
  const { sin, cos } = values(phiDeg);
  return {
    O: { x: 0, y: 0 },
    H: { x: cos, y: 0 },
    P: { x: cos, y: sin },
  };
}

export function scalePoint(p: Point, k: number): Point {
  return { x: p.x * k, y: p.y * k };
}

/** Zoom about O: every point p maps to k·p. O stays put. */
export function zoomTriangle(phiDeg: number, k: number): Triangle {
  const base = baseTriangle(phiDeg);
  return {
    O: { x: 0, y: 0 },
    H: scalePoint(base.H, k),
    P: scalePoint(base.P, k),
  };
}

/** k grows from 1 to kTarget. t = 0 is the base triangle; t = 1 is the target zoom. */
export function zoomAt(phiDeg: number, kTarget: number, t: number): Triangle {
  const k = 1 + (kTarget - 1) * smoothstep(t);
  return zoomTriangle(phiDeg, k);
}

export interface CosZoom {
  k: number;
  O: Point;
  A: Point;
  T: Point;
  triangle: Triangle;
}

/** ÷cos zoom. Base lands on A = (1, 0); height AT = tan φ; hypotenuse OT = sec φ. */
export function cosZoom(phiDeg: number): CosZoom {
  const v = values(phiDeg);
  const k = 1 / v.cos;
  return {
    k,
    O: { x: 0, y: 0 },
    A: { x: 1, y: 0 },
    T: { x: 1, y: v.tan },
    triangle: zoomTriangle(phiDeg, k),
  };
}

export interface SinZoom {
  k: number;
  O: Point;
  B: Point;
  H: Point;
  C: Point;
  triangle: Triangle;
}

/** ÷sin zoom. Height lands on y = 1 at C; base OH' = cot φ; hypotenuse OC = cosec φ. */
export function sinZoom(phiDeg: number): SinZoom {
  const v = values(phiDeg);
  const k = 1 / v.sin;
  const triangle = zoomTriangle(phiDeg, k);
  return {
    k,
    O: { x: 0, y: 0 },
    B: { x: 0, y: 1 },
    H: triangle.H,
    C: triangle.P,
    triangle,
  };
}

/** Anticlockwise rotation about the origin, in degrees. A negative angle is clockwise. */
export function swing(point: Point, angleDeg: number): Point {
  const r = (angleDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return {
    x: point.x * c - point.y * s,
    y: point.x * s + point.y * c,
  };
}

/**
 * Mirror a point across the line through O at lineDeg. Folding OAT across φ/2 lands it on OPQ;
 * folding OBC across (φ + 90)/2 lands it on OSP.
 */
export function reflectAcross(point: Point, lineDeg: number): Point {
  const r = (2 * lineDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: point.x * c + point.y * s, y: point.x * s - point.y * c };
}

export interface TangentAtP {
  P: Point;
  S: Point;
  Q: Point;
  PQ: number;
  SP: number;
}

/**
 * Tangent to the unit circle at P. It meets the axes at S = (0, cosec φ) and Q = (sec φ, 0).
 * Along that line, PQ = tan φ and SP = cot φ.
 */
export function tangentAtP(phiDeg: number): TangentAtP {
  const v = values(phiDeg);
  const P = { x: v.cos, y: v.sin };
  const S = { x: 0, y: v.cosec };
  const Q = { x: v.sec, y: 0 };
  return {
    P,
    S,
    Q,
    PQ: Math.hypot(Q.x - P.x, Q.y - P.y),
    SP: Math.hypot(P.x - S.x, P.y - S.y),
  };
}

export function tangentLengths(phiDeg: number): { PQ: number; SP: number } {
  const t = tangentAtP(phiDeg);
  return { PQ: t.PQ, SP: t.SP };
}

/**
 * Final-step beat only. Sweeps a visual angle from 15° up to 75° and back to the stored φ.
 * Does not replace the stored angle.
 */
export function sweepPhi(storedPhi: number, t: number): number {
  const stored = clampPhi(storedPhi);
  const x = Math.min(1, Math.max(0, t));
  if (x <= 0.5) return PHI_MIN + (PHI_MAX - PHI_MIN) * smoothstep(x / 0.5);
  return PHI_MAX + (stored - PHI_MAX) * smoothstep((x - 0.5) / 0.5);
}
