import { describe, expect, it } from "vitest";
import { classifyNumber } from "../src/math/numberTypes";

describe("classifyNumber", () => {
  it("classifies nested rational families", () => {
    expect(classifyNumber("7").sets).toEqual(expect.arrayContaining(["natural", "whole", "integer", "rational", "real", "complex", "algebraic", "prime"]));
    expect(classifyNumber("-3").sets).toEqual(expect.arrayContaining(["integer", "rational", "real", "complex", "algebraic"]));
    expect(classifyNumber("1/3").sets).toEqual(expect.arrayContaining(["rational", "real", "complex", "algebraic"]));
  });

  it("classifies famous irrational and complex examples", () => {
    expect(classifyNumber("√2").sets).toEqual(expect.arrayContaining(["irrational", "real", "complex", "algebraic"]));
    expect(classifyNumber("π").sets).toEqual(expect.arrayContaining(["irrational", "real", "complex", "transcendental"]));
    expect(classifyNumber("i").sets).toEqual(expect.arrayContaining(["imaginary", "complex"]));
  });
});
