/**
 * Integer Energy Lab — pure number-theory helpers and a strict allowlisted
 * integer expression compiler. No Three.js. Never evaluates arbitrary JS.
 */

import {
  eulerTotient,
  isPrime,
  mobius,
  primeFactors,
  sieve,
} from "./primes";

/** Hard cap on plotted points per visual rebuild. */
export const MAX_INTEGER_LAB_RANGE = 10_000;

/**
 * Absolute cap on number-theory helper arguments (isprime, phi, mu, omega, …).
 * Trial division is O(√n); keeping |arg| ≤ 1e6 bounds worst-case work per call
 * so custom expressions cannot freeze the browser lab (e.g. isprime(2^53-ish)).
 */
export const MAX_INTEGER_LAB_HELPER_ARG = 1_000_000;

/** Small primes used as the modular survival-energy test sequence. */
export const ENERGY_PRIMES: readonly number[] = sieve(113);

export type IntegerFn = (n: number) => number;

export interface IntegerRange {
  start: number;
  end: number;
  count: number;
  capped: boolean;
  error: string;
}

export interface ThresholdMetrics {
  /** Integers in the plotted range. */
  count: number;
  /** Values with y >= threshold (finite only). */
  candidateCount: number;
  /** Candidates that are prime. */
  primeHits: number;
  /** Actual primes in the range. */
  actualPrimes: number;
  /** primeHits / candidateCount, or 0 when no candidates. */
  precision: number;
  /** primeHits / actualPrimes, or 0 when no primes. */
  recall: number;
  threshold: number;
}

export interface SeriesPoint {
  n: number;
  y: number;
  finite: boolean;
  prime: boolean;
  composite: boolean;
  factors: number[];
  energy: number;
  fullEnergy: number;
  survived: boolean;
  aboveThreshold: boolean;
}

export interface YScale {
  yMin: number;
  yMax: number;
  /** Map a raw y into [0, 1] for chart height; nonfinite → 0. */
  normalize: (y: number) => number;
}

export interface SeriesResult {
  range: IntegerRange;
  points: SeriesPoint[];
  scale: YScale;
  metrics: ThresholdMetrics;
}

export interface CompileIntegerResult {
  fn: IntegerFn | null;
  error: string;
}

export const INTEGER_LAB_PRESETS: Readonly<Record<string, string>> = {
  "n % 6": "n % 6",
  "isprime(n)": "isprime(n)",
  "phi(n)/n": "phi(n)/n",
  "mu(n)": "mu(n)",
  "omega(n)": "omega(n)",
  "gcd(n, 30)": "gcd(n, 30)",
  "survival energy": "energy(n)",
};

const MATH_FNS: Record<string, (...args: number[]) => number> = Object.assign(
  Object.create(null) as Record<string, (...args: number[]) => number>,
  {
    abs: Math.abs,
    acos: Math.acos,
    acosh: Math.acosh,
    asin: Math.asin,
    asinh: Math.asinh,
    atan: Math.atan,
    atan2: Math.atan2,
    atanh: Math.atanh,
    cbrt: Math.cbrt,
    ceil: Math.ceil,
    cos: Math.cos,
    cosh: Math.cosh,
    exp: Math.exp,
    floor: Math.floor,
    hypot: Math.hypot,
    log: Math.log,
    log2: Math.log2,
    log10: Math.log10,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    round: Math.round,
    sign: Math.sign,
    sin: Math.sin,
    sinh: Math.sinh,
    sqrt: Math.sqrt,
    tan: Math.tan,
    tanh: Math.tanh,
    trunc: Math.trunc,
  },
);

const CONSTANTS: Record<string, number> = Object.assign(
  Object.create(null) as Record<string, number>,
  {
    pi: Math.PI,
    e: Math.E,
    tau: 2 * Math.PI,
  },
);

const FORBIDDEN_WORDS = new Set([
  "return", "var", "let", "const", "function", "class", "new", "this",
  "window", "globalthis", "global", "self", "eval", "import", "export",
  "arguments", "prototype", "constructor", "with", "delete", "typeof",
  "void", "yield", "await", "async", "throw", "try", "catch", "finally",
  "while", "for", "do", "switch", "case", "break", "continue", "debugger",
  "instanceof", "in", "of", "super", "static", "extends", "implements",
  "interface", "package", "private", "protected", "public", "enum",
  "document", "process", "require", "module", "exports", "fetch",
  "settimeout", "setinterval", "promise", "proxy", "reflect", "array",
  "object", "string", "number", "boolean", "symbol", "bigint", "map",
  "set", "weakmap", "weakset", "date", "regexp", "error", "json",
  "math", "infinity", "nan", "undefined", "null", "true", "false",
  "__proto__", "proto",
]);

