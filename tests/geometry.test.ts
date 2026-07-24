import { describe, expect, it } from "vitest";
import { solveGeometry } from "../src/math/geometry";

describe("geometry calculators", () => {
  it("calculates circle circumference and area from radius", () => {
    const result = solveGeometry("circle", { radius: 3 });
    expect(result.error).toBeUndefined();
    expect(result.results.find((item) => item.label === "Circumference")?.value).toBeCloseTo(6 * Math.PI, 6);
    expect(result.results.find((item) => item.label === "Area")?.value).toBeCloseTo(9 * Math.PI, 6);
  });

  it("calculates regular polygon area from sides and side length", () => {
    const result = solveGeometry("regular-polygon", { sides: 6, sideLength: 2 });
    expect(result.error).toBeUndefined();
    expect(result.results.find((item) => item.label === "Area")?.value).toBeCloseTo(6 * Math.sqrt(3), 6);
    expect(result.results.find((item) => item.label === "Interior angle")?.value).toBeCloseTo(120, 6);
  });

  it("calculates cylinder volume and surface area", () => {
    const result = solveGeometry("cylinder-volume", { radius: 2, height: 5 });
    expect(result.error).toBeUndefined();
    expect(result.results.find((item) => item.label === "Volume")?.value).toBeCloseTo(20 * Math.PI, 6);
    expect(result.results.find((item) => item.label === "Surface area")?.value).toBeCloseTo(28 * Math.PI, 6);
  });

  it("rejects invalid side counts", () => {
    const result = solveGeometry("regular-polygon", { sides: 2, sideLength: 4 });
    expect(result.results).toEqual([]);
    expect(result.error).toBe("Number of sides must be at least 3.");
  });
});
