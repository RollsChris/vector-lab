import { describe, expect, it } from "vitest";
import { longDivision, longMultiplication } from "../src/math/longArithmetic";

describe("long arithmetic", () => {
  it("keeps multiplication partial products in their place values", () => {
    expect(longMultiplication(347, 26)).toEqual({
      product: 9022,
      partialProducts: [2082, 6940],
    });
  });

  it("records every divide-multiply-subtract-bring-down step", () => {
    expect(longDivision(987, 6)).toEqual({
      quotient: 164,
      remainder: 3,
      steps: [
        { digit: 9, partialDividend: 9, quotientDigit: 1, product: 6, remainder: 3 },
        { digit: 8, partialDividend: 38, quotientDigit: 6, product: 36, remainder: 2 },
        { digit: 7, partialDividend: 27, quotientDigit: 4, product: 24, remainder: 3 },
      ],
    });
  });

  it("rejects non-positive integer operands", () => {
    expect(() => longMultiplication(0, 4)).toThrow(RangeError);
    expect(() => longDivision(12, 0)).toThrow(RangeError);
  });
});