type TokKind =
  | "num"
  | "id"
  | "op"
  | "lparen"
  | "rparen"
  | "comma"
  | "eof";

interface Tok {
  kind: TokKind;
  value: string;
  pos: number;
}

/**
 * Truncate and accept a number-theory helper argument, or null when it is
 * non-finite, not a safe integer, or outside the affordable lab cap.
 */
export function coerceHelperArg(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const truncated = Math.trunc(value);
  if (!Number.isSafeInteger(truncated)) return null;
  if (Math.abs(truncated) > MAX_INTEGER_LAB_HELPER_ARG) return null;
  return truncated;
}

function gcdInt(a: number, b: number): number {
  const x0 = coerceHelperArg(a);
  const y0 = coerceHelperArg(b);
  if (x0 === null || y0 === null) return Number.NaN;
  let x = Math.abs(x0);
  let y = Math.abs(y0);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function lcmInt(a: number, b: number): number {
  const x0 = coerceHelperArg(a);
  const y0 = coerceHelperArg(b);
  if (x0 === null || y0 === null) return Number.NaN;
  const x = Math.abs(x0);
  const y = Math.abs(y0);
  if (x === 0 || y === 0) return 0;
  return Math.abs(x / gcdInt(x, y) * y);
}

/** Run a unary integer helper only when the argument is within the lab budget. */
function guardedUnary(arg: number, fn: (n: number) => number): number {
  const v = coerceHelperArg(arg);
  if (v === null) return Number.NaN;
  return fn(v);
}

/** Distinct prime omega(n). */
export function omega(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) return 0;
  if (value === 1) return 0;
  return new Set(primeFactors(value)).size;
}

/** Big omega Ω(n): prime factors counted with multiplicity. */
export function bigOmega(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) return 0;
  if (value === 1) return 0;
  return primeFactors(value).length;
}

/**
 * Weight awarded for surviving divisibility by prime p.
 * Equal weights keep the model modular and easy to reason about.
 */
export function energyWeight(_prime: number): number {
  return 1;
}

/**
 * Energy accumulated by surviving successive small-prime tests up to √n.
 * Stops (keeps energy so far) when a prime divides n. Surviving every
 * p ≤ √n is exactly the trial-division proof of primality.
 */
export function survivalEnergy(
  value: number,
  primes: readonly number[] = ENERGY_PRIMES,
): number {
  if (!Number.isSafeInteger(value) || value < 2) return 0;
  const bound = Math.floor(Math.sqrt(value));
  let energy = 0;
  let covered = 0;
  for (const p of primes) {
    if (p > bound) return energy;
    if (value % p === 0) return energy;
    energy += energyWeight(p);
    covered = p;
  }
  // Extend past the fixed list when √n is larger (rare for the lab range).
  let p = covered < 2 ? 2 : covered + (covered === 2 ? 1 : 2);
  if (p % 2 === 0) p++;
  for (; p <= bound; p += 2) {
    if (value % p === 0) return energy;
    // Only award weight for prime trial candidates.
    if (!isPrime(p)) continue;
    energy += energyWeight(p);
  }
  return energy;
}

/** Full survival energy if every p ≤ √n is survived (prime benchmark). */
export function fullSurvivalEnergy(
  value: number,
  primes: readonly number[] = ENERGY_PRIMES,
): number {
  if (!Number.isSafeInteger(value) || value < 2) return 0;
  const bound = Math.floor(Math.sqrt(value));
  let energy = 0;
  let covered = 0;
  for (const p of primes) {
    if (p > bound) return energy;
    energy += energyWeight(p);
    covered = p;
  }
  let p = covered < 2 ? 2 : covered + (covered === 2 ? 1 : 2);
  if (p % 2 === 0) p++;
  for (; p <= bound; p += 2) {
    if (!isPrime(p)) continue;
    energy += energyWeight(p);
  }
  return energy;
}

