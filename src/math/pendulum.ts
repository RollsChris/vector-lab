/**
 * Pure physics of a simple pendulum — kept separate from the 3D lesson so the
 * maths can be unit-tested in isolation (see tests/pendulum.test.ts).
 *
 * The "ideal" small-angle pendulum obeys a linear equation whose period
 * T₀ = 2π·√(L/g) is famously independent of both amplitude and mass. The *real*
 * pendulum obeys the nonlinear equation θ'' = −(g/L)·sinθ, whose period grows with
 * amplitude. We solve the real motion by RK4 and quantify the period with the
 * exact closed form built on the complete elliptic integral of the first kind.
 */

/** Angular state of the pendulum: angle from the downward vertical and its rate. */
export interface PendulumState {
  /** angle θ from the downward vertical (radians) */
  theta: number;
  /** angular velocity ω = dθ/dt (rad/s) */
  omega: number;
}

/** Small-angle (ideal) period T₀ = 2π·√(L/g). Independent of amplitude and mass. */
export function smallAnglePeriod(length: number, gravity: number): number {
  return 2 * Math.PI * Math.sqrt(length / gravity);
}

/** Small-angle angular frequency ω₀ = √(g/L). */
export function angularFrequency(length: number, gravity: number): number {
  return Math.sqrt(gravity / length);
}

/**
 * Complete elliptic integral of the first kind K(k), via the
 * arithmetic–geometric mean (fast, ~machine precision in a handful of iterations).
 */
export function ellipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 100; i++) {
    const an = (a + b) / 2;
    const bn = Math.sqrt(a * b);
    if (Math.abs(a - b) < 1e-15) break;
    a = an;
    b = bn;
  }
  return Math.PI / (2 * a);
}

/**
 * Exact large-amplitude period of the undamped pendulum:
 *   T = 4·√(L/g)·K(sin(θ₀/2))
 * Reduces to T₀ = 2π·√(L/g) as θ₀ → 0. Grows without bound as θ₀ → π.
 */
export function exactPeriod(
  length: number,
  gravity: number,
  amplitude: number,
): number {
  const a = Math.min(Math.abs(amplitude), Math.PI - 1e-6);
  const k = Math.sin(a / 2);
  return 4 * Math.sqrt(length / gravity) * ellipticK(k);
}

/**
 * The amplitude-dependent period series correction, useful as an at-a-glance
 * teaching value: T ≈ T₀·(1 + θ₀²/16 + 11·θ₀⁴/3072 + …).
 * Returns the leading bracket (the factor multiplying T₀).
 */
export function periodSeriesFactor(amplitude: number): number {
  const a2 = amplitude * amplitude;
  return 1 + a2 / 16 + (11 * a2 * a2) / 3072;
}

/** Total mechanical energy split into kinetic + potential (zero at the bottom). */
export function energy(
  state: PendulumState,
  length: number,
  gravity: number,
  mass: number,
): { kinetic: number; potential: number; total: number } {
  const v = length * state.omega; // bob speed = L·ω
  const kinetic = 0.5 * mass * v * v;
  const potential = mass * gravity * length * (1 - Math.cos(state.theta));
  return { kinetic, potential, total: kinetic + potential };
}

/** Angular acceleration for the real (nonlinear) pendulum with linear damping. */
export function angularAcceleration(
  state: PendulumState,
  length: number,
  gravity: number,
  damping: number,
  mass: number,
): number {
  return -(gravity / length) * Math.sin(state.theta) - (damping / mass) * state.omega;
}

/** Angular acceleration for the *linearised* (small-angle) model: sinθ ≈ θ. */
export function linearAngularAcceleration(
  state: PendulumState,
  length: number,
  gravity: number,
  damping: number,
  mass: number,
): number {
  return -(gravity / length) * state.theta - (damping / mass) * state.omega;
}

/**
 * One classic 4th-order Runge–Kutta step of the second-order ODE θ'' = accel(θ, ω),
 * written as the first-order system (θ' = ω, ω' = accel). `accel` lets the caller
 * pick the real (sinθ) or linearised model so both can share the same integrator.
 */
export function rk4Step(
  state: PendulumState,
  dt: number,
  accel: (s: PendulumState) => number,
): PendulumState {
  const a1 = accel(state);
  const k1 = { dTheta: state.omega, dOmega: a1 };

  const s2 = { theta: state.theta + (k1.dTheta * dt) / 2, omega: state.omega + (k1.dOmega * dt) / 2 };
  const a2 = accel(s2);
  const k2 = { dTheta: s2.omega, dOmega: a2 };

  const s3 = { theta: state.theta + (k2.dTheta * dt) / 2, omega: state.omega + (k2.dOmega * dt) / 2 };
  const a3 = accel(s3);
  const k3 = { dTheta: s3.omega, dOmega: a3 };

  const s4 = { theta: state.theta + k3.dTheta * dt, omega: state.omega + k3.dOmega * dt };
  const a4 = accel(s4);
  const k4 = { dTheta: s4.omega, dOmega: a4 };

  return {
    theta: state.theta + (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta),
    omega: state.omega + (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega),
  };
}

/** Surface gravity g (m/s²) of a few worlds, for the lesson's gravity presets. */
export const GRAVITY: Record<string, number> = {
  Earth: 9.81,
  Moon: 1.62,
  Mars: 3.72,
  Jupiter: 24.79,
  Sun: 274,
};
