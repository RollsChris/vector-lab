export interface SacredPoint {
  readonly x: number;
  readonly y: number;
}

export interface SacredVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
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
  /** Plain-English name of the face polygon. */
  readonly faceName: string;
  /**
   * True only when the face polygon is a cell of the Flower of Life's triangular lattice,
   * i.e. an equilateral triangle. Squares and regular pentagons are not lattice cells.
   */
  readonly faceFromFlowerLattice: boolean;
}

/** One face of a solid, as a closed regular polygon in space. */
export interface SolidFace {
  readonly vertices: readonly SacredVector3[];
  readonly centroid: SacredVector3;
  /** Unit normal pointing away from the solid's centre. */
  readonly normal: SacredVector3;
}

/** One face of the flat face plan, as a regular polygon in the plane. */
export interface FlatFace {
  readonly vertices: readonly SacredPoint[];
  readonly centre: SacredPoint;
  /** Direction of the first vertex from the centre, in radians. */
  readonly rotation: number;
}

/** A group of 3D vertices that land on one another when projected to the plane. */
export interface PointCluster {
  /** Average position of every member, in projection units. */
  readonly point: SacredPoint;
  /** Indices into the source list, ascending. */
  readonly sources: readonly number[];
}

/** One projected vertex of a solid's shadow. */
export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  /** Indices of the solid's 3D vertices that project onto this point. */
  readonly sourceVertices: readonly number[];
  /** True when the point coincides with a circle centre of the Flower's lattice. */
  readonly onLattice: boolean;
  /** Distance from the projection centre. */
  readonly radius: number;
}

/** One projected edge, as indices into the projection's point list. */
export interface ProjectedSegment {
  readonly from: number;
  readonly to: number;
  readonly length: number;
  /** Indices of the solid's 3D edges that project onto this segment. */
  readonly sourceEdges: readonly number[];
}

/** The axis a solid is viewed along, and the rotational symmetry that axis carries. */
export interface ProjectionAxis {
  /** Unit direction in the solid's own coordinates. */
  readonly axis: SacredVector3;
  /** Order of the rotational symmetry about the axis: 3-fold or 5-fold here. */
  readonly order: number;
  /** Which feature of the solid the axis passes through. */
  readonly through: "vertex" | "face";
  /** Short human description, e.g. "3-fold body diagonal". */
  readonly label: string;
}

/**
 * The one viewing frame a solid's projection is taken in: an orthonormal basis of the
 * solid's own coordinates, plus the uniform scale that puts the outermost projected point
 * at the requested radius. `view` is the stated symmetry axis and maps to +z, so a camera
 * looking down −z sees exactly the projection. The flat projection and the 3D collapse are
 * both built from this frame, so the two can never drift apart.
 */
export interface ProjectionFrame {
  readonly id: PlatonicSolidId;
  readonly axis: ProjectionAxis;
  /** Unit vector in solid coordinates that maps to +x of the projection plane. */
  readonly right: SacredVector3;
  /** Unit vector in solid coordinates that maps to +y of the projection plane. */
  readonly up: SacredVector3;
  /** Unit vector in solid coordinates that maps to +z, i.e. towards the viewer. */
  readonly view: SacredVector3;
  /** Multiplier taking unit-edge solid coordinates into projection units. */
  readonly scale: number;
  /** Distance from the centre to the outermost projected point. */
  readonly radius: number;
}

/** One vertex of the solid part-way through the collapse, in projection units. */
export interface CollapseVertex {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Index of the projected point this vertex lands on, into `SolidCollapse.projection`. */
  readonly point: number;
  /** Signed distance from the projection plane before any flattening, i.e. at t = 0. */
  readonly depth: number;
}

/**
 * A solid caught between being itself and being its own shadow. At t = 0 the vertices are
 * the rigid solid, turned so its projection axis points at the viewer; at t = 1 depth is
 * gone and the x/y coordinates are exactly those of `platonicProjection`.
 */
