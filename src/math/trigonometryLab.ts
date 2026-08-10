/** Pure helpers for the interactive Trigonometry Lab lesson. */

export type TrigLabMode =
  | "discover"
  | "triangle"
  | "unit-circle"
  | "quadrants"
  | "special"
  | "solve"
  | "tricks";

export type SolveCase = "SAS" | "SSS" | "ASA";

export interface Point {
  x: number;
  y: number;
}

export interface UnitCircleState {
  angleDeg: number;
  angleRad: number;
  /** Principal angle in [0, 360). */
  wrappedDeg: number;
  radius: number;
  x: number;
  y: number;
  sin: number;
  cos: number;
  tan: number | null;
  sec: number | null;
  csc: number | null;
  cot: number | null;
  quadrant: 1 | 2 | 3 | 4;
  referenceDeg: number;
  signs: { sin: 1 | -1 | 0; cos: 1 | -1 | 0; tan: 1 | -1 | 0 | null };
}

export interface RightTriangleState {
  angleDeg: number;
  hypotenuse: number;
  opposite: number;
  adjacent: number;
  sin: number;
  cos: number;
  tan: number;
  /** Vertices: right angle at C, angle at A, remaining at B. */
  C: Point;
  A: Point;
  B: Point;
}

export interface ChordState {
  /** Central angle in degrees (0, 360]. */
  centralDeg: number;
  radius: number;
  chord: number;
  halfChord: number;
  halfAngleDeg: number;
  /** Modern sine of half the central angle. */
  sineHalf: number;
  /** Historical chord table value = 2 R sin(θ/2). */
  historicalChord: number;
}

export interface SpecialAngleExact {
  deg: number;
  radLabel: string;
  sin: string;
  cos: string;
  tan: string;
  sinValue: number;
  cosValue: number;
  tanValue: number | null;
}

export interface TriangleSolveInput {
  case: SolveCase;
  /** Side a opposite A, etc. Missing values are NaN. */
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
}

export interface TriangleSolveResult {
  valid: boolean;
  reason?: string;
  ambiguous?: boolean;
  /** Second solution for SSA-like ambiguity when present. */
  alternate?: Omit<TriangleSolveResult, "alternate" | "ambiguous">;
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
  area: number;
  /** Planar coordinates with A at origin, AB along +x. */
  vertices: readonly [Point, Point, Point];
}

export interface AmplitudePhase {
  a: number;
  b: number;
  R: number;
  /** Phase so a cos θ + b sin θ = R cos(θ − φ). */
  phiRad: number;
  phiDeg: number;
}

export interface SmallAngleCheck {
  angleRad: number;
  angleDeg: number;
  sin: number;
  tan: number;
  cos: number;
  sinApprox: number;
  tanApprox: number;
  cosApprox: number;
  sinError: number;
  tanError: number;
  cosError: number;
}

const EPS = 1e-12;
const DEG = Math.PI / 180;

export const MODE_ORDER: readonly TrigLabMode[] = [
  "discover",
  "triangle",
  "unit-circle",
  "quadrants",
  "special",
  "solve",
  "tricks",
] as const;

export const MODE_META: Record<
  TrigLabMode,
  { label: string; title: string; hint: string }
> = {
  discover: {
    label: "Discover",
    title: "Why sin needs only an angle",
    hint: "Seven manual steps — nothing auto-advances. Optional one-shot animations play within a step. The hard idea comes first, the circle story last.",
  },
  triangle: {
    label: "Triangle",
    title: "Angle alone, two sizes",
    hint: "Two similar right triangles at one angle. Sides scale; the ratio sin/cos/tan does not.",
  },
  "unit-circle": {
    label: "Unit circle",
    title: "Circle projections",
    hint: "x = cos θ, y = sin θ. Watch the wave unwrap as the point spins.",
  },
  quadrants: {
    label: "Quadrants",
    title: "Signs & reference angles",
    hint: "Same acute reference angle; the quadrant only flips signs.",
  },
  special: {
    label: "Specials",
    title: "Exact special angles",
    hint: "30-60-90 and 45-45-90 give exact √ values. Snap and read them.",
  },
  solve: {
    label: "Solve",
    title: "Laws of sines & cosines",
    hint: "SAS, SSS and ASA cases. Live area and side checks.",
  },
  tricks: {
    label: "Tricks",
    title: "Small angles & one-wave form",
    hint: "sin θ ≈ θ near zero, and a cos + b sin collapses to one cosine.",
  },
};

