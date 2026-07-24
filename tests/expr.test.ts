import { describe, it, expect } from "vitest";
import { compile1, compile2, tryCompile1 } from "../src/math/expr";

describe("compile1", () => {
  it("evaluates single-variable expressions", () => {
    expect(compile1("x * x")(4)).toBe(16);
    expect(compile1("sin(x)")(0)).toBeCloseTo(0);
    expect(compile1("2 * pi")(0)).toBeCloseTo(2 * Math.PI);
    expect(compile1("exp(x)")(1)).toBeCloseTo(Math.E);
  });
});

describe("compile2", () => {
  it("evaluates two-variable expressions", () => {
    expect(compile2("x + y")(2, 3)).toBe(5);
    expect(compile2("-y")(5, 7)).toBe(-7);
    expect(compile2("sin(x) * cos(y)")(0, 0)).toBeCloseTo(0);
  });
});

describe("tryCompile1", () => {
  it("returns an error for invalid input instead of throwing", () => {
    const r = tryCompile1("this is not @# valid");
    expect(r.fn).toBeNull();
    expect(r.error).not.toBe("");
  });

  it("succeeds for valid input", () => {
    const r = tryCompile1("cos(x)");
    expect(r.error).toBe("");
    expect(r.fn!(0)).toBeCloseTo(1);
  });
});
