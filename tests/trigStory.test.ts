import { describe, expect, it } from "vitest";
import {
  STORY_STEPS,
  baseTriangle,
  clampPhi,
  cosZoom,
  sinZoom,
  smoothstep,
  swing,
  tangentLengths,
  values,
  zoomAt,
} from "../src/math/trigStory";

describe("trigStory", () => {
  it("gives sin and cos at 30°", () => {
    const v = values(30);
    expect(v.sin).toBeCloseTo(0.5, 10);
    expect(v.cos).toBeCloseTo(0.866, 3);
  });

  it("zooms by 1/cos onto the side tangent", () => {
    const z = cosZoom(30);
    expect(z.T.x).toBeCloseTo(1, 4);
    expect(z.T.y).toBeCloseTo(0.5774, 4);
    expect(Math.hypot(z.T.x, z.T.y)).toBeCloseTo(1.1547, 4);
  });

  it("zooms by 1/sin onto the top tangent", () => {
    const z = sinZoom(30);
    expect(z.C.x).toBeCloseTo(1.7321, 4);
    expect(z.C.y).toBeCloseTo(1, 4);
    expect(Math.hypot(z.C.x, z.C.y)).toBeCloseTo(2, 4);
  });

  it("swings C and T onto the axes", () => {
    const s = swing(sinZoom(30).C, 60);
    const q = swing(cosZoom(30).T, -30);
    expect(s.x).toBeCloseTo(0, 4);
    expect(s.y).toBeCloseTo(2, 4);
    expect(q.x).toBeCloseTo(1.1547, 4);
    expect(q.y).toBeCloseTo(0, 4);
  });

  it("measures the tangent segments at P", () => {
    const lens = tangentLengths(30);
    expect(lens.PQ).toBeCloseTo(0.5774, 4);
    expect(lens.SP).toBeCloseTo(1.7321, 4);
  });

  it("interpolates a zoom from the base triangle to the target", () => {
    const base = baseTriangle(30);
    const start = zoomAt(30, 2, 0);
    const end = zoomAt(30, 2, 1);
    expect(start.O).toEqual(base.O);
    expect(start.H.x).toBeCloseTo(base.H.x, 8);
    expect(start.H.y).toBeCloseTo(base.H.y, 8);
    expect(start.P.x).toBeCloseTo(base.P.x, 8);
    expect(start.P.y).toBeCloseTo(base.P.y, 8);
    expect(end.H.x).toBeCloseTo(base.H.x * 2, 8);
    expect(end.P.x).toBeCloseTo(base.P.x * 2, 8);
    expect(end.P.y).toBeCloseTo(base.P.y * 2, 8);
    expect(Math.hypot(end.P.x, end.P.y)).toBeCloseTo(2, 8);
  });

  it("clamps φ to [15, 75]", () => {
    expect(clampPhi(0)).toBe(15);
    expect(clampPhi(14.9)).toBe(15);
    expect(clampPhi(15)).toBe(15);
    expect(clampPhi(30)).toBe(30);
    expect(clampPhi(75)).toBe(75);
    expect(clampPhi(90)).toBe(75);
    expect(clampPhi(Number.NaN)).toBe(15);
    expect(values(0).phi).toBe(15);
    expect(values(90).phi).toBe(75);
  });

  it("lists ten story steps with id, title and hasBeat", () => {
    expect(STORY_STEPS).toHaveLength(10);
    for (const step of STORY_STEPS) {
      expect(step.id.length).toBeGreaterThan(0);
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.hasBeat).toBe("boolean");
    }
    expect(STORY_STEPS.map((step) => step.id)).toEqual([
      "circle",
      "sin",
      "cos",
      "zoom",
      "tan",
      "sec",
      "cosec",
      "cot",
      "famous",
      "all",
    ]);
  });

  it("eases with smoothstep", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 8);
    expect(smoothstep(-0.2)).toBe(0);
    expect(smoothstep(1.4)).toBe(1);
  });
});
