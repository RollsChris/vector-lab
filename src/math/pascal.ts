import { isPrime } from "./primes";

/** Return the coefficients of (a + b)^row. */
export function pascalRow(row: number): number[] {
  if (!Number.isInteger(row) || row < 0) {
    throw new RangeError("Pascal row must be a non-negative integer.");
  }

  let coefficients = [1];
  for (let currentRow = 1; currentRow <= row; currentRow++) {
    const next = [1];
    for (let column = 1; column < currentRow; column++) {
      next.push(coefficients[column - 1] + coefficients[column]);
    }
    next.push(1);
    coefficients = next;
  }
  return coefficients;
}

export function mersenneNumber(exponent: number): bigint {
  if (!Number.isInteger(exponent) || exponent < 1) {
    throw new RangeError("Mersenne exponent must be a positive integer.");
  }
  return (1n << BigInt(exponent)) - 1n;
}

/** Lucas-Lehmer's test, valid for prime exponents. */
export function isMersennePrime(exponent: number): boolean {
  if (!isPrime(exponent)) return false;
  if (exponent === 2) return true;

  const candidate = mersenneNumber(exponent);
  let residue = 4n;
  for (let step = 0; step < exponent - 2; step++) {
    residue = (residue * residue - 2n) % candidate;
  }
  return residue === 0n;
}

/**
 * Every Lucas-Lehmer residue for an odd prime exponent: s₀ = 4 followed by the p − 2
 * values of sₖ₊₁ = sₖ² − 2 (mod Mₚ). The final entry is zero exactly when Mₚ is prime.
 * Returns an empty list for exponents the test does not cover (p = 2 and composite p).
 */
export function lucasLehmerSteps(exponent: number): bigint[] {
  if (!isPrime(exponent) || exponent === 2) return [];
  const candidate = mersenneNumber(exponent);
  const residues: bigint[] = [4n];
  let residue = 4n;
  for (let step = 0; step < exponent - 2; step++) {
    residue = (residue * residue - 2n) % candidate;
    residues.push(residue);
  }
  return residues;
}

/** Factorise a bigint by trial division. Intended for the small Mersenne numbers on stage. */
export function smallBigIntFactors(value: bigint): bigint[] {
  if (value < 2n) return [];
  const factors: bigint[] = [];
  let remainder = value;
  for (let divisor = 2n; divisor * divisor <= remainder; divisor += divisor === 2n ? 1n : 2n) {
    while (remainder % divisor === 0n) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }
  if (remainder > 1n) factors.push(remainder);
  return factors;
}

/**
 * How a Mersenne number Mₚ = 2ᵖ − 1 sits relative to ordinary primes:
 *  - "composite-exponent": p itself factors, so Mₚ factors too and can never be prime.
 *  - "prime-exponent-composite": p is prime but Mₚ is not, e.g. M₁₁ = 2047 = 23 × 89.
 *  - "mersenne-prime": Mₚ is prime, so it is both a Mersenne number and an ordinary prime.
 */
export type MersenneKind = "composite-exponent" | "prime-exponent-composite" | "mersenne-prime";

export interface MersenneClassification {
  exponent: number;
  value: bigint;
  primeExponent: boolean;
  mersennePrime: boolean;
  kind: MersenneKind;
  /** Prime factors of Mₚ with multiplicity; only computed when p ≤ 32. */
  factors: bigint[];
}

export function classifyMersenne(exponent: number): MersenneClassification {
  const value = mersenneNumber(exponent);
  const primeExponent = isPrime(exponent);
  const mersennePrime = primeExponent && isMersennePrime(exponent);
  const kind: MersenneKind = mersennePrime
    ? "mersenne-prime"
    : primeExponent
      ? "prime-exponent-composite"
      : "composite-exponent";
  return {
    exponent,
    value,
    primeExponent,
    mersennePrime,
    kind,
    factors: exponent <= 32 ? (mersennePrime ? [value] : smallBigIntFactors(value)) : [],
  };
}
