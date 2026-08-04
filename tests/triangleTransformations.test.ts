import { describe, expect, it } from "vitest";
import {
  matchesTriangle,
  orientationName,
  scaleFactor,
  transformTriangle,
  triangleMetrics,
  type Triangle,
} from "../src/math/triangleTransformations";

const SOURCE: Triangle = [
  { x: -2, y: -1 },
  { x: 0, y: 3 },
  { x: 3, y: -1 },
];

describe("triangle transformations", () => {
  it.each(["translation", "rotation", "reflection"] as const)(
    "%s preserves side lengths, angles and unsigned area",
    (transformation) => {
      const before = triangleMetrics(SOURCE);
      const after = triangleMetrics(transformTriangle(SOURCE, transformation));
      after.sideLengths.forEach((value, index) => expect(value).toBeCloseTo(before.sideLengths[index], 10));
      after.angles.forEach((value, index) => expect(value).toBeCloseTo(before.angles[index], 10));
      expect(after.area).toBeCloseTo(before.area, 10);
    },
  );

  it("reflects in y = 0 and reverses orientation", () => {
    const image = transformTriangle(SOURCE, "reflection");
    expect(image).toEqual([
      { x: -2, y: 1 },
      { x: 0, y: -3 },
      { x: 3, y: 1 },
    ]);
    expect(orientationName(image)).not.toBe(orientationName(SOURCE));
    expect(transformTriangle(image, "reflection")).toEqual(SOURCE);
  });

  it("rotates a point through a quarter turn", () => {
    const image = transformTriangle([{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }], "rotation");
    expect(image[0].x).toBeCloseTo(0, 10);
    expect(image[0].y).toBeCloseTo(2, 10);
  });

  it("scales side lengths by k and area by k squared", () => {
    const before = triangleMetrics(SOURCE);
    const after = triangleMetrics(transformTriangle(SOURCE, "enlargement"));
    const k = scaleFactor("enlargement");
    after.sideLengths.forEach((value, index) => expect(value).toBeCloseTo(before.sideLengths[index] * k, 10));
    expect(after.area).toBeCloseTo(before.area * k * k, 10);
    after.angles.forEach((value, index) => expect(value).toBeCloseTo(before.angles[index], 10));
  });

  it("matches only an image with the right corresponding positions", () => {
    const expected = transformTriangle(SOURCE, "translation");
    expect(matchesTriangle(expected, expected)).toBe(true);
    expect(matchesTriangle(
      expected.map((point) => ({ x: point.x + 0.4, y: point.y })) as Triangle,
      expected,
    )).toBe(false);
  });
});
