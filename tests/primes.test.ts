import { describe, expect, it } from "vitest";
import {
  eulerTotient,
  formatPrimeFactorisation,
  isPrime,
  mobius,
  primeFactors,
  primeGaps,
  sieve,
} from "../src/math/primes";
import { isMersennePrime, mersenneNumber, pascalRow } from "../src/math/pascal";

describe("prime utilities", () => {
  it("sieves and tests primes exactly", () => {
    expect(sieve(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect([2, 3, 97, 9973].every(isPrime)).toBe(true);
    expect([-7, 0, 1, 9, 25, 10001].some(isPrime)).toBe(false);
  });

  describe("Pascal triangle and Mersenne numbers", () => {
    it("builds binomial coefficient rows", () => {
      expect(pascalRow(0)).toEqual([1]);
      expect(pascalRow(5)).toEqual([1, 5, 10, 10, 5, 1]);
      expect(() => pascalRow(-1)).toThrow(RangeError);
    });

    it("identifies Mersenne primes with the Lucas-Lehmer test", () => {
      expect(mersenneNumber(11)).toBe(2047n);
      expect([2, 3, 5, 7, 13, 17, 19, 31].every(isMersennePrime)).toBe(true);
      expect([4, 9, 11, 23, 29].some(isMersennePrime)).toBe(false);
    });
  });

  it("factorises integers and formats exponent form", () => {
    expect(primeFactors(360)).toEqual([2, 2, 2, 3, 3, 5]);
    expect(formatPrimeFactorisation(360)).toBe("2³ × 3² × 5");
    expect(formatPrimeFactorisation(1)).toBe("1 (the empty product)");
  });

  it("computes multiplicative number-theory functions", () => {
    expect(eulerTotient(1)).toBe(1);
    expect(eulerTotient(36)).toBe(12);
    expect(mobius(1)).toBe(1);
    expect(mobius(30)).toBe(-1);
    expect(mobius(12)).toBe(0);
  });

  it("reports consecutive prime gaps", () => {
    expect(primeGaps(20)).toEqual([
      { lower: 2, upper: 3, gap: 1 },
      { lower: 3, upper: 5, gap: 2 },
      { lower: 5, upper: 7, gap: 2 },
      { lower: 7, upper: 11, gap: 4 },
      { lower: 11, upper: 13, gap: 2 },
      { lower: 13, upper: 17, gap: 4 },
      { lower: 17, upper: 19, gap: 2 },
    ]);
  });
});
