import { describe, expect, it } from "vitest";
import {
  clusterPlanarPoints,
  flowerLatticeTriangles,
  flowerOfLife,
  interiorAngleDegrees,
  isFlowerLatticePoint,
  PLATONIC_SOLIDS,
  platonicEdges,
  platonicFacePlan,
  platonicFaces,
  platonicProjection,
  platonicVertices,
  polygonCircumradius,
  projectionFrame,
  regularPolygon,
  seedOfLife,
  solidCollapse,
} from "../src/math/sacredGeometry";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const distance3 = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const dot3 = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) => a.x * b.x + a.y * b.y + a.z * b.z;

const cross3 = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

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

describe("planar clustering", () => {
  it("collapses points inside the tolerance and keeps points outside it", () => {
    const clusters = clusterPlanarPoints(
      [
        { x: 0, y: 0 },
        { x: 1e-9, y: -1e-9 },
        { x: 1, y: 0 },
      ],
      1e-6,
    );

    expect(clusters).toHaveLength(2);
    expect(clusters[0].sources).toEqual([0, 1]);
    expect(clusters[0].point.x).toBeCloseTo(0, 8);
    expect(clusters[1].sources).toEqual([2]);
  });

  it("merges values that agree to many decimals but round to different strings", () => {
    // These two are 1e-11 apart, far inside any sane tolerance, but they sit either
    // side of a rounding boundary so a toFixed key would put them in different buckets.
    const straddle = [
      { x: 0.1 + 0.2, y: 0.0000015 },
      { x: 0.3, y: 0.00000149999 },
    ];
    expect(clusterPlanarPoints(straddle, 1e-6)).toHaveLength(1);
    expect(straddle[0].y.toFixed(6)).not.toBe(straddle[1].y.toFixed(6));
  });

  it("rejects a non-positive tolerance", () => {
    expect(() => clusterPlanarPoints([{ x: 0, y: 0 }], 0)).toThrow(RangeError);
  });
});

describe("Flower lattice membership", () => {
  const spacing = 1.45;

  it("accepts every drawn Flower centre and rejects points between them", () => {
    for (const centre of flowerOfLife(spacing)) {
      expect(isFlowerLatticePoint(centre, spacing)).toBe(true);
    }
    expect(isFlowerLatticePoint({ x: spacing / 2, y: 0 }, spacing)).toBe(false);
    expect(isFlowerLatticePoint({ x: 0, y: spacing / 2 }, spacing)).toBe(false);
  });

  it("rejects a non-positive spacing", () => {
    expect(() => isFlowerLatticePoint({ x: 0, y: 0 }, 0)).toThrow(RangeError);
  });
});

describe("Platonic solid edge topology", () => {
  for (const meta of PLATONIC_SOLIDS) {
    it(`finds exactly ${meta.edges} edges for the ${meta.id}`, () => {
      const edges = platonicEdges(meta.id);
      expect(edges).toHaveLength(meta.edges);

      const degree = new Map<number, number>();
      for (const [a, b] of edges) {
        expect(a).toBeLessThan(b);
        degree.set(a, (degree.get(a) ?? 0) + 1);
        degree.set(b, (degree.get(b) ?? 0) + 1);
      }
      expect(degree.size).toBe(meta.vertices);
      for (const count of degree.values()) expect(count).toBe(meta.vertexDegree);
    });
  }
});

