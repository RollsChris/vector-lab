import { describe, expect, it } from "vitest";
import { parseCutList, planCutList } from "../src/math/cutList";

describe("parseCutList", () => {
  it("parses optional quantities, commas in names, and comments", () => {
    const parsed = parseCutList("# frame\nUpper, shelf, 600 mm, 2\nRail, 400");
    expect(parsed.errors).toEqual([]);
    expect(parsed.parts).toEqual([
      { name: "Upper, shelf", length: 600, quantity: 2 },
      { name: "Rail", length: 400, quantity: 1 },
    ]);
  });
});

describe("planCutList", () => {
  it("does not charge a kerf after the final exact-fit piece", () => {
    const plan = planCutList(2400, 0, 3, [
      { name: "Long", length: 800, quantity: 2 },
      { name: "End", length: 794, quantity: 1 },
    ]);
    expect(plan.errors).toEqual([]);
    expect(plan.boards).toHaveLength(1);
    expect(plan.boards[0].kerfLoss).toBe(6);
    expect(plan.boards[0].offcut).toBe(0);
  });

  it("reports keep-side marks from the trimmed reference end", () => {
    const plan = planCutList(1000, 20, 3, [{ name: "Rail", length: 400, quantity: 2 }]);

    expect(plan.boards[0].pieces).toMatchObject([
      { start: 0, end: 400 },
      { start: 403, end: 803 },
    ]);
  });

  it("reports an oversized part without attempting to pack forever", () => {
    const plan = planCutList(2400, 20, 3, [{ name: "Too long", length: 2361, quantity: 1 }]);
    expect(plan.boards).toHaveLength(0);
    expect(plan.errors[0].message).toMatch(/exceeds usable/);
  });

  it("keeps fractional kerfs exact to a thousandth of a millimetre", () => {
    const plan = planCutList(1000, 0, 2.5, [
      { name: "A", length: 498.75, quantity: 2 },
    ]);
    expect(plan.boards).toHaveLength(1);
    expect(plan.boards[0].offcut).toBe(0);
  });
});
