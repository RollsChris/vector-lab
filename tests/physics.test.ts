import { describe, expect, it } from "vitest";
import { collide1D, kinematics, solveAtwoodMachine, solveProjectile, timeToDisplacement } from "../src/math/physics";

describe("kinematics", () => {
  it("computes constant-acceleration motion", () => {
    const s = kinematics(0, 0, 2, 3);
    expect(s.x).toBeCloseTo(9);
    expect(s.v).toBeCloseTo(6);
    expect(s.a).toBeCloseTo(2);
  });

  it("finds time to reach a target displacement", () => {
    expect(timeToDisplacement(0, 0, 2, 18)).toBeCloseTo(Math.sqrt(18));
    expect(timeToDisplacement(0, 5, 0, 10)).toBeCloseTo(2);
    expect(timeToDisplacement(0, 0, 0, 5)).toBeNull();
  });
});

describe("projectile motion", () => {
  it("solves flat-ground launch at 45°", () => {
    const p = solveProjectile({ speed: 10, angleDeg: 45, gravity: 9.8, launchHeight: 0 });
    expect(p.vx).toBeCloseTo(10 / Math.sqrt(2));
    expect(p.vy).toBeCloseTo(10 / Math.sqrt(2));
    expect(p.maxHeight).toBeCloseTo((10 / Math.sqrt(2)) ** 2 / (2 * 9.8));
    expect(p.range).toBeCloseTo((10 * 10) / 9.8);
  });

  it("includes launch height in flight time", () => {
    const ground = solveProjectile({ speed: 10, angleDeg: 45, gravity: 9.8, launchHeight: 0 });
    const elevated = solveProjectile({ speed: 10, angleDeg: 45, gravity: 9.8, launchHeight: 10 });
    expect(elevated.flightTime).toBeGreaterThan(ground.flightTime);
  });

  it("gives complementary angles the same flat-ground range", () => {
    const low = solveProjectile({ speed: 15, angleDeg: 30, gravity: 9.81, launchHeight: 0 });
    const high = solveProjectile({ speed: 15, angleDeg: 60, gravity: 9.81, launchHeight: 0 });
    expect(low.range).toBeCloseTo(high.range);
    expect(high.maxHeight).toBeGreaterThan(low.maxHeight);
    expect(high.flightTime).toBeGreaterThan(low.flightTime);
  });

  it("flies farther under weaker gravity", () => {
    const earth = solveProjectile({ speed: 15, angleDeg: 45, gravity: 9.81, launchHeight: 0 });
    const moon = solveProjectile({ speed: 15, angleDeg: 45, gravity: 1.62, launchHeight: 0 });
    expect(moon.flightTime).toBeGreaterThan(earth.flightTime);
    expect(moon.range).toBeGreaterThan(earth.range);
    expect(moon.maxHeight).toBeGreaterThan(earth.maxHeight);
  });
});

describe("collisions", () => {
  it("conserves momentum in an elastic collision", () => {
    const [v1, v2] = collide1D(1, 5, 1, 0, 1);
    expect(v1).toBeCloseTo(0);
    expect(v2).toBeCloseTo(5);
    expect(v1 + v2).toBeCloseTo(5);
  });

  it("conserves momentum in a perfectly inelastic collision", () => {
    const [v1, v2] = collide1D(2, 4, 2, 0, 0);
    expect(v1).toBeCloseTo(v2);
    expect(2 * v1 + 2 * v2).toBeCloseTo(8);
  });
});

describe("Atwood machine", () => {
  it("derives acceleration and tension from both hanging masses", () => {
    const result = solveAtwoodMachine(2, 4, 9.81);
    expect(result.acceleration).toBeCloseTo(3.27);
    expect(result.tension).toBeCloseTo(26.16);
  });

  it("balances equal masses and rejects non-physical inputs", () => {
    const balanced = solveAtwoodMachine(3, 3, 9.81);
    expect(balanced.acceleration).toBeCloseTo(0);
    expect(balanced.tension).toBeCloseTo(29.43);
    expect(() => solveAtwoodMachine(0, 2, 9.81)).toThrow(RangeError);
    expect(() => solveAtwoodMachine(2, 2, 0)).toThrow(RangeError);
  });
});
