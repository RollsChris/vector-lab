import { describe, expect, it } from "vitest";
import {
  INTEGER_LAB_PRESETS,
  MAX_INTEGER_LAB_HELPER_ARG,
  MAX_INTEGER_LAB_RANGE,
  bigOmega,
  buildIntegerSeries,
  buildYScale,
  coerceHelperArg,
  compileIntegerExpr,
  formatIntegerLabNumber,
  fullSurvivalEnergy,
  instanceIdToInteger,
  integerToInstanceId,
  normalizeIntegerRange,
  omega,
  survivalEnergy,
  thresholdMetrics,
  tryCompileIntegerExpr,
} from "../src/math/integerLab";
import { isPrime } from "../src/math/primes";

describe("normalizeIntegerRange", () => {
  it("orders, clamps to positive integers, and caps span", () => {
    expect(normalizeIntegerRange(10, 1)).toMatchObject({ start: 1, end: 10, count: 10, capped: false });
    expect(normalizeIntegerRange(-5, 3)).toMatchObject({ start: 1, end: 3, count: 3 });
    const big = normalizeIntegerRange(1, MAX_INTEGER_LAB_RANGE + 500);
    expect(big.count).toBe(MAX_INTEGER_LAB_RANGE);
    expect(big.capped).toBe(true);
    expect(big.end).toBe(MAX_INTEGER_LAB_RANGE);
  });
});

describe("survival energy", () => {
  it("awards weight for each survived prime test and matches primality through √n", () => {
    expect(survivalEnergy(1)).toBe(0);
    expect(survivalEnergy(9)).toBe(1); // survives 2, dies at 3
    expect(survivalEnergy(25)).toBe(2); // survives 2,3 dies at 5
    expect(survivalEnergy(7)).toBe(fullSurvivalEnergy(7));
    expect(survivalEnergy(49)).toBeLessThan(fullSurvivalEnergy(49));

    for (let n = 2; n <= 200; n++) {
      const survived = survivalEnergy(n) === fullSurvivalEnergy(n);
      expect(survived).toBe(isPrime(n));
    }
  });

  it("omega counts distinct prime factors", () => {
    expect(omega(1)).toBe(0);
    expect(omega(30)).toBe(3);
    expect(bigOmega(12)).toBe(3);
    expect(omega(12)).toBe(2);
  });
});

describe("safe integer expression compiler", () => {
  it("evaluates arithmetic, comparisons (as 0/1), and number-theory helpers", () => {
    const mod6 = compileIntegerExpr("n % 6");
    expect([1, 2, 3, 4, 5, 6, 7].map(mod6)).toEqual([1, 2, 3, 4, 5, 0, 1]);

    const primePred = compileIntegerExpr("isprime(n)");
    expect(primePred(13)).toBe(1);
    expect(primePred(12)).toBe(0);

    expect(compileIntegerExpr("phi(n)/n")(6)).toBeCloseTo(1 / 3);
    expect(compileIntegerExpr("mu(n)")(30)).toBe(-1);
    expect(compileIntegerExpr("omega(n)")(30)).toBe(3);
    expect(compileIntegerExpr("gcd(n, 30)")(12)).toBe(6);
    expect(compileIntegerExpr("energy(n)")(7)).toBe(survivalEnergy(7));
    expect(compileIntegerExpr("n > 10 && isprime(n)")(13)).toBe(1);
    expect(compileIntegerExpr("n > 10 && isprime(n)")(9)).toBe(0);
    expect(compileIntegerExpr("n == 4 || n == 9")(9)).toBe(1);
    expect(compileIntegerExpr("2 ** 3")(0)).toBe(8);
    expect(compileIntegerExpr("abs(n - 10)")(7)).toBe(3);
  });

  it("rejects unsafe or unknown constructs without throwing from tryCompile", () => {
    const bad = [
      "n.constructor",
      "this",
      "window",
      "eval(n)",
      "process",
      "n[0]",
      "n = 3",
      "foo(n)",
      "function(){}",
      "n => n",
      "`n`",
      "Math.sin(n)",
      "globalThis",
      "__proto__",
      "__proto__ * 0",
      "__proto__(n)",
      "n; Math.sin(1)",
      "gcd(1/0, 30)",
      "lcm(sqrt(0-1), 6)",
    ];
    for (const expr of bad) {
      const result = tryCompileIntegerExpr(expr);
      // Non-finite helper args must not hang; they may compile and yield NaN.
      if (expr.startsWith("gcd(") || expr.startsWith("lcm(")) {
        expect(result.fn, expr).not.toBeNull();
        expect(Number.isFinite(result.fn!(30)), expr).toBe(false);
        continue;
      }
      expect(result.fn, expr).toBeNull();
      expect(result.error, expr).not.toBe("");
    }
    expect(() => compileIntegerExpr("n.constructor")).toThrow();
  });

  it("exposes the documented presets", () => {
    for (const expr of Object.values(INTEGER_LAB_PRESETS)) {
      const { fn, error } = tryCompileIntegerExpr(expr);
      expect(error, expr).toBe("");
      expect(fn).not.toBeNull();
      expect(typeof fn!(10)).toBe("number");
    }
  });

  it("rejects oversized number-theory helper args with a nonfinite result", () => {
    // Near MAX_SAFE_INTEGER — trial division would freeze without the lab cap.
    const huge = 9007199254740881;
    expect(coerceHelperArg(huge)).toBeNull();
    expect(coerceHelperArg(Number.POSITIVE_INFINITY)).toBeNull();
    expect(coerceHelperArg(MAX_INTEGER_LAB_HELPER_ARG)).toBe(MAX_INTEGER_LAB_HELPER_ARG);
    expect(coerceHelperArg(MAX_INTEGER_LAB_HELPER_ARG + 1)).toBeNull();
    expect(coerceHelperArg(-(MAX_INTEGER_LAB_HELPER_ARG + 1))).toBeNull();

    const helpers = [
      `isprime(${huge})`,
      `phi(${huge})`,
      `mu(${huge})`,
      `omega(${huge})`,
      `bigomega(${huge})`,
      `energy(${huge})`,
      `fullenergy(${huge})`,
      `factors(${huge})`,
      `gcd(${huge}, 30)`,
      `lcm(12, ${huge})`,
      `isprime(${MAX_INTEGER_LAB_HELPER_ARG + 1})`,
    ];
    for (const expr of helpers) {
      const { fn, error } = tryCompileIntegerExpr(expr);
      expect(error, expr).toBe("");
      expect(fn, expr).not.toBeNull();
      expect(Number.isFinite(fn!(1)), expr).toBe(false);
    }

    // Cap boundary remains usable; n itself stays inside the plotted range.
    expect(compileIntegerExpr(`isprime(${MAX_INTEGER_LAB_HELPER_ARG})`)(0)).toBe(
      isPrime(MAX_INTEGER_LAB_HELPER_ARG) ? 1 : 0,
    );
    expect(compileIntegerExpr("isprime(n)")(997)).toBe(1);
    expect(compileIntegerExpr("gcd(n, 30)")(12)).toBe(6);
  });
});

