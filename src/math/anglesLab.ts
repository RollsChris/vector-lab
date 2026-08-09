/** Pure helpers for the interactive Angles lesson. */

export type AngleMode =
  | "complementary"
  | "supplementary"
  | "around-point"
  | "vertically-opposite"
  | "adjacent-straight";

export interface Point {
  x: number;
  y: number;
}

export interface AngleReading {
  /** Degrees in (0, 360], positive anticlockwise from +x. */
  degrees: number;
  /** Unit direction of the ray that forms the free arm. */
  dir: Point;
}

export interface AnglesLabResult {
  mode: AngleMode;
  /** Named angle measures in degrees. */
  angles: readonly number[];
  /** Live total used by the mode (sum or single pair relation). */
  total: number;
  /** Target the relation aims for (90 / 180 / 360). */
  target: number;
  /** Absolute error from the target relation, in degrees. */
  error: number;
  holds: boolean;
  /** Short status for the panel. */
  message: string;
  /** Vertex of the figure. */
  origin: Point;
  /** Unit directions of the rays, anticlockwise from the fixed base. */
  rays: readonly Point[];
}

const EPS = 1e-6;
const HOLD_TOL = 0.75; // degrees

export function clampDegrees(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Wrap any angle into [0, 360). */
export function wrapDegrees(value: number): number {
  const mod = value % 360;
  return mod < 0 ? mod + 360 : mod;
}

/** Smallest absolute difference between two degree measures on the circle. */
export function degreeGap(a: number, b: number): number {
  const d = Math.abs(wrapDegrees(a) - wrapDegrees(b));
  return Math.min(d, 360 - d);
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function formatDegrees(value: number, digits = 1): string {
  const fixed = value.toFixed(digits);
  return `${fixed.replace(/\.0$/, "")}°`;
}

export function unitFromDegrees(degrees: number): Point {
  const r = toRadians(degrees);
  return { x: Math.cos(r), y: Math.sin(r) };
}

export function angleFromPoint(origin: Point, point: Point): number {
  return wrapDegrees(toDegrees(Math.atan2(point.y - origin.y, point.x - origin.x)));
}

/**
 * Build the live figure for a mode.
 *
 * `handles` are free-arm angles in degrees from the positive x-axis.
 * Complementary / supplementary / adjacent-straight use one free arm.
 * Around-point uses two free arms (three sectors).
 * Vertically-opposite uses one free arm; the opposite ray is automatic.
 */
export function computeAnglesLab(
  mode: AngleMode,
  handles: readonly number[],
  origin: Point = { x: 0, y: 0 },
): AnglesLabResult {
  switch (mode) {
    case "complementary":
      return twoPart(mode, handles[0] ?? 35, 90, origin, "Complementary angles sum to 90°.");
    case "supplementary":
    case "adjacent-straight":
      return twoPart(
        mode,
        handles[0] ?? 55,
        180,
        origin,
        mode === "adjacent-straight"
          ? "Adjacent angles on a straight line sum to 180°."
          : "Supplementary angles sum to 180°.",
      );
    case "around-point":
      return aroundPoint(handles, origin);
    case "vertically-opposite":
      return verticallyOpposite(handles[0] ?? 50, origin);
  }
}

function twoPart(
  mode: AngleMode,
  freeDegrees: number,
  target: number,
  origin: Point,
  message: string,
): AnglesLabResult {
  const a = clampDegrees(freeDegrees, 1, target - 1);
  const b = target - a;
  const rays = [unitFromDegrees(0), unitFromDegrees(a), unitFromDegrees(target === 360 ? 0 : target)];
  // For a straight line the third ray is the negative base.
  const finalRays =
    target === 180
      ? [unitFromDegrees(0), unitFromDegrees(a), unitFromDegrees(180)]
      : target === 90
        ? [unitFromDegrees(0), unitFromDegrees(a), unitFromDegrees(90)]
        : rays;
  return {
    mode,
    angles: [a, b],
    total: a + b,
    target,
    error: Math.abs(a + b - target),
    holds: Math.abs(a + b - target) <= HOLD_TOL,
    message,
    origin,
    rays: finalRays,
  };
}

function aroundPoint(handles: readonly number[], origin: Point): AnglesLabResult {
  const rawA = clampDegrees(handles[0] ?? 70, 8, 340);
  const rawB = clampDegrees(handles[1] ?? 200, 8, 350);
  const sorted = [rawA, rawB].sort((x, y) => x - y);
  let a = sorted[0];
  let b = sorted[1];
  // Keep three positive sectors.
  if (b - a < 8) b = Math.min(350, a + 8);
  if (a < 8) a = 8;
  if (360 - b < 8) b = 352;
  const angles = [a, b - a, 360 - b];
  const total = angles.reduce((s, v) => s + v, 0);
  return {
    mode: "around-point",
    angles,
    total,
    target: 360,
    error: Math.abs(total - 360),
    holds: Math.abs(total - 360) <= HOLD_TOL,
    message: "Angles around a point sum to 360°.",
    origin,
    rays: [unitFromDegrees(0), unitFromDegrees(a), unitFromDegrees(b)],
  };
}

function verticallyOpposite(freeDegrees: number, origin: Point): AnglesLabResult {
  const a = clampDegrees(freeDegrees, 5, 175);
  const opposite = a; // opposite corner equals free angle
  const adjacent = 180 - a;
  // Four rays from two lines: base through origin, free through origin.
  return {
    mode: "vertically-opposite",
    angles: [a, adjacent, opposite, adjacent],
    total: a, // relation is equality of opposite pair
    target: a,
    error: 0,
    holds: true,
    message: "Vertically opposite angles are equal at every crossing.",
    origin,
    rays: [
      unitFromDegrees(0),
      unitFromDegrees(a),
      unitFromDegrees(180),
      unitFromDegrees(180 + a),
    ],
  };
}

/** Arc points from startDeg to endDeg (anticlockwise), radius r. */
export function arcPoints(
  origin: Point,
  startDeg: number,
  endDeg: number,
  radius: number,
  samples = 24,
): Point[] {
  let sweep = endDeg - startDeg;
  while (sweep <= 0) sweep += 360;
  while (sweep > 360) sweep -= 360;
  const pts: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = startDeg + (sweep * i) / samples;
    const d = unitFromDegrees(t);
    pts.push({ x: origin.x + d.x * radius, y: origin.y + d.y * radius });
  }
  return pts;
}

/** Mid-direction (degrees) of an anticlockwise sector. */
export function sectorMidDegrees(startDeg: number, endDeg: number): number {
  let sweep = endDeg - startDeg;
  while (sweep <= 0) sweep += 360;
  return wrapDegrees(startDeg + sweep / 2);
}

export function almostEqual(a: number, b: number, tol = EPS): boolean {
  return Math.abs(a - b) <= tol;
}