export interface SolidCollapse {
  readonly id: PlatonicSolidId;
  readonly axis: ProjectionAxis;
  /** How far the collapse has run, 0 (solid) to 1 (flat projection). */
  readonly t: number;
  readonly frame: ProjectionFrame;
  /** The flat projection the collapse ends on: the same data the Flower overlay uses. */
  readonly projection: SolidProjection;
  /** One entry per 3D vertex of the solid, in `platonicVertices` order. */
  readonly vertices: readonly CollapseVertex[];
  /** The solid's edges as vertex index pairs, in `platonicEdges` order. */
  readonly edges: readonly (readonly [number, number])[];
  /** Edge length of the rigid solid, i.e. the length every edge has at t = 0. */
  readonly edgeLength: number;
  /** Vertices lying on the viewing axis itself; for the cube, its body diagonal's ends. */
  readonly axisVertices: readonly number[];
  /** Distance from the nearest to the furthest vertex at this t; zero once flat. */
  readonly depthSpan: number;
}

/**
 * A solid's orthographic shadow along a symmetry axis, as plain data: no render objects,
 * no styling, nothing that needs a canvas to be true.
 */
export interface SolidProjection {
  readonly id: PlatonicSolidId;
  readonly axis: ProjectionAxis;
  readonly points: readonly ProjectedPoint[];
  readonly segments: readonly ProjectedSegment[];
  /** Vertices of the 3D solid, before any of them merged. */
  readonly originalVertexCount: number;
  /** Edges of the 3D solid, before any of them merged. */
  readonly originalEdgeCount: number;
  /** How many 3D vertices were lost to merging: originalVertexCount − points.length. */
  readonly mergedVertexCount: number;
  /** How many projected points sit on a circle centre of the Flower's lattice. */
  readonly latticeAlignedCount: number;
  /** Circumradius of the projection, i.e. the requested overlay radius. */
  readonly radius: number;
  /** Lattice spacing the alignment was measured against. */
  readonly latticeSpacing: number;
  /** True when every projected segment has the same length. */
  readonly equalSegments: boolean;
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
    faceName: "equilateral triangle",
    faceFromFlowerLattice: true,
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
    faceName: "square",
    faceFromFlowerLattice: false,
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
    faceName: "equilateral triangle",
    faceFromFlowerLattice: true,
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
    faceName: "regular pentagon",
    faceFromFlowerLattice: false,
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
    faceName: "equilateral triangle",
    faceFromFlowerLattice: true,
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

const EPSILON = 1e-9;

/** Distance from a regular polygon's centre to a vertex, given its side length. */
export function polygonCircumradius(sides: number, edgeLength: number): number {
  requireInteger(sides, 3, "sides");
  requirePositive(edgeLength, "edgeLength");
  return edgeLength / (2 * Math.sin(Math.PI / sides));
}

/** Interior angle of a regular polygon in degrees. */
export function interiorAngleDegrees(sides: number): number {
  requireInteger(sides, 3, "sides");
  return ((sides - 2) * 180) / sides;
}

/** Vertices of a regular polygon, counter-clockwise from the given rotation. */
export function regularPolygon(
  sides: number,
  circumradius: number,
  centre: SacredPoint = { x: 0, y: 0 },
  rotation = 0,
): SacredPoint[] {
  requireInteger(sides, 3, "sides");
  requirePositive(circumradius, "circumradius");
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (index / sides) * Math.PI * 2;
    return {
      x: centre.x + circumradius * Math.cos(angle),
      y: centre.y + circumradius * Math.sin(angle),
    };
  });
}

/**
 * Vertices of a Platonic solid centred on the origin, scaled so every edge has the
 * requested length. Coordinates come from the standard golden-ratio constructions.
 */
export function platonicVertices(id: PlatonicSolidId, edgeLength = 1): SacredVector3[] {
  requirePositive(edgeLength, "edgeLength");
  const raw = RAW_VERTICES[id]();
  const scale = edgeLength / shortestDistance(raw);
  return raw.map((vertex) => scaleVector(vertex, scale));
}

/** Distance from the centre to any vertex, for the given edge length. */
export function platonicCircumradius(id: PlatonicSolidId, edgeLength = 1): number {
  const vertices = platonicVertices(id, edgeLength);
  return length(vertices[0]);
}

/**
 * The faces of a Platonic solid as ordered regular polygons. Each face plane is found
 * from a vertex and two of its neighbours, then kept only when no vertex lies outside
 * it and it holds exactly the expected number of vertices.
 */