describe("series, scaling, metrics, instance mapping", () => {
  it("builds a sieved series with threshold metrics", () => {
    const fn = compileIntegerExpr("energy(n)");
    const series = buildIntegerSeries(1, 30, fn, /* threshold */ 1);
    expect(series.range.count).toBe(30);
    expect(series.points[0].n).toBe(1);
    expect(series.points[12].n).toBe(13);
    expect(series.points[12].prime).toBe(true);
    expect(series.points[12].survived).toBe(true);
    expect(series.points[8].n).toBe(9);
    expect(series.points[8].composite).toBe(true);
    expect(series.points[8].factors).toEqual([3, 3]);

    // energy(n) >= 1 includes primes > 2 and some composites that survive 2.
    expect(series.metrics.candidateCount).toBeGreaterThan(0);
    expect(series.metrics.primeHits).toBeGreaterThan(0);
    expect(series.metrics.precision).toBeGreaterThan(0);
    expect(series.metrics.actualPrimes).toBe(sieveCount(30));
  });

  it("scales constant and nonfinite values safely", () => {
    const constant = buildYScale([2, 2, 2]);
    expect(constant.normalize(2)).toBeCloseTo(0.5);
    expect(constant.normalize(Number.NaN)).toBe(0);

    const mixed = buildYScale([1, Number.NaN, Number.POSITIVE_INFINITY, 5]);
    expect(mixed.yMin).toBe(1);
    expect(mixed.yMax).toBe(5);
    expect(mixed.normalize(3)).toBeCloseTo(0.5);
    expect(mixed.normalize(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("maps instance ids for ranges that do not start at 1", () => {
    expect(instanceIdToInteger(0, 20)).toBe(20);
    expect(instanceIdToInteger(5, 20)).toBe(25);
    expect(integerToInstanceId(25, 20, 40)).toBe(5);
    expect(integerToInstanceId(19, 20, 40)).toBeNull();
  });

  it("retains finite series evaluation when individual points misbehave", () => {
    const fn = (n: number) => (n === 5 ? Number.NaN : n % 3);
    const series = buildIntegerSeries(3, 7, fn, 1);
    expect(series.points.map((p) => p.finite)).toEqual([true, true, false, true, true]);
    const metrics = thresholdMetrics(series.points, 1);
    expect(metrics.candidateCount).toBe(series.points.filter((p) => p.finite && p.y >= 1).length);
  });

  it("builds series for expensive helper constants without hanging or throwing", () => {
    const huge = 9007199254740881;
    const fn = compileIntegerExpr(`isprime(${huge})`);
    const series = buildIntegerSeries(1, 8, fn, 1);
    expect(series.range.count).toBe(8);
    expect(series.points.every((p) => !p.finite)).toBe(true);
    expect(series.metrics.candidateCount).toBe(0);
    // Preset-scale series still works under the same path.
    const energy = buildIntegerSeries(1, 40, compileIntegerExpr("energy(n)"), 1);
    expect(energy.points.some((p) => p.prime && p.finite)).toBe(true);
  });
});

describe("formatIntegerLabNumber", () => {
  it("keeps significant trailing zeros that toPrecision can emit", () => {
    // Regression: toPrecision(6).replace(/\.?0+$/, "") turned 150000 → "15".
    expect(formatIntegerLabNumber(150000)).toMatch(/^150,?000$/);
    expect(formatIntegerLabNumber(150000.1)).toBe("150000");
    expect(formatIntegerLabNumber(150000.1)).not.toBe("15");
    expect(formatIntegerLabNumber(12.5)).toBe("12.5");
    expect(formatIntegerLabNumber(1 / 3)).toMatch(/^0\.33333/);
    expect(formatIntegerLabNumber(1e-4)).toMatch(/e/i);
    expect(formatIntegerLabNumber(1_500_000.25)).toMatch(/e/i);
    expect(formatIntegerLabNumber(Number.NaN)).toBe("non-finite");
    expect(formatIntegerLabNumber(Number.POSITIVE_INFINITY)).toBe("non-finite");
  });
});

function sieveCount(limit: number): number {
  let count = 0;
  for (let n = 2; n <= limit; n++) if (isPrime(n)) count++;
  return count;
}