/** True when survival energy matches the full √n budget (prime for n ≥ 2). */
export function survivedPrimalityTests(
  value: number,
  primes: readonly number[] = ENERGY_PRIMES,
): boolean {
  if (value < 2) return false;
  return survivalEnergy(value, primes) === fullSurvivalEnergy(value, primes)
    && isPrime(value);
}

export function normalizeIntegerRange(
  start: number,
  end: number,
  maxCount: number = MAX_INTEGER_LAB_RANGE,
): IntegerRange {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { start: 1, end: 1, count: 1, capped: false, error: "Range bounds must be finite" };
  }
  let a = Math.trunc(start);
  let b = Math.trunc(end);
  if (a > b) [a, b] = [b, a];
  // Lab plots positive integers only.
  a = Math.max(1, a);
  b = Math.max(1, b);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    return { start: 1, end: 1, count: 1, capped: false, error: "Range exceeds safe integers" };
  }
  let capped = false;
  let count = b - a + 1;
  if (count > maxCount) {
    b = a + maxCount - 1;
    count = maxCount;
    capped = true;
  }
  return { start: a, end: b, count, capped, error: "" };
}

export function buildYScale(values: readonly number[]): YScale {
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const y of values) {
    if (!Number.isFinite(y)) continue;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    yMin = 0;
    yMax = 1;
  }
  // Avoid a zero-height scale for constant series.
  if (yMax - yMin < 1e-12) {
    yMin -= 1;
    yMax += 1;
  }
  const span = yMax - yMin;
  return {
    yMin,
    yMax,
    normalize: (y: number) => {
      if (!Number.isFinite(y)) return 0;
      const t = (y - yMin) / span;
      if (t < 0) return 0;
      if (t > 1) return 1;
      return t;
    },
  };
}

export function thresholdMetrics(
  points: readonly SeriesPoint[],
  threshold: number,
): ThresholdMetrics {
  let candidateCount = 0;
  let primeHits = 0;
  let actualPrimes = 0;
  for (const p of points) {
    if (p.prime) actualPrimes++;
    if (!p.finite) continue;
    if (p.y >= threshold) {
      candidateCount++;
      if (p.prime) primeHits++;
    }
  }
  return {
    count: points.length,
    candidateCount,
    primeHits,
    actualPrimes,
    precision: candidateCount === 0 ? 0 : primeHits / candidateCount,
    recall: actualPrimes === 0 ? 0 : primeHits / actualPrimes,
    threshold,
  };
}

/**
 * Evaluate f over [start, end], mark primes via one sieve, attach energy and
 * threshold status. Reuses the sieve — no per-point trial division for primality.
 */
export function buildIntegerSeries(
  start: number,
  end: number,
  fn: IntegerFn,
  threshold = 1,
  primes: readonly number[] = ENERGY_PRIMES,
): SeriesResult {
  const range = normalizeIntegerRange(start, end);
  const primeList = sieve(range.end);
  const primeSet = new Set(primeList);
  const points: SeriesPoint[] = [];
  const raw: number[] = [];

  for (let n = range.start; n <= range.end; n++) {
    let y = 0;
    let finite = true;
    try {
      y = fn(n);
      if (typeof y !== "number" || !Number.isFinite(y)) {
        finite = false;
        y = NaN;
      }
    } catch {
      finite = false;
      y = NaN;
    }
    const prime = primeSet.has(n);
    const composite = n > 1 && !prime;
    const energy = survivalEnergy(n, primes);
    const fullEnergy = fullSurvivalEnergy(n, primes);
    const survived = n >= 2 && energy === fullEnergy;
    const aboveThreshold = finite && y >= threshold;
    points.push({
      n,
      y,
      finite,
      prime,
      composite,
      factors: composite || n === 1 ? primeFactors(n) : [n],
      energy,
      fullEnergy,
      survived,
      aboveThreshold,
    });
    raw.push(finite ? y : NaN);
  }

  const scale = buildYScale(raw);
  const metrics = thresholdMetrics(points, threshold);
  return { range, points, scale, metrics };
}

// ── Strict allowlisted integer expression compiler ──────────────────────────

