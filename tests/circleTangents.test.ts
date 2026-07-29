import { describe, expect, it } from "vitest";
import {
  classifyCirclePair,
  commonTangents,
  distance,
  lineDistance,
  type Circle,
} from "../src/math/circleTangents";

const A: Circle = { centre: { x: -3, y: 0 }, radius: 2 };
const B: Circle = { centre: { x: 4, y: 1 }, radius: 1 };

/** Every returned line must sit exactly one radius away from each centre. */
function expectTangency(circles: [Circle, Circle]): void {
  const [a, b] = circles;
  const result = commonTangents(a, b);
  for (const t of [...result.external, ...result.internal]) {
    expect(Math.hypot(t.normal.x, t.normal.y)).toBeCloseTo(1, 12);
    expect(lineDistance(t, a.centre)).toBeCloseTo(a.radius, 9);
    expect(lineDistance(t, b.centre)).toBeCloseTo(b.radius, 9);
    // Touch points lie on their own circle and on the line.
    expect(distance(t.touchA, a.centre)).toBeCloseTo(a.radius, 9);
    expect(distance(t.touchB, b.centre)).toBeCloseTo(b.radius, 9);
    expect(lineDistance(t, t.touchA)).toBeCloseTo(0, 9);
    expect(lineDistance(t, t.touchB)).toBeCloseTo(0, 9);
  }
}

describe("common tangents", () => {
  it("finds four tangents for separate circles", () => {
    const r = commonTangents(A, B);
    expect(r.relationship).toBe("separate");
    expect(r.external).toHaveLength(2);
    expect(r.internal).toHaveLength(2);
  });

  it("keeps every tangent exactly one radius from each centre", () => {
    expectTangency([A, B]);
    expectTangency([{ centre: { x: 0, y: 0 }, radius: 3 }, { centre: { x: 0, y: 9 }, radius: 1.5 }]);
    expectTangency([{ centre: { x: 1, y: -2 }, radius: 2.5 }, { centre: { x: -6, y: 4 }, radius: 2.5 }]);
  });

  it("matches the closed-form tangent lengths", () => {
    const r = commonTangents(A, B);
    const d = distance(A.centre, B.centre);
    expect(r.distance).toBeCloseTo(d, 12);
    expect(r.externalLength).toBeCloseTo(Math.sqrt(d * d - (A.radius - B.radius) ** 2), 9);
    expect(r.internalLength).toBeCloseTo(Math.sqrt(d * d - (A.radius + B.radius) ** 2), 9);
    for (const t of r.external) expect(t.length).toBeCloseTo(r.externalLength!, 9);
    for (const t of r.internal) expect(t.length).toBeCloseTo(r.internalLength!, 9);
  });

  it("gives parallel external tangents for equal radii", () => {
    const r = commonTangents({ centre: { x: -4, y: 0 }, radius: 2 }, { centre: { x: 4, y: 0 }, radius: 2 });
    expect(r.external).toHaveLength(2);
    // Both external tangents are horizontal lines y = ±2.
    for (const t of r.external) {
      expect(Math.abs(t.normal.x)).toBeCloseTo(0, 9);
      expect(Math.abs(t.offset)).toBeCloseTo(2, 9);
    }
    expect(r.externalLength).toBeCloseTo(8, 9);
  });

  it("collapses to three tangents when the circles touch externally", () => {
    const r = commonTangents({ centre: { x: 0, y: 0 }, radius: 2 }, { centre: { x: 5, y: 0 }, radius: 3 });
    expect(r.relationship).toBe("externally-tangent");
    expect(r.external).toHaveLength(2);
    expect(r.internal).toHaveLength(1);
    expect(r.internalLength).toBeCloseTo(0, 9);
    expect(r.internal[0].touchA.x).toBeCloseTo(2, 9);
    expect(r.internal[0].touchA.y).toBeCloseTo(0, 9);
  });

  it("drops the internal tangents once the circles overlap", () => {
    const r = commonTangents({ centre: { x: 0, y: 0 }, radius: 3 }, { centre: { x: 2, y: 0 }, radius: 2 });
    expect(r.relationship).toBe("intersecting");
    expect(r.external).toHaveLength(2);
    expect(r.internal).toHaveLength(0);
    expect(r.internalLength).toBeUndefined();
  });

  it("leaves a single tangent when one circle touches the other from inside", () => {
    const r = commonTangents({ centre: { x: 0, y: 0 }, radius: 4 }, { centre: { x: 3, y: 0 }, radius: 1 });
    expect(r.relationship).toBe("internally-tangent");
    expect(r.external).toHaveLength(1);
    expect(r.internal).toHaveLength(0);
    expect(r.externalLength).toBeCloseTo(0, 9);
  });

  it("finds no tangent when one circle is fully inside the other", () => {
    const r = commonTangents({ centre: { x: 0, y: 0 }, radius: 5 }, { centre: { x: 1, y: 0.5 }, radius: 1 });
    expect(r.relationship).toBe("contained");
    expect(r.external).toHaveLength(0);
    expect(r.internal).toHaveLength(0);
  });

  it("reports no tangents for concentric circles", () => {
    const r = commonTangents({ centre: { x: 2, y: 2 }, radius: 3 }, { centre: { x: 2, y: 2 }, radius: 1 });
    expect(r.external).toHaveLength(0);
    expect(r.internal).toHaveLength(0);
    expect(classifyCirclePair({ centre: { x: 2, y: 2 }, radius: 3 }, { centre: { x: 2, y: 2 }, radius: 3 })).toBe(
      "identical",
    );
  });

  it("separates external tangents from internal ones by whether they cross the centre line", () => {
    const r = commonTangents(A, B);
    const mid = { x: (A.centre.x + B.centre.x) / 2, y: (A.centre.y + B.centre.y) / 2 };
    // An internal tangent passes between the circles, so it separates the two centres.
    for (const t of r.internal) {
      const sa = t.normal.x * A.centre.x + t.normal.y * A.centre.y - t.offset;
      const sb = t.normal.x * B.centre.x + t.normal.y * B.centre.y - t.offset;
      expect(sa * sb).toBeLessThan(0);
      expect(lineDistance(t, mid)).toBeLessThan(distance(A.centre, B.centre) / 2);
    }
    for (const t of r.external) {
      const sa = t.normal.x * A.centre.x + t.normal.y * A.centre.y - t.offset;
      const sb = t.normal.x * B.centre.x + t.normal.y * B.centre.y - t.offset;
      expect(sa * sb).toBeGreaterThan(0);
    }
  });
});
