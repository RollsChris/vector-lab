/** Lightweight complex-number utilities for the Complex Numbers lesson. */

export interface Complex {
  re: number;
  im: number;
}

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function scale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function conjugate(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function modulus(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function argument(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

export function polar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

export function pow(a: Complex, n: number): Complex {
  const r = Math.pow(modulus(a), n);
  const theta = argument(a) * n;
  return polar(r, theta);
}

export function toPolar(a: Complex): { r: number; theta: number } {
  return { r: modulus(a), theta: argument(a) };
}

export function format(a: Complex, digits = 2): string {
  const r = a.re.toFixed(digits).replace(/\.00$/, "");
  const i = Math.abs(a.im).toFixed(digits).replace(/\.00$/, "");
  if (Math.abs(a.im) < 1e-10) return r;
  if (Math.abs(a.re) < 1e-10) return a.im > 0 ? `${i}i` : `-${i}i`;
  const sign = a.im >= 0 ? "+" : "-";
  return `${r} ${sign} ${i}i`;
}
