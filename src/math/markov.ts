export type TransitionMatrix = readonly (readonly number[])[];

const DEFAULT_TOLERANCE = 1e-9;

export function validateTransitionMatrix(
  matrix: TransitionMatrix,
  tolerance = DEFAULT_TOLERANCE,
): void {
  if (matrix.length === 0 || matrix.some((row) => row.length !== matrix.length)) {
    throw new RangeError("A transition matrix must be non-empty and square");
  }

  for (const row of matrix) {
    if (row.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new RangeError("Transition probabilities must be finite values between 0 and 1");
    }
    const total = row.reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1) > tolerance) {
      throw new RangeError("Every transition-matrix row must sum to 1");
    }
  }
}

export function stepDistribution(
  distribution: readonly number[],
  matrix: TransitionMatrix,
): number[] {
  validateTransitionMatrix(matrix);
  validateDistribution(distribution, matrix.length);
  return multiplyDistribution(distribution, matrix);
}

export function forecastDistribution(
  initial: readonly number[],
  matrix: TransitionMatrix,
  steps: number,
): number[] {
  validateTransitionMatrix(matrix);
  validateDistribution(initial, matrix.length);
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError("Forecast steps must be a non-negative integer");
  }

  let distribution = [...initial];
  for (let step = 0; step < steps; step++) {
    distribution = multiplyDistribution(distribution, matrix);
  }
  return distribution;
}

export function stationaryDistribution(
  matrix: TransitionMatrix,
  tolerance = 1e-12,
  maxIterations = 10_000,
): number[] {
  validateTransitionMatrix(matrix);
  if (!(tolerance > 0) || !Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new RangeError("Stationary-distribution settings must be positive");
  }

  let current = new Array(matrix.length).fill(1 / matrix.length);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const next = multiplyDistribution(current, matrix);
    const change = Math.max(...next.map((value, index) => Math.abs(value - current[index])));
    current = next;
    if (change < tolerance) return current;
  }
  return current;
}

export function isAbsorbingState(
  matrix: TransitionMatrix,
  state: number,
  tolerance = DEFAULT_TOLERANCE,
): boolean {
  validateTransitionMatrix(matrix);
  if (!Number.isInteger(state) || state < 0 || state >= matrix.length) {
    throw new RangeError("State index is outside the transition matrix");
  }
  return matrix[state].every((value, index) =>
    Math.abs(value - (index === state ? 1 : 0)) <= tolerance);
}

function validateDistribution(distribution: readonly number[], size: number): void {
  if (distribution.length !== size) {
    throw new RangeError("The distribution must contain one probability per state");
  }
  if (distribution.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new RangeError("Distribution probabilities must be finite values between 0 and 1");
  }
  const total = distribution.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 1) > DEFAULT_TOLERANCE) {
    throw new RangeError("A probability distribution must sum to 1");
  }
}

function multiplyDistribution(
  distribution: readonly number[],
  matrix: TransitionMatrix,
): number[] {
  return matrix.map((_, target) =>
    distribution.reduce(
      (sum, probability, source) => sum + probability * matrix[source][target],
      0,
    ));
}