function tokenize(source: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  const s = source;

  const push = (kind: TokKind, value: string, pos: number): void => {
    tokens.push({ kind, value, pos });
  };

  while (i < s.length) {
    const c = s[i];
    if (c <= " ") {
      i++;
      continue;
    }
    // Disallow property access, brackets, braces, semicolons, quotes, backticks.
    if (c === "." || c === "[" || c === "]" || c === "{" || c === "}"
      || c === ";" || c === ":" || c === "?" || c === "\\"
      || c === "\"" || c === "'" || c === "`" || c === "@" || c === "#"
      || c === "$" || c === "~" || c === "|") {
      // Allow || via two-char op below — single | is rejected.
      if (c === "|" && s[i + 1] === "|") {
        push("op", "||", i);
        i += 2;
        continue;
      }
      throw new Error(`Unsupported character '${c}' at position ${i}`);
    }
    if (c === "&") {
      if (s[i + 1] === "&") {
        push("op", "&&", i);
        i += 2;
        continue;
      }
      throw new Error(`Unsupported character '&' at position ${i}`);
    }
    if (c === "(") {
      push("lparen", c, i);
      i++;
      continue;
    }
    if (c === ")") {
      push("rparen", c, i);
      i++;
      continue;
    }
    if (c === ",") {
      push("comma", c, i);
      i++;
      continue;
    }
    // Numbers (no exponent form — keeps the grammar simple and safe).
    if ((c >= "0" && c <= "9") || (c === "." && s[i + 1] >= "0" && s[i + 1] <= "9")) {
      // Leading dot already rejected above unless part of number — handle plain decimals.
      if (c === ".") throw new Error(`Unsupported character '.' at position ${i}`);
      const start = i;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      if (s[i] === ".") {
        i++;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") i++;
      }
      // Reject scientific notation and trailing identifiers glued on.
      if (s[i] === "e" || s[i] === "E") {
        throw new Error("Scientific notation is not allowed");
      }
      push("num", s.slice(start, i), start);
      continue;
    }
    // Identifiers
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      const start = i;
      i++;
      while (
        i < s.length
        && ((s[i] >= "a" && s[i] <= "z")
          || (s[i] >= "A" && s[i] <= "Z")
          || (s[i] >= "0" && s[i] <= "9")
          || s[i] === "_")
      ) {
        i++;
      }
      const word = s.slice(start, i);
      const lower = word.toLowerCase();
      if (FORBIDDEN_WORDS.has(lower)) {
        throw new Error(`Forbidden identifier '${word}'`);
      }
      push("id", word, start);
      continue;
    }
    // Multi-char and single-char operators
    const two = s.slice(i, i + 2);
    if (
      two === "**" || two === "==" || two === "!=" || two === "<=" || two === ">="
      || two === "||" || two === "&&"
    ) {
      push("op", two, i);
      i += 2;
      continue;
    }
    if ("+-*/%<>=!".includes(c)) {
      // Bare '=' is assignment — reject. '==' handled above.
      if (c === "=") throw new Error("Assignment is not allowed");
      push("op", c, i);
      i++;
      continue;
    }
    throw new Error(`Unsupported character '${c}' at position ${i}`);
  }
  push("eof", "", i);
  return tokens;
}

type EvalNode = (n: number) => number;

function toBool01(v: number | boolean): number {
  return v ? 1 : 0;
}

function numOrNaN(v: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
}

class Parser {
  private i = 0;
  constructor(private readonly tokens: Tok[]) {}

  parse(): EvalNode {
    const node = this.parseOr();
    if (this.peek().kind !== "eof") {
      throw new Error(`Unexpected token '${this.peek().value}'`);
    }
    return node;
  }

  private peek(): Tok {
    return this.tokens[this.i];
  }

  private advance(): Tok {
    return this.tokens[this.i++];
  }

  private matchOp(...ops: string[]): string | null {
    const t = this.peek();
    if (t.kind === "op" && ops.includes(t.value)) {
      this.advance();
      return t.value;
    }
    return null;
  }

  private parseOr(): EvalNode {
    let left = this.parseAnd();
    while (this.matchOp("||")) {
      const right = this.parseAnd();
      const L = left;
      const R = right;
      left = (n) => toBool01(L(n) || R(n));
    }
    return left;
  }

