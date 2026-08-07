import { describe, expect, it } from "vitest";
import {
  flowerLatticeTriangles,
  flowerOfLife,
  interiorAngleDegrees,
  PLATONIC_SOLIDS,
  platonicFacePlan,
  platonicFaces,
  platonicVertices,
  polygonCircumradius,
  regularPolygon,
  seedOfLife,
} from "../src/math/sacredGeometry";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const distance3 = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const key3 = (point: { x: number; y: number; z: number }) =>
  [point.x, point.y, point.z].map((value) => value.toFixed(6)).join(",");

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

describe("Platonic solid geometry", () => {
  const edgeLength = 2;

  for (const meta of PLATONIC_SOLIDS) {
    describe(meta.id, () => {
      const faces = platonicFaces(meta.id, edgeLength);

      it("produces one regular polygon per mathematical face", () => {
        expect(faces).toHaveLength(meta.faces);
        for (const face of faces) {
          expect(face.vertices).toHaveLength(meta.faceSides);
          for (let i = 0; i < face.vertices.length; i++) {
            const next = face.vertices[(i + 1) % face.vertices.length];
            expect(distance3(face.vertices[i], next)).toBeCloseTo(edgeLength, 6);
            expect(distance3(face.vertices[i], face.centroid)).toBeCloseTo(
              polygonCircumradius(meta.faceSides, edgeLength),
              6,
            );
          }
        }
      });

      it("places every face the same distance from the centre with an outward normal", () => {
        const inradii = faces.map((face) => distance3(face.centroid, { x: 0, y: 0, z: 0 }));
        for (const inradius of inradii) expect(inradius).toBeCloseTo(inradii[0], 6);
        for (const face of faces) {
          expect(Math.hypot(face.normal.x, face.normal.y, face.normal.z)).toBeCloseTo(1, 9);
          const outward =
            face.normal.x * face.centroid.x + face.normal.y * face.centroid.y + face.normal.z * face.centroid.z;
          expect(outward).toBeGreaterThan(0);
        }
      });

      it("reproduces the authored vertex and edge counts from the face geometry", () => {
        const vertexKeys = new Set(faces.flatMap((face) => face.vertices.map(key3)));
        expect(vertexKeys.size).toBe(meta.vertices);

        const edgeKeys = new Set(
          faces.flatMap((face) =>
            face.vertices.map((vertex, index) =>
              [key3(vertex), key3(face.vertices[(index + 1) % face.vertices.length])].sort().join("|"),
            ),
          ),
        );
        expect(edgeKeys.size).toBe(meta.edges);
      });

      it("lays every face flat at true size in the face plan", () => {
        const plan = platonicFacePlan(meta.id, edgeLength);
        expect(plan).toHaveLength(meta.faces);
        for (const face of plan) {
          expect(face.vertices).toHaveLength(meta.faceSides);
          for (let i = 0; i < face.vertices.length; i++) {
            const next = face.vertices[(i + 1) % face.vertices.length];
            expect(distance(face.vertices[i], next)).toBeCloseTo(edgeLength, 6);
          }
        }
      });

      it("keeps the plan faces apart so none overlaps another", () => {
        const plan = platonicFacePlan(meta.id, edgeLength);
        const inradius = polygonCircumradius(meta.faceSides, edgeLength) * Math.cos(Math.PI / meta.faceSides);
        for (let i = 0; i < plan.length; i++) {
          for (let j = i + 1; j < plan.length; j++) {
            expect(distance(plan[i].centre, plan[j].centre)).toBeGreaterThan(inradius * 1.99);
          }
        }
      });

      it("centres the plan on the origin so it frames like the solid", () => {
        const points = platonicFacePlan(meta.id, edgeLength).flatMap((face) => face.vertices);
        const midX = (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2;
        const midY = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
        expect(midX).toBeCloseTo(0, 9);
        expect(midY).toBeCloseTo(0, 9);
      });
    });
  }

  it("marks only the triangle-faced solids as taking their face from the Flower's lattice", () => {
    const fromLattice = PLATONIC_SOLIDS.filter((solid) => solid.faceFromFlowerLattice).map((solid) => solid.id);
    expect(fromLattice).toEqual(["tetrahedron", "octahedron", "icosahedron"]);
    for (const solid of PLATONIC_SOLIDS) {
      expect(solid.faceFromFlowerLattice).toBe(solid.faceSides === 3);
    }
  });
});

describe("flower lattice cells", () => {
  it("finds only equilateral triangles with sides of one compass width", () => {
    const radius = 1.5;
    const triangles = flowerLatticeTriangles(radius);

    expect(triangles.length).toBe(24);
    for (const triangle of triangles) {
      expect(triangle).toHaveLength(3);
      expect(distance(triangle[0], triangle[1])).toBeCloseTo(radius, 9);
      expect(distance(triangle[1], triangle[2])).toBeCloseTo(radius, 9);
      expect(distance(triangle[2], triangle[0])).toBeCloseTo(radius, 9);
    }
  });

  it("matches the equilateral triangle face used by the triangle-faced solids", () => {
    const radius = 1.5;
    const cell = flowerLatticeTriangles(radius)[0];
    const cellCircumradius = polygonCircumradius(3, radius);
    const centre = {
      x: (cell[0].x + cell[1].x + cell[2].x) / 3,
      y: (cell[0].y + cell[1].y + cell[2].y) / 3,
    };
    for (const corner of cell) expect(distance(corner, centre)).toBeCloseTo(cellCircumradius, 9);
    expect(interiorAngleDegrees(3)).toBeCloseTo(60, 9);
  });
});

describe("regular polygon helpers", () => {
  it("relates side length, circumradius and interior angle", () => {
    expect(polygonCircumradius(4, 2)).toBeCloseTo(Math.SQRT2, 9);
    expect(polygonCircumradius(6, 3)).toBeCloseTo(3, 9);
    expect(interiorAngleDegrees(4)).toBe(90);
    expect(interiorAngleDegrees(5)).toBe(108);
  });

  it("spaces polygon vertices evenly from the given rotation", () => {
    const points = regularPolygon(5, 2, { x: 1, y: -1 }, Math.PI / 2);
    expect(points).toHaveLength(5);
    expect(points[0].x).toBeCloseTo(1, 9);
    expect(points[0].y).toBeCloseTo(1, 9);
    for (let i = 0; i < points.length; i++) {
      expect(distance(points[i], points[(i + 1) % points.length])).toBeCloseTo(
        distance(points[0], points[1]),
        9,
      );
    }
  });

  it("rejects impossible polygons and sizes", () => {
    expect(() => polygonCircumradius(2, 1)).toThrow(RangeError);
    expect(() => polygonCircumradius(3, 0)).toThrow(RangeError);
    expect(() => regularPolygon(3, -1)).toThrow(RangeError);
    expect(() => platonicVertices("cube", 0)).toThrow(RangeError);
  });
});
