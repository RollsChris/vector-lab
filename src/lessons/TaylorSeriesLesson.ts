import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tryCompile1, type Fn1 } from "../math/expr";
import { curveXY, updateCurveXY, tip } from "./helpers";
import "./formulaDerivations/calculus";

const COLORS = {
  f: 0x79c0ff,
  taylor: 0xffa657,
};

/**
 * Lesson: Taylor Series.
 *
 * Approximate a function near a point x = a with a polynomial built from the
 * function's derivatives at a. Drag the centre and degree to see the fit improve
 * or diverge.
 */
export class TaylorSeriesLesson implements Lesson {
  readonly id = "taylor-series";
  readonly title = "Taylor Series";
  readonly blurb = "Approximate any function as a polynomial";
  readonly category = "Calculus" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["differentiation"] as const;

  private group = new THREE.Group();
  private curveF!: THREE.Line;
  private curveT!: THREE.Line;
  private setInfo!: (html: string) => void;
  private gui!: GUI;

  private f: Fn1 = Math.sin;
  private params = {
    expr: "sin(x)",
    a: 0,
    n: 3,
    xMin: -6,
    xMax: 6,
    preset: "sin(x)",
  };

  private presets: Record<string, { expr: string; xMin: number; xMax: number }> = {
    "sin(x)": { expr: "sin(x)", xMin: -6, xMax: 6 },
    "exp(x)": { expr: "exp(x)", xMin: -3, xMax: 3 },
    "1/(1-x)": { expr: "1/(1-x)", xMin: -2, xMax: 2 },
    "ln(1+x)": { expr: "log(1+x)", xMin: -0.9, xMax: 3 },
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1, 12),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildAxes();
    this.curveF = curveXY(this.f, this.params.xMin, this.params.xMax, 400, COLORS.f);
    this.curveT = curveXY((x) => this.taylor(x, this.params.a, this.params.n), this.params.xMin, this.params.xMax, 400, COLORS.taylor);
    this.group.add(this.curveF, this.curveT);

    this.buildControls();
    this.update();
  }

  exit(): void {
    this.group.clear();
  }

  private buildAxes(): void {
    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    this.group.add(axis);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "expr").name("f(x)"), "Function to approximate").onFinishChange(() => this.onEdit());
    tip(g.add(this.params, "a", -5, 5, 0.1).name("Centre a"), "Point around which the Taylor polynomial is built").onChange(() => this.update());
    tip(g.add(this.params, "n", 0, 12, 1).name("Degree n"), "Highest power of the polynomial").onChange(() => this.update());
    tip(g.add(this.params, "xMin", -10, 10, 0.1).name("Left edge"), "Left edge of the viewing window").onChange(() => this.update());
    tip(g.add(this.params, "xMax", -10, 10, 0.1).name("Right edge"), "Right edge of the viewing window").onChange(() => this.update());
    tip(g.add(this.params, "preset", Object.keys(this.presets)).name("Preset"), "Load a classic Taylor example").onChange((name: string) => {
      const p = this.presets[name];
      if (p) {
        this.params.expr = p.expr;
        this.params.xMin = p.xMin;
        this.params.xMax = p.xMax;
        this.onEdit();
      }
    });
  }

  private onEdit(): void {
    const r = tryCompile1(this.params.expr);
    if (r.fn) this.f = r.fn;
    updateCurveXY(this.curveF, this.f, this.params.xMin, this.params.xMax, 400);
    updateCurveXY(this.curveT, (x) => this.taylor(x, this.params.a, this.params.n), this.params.xMin, this.params.xMax, 400);
    this.update();
  }

  private update(): void {
    updateCurveXY(this.curveT, (x) => this.taylor(x, this.params.a, this.params.n), this.params.xMin, this.params.xMax, 400);

    const terms: string[] = [];
    for (let k = 0; k <= this.params.n; k++) {
      const d = this.nthDerivative(this.f, this.params.a, k);
      const coeff = d / factorial(k);
      if (Math.abs(coeff) < 1e-8) continue;
      const power = k === 0 ? "" : k === 1 ? "(x−a)" : `(x−a)<sup>${k}</sup>`;
      terms.push(`${coeff.toFixed(3)}${power}`);
    }
    const poly = terms.join(" + ") || "0";

    this.setInfo(`
      <h2>Taylor Series</h2>
      <p>A Taylor polynomial copies the value, slope, curvature and higher derivatives of a function at one point <b>a</b>. The closer you stay to <b>a</b>, the better the fit.</p>
      <div class="formula" data-derivation="taylor-polynomial">
        <div class="formula-label">Degree-${this.params.n} Taylor polynomial about a = ${this.params.a.toFixed(1)}</div>
        <div class="formula-body">T<sub>n</sub>(x) = Σ<sub>k=0</sub><sup>n</sup> f<sup>(k)</sup>(a)(x−a)<sup>k</sup>/k!<br>f(x) ≈ ${poly}</div>
        <div class="formula-note">The generic coefficients force the polynomial to match f and its first n derivatives at a.</div>
      </div>
      <p>At x = a the approximation matches f and its first ${this.params.n} derivatives. Increase the degree to capture more of the function's shape; move the centre to change where the approximation is exact.</p>
      <p class="example"><b>Try it:</b> with f(x) = sin(x) and a = 0, add terms one by one. The odd powers (x, x³, x⁵…) gradually build the sine wave.</p>
    `);
  }

  /** Evaluate the degree-n Taylor polynomial of f at x, centred at a. */
  private taylor(x: number, a: number, n: number): number {
    let sum = 0;
    for (let k = 0; k <= n; k++) {
      const d = this.nthDerivative(this.f, a, k);
      sum += (d / factorial(k)) * Math.pow(x - a, k);
    }
    return sum;
  }

  /** Numerical kth derivative at x using a central-difference stencil. */
  private nthDerivative(f: Fn1, x: number, k: number): number {
    if (k === 0) return f(x);
    const h = 1e-3;
    // Recursively apply central difference.
    const recurse = (g: (x: number) => number, order: number): number => {
      if (order === 0) return g(x);
      return (recurse((t) => g(t + h), order - 1) - recurse((t) => g(t - h), order - 1)) / (2 * h);
    };
    return recurse(f, k);
  }
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
