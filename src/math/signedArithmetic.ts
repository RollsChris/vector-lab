/** Signed-number rewrites used by the Signs, Opposites & Order lesson. */

export type ArithmeticOp = "add" | "subtract" | "multiply" | "divide";

export interface StoryBeat {
  kind: "start" | "swap" | "rewrite";
  expression: string;
}

const MINUS = "−";

/** The number that cancels `value` back to zero. */
export function opposite(value: number): number {
  return -value;
}

export function formatSigned(value: number): string {
  if (value === 0) return "0";
  return value < 0 ? `${MINUS}${Math.abs(value)}` : String(value);
}

/** Addition that keeps a trailing negative visible as a signed addend. */
export function formatAddition(left: number, right: number): string {
  const rightText = right < 0 ? `(${formatSigned(right)})` : formatSigned(right);
  return `${formatSigned(left)} + ${rightText}`;
}

/** Prefer take-away when the second addend is negative. */
export function formatCompact(left: number, right: number): string {
  if (right < 0) return `${formatSigned(left)} ${MINUS} ${Math.abs(right)}`;
  return formatAddition(left, right);
}

/**
 * Beats that turn an addition into a compact writing.
 * A leading negative is swapped first; a trailing negative is rewritten as take-away.
 */
export function additionStory(left: number, right: number): StoryBeat[] {
  const start: StoryBeat = { kind: "start", expression: formatAddition(left, right) };
  if (left < 0) {
    const swapped = formatAddition(right, left);
    const rewritten = formatCompact(right, left);
    const beats: StoryBeat[] = [start, { kind: "swap", expression: swapped }];
    if (rewritten !== swapped) beats.push({ kind: "rewrite", expression: rewritten });
    return beats;
  }
  if (right < 0) {
    return [start, { kind: "rewrite", expression: formatCompact(left, right) }];
  }
  return [start, { kind: "swap", expression: formatAddition(right, left) }];
}

export function operate(operation: ArithmeticOp, left: number, right: number): number | undefined {
  switch (operation) {
    case "add":
      return left + right;
    case "subtract":
      return left - right;
    case "multiply":
      return left * right;
    case "divide":
      return right === 0 ? undefined : left / right;
  }
}

/** True when swapping the two inputs keeps the same result. */
export function swapPreserves(operation: ArithmeticOp, left: number, right: number): boolean {
  const forward = operate(operation, left, right);
  const backward = operate(operation, right, left);
  if (forward === undefined || backward === undefined) return false;
  return Object.is(forward, backward);
}

export function groupedSums(a: number, b: number, c: number): { left: number; right: number } {
  return { left: a + b + c, right: a + (b + c) };
}