describe("Platonic solid projections", () => {
  const radius = 1.45;

  it("views four solids along a 3-fold axis and the icosahedron along a 5-fold one", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const projection = platonicProjection(meta.id, radius);
      expect(projection.axis.order).toBe(meta.id === "icosahedron" ? 5 : 3);
      expect(projection.originalVertexCount).toBe(meta.vertices);
      expect(projection.originalEdgeCount).toBe(meta.edges);
      expect(projection.mergedVertexCount).toBe(meta.vertices - projection.points.length);
      expect(projection.latticeAlignedCount).toBe(
        projection.points.filter((point) => point.onLattice).length,
      );
    }
  });

  it("scales the outer points onto the requested radius and anchors one on +x", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const projection = platonicProjection(meta.id, radius);
      const outer = Math.max(...projection.points.map((point) => point.radius));
      expect(outer).toBeCloseTo(radius, 9);
      const onAxis = projection.points.find(
        (point) => Math.abs(point.x - radius) < 1e-9 && Math.abs(point.y) < 1e-9,
      );
      expect(onAxis, `${meta.id} has no outer point on +x`).toBeDefined();
    }
  });

  it("gives the cube seven points and twelve equal segments, all on Flower centres", () => {
    const projection = platonicProjection("cube", radius, radius);

    expect(projection.axis.label).toBe("3-fold body diagonal");
    expect(projection.points).toHaveLength(7);
    expect(projection.segments).toHaveLength(12);
    expect(projection.originalVertexCount).toBe(8);
    expect(projection.mergedVertexCount).toBe(1);
    expect(projection.latticeAlignedCount).toBe(7);
    expect(projection.equalSegments).toBe(true);

    // A hexagon of six points around one shared centre: the Metatron's Cube figure.
    const centre = projection.points.filter((point) => point.radius < 1e-9);
    expect(centre).toHaveLength(1);
    expect(centre[0].sourceVertices).toHaveLength(2);
    expect(projection.points.filter((point) => Math.abs(point.radius - radius) < 1e-9)).toHaveLength(6);

    for (const segment of projection.segments) expect(segment.length).toBeCloseTo(radius, 9);
    const spokes = projection.segments.filter(
      (segment) =>
        projection.points[segment.from].radius < 1e-9 || projection.points[segment.to].radius < 1e-9,
    );
    expect(spokes).toHaveLength(6);
    expect(projection.segments.flatMap((segment) => segment.sourceEdges)).toHaveLength(12);
  });

  it("leaves most points off the lattice for the dodecahedron and icosahedron", () => {
    for (const id of ["dodecahedron", "icosahedron"] as const) {
      const projection = platonicProjection(id, radius, radius);
      expect(projection.latticeAlignedCount).toBeGreaterThan(0);
      expect(projection.latticeAlignedCount).toBeLessThan(projection.points.length);
      expect(projection.equalSegments).toBe(false);
    }

    // Concretely: the icosahedron's 5-fold view makes a ten-point ring plus a merged centre.
    const icosahedron = platonicProjection("icosahedron", radius, radius);
    expect(icosahedron.points).toHaveLength(11);
    expect(icosahedron.mergedVertexCount).toBe(1);
    expect(icosahedron.latticeAlignedCount).toBe(3);
  });

  it("never reports more points or segments than the solid has vertices and edges", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const projection = platonicProjection(meta.id, radius);
      expect(projection.points.length).toBeLessThanOrEqual(meta.vertices);
      expect(projection.segments.length).toBeLessThanOrEqual(meta.edges);
      for (const segment of projection.segments) expect(segment.from).not.toBe(segment.to);
    }
  });

  it("rejects a non-positive radius or lattice spacing", () => {
    expect(() => platonicProjection("cube", 0)).toThrow(RangeError);
    expect(() => platonicProjection("cube", 1, -1)).toThrow(RangeError);
  });
});

describe("projection viewing frame", () => {
  const radius = 1.45;

  it("gives an orthonormal right-handed basis whose view direction is the stated axis", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const frame = projectionFrame(meta.id, radius);
      const { right, up, view } = frame;

      for (const [name, vector] of [["right", right], ["up", up], ["view", view]] as const) {
        expect(Math.hypot(vector.x, vector.y, vector.z), `${meta.id} ${name}`).toBeCloseTo(1, 12);
      }
      expect(dot3(right, up)).toBeCloseTo(0, 12);
      expect(dot3(right, view)).toBeCloseTo(0, 12);
      expect(dot3(up, view)).toBeCloseTo(0, 12);

      // Right-handed: right × up = view.
      const handed = cross3(right, up);
      expect(distance3(handed, view)).toBeCloseTo(0, 12);

      // The view direction is the solid's own symmetry axis, normalised.
      const axis = frame.axis.axis;
      const size = Math.hypot(axis.x, axis.y, axis.z);
      expect(distance3(view, { x: axis.x / size, y: axis.y / size, z: axis.z / size })).toBeCloseTo(0, 12);
      expect(frame.radius).toBe(radius);
    }
  });

  it("scales unit-edge coordinates so the outermost projected point lands on the radius", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const frame = projectionFrame(meta.id, radius);
      const vertices = platonicVertices(meta.id, 1);
      const flat = vertices.map((vertex) => ({
        x: frame.scale * dot3(vertex, frame.right),
        y: frame.scale * dot3(vertex, frame.up),
      }));
      expect(Math.max(...flat.map((point) => Math.hypot(point.x, point.y)))).toBeCloseTo(radius, 12);
      // The anchoring puts an outermost point on +x with no y component.
      expect(flat.some((point) => Math.abs(point.x - radius) < 1e-9 && Math.abs(point.y) < 1e-9)).toBe(true);
    }
  });

  it("is the same frame the flat projection is built from", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const frame = projectionFrame(meta.id, radius);
      const projection = platonicProjection(meta.id, radius);
      const vertices = platonicVertices(meta.id, 1);

      projection.points.forEach((point) => {
        for (const source of point.sourceVertices) {
          expect(frame.scale * dot3(vertices[source], frame.right)).toBeCloseTo(point.x, 9);
          expect(frame.scale * dot3(vertices[source], frame.up)).toBeCloseTo(point.y, 9);
        }
      });
    }
  });

  it("rejects a non-positive radius", () => {
    expect(() => projectionFrame("cube", 0)).toThrow(RangeError);
    expect(() => projectionFrame("cube", Number.NaN)).toThrow(RangeError);
  });
});

