/**
 * Compiles a math expression string (e.g. "sin(x) * y") into a fast JS function.
 * Exposes Math.* functions/constants unprefixed so users can write `sin`, `pi`, etc.
 * This uses `new Function`; acceptable here because input is the user's own local input.
 */

const MATH_NAMES = [
  "abs", "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh",
  "cbrt", "ceil", "cos", "cosh", "exp", "floor", "hypot", "log", "log2",
  "log10", "max", "min", "pow", "round", "sign", "sin", "sinh", "sqrt",
  "tan", "tanh", "trunc",
] as const;

const CONSTS = "const pi = Math.PI, e = Math.E, tau = 2 * Math.PI;";
const FUNCS = MATH_NAMES.map((n) => `const ${n} = Math.${n};`).join(" ");

export type Fn1 = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;
export type Fn3 = (x: number, y: number, z: number) => number;
export type Fn4 = (x: number, y: number, z: number, t: number) => number;

function compile(args: string[], body: string): (...n: number[]) => number {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    ...args,
    `"use strict"; ${CONSTS} ${FUNCS} return (${body});`,
  ) as (...n: number[]) => number;
  // Validate once so a bad expression fails at compile time, not mid-render.
  const probe = fn(...args.map(() => 0.123));
  if (typeof probe !== "number" || Number.isNaN(probe)) {
    // Allow NaN at the probe point only if the expression is otherwise valid;
    // re-test at another point before giving up.
    const probe2 = fn(...args.map(() => 0.5));
    if (typeof probe2 !== "number") {
      throw new Error("Expression did not evaluate to a number");
    }
  }
  return fn;
}

export function compile1(expr: string): Fn1 {
  return compile(["x"], expr) as Fn1;
}

export function compile2(expr: string): Fn2 {
  return compile(["x", "y"], expr) as Fn2;
}

export function compile3(expr: string): Fn3 {
  return compile(["x", "y", "z"], expr) as Fn3;
}

/** Compile an expression of x, y, z and time t (e.g. "sin(y + t)"). */
export function compile4(expr: string): Fn4 {
  return compile(["x", "y", "z", "t"], expr) as Fn4;
}

/** Safely compile, returning null + error message instead of throwing. */
export function tryCompile1(expr: string): { fn: Fn1 | null; error: string } {
  try {
    return { fn: compile1(expr), error: "" };
  } catch (e) {
    return { fn: null, error: (e as Error).message };
  }
}

export function tryCompile2(expr: string): { fn: Fn2 | null; error: string } {
  try {
    return { fn: compile2(expr), error: "" };
  } catch (e) {
    return { fn: null, error: (e as Error).message };
  }
}

export function tryCompile3(expr: string): { fn: Fn3 | null; error: string } {
  try {
    return { fn: compile3(expr), error: "" };
  } catch (e) {
    return { fn: null, error: (e as Error).message };
  }
}

export function tryCompile4(expr: string): { fn: Fn4 | null; error: string } {
  try {
    return { fn: compile4(expr), error: "" };
  } catch (e) {
    return { fn: null, error: (e as Error).message };
  }
}
