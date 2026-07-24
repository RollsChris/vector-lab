import { describe, expect, it } from "vitest";
import {
  autocorrelation,
  ensembleMean,
  poissonCountPath,
  simulateAr1,
  simulateBrownianMotion,
  simulateRandomWalk,
} from "../src/math/stochastic";

describe("stochastic-process utilities", () => {
  it("simulates reproducible random walks", () => {
    expect(simulateRandomWalk(4, 1, 2, 3)).toEqual([0, 2, 4, 6, 8]);
    expect(simulateRandomWalk(6, 0.5, 1, 7)).toEqual(
      simulateRandomWalk(6, 0.5, 1, 7),
    );
  });

  it("creates non-decreasing Poisson count paths", () => {
    const path = poissonCountPath(20, 5, 2, 4);
    expect(path).toHaveLength(21);
    expect(path[0]).toBe(0);
    expect(path.every((value, index) => index === 0 || value >= path[index - 1])).toBe(true);
  });

  it("handles deterministic AR(1) and Brownian limits", () => {
    expect(simulateAr1(4, 3, 0.8, 0, 2)).toEqual([3, 3, 3, 3, 3]);
    expect(simulateBrownianMotion(4, 2, 1.5, 0, 2)).toEqual([0, 0.75, 1.5, 2.25, 3]);
  });

  it("summarises ensembles and serial dependence", () => {
    expect(ensembleMean([[0, 1, 2], [0, 3, 4]])).toEqual([0, 2, 3]);
    expect(autocorrelation([1, 2, 3, 4, 5], 1)).toBeGreaterThan(0);
    expect(autocorrelation([2, 2, 2], 1)).toBe(0);
  });
});