export function platonicFaces(id: PlatonicSolidId, edgeLength = 1): SolidFace[] {
  const vertices = platonicVertices(id, edgeLength);
  const meta = PLATONIC_SOLIDS.find((solid) => solid.id === id)!;
  const tolerance = edgeLength * 1e-6;

  const faces = new Map<string, SolidFace>();
  for (let i = 0; i < vertices.length; i++) {
    const neighbours = vertices.filter(
      (vertex) => vertex !== vertices[i] && Math.abs(length(subtract(vertex, vertices[i])) - edgeLength) < tolerance,
    );
    for (let j = 0; j < neighbours.length; j++) {
      for (let k = j + 1; k < neighbours.length; k++) {
        const candidate = cross(subtract(neighbours[j], vertices[i]), subtract(neighbours[k], vertices[i]));
        if (length(candidate) < tolerance) continue;
        let normal = normalise(candidate);
        if (dot(normal, vertices[i]) < 0) normal = scaleVector(normal, -1);

        const reach = Math.max(...vertices.map((vertex) => dot(vertex, normal)));
        if (reach - dot(vertices[i], normal) > tolerance) continue; // an interior plane, not a face
        const onIndices = vertices
          .map((vertex, index) => ({ vertex, index }))
          .filter(({ vertex }) => Math.abs(dot(vertex, normal) - reach) < tolerance);
        if (onIndices.length !== meta.faceSides) continue;
        const onFace = onIndices.map(({ vertex }) => vertex);

        const centroid = averageVector(onFace);
        const u = normalise(subtract(onFace[0], centroid));
        const w = cross(normal, u);
        const ordered = [...onFace].sort(
          (a, b) => faceAngle(a, centroid, u, w) - faceAngle(b, centroid, u, w),
        );
        faces.set(onIndices.map(({ index }) => index).join("-"), { vertices: ordered, centroid, normal });
      }
    }
  }

  // A stable order keeps the assembly animation reproducible between runs.
  return [...faces.values()].sort(
    (a, b) =>
      b.normal.y - a.normal.y ||
      Math.atan2(a.normal.z, a.normal.x) - Math.atan2(b.normal.z, b.normal.x),
  );
}

/**
 * A flat plan of every face of a solid, laid out at true size and centred on the origin.
 * Triangle-faced solids are laid out on the same triangular lattice the Flower of Life
 * draws; the cube's squares and the dodecahedron's pentagons are laid out separately,
 * because neither polygon is a cell of that lattice.
 */
export function platonicFacePlan(id: PlatonicSolidId, edgeLength = 1): FlatFace[] {
  requirePositive(edgeLength, "edgeLength");
  const meta = PLATONIC_SOLIDS.find((solid) => solid.id === id)!;
  const circumradius = polygonCircumradius(meta.faceSides, edgeLength);
  const placements =
    meta.faceSides === 3
      ? TRIANGLE_PLAN[id]!.map((cell) => triangleCell(cell[0], cell[1], edgeLength))
      : id === "cube"
        ? squarePlan(edgeLength)
        : pentagonPlan(edgeLength);

  const faces = placements.map((placement) => ({
    centre: placement.centre,
    rotation: placement.rotation,
    vertices: regularPolygon(meta.faceSides, circumradius, placement.centre, placement.rotation),
  }));
  return centrePlan(faces);
}

/**
 * Every equilateral triangle whose corners are three mutually adjacent circle centres of
 * the Flower of Life. These are the lattice cells that supply triangular faces.
 */
export function flowerLatticeTriangles(radius: number): SacredPoint[][] {
  const centres = flowerOfLife(radius);
  const adjacent = (a: SacredPoint, b: SacredPoint) =>
    Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - radius) < radius * 1e-9;

  const triangles: SacredPoint[][] = [];
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      if (!adjacent(centres[i], centres[j])) continue;
      for (let k = j + 1; k < centres.length; k++) {
        if (adjacent(centres[i], centres[k]) && adjacent(centres[j], centres[k])) {
          triangles.push([centres[i], centres[j], centres[k]]);
        }
      }
    }
  }
  return triangles;
}

