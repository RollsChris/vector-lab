export interface PrimeGap {
  lower: number;
  upper: number;
  gap: number;
}

/** Return every prime p <= limit using the sieve of Eratosthenes. */
export function sieve(limit: number): number[] {
  const n = Math.max(0, Math.floor(limit));
  if (n < 2) return [];

  const composite = new Uint8Array(n + 1);
  for (let p = 2; p * p <= n; p++) {
    if (composite[p]) continue;
    for (let multiple = p * p; multiple <= n; multiple += p) {
      composite[multiple] = 1;
    }
  }

  const primes: number[] = [];
  for (let value = 2; value <= n; value++) {
    if (!composite[value]) primes.push(value);
  }
  return primes;
}

/** Exact primality test for JavaScript safe integers. */
export function isPrime(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < 2) return false;
  if (value === 2 || value === 3) return true;
  if (value % 2 === 0 || value % 3 === 0) return false;

  for (let divisor = 5; divisor * divisor <= value; divisor += 6) {
    if (value % divisor === 0 || value % (divisor + 2) === 0) return false;
  }
  return true;
}

/** Prime factorisation with multiplicity, e.g. 360 -> [2,2,2,3,3,5]. */
export function primeFactors(value: number): number[] {
  if (!Number.isSafeInteger(value) || value < 1) return [];
  let remainder = value;
  const factors: number[] = [];

  while (remainder % 2 === 0) {
    factors.push(2);
    remainder /= 2;
  }
  for (let divisor = 3; divisor * divisor <= remainder; divisor += 2) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }
  if (remainder > 1) factors.push(remainder);
  return factors;
}

/** Canonical exponent form, e.g. 360 -> "2³ × 3² × 5". */
export function formatPrimeFactorisation(value: number): string {
  if (value === 1) return "1 (the empty product)";
  const factors = primeFactors(value);
  if (factors.length === 0) return "not defined";

  const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const exponent = (power: number): string => String(power)
    .split("")
    .map((digit) => superscripts[Number(digit)])
    .join("");

  const grouped: string[] = [];
  for (let i = 0; i < factors.length;) {
    const factor = factors[i];
    let power = 1;
    while (factors[i + power] === factor) power++;
    grouped.push(power === 1 ? String(factor) : `${factor}${exponent(power)}`);
    i += power;
  }
  return grouped.join(" × ");
}

/** Euler's totient phi(n): integers in 1..n that are coprime to n. */
export function eulerTotient(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) return 0;
  let result = value;
  for (const factor of new Set(primeFactors(value))) {
    result -= result / factor;
  }
  return result;
}

/** Möbius mu(n): 0 for a squared prime factor, otherwise (-1)^number of factors. */
export function mobius(value: number): -1 | 0 | 1 {
  if (!Number.isSafeInteger(value) || value < 1) return 0;
  if (value === 1) return 1;
  const factors = primeFactors(value);
  if (new Set(factors).size !== factors.length) return 0;
  return factors.length % 2 === 0 ? 1 : -1;
}

export function primeGaps(limit: number): PrimeGap[] {
  const primes = sieve(limit);
  const gaps: PrimeGap[] = [];
  for (let i = 1; i < primes.length; i++) {
    gaps.push({
      lower: primes[i - 1],
      upper: primes[i],
      gap: primes[i] - primes[i - 1],
    });
  }
  return gaps;
}

