import type { Fn1 } from "./expr";

/** Central-difference numerical derivative of f at x. */
export function derivative(f: Fn1, x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Central second difference: f''(x) ≈ [f(x+h) − 2f(x) + f(x−h)] / h². */
export function secondDerivative(f: Fn1, x: number, h = 1e-3): number {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
}

/**
 * Find the x in [a,b] where f'(x) = 0 (stationary points), by scanning for sign
 * changes of the derivative and refining each with a few bisection steps.
 */
export function stationaryPoints(f: Fn1, a: number, b: number, steps = 600): number[] {
  const roots: number[] = [];
  const dx = (b - a) / steps;
  let prevX = a;
  let prev = derivative(f, a);
  for (let i = 1; i <= steps; i++) {
    const x = a + i * dx;
    const cur = derivative(f, x);
    if (Number.isFinite(prev) && Number.isFinite(cur) && prev === 0) {
      roots.push(prevX);
    } else if (Number.isFinite(prev) && Number.isFinite(cur) && prev * cur < 0) {
      // Bisect [prevX, x] to pin the zero crossing of f'.
      let lo = prevX;
      let hi = x;
      let flo = prev;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        const fm = derivative(f, mid);
        if (flo * fm <= 0) hi = mid;
        else {
          lo = mid;
          flo = fm;
        }
      }
      roots.push((lo + hi) / 2);
    }
    prevX = x;
    prev = cur;
  }
  return roots;
}

export type RiemannRule = "left" | "right" | "midpoint" | "trapezoid";

/** Sample rectangles/trapezoids used to approximate the integral of f on [a,b]. */
export interface RiemannSample {
  x0: number; // left edge of the sub-interval
  x1: number; // right edge
  height: number; // sampled f value used for area
  area: number; // signed area of this piece
}

export function riemann(
  f: Fn1,
  a: number,
  b: number,
  n: number,
  rule: RiemannRule,
): { samples: RiemannSample[]; total: number } {
  const dx = (b - a) / n;
  const samples: RiemannSample[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    let height: number;
    let area: number;
    switch (rule) {
      case "left":
        height = f(x0);
        area = height * dx;
        break;
      case "right":
        height = f(x1);
        area = height * dx;
        break;
      case "midpoint":
        height = f((x0 + x1) / 2);
        area = height * dx;
        break;
      case "trapezoid":
        height = (f(x0) + f(x1)) / 2;
        area = height * dx;
        break;
    }
    total += area;
    samples.push({ x0, x1, height, area });
  }
  return { samples, total };
}

/** High-accuracy reference integral via composite Simpson's rule. */
export function simpson(f: Fn1, a: number, b: number, n = 1000): number {
  const m = n % 2 === 0 ? n : n + 1;
  const dx = (b - a) / m;
  let sum = f(a) + f(b);
  for (let i = 1; i < m; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * f(a + i * dx);
  }
  return (sum * dx) / 3;
}