describe("solid collapse into its projection", () => {
  const radius = 1.45;

  it("starts as the rigid solid, correctly scaled, for every solid", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const collapse = solidCollapse(meta.id, 0, radius);
      expect(collapse.vertices).toHaveLength(meta.vertices);
      expect(collapse.edges).toHaveLength(meta.edges);

      for (const [a, b] of collapse.edges) {
        expect(distance3(collapse.vertices[a], collapse.vertices[b])).toBeCloseTo(collapse.edgeLength, 9);
      }

      // Rigid means every pairwise distance matches the solid at that edge length, not
      // only the edges: a flattened figure would keep the edges and lose the rest.
      const reference = platonicVertices(meta.id, collapse.edgeLength);
      const pairs = (points: readonly { x: number; y: number; z: number }[]) => {
        const out: number[] = [];
        for (let i = 0; i < points.length; i++) {
          for (let j = i + 1; j < points.length; j++) out.push(distance3(points[i], points[j]));
        }
        return out.sort((a, b) => a - b);
      };
      const actual = pairs(collapse.vertices);
      const expected = pairs(reference);
      actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 9));
    }
  });

  it("faces the camera down the stated symmetry axis at t = 0", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const collapse = solidCollapse(meta.id, 0, radius);
      const vertices = platonicVertices(meta.id, 1);
      // Depth is exactly the component along the solid's own axis: the axis points at us.
      collapse.vertices.forEach((vertex, index) => {
        expect(vertex.z).toBeCloseTo(collapse.frame.scale * dot3(vertices[index], collapse.frame.view), 12);
        expect(vertex.depth).toBeCloseTo(vertex.z, 12);
      });
      expect(collapse.depthSpan).toBeGreaterThan(0);
    }
  });

  it("ends exactly on the flat projection the Flower overlay draws", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const collapse = solidCollapse(meta.id, 1, radius, radius);
      const projection = platonicProjection(meta.id, radius, radius);

      expect(collapse.projection.points).toEqual(projection.points);
      expect(collapse.projection.segments).toEqual(projection.segments);
      for (const vertex of collapse.vertices) {
        expect(vertex.z).toBe(0);
        expect(vertex.x).toBe(projection.points[vertex.point].x);
        expect(vertex.y).toBe(projection.points[vertex.point].y);
      }
      expect(collapse.depthSpan).toBeCloseTo(0, 12);
    }
  });

  it("keeps x and y fixed and shrinks depth monotonically as t rises", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const steps = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
      const frames = steps.map((t) => solidCollapse(meta.id, t, radius));

      for (let index = 0; index < meta.vertices; index++) {
        const start = frames[0].vertices[index];
        let previous = Math.abs(start.z);
        for (const frame of frames.slice(1)) {
          const vertex = frame.vertices[index];
          expect(vertex.x).toBe(start.x);
          expect(vertex.y).toBe(start.y);
          expect(Math.abs(vertex.z)).toBeLessThanOrEqual(previous + 1e-12);
          // Depth strictly shrinks unless the vertex was already in the plane.
          if (Math.abs(start.z) > 1e-9) expect(Math.abs(vertex.z)).toBeLessThan(previous);
          previous = Math.abs(vertex.z);
        }
      }

      frames.forEach((frame, index) => {
        if (index === 0) return;
        expect(frame.depthSpan).toBeLessThan(frames[index - 1].depthSpan + 1e-12);
      });
    }
  });

  it("collapses the cube along its body diagonal into seven points and twelve edges", () => {
    const collapse = solidCollapse("cube", 0, radius, radius);

    expect(collapse.axis.label).toBe("3-fold body diagonal");
    expect(collapse.edgeLength).toBeCloseTo(radius * Math.sqrt(1.5), 12);
    expect(collapse.projection.points).toHaveLength(7);
    expect(collapse.projection.segments).toHaveLength(12);

    // The body diagonal's two ends are the only vertices on the axis, one near, one far.
    expect(collapse.axisVertices).toHaveLength(2);
    const [first, second] = collapse.axisVertices.map((index) => collapse.vertices[index]);
    for (const end of [first, second]) {
      expect(Math.hypot(end.x, end.y)).toBeCloseTo(0, 12);
    }
    expect(Math.sign(first.depth)).toBe(-Math.sign(second.depth));
    expect(distance3(first, second)).toBeCloseTo(collapse.edgeLength * Math.sqrt(3), 12);
    expect(collapse.depthSpan).toBeCloseTo(collapse.edgeLength * Math.sqrt(3), 12);

    // Those two vertices are the pair the projection merges; the other six stay apart.
    expect(first.point).toBe(second.point);
    expect(collapse.projection.points[first.point].sourceVertices).toHaveLength(2);
    expect(new Set(collapse.vertices.map((vertex) => vertex.point)).size).toBe(7);
  });

  it("merges cube vertices only as the last of the depth between them goes", () => {
    const [near, far] = solidCollapse("cube", 0, radius).axisVertices;
    const gap = (t: number) => {
      const collapse = solidCollapse("cube", t, radius);
      return distance3(collapse.vertices[near], collapse.vertices[far]);
    };

    expect(gap(0)).toBeCloseTo(radius * Math.sqrt(1.5) * Math.sqrt(3), 12);
    expect(gap(0.5)).toBeCloseTo(gap(0) / 2, 12);
    expect(gap(1)).toBeCloseTo(0, 12);
    // Every other pair of vertices stays distinct all the way to the flat projection.
    const flat = solidCollapse("cube", 1, radius);
    for (let i = 0; i < flat.vertices.length; i++) {
      for (let j = i + 1; j < flat.vertices.length; j++) {
        const apart = distance3(flat.vertices[i], flat.vertices[j]);
        if (i === near && j === far) continue;
        if (j === near && i === far) continue;
        expect(apart).toBeGreaterThan(radius * 0.5);
      }
    }
  });

  it("merges exactly the vertices the projection says merge, for every solid", () => {
    for (const meta of PLATONIC_SOLIDS) {
      const collapse = solidCollapse(meta.id, 1, radius, radius);
      const landed = new Map<number, number[]>();
      collapse.vertices.forEach((vertex, index) => {
        landed.set(vertex.point, [...(landed.get(vertex.point) ?? []), index]);
      });
      expect(landed.size).toBe(collapse.projection.points.length);
      collapse.projection.points.forEach((point, index) => {
        expect(landed.get(index)).toEqual([...point.sourceVertices]);
      });
      // Merged vertices are exactly those sharing a projected point.
      const mergedVertices = [...landed.values()].filter((group) => group.length > 1);
      const lost = mergedVertices.reduce((sum, group) => sum + group.length - 1, 0);
      expect(lost).toBe(collapse.projection.mergedVertexCount);
    }
  });

  it("rejects a t outside the unit interval, or a non-positive size", () => {
    for (const bad of [-0.001, 1.001, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => solidCollapse("cube", bad, radius), `t = ${bad}`).toThrow(RangeError);
    }
    expect(() => solidCollapse("cube", 0, 0)).toThrow(RangeError);
    expect(() => solidCollapse("cube", 0, radius, -1)).toThrow(RangeError);
    expect(() => solidCollapse("cube", 0, radius, radius)).not.toThrow();
    expect(() => solidCollapse("cube", 1, radius)).not.toThrow();
  });
});
