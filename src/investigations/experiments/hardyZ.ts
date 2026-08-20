/**
 * Bounded Hardy Z-function numerics for the Investigations workbench.
 *
 * Z(t) = exp(i θ(t)) · ζ(1/2 + it) is real-valued for real t. We approximate:
 *   - ζ via the alternating Dirichlet eta series (valid for Re(s) > 0)
 *   - θ via Stirling log-Γ with upward recurrence for moderate t
 *
 * Finite truncations are numerical evidence only — never a proof about all zeros.
 */

export interface Complex {
  re: number;
  im: number;
}

export function c(re: number, im = 0): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cDiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
}

export function cExp(a: Complex): Complex {
  const e = Math.exp(a.re);
  return { re: e * Math.cos(a.im), im: e * Math.sin(a.im) };
}

export function cLog(a: Complex): Complex {
  return { re: Math.log(Math.hypot(a.re, a.im)), im: Math.atan2(a.im, a.re) };
}

/** n^{-s} for positive integer n. */
export function powNegS(n: number, re: number, im: number): Complex {
  const ln = Math.log(n);
  const mag = Math.exp(-re * ln);
  const ang = -im * ln;
  return { re: mag * Math.cos(ang), im: mag * Math.sin(ang) };
}

/** Dirichlet eta η(s) = Σ (-1)^{n-1} n^{-s}, truncated. */
export function dirichletEta(re: number, im: number, terms: number): Complex {
  const nTerms = Math.max(1, Math.floor(terms));
  let sum = c(0, 0);
  for (let n = 1; n <= nTerms; n++) {
    const term = powNegS(n, re, im);
    sum = n % 2 === 1 ? cAdd(sum, term) : cSub(sum, term);
  }
  return sum;
}

/** ζ(s) = η(s) / (1 - 2^{1-s}) for s ≠ 1 + 2πik / log 2. */
export function zetaFromEta(re: number, im: number, terms: number): Complex {
  const eta = dirichletEta(re, im, terms);
  // 2^{1-s} = exp((1-s) log 2)
  const twoPow = cExp(c((1 - re) * Math.LN2, -im * Math.LN2));
  const denom = cSub(c(1, 0), twoPow);
  return cDiv(eta, denom);
}

/**
 * log Γ(z) via rising factorial to |z| large, then Stirling series.
 * Enough accuracy for θ(t) on a modest plotting window.
 */
export function logGamma(re: number, im: number): Complex {
  // Shift z → z+N so |z+N| is comfortable for Stirling.
  let shift = 0;
  let zr = re;
  let zi = im;
  const target = 8;
  while (Math.hypot(zr, zi) < target) {
    zr += 1;
    shift += 1;
  }

  const logZ = cLog(c(zr, zi));
  // (z-1/2) log z - z + 1/2 log(2π) + 1/(12z) - 1/(360 z^3)
  let result = cSub(cMul(c(zr - 0.5, zi), logZ), c(zr, zi));
  result = cAdd(result, c(0.5 * Math.log(2 * Math.PI), 0));
  const inv = cDiv(c(1, 0), c(zr, zi));
  result = cAdd(result, cScale(inv, 1 / 12));
  const inv3 = cMul(cMul(inv, inv), inv);
  result = cSub(result, cScale(inv3, 1 / 360));

  // Divide out the rising factorial: Γ(z) = Γ(z+N) / (z(z+1)...(z+N-1))
  for (let k = 0; k < shift; k++) {
    result = cSub(result, cLog(c(re + k, im)));
  }
  return result;
}

/** Riemann–Siegel theta θ(t) = arg Γ(1/4 + i t/2) - (t/2) log π. */
export function riemannSiegelTheta(t: number): number {
  if (t === 0) return 0;
  const lg = logGamma(0.25, t / 2);
  return lg.im - (t / 2) * Math.log(Math.PI);
}

/**
 * Hardy Z-function Z(t) ≈ exp(i θ(t)) · ζ(1/2 + it).
 * Imaginary part should be near zero when the approximation is healthy.
 */
export function hardyZ(
  t: number,
  terms = 4000,
): { z: number; zeta: Complex; theta: number; imagResidual: number } {
  const theta = riemannSiegelTheta(t);
  const zeta = zetaFromEta(0.5, t, terms);
  const phase = cExp(c(0, theta));
  const rotated = cMul(phase, zeta);
  return {
    z: rotated.re,
    zeta,
    theta,
    imagResidual: rotated.im,
  };
}

/** Sample Z on [tMin, tMax] inclusive. */
export function sampleHardyZ(
  tMin: number,
  tMax: number,
  samples: number,
  terms = 2500,
): { t: number; z: number }[] {
  const n = Math.max(2, Math.floor(samples));
  const out: { t: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = tMin + ((tMax - tMin) * i) / (n - 1);
    out.push({ t, z: hardyZ(t, terms).z });
  }
  return out;
}

/** Detect simple sign-change brackets in a sample path. */
export function signChanges(samples: readonly { t: number; z: number }[]): { tLeft: number; tRight: number }[] {
  const hits: { tLeft: number; tRight: number }[] = [];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    if (a.z === 0 || b.z === 0) continue;
    if (Math.sign(a.z) !== Math.sign(b.z)) {
      hits.push({ tLeft: a.t, tRight: b.t });
    }
  }
  return hits;
}
