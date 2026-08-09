/** Pure helpers for the interactive Similar Triangles lesson. */

export interface Point {
  x: number;
  y: number;
}

export type Triangle = readonly [Point, Point, Point];
export type SimilarityTest = "AA" | "SAS" | "SSS" | "none";

export interface TriangleMeasures {
  sides: readonly [number, number, number]; // BC, CA, AB
  angles: readonly [number, number, number]; // at A, B, C in degrees
  area: number;
  valid: boolean;
}

export interface Correspondence {
  /** Permutation of image vertices matching source 0,1,2. */
  order: readonly [number, number, number];
  /** Side scale factors under that correspondence (three ratios). */
  ratios: readonly [number, number, number];
  /** Mean scale factor. */
  scale: number;
  /** Max relative spread of the three ratios. */
  ratioSpread: number;
  /** Max absolute angle difference (degrees) under the correspondence. */
  angleError: number;
  /** Which similarity test is satisfied. */
  test: SimilarityTest;
  similar: boolean;
}

export interface SimilarTrianglesResult {
  source: TriangleMeasures;
  image: TriangleMeasures;
  best: Correspondence;
  all: readonly Correspondence[];
}

const EPS = 1e-9;
const ANGLE_TOL = 0.8; // degrees
const RATIO_TOL = 0.04; // relative

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, "");
}

export function formatDegrees(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}°`;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function measureTriangle(triangle: Triangle): TriangleMeasures {
  const [A, B, C] = triangle;
  const sides: [number, number, number] = [distance(B, C), distance(C, A), distance(A, B)];
  if (sides.some((s) => s < 1e-4)) {
    return { sides, angles: [0, 0, 0], area: 0, valid: false };
  }
  const angles: [number, number, number] = [
    toDegrees(angle(A, B, C)),
    toDegrees(angle(B, C, A)),
    toDegrees(angle(C, A, B)),
  ];
  const area = Math.abs(signedArea(triangle));
  // Degenerate if area ~ 0 or angle sum off (collinear).
  const valid = area > 1e-4 && Math.abs(angles[0] + angles[1] + angles[2] - 180) < 1.5;
  return { sides, angles, area, valid };
}

export function signedArea(triangle: Triangle): number {
  const [A, B, C] = triangle;
  return ((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x)) / 2;
}

function angle(vertex: Point, p: Point, q: Point): number {
  const u = { x: p.x - vertex.x, y: p.y - vertex.y };
  const v = { x: q.x - vertex.x, y: q.y - vertex.y };
  const du = Math.hypot(u.x, u.y);
  const dv = Math.hypot(v.x, v.y);
  if (du < EPS || dv < EPS) return 0;
  return Math.acos(clamp((u.x * v.x + u.y * v.y) / (du * dv), -1, 1));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** All 6 vertex correspondences from source → image. */
export function correspondences(source: Triangle, image: Triangle): Correspondence[] {
  const s = measureTriangle(source);
  const m = measureTriangle(image);
  const perms: Array<[number, number, number]> = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  return perms.map((order) => scoreCorrespondence(s, m, order));
}

function scoreCorrespondence(
  source: TriangleMeasures,
  image: TriangleMeasures,
  order: readonly [number, number, number],
): Correspondence {
  // Side opposite vertex i is sides[i]. Under vertex map i → order[i],
  // corresponding sides are those opposite corresponding vertices.
  const ratios: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const srcSide = source.sides[i];
    const imgSide = image.sides[order[i]];
    ratios[i] = srcSide < EPS ? 0 : imgSide / srcSide;
  }
  const scale = (ratios[0] + ratios[1] + ratios[2]) / 3;
  const ratioSpread =
    scale < EPS
      ? Infinity
      : Math.max(
          Math.abs(ratios[0] - scale) / scale,
          Math.abs(ratios[1] - scale) / scale,
          Math.abs(ratios[2] - scale) / scale,
        );

  let angleError = 0;
  for (let i = 0; i < 3; i++) {
    angleError = Math.max(angleError, Math.abs(source.angles[i] - image.angles[order[i]]));
  }

  const anglesMatch = angleError <= ANGLE_TOL;
  // Count how many angles match pairwise under this map.
  let matchingAngles = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(source.angles[i] - image.angles[order[i]]) <= ANGLE_TOL) matchingAngles += 1;
  }

  const sidesEqualScale = ratioSpread <= RATIO_TOL && scale > EPS;

  // SAS: two pairs of sides proportional and included angle equal.
  // Side index = opposite vertex: BC=0, CA=1, AB=2.
  // Arms from vertex v are the two sides that meet there.
  const arms: Record<number, [number, number]> = {
    0: [2, 1], // A: AB, AC
    1: [2, 0], // B: BA, BC
    2: [1, 0], // C: CA, CB
  };
  let sas = false;
  for (let vertex = 0; vertex < 3; vertex++) {
    const imgVertex = order[vertex];
    const srcSides = arms[vertex].map((idx) => source.sides[idx]);
    const imgSides = arms[vertex].map((opp) => image.sides[order[opp]]);
    const r1 = srcSides[0] < EPS ? 0 : imgSides[0] / srcSides[0];
    const r2 = srcSides[1] < EPS ? 0 : imgSides[1] / srcSides[1];
    const ratioOk =
      r1 > EPS &&
      r2 > EPS &&
      Math.abs(r1 - r2) / Math.max(r1, r2) <= RATIO_TOL;
    const angOk = Math.abs(source.angles[vertex] - image.angles[imgVertex]) <= ANGLE_TOL;
    if (ratioOk && angOk) sas = true;
  }

  let test: SimilarityTest = "none";
  if (sidesEqualScale) test = "SSS";
  else if (sas) test = "SAS";
  else if (matchingAngles >= 2 || anglesMatch) test = "AA";

  // AA is enough for similarity in Euclidean geometry; SSS/SAS also.
  const similar =
    (test === "AA" && matchingAngles >= 2) ||
    test === "SSS" ||
    test === "SAS";

  return {
    order,
    ratios,
    scale,
    ratioSpread: Number.isFinite(ratioSpread) ? ratioSpread : 999,
    angleError,
    test: similar ? test : "none",
    similar,
  };
}

export function computeSimilarTriangles(source: Triangle, image: Triangle): SimilarTrianglesResult {
  const s = measureTriangle(source);
  const m = measureTriangle(image);
  const all = correspondences(source, image);
  // Prefer similar correspondences; then lowest angle error; then lowest ratio spread.
  const best = [...all].sort((a, b) => {
    if (a.similar !== b.similar) return a.similar ? -1 : 1;
    if (a.angleError !== b.angleError) return a.angleError - b.angleError;
    return a.ratioSpread - b.ratioSpread;
  })[0];
  return { source: s, image: m, best, all };
}

/**
 * Build a similar image of `source` by scale `k` about `origin`, optionally
 * with a rotation (radians) and reflection.
 */
export function similarCopy(
  source: Triangle,
  scale: number,
  origin: Point = { x: 0, y: 0 },
  rotation = 0,
  reflect = false,
): Triangle {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return source.map((p) => {
    let x = (p.x - origin.x) * scale;
    let y = (p.y - origin.y) * scale;
    if (reflect) y = -y;
    return {
      x: origin.x + x * cos - y * sin,
      y: origin.y + x * sin + y * cos,
    };
  }) as unknown as Triangle;
}

/** Translate every vertex by the same vector. */
export function translateTriangle(triangle: Triangle, dx: number, dy: number): Triangle {
  return triangle.map((p) => ({ x: p.x + dx, y: p.y + dy })) as unknown as Triangle;
}
