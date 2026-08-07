import { describe, expect, it } from "vitest";
import { flowerOfLife, PLATONIC_SOLIDS, seedOfLife } from "../src/math/sacredGeometry";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe("sacred geometry constructions", () => {
  it("builds the seed from a centre and six radius-spaced neighbours", () => {
    const radius = 3;
    const centres = seedOfLife(radius);

    expect(centres).toHaveLength(7);
    expect(centres[0]).toEqual({ x: 0, y: 0 });
    expect(centres[1].x).toBeCloseTo(radius);
    expect(centres[1].y).toBeCloseTo(0);
    expect(centres.filter((point) => Math.abs(distance(point, { x: 0, y: 0 }) - radius) < 1e-9)).toHaveLength(6);
  });

  it("extends the seed into nineteen circles on a radius-two hexagonal patch", () => {
    const radius = 2;
    const seed = seedOfLife(radius);
    const flower = flowerOfLife(radius);

    expect(flower).toHaveLength(19);
    expect(Math.max(...flower.map((point) => distance(point, { x: 0, y: 0 })))).toBeCloseTo(radius * 2);
    for (const seedPoint of seed) {
      expect(flower.some((point) => distance(point, seedPoint) < 1e-9)).toBe(true);
    }
  });
});

describe("Platonic solid data", () => {
  it("contains exactly the five convex regular solids with consistent counts and duals", () => {
    expect(PLATONIC_SOLIDS.map((solid) => solid.id)).toEqual([
      "tetrahedron",
      "cube",
      "octahedron",
      "dodecahedron",
      "icosahedron",
    ]);

    for (const solid of PLATONIC_SOLIDS) {
      expect(solid.vertices - solid.edges + solid.faces).toBe(2);
      expect(solid.faces * solid.faceSides).toBe(solid.edges * 2);
      expect(solid.vertices * solid.vertexDegree).toBe(solid.edges * 2);
      const dual = PLATONIC_SOLIDS.find((candidate) => candidate.id === solid.dual);
      expect(dual?.dual).toBe(solid.id);
    }
  });
});
