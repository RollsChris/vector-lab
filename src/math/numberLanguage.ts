/** Whole-number structure, ratios, and compact place-value forms used by Stage 1. */

export interface ScientificNotation {
  coefficient: number;
  exponent: number;
}

export interface NamedDivision {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
}

/** Positive divisors of a whole number, including 1 and itself. */
export function factors(value: number): number[] {
  if (!Number.isSafeInteger(value) || value < 1) return [];
  const found: number[] = [];
  const limit = Math.floor(Math.sqrt(value));
  for (let candidate = 1; candidate <= limit; candidate++) {
    if (value % candidate !== 0) continue;
    found.push(candidate);
    const pair = value / candidate;
    if (pair !== candidate) found.push(pair);
  }
  return found.sort((a, b) => a - b);
}

/** First `count` positive multiples of a whole number. */
export function multiples(value: number, count: number): number[] {
  if (!Number.isSafeInteger(value) || value < 1 || !Number.isSafeInteger(count) || count < 1) {
    return [];
  }
  return Array.from({ length: count }, (_, index) => value * (index + 1));
}

/** Greatest common factor. gcd(0, n) = |n| and gcd(0, 0) = 0. */
export function gcd(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return 0;
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

/** Least common multiple of two whole numbers. lcm(0, n) = 0. */
export function lcm(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return 0;
  const x = Math.abs(a);
  const y = Math.abs(b);
  if (x === 0 || y === 0) return 0;
  return (x / gcd(x, y)) * y;
}

/** Shared positive factors, from 1 up to the GCF. */
export function commonFactors(a: number, b: number): number[] {
  const shared = gcd(a, b);
  if (shared < 1) return [];
  return factors(shared);
}

/**
 * Least common factor of two positive whole numbers.
 * This is always 1, because 1 divides every whole number.
 */
export function leastCommonFactor(a: number, b: number): number | undefined {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 1 || b < 1) return undefined;
  return 1;
}

export function simplifyRatio(a: number, b: number): readonly [number, number] {
  const shared = gcd(a, b);
  if (shared < 1) return [a, b];
  return [a / shared, b / shared];
}

export function divideWhole(dividend: number, divisor: number): NamedDivision | undefined {
  if (!Number.isSafeInteger(dividend) || !Number.isSafeInteger(divisor) || divisor === 0) {
    return undefined;
  }
  const quotient = Math.trunc(dividend / divisor);
  const remainder = dividend - quotient * divisor;
  return { dividend, divisor, quotient, remainder };
}

export function percentFromDecimal(value: number): number {
  return value * 100;
}

export function decimalFromPercent(percent: number): number {
  return percent / 100;
}

/** Coefficient in [1, 10) times a power of ten, except that 0 stays 0 × 10⁰. */
export function toScientific(value: number): ScientificNotation {
  if (value === 0 || !Number.isFinite(value)) return { coefficient: value, exponent: 0 };
  const exponent = Math.floor(Math.log10(Math.abs(value)) + 1e-12);
  const coefficient = value / 10 ** exponent;
  return { coefficient: Number(coefficient.toPrecision(12)), exponent };
}

export function fromScientific(coefficient: number, exponent: number): number {
  return coefficient * 10 ** exponent;
}

export function formatScientific(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const { coefficient, exponent } = toScientific(value);
  const coeffText = Number.isInteger(coefficient)
    ? String(coefficient)
    : String(coefficient).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return `${coeffText} × 10^${exponent}`;
}

export function formatDecimal(value: number, maxDigits = 8): string {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(maxDigits).replace(/0+$/, "").replace(/\.$/, "");
}

/** Digit in the 10^exponent place of a finite number, using absolute value. */
export function digitAtPlace(value: number, exponent: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const scaled = Math.abs(value) / 10 ** exponent;
  return Math.floor(scaled + 1e-9) % 10;
}

/**
 * Inclusive place-value span that shows at least the ones column and every
 * written fractional digit. Scientific notation's leading place is included
 * when it sits left of the ones.
 */
export function writtenPlaceSpan(value: number): { maxExp: number; minExp: number } {
  if (!Number.isFinite(value) || value === 0) return { maxExp: 0, minExp: 0 };
  const { exponent } = toScientific(value);
  const text = formatDecimal(Math.abs(value));
  const fraction = text.includes(".") ? (text.split(".")[1]?.length ?? 0) : 0;
  return {
    maxExp: Math.max(exponent, 0),
    minExp: Math.min(-fraction, exponent, 0) || 0,
  };
}
