/**
 * Ellipse measurements shared by the Ellipses lesson.
 *
 * Everything here works on the semi-axes a (half the major axis) and b (half the minor
 * axis) of an axis-aligned ellipse. The functions are order-insensitive where the maths is:
 * `focalDistance` and `eccentricity` measure from the longer axis whichever way round the
 * caller passes a and b, so a "tall" ellipse (b > a) reports the same shape numbers as the
 * wide one it is a quarter-turn from.
 */

/** Semi-major (longer) and semi-minor (shorter) axis lengths, in that order. */
export function orderedAxes(a: number, b: number): [major: number, minor: number] {
  return a >= b ? [a, b] : [b, a];
}

/** Centre-to-focus distance c = √(major² − minor²). */
export function focalDistance(a: number, b: number): number {
  const [major, minor] = orderedAxes(a, b);
  return Math.sqrt(Math.max(0, major * major - minor * minor));
}

/** Eccentricity e = c / major. 0 is a circle; values approach 1 as the ellipse flattens. */
export function eccentricity(a: number, b: number): number {
  const [major] = orderedAxes(a, b);
  if (major <= 0) return 0;
  return focalDistance(a, b) / major;
}

/** Exact area, π·a·b — the circle area πa² scaled by the stretch factor b/a. */
export function ellipseArea(a: number, b: number): number {
  return Math.PI * a * b;
}

/**
 * Ramanujan's second approximation to the perimeter:
 * C ≈ π[3(a+b) − √((3a+b)(a+3b))]. Accurate to better than 1 part in 10⁴ for
 * everything short of extreme eccentricity.
 */
export function ramanujanPerimeter(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/**
 * Numerical perimeter by summing chord lengths of `n` equally-spaced parameter steps
 * around (a·cos t, b·sin t). This is the "walk the curve and add up the steps" value the
 * lesson accumulates on screen; it converges to the true elliptic integral from below.
 */
export function perimeterArcLength(a: number, b: number, n = 2000): number {
  const steps = Math.max(3, Math.floor(n));
  let total = 0;
  let px = a;
  let py = 0;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = a * Math.cos(t);
    const y = b * Math.sin(t);
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

/** Arc length of the parametric ellipse from t = 0 to `t`, by the same chord sum. */
export function arcLengthTo(a: number, b: number, t: number, n = 720): number {
  const steps = Math.max(1, Math.floor(n));
  let total = 0;
  let px = a;
  let py = 0;
  for (let i = 1; i <= steps; i++) {
    const u = (i / steps) * t;
    const x = a * Math.cos(u);
    const y = b * Math.sin(u);
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}
