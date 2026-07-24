export interface LongMultiplication {
  product: number;
  partialProducts: number[];
}

export interface LongDivisionStep {
  digit: number;
  partialDividend: number;
  quotientDigit: number;
  product: number;
  remainder: number;
}

export interface LongDivision {
  quotient: number;
  remainder: number;
  steps: LongDivisionStep[];
}

export function longMultiplication(multiplicand: number, multiplier: number): LongMultiplication {
  assertPositiveInteger(multiplicand, "Multiplicand");
  assertPositiveInteger(multiplier, "Multiplier");

  const partialProducts = String(multiplier)
    .split("")
    .reverse()
    .map((digit, index) => multiplicand * Number(digit) * 10 ** index);
  return { product: multiplicand * multiplier, partialProducts };
}

export function longDivision(dividend: number, divisor: number): LongDivision {
  assertPositiveInteger(dividend, "Dividend");
  assertPositiveInteger(divisor, "Divisor");

  let remainder = 0;
  let quotientText = "";
  const steps: LongDivisionStep[] = [];
  for (const character of String(dividend)) {
    const digit = Number(character);
    const partialDividend = remainder * 10 + digit;
    const quotientDigit = Math.floor(partialDividend / divisor);
    const product = quotientDigit * divisor;
    remainder = partialDividend - product;
    quotientText += quotientDigit;
    steps.push({ digit, partialDividend, quotientDigit, product, remainder });
  }
  return { quotient: Number(quotientText), remainder, steps };
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}