const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * The symmetry axis each solid is viewed along. Every entry is an axis of the solid's own
 * rotation group, so the shadow it casts is itself rotationally symmetric of that order.
 * Four solids use a 3-fold axis; the icosahedron has no 3-fold vertex axis that produces a
 * hexagonal shadow, so it uses one of its 5-fold vertex axes instead.
 */
export const PROJECTION_AXES: Readonly<Record<PlatonicSolidId, ProjectionAxis>> = {
  tetrahedron: {
    axis: { x: 1, y: 1, z: 1 },
    order: 3,
    through: "vertex",
    label: "3-fold vertex axis",
  },
  // (1, 1, 1) joins two opposite corners of the cube: its body diagonal.
  cube: { axis: { x: 1, y: 1, z: 1 }, order: 3, through: "vertex", label: "3-fold body diagonal" },
  octahedron: {
    axis: { x: 1, y: 1, z: 1 },
    order: 3,
    through: "face",
    label: "3-fold face axis",
  },
  dodecahedron: {
    axis: { x: 1, y: 1, z: 1 },
    order: 3,
    through: "vertex",
    label: "3-fold vertex axis",
  },
  icosahedron: {
    axis: { x: 0, y: 1, z: PHI },
    order: 5,
    through: "vertex",
    label: "5-fold vertex axis",
  },
};

/**
 * Index pairs for the solid's edges, found as the vertex pairs exactly one edge length
 * apart. Pairs are ordered ascending and the list is stable for a given solid.
 */
export function platonicEdges(id: PlatonicSolidId): readonly (readonly [number, number])[] {
  const vertices = platonicVertices(id, 1);
  const tolerance = 1e-6;
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      if (Math.abs(length(subtract(vertices[j], vertices[i])) - 1) < tolerance) edges.push([i, j]);
    }
  }
  return edges;
}

/**
 * Collapse points that land within `tolerance` of each other into single clusters. A
 * tolerance test is used rather than rounding to a fixed number of decimals, because two
 * coordinates can agree to any number of decimals and still round to different strings.
 */
export function clusterPlanarPoints(
  points: readonly SacredPoint[],
  tolerance: number,
): PointCluster[] {
  requirePositive(tolerance, "tolerance");
  const clusters: { xs: number[]; ys: number[]; sources: number[] }[] = [];
  points.forEach((point, index) => {
    const existing = clusters.find(
      (cluster) =>
        Math.hypot(point.x - average(cluster.xs), point.y - average(cluster.ys)) <= tolerance,
    );
    if (existing) {
      existing.xs.push(point.x);
      existing.ys.push(point.y);
      existing.sources.push(index);
      return;
    }
    clusters.push({ xs: [point.x], ys: [point.y], sources: [index] });
  });
  return clusters.map((cluster) => ({
    point: { x: average(cluster.xs), y: average(cluster.ys) },
    sources: [...cluster.sources].sort((a, b) => a - b),
  }));
}

/**
 * True when a point sits on a circle centre of the triangular lattice the Flower of Life
 * draws at the given spacing. The lattice is tested as the infinite lattice: the drawn
 * Flower is a finite patch of it, so a point beyond the patch still either is or is not a
 * lattice point.
 */
export function isFlowerLatticePoint(
  point: SacredPoint,
  spacing: number,
  tolerance = spacing * 1e-6,
): boolean {
  requirePositive(spacing, "spacing");
  const r = point.y / ((spacing * Math.sqrt(3)) / 2);
  const q = point.x / spacing - r / 2;
  const nearestR = Math.round(r);
  const nearestQ = Math.round(q);
  return (
    Math.hypot(
      point.x - spacing * (nearestQ + nearestR / 2),
      point.y - (spacing * Math.sqrt(3) * nearestR) / 2,
    ) <= tolerance
  );
}

/**
 * The viewing frame the solid's projection is taken in. The basis is orthonormal and
 * right-handed, `view` is the solid's stated symmetry axis, and `right` is chosen so the
 * outermost projected point lands on +x — the same anchoring the Flower's first-ring
 * centre at angle zero uses.
 */
