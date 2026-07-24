import { describe, expect, it } from "vitest";
import {
  bayesPosterior,
  binomialProbability,
  combinations,
  conditionalProbability,
  expectedValue,
  normalDensity,
  variance,
} from "../src/math/probability";

describe("probability utilities", () => {
  it("counts combinations and binomial outcomes", () => {
    expect(combinations(5, 2)).toBe(10);
    expect(combinations(52, 5)).toBe(2_598_960);
    expect(combinations(4, 5)).toBe(0);
    expect(binomialProbability(4, 2, 0.5)).toBeCloseTo(0.375);
  });

  it("calculates expectation and variance", () => {
    const outcomes = [1, 2, 3, 4, 5, 6];
    const fair = new Array(6).fill(1 / 6);
    expect(expectedValue(outcomes, fair)).toBeCloseTo(3.5);
    expect(variance(outcomes, fair)).toBeCloseTo(35 / 12);
  });

  it("handles conditional probability and Bayes' rule", () => {
    expect(conditionalProbability(4 / 52, 12 / 52)).toBeCloseTo(1 / 3);
    expect(bayesPosterior(0.01, 0.9, 0.95)).toBeCloseTo(9 / 58.5);
    expect(() => conditionalProbability(0.2, 0)).toThrow(RangeError);
  });

  it("evaluates the normal density", () => {
    expect(normalDensity(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI));
    expect(normalDensity(1, 0, 1)).toBeCloseTo(normalDensity(-1, 0, 1));
    expect(() => normalDensity(0, 0, 0)).toThrow(RangeError);
  });
});
