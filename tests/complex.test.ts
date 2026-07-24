import { describe, expect, it } from "vitest";
import { add, complex, format, modulus, mul, polar, pow } from "../src/math/complex";

describe("complex numbers", () => {
  it("adds component-wise", () => {
    expect(add(complex(1, 2), complex(3, -4))).toEqual(complex(4, -2));
  });

  it("multiplies using i² = -1", () => {
    expect(mul(complex(0, 1), complex(0, 1))).toEqual(complex(-1, 0));
    expect(mul(complex(1, 2), complex(3, 4))).toEqual(complex(-5, 10));
  });

  it("computes modulus", () => {
    expect(modulus(complex(3, 4))).toBeCloseTo(5);
    expect(modulus(complex(0, 0))).toBe(0);
  });

  it("converts polar to rectangular", () => {
    const p = polar(2, Math.PI / 2);
    expect(p.re).toBeCloseTo(0);
    expect(p.im).toBeCloseTo(2);
  });

  it("rotates by integer powers (De Moivre)", () => {
    const i = complex(0, 1);
    const p = pow(i, 4);
    expect(p.re).toBeCloseTo(1);
    expect(p.im).toBeCloseTo(0);
  });

  it("formats nicely", () => {
    expect(format(complex(2, 0))).toBe("2");
    expect(format(complex(0, 3))).toBe("3i");
    expect(format(complex(1, -1))).toBe("1 - 1i");
  });
});
