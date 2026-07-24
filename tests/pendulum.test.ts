import { describe, it, expect } from "vitest";
import {
  smallAnglePeriod,
  exactPeriod,
  periodSeriesFactor,
  energy,
  angularAcceleration,
  rk4Step,
  type PendulumState,
} from "../src/math/pendulum";

describe("smallAnglePeriod", () => {
  it("matches T = 2π√(L/g)", () => {
    // A 1 m pendulum on Earth swings with a period of ~2.006 s.
    expect(smallAnglePeriod(1, 9.81)).toBeCloseTo(2.0061, 3);
    // Period is independent of mass and scales with √L: 4× the length → 2× the period.
    expect(smallAnglePeriod(4, 9.81)).toBeCloseTo(2 * smallAnglePeriod(1, 9.81), 6);
    // Weaker gravity (Moon) → longer period.
    expect(smallAnglePeriod(1, 1.62)).toBeGreaterThan(smallAnglePeriod(1, 9.81));
  });
});

describe("exactPeriod", () => {
  it("reduces to the small-angle period for tiny amplitudes", () => {
    expect(exactPeriod(1, 9.81, 0.001)).toBeCloseTo(smallAnglePeriod(1, 9.81), 4);
  });

  it("is longer than the small-angle period at large amplitude", () => {
    const t0 = smallAnglePeriod(1, 9.81);
    expect(exactPeriod(1, 9.81, Math.PI / 2)).toBeGreaterThan(t0);
  });

  it("matches the known 90° elongation factor (≈1.1803)", () => {
    const ratio = exactPeriod(1, 9.81, Math.PI / 2) / smallAnglePeriod(1, 9.81);
    expect(ratio).toBeCloseTo(1.18034, 4);
  });

  it("agrees with the series expansion for moderate amplitudes", () => {
    const amp = 0.5; // ~29°, where the leading series terms are accurate
    const ratio = exactPeriod(1, 9.81, amp) / smallAnglePeriod(1, 9.81);
    expect(ratio).toBeCloseTo(periodSeriesFactor(amp), 3);
  });
});

describe("rk4Step energy conservation", () => {
  it("conserves total energy with no damping", () => {
    const L = 1.2;
    const g = 9.81;
    const m = 1;
    let s: PendulumState = { theta: 1.0, omega: 0 }; // released from ~57°
    const e0 = energy(s, L, g, m).total;
    const accel = (st: PendulumState) => angularAcceleration(st, L, g, 0, m);
    // Integrate ~3 seconds at a fine step.
    for (let i = 0; i < 3000; i++) s = rk4Step(s, 0.001, accel);
    const e1 = energy(s, L, g, m).total;
    expect(e1).toBeCloseTo(e0, 4);
  });

  it("loses energy when damping is positive", () => {
    const L = 1.2;
    const g = 9.81;
    const m = 1;
    let s: PendulumState = { theta: 1.0, omega: 0 };
    const e0 = energy(s, L, g, m).total;
    const accel = (st: PendulumState) => angularAcceleration(st, L, g, 0.3, m);
    for (let i = 0; i < 3000; i++) s = rk4Step(s, 0.001, accel);
    expect(energy(s, L, g, m).total).toBeLessThan(e0);
  });
});