export function projectionFrame(id: PlatonicSolidId, radius = 1): ProjectionFrame {
  requirePositive(radius, "radius");
  const axis = PROJECTION_AXES[id];
  const view = normalise(axis.axis);
  const u = normalise(anyPerpendicular(view));
  const w = cross(view, u);

  const vertices = platonicVertices(id, 1);
  const flat = vertices.map((vertex) => ({ x: dot(vertex, u), y: dot(vertex, w) }));
  const outer = Math.max(...flat.map((point) => Math.hypot(point.x, point.y)));
  if (outer < EPSILON) throw new RangeError("projection collapsed to a single point");

  const tolerance = 1e-6;
  // Rotate the frame so the outermost point sits on +x, instead of at an arbitrary angle.
  const anchor = flat
    .filter((point) => outer - Math.hypot(point.x, point.y) <= tolerance)
    .map((point) => Math.atan2(point.y, point.x))
    .sort((a, b) => a - b)[0];

  return {
    id,
    axis,
    right: addVector(scaleVector(u, Math.cos(anchor)), scaleVector(w, Math.sin(anchor))),
    up: addVector(scaleVector(u, -Math.sin(anchor)), scaleVector(w, Math.cos(anchor))),
    view,
    scale: radius / outer,
    radius,
  };
}

/**
 * The orthographic shadow of a solid viewed along its symmetry axis, scaled so the outer
 * points sit at `radius` and rotated so one outer point lies on the positive x axis. That
 * is what makes the shadow comparable with a Flower of Life drawn at the same spacing.
 *
 * A projection is a view, not a fold: vertices in line with the axis merge, and depth is
 * discarded, so the point and segment counts can be lower than the solid's V and E.
 */
export function platonicProjection(
  id: PlatonicSolidId,
  radius: number,
  latticeSpacing = radius,
): SolidProjection {
  requirePositive(radius, "radius");
  requirePositive(latticeSpacing, "latticeSpacing");
  const frame = projectionFrame(id, radius);
  const vertices = platonicVertices(id, 1);
  const edges = platonicEdges(id);

  const flat = vertices.map((vertex) => ({
    x: frame.scale * dot(vertex, frame.right),
    y: frame.scale * dot(vertex, frame.up),
  }));
  const tolerance = radius * 1e-6;
  const clusters = clusterPlanarPoints(flat, tolerance);

  const placed = clusters.map((cluster) => {
    const distance = Math.hypot(cluster.point.x, cluster.point.y);
    const flattened = distance < radius * EPSILON;
    return {
      x: flattened ? 0 : cluster.point.x,
      y: flattened ? 0 : cluster.point.y,
      sources: cluster.sources,
      radius: flattened ? 0 : distance,
    };
  });

  const points: ProjectedPoint[] = placed.map((point) => ({
    x: point.x,
    y: point.y,
    sourceVertices: point.sources,
    radius: point.radius,
    onLattice: isFlowerLatticePoint(point, latticeSpacing, latticeSpacing * 1e-6),
  }));

  const clusterOf = new Map<number, number>();
  placed.forEach((point, index) => {
    for (const source of point.sources) clusterOf.set(source, index);
  });

  const merged = new Map<string, { from: number; to: number; sourceEdges: number[] }>();
  edges.forEach(([a, b], edgeIndex) => {
    const from = clusterOf.get(a)!;
    const to = clusterOf.get(b)!;
    if (from === to) return; // an edge parallel to the axis projects to a point
    const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
    const existing = merged.get(key);
    if (existing) {
      existing.sourceEdges.push(edgeIndex);
      return;
    }
    merged.set(key, { from: Math.min(from, to), to: Math.max(from, to), sourceEdges: [edgeIndex] });
  });

  const segments: ProjectedSegment[] = [...merged.values()]
    .sort((a, b) => a.from - b.from || a.to - b.to)
    .map((segment) => ({
      from: segment.from,
      to: segment.to,
      sourceEdges: segment.sourceEdges,
      length: Math.hypot(
        points[segment.from].x - points[segment.to].x,
        points[segment.from].y - points[segment.to].y,
      ),
    }));

  const lengths = segments.map((segment) => segment.length);
  return {
    id,
    axis: frame.axis,
    points,
    segments,
    originalVertexCount: vertices.length,
    originalEdgeCount: edges.length,
    mergedVertexCount: vertices.length - points.length,
    latticeAlignedCount: points.filter((point) => point.onLattice).length,
    radius,
    latticeSpacing,
    equalSegments: Math.max(...lengths) - Math.min(...lengths) < radius * 1e-6,
  };
}

