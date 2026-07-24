export function simulateRandomWalk(
  steps: number,
  upProbability: number,
  stepSize: number,
  seed: number,
): number[] {
  validateSteps(steps);
  validateProbability(upProbability, "Up probability");
  if (!Number.isFinite(stepSize) || stepSize <= 0) {
    throw new RangeError("Step size must be positive");
  }

  const random = seededRandom(seed);
  const path = [0];
  for (let step = 0; step < steps; step++) {
    const direction = random() < upProbability ? 1 : -1;
    path.push(path[path.length - 1] + direction * stepSize);
  }
  return path;
}

export function poissonCountPath(
  steps: number,
  duration: number,
  rate: number,
  seed: number,
): number[] {
  validateSteps(steps);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError("Poisson duration and rate must be positive");
  }

  const random = seededRandom(seed);
  const arrivals: number[] = [];
  let time = 0;
  while (true) {
    time += -Math.log(Math.max(random(), 1e-12)) / rate;
    if (time > duration) break;
    arrivals.push(time);
  }

  return Array.from({ length: steps + 1 }, (_, index) => {
    const sampleTime = duration * index / steps;
    let count = 0;
    while (count < arrivals.length && arrivals[count] <= sampleTime) count++;
    return count;
  });
}

export function simulateAr1(
  steps: number,
  mean: number,
  persistence: number,
  volatility: number,
  seed: number,
): number[] {
  validateSteps(steps);
  if (!Number.isFinite(mean) || !Number.isFinite(persistence)
    || Math.abs(persistence) >= 1 || !Number.isFinite(volatility) || volatility < 0) {
    throw new RangeError("AR(1) inputs require finite mean, |persistence| < 1, and non-negative volatility");
  }

  const normal = seededNormal(seed);
  const path = [mean];
  for (let step = 0; step < steps; step++) {
    const previous = path[path.length - 1];
    path.push(mean + persistence * (previous - mean) + volatility * normal());
  }
  return path;
}

export function simulateBrownianMotion(
  steps: number,
  duration: number,
  drift: number,
  volatility: number,
  seed: number,
): number[] {
  validateSteps(steps);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(drift)
    || !Number.isFinite(volatility) || volatility < 0) {
    throw new RangeError("Brownian duration must be positive and other inputs finite");
  }

  const normal = seededNormal(seed);
  const interval = duration / steps;
  const path = [0];
  for (let step = 0; step < steps; step++) {
    const increment = drift * interval + volatility * Math.sqrt(interval) * normal();
    path.push(path[path.length - 1] + increment);
  }
  return path;
}

export function ensembleMean(paths: readonly (readonly number[])[]): number[] {
  if (paths.length === 0 || paths[0].length === 0
    || paths.some((path) => path.length !== paths[0].length)) {
    throw new RangeError("An ensemble must contain equally sized, non-empty paths");
  }
  return paths[0].map((_, index) =>
    paths.reduce((sum, path) => sum + path[index], 0) / paths.length);
}

export function autocorrelation(path: readonly number[], lag: number): number {
  if (path.length < 2 || !Number.isInteger(lag) || lag < 0 || lag >= path.length) {
    throw new RangeError("Lag must fit inside a path with at least two values");
  }
  const mean = path.reduce((sum, value) => sum + value, 0) / path.length;
  const denominator = path.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  if (denominator === 0) return 0;

  let numerator = 0;
  for (let index = 0; index < path.length - lag; index++) {
    numerator += (path[index] - mean) * (path[index + lag] - mean);
  }
  return numerator / denominator;
}

function seededRandom(seed: number): () => number {
  if (!Number.isFinite(seed)) throw new RangeError("Random seed must be finite");
  let state = Math.abs(Math.trunc(seed)) % 233280;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function seededNormal(seed: number): () => number {
  const random = seededRandom(seed);
  return () => {
    const first = Math.max(random(), 1e-12);
    const second = random();
    return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
  };
}

function validateSteps(steps: number): void {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError("Process steps must be a positive integer");
  }
}

function validateProbability(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1`);
  }
}
