import { describe, expect, it } from "vitest";
import { GROW_STAGES, growFrame, growPlan, type GrowKind, type GrowPoint } from "../src/math/trigGrow";

const DEG = Math.PI / 180;
const dist = (a: GrowPoint, b: GrowPoint) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("trig grow animation", () => {
  const cases: Array<[GrowKind, number]> = [
    ["sec", 30], ["sec", 135], ["sec", 300],
    ["cosec", 30], ["cosec", 63], ["cosec", 135], ["cosec", 300],
  ];

  it.each(cases)("%s at %i° lands O, H, P exactly on the tangent triangle", (kind, deg) => {
    const plan = growPlan(kind, 2, deg * DEG)!;
    const end = growFrame(plan, 1);
    end.vertices.forEach((v, i) => {
      expect(v.x).toBeCloseTo(plan.target[i].x, 9);
      expect(v.y).toBeCloseTo(plan.target[i].y, 9);
      expect(v.z).toBeCloseTo(0, 9);
    });
  });

  it("uses cosec φ and sec φ as the zoom factor", () => {
    expect(growPlan("cosec", 2, 30 * DEG)!.scale).toBeCloseTo(2, 12);
    expect(growPlan("sec", 2, 60 * DEG)!.scale).toBeCloseTo(2, 12);
    expect(growPlan("cosec", 5, 300 * DEG)!.scale).toBeCloseTo(1 / Math.abs(Math.sin(300 * DEG)), 12);
  });

  it("worked example at 30°, R = 2: every grey side doubles", () => {
    const plan = growPlan("cosec", 2, 30 * DEG)!;
    const [S, P, O] = growFrame(plan, 1).vertices;
    expect(dist(S, O)).toBeCloseTo(4, 9); // old R = 2 → OS
    expect(dist(P, O)).toBeCloseTo(2, 9); // old y = 1 → the radius
    expect(dist(S, P)).toBeCloseTo(2 * Math.sqrt(3), 9); // old x → SP = R cot φ
  });

  it("zooms about O and keeps the shape rigid while placing", () => {
    const plan = growPlan("cosec", 3, 50 * DEG)!;
    const sides = (p: number) => {
      const [a, b, c] = growFrame(plan, p).vertices;
      return [dist(a, b), dist(b, c), dist(a, c)];
    };
    const zoomed = sides(GROW_STAGES.zoomEnd);
    for (const p of [0.7, 0.8, 0.9, 1]) {
      sides(p).forEach((len, i) => expect(len).toBeCloseTo(zoomed[i], 9));
    }
    expect(growFrame(plan, 0.1).k).toBe(1);
    expect(growFrame(plan, GROW_STAGES.zoomEnd).k).toBeCloseTo(plan.scale, 12);
  });

  it("mirrors because the tangent triangle has the opposite orientation", () => {
    expect(growPlan("sec", 1, 40 * DEG)!.reflects).toBe(true);
    expect(growPlan("cosec", 1, 40 * DEG)!.reflects).toBe(true);
  });

  it("has no plan at the axes where the intercept is at infinity", () => {
    expect(growPlan("cosec", 2, 0)).toBeNull();
    expect(growPlan("cosec", 2, 180 * DEG)).toBeNull();
    expect(growPlan("sec", 2, 90 * DEG)).toBeNull();
  });
});