  private parseAnd(): EvalNode {
    let left = this.parseEquality();
    while (this.matchOp("&&")) {
      const right = this.parseEquality();
      const L = left;
      const R = right;
      left = (n) => toBool01(L(n) && R(n));
    }
    return left;
  }

  private parseEquality(): EvalNode {
    let left = this.parseComparison();
    for (;;) {
      const op = this.matchOp("==", "!=");
      if (!op) break;
      const right = this.parseComparison();
      const L = left;
      const R = right;
      left = op === "=="
        ? (n) => toBool01(L(n) === R(n))
        : (n) => toBool01(L(n) !== R(n));
    }
    return left;
  }

  private parseComparison(): EvalNode {
    let left = this.parseTerm();
    for (;;) {
      const op = this.matchOp("<", ">", "<=", ">=");
      if (!op) break;
      const right = this.parseTerm();
      const L = left;
      const R = right;
      left = (n) => {
        const a = L(n);
        const b = R(n);
        if (op === "<") return toBool01(a < b);
        if (op === ">") return toBool01(a > b);
        if (op === "<=") return toBool01(a <= b);
        return toBool01(a >= b);
      };
    }
    return left;
  }

  private parseTerm(): EvalNode {
    let left = this.parseFactor();
    for (;;) {
      const op = this.matchOp("+", "-");
      if (!op) break;
      const right = this.parseFactor();
      const L = left;
      const R = right;
      left = op === "+"
        ? (n) => L(n) + R(n)
        : (n) => L(n) - R(n);
    }
    return left;
  }

  private parseFactor(): EvalNode {
    let left = this.parseUnary();
    for (;;) {
      const op = this.matchOp("*", "/", "%");
      if (!op) break;
      const right = this.parseUnary();
      const L = left;
      const R = right;
      if (op === "*") left = (n) => L(n) * R(n);
      else if (op === "/") left = (n) => L(n) / R(n);
      else left = (n) => L(n) % R(n);
    }
    return left;
  }

  private parseUnary(): EvalNode {
    const op = this.matchOp("+", "-", "!");
    if (op === "+") {
      const inner = this.parseUnary();
      return (n) => +inner(n);
    }
    if (op === "-") {
      const inner = this.parseUnary();
      return (n) => -inner(n);
    }
    if (op === "!") {
      const inner = this.parseUnary();
      return (n) => toBool01(!inner(n));
    }
    return this.parsePower();
  }

  private parsePower(): EvalNode {
    const base = this.parsePrimary();
    if (this.matchOp("**")) {
      // Right-associative: a ** b ** c = a ** (b ** c)
      const exp = this.parseUnary();
      return (n) => base(n) ** exp(n);
    }
    return base;
  }

  private parsePrimary(): EvalNode {
    const t = this.peek();
    if (t.kind === "num") {
      this.advance();
      const value = Number(t.value);
      if (!Number.isFinite(value)) throw new Error(`Invalid number '${t.value}'`);
      return () => value;
    }
    if (t.kind === "id") {
      this.advance();
      const name = t.value;
      const lower = name.toLowerCase();
      if (this.peek().kind === "lparen") {
        this.advance(); // (
        const args: EvalNode[] = [];
        if (this.peek().kind !== "rparen") {
          args.push(this.parseOr());
          while (this.peek().kind === "comma") {
            this.advance();
            args.push(this.parseOr());
          }
        }
        if (this.peek().kind !== "rparen") throw new Error(`Expected ')' after ${name}(...)`);
        this.advance();
        return this.bindCall(lower, name, args);
      }
      if (lower === "n") return (n) => n;
      if (Object.prototype.hasOwnProperty.call(CONSTANTS, lower)) {
        const c = CONSTANTS[lower];
        return () => c;
      }
      throw new Error(`Unknown identifier '${name}'`);
    }
    if (t.kind === "lparen") {
      this.advance();
      const inner = this.parseOr();
      if (this.peek().kind !== "rparen") throw new Error("Expected ')'");
      this.advance();
      return inner;
    }
    throw new Error(t.kind === "eof" ? "Unexpected end of expression" : `Unexpected token '${t.value}'`);
  }

