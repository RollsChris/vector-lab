export interface SacredPoint {
  readonly x: number;
  readonly y: number;
}

export type PlatonicSolidId =
  | "tetrahedron"
  | "cube"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron";

export interface PlatonicSolid {
  readonly id: PlatonicSolidId;
  readonly name: string;
  readonly vertices: number;
  readonly edges: number;
  readonly faces: number;
  readonly faceSides: number;
  readonly vertexDegree: number;
  readonly dual: PlatonicSolidId;
  readonly dihedralDegrees: number;
  readonly schlafli: string;
}

/** The seven circle centres in the first hexagonal ring around a centre. */
export function seedOfLife(radius: number): SacredPoint[] {
  return hexagonalCentres(radius, 1);
}

/** The nineteen circle centres in the radius-two hexagonal patch called Flower of Life. */
export function flowerOfLife(radius: number): SacredPoint[] {
  return hexagonalCentres(radius, 2);
}

/**
 * The only five convex regular polyhedra. Counts are authored mathematical facts,
 * rather than inferred from triangulated render geometry.
 */
export const PLATONIC_SOLIDS: readonly PlatonicSolid[] = [
  {
    id: "tetrahedron",
    name: "Tetrahedron",
    vertices: 4,
    edges: 6,
    faces: 4,
    faceSides: 3,
    vertexDegree: 3,
    dual: "tetrahedron",
    dihedralDegrees: 70.53,
    schlafli: "{3, 3}",
  },
  {
    id: "cube",
    name: "Cube",
    vertices: 8,
    edges: 12,
    faces: 6,
    faceSides: 4,
    vertexDegree: 3,
    dual: "octahedron",
    dihedralDegrees: 90,
    schlafli: "{4, 3}",
  },
  {
    id: "octahedron",
    name: "Octahedron",
    vertices: 6,
    edges: 12,
    faces: 8,
    faceSides: 3,
    vertexDegree: 4,
    dual: "cube",
    dihedralDegrees: 109.47,
    schlafli: "{3, 4}",
  },
  {
    id: "dodecahedron",
    name: "Dodecahedron",
    vertices: 20,
    edges: 30,
    faces: 12,
    faceSides: 5,
    vertexDegree: 3,
    dual: "icosahedron",
    dihedralDegrees: 116.57,
    schlafli: "{5, 3}",
  },
  {
    id: "icosahedron",
    name: "Icosahedron",
    vertices: 12,
    edges: 30,
    faces: 20,
    faceSides: 3,
    vertexDegree: 5,
    dual: "dodecahedron",
    dihedralDegrees: 138.19,
    schlafli: "{3, 5}",
  },
];

function hexagonalCentres(radius: number, rings: number): SacredPoint[] {
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError("radius must be a positive finite number");
  }

  const points: { point: SacredPoint; ring: number; angle: number }[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
      if (ring > rings) continue;
      const point = {
        x: radius * (q + r / 2),
        y: radius * (Math.sqrt(3) * r / 2),
      };
      points.push({
        point,
        ring,
        angle: ring === 0 ? 0 : (Math.atan2(point.y, point.x) + Math.PI * 2) % (Math.PI * 2),
      });
    }
  }
  return points
    .sort((a, b) => a.ring - b.ring || a.angle - b.angle)
    .map(({ point }) => point);
}
