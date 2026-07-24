export interface ForcePulse {
  mass: number;
  initialVelocity: number;
  force: number;
  duration: number;
}

export interface ForcePulseState {
  time: number;
  force: number;
  acceleration: number;
  velocity: number;
  position: number;
  momentum: number;
  impulse: number;
}

export function momentum(mass: number, velocity: number): number {
  return mass * velocity;
}

export function impulse(force: number, duration: number): number {
  return force * duration;
}

export function finalVelocityFromImpulse(
  mass: number,
  initialVelocity: number,
  appliedImpulse: number,
): number {
  return initialVelocity + appliedImpulse / mass;
}

export function forcePulseState(pulse: ForcePulse, time: number): ForcePulseState {
  const t = Math.max(0, time);
  const activeTime = Math.min(t, pulse.duration);
  const acceleration = pulse.force / pulse.mass;
  const velocityAtRelease = pulse.initialVelocity + acceleration * pulse.duration;
  const positionAtRelease =
    pulse.initialVelocity * pulse.duration +
    0.5 * acceleration * pulse.duration * pulse.duration;

  const velocity = t <= pulse.duration
    ? pulse.initialVelocity + acceleration * t
    : velocityAtRelease;
  const position = t <= pulse.duration
    ? pulse.initialVelocity * t + 0.5 * acceleration * t * t
    : positionAtRelease + velocityAtRelease * (t - pulse.duration);
  const appliedImpulse = pulse.force * activeTime;

  return {
    time: t,
    force: t <= pulse.duration ? pulse.force : 0,
    acceleration: t <= pulse.duration ? acceleration : 0,
    velocity,
    position,
    momentum: momentum(pulse.mass, velocity),
    impulse: appliedImpulse,
  };
}

export function recoilVelocities(
  massA: number,
  massB: number,
  internalImpulse: number,
): [number, number] {
  return [-internalImpulse / massA, internalImpulse / massB];
}
