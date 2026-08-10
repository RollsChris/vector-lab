import { describe, expect, it } from "vitest";
import {
  GOLDEN_RATIO,
  GOLDEN_RATIO_CONJUGATE,
  binet,
  fibonacci,
  fibonacciRatio,
  fibonacciSequence,
  goldenSpiralSquares,
  ratioError,
  spiralBounds,
} from "../src/math/fibonacci";

describe("Fibonacci numbers", () => {
  it("starts 0, 1 and adds the previous two terms", () => {
    expect(fibonacciSequence(11)).toEqual([0n, 1n, 1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n]);
    expect(fibonacciSequence(0)).toEqual([]);
  });

  it("agrees term by term with the sequence helper", () => {
    const terms = fibonacciSequence(30);
    for (let n = 0; n < terms.length; n++) expect(fibonacci(n)).toBe(terms[n]);
  });

  it("stays exact far beyond the safe integer limit", () => {
    expect(fibonacci(100)).toBe(354224848179261915075n);
    expect(fibonacci(90)).toBe(2880067194370816120n);
  });

  it("rejects negative and fractional indices", () => {
    expect(() => fibonacci(-1)).toThrow(RangeError);
    expect(() => fibonacci(2.5)).toThrow(RangeError);
    expect(() => fibonacciSequence(-3)).toThrow(RangeError);
  });
});

describe("golden ratio", () => {
  it("solves x squared = x + 1", () => {
    expect(GOLDEN_RATIO * GOLDEN_RATIO).toBeCloseTo(GOLDEN_RATIO + 1, 12);
    expect(GOLDEN_RATIO_CONJUGATE * GOLDEN_RATIO_CONJUGATE).toBeCloseTo(GOLDEN_RATIO_CONJUGATE + 1, 12);
  });

  it("satisfies phi = 1 + 1/phi and phi + psi = 1", () => {
    expect(1 + 1 / GOLDEN_RATIO).toBeCloseTo(GOLDEN_RATIO, 12);
    expect(GOLDEN_RATIO + GOLDEN_RATIO_CONJUGATE).toBeCloseTo(1, 12);
    expect(GOLDEN_RATIO * GOLDEN_RATIO_CONJUGATE).toBeCloseTo(-1, 12);
    expect(GOLDEN_RATIO).toBeCloseTo(1.618033988749, 10);
  });

  it("computes consecutive ratios and converges to phi", () => {
    expect(fibonacciRatio(1)).toBeCloseTo(1, 12);
    expect(fibonacciRatio(2)).toBeCloseTo(2, 12);
    expect(fibonacciRatio(3)).toBeCloseTo(1.5, 12);
    expect(fibonacciRatio(40)).toBeCloseTo(GOLDEN_RATIO, 12);
  });

  it("shrinks the ratio error monotonically in magnitude", () => {
    for (let n = 1; n < 20; n++) {
      expect(ratioError(n + 1)).toBeLessThan(ratioError(n));
    }
    expect(ratioError(30)).toBeLessThan(1e-12);
  });

  it("refuses the undefined ratio at n = 0", () => {
    expect(() => fibonacciRatio(0)).toThrow(RangeError);
  });

  it("reproduces Fibonacci numbers with Binet's formula", () => {
    for (let n = 0; n <= 60; n++) expect(BigInt(binet(n))).toBe(fibonacci(n));
  });
});

describe("golden rectangle tiling", () => {
  it("tiles squares of Fibonacci side length", () => {
    const squares = goldenSpiralSquares(6);
    expect(squares.map((square) => square.side)).toEqual([1, 1, 2, 3, 5, 8]);
    expect(goldenSpiralSquares(0)).toEqual([]);
    expect(() => goldenSpiralSquares(41)).toThrow(RangeError);
  });

  it("places squares around the growing block without overlapping", () => {
    const squares = goldenSpiralSquares(5);
    expect(squares.map((square) => [square.x, square.y])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [-3, 0],
      [-3, -5],
    ]);
  });

  it("joins each arc to the next", () => {
    const squares = goldenSpiralSquares(8);
    for (let i = 1; i < squares.length; i++) {
      const previous = squares[i - 1];
      const current = squares[i];
      const endX = previous.centreX + previous.side * Math.cos(previous.endAngle);
      const endY = previous.centreY + previous.side * Math.sin(previous.endAngle);
      const startX = current.centreX + current.side * Math.cos(current.startAngle);
      const startY = current.centreY + current.side * Math.sin(current.startAngle);
      expect(startX).toBeCloseTo(endX, 9);
      expect(startY).toBeCloseTo(endY, 9);
    }
  });

  it("keeps every arc inside its own square", () => {
    for (const square of goldenSpiralSquares(9)) {
      for (let t = 0; t <= 1; t += 0.1) {
        const angle = square.startAngle + t * (square.endAngle - square.startAngle);
        const px = square.centreX + square.side * Math.cos(angle);
        const py = square.centreY + square.side * Math.sin(angle);
        expect(px).toBeGreaterThanOrEqual(square.x - 1e-9);
        expect(px).toBeLessThanOrEqual(square.x + square.side + 1e-9);
        expect(py).toBeGreaterThanOrEqual(square.y - 1e-9);
        expect(py).toBeLessThanOrEqual(square.y + square.side + 1e-9);
      }
    }
  });

  it("grows a rectangle whose aspect approaches phi", () => {
    expect(spiralBounds([])).toMatchObject({ width: 0, height: 0, aspect: 0 });
    expect(spiralBounds(goldenSpiralSquares(3))).toMatchObject({ width: 2, height: 3 });
    expect(spiralBounds(goldenSpiralSquares(4))).toMatchObject({ width: 5, height: 3 });
    expect(spiralBounds(goldenSpiralSquares(12)).aspect).toBeCloseTo(GOLDEN_RATIO, 3);
  });
});
