/** Simple physics helpers used by Kinematics, Projectile Motion and Collisions lessons. */

export interface KinematicsState {
  t: number;
  x: number;
  v: number;
  a: number;
}

/** Constant-acceleration kinematics: x(t) and v(t). */
export function kinematics(
  x0: number,
  v0: number,
  a: number,
  t: number,
): KinematicsState {
  return {
    t,
    x: x0 + v0 * t + 0.5 * a * t * t,
    v: v0 + a * t,
    a,
  };
}

/** Time to reach a target displacement under constant acceleration. */
export function timeToDisplacement(
  x0: number,
  v0: number,
  a: number,
  target: number,
): number | null {
  const dx = target - x0;
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(v0) < 1e-12) return null;
    return dx / v0;
  }
  const disc = v0 * v0 + 2 * a * dx;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = (-v0 + s) / a;
  const t2 = (-v0 - s) / a;
  const candidates = [t1, t2].filter((t) => t >= 0);
  return candidates.length ? Math.min(...candidates) : null;
}

export interface ProjectileParams {
  speed: number;
  angleDeg: number;
  gravity: number;
  launchHeight: number;
}

export interface ProjectileResult {
  vx: number;
  vy: number;
  flightTime: number;
  range: number;
  maxHeight: number;
}

/** Solve projectile motion from flat-ground launch. */
export function solveProjectile(p: ProjectileParams): ProjectileResult {
  const theta = (p.angleDeg * Math.PI) / 180;
  const vx = p.speed * Math.cos(theta);
  const vy = p.speed * Math.sin(theta);
  const g = Math.abs(p.gravity);
  const h0 = p.launchHeight;

  // Solve 0 = h0 + vy*t - 0.5*g*t^2 for t >= 0.
  const disc = vy * vy + 2 * g * h0;
  const flightTime = disc >= 0 ? (vy + Math.sqrt(disc)) / g : 0;
  const range = vx * flightTime;
  const maxHeight = h0 + (vy * vy) / (2 * g);

  return { vx, vy, flightTime, range, maxHeight };
}

/** Sample a projectile trajectory at N points. */
export function sampleTrajectory(
  p: ProjectileParams,
  n: number,
): { t: number; x: number; y: number; vx: number; vy: number }[] {
  const theta = (p.angleDeg * Math.PI) / 180;
  const vx = p.speed * Math.cos(theta);
  const vy = p.speed * Math.sin(theta);
  const g = Math.abs(p.gravity);
  const { flightTime } = solveProjectile(p);
  const pts: { t: number; x: number; y: number; vx: number; vy: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (flightTime * i) / n;
    pts.push({
      t,
      x: vx * t,
      y: p.launchHeight + vy * t - 0.5 * g * t * t,
      vx,
      vy: vy - g * t,
    });
  }
  return pts;
}

/** Simple RK4 integrator for a second-order ODE (used by driven pendulum etc). */
export type Ode2State = { x: number; v: number };
export type Ode2Accel = (state: Ode2State, t: number) => number;

export function rk4Step(
  state: Ode2State,
  t: number,
  dt: number,
  accel: Ode2Accel,
): Ode2State {
  const k1v = accel(state, t);
  const k1x = state.v;

  const s2: Ode2State = { x: state.x + 0.5 * dt * k1x, v: state.v + 0.5 * dt * k1v };
  const k2v = accel(s2, t + 0.5 * dt);
  const k2x = s2.v;

  const s3: Ode2State = { x: state.x + 0.5 * dt * k2x, v: state.v + 0.5 * dt * k2v };
  const k3v = accel(s3, t + 0.5 * dt);
  const k3x = s3.v;

  const s4: Ode2State = { x: state.x + dt * k3x, v: state.v + dt * k3v };
  const k4v = accel(s4, t + dt);
  const k4x = s4.v;

  return {
    x: state.x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    v: state.v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v),
  };
}

/** Resolve a 1D elastic/inelastic collision between two particles. */
export function collide1D(
  m1: number,
  v1: number,
  m2: number,
  v2: number,
  restitution: number,
): [number, number] {
  const vRel = v1 - v2;
  const impulse = ((1 + restitution) * vRel) / (1 / m1 + 1 / m2);
  return [v1 - impulse / m1, v2 + impulse / m2];
}

export interface AtwoodMachineResult {
  /** Acceleration when mass B is defined as positive downward. */
  acceleration: number;
  /** Uniform tension in an ideal massless rope. */
  tension: number;
}

/** Solve an ideal Atwood machine with a massless rope and frictionless pulley. */
export function solveAtwoodMachine(
  massA: number,
  massB: number,
  gravity: number,
): AtwoodMachineResult {
  if (!Number.isFinite(massA) || !Number.isFinite(massB) || massA <= 0 || massB <= 0) {
    throw new RangeError("Atwood masses must be finite and positive.");
  }
  if (!Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("Gravity must be finite and positive.");
  }

  const totalMass = massA + massB;
  return {
    acceleration: ((massB - massA) * gravity) / totalMass,
    tension: (2 * massA * massB * gravity) / totalMass,
  };
}
