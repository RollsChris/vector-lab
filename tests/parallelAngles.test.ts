import { describe, expect, it } from "vitest";
import {
  allAngleIds,
  areParallel,
  computeParallelAngles,
  DEFAULT_ANGLE_TOL,
  evaluateTheorem,
  implicationFor,
  lineAngleBetween,
  minCrossingSeparation,
  rotateInput,
  separateFromLine,
  theoremPairs,
  translateInput,
  type ParallelLinesInput,
  type TheoremKind,
} from "../src/math/parallelAngles";

/** Classic: two horizontal parallels cut by a transversal at 60°. */
const PARALLEL: ParallelLinesInput = {
  line1Angle: 0,
  line2Angle: 0,
  transversalAngle: Math.PI / 3,
  line1Offset: 2,
  line2Offset: -2,
};

/** Same setup with line 2 tilted ~18°. */
const SKEW: ParallelLinesInput = {
  ...PARALLEL,
  line2Angle: 0.32,
};

const DEG = Math.PI / 180;

function expectFiniteAngles(input: ParallelLinesInput): void {
  const r = computeParallelAngles(input);
  expect(r.valid).toBe(true);
  for (const id of allAngleIds()) {
    expect(Number.isFinite(r.angles[id]), id).toBe(true);
    expect(r.angles[id]).toBeGreaterThan(0);
    expect(r.angles[id]).toBeLessThan(Math.PI + 1e-9);
  }
}

