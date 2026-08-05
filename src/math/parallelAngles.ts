/**
 * Pure parallel-line / transversal angle geometry.
 *
 * Two independently angled lines and one transversal. Computes the two
 * intersections and the eight named corner angles with identities that follow
 * the figure (line index + NW/NE/SE/SW relative to the directed transversal),
 * not screen up/down — so rotating the whole configuration keeps the same labels.
 *
 * Free of three.js so theorems and converses can be unit-tested directly.
 */

export interface Point {
  x: number;
  y: number;
}

/** Corner of a crossing, named relative to the directed transversal. */
export type Corner = "NW" | "NE" | "SE" | "SW";

/** Eight angles: four at each line ∩ transversal. */
export type AngleId = `L1-${Corner}` | `L2-${Corner}`;

export type TheoremKind =
  | "corresponding"
  | "alternate-interior"
  | "alternate-exterior"
  | "co-interior"
  | "vertically-opposite"
  | "adjacent"
  | "converse-corresponding"
  | "converse-alternate-interior";

export interface AnglePair {
  a: AngleId;
  b: AngleId;
  /** Expected relation when the named theorem applies. */
  relation: "equal" | "supplementary";
}

export interface ParallelLinesInput {
  /** Direction angle of line 1 in radians (mod π — lines are undirected). */
  line1Angle: number;
  /** Direction angle of line 2 in radians. */
  line2Angle: number;
  /** Direction angle of the transversal in radians (directed for naming). */
  transversalAngle: number;
  /**
   * Signed offset of each line from the origin along its normal
   * (n = (−sin θ, cos θ)). Defaults place the lines on opposite sides.
   */
  line1Offset?: number;
  line2Offset?: number;
  /** Point the transversal is forced through. Default origin. */
  transversalThrough?: Point;
  /** |line1−line2| (mod π, folded to [0, π/2]) at or below this ⇒ parallel. */
  parallelTolerance?: number;
  /**
   * |sin(line − transversal)| below this ⇒ a line is nearly parallel to the
   * transversal and intersections are treated as invalid.
   */
  degeneracyTolerance?: number;
  /**
   * When set, each intersection must lie on the visible segment of its line
   * (within this distance of the line's reference point along the line) and
   * within this radius of the origin. Matches the lesson's drawn half-length.
   */
  visibleHalfLength?: number;
}

export interface ParallelAnglesResult {
  valid: boolean;
  /** Populated when `valid` is false. */
  reason?: string;
  parallel: boolean;
  /** Smallest angle between the two lines, in [0, π/2]. */
  lineAngleDifference: number;
  intersection1: Point | null;
  intersection2: Point | null;
  /** Unit direction of the directed transversal. */
  transversalDir: Point;
  /** Unit direction of each line. */
  line1Dir: Point;
  line2Dir: Point;
  /** Eight corner readings in radians, in (0, π). NaN when invalid. */
  angles: Record<AngleId, number>;
  /** Degrees, same keys. */
  anglesDeg: Record<AngleId, number>;
}

/**
 * Shared angular tolerance (radians) for parallel detection and theorem pair
 * checks. Corresponding / alternate angles differ by exactly the line-angle
 * gap, so these must stay equal — otherwise the UI can report parallel while
 * the highlighted relation fails (or the reverse) inside the band.
 */
export const DEFAULT_ANGLE_TOL = (1 * Math.PI) / 180; // 1°
const DEFAULT_PARALLEL_TOL = DEFAULT_ANGLE_TOL;
const DEFAULT_DEGEN_TOL = 1e-3;
const EPS = 1e-12;

const CORNERS: readonly Corner[] = ["NW", "NE", "SE", "SW"];
const ANGLE_IDS: readonly AngleId[] = [
  "L1-NW",
  "L1-NE",
  "L1-SE",
  "L1-SW",
  "L2-NW",
  "L2-NE",
  "L2-SE",
  "L2-SW",
];

const NAN_ANGLES = Object.fromEntries(ANGLE_IDS.map((id) => [id, NaN])) as Record<AngleId, number>;