/** Any unit vector perpendicular to `normal`, chosen deterministically. */
function anyPerpendicular(normal: SacredVector3): SacredVector3 {
  const seed = Math.abs(normal.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  return cross(normal, seed);
}

/**
 * The solid part-way through being flattened into its own projection, with `t` running
 * from 0 (the rigid solid, turned so its symmetry axis points straight at the viewer) to
 * 1 (the flat projection, depth removed).
 *
 * Only depth moves. Every vertex keeps the x/y it will land on for the whole collapse, so
 * the figure never slides across the plane and the end state is the projection itself
 * rather than something that merely resembles it. Vertices that share a projected point
 * are exactly the ones in line with the viewing axis; they meet as their depth vanishes,
 * which is the merge the projection reports.
 */
export function solidCollapse(
  id: PlatonicSolidId,
  t: number,
  radius: number,
  latticeSpacing = radius,
): SolidCollapse {
  requireUnitInterval(t, "t");
  requirePositive(radius, "radius");
  requirePositive(latticeSpacing, "latticeSpacing");

  const frame = projectionFrame(id, radius);
  const projection = platonicProjection(id, radius, latticeSpacing);
  const raw = platonicVertices(id, 1);

  const pointOf = new Map<number, number>();
  projection.points.forEach((point, index) => {
    for (const source of point.sourceVertices) pointOf.set(source, index);
  });

  const vertices: CollapseVertex[] = raw.map((vertex, index) => {
    const point = pointOf.get(index)!;
    const depth = frame.scale * dot(vertex, frame.view);
    const flattened = depth * (1 - t);
    return {
      x: projection.points[point].x,
      y: projection.points[point].y,
      // Adding zero keeps a fully flattened negative depth as 0 rather than -0.
      z: flattened + 0,
      point,
      depth,
    };
  });

  const depths = vertices.map((vertex) => vertex.z);
  return {
    id,
    axis: frame.axis,
    t,
    frame,
    projection,
    vertices,
    edges: platonicEdges(id),
    edgeLength: frame.scale,
    axisVertices: vertices
      .map((vertex, index) => ({ vertex, index }))
      .filter(({ vertex }) => projection.points[vertex.point].radius < radius * 1e-9)
      .map(({ index }) => index),
    depthSpan: Math.max(...depths) - Math.min(...depths),
  };
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}


const RAW_VERTICES: Record<PlatonicSolidId, () => SacredVector3[]> = {
  tetrahedron: () => [
    { x: 1, y: 1, z: 1 },
    { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
  ],
  cube: () => signCombinations([1, 1, 1]),
  octahedron: () => [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ],
  dodecahedron: () => [...signCombinations([1, 1, 1]), ...cyclicPermutations(0, 1 / PHI, PHI)],
  icosahedron: () => cyclicPermutations(0, 1, PHI),
};

/** Row/column cells of the triangular lattice used by each triangle-faced solid. */
const TRIANGLE_PLAN: Partial<Record<PlatonicSolidId, readonly (readonly [number, number])[]>> = {
  tetrahedron: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  octahedron: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ],
  icosahedron: Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 5 }, (_, index) => [row, row + index] as const),
  ).flat(),
};

interface Placement {
  readonly centre: SacredPoint;
  readonly rotation: number;
}

/**
 * One cell of the triangular lattice. Cells alternate between point-up and point-down
 * along a row, exactly as the Flower of Life's circle centres divide the plane.
 */
function triangleCell(row: number, column: number, edgeLength: number): Placement {
  const height = (edgeLength * Math.sqrt(3)) / 2;
  const pointsUp = (((row + column) % 2) + 2) % 2 === 0;
  return {
    centre: {
      x: ((column + 1) * edgeLength) / 2,
      y: row * height + (pointsUp ? height / 3 : (2 * height) / 3),
    },
    rotation: pointsUp ? Math.PI / 2 : -Math.PI / 2,
  };
}

