function assertProbability(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1`);
  }
}

export function combinations(total: number, chosen: number): number {
  if (!Number.isInteger(total) || !Number.isInteger(chosen) || total < 0 || chosen < 0) {
    throw new RangeError("Combination inputs must be non-negative integers");
  }
  if (chosen > total) return 0;

  const smaller = Math.min(chosen, total - chosen);
  let result = 1;
  for (let index = 1; index <= smaller; index++) {
    result = (result * (total - smaller + index)) / index;
  }
  return result;
}

export function binomialProbability(
  trials: number,
  successes: number,
  probability: number,
): number {
  assertProbability(probability, "Success probability");
  return combinations(trials, successes)
    * probability ** successes
    * (1 - probability) ** (trials - successes);
}

export function expectedValue(
  values: readonly number[],
  probabilities: readonly number[],
): number {
  validateDistribution(values, probabilities);
  return values.reduce(
    (total, value, index) => total + value * probabilities[index],
    0,
  );
}

export function variance(
  values: readonly number[],
  probabilities: readonly number[],
): number {
  const mean = expectedValue(values, probabilities);
  return values.reduce(
    (total, value, index) => total + probabilities[index] * (value - mean) ** 2,
    0,
  );
}

export function conditionalProbability(
  intersection: number,
  condition: number,
): number {
  assertProbability(intersection, "Intersection probability");
  assertProbability(condition, "Condition probability");
  if (condition === 0 || intersection > condition) {
    throw new RangeError("The condition must be possible and contain the intersection");
  }
  return intersection / condition;
}

export function bayesPosterior(
  prior: number,
  sensitivity: number,
  specificity: number,
): number {
  assertProbability(prior, "Prior probability");
  assertProbability(sensitivity, "Sensitivity");
  assertProbability(specificity, "Specificity");
  const truePositive = prior * sensitivity;
  const falsePositive = (1 - prior) * (1 - specificity);
  const positive = truePositive + falsePositive;
  if (positive === 0) {
    throw new RangeError("The evidence has zero probability");
  }
  return truePositive / positive;
}

export function normalDensity(value: number, mean: number, standardDeviation: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(mean)
    || !Number.isFinite(standardDeviation) || standardDeviation <= 0) {
    throw new RangeError("Normal-distribution inputs must be finite and spread must be positive");
  }
  const z = (value - mean) / standardDeviation;
  return Math.exp(-0.5 * z ** 2) / (standardDeviation * Math.sqrt(2 * Math.PI));
}

function validateDistribution(
  values: readonly number[],
  probabilities: readonly number[],
): void {
  if (values.length === 0 || values.length !== probabilities.length) {
    throw new RangeError("Values and probabilities must be non-empty and have equal length");
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Random-variable values must be finite");
  }
  probabilities.forEach((probability) => assertProbability(probability, "Probability"));
  const total = probabilities.reduce((sum, probability) => sum + probability, 0);
  if (Math.abs(total - 1) > 1e-9) {
    throw new RangeError("Probabilities must sum to 1");
  }
}