export function unit(angle: number): Point {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function normal(angle: number): Point {
  // Left-hand normal of the direction (cos, sin).
  return { x: -Math.sin(angle), y: Math.cos(angle) };
}

/** Smallest angle between two undirected lines, in [0, π/2]. */
export function lineAngleBetween(a: number, b: number): number {
  let d = Math.abs(a - b) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d;
}

export function areParallel(a: number, b: number, tolerance = DEFAULT_PARALLEL_TOL): boolean {
  return lineAngleBetween(a, b) <= tolerance;
}

/**
 * Intersection of line (point p, direction d) with line (point q, direction e).
 * Returns null when the directions are parallel (including opposite).
 */
export function lineIntersection(p: Point, d: Point, q: Point, e: Point): Point | null {
  const den = d.x * e.y - d.y * e.x;
  if (Math.abs(den) < EPS) return null;
  const qx = q.x - p.x;
  const qy = q.y - p.y;
  const t = (qx * e.y - qy * e.x) / den;
  return { x: p.x + t * d.x, y: p.y + t * d.y };
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function scale(v: Point, s: number): Point {
  return { x: v.x * s, y: v.y * s };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function hypot(v: Point): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Point): Point | null {
  const len = hypot(v);
  if (len < EPS) return null;
  return { x: v.x / len, y: v.y / len };
}

/** Unsigned angle between two non-zero directions, in [0, π]. */
function unsignedAngle(a: Point, b: Point): number {
  const la = hypot(a);
  const lb = hypot(b);
  if (la < EPS || lb < EPS) return NaN;
  return Math.acos(clamp(dot(a, b) / (la * lb), -1, 1));
}

function emptyResult(
  partial: Partial<ParallelAnglesResult> & Pick<ParallelAnglesResult, "valid" | "parallel" | "lineAngleDifference">,
): ParallelAnglesResult {
  return {
    reason: partial.reason,
    valid: partial.valid,
    parallel: partial.parallel,
    lineAngleDifference: partial.lineAngleDifference,
    intersection1: partial.intersection1 ?? null,
    intersection2: partial.intersection2 ?? null,
    transversalDir: partial.transversalDir ?? { x: 1, y: 0 },
    line1Dir: partial.line1Dir ?? { x: 1, y: 0 },
    line2Dir: partial.line2Dir ?? { x: 1, y: 0 },
    angles: NAN_ANGLES,
    anglesDeg: NAN_ANGLES,
  };
}

/**
 * Measure of the corner angle at a line/transversal crossing.
 *
 * Corners are named relative to the *directed* transversal `t`:
 * - N = against t (−t), S = along t (+t)
 * - W = left of t (cross(t, ·) > 0), E = right of t
 */
export function cornerAngle(lineDir: Point, transversalDir: Point, corner: Corner): number {
  const t = normalize(transversalDir);
  const u = normalize(lineDir);
  if (!t || !u) return NaN;

  // Half of the line that lies to the west (left) of t.
  const lineWest = cross(t, u) >= 0 ? u : scale(u, -1);
  const lineEast = scale(lineWest, -1);
  const north = scale(t, -1); // against t
  const south = t;

  let a: Point;
  let b: Point;
  switch (corner) {
    case "NW":
      a = north;
      b = lineWest;
      break;
    case "NE":
      a = north;
      b = lineEast;
      break;
    case "SW":
      a = south;
      b = lineWest;
      break;
    case "SE":
      a = south;
      b = lineEast;
      break;
  }
  return unsignedAngle(a, b);
}

function buildAngles(line1Dir: Point, line2Dir: Point, t: Point): Record<AngleId, number> {
  const out = { ...NAN_ANGLES };
  for (const corner of CORNERS) {
    out[`L1-${corner}`] = cornerAngle(line1Dir, t, corner);
    out[`L2-${corner}`] = cornerAngle(line2Dir, t, corner);
  }
  return out;
}

function toDegrees(angles: Record<AngleId, number>): Record<AngleId, number> {
  const out = { ...NAN_ANGLES };
  for (const id of ANGLE_IDS) {
    out[id] = Number.isFinite(angles[id]) ? (angles[id] * 180) / Math.PI : NaN;
  }
  return out;
}

/**
 * Full reading of a two-line + transversal figure.
 *
 * Each line is `n · X = offset` with unit normal n from its angle; the transversal
 * is the line through `transversalThrough` with the given direction.
 */
export function computeParallelAngles(input: ParallelLinesInput): ParallelAnglesResult {
  const parallelTol = input.parallelTolerance ?? DEFAULT_PARALLEL_TOL;
  const degenTol = input.degeneracyTolerance ?? DEFAULT_DEGEN_TOL;
  const line1Offset = input.line1Offset ?? 2;
  const line2Offset = input.line2Offset ?? -2;
  const through = input.transversalThrough ?? { x: 0, y: 0 };

  const lineDiff = lineAngleBetween(input.line1Angle, input.line2Angle);
  const parallel = lineDiff <= parallelTol;

  const line1Dir = unit(input.line1Angle);
  const line2Dir = unit(input.line2Angle);
  const t = unit(input.transversalAngle);
  const n1 = normal(input.line1Angle);
  const n2 = normal(input.line2Angle);

  // A point on each line: offset * normal (since n · (offset n) = offset).
  const p1 = scale(n1, line1Offset);
  const p2 = scale(n2, line2Offset);

  const sin1 = Math.abs(cross(line1Dir, t));
  const sin2 = Math.abs(cross(line2Dir, t));
  if (sin1 < degenTol || sin2 < degenTol) {
    return emptyResult({
      valid: false,
      reason: "transversal nearly parallel to a line",
      parallel,
      lineAngleDifference: lineDiff,
      transversalDir: t,
      line1Dir,
      line2Dir,
    });
  }

  const i1 = lineIntersection(p1, line1Dir, through, t);
  const i2 = lineIntersection(p2, line2Dir, through, t);
  if (!i1 || !i2) {
    return emptyResult({
      valid: false,
      reason: "no intersection",
      parallel,
      lineAngleDifference: lineDiff,
      transversalDir: t,
      line1Dir,
      line2Dir,
    });
  }

  // Guard against intersections racing off to infinity (near-parallel already caught).
  if (!Number.isFinite(i1.x + i1.y) || !Number.isFinite(i2.x + i2.y)) {
    return emptyResult({
      valid: false,
      reason: "non-finite intersection",
      parallel,
      lineAngleDifference: lineDiff,
      transversalDir: t,
      line1Dir,
      line2Dir,
    });
  }

  const span = hypot(sub(i2, i1));
  if (span < 1e-6) {
    return emptyResult({
      valid: false,
      reason: "intersections coincide",
      parallel,
      lineAngleDifference: lineDiff,
      intersection1: i1,
      intersection2: i2,
      transversalDir: t,
      line1Dir,
      line2Dir,
    });
  }

  // Keep crossings on the drawn segments / in camera range so labels never race
  // off to huge coordinates when the transversal is too shallow.
  if (input.visibleHalfLength !== undefined) {
    const half = input.visibleHalfLength;
    const along1 = Math.abs(dot(sub(i1, p1), line1Dir));
    const along2 = Math.abs(dot(sub(i2, p2), line2Dir));
    const r1 = hypot(i1);
    const r2 = hypot(i2);
    if (along1 > half + EPS || along2 > half + EPS || r1 > half + EPS || r2 > half + EPS) {
      return emptyResult({
        valid: false,
        reason: "intersection outside visible segment",
        parallel,
        lineAngleDifference: lineDiff,
        intersection1: i1,
        intersection2: i2,
        transversalDir: t,
        line1Dir,
        line2Dir,
      });
    }
  }

  const angles = buildAngles(line1Dir, line2Dir, t);
  for (const id of ANGLE_IDS) {
    if (!Number.isFinite(angles[id])) {
      return emptyResult({
        valid: false,
        reason: "non-finite angle",
        parallel,
        lineAngleDifference: lineDiff,
        intersection1: i1,
        intersection2: i2,
        transversalDir: t,
        line1Dir,
        line2Dir,
      });
    }
  }

  return {
    valid: true,
    parallel,
    lineAngleDifference: lineDiff,
    intersection1: i1,
    intersection2: i2,
    transversalDir: t,
    line1Dir,
    line2Dir,
    angles,
    anglesDeg: toDegrees(angles),
  };
}

/**
 * Canonical theorem pairs.
 *
 * Interior/exterior pairs depend on which way the transversal runs through the
 * two intersections; pass a valid `ParallelAnglesResult` (or the two
 * intersections + transversal dir) so alternate/co-interior pairs stay correct
 * when the transversal is flipped. Corresponding / vertical / adjacent pairs
 * do not need that context.
 */
export function theoremPairs(
  kind: TheoremKind,
  figure?: Pick<ParallelAnglesResult, "intersection1" | "intersection2" | "transversalDir" | "valid">,
): readonly AnglePair[] {
  switch (kind) {
    case "corresponding":
    case "converse-corresponding":
      return [
        { a: "L1-NW", b: "L2-NW", relation: "equal" },
        { a: "L1-NE", b: "L2-NE", relation: "equal" },
        { a: "L1-SE", b: "L2-SE", relation: "equal" },
        { a: "L1-SW", b: "L2-SW", relation: "equal" },
      ];
    case "alternate-interior":
    case "converse-alternate-interior":
      return interiorExteriorPairs(figure, "alternate-interior");
    case "alternate-exterior":
      return interiorExteriorPairs(figure, "alternate-exterior");
    case "co-interior":
      return interiorExteriorPairs(figure, "co-interior");
    case "vertically-opposite":
      return [
        { a: "L1-NW", b: "L1-SE", relation: "equal" },
        { a: "L1-NE", b: "L1-SW", relation: "equal" },
        { a: "L2-NW", b: "L2-SE", relation: "equal" },
        { a: "L2-NE", b: "L2-SW", relation: "equal" },
      ];
    case "adjacent":
      return [
        { a: "L1-NW", b: "L1-NE", relation: "supplementary" },
        { a: "L1-NE", b: "L1-SE", relation: "supplementary" },
        { a: "L1-SE", b: "L1-SW", relation: "supplementary" },
        { a: "L1-SW", b: "L1-NW", relation: "supplementary" },
        { a: "L2-NW", b: "L2-NE", relation: "supplementary" },
        { a: "L2-NE", b: "L2-SE", relation: "supplementary" },
        { a: "L2-SE", b: "L2-SW", relation: "supplementary" },
        { a: "L2-SW", b: "L2-NW", relation: "supplementary" },
      ];
  }
}

function interiorExteriorPairs(
  figure: Pick<ParallelAnglesResult, "intersection1" | "intersection2" | "transversalDir" | "valid"> | undefined,
  kind: "alternate-interior" | "alternate-exterior" | "co-interior",
): readonly AnglePair[] {
  // Default assumes I2 lies along +t from I1 (L1 interior = S, L2 interior = N).
  let l1Int: readonly Corner[] = ["SW", "SE"];
  let l2Int: readonly Corner[] = ["NW", "NE"];
  if (figure?.valid && figure.intersection1 && figure.intersection2) {
    const interiors = interiorCorners(figure.intersection1, figure.intersection2, figure.transversalDir);
    l1Int = interiors.line1;
    l2Int = interiors.line2;
  }
  // Always [west, east] so alternate/same-side pairing is stable.
  const l1IntWE = orderWestEast(l1Int);
  const l2IntWE = orderWestEast(l2Int);
  const l1ExtWE = orderWestEast(CORNERS.filter((c) => !l1Int.includes(c)));
  const l2ExtWE = orderWestEast(CORNERS.filter((c) => !l2Int.includes(c)));

  if (kind === "alternate-interior") {
    // Opposite sides of the transversal, both interior.
    return [
      { a: `L1-${l1IntWE[0]}`, b: `L2-${l2IntWE[1]}`, relation: "equal" },
      { a: `L1-${l1IntWE[1]}`, b: `L2-${l2IntWE[0]}`, relation: "equal" },
    ];
  }
  if (kind === "alternate-exterior") {
    return [
      { a: `L1-${l1ExtWE[0]}`, b: `L2-${l2ExtWE[1]}`, relation: "equal" },
      { a: `L1-${l1ExtWE[1]}`, b: `L2-${l2ExtWE[0]}`, relation: "equal" },
    ];
  }
  // co-interior: same side of transversal, both interior, supplementary when parallel.
  return [
    { a: `L1-${l1IntWE[0]}`, b: `L2-${l2IntWE[0]}`, relation: "supplementary" },
    { a: `L1-${l1IntWE[1]}`, b: `L2-${l2IntWE[1]}`, relation: "supplementary" },
  ];
}

/** Sort corners into [west, east] (W before E). */
function orderWestEast(corners: readonly Corner[]): [Corner, Corner] {
  const west = corners.find((c) => c === "NW" || c === "SW");
  const east = corners.find((c) => c === "NE" || c === "SE");
  if (!west || !east) {
    // Fallback — should not happen with a proper opposite pair.
    return [corners[0] ?? "NW", corners[1] ?? "NE"];
  }
  return [west, east];
}

/**
 * Which corners are interior for each line, given the directed transversal and
 * the two intersections. Interior = the half of the line's crossing that faces
 * the other intersection along the transversal strip.
 *
 * With NW/NE = against t and SW/SE = along t:
 * - If I2 is along +t from I1, L1 interior is S and L2 interior is N.
 * - If I2 is against t from I1, the roles swap.
 */
export function interiorCorners(
  intersection1: Point,
  intersection2: Point,
  transversalDir: Point,
): { line1: readonly Corner[]; line2: readonly Corner[] } {
  const delta = sub(intersection2, intersection1);
  const along = dot(delta, transversalDir);
  if (along >= 0) {
    return { line1: ["SW", "SE"], line2: ["NW", "NE"] };
  }
  return { line1: ["NW", "NE"], line2: ["SW", "SE"] };
}

export function isInteriorAngle(
  id: AngleId,
  intersection1: Point,
  intersection2: Point,
  transversalDir: Point,
): boolean {
  const corner = id.slice(3) as Corner;
  const line = id.startsWith("L1") ? 1 : 2;
  const interiors = interiorCorners(intersection1, intersection2, transversalDir);
  const list = line === 1 ? interiors.line1 : interiors.line2;
  return list.includes(corner);
}

export interface PairEvaluation {
  pair: AnglePair;
  valueA: number;
  valueB: number;
  /** |A−B| for equal, |A+B−π| for supplementary. */
  error: number;
  holds: boolean;
}

export interface TheoremEvaluation {
  kind: TheoremKind;
  valid: boolean;
  parallel: boolean;
  /** Whether every pair satisfies the geometric relation (within tolerance). */
  relationHolds: boolean;
  /**
   * For parallel-line theorems: relation holds iff lines parallel (both ways).
   * For vertical/adjacent: relation holds regardless of parallelism.
   * For converses: whether the angle evidence supports "lines are parallel".
   */
  theoremHolds: boolean;
  /**
   * Converse-only: classification of the current reading.
   * Converse claim: IF the angle relation holds THEN the lines are parallel.
   * - supports-parallel: hypothesis met and lines are parallel
   * - counterexample: hypothesis met but lines are not parallel (relationHolds && !parallel)
   * - hypothesis-not-met: angle relation fails — converse makes no claim
   * - parallel-relation-fails: lines read parallel but angles disagree (tolerance noise)
   * - invalid: geometry degenerate
   */
  converseStatus?:
    | "supports-parallel"
    | "counterexample"
    | "hypothesis-not-met"
    | "parallel-relation-fails"
    | "invalid";
  pairs: PairEvaluation[];
  message: string;
}

export interface TheoremImplication {
  direction: "theorem" | "converse" | "identity";
  given: string;
  conclusion: string;
  hypothesisMet: boolean;
  conclusionState: "follows" | "no-claim" | "contradicted";
}

/** Same band as parallel detection — see DEFAULT_ANGLE_TOL. */
const RELATION_TOL = DEFAULT_ANGLE_TOL;

function anglePairExpression(pair: AnglePair | undefined): string {
  if (!pair) return "the highlighted angle relation";
  const a = pair.a.replace("L1-", "∠₁").replace("L2-", "∠₂");
  const b = pair.b.replace("L1-", "∠₁").replace("L2-", "∠₂");
  return pair.relation === "equal" ? `${a} = ${b}` : `${a} + ${b} = 180°`;
}

/** State the direction of the theorem or converse using the current highlighted pair. */
export function implicationFor(evaluation: TheoremEvaluation, pair?: AnglePair): TheoremImplication {
  const angleRelation = anglePairExpression(pair ?? evaluation.pairs[0]?.pair);
  const converse = evaluation.kind.startsWith("converse");
  const identity = evaluation.kind === "vertically-opposite" || evaluation.kind === "adjacent";

  if (identity) {
    return {
      direction: "identity",
      given: "any two crossing lines",
      conclusion: angleRelation,
      hypothesisMet: evaluation.valid,
      conclusionState: evaluation.relationHolds ? "follows" : "contradicted",
    };
  }

  if (converse) {
    return {
      direction: "converse",
      given: angleRelation,
      conclusion: "L1 ∥ L2",
      hypothesisMet: evaluation.relationHolds,
      conclusionState: !evaluation.relationHolds
        ? "no-claim"
        : evaluation.parallel
          ? "follows"
          : "contradicted",
    };
  }

  return {
    direction: "theorem",
    given: "L1 ∥ L2",
    conclusion: angleRelation,
    hypothesisMet: evaluation.parallel,
    conclusionState: !evaluation.parallel
      ? "no-claim"
      : evaluation.relationHolds
        ? "follows"
        : "contradicted",
  };
}

function pairError(relation: "equal" | "supplementary", a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  if (relation === "equal") return Math.abs(a - b);
  return Math.abs(a + b - Math.PI);
}

/**
 * Evaluate a theorem (or converse) against a computed figure.
 */
export function evaluateTheorem(
  result: ParallelAnglesResult,
  kind: TheoremKind,
  tolerance = RELATION_TOL,
): TheoremEvaluation {
  if (!result.valid) {
    return {
      kind,
      valid: false,
      parallel: result.parallel,
      relationHolds: false,
      theoremHolds: false,
      converseStatus: kind.startsWith("converse") ? "invalid" : undefined,
      pairs: [],
      message: result.reason ?? "invalid geometry",
    };
  }

  const pairs = theoremPairs(kind, result).map((pair) => {
    const valueA = result.angles[pair.a];
    const valueB = result.angles[pair.b];
    const error = pairError(pair.relation, valueA, valueB);
    return { pair, valueA, valueB, error, holds: error <= tolerance };
  });
  const relationHolds = pairs.every((p) => p.holds);

  if (kind === "vertically-opposite" || kind === "adjacent") {
    return {
      kind,
      valid: true,
      parallel: result.parallel,
      relationHolds,
      theoremHolds: relationHolds,
      pairs,
      message:
        kind === "vertically-opposite"
          ? relationHolds
            ? "Vertically opposite angles are equal at every crossing — this is true whether or not the lines are parallel."
            : "Vertical angles failed — check for a degenerate crossing."
          : relationHolds
            ? "Adjacent angles on a straight line sum to 180° at every crossing — not evidence of parallelism."
            : "Straight-line pair failed — check for a degenerate crossing.",
    };
  }

  if (kind === "converse-corresponding" || kind === "converse-alternate-interior") {
    let converseStatus: NonNullable<TheoremEvaluation["converseStatus"]>;
    let theoremHolds: boolean;
    let message: string;
    if (relationHolds && result.parallel) {
      converseStatus = "supports-parallel";
      theoremHolds = true;
      message =
        kind === "converse-corresponding"
          ? "Corresponding angles are equal, so the converse says the lines are parallel — and they are."
          : "Alternate interior angles are equal, so the converse says the lines are parallel — and they are.";
    } else if (relationHolds && !result.parallel) {
      // True logical counterexample to the converse. Under exact Euclidean geometry
      // with a shared angle/parallel tolerance this band is empty; keep the status
      // so a future tolerance split cannot silently mis-label it.
      converseStatus = "counterexample";
      theoremHolds = false;
      message =
        "The angle relation holds but the lines are not parallel — that would counterexample the converse.";
    } else if (!relationHolds && result.parallel) {
      converseStatus = "parallel-relation-fails";
      theoremHolds = false;
      message = "Lines read as parallel but the angle relation failed — tighten the figure or tolerance.";
    } else {
      // !relationHolds && !parallel: hypothesis of the converse is not met.
      converseStatus = "hypothesis-not-met";
      theoremHolds = true;
      message =
        "Hypothesis not met — the converse makes no claim when the compared angles differ.";
    }
    return {
      kind,
      valid: true,
      parallel: result.parallel,
      relationHolds,
      theoremHolds,
      converseStatus,
      pairs,
      message,
    };
  }

  // Parallel-line theorems: relation should hold exactly when the lines are parallel.
  let message: string;
  let holds: boolean;
  if (result.parallel) {
    holds = relationHolds;
    message = relationHolds
      ? messageForParallelTrue(kind)
      : "Lines are parallel but the angle relation failed — likely a numerical edge case.";
  } else {
    holds = !relationHolds;
    message = !relationHolds
      ? messageForParallelFalse(kind)
      : "Lines are not parallel, yet the angle relation still holds within tolerance.";
  }

  return {
    kind,
    valid: true,
    parallel: result.parallel,
    relationHolds,
    theoremHolds: holds,
    pairs,
    message,
  };
}

function messageForParallelTrue(kind: TheoremKind): string {
  switch (kind) {
    case "corresponding":
      return "Lines are parallel ⇒ corresponding angles are equal.";
    case "alternate-interior":
      return "Lines are parallel ⇒ alternate interior angles are equal.";
    case "alternate-exterior":
      return "Lines are parallel ⇒ alternate exterior angles are equal.";
    case "co-interior":
      return "Lines are parallel ⇒ co-interior (same-side interior) angles sum to 180°.";
    default:
      return "Theorem holds while the lines are parallel.";
  }
}

function messageForParallelFalse(kind: TheoremKind): string {
  switch (kind) {
    case "corresponding":
      return "Lines are not parallel ⇒ corresponding angles are not equal.";
    case "alternate-interior":
      return "Lines are not parallel ⇒ alternate interior angles are not equal.";
    case "alternate-exterior":
      return "Lines are not parallel ⇒ alternate exterior angles are not equal.";
    case "co-interior":
      return "Lines are not parallel ⇒ co-interior angles do not sum to 180°.";
    default:
      return "Angle relation fails while the lines are not parallel.";
  }
}

/** Translate a whole figure by a vector (angles and parallelism unchanged). */
export function translateInput(input: ParallelLinesInput, delta: Point): ParallelLinesInput {
  const through = input.transversalThrough ?? { x: 0, y: 0 };
  // Offsets are along normals from the origin; translating the origin frame is
  // equivalent to adjusting offsets by the projection of delta onto each normal
  // and moving the transversal through-point.
  const n1 = normal(input.line1Angle);
  const n2 = normal(input.line2Angle);
  const o1 = input.line1Offset ?? 2;
  const o2 = input.line2Offset ?? -2;
  return {
    ...input,
    line1Offset: o1 + dot(n1, delta),
    line2Offset: o2 + dot(n2, delta),
    transversalThrough: add(through, delta),
  };
}

/** Rotate directions and the through-point about the origin by `phi` radians. */
export function rotateInput(input: ParallelLinesInput, phi: number): ParallelLinesInput {
  const through = input.transversalThrough ?? { x: 0, y: 0 };
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  return {
    ...input,
    line1Angle: input.line1Angle + phi,
    line2Angle: input.line2Angle + phi,
    transversalAngle: input.transversalAngle + phi,
    transversalThrough: {
      x: through.x * c - through.y * s,
      y: through.x * s + through.y * c,
    },
    // Offsets are scalar distances along rotated normals — unchanged by a pure rotation about origin
    // only if the lines' closest-point offsets stay the same, which they do for rotation about origin
    // when offsets are measured from origin.
  };
}

export function allAngleIds(): readonly AngleId[] {
  return ANGLE_IDS;
}

export function formatDegrees(radians: number, digits = 1): string {
  if (!Number.isFinite(radians)) return "—";
  return `${((radians * 180) / Math.PI).toFixed(digits)}°`;
}

/**
 * Minimum undirected angle between a line at signed offset `offset` from the
 * origin and a transversal through the origin so their intersection stays
 * within `halfLength` of the line's reference point.
 */
export function minCrossingSeparation(offset: number, halfLength: number): number {
  if (halfLength <= EPS) return Math.PI / 2;
  const ratio = Math.min(1, Math.abs(offset) / halfLength);
  return Math.asin(ratio);
}

/**
 * Nudge a directed angle away from an undirected line so their separation is
 * at least `minSep`. Returns `angle` unchanged when already clear.
 */
export function separateFromLine(angle: number, lineAngle: number, minSep: number): number {
  if (lineAngleBetween(angle, lineAngle) >= minSep - 1e-9) return angle;
  const candidates = [
    lineAngle + minSep,
    lineAngle - minSep,
    lineAngle + Math.PI - minSep,
    lineAngle + Math.PI + minSep,
    lineAngle - Math.PI + minSep,
    lineAngle - Math.PI - minSep,
  ];
  let best = angle;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    if (lineAngleBetween(candidate, lineAngle) < minSep - 1e-9) continue;
    const delta = Math.atan2(Math.sin(candidate - angle), Math.cos(candidate - angle));
    const dist = Math.abs(delta);
    if (dist < bestDist) {
      bestDist = dist;
      best = angle + delta;
    }
  }
  return best;
}
