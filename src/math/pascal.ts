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
