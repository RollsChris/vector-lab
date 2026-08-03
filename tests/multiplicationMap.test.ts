import { describe, expect, it } from "vitest";
import {
  multiplicationMapSquares,
  multiplicationMapTarget,
} from "../src/math/multiplicationMap";

describe("multiplication map", () => {
  it("finds every in-grid factor-pair cell", () => {
    expect(multiplicationMapTarget(11)).toMatchObject({
      pairs: [{ a: 1, b: 11 }],
      cells: [{ a: 1, b: 11 }, { a: 11, b: 1 }],
      reachable: true,
      isSquare: false,
    });
    expect(multiplicationMapTarget(18).cells).toEqual([
      { a: 2, b: 9 },
      { a: 9, b: 2 },
      { a: 3, b: 6 },
      { a: 6, b: 3 },
    ]);
    expect(multiplicationMapTarget(36).cells).toHaveLength(5);
    expect(multiplicationMapTarget(144).cells).toEqual([{ a: 12, b: 12 }]);
  });

  it("explains products that cannot appear in the 1–12 map", () => {
    expect(multiplicationMapTarget(0)).toMatchObject({
      target: 0,
      pairs: [],
      divisorsInScope: [],
      isSquare: false,
      reachable: false,
    });
    expect(multiplicationMapTarget(13)).toMatchObject({
      pairs: [],
      cells: [],
      reachable: false,
      divisorsInScope: [1],
    });
    expect(multiplicationMapTarget(143)).toMatchObject({
      reachable: false,
      divisorsInScope: [1, 11],
    });
  });

  it("identifies the square-number diagonal", () => {
    expect(multiplicationMapTarget(36)).toMatchObject({ isSquare: true, root: 6 });
    expect(multiplicationMapTarget(18)).toMatchObject({ isSquare: false, root: null });
    expect(multiplicationMapSquares()).toHaveLength(12);
  });
});
