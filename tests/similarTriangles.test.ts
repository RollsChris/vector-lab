import { describe, expect, it } from "vitest";
import {
  computeSimilarTriangles,
  measureTriangle,
  similarCopy,
  translateTriangle,
  type Triangle,
} from "../src/math/similarTriangles";

const SOURCE: Triangle = [
  { x: -2, y: -1 },
  { x: 2, y: -1 },
  { x: 0, y: 2 },
];

describe("similarTriangles", () => {
  it("measures sides, angles and area", () => {
    const m = measureTriangle(SOURCE);
    expect(m.valid).toBe(true);
    expect(m.angles[0] + m.angles[1] + m.angles[2]).toBeCloseTo(180, 1);
    expect(m.area).toBeGreaterThan(0);
  });

  it("detects AA/SSS similarity for a scaled rotated copy", () => {
    const image = translateTriangle(
      similarCopy(SOURCE, 1.5, { x: 0, y: 0 }, Math.PI / 5),
      3.5,
      0.2,
    );
    const result = computeSimilarTriangles(SOURCE, image);
    expect(result.source.valid).toBe(true);
    expect(result.image.valid).toBe(true);
    expect(result.best.similar).toBe(true);
    expect(result.best.scale).toBeCloseTo(1.5, 2);
    expect(["AA", "SAS", "SSS"]).toContain(result.best.test);
  });

  it("detects similarity after reflection", () => {
    const image = translateTriangle(similarCopy(SOURCE, 0.75, { x: 0, y: 0 }, 0, true), 4, -0.5);
    const result = computeSimilarTriangles(SOURCE, image);
    expect(result.best.similar).toBe(true);
    expect(result.best.scale).toBeCloseTo(0.75, 2);
  });

  it("rejects a clearly non-similar triangle", () => {
    const image: Triangle = [
      { x: 2, y: -1 },
      { x: 5, y: -1 },
      { x: 2.2, y: 3.5 },
    ];
    const result = computeSimilarTriangles(SOURCE, image);
    expect(result.best.similar).toBe(false);
    expect(result.best.test).toBe("none");
  });

  it("flags a degenerate triangle as invalid", () => {
    const flat: Triangle = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
    ];
    expect(measureTriangle(flat).valid).toBe(false);
  });
});
