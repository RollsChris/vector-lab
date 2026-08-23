import { describe, expect, it } from "vitest";
import {
  additionStory,
  formatAddition,
  formatCompact,
  formatSigned,
  groupedSums,
  operate,
  opposite,
  swapPreserves,
} from "../src/math/signedArithmetic";

describe("opposites and writings", () => {
  it("cancels a number back to zero", () => {
    expect(opposite(3)).toBe(-3);
    expect(opposite(-10)).toBe(10);
    expect(opposite(3) + 3).toBe(0);
  });

  it("writes a trailing negative as a signed addend or as take-away", () => {
    expect(formatSigned(-3)).toBe("−3");
    expect(formatAddition(-3, 10)).toBe("−3 + 10");
    expect(formatAddition(10, -3)).toBe("10 + (−3)");
    expect(formatCompact(10, -3)).toBe("10 − 3");
    expect(formatCompact(-3, 10)).toBe("−3 + 10");
  });
});

describe("the −3 + 10 story", () => {
  it("swaps the addition, then writes take-away of the opposite", () => {
    expect(additionStory(-3, 10)).toEqual([
      { kind: "start", expression: "−3 + 10" },
      { kind: "swap", expression: "10 + (−3)" },
      { kind: "rewrite", expression: "10 − 3" },
    ]);
  });

  it("rewrites a trailing negative without a swap", () => {
    expect(additionStory(10, -3)).toEqual([
      { kind: "start", expression: "10 + (−3)" },
      { kind: "rewrite", expression: "10 − 3" },
    ]);
  });

  it("only swaps two positives", () => {
    expect(additionStory(6, 2)).toEqual([
      { kind: "start", expression: "6 + 2" },
      { kind: "swap", expression: "2 + 6" },
    ]);
  });
});

describe("which swaps are safe", () => {
  it("keeps addition and multiplication, not take-away or sharing", () => {
    expect(swapPreserves("add", -3, 10)).toBe(true);
    expect(swapPreserves("multiply", 4, 3)).toBe(true);
    expect(swapPreserves("subtract", 10, 3)).toBe(false);
    expect(swapPreserves("divide", 12, 3)).toBe(false);
    expect(swapPreserves("subtract", 5, 5)).toBe(true);
  });

  it("treats sharing into zero groups as undefined", () => {
    expect(operate("divide", 8, 0)).toBeUndefined();
    expect(swapPreserves("divide", 8, 0)).toBe(false);
  });

  it("keeps the same total when brackets move", () => {
    expect(groupedSums(2, 3, 4)).toEqual({ left: 9, right: 9 });
    expect(groupedSums(-3, 10, 1)).toEqual({ left: 8, right: 8 });
  });
});
