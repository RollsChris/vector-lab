import { describe, expect, it } from "vitest";
import {
  finalVelocityFromImpulse,
  forcePulseState,
  impulse,
  momentum,
  recoilVelocities,
} from "../src/math/momentum";

describe("momentum and impulse", () => {
  it("computes momentum and constant-force impulse", () => {
    expect(momentum(3, 4)).toBe(12);
    expect(impulse(6, 2)).toBe(12);
  });

  it("uses impulse as the change in momentum", () => {
    expect(finalVelocityFromImpulse(2, 3, 8)).toBe(7);
    expect(momentum(2, 7) - momentum(2, 3)).toBe(8);
  });

  it("integrates a finite force pulse then coasts", () => {
    const pulse = { mass: 2, initialVelocity: 1, force: 6, duration: 2 };
    const during = forcePulseState(pulse, 1);
    expect(during.acceleration).toBe(3);
    expect(during.velocity).toBe(4);
    expect(during.position).toBe(2.5);
    expect(during.impulse).toBe(6);

    const after = forcePulseState(pulse, 3);
    expect(after.force).toBe(0);
    expect(after.acceleration).toBe(0);
    expect(after.velocity).toBe(7);
    expect(after.position).toBe(15);
    expect(after.impulse).toBe(12);
  });

  it("gives an isolated pair equal and opposite momenta", () => {
    const [vA, vB] = recoilVelocities(2, 4, 8);
    expect(momentum(2, vA)).toBe(-8);
    expect(momentum(4, vB)).toBe(8);
    expect(momentum(2, vA) + momentum(4, vB)).toBe(0);
  });
});
