/**
 * Fibonacci numbers and the golden ratio.
 *
 * Values are returned as bigint so that the sequence stays exact well past the safe
 * integer limit; ratios are returned as ordinary numbers because they converge long
 * before precision becomes an issue.
 */

/** phi = (1 + sqrt 5) / 2, the positive root of x² = x + 1. */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

/** psi = (1 - sqrt 5) / 2, the other root; equal to 1 - phi and to -1/phi. */
export const GOLDEN_RATIO_CONJUGATE = (1 - Math.sqrt(5)) / 2;

function assertIndex(n: number, label: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
}

/** F(n) with F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2). */
export function fibonacci(n: number): bigint {
  assertIndex(n, "Fibonacci index");
  let previous = 0n;
  let current = 1n;
  for (let step = 0; step < n; step++) {
    const next = previous + current;
    previous = current;
    current = next;
  }
  return previous;
}

/** The first `count` terms, F(0) … F(count-1). */
export function fibonacciSequence(count: number): bigint[] {
  assertIndex(count, "Fibonacci term count");
  const terms: bigint[] = [];
  let previous = 0n;
  let current = 1n;
  for (let step = 0; step < count; step++) {
    terms.push(previous);
    const next = previous + current;
    previous = current;
    current = next;
  }
  return terms;
}

/**
 * F(n+1) / F(n) as a number. Defined for n >= 1; F(0) = 0 has no ratio, so n = 0
 * throws rather than returning Infinity.
 */
export function fibonacciRatio(n: number): number {
  assertIndex(n, "Fibonacci index");
  if (n === 0) throw new RangeError("Fibonacci ratio is undefined at n = 0 because F(0) = 0.");
  const lower = fibonacci(n);
  const upper = fibonacci(n + 1);
  // Scale before converting so huge terms keep full double precision.
  const scale = 10n ** 20n;
  return Number((upper * scale) / lower) / 1e20;
}

/** How far F(n+1)/F(n) still sits from phi. */
export function ratioError(n: number): number {
  return Math.abs(fibonacciRatio(n) - GOLDEN_RATIO);
}

/** Binet's closed form, rounded back to an integer. Exact for n <= 70. */
export function binet(n: number): number {
  assertIndex(n, "Fibonacci index");
  return Math.round(
    (GOLDEN_RATIO ** n - GOLDEN_RATIO_CONJUGATE ** n) / Math.sqrt(5),
  );
}

/** One square of the classic golden-rectangle tiling, with its quarter-circle arc. */
export interface GoldenSquare {
  /** 0-based position in the tiling. */
  index: number;
  /** Side length, equal to F(index + 1). */
  side: number;
  /** Lower-left corner. */
  x: number;
  y: number;
  /** Centre of the quarter-circle arc drawn inside this square. */
  centreX: number;
  centreY: number;
  /** Arc start angle in radians; the arc sweeps a quarter turn anticlockwise. */
  startAngle: number;
  endAngle: number;
}

const HALF_PI = Math.PI / 2;

/**
 * Tile `steps` Fibonacci squares into a golden rectangle, adding a square to the right,
 * top, left and bottom of the growing block in turn. Each square carries the quarter
 * circle that continues the golden spiral, so consecutive arcs join end to end.
 */
export function goldenSpiralSquares(steps: number): GoldenSquare[] {
  assertIndex(steps, "Spiral step count");
  if (steps > 40) throw new RangeError("Spiral step count must be at most 40.");
  if (steps === 0) return [];

  const squares: GoldenSquare[] = [];
  let minX = 0;
  let minY = 0;
  let maxX = 1;
  let maxY = 1;

  for (let index = 0; index < steps; index++) {
    const side = Number(fibonacci(index + 1));
    let x = 0;
    let y = 0;

    if (index === 0) {
      x = 0;
      y = 0;
    } else {
      switch ((index - 1) % 4) {
        case 0: // right
          x = maxX;
          y = minY;
          maxX += side;
          break;
        case 1: // up
          x = minX;
          y = maxY;
          maxY += side;
          break;
        case 2: // left
          x = minX - side;
          y = minY;
          minX -= side;
          break;
        default: // down
          x = minX;
          y = minY - side;
          minY -= side;
          break;
      }
    }

    // Arc centres cycle top-right, top-left, bottom-left, bottom-right, which keeps the
    // start angle at 180° + 90° × index and every arc joining the previous one.
    const corner = index % 4;
    const centreX = corner === 0 || corner === 3 ? x + side : x;
    const centreY = corner === 0 || corner === 1 ? y + side : y;
    const startAngle = Math.PI + HALF_PI * index;

    squares.push({
      index,
      side,
      x,
      y,
      centreX,
      centreY,
      startAngle,
      endAngle: startAngle + HALF_PI,
    });
  }
  return squares;
}

export interface SpiralBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  /** Longer side divided by the shorter side; approaches phi. */
  aspect: number;
}

/** Bounding rectangle of a tiling produced by `goldenSpiralSquares`. */
export function spiralBounds(squares: readonly GoldenSquare[]): SpiralBounds {
  if (squares.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, aspect: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const square of squares) {
    minX = Math.min(minX, square.x);
    minY = Math.min(minY, square.y);
    maxX = Math.max(maxX, square.x + square.side);
    maxY = Math.max(maxY, square.y + square.side);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    aspect: Math.max(width, height) / Math.min(width, height),
  };
}
