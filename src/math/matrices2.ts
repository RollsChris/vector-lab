/**
 * 2×2 matrices as linear maps of the plane. Pure maths, no three.js, so it can be
 * unit-tested and shared by the "Matrices as Maps" lesson.
 *
 * A matrix is stored row-major as [a, b, c, d] representing
 *   | a  b |
 *   | c  d |
 * acting on a column vector (x, y) as (a·x + b·y, c·x + d·y).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type Matrix2 = { a: number; b: number; c: number; d: number };

/** Determinant a·d − b·c — the signed area scale factor of the map. */
export function matrix2Det(m: Matrix2): number {
  return m.a * m.d - m.b * m.c;
}

/** Apply the matrix to a vector: (a·x + b·y, c·x + d·y). */
export function matrix2MulVec(m: Matrix2, v: Vec2): Vec2 {
  return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}

/** Compose two maps: the result applies `second` after `first`. */
export function matrix2Mul(second: Matrix2, first: Matrix2): Matrix2 {
  return {
    a: second.a * first.a + second.b * first.c,
    b: second.a * first.b + second.b * first.d,
    c: second.c * first.a + second.d * first.c,
    d: second.c * first.b + second.d * first.d,
  };
}

/** Image of the standard basis vectors: î → (a, c), ĵ → (b, d). */
export function basisImages(m: Matrix2): { i: Vec2; j: Vec2 } {
  return { i: { x: m.a, y: m.c }, j: { x: m.b, y: m.d } };
}

/**
 * Corners of the unit square (0,0), (1,0), (1,1), (0,1) mapped through the matrix,
 * returned in the same order so they can be drawn as a closed polygon.
 */
export function unitSquareImage(m: Matrix2): Vec2[] {
  const corners: Vec2[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  return corners.map((corner) => matrix2MulVec(m, corner));
}

/** True when the determinant is negative, i.e. the map flips orientation (a mirror). */
export function flipsOrientation(m: Matrix2): boolean {
  return matrix2Det(m) < 0;
}
