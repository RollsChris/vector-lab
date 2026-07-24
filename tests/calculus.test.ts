import { describe, it, expect } from "vitest";
import { derivative, riemann, simpson } from "../src/math/calculus";

describe("derivative", () => {
  it("matches known derivatives", () => {
    expect(derivative((x) => x * x, 3)).toBeCloseTo(6, 3); // d/dx x^2 = 2x
    expect(derivative(Math.sin, 0)).toBeCloseTo(1, 3); // cos(0) = 1
    expect(derivative(Math.sin, Math.PI / 2)).toBeCloseTo(0, 3); // peak -> slope 0
    expect(derivative((x) => 2 * x + 1, 10)).toBeCloseTo(2, 3); // constant slope
  });
});

describe("riemann", () => {
  const f = (x: number) => x * x; // integral on [0,2] = 8/3 ≈ 2.6667

  it("approximates a known integral", () => {
    const { total } = riemann(f, 0, 2, 1000, "midpoint");
    expect(total).toBeCloseTo(8 / 3, 2);
  });

  it("converges as n increases (midpoint)", () => {
    const exact = 8 / 3;
    const coarse = Math.abs(riemann(f, 0, 2, 4, "midpoint").total - exact);
    const fine = Math.abs(riemann(f, 0, 2, 200, "midpoint").total - exact);
    expect(fine).toBeLessThan(coarse);
  });

  it("produces n samples that span [a,b]", () => {
    const { samples } = riemann(f, 0, 2, 10, "left");
    expect(samples).toHaveLength(10);
    expect(samples[0].x0).toBeCloseTo(0);
    expect(samples[9].x1).toBeCloseTo(2);
  });

  it("returns signed area (negative below axis)", () => {
    const { total } = riemann((x) => x, -2, 0, 1000, "midpoint");
    expect(total).toBeLessThan(0); // area under y=x on [-2,0] is negative
  });
});

describe("simpson", () => {
  it("integrates polynomials near-exactly", () => {
    expect(simpson((x) => x * x, 0, 2)).toBeCloseTo(8 / 3, 6);
    expect(simpson(Math.sin, 0, Math.PI)).toBeCloseTo(2, 6); // ∫sin = 2
  });
});