  private bindCall(lower: string, name: string, args: EvalNode[]): EvalNode {
    const arity = args.length;
    const a0 = args[0];
    const a1 = args[1];

    // Number-theory helpers — arguments must stay inside MAX_INTEGER_LAB_HELPER_ARG.
    if (lower === "isprime") {
      if (arity !== 1) throw new Error("isprime(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), (v) => (isPrime(v) ? 1 : 0));
    }
    if (lower === "phi") {
      if (arity !== 1) throw new Error("phi(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), eulerTotient);
    }
    if (lower === "mu") {
      if (arity !== 1) throw new Error("mu(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), mobius);
    }
    if (lower === "omega") {
      if (arity !== 1) throw new Error("omega(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), omega);
    }
    if (lower === "bigomega") {
      if (arity !== 1) throw new Error("bigomega(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), bigOmega);
    }
    if (lower === "gcd") {
      if (arity !== 2) throw new Error("gcd(a, b) takes 2 arguments");
      return (n) => gcdInt(a0(n), a1(n));
    }
    if (lower === "lcm") {
      if (arity !== 2) throw new Error("lcm(a, b) takes 2 arguments");
      return (n) => lcmInt(a0(n), a1(n));
    }
    if (lower === "energy" || lower === "survival") {
      if (arity !== 1) throw new Error("energy(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), survivalEnergy);
    }
    if (lower === "fullenergy") {
      if (arity !== 1) throw new Error("fullenergy(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), fullSurvivalEnergy);
    }
    if (lower === "factors") {
      if (arity !== 1) throw new Error("factors(n) takes 1 argument");
      return (n) => guardedUnary(a0(n), (v) => primeFactors(v).length);
    }

    if (Object.prototype.hasOwnProperty.call(MATH_FNS, lower)) {
      const mathFn = MATH_FNS[lower];
      if (lower === "atan2" || lower === "hypot" || lower === "pow" || lower === "max" || lower === "min") {
        if (arity < 1) throw new Error(`${name}() needs arguments`);
        return (n) => numOrNaN(mathFn(...args.map((fn) => fn(n))));
      }
      if (arity !== 1) throw new Error(`${name}(x) takes 1 argument`);
      return (n) => numOrNaN(mathFn(a0(n)));
    }

    throw new Error(`Unknown function '${name}'`);
  }
}

// Fix parsePrimary function-call path — rewrite cleanly without the half-state bug.
// The class above has a subtle issue: when we see id + lparen we advance lparen then
// call finishCall which parses args. The _preArgs path is dead. That's fine.

/**
 * Compile a strict allowlisted integer expression in n.
 * Does not use new Function / eval. Booleans coerce to 1/0.
 */
export function compileIntegerExpr(expr: string): IntegerFn {
  const source = expr.trim();
  if (!source) throw new Error("Expression is empty");
  if (source.length > 400) throw new Error("Expression is too long");
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  const fn = parser.parse();
  // Probe a few integers so arity/runtime issues surface at compile time.
  for (const probe of [0, 1, 2, 6, 9, 30]) {
    const value = fn(probe);
    if (typeof value !== "number") {
      throw new Error("Expression did not evaluate to a number");
    }
  }
  return (n: number) => {
    const value = fn(n);
    return typeof value === "number" ? value : Number.NaN;
  };
}

/** Compile without throwing. */
export function tryCompileIntegerExpr(expr: string): CompileIntegerResult {
  try {
    return { fn: compileIntegerExpr(expr), error: "" };
  } catch (e) {
    return { fn: null, error: (e as Error).message || "Invalid expression" };
  }
}

/**
 * Map an instanced-mesh instance id back to its integer when the plotted
 * range does not start at 1.
 */
export function instanceIdToInteger(instanceId: number, start: number): number {
  return start + instanceId;
}

export function integerToInstanceId(n: number, start: number, end: number): number | null {
  if (n < start || n > end) return null;
  return n - start;
}

/**
 * Compact lab readout formatting. Strips only fractional trailing zeros so
 * values like 150000.1 (toPrecision → "150000") are not corrupted to "15".
 */
export function formatIntegerLabNumber(value: number): string {
  if (!Number.isFinite(value)) return "non-finite";
  if (Number.isInteger(value)) return value.toLocaleString();
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(3);
  const text = value.toPrecision(6);
  if (/e/i.test(text)) return text;
  // Integer-looking significant digit strings must keep their trailing zeros.
  if (!text.includes(".")) return text;
  return text.replace(/0+$/, "").replace(/\.$/, "");
}