/** Six squares in a cross, the arrangement most cube nets use. */
function squarePlan(edgeLength: number): Placement[] {
  const centres: SacredPoint[] = [
    { x: 0, y: 1.5 * edgeLength },
    { x: 0, y: 0.5 * edgeLength },
    { x: 0, y: -0.5 * edgeLength },
    { x: 0, y: -1.5 * edgeLength },
    { x: -edgeLength, y: 0.5 * edgeLength },
    { x: edgeLength, y: 0.5 * edgeLength },
  ];
  return centres.map((centre) => ({ centre, rotation: Math.PI / 4 }));
}

/** Twelve pentagons as two rosettes: a central pentagon ringed by five more, twice. */
function pentagonPlan(edgeLength: number): Placement[] {
  const apothem = edgeLength / (2 * Math.tan(Math.PI / 5));
  const circumradius = polygonCircumradius(5, edgeLength);
  const rosetteRadius = 2 * apothem + circumradius;
  const gap = edgeLength * 0.3;

  const rosette = (offsetX: number, flip: number): Placement[] => {
    const base = Math.PI / 2 + flip;
    const centre = { x: offsetX, y: 0 };
    const placements: Placement[] = [{ centre, rotation: base }];
    for (let k = 0; k < 5; k++) {
      const direction = base + Math.PI / 5 + (k * Math.PI * 2) / 5;
      placements.push({
        centre: {
          x: centre.x + 2 * apothem * Math.cos(direction),
          y: centre.y + 2 * apothem * Math.sin(direction),
        },
        rotation: direction,
      });
    }
    return placements;
  };

  const offset = rosetteRadius + gap / 2;
  return [...rosette(-offset, 0), ...rosette(offset, Math.PI / 5)];
}

/** Shift a plan so its bounding box is centred on the origin. */
function centrePlan(faces: FlatFace[]): FlatFace[] {
  const points = faces.flatMap((face) => face.vertices);
  const midX = (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2;
  const midY = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
  return faces.map((face) => ({
    rotation: face.rotation,
    centre: { x: face.centre.x - midX, y: face.centre.y - midY },
    vertices: face.vertices.map((vertex) => ({ x: vertex.x - midX, y: vertex.y - midY })),
  }));
}

function signCombinations([x, y, z]: [number, number, number]): SacredVector3[] {
  const vertices: SacredVector3[] = [];
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      for (const sz of [1, -1]) vertices.push({ x: sx * x, y: sy * y, z: sz * z });
    }
  }
  return vertices;
}

/** The twelve points made by cycling (0, ±b, ±c) through the three coordinate slots. */
function cyclicPermutations(a: number, b: number, c: number): SacredVector3[] {
  const vertices: SacredVector3[] = [];
  for (const sb of [1, -1]) {
    for (const sc of [1, -1]) {
      vertices.push({ x: a, y: sb * b, z: sc * c });
      vertices.push({ x: sb * b, y: sc * c, z: a });
      vertices.push({ x: sc * c, y: a, z: sb * b });
    }
  }
  return vertices;
}

function faceAngle(point: SacredVector3, centroid: SacredVector3, u: SacredVector3, w: SacredVector3): number {
  const offset = subtract(point, centroid);
  return Math.atan2(dot(offset, w), dot(offset, u));
}

function shortestDistance(points: readonly SacredVector3[]): number {
  let shortest = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      shortest = Math.min(shortest, length(subtract(points[i], points[j])));
    }
  }
  return shortest;
}

function subtract(a: SacredVector3, b: SacredVector3): SacredVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scaleVector(a: SacredVector3, factor: number): SacredVector3 {
  return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

function addVector(a: SacredVector3, b: SacredVector3): SacredVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function dot(a: SacredVector3, b: SacredVector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: SacredVector3, b: SacredVector3): SacredVector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function length(a: SacredVector3): number {
  return Math.sqrt(dot(a, a));
}

function normalise(a: SacredVector3): SacredVector3 {
  const size = length(a);
  if (size < EPSILON) throw new RangeError("cannot normalise a zero-length vector");
  return scaleVector(a, 1 / size);
}

function averageVector(points: readonly SacredVector3[]): SacredVector3 {
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + point.z }),
    { x: 0, y: 0, z: 0 },
  );
  return scaleVector(total, 1 / points.length);
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

function requireInteger(value: number, minimum: number, name: string): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be an integer of at least ${minimum}`);
  }
}

function requireUnitInterval(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number between 0 and 1`);
  }
}
