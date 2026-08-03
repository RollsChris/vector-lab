export interface FactorPair {
  a: number;
  b: number;
}

export interface MultiplicationMapTarget {
  target: number;
  pairs: FactorPair[];
  cells: FactorPair[];
  divisorsInScope: number[];
  isSquare: boolean;
  root: number | null;
  reachable: boolean;
}

export const MULTIPLICATION_MAP_LIMIT = 12;

/** Describe how a product appears in the 1–12 multiplication map. */
export function multiplicationMapTarget(value: number): MultiplicationMapTarget {
  const valid = Number.isSafeInteger(value) && value > 0;
  if (!valid) {
    return {
      target: 0,
      pairs: [],
      cells: [],
      divisorsInScope: [],
      isSquare: false,
      root: null,
      reachable: false,
    };
  }

  const target = value;
  const pairs: FactorPair[] = [];
  const divisorsInScope: number[] = [];

  for (let a = 1; a <= MULTIPLICATION_MAP_LIMIT; a++) {
    if (target % a === 0) divisorsInScope.push(a);
    for (let b = a; b <= MULTIPLICATION_MAP_LIMIT; b++) {
      if (a * b === target) pairs.push({ a, b });
    }
  }

  const cells = pairs.flatMap(({ a, b }) => (a === b ? [{ a, b }] : [{ a, b }, { a: b, b: a }]));
  const squareRoot = Math.sqrt(target);
  const root = Number.isInteger(squareRoot) && squareRoot <= MULTIPLICATION_MAP_LIMIT
    ? squareRoot
    : null;

  return {
    target,
    pairs,
    cells,
    divisorsInScope,
    isSquare: root !== null,
    root,
    reachable: cells.length > 0,
  };
}

export function multiplicationMapSquares(): FactorPair[] {
  return Array.from(
    { length: MULTIPLICATION_MAP_LIMIT },
    (_, index) => ({ a: index + 1, b: index + 1 }),
  );
}
