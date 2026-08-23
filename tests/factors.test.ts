import { describe, expect, it } from "vitest";
import {
  commonFactors,
  decimalFromPercent,
  digitAtPlace,
  divideWhole,
  factors,
  formatScientific,
  fromScientific,
  gcd,
  lcm,
  leastCommonFactor,
  multiples,
  percentFromDecimal,
  simplifyRatio,
  toScientific,
  writtenPlaceSpan,
} from "../src/math/numberLanguage";

describe("factors and multiples", () => {
  it("lists every positive divisor, including square-root pairs", () => {
    expect(factors(12)).toEqual([1, 2, 3, 4, 6, 12]);
    expect(factors(18)).toEqual([1, 2, 3, 6, 9, 18]);
    expect(factors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
    expect(factors(1)).toEqual([1]);
    expect(factors(0)).toEqual([]);
    expect(factors(-12)).toEqual([]);
  });

  it("builds the first positive multiples", () => {
    expect(multiples(12, 5)).toEqual([12, 24, 36, 48, 60]);
    expect(multiples(18, 3)).toEqual([18, 36, 54]);
    expect(multiples(0, 4)).toEqual([]);
  });
});

describe("GCF, LCM, and the unused least common factor", () => {
  it("finds the greatest shared factor and the first shared multiple", () => {
    expect(gcd(12, 18)).toBe(6);
    expect(lcm(12, 18)).toBe(36);
    expect(commonFactors(12, 18)).toEqual([1, 2, 3, 6]);
    expect(gcd(17, 5)).toBe(1);
    expect(lcm(17, 5)).toBe(85);
  });

  it("treats the least common factor as 1 for every positive pair", () => {
    expect(leastCommonFactor(12, 18)).toBe(1);
    expect(leastCommonFactor(7, 7)).toBe(1);
    expect(leastCommonFactor(0, 18)).toBeUndefined();
  });

  it("cannot pull an LCM out of both terms when the LCM is larger than each term", () => {
    const a = 12;
    const b = 18;
    const sharedFactor = gcd(a, b);
    const sharedMultiple = lcm(a, b);
    expect(a % sharedFactor).toBe(0);
    expect(b % sharedFactor).toBe(0);
    expect(sharedMultiple > a && sharedMultiple > b).toBe(true);
    expect(a % sharedMultiple).not.toBe(0);
    expect(b % sharedMultiple).not.toBe(0);
    expect(a / sharedFactor).toBe(2);
    expect(b / sharedFactor).toBe(3);
  });

  it("handles zeros and order without changing the result", () => {
    expect(gcd(0, 18)).toBe(18);
    expect(gcd(18, 0)).toBe(18);
    expect(gcd(0, 0)).toBe(0);
    expect(lcm(0, 18)).toBe(0);
    expect(gcd(18, 12)).toBe(gcd(12, 18));
    expect(lcm(18, 12)).toBe(lcm(12, 18));
  });
});

describe("named division and ratios", () => {
  it("splits a dividend by a divisor into a quotient and remainder", () => {
    expect(divideWhole(17, 5)).toEqual({
      dividend: 17,
      divisor: 5,
      quotient: 3,
      remainder: 2,
    });
    expect(divideWhole(15, 4)).toEqual({
      dividend: 15,
      divisor: 4,
      quotient: 3,
      remainder: 3,
    });
    expect(divideWhole(17, 0)).toBeUndefined();
  });

  it("cancels a ratio by the GCF", () => {
    expect(simplifyRatio(8, 12)).toEqual([2, 3]);
    expect(simplifyRatio(7, 5)).toEqual([7, 5]);
    expect(simplifyRatio(0, 5)).toEqual([0, 1]);
  });
});

describe("decimals, percentages, and scientific notation", () => {
  it("converts between a decimal and a percentage", () => {
    expect(percentFromDecimal(0.35)).toBe(35);
    expect(decimalFromPercent(35)).toBe(0.35);
    expect(percentFromDecimal(1.5)).toBe(150);
  });

  it("writes ordinary amounts as a coefficient times a power of ten", () => {
    expect(toScientific(34000)).toEqual({ coefficient: 3.4, exponent: 4 });
    expect(toScientific(0.0034)).toEqual({ coefficient: 3.4, exponent: -3 });
    expect(toScientific(0.35)).toEqual({ coefficient: 3.5, exponent: -1 });
    expect(toScientific(1)).toEqual({ coefficient: 1, exponent: 0 });
    expect(toScientific(1000)).toEqual({ coefficient: 1, exponent: 3 });
    expect(toScientific(0)).toEqual({ coefficient: 0, exponent: 0 });
    expect(toScientific(-2.5e-4)).toEqual({ coefficient: -2.5, exponent: -4 });
    expect(fromScientific(3.4, 4)).toBe(34000);
    expect(formatScientific(0.0034)).toBe("3.4 × 10^-3");
    expect(formatScientific(1000)).toBe("1 × 10^3");
  });

  it("reads a digit from a named place and spans the written columns", () => {
    expect(digitAtPlace(0.35, 0)).toBe(0);
    expect(digitAtPlace(0.35, -1)).toBe(3);
    expect(digitAtPlace(0.35, -2)).toBe(5);
    expect(digitAtPlace(34000, 4)).toBe(3);
    expect(digitAtPlace(0.0034, -3)).toBe(3);
    expect(digitAtPlace(0.0034, -4)).toBe(4);
    expect(writtenPlaceSpan(0.35)).toEqual({ maxExp: 0, minExp: -2 });
    expect(writtenPlaceSpan(0.0034)).toEqual({ maxExp: 0, minExp: -4 });
    expect(writtenPlaceSpan(34000)).toEqual({ maxExp: 4, minExp: 0 });
    expect(writtenPlaceSpan(1.5)).toEqual({ maxExp: 0, minExp: -1 });
    expect(writtenPlaceSpan(3.4e-9)).toEqual({ maxExp: 0, minExp: -9 });
  });
});