export function wrapDegrees(angleDeg: number): number {
  let a = angleDeg % 360;
  if (a < 0) a += 360;
  // Keep 360 as 0 for principal value, except callers may want full turn display.
  return a === 360 ? 0 : a;
}

export function toRadians(deg: number): number {
  return deg * DEG;
}

export function toDegrees(rad: number): number {
  return rad / DEG;
}

/** Format a number without stripping significant trailing zeros (e.g. 60 must stay "60"). */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  // Collapse -0 to 0 for display.
  const n = value === 0 ? 0 : value;
  const fixed = n.toFixed(digits);
  // Only trim fractional trailing zeros, never digits in the integer part.
  // Bad: "60".replace(/\.?0+$/, "") → "6"
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatDegrees(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}°`;
}

export function almostEqual(a: number, b: number, tol = 1e-9): boolean {
  return Math.abs(a - b) <= tol;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(p: Point, q: Point): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

export function quadrantOf(angleDeg: number): 1 | 2 | 3 | 4 {
  const a = wrapDegrees(angleDeg);
  if (a >= 0 && a < 90) return 1;
  if (a < 180) return 2;
  if (a < 270) return 3;
  return 4;
}

/** Acute-or-right reference angle to the nearest x-axis ray. */
export function referenceAngleDeg(angleDeg: number): number {
  const a = wrapDegrees(angleDeg);
  if (a <= 90) return a;
  if (a <= 180) return 180 - a;
  if (a <= 270) return a - 180;
  return 360 - a;
}

export function quadrantSigns(angleDeg: number): UnitCircleState["signs"] {
  const a = wrapDegrees(angleDeg);
  // Exact axes
  if (almostEqual(a, 0) || almostEqual(a, 360)) return { sin: 0, cos: 1, tan: 0 };
  if (almostEqual(a, 90)) return { sin: 1, cos: 0, tan: null };
  if (almostEqual(a, 180)) return { sin: 0, cos: -1, tan: 0 };
  if (almostEqual(a, 270)) return { sin: -1, cos: 0, tan: null };

  const q = quadrantOf(a);
  if (q === 1) return { sin: 1, cos: 1, tan: 1 };
  if (q === 2) return { sin: 1, cos: -1, tan: -1 };
  if (q === 3) return { sin: -1, cos: -1, tan: 1 };
  return { sin: -1, cos: 1, tan: -1 };
}

export function unitCircleState(angleDeg: number, radius = 1): UnitCircleState {
  const R = Math.max(EPS, radius);
  const angleRad = toRadians(angleDeg);
  const wrappedDeg = wrapDegrees(angleDeg);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const x = R * cos;
  const y = R * sin;
  const tan = Math.abs(cos) < 1e-10 ? null : sin / cos;
  const sec = Math.abs(cos) < 1e-10 ? null : 1 / cos;
  const csc = Math.abs(sin) < 1e-10 ? null : 1 / sin;
  const cot = Math.abs(sin) < 1e-10 ? null : cos / sin;
  return {
    angleDeg,
    angleRad,
    wrappedDeg,
    radius: R,
    x,
    y,
    sin,
    cos,
    tan,
    sec,
    csc,
    cot,
    quadrant: quadrantOf(wrappedDeg),
    referenceDeg: referenceAngleDeg(wrappedDeg),
    signs: quadrantSigns(wrappedDeg),
  };
}

/**
 * Right triangle with acute angle at A, right angle at C, hyp AB.
 * Placed with C at origin, A on +x, B in Q1.
 */
export function rightTriangleState(angleDeg: number, hypotenuse: number, origin: Point = { x: 0, y: 0 }): RightTriangleState {
  const deg = clamp(angleDeg, 0.5, 89.5);
  const hyp = Math.max(0.2, hypotenuse);
  const rad = toRadians(deg);
  const adjacent = hyp * Math.cos(rad);
  const opposite = hyp * Math.sin(rad);
  const C = { ...origin };
  const A = { x: origin.x + adjacent, y: origin.y };
  const B = { x: origin.x, y: origin.y + opposite };
  return {
    angleDeg: deg,
    hypotenuse: hyp,
    opposite,
    adjacent,
    sin: opposite / hyp,
    cos: adjacent / hyp,
    tan: opposite / adjacent,
    C,
    A,
    B,
  };
}

/** Chord of central angle θ on a circle of radius R equals 2 R sin(θ/2). */
export function chordState(centralDeg: number, radius = 1): ChordState {
  const R = Math.max(EPS, radius);
  const central = clamp(centralDeg, 0.1, 360);
  const half = central / 2;
  const sineHalf = Math.sin(toRadians(half));
  const halfChord = R * sineHalf;
  const chord = 2 * halfChord;
  return {
    centralDeg: central,
    radius: R,
    chord,
    halfChord,
    halfAngleDeg: half,
    sineHalf,
    historicalChord: chord,
  };
}

export const SPECIAL_ANGLES: readonly SpecialAngleExact[] = [
  { deg: 0, radLabel: "0", sin: "0", cos: "1", tan: "0", sinValue: 0, cosValue: 1, tanValue: 0 },
  {
    deg: 30,
    radLabel: "π/6",
    sin: "1/2",
    cos: "√3/2",
    tan: "1/√3",
    sinValue: 0.5,
    cosValue: Math.sqrt(3) / 2,
    tanValue: 1 / Math.sqrt(3),
  },
  {
    deg: 45,
    radLabel: "π/4",
    sin: "√2/2",
    cos: "√2/2",
    tan: "1",
    sinValue: Math.SQRT1_2,
    cosValue: Math.SQRT1_2,
    tanValue: 1,
  },
  {
    deg: 60,
    radLabel: "π/3",
    sin: "√3/2",
    cos: "1/2",
    tan: "√3",
    sinValue: Math.sqrt(3) / 2,
    cosValue: 0.5,
    tanValue: Math.sqrt(3),
  },
  { deg: 90, radLabel: "π/2", sin: "1", cos: "0", tan: "undef", sinValue: 1, cosValue: 0, tanValue: null },
  {
    deg: 120,
    radLabel: "2π/3",
    sin: "√3/2",
    cos: "−1/2",
    tan: "−√3",
    sinValue: Math.sqrt(3) / 2,
    cosValue: -0.5,
    tanValue: -Math.sqrt(3),
  },
  {
    deg: 135,
    radLabel: "3π/4",
    sin: "√2/2",
    cos: "−√2/2",
    tan: "−1",
    sinValue: Math.SQRT1_2,
    cosValue: -Math.SQRT1_2,
    tanValue: -1,
  },
  {
    deg: 150,
    radLabel: "5π/6",
    sin: "1/2",
    cos: "−√3/2",
    tan: "−1/√3",
    sinValue: 0.5,
    cosValue: -Math.sqrt(3) / 2,
    tanValue: -1 / Math.sqrt(3),
  },
  { deg: 180, radLabel: "π", sin: "0", cos: "−1", tan: "0", sinValue: 0, cosValue: -1, tanValue: 0 },
  {
    deg: 210,
    radLabel: "7π/6",
    sin: "−1/2",
    cos: "−√3/2",
    tan: "1/√3",
    sinValue: -0.5,
    cosValue: -Math.sqrt(3) / 2,
    tanValue: 1 / Math.sqrt(3),
  },
  {
    deg: 225,
    radLabel: "5π/4",
    sin: "−√2/2",
    cos: "−√2/2",
    tan: "1",
    sinValue: -Math.SQRT1_2,
    cosValue: -Math.SQRT1_2,
    tanValue: 1,
  },
  {
    deg: 240,
    radLabel: "4π/3",
    sin: "−√3/2",
    cos: "−1/2",
    tan: "√3",
    sinValue: -Math.sqrt(3) / 2,
    cosValue: -0.5,
    tanValue: Math.sqrt(3),
  },
  { deg: 270, radLabel: "3π/2", sin: "−1", cos: "0", tan: "undef", sinValue: -1, cosValue: 0, tanValue: null },
  {
    deg: 300,
    radLabel: "5π/3",
    sin: "−√3/2",
    cos: "1/2",
    tan: "−√3",
    sinValue: -Math.sqrt(3) / 2,
    cosValue: 0.5,
    tanValue: -Math.sqrt(3),
  },
  {
    deg: 315,
    radLabel: "7π/4",
    sin: "−√2/2",
    cos: "√2/2",
    tan: "−1",
    sinValue: -Math.SQRT1_2,
    cosValue: Math.SQRT1_2,
    tanValue: -1,
  },
  {
    deg: 330,
    radLabel: "11π/6",
    sin: "−1/2",
    cos: "√3/2",
    tan: "−1/√3",
    sinValue: -0.5,
    cosValue: Math.sqrt(3) / 2,
    tanValue: -1 / Math.sqrt(3),
  },
  { deg: 360, radLabel: "2π", sin: "0", cos: "1", tan: "0", sinValue: 0, cosValue: 1, tanValue: 0 },
];

export function nearestSpecialAngle(angleDeg: number): SpecialAngleExact {
  const a = wrapDegrees(angleDeg);
  let best = SPECIAL_ANGLES[0];
  let bestDist = Infinity;
  for (const s of SPECIAL_ANGLES) {
    const d = Math.min(Math.abs(s.deg - a), 360 - Math.abs(s.deg - a));
    // Prefer 0 over 360 when equidistant at 0.
    const prefer = s.deg === 0 && almostEqual(a, 0) ? -1e-9 : 0;
    if (d + prefer < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

export function snapToSpecial(angleDeg: number, toleranceDeg = 4): number {
  const near = nearestSpecialAngle(angleDeg);
  const a = wrapDegrees(angleDeg);
  const d = Math.min(Math.abs(near.deg - a), 360 - Math.abs(near.deg - a));
  if (d <= toleranceDeg) {
    // Keep 360 only if user was near full turn from above 350; else 0.
    if (near.deg === 360) return a > 180 ? 360 : 0;
    return near.deg;
  }
  return angleDeg;
}

/** a cos θ + b sin θ = R cos(θ − φ) with R≥0, φ in (-180, 180]. */
export function amplitudePhase(a: number, b: number): AmplitudePhase {
  const R = Math.hypot(a, b);
  if (R < EPS) return { a, b, R: 0, phiRad: 0, phiDeg: 0 };
  const phiRad = Math.atan2(b, a);
  return { a, b, R, phiRad, phiDeg: toDegrees(phiRad) };
}

export function evaluateCosineWave(R: number, phiRad: number, thetaRad: number): number {
  return R * Math.cos(thetaRad - phiRad);
}

export function smallAngleCheck(angleDeg: number): SmallAngleCheck {
  const angleRad = toRadians(angleDeg);
  const sin = Math.sin(angleRad);
  const cos = Math.cos(angleRad);
  const tan = Math.abs(cos) < 1e-12 ? Number.NaN : Math.tan(angleRad);
  const sinApprox = angleRad;
  const tanApprox = angleRad;
  const cosApprox = 1 - (angleRad * angleRad) / 2;
  return {
    angleRad,
    angleDeg,
    sin,
    tan,
    cos,
    sinApprox,
    tanApprox,
    cosApprox,
    sinError: Math.abs(sin - sinApprox),
    tanError: Number.isFinite(tan) ? Math.abs(tan - tanApprox) : Number.NaN,
    cosError: Math.abs(cos - cosApprox),
  };
}

function angleFromSides(opposite: number, sideB: number, sideC: number): number {
  const cosA = (sideB * sideB + sideC * sideC - opposite * opposite) / (2 * sideB * sideC);
  return toDegrees(Math.acos(clamp(cosA, -1, 1)));
}

function placeTriangle(a: number, b: number, c: number, A: number, B: number, C: number): readonly [Point, Point, Point] {
  // A at origin, B at (c, 0), C in upper half from angle A and side b.
  const Ax = 0;
  const Ay = 0;
  const Bx = c;
  const By = 0;
  const Cx = b * Math.cos(toRadians(A));
  const Cy = b * Math.sin(toRadians(A));
  void B;
  void C;
  void a;
  return [
    { x: Ax, y: Ay },
    { x: Bx, y: By },
    { x: Cx, y: Cy },
  ];
}

function areaFromSides(a: number, b: number, c: number): number {
  const s = (a + b + c) / 2;
  const under = s * (s - a) * (s - b) * (s - c);
  return under <= 0 ? 0 : Math.sqrt(under);
}

function finalize(
  a: number,
  b: number,
  c: number,
  A: number,
  B: number,
  C: number,
  extra?: { valid?: boolean; reason?: string; ambiguous?: boolean },
): TriangleSolveResult {
  if (!(a > EPS && b > EPS && c > EPS)) {
    return {
      valid: false,
      reason: "Sides must be positive.",
      a,
      b,
      c,
      A,
      B,
      C,
      area: 0,
      vertices: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0.5, y: 0.5 },
      ],
    };
  }
  if (a + b <= c + 1e-9 || a + c <= b + 1e-9 || b + c <= a + 1e-9) {
    return {
      valid: false,
      reason: "Triangle inequality fails.",
      a,
      b,
      c,
      A,
      B,
      C,
      area: 0,
      vertices: placeTriangle(a, b, c, A || 60, B || 60, C || 60),
    };
  }
  const sum = A + B + C;
  if (!almostEqual(sum, 180, 0.05)) {
    // Renormalize lightly from sides if angles drifted.
  }
  return {
    valid: extra?.valid ?? true,
    reason: extra?.reason,
    ambiguous: extra?.ambiguous,
    a,
    b,
    c,
    A,
    B,
    C,
    area: areaFromSides(a, b, c),
    vertices: placeTriangle(a, b, c, A, B, C),
  };
}

/**
 * Solve a triangle.
 * - SAS: given b, C, a (two sides and included angle C)
 * - SSS: given a, b, c
 * - ASA: given A, c, B (two angles and included side c)
 */
export function solveTriangle(input: TriangleSolveInput): TriangleSolveResult {
  const { case: kind } = input;

  if (kind === "SSS") {
    const a = input.a;
    const b = input.b;
    const c = input.c;
    if (!(a > EPS && b > EPS && c > EPS)) {
      return finalize(a, b, c, 0, 0, 0, { valid: false, reason: "Enter three positive sides." });
    }
    if (a + b <= c || a + c <= b || b + c <= a) {
      return finalize(a, b, c, 0, 0, 0, { valid: false, reason: "Triangle inequality fails." });
    }
    const A = angleFromSides(a, b, c);
    const B = angleFromSides(b, a, c);
    const C = 180 - A - B;
    return finalize(a, b, c, A, B, C);
  }

  if (kind === "SAS") {
    // sides a,b with included angle C
    const a = input.a;
    const b = input.b;
    const C = input.C;
    if (!(a > EPS && b > EPS && C > EPS && C < 180)) {
      return finalize(a, b, 1, 0, 0, C, { valid: false, reason: "Need sides a,b and included angle C ∈ (0°,180°)." });
    }
    const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(toRadians(C)));
    // angles via law of sines / cosines
    const A = angleFromSides(a, b, c);
    const B = 180 - A - C;
    return finalize(a, b, c, A, B, C);
  }

  // ASA: angles A,B and included side c
  const A = input.A;
  const B = input.B;
  const c = input.c;
  if (!(A > EPS && B > EPS && A + B < 180 && c > EPS)) {
    return finalize(1, 1, c, A, B, 0, {
      valid: false,
      reason: "Need angles A,B with A+B<180° and included side c.",
    });
  }
  const C = 180 - A - B;
  const a = c * Math.sin(toRadians(A)) / Math.sin(toRadians(C));
  const b = c * Math.sin(toRadians(B)) / Math.sin(toRadians(C));
  return finalize(a, b, c, A, B, C);
}

/** Build SAS defaults used by the lab. */
export function defaultSolveInput(kind: SolveCase): TriangleSolveInput {
  if (kind === "SSS") return { case: "SSS", a: 7, b: 8, c: 9, A: NaN, B: NaN, C: NaN };
  if (kind === "SAS") return { case: "SAS", a: 7, b: 10, c: NaN, A: NaN, B: NaN, C: 60 };
  return { case: "ASA", a: NaN, b: NaN, c: 10, A: 40, B: 60, C: NaN };
}

/** Arc points for an angle at vertex V from direction to P toward Q. */
export function angleArcPoints(
  V: Point,
  P: Point,
  Q: Point,
  radius: number,
  samples = 16,
): Point[] {
  const a1 = Math.atan2(P.y - V.y, P.x - V.x);
  const a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
  let start = a1;
  let sweep = a2 - a1;
  while (sweep <= 0) sweep += Math.PI * 2;
  if (sweep > Math.PI) {
    start = a2;
    sweep = a1 - a2;
    while (sweep <= 0) sweep += Math.PI * 2;
  }
  const pts: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = start + (sweep * i) / samples;
    pts.push({ x: V.x + Math.cos(t) * radius, y: V.y + Math.sin(t) * radius });
  }
  return pts;
}

/** Sample sin or cos wave y-values for unwrapping display. */
export function sampleWave(
  kind: "sin" | "cos",
  fromDeg: number,
  toDeg: number,
  samples: number,
): Point[] {
  const pts: Point[] = [];
  const span = toDeg - fromDeg;
  for (let i = 0; i <= samples; i++) {
    const deg = fromDeg + (span * i) / samples;
    const rad = toRadians(deg);
    const y = kind === "sin" ? Math.sin(rad) : Math.cos(rad);
    // Map angle degrees to x in a readable range later; store deg as x.
    pts.push({ x: deg, y });
  }
  return pts;
}

/** Pythagorean check residual |sin²+cos²−1|. */
export function identityResidual(angleDeg: number): number {
  const s = Math.sin(toRadians(angleDeg));
  const c = Math.cos(toRadians(angleDeg));
  return Math.abs(s * s + c * c - 1);
}

/** The seven manual Discover steps, in order. Discover drives the sine angle φ. */
export type DiscoverPhase =
  | "mystery"
  | "ratio"
  | "scale"
  | "normalize"
  | "thirty"
  | "chord"
  | "unit";

export interface DiscoverStepMeta {
  phase: DiscoverPhase;
  title: string;
  /** One-line focus shown under the step card. */
  focus: string;
  /** Whether this step offers a one-shot "Play beat" animation. */
  hasBeat: boolean;
}

export const DISCOVER_STEP_META: readonly DiscoverStepMeta[] = [
  {
    phase: "mystery",
    title: "The calculator mystery",
    focus: "You type sin(30) and get 0.5 with no sides given. What is the machine answering?",
    hasBeat: false,
  },
  {
    phase: "ratio",
    title: "Sine is a ratio",
    focus: "sin φ = opposite / hypotenuse — two lengths of one right triangle.",
    hasBeat: true,
  },
  {
    phase: "scale",
    title: "Size cancels",
    focus: "Double every side and opp/hyp is unchanged. All triangles at φ are similar.",
    hasBeat: true,
  },
  {
    phase: "normalize",
    title: "Normalize the hypotenuse",
    focus: "Set hyp = 1 without changing the angle; the opposite length is the number sin φ.",
    hasBeat: true,
  },
  {
    phase: "thirty",
    title: "Why sin(30°) = ½ exactly",
    focus: "Split an equilateral triangle: opposite 1, hypotenuse 2, so sin 30° = ½ — no calculator.",
    hasBeat: true,
  },
  {
    phase: "chord",
    title: "Where sine came from",
    focus: "Half a chord of the central angle 2φ is the opposite side: sin φ = chord(2φ) / (2R).",
    hasBeat: true,
  },
  {
    phase: "unit",
    title: "The unit circle",
    focus: "The normalize step drawn as a circle: at R = 1 the height y is sin φ.",
    hasBeat: false,
  },
];

/** Equilateral triangle of the given side, split by its altitude into a 30-60-90. */
export function equilateralSplit30(side = 2): {
  side: number;
  half: number;
  altitude: number;
  hypotenuse: number;
  sin30: number;
} {
  const s = Math.max(EPS, side);
  return {
    side: s,
    half: s / 2,
    altitude: (s * Math.sqrt(3)) / 2,
    hypotenuse: s,
    sin30: 0.5,
  };
}

/** Phase for the Discover story mapped from a 0..1 scrub across the seven steps. */
export function discoverBeat(progress: number): {
  phase: DiscoverPhase;
  title: string;
  focus: string;
} {
  const t = clamp(progress, 0, 1);
  const index = Math.min(DISCOVER_STEP_META.length - 1, Math.floor(t * DISCOVER_STEP_META.length));
  const meta = DISCOVER_STEP_META[index];
  return { phase: meta.phase, title: meta.title, focus: meta.focus };
}

