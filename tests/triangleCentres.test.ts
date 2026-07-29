import { describe, expect, it } from "vitest";
import {
  altitudeFoot,
  centroid,
  circumcentre,
  distance,
  incentre,
  isNonDegenerate,
  midpoint,
  ninePointCircle,
  ninePointPoints,
  orthocentre,
  triangleArea,
  triangleCentres,
  type Pt,
} from "../src/math/triangleCentres";

const scalene: [Pt, Pt, Pt] = [
  { x: -4, y: -2.4 },
  { x: 4.5, y: -1.4 },
  { x: -1, y: 3 },
];
const obtuse: [Pt, Pt, Pt] = [
  { x: -5.5, y: -1.5 },
  { x: 5, y: -2.5 },
  { x: 2.5, y: 1.5 },
];
const right: [Pt, Pt, Pt] = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 0, y: 3 },
];

describe("triangle centres", () => {
  it("puts every centre at the same place for an equilateral triangle", () => {
    const r = 3;
    const pts = [90, 210, 330].map((d) => ({
      x: r * Math.cos((d * Math.PI) / 180),
      y: r * Math.sin((d * Math.PI) / 180),
    })) as [Pt, Pt, Pt];
    const c = triangleCentres(...pts)!;
    for (const p of [c.G, c.O, c.I, c.H]) {
      expect(p.x).toBeCloseTo(0, 6);
      expect(p.y).toBeCloseTo(0, 6);
    }
    expect(c.R).toBeCloseTo(r, 6);
    expect(c.r).toBeCloseTo(r / 2, 6);
  });

  it("places the circumcentre equidistant from all three vertices", () => {
    for (const t of [scalene, obtuse, right]) {
      const O = circumcentre(...t)!;
      const d = distance(O, t[0]);
      expect(distance(O, t[1])).toBeCloseTo(d, 6);
      expect(distance(O, t[2])).toBeCloseTo(d, 6);
    }
  });

  it("puts the circumcentre at the hypotenuse midpoint of a right triangle", () => {
    const O = circumcentre(...right)!;
    const mid = midpoint(right[1], right[2]);
    expect(O.x).toBeCloseTo(mid.x, 6);
    expect(O.y).toBeCloseTo(mid.y, 6);
  });

  it("puts the orthocentre at the right-angled vertex of a right triangle", () => {
    const H = orthocentre(...right)!;
    expect(H.x).toBeCloseTo(0, 6);
    expect(H.y).toBeCloseTo(0, 6);
  });

  it("places the incentre equidistant from all three sides at distance r", () => {
    for (const t of [scalene, obtuse, right]) {
      const I = incentre(...t);
      const c = triangleCentres(...t)!;
      const [A, B, C] = t;
      for (const [p, q] of [[A, B], [B, C], [C, A]] as [Pt, Pt][]) {
        expect(distance(I, altitudeFoot(I, p, q))).toBeCloseTo(c.r, 6);
      }
    }
  });

  it("keeps O, G and H collinear with OG : GH = 1 : 2", () => {
    for (const t of [scalene, obtuse]) {
      const c = triangleCentres(...t)!;
      const cross =
        (c.G.x - c.O.x) * (c.H.y - c.O.y) - (c.G.y - c.O.y) * (c.H.x - c.O.x);
      expect(cross).toBeCloseTo(0, 6);
      expect(distance(c.H, c.G)).toBeCloseTo(2 * distance(c.O, c.G), 6);
    }
  });

  it("passes the nine-point circle through all nine points at radius R/2", () => {
    for (const t of [scalene, obtuse, right]) {
      const c = triangleCentres(...t)!;
      const np = c.ninePoint;
      expect(np.radius).toBeCloseTo(c.R / 2, 6);
      const all = ninePointPoints(np);
      expect(all).toHaveLength(9);
      for (const p of all) expect(distance(np.centre, p)).toBeCloseTo(np.radius, 6);
    }
  });

  it("centres the nine-point circle at the midpoint of OH", () => {
    const c = triangleCentres(...scalene)!;
    const mid = midpoint(c.O, c.H);
    expect(c.ninePoint.centre.x).toBeCloseTo(mid.x, 6);
    expect(c.ninePoint.centre.y).toBeCloseTo(mid.y, 6);
  });

  it("puts the centroid two thirds along each median", () => {
    const [A, B, C] = scalene;
    const G = centroid(A, B, C);
    const ma = midpoint(B, C);
    expect(distance(A, G)).toBeCloseTo(2 * distance(G, ma), 6);
  });

  it("drops altitude feet onto the opposite side line", () => {
    const foot = altitudeFoot({ x: 0, y: 5 }, { x: -3, y: 1 }, { x: 4, y: 1 });
    expect(foot.x).toBeCloseTo(0, 6);
    expect(foot.y).toBeCloseTo(1, 6);
  });

  it("lets the orthocentre and circumcentre escape an obtuse triangle", () => {
    const c = triangleCentres(...obtuse)!;
    const inside = (p: Pt) => {
      const [A, B, C] = obtuse;
      const s = (u: Pt, v: Pt) => (v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x);
      const signs = [s(A, B), s(B, C), s(C, A)];
      return signs.every((n) => n >= 0) || signs.every((n) => n <= 0);
    };
    expect(inside(c.G)).toBe(true);
    expect(inside(c.I)).toBe(true);
    expect(inside(c.H)).toBe(false);
    expect(inside(c.O)).toBe(false);
  });

  it("rejects collinear points", () => {
    const line: [Pt, Pt, Pt] = [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 5, y: 5 }];
    expect(isNonDegenerate(...line)).toBe(false);
    expect(circumcentre(...line)).toBeNull();
    expect(orthocentre(...line)).toBeNull();
    expect(ninePointCircle(...line)).toBeNull();
    expect(triangleCentres(...line)).toBeNull();
    expect(triangleArea(...line)).toBeCloseTo(0, 9);
  });
});