describe("parallel angle geometry", () => {
  it("detects parallel and non-parallel lines within tolerance", () => {
    expect(areParallel(0, 0)).toBe(true);
    expect(areParallel(0, Math.PI)).toBe(true); // undirected
    expect(areParallel(0, 0.5 * DEG, 1 * DEG)).toBe(true);
    expect(areParallel(0, 5 * DEG, 1 * DEG)).toBe(false);
    expect(lineAngleBetween(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 12);
    expect(lineAngleBetween(0.1, 0.1 + Math.PI)).toBeCloseTo(0, 12);
  });

  it("keeps parallel and corresponding relation consistent near the shared tolerance", () => {
    // Just inside the band: parallel and the angle relation both hold.
    const inside = computeParallelAngles({
      ...PARALLEL,
      line2Angle: DEFAULT_ANGLE_TOL * 0.8,
    });
    expect(inside.parallel).toBe(true);
    const insideEv = evaluateTheorem(inside, "corresponding");
    expect(insideEv.relationHolds).toBe(true);
    expect(insideEv.theoremHolds).toBe(true);

    // Just outside: neither claims parallel nor equal corresponding angles.
    const outside = computeParallelAngles({
      ...PARALLEL,
      line2Angle: DEFAULT_ANGLE_TOL * 1.2,
    });
    expect(outside.parallel).toBe(false);
    const outsideEv = evaluateTheorem(outside, "corresponding");
    expect(outsideEv.relationHolds).toBe(false);
    expect(outsideEv.theoremHolds).toBe(true);
  });

  it("computes eight finite angles and two intersections for a parallel figure", () => {
    const r = computeParallelAngles(PARALLEL);
    expect(r.valid).toBe(true);
    expect(r.parallel).toBe(true);
    expect(r.intersection1).not.toBeNull();
    expect(r.intersection2).not.toBeNull();
    expectFiniteAngles(PARALLEL);
    // Horizontal lines at y = ±2; transversal through origin at 60°.
    expect(r.intersection1!.y).toBeCloseTo(2, 9);
    expect(r.intersection2!.y).toBeCloseTo(-2, 9);
  });

  it("makes corresponding angles equal iff the lines are parallel", () => {
    const ok = evaluateTheorem(computeParallelAngles(PARALLEL), "corresponding");
    expect(ok.relationHolds).toBe(true);
    expect(ok.theoremHolds).toBe(true);
    expect(ok.parallel).toBe(true);

    const bad = evaluateTheorem(computeParallelAngles(SKEW), "corresponding");
    expect(bad.parallel).toBe(false);
    expect(bad.relationHolds).toBe(false);
    expect(bad.theoremHolds).toBe(true); // correctly reports the failure case
  });

  it("makes alternate interior angles equal iff the lines are parallel", () => {
    const ok = evaluateTheorem(computeParallelAngles(PARALLEL), "alternate-interior");
    expect(ok.relationHolds).toBe(true);
    expect(ok.pairs).toHaveLength(2);

    const bad = evaluateTheorem(computeParallelAngles(SKEW), "alternate-interior");
    expect(bad.relationHolds).toBe(false);
  });

  it("makes alternate exterior angles equal iff the lines are parallel", () => {
    expect(evaluateTheorem(computeParallelAngles(PARALLEL), "alternate-exterior").relationHolds).toBe(true);
    expect(evaluateTheorem(computeParallelAngles(SKEW), "alternate-exterior").relationHolds).toBe(false);
  });

  it("makes co-interior angles supplementary iff the lines are parallel", () => {
    const ok = evaluateTheorem(computeParallelAngles(PARALLEL), "co-interior");
    expect(ok.relationHolds).toBe(true);
    for (const p of ok.pairs) {
      expect(p.valueA + p.valueB).toBeCloseTo(Math.PI, 9);
    }
    expect(evaluateTheorem(computeParallelAngles(SKEW), "co-interior").relationHolds).toBe(false);
  });

  it("keeps vertically opposite angles equal whether or not the lines are parallel", () => {
    for (const input of [PARALLEL, SKEW]) {
      const ev = evaluateTheorem(computeParallelAngles(input), "vertically-opposite");
      expect(ev.relationHolds).toBe(true);
      expect(ev.theoremHolds).toBe(true);
    }
  });

  it("keeps adjacent straight-line angles supplementary whether or not the lines are parallel", () => {
    for (const input of [PARALLEL, SKEW]) {
      const ev = evaluateTheorem(computeParallelAngles(input), "adjacent");
      expect(ev.relationHolds).toBe(true);
      expect(ev.theoremHolds).toBe(true);
      for (const p of ev.pairs) {
        expect(p.valueA + p.valueB).toBeCloseTo(Math.PI, 9);
      }
    }
  });

  it("classifies converse readings for corresponding and alternate interior", () => {
    const support = evaluateTheorem(computeParallelAngles(PARALLEL), "converse-corresponding");
    expect(support.converseStatus).toBe("supports-parallel");
    expect(support.theoremHolds).toBe(true);

    // Unequal angles on a skew figure fail the converse hypothesis — not a counterexample.
    const skew = evaluateTheorem(computeParallelAngles(SKEW), "converse-corresponding");
    expect(skew.relationHolds).toBe(false);
    expect(skew.parallel).toBe(false);
    expect(skew.converseStatus).toBe("hypothesis-not-met");
    expect(skew.theoremHolds).toBe(true);
    expect(skew.message).toMatch(/hypothesis not met/i);

    const altSupport = evaluateTheorem(computeParallelAngles(PARALLEL), "converse-alternate-interior");
    expect(altSupport.converseStatus).toBe("supports-parallel");

    const altSkew = evaluateTheorem(computeParallelAngles(SKEW), "converse-alternate-interior");
    expect(altSkew.converseStatus).toBe("hypothesis-not-met");
    expect(altSkew.theoremHolds).toBe(true);

    // A true counterexample needs relationHolds && !parallel. With a shared
    // tolerance that band is empty under exact geometry — do not fabricate one.
    const forced = evaluateTheorem(
      {
        ...computeParallelAngles(SKEW),
        // Synthetic: keep skew parallel flag but force equal pair readings.
        parallel: false,
        angles: computeParallelAngles(PARALLEL).angles,
        anglesDeg: computeParallelAngles(PARALLEL).anglesDeg,
      },
      "converse-corresponding",
    );
    expect(forced.relationHolds).toBe(true);
    expect(forced.parallel).toBe(false);
    expect(forced.converseStatus).toBe("counterexample");
    expect(forced.theoremHolds).toBe(false);
  });

  it("swaps the given and conclusion between a theorem and its converse", () => {
    const figure = computeParallelAngles(PARALLEL);
    const theorem = implicationFor(evaluateTheorem(figure, "corresponding"));
    expect(theorem).toMatchObject({
      direction: "theorem",
      given: "L1 ∥ L2",
      hypothesisMet: true,
      conclusionState: "follows",
    });
    expect(theorem.conclusion).toMatch(/∠₁NW = ∠₂NW/);

    const supplementary = implicationFor(evaluateTheorem(figure, "co-interior"));
    expect(supplementary.conclusion).toMatch(/∠₁NW \+ ∠₂SW = 180°/);

    const converse = implicationFor(evaluateTheorem(figure, "converse-corresponding"));
    expect(converse).toMatchObject({
      direction: "converse",
      conclusion: "L1 ∥ L2",
      hypothesisMet: true,
      conclusionState: "follows",
    });
    expect(converse.given).toMatch(/∠₁NW = ∠₂NW/);

    const hypothesisNotMet = implicationFor(
      evaluateTheorem(computeParallelAngles(SKEW), "converse-corresponding"),
    );
    expect(hypothesisNotMet.conclusionState).toBe("no-claim");
  });

  it("is invariant under translation of the whole figure", () => {
    const base = computeParallelAngles(PARALLEL);
    const moved = computeParallelAngles(translateInput(PARALLEL, { x: 3.5, y: -1.25 }));
    expect(moved.valid).toBe(true);
    expect(moved.parallel).toBe(base.parallel);
    for (const id of allAngleIds()) {
      expect(moved.angles[id]).toBeCloseTo(base.angles[id], 9);
    }
  });

  it("is invariant under rotation of the whole figure", () => {
    const base = computeParallelAngles(PARALLEL);
    const rotated = computeParallelAngles(rotateInput(PARALLEL, 0.7));
    expect(rotated.valid).toBe(true);
    expect(rotated.parallel).toBe(true);
    for (const id of allAngleIds()) {
      expect(rotated.angles[id]).toBeCloseTo(base.angles[id], 9);
    }
    // Skew figure keeps its non-parallel corresponding failure after rotation.
    const skewR = evaluateTheorem(computeParallelAngles(rotateInput(SKEW, -1.1)), "corresponding");
    expect(skewR.parallel).toBe(false);
    expect(skewR.relationHolds).toBe(false);
  });

  it("handles a transversal flip without breaking alternate-interior pairing", () => {
    const flipped: ParallelLinesInput = { ...PARALLEL, transversalAngle: PARALLEL.transversalAngle + Math.PI };
    const a = evaluateTheorem(computeParallelAngles(PARALLEL), "alternate-interior");
    const b = evaluateTheorem(computeParallelAngles(flipped), "alternate-interior");
    expect(a.relationHolds).toBe(true);
    expect(b.relationHolds).toBe(true);
  });

  it("rejects a transversal nearly parallel to a line without NaNs", () => {
    const r = computeParallelAngles({
      line1Angle: 0,
      line2Angle: 0.2,
      transversalAngle: 1e-4,
      line1Offset: 2,
      line2Offset: -2,
    });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/parallel/i);
    for (const id of allAngleIds()) {
      expect(Number.isNaN(r.angles[id])).toBe(true);
    }
    const ev = evaluateTheorem(r, "corresponding");
    expect(ev.valid).toBe(false);
    expect(ev.pairs).toHaveLength(0);
  });

  it("rejects coincident intersections when both lines share the same offset", () => {
    const r = computeParallelAngles({
      line1Angle: 0.4,
      line2Angle: 1.1,
      transversalAngle: -0.6,
      line1Offset: 1,
      line2Offset: 1,
      transversalThrough: { x: 0, y: 0 },
    });
    // Same offset on different angles does not generally coincide; force equal lines through same point:
    const same = computeParallelAngles({
      line1Angle: 0.5,
      line2Angle: 0.5,
      transversalAngle: 1.2,
      line1Offset: 1,
      line2Offset: 1,
    });
    // Parallel identical lines: intersections still distinct along transversal unless... actually same line
    // means I1 and I2 are the same point on that one line.
    expect(same.valid).toBe(false);
    expect(same.reason).toMatch(/coincide|parallel to a line|no intersection/i);
    void r;
  });

  it("lists the expected pair counts per theorem", () => {
    const counts: Record<TheoremKind, number> = {
      corresponding: 4,
      "alternate-interior": 2,
      "alternate-exterior": 2,
      "co-interior": 2,
      "vertically-opposite": 4,
      adjacent: 8,
      "converse-corresponding": 4,
      "converse-alternate-interior": 2,
    };
    const figure = computeParallelAngles(PARALLEL);
    for (const [kind, n] of Object.entries(counts) as [TheoremKind, number][]) {
      expect(theoremPairs(kind, figure)).toHaveLength(n);
    }
  });

  it("keeps opposite corners vertically equal and adjacent corners supplementary at each crossing", () => {
    const r = computeParallelAngles(SKEW);
    expect(r.angles["L1-NW"]).toBeCloseTo(r.angles["L1-SE"], 9);
    expect(r.angles["L1-NE"]).toBeCloseTo(r.angles["L1-SW"], 9);
    expect(r.angles["L1-NW"] + r.angles["L1-NE"]).toBeCloseTo(Math.PI, 9);
    expect(r.angles["L2-NW"] + r.angles["L2-SW"]).toBeCloseTo(Math.PI, 9);
  });

  it("rejects intersections that leave the visible line segment without NaN leakage", () => {
    // Shallow transversal: crossings race past half-length 7.2.
    const shallow = computeParallelAngles({
      line1Angle: 0,
      line2Angle: 0,
      transversalAngle: 4 * DEG,
      line1Offset: 2,
      line2Offset: -2,
      visibleHalfLength: 7.2,
    });
    expect(shallow.valid).toBe(false);
    expect(shallow.reason).toMatch(/visible segment/i);
    expect(shallow.intersection1).not.toBeNull();
    expect(shallow.intersection2).not.toBeNull();
    // Angles stay NaN so callers cannot paint huge finite garbage.
    for (const id of allAngleIds()) {
      expect(Number.isNaN(shallow.angles[id])).toBe(true);
    }
    const ev = evaluateTheorem(shallow, "corresponding");
    expect(ev.valid).toBe(false);
    expect(ev.pairs).toHaveLength(0);

    // Steeper transversal with the same bound stays valid.
    const ok = computeParallelAngles({
      ...PARALLEL,
      visibleHalfLength: 7.2,
    });
    expect(ok.valid).toBe(true);
    expect(ok.intersection1).not.toBeNull();
    expect(Math.hypot(ok.intersection1!.x, ok.intersection1!.y)).toBeLessThanOrEqual(7.2 + 1e-9);
  });

  it("computes a min crossing separation that keeps intersections on-segment", () => {
    const half = 7.2;
    const offset = 2.15;
    const minSep = minCrossingSeparation(offset, half);
    expect(minSep).toBeGreaterThan(0);
    expect(Math.sin(minSep) * half).toBeCloseTo(offset, 9);

    // Below the separation the visible-bound check fails; at/above it passes.
    const tooShallow = computeParallelAngles({
      line1Angle: 0,
      line2Angle: 0,
      transversalAngle: minSep * 0.5,
      line1Offset: offset,
      line2Offset: -offset,
      visibleHalfLength: half,
    });
    expect(tooShallow.valid).toBe(false);

    const clear = computeParallelAngles({
      line1Angle: 0,
      line2Angle: 0,
      transversalAngle: minSep * 1.05,
      line1Offset: offset,
      line2Offset: -offset,
      visibleHalfLength: half,
    });
    expect(clear.valid).toBe(true);

    expect(lineAngleBetween(separateFromLine(0.01, 0, minSep), 0)).toBeGreaterThanOrEqual(minSep - 1e-9);
  });
});
