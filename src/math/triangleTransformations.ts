export interface Point {
  x: number;
  y: number;
}

export type Triangle = readonly [Point, Point, Point];
export type Transformation = "translation" | "rotation" | "reflection" | "enlargement";

export interface TriangleMetrics {
  sideLengths: readonly [number, number, number];
  area: number;
  signedArea: number;
  angles: readonly [number, number, number];
}

const EPS = 1e-9;

export const DEFAULT_TRANSFORM: Record<Transformation, string> = {
  translation: "translate by (3, 1.5)",
  rotation: "rotate 90° anticlockwise about O",
  reflection: "reflect in the mirror line y = 0",
  enlargement: "enlarge by scale factor 1.5 about O",
};

export function transformTriangle(
  triangle: Triangle,
  transformation: Transformation,
  progress = 1,
): Triangle {
  const p = clamp(progress, 0, 1);
  return [
    transformPoint(triangle[0], transformation, p),
    transformPoint(triangle[1], transformation, p),
    transformPoint(triangle[2], transformation, p),
  ];
}

export function transformPoint(point: Point, transformation: Transformation, progress = 1): Point {
  const p = clamp(progress, 0, 1);
  switch (transformation) {
    case "translation":
      return { x: point.x + 3 * p, y: point.y + 1.5 * p };
    case "rotation": {
      const angle = (Math.PI / 2) * p;
      return {
        x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
      };
    }
    case "reflection":
      // A fold through the horizontal mirror line: halfway through, the triangle is edge-on.
      return { x: point.x, y: point.y * Math.cos(Math.PI * p) };
    case "enlargement": {
      const scale = 1 + 0.5 * p;
      return { x: point.x * scale, y: point.y * scale };
    }
  }
}

export function triangleMetrics(triangle: Triangle): TriangleMetrics {
  const sideLengths = [
    distance(triangle[1], triangle[2]),
    distance(triangle[2], triangle[0]),
    distance(triangle[0], triangle[1]),
  ] as const;
  const signedArea =
    ((triangle[1].x - triangle[0].x) * (triangle[2].y - triangle[0].y) -
      (triangle[1].y - triangle[0].y) * (triangle[2].x - triangle[0].x)) /
    2;
  return {
    sideLengths,
    signedArea,
    area: Math.abs(signedArea),
    angles: [
      angle(triangle[0], triangle[1], triangle[2]),
      angle(triangle[1], triangle[2], triangle[0]),
      angle(triangle[2], triangle[0], triangle[1]),
    ],
  };
}

export function scaleFactor(transformation: Transformation): number {
  return transformation === "enlargement" ? 1.5 : 1;
}

export function orientationName(triangle: Triangle): "clockwise" | "anticlockwise" | "flat" {
  const area = triangleMetrics(triangle).signedArea;
  if (Math.abs(area) < EPS) return "flat";
  return area > 0 ? "anticlockwise" : "clockwise";
}

export function matchesTriangle(predicted: Triangle, expected: Triangle, tolerance = 0.35): boolean {
  return predicted.every((point, index) => distance(point, expected[index]) <= tolerance);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(vertex: Point, a: Point, b: Point): number {
  const u = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v = { x: b.x - vertex.x, y: b.y - vertex.y };
  const divisor = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
  if (divisor < EPS) return 0;
  return Math.acos(clamp((u.x * v.x + u.y * v.y) / divisor, -1, 1));
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}
