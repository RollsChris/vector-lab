import { describe, expect, it } from "vitest";
import {
  arcLengthTo,
  eccentricity,
  ellipseArea,
  focalDistance,
  orderedAxes,
  perimeterArcLength,
  ramanujanPerimeter,
} from "../src/math/ellipse";

describe("ellipse measurements", () => {
  it("treats a circle as the zero-eccentricity case", () => {
    expect(focalDistance(3, 3)).toBeCloseTo(0, 12);
    expect(eccentricity(3, 3)).toBeCloseTo(0, 12);
    expect(ellipseArea(3, 3)).toBeCloseTo(9 * Math.PI, 10);
    expect(ramanujanPerimeter(3, 3)).toBeCloseTo(6 * Math.PI, 6);
    expect(perimeterArcLength(3, 3, 4000)).toBeCloseTo(6 * Math.PI, 4);
  });

  it("calculates c, e and area for a = 5, b = 3", () => {
    expect(focalDistance(5, 3)).toBeCloseTo(4, 12);
    expect(eccentricity(5, 3)).toBeCloseTo(0.8, 12);
    expect(ellipseArea(5, 3)).toBeCloseTo(15 * Math.PI, 10);
    expect(ramanujanPerimeter(5, 3)).toBeCloseTo(25.527, 2);
  });

  it("reports the same shape numbers for a tall ellipse", () => {
    expect(orderedAxes(3, 5)).toEqual([5, 3]);
    expect(focalDistance(3, 5)).toBeCloseTo(4, 12);
    expect(eccentricity(3, 5)).toBeCloseTo(0.8, 12);
  });

  it("matches Ramanujan's approximation against the numerical perimeter", () => {
    const numeric = perimeterArcLength(5, 3, 20000);
    expect(ramanujanPerimeter(5, 3)).toBeCloseTo(numeric, 3);
  });

  it("accumulates a quarter of the circumference over a quarter turn of a circle", () => {
    expect(arcLengthTo(2, 2, Math.PI / 2, 4000)).toBeCloseTo(Math.PI, 4);
    expect(arcLengthTo(5, 3, 0)).toBeCloseTo(0, 12);
  });
});
