import { describe, expect, it } from "vitest";
import {
  forecastDistribution,
  isAbsorbingState,
  stationaryDistribution,
  stepDistribution,
  validateTransitionMatrix,
} from "../src/math/markov";

const WEATHER = [
  [0.7, 0.2, 0.1],
  [0.3, 0.4, 0.3],
  [0.2, 0.3, 0.5],
] as const;

describe("Markov-chain utilities", () => {
  it("validates square stochastic matrices", () => {
    expect(() => validateTransitionMatrix(WEATHER)).not.toThrow();
    expect(() => validateTransitionMatrix([[0.6, 0.3], [0.4, 0.6]])).toThrow(RangeError);
    expect(() => validateTransitionMatrix([[1.1, -0.1], [0.4, 0.6]])).toThrow(RangeError);
  });

  it("advances and forecasts probability distributions", () => {
    expect(stepDistribution([1, 0, 0], WEATHER)).toEqual([0.7, 0.2, 0.1]);
    expect(forecastDistribution([1, 0, 0], WEATHER, 2)).toEqual([
      0.57,
      0.25,
      0.18,
    ]);
    expect(forecastDistribution([1, 0, 0], WEATHER, 0)).toEqual([1, 0, 0]);
  });

  it("finds long-run probabilities and absorbing states", () => {
    const steady = stationaryDistribution(WEATHER);
    expect(steady.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(stepDistribution(steady, WEATHER)).toEqual(
      expect.arrayContaining(steady.map((value) => expect.closeTo(value, 10))),
    );

    const churn = [
      [0.82, 0.13, 0.05],
      [0.25, 0.45, 0.30],
      [0, 0, 1],
    ] as const;
    expect(isAbsorbingState(churn, 2)).toBe(true);
    expect(isAbsorbingState(churn, 0)).toBe(false);
    expect(stationaryDistribution(churn)).toEqual([
      expect.closeTo(0, 8),
      expect.closeTo(0, 8),
      expect.closeTo(1, 8),
    ]);
  });
});
