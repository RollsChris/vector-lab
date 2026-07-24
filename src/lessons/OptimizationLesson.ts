import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivative, secondDerivative, stationaryPoints } from "../math/calculus";
import { tryCompile1, type Fn1 } from "../math/expr";
import { curveXY, marker, updateCurveXY, tip } from "./helpers";
import "./formulaDerivations/calculus";

const COLORS = {
  f: 0x79c0ff,
  fPrime: 0xffa657,
  critical: 0x7ee787,
};

/**
 * Lesson: Optimization.
 *
 * Plot a function, show its derivative, and find/classify stationary points.
 * Presets cover common calculus optimisation stories: box volume, rectangle area,
 * least distance, etc.
 */
export class OptimizationLesson implements Lesson {
  readonly id = "optimization";
  readonly title = "Optimization";
  readonly blurb = "Find the best value with calculus";
  readonly category = "Calculus" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["differentiation"] as const;

  private group = new THREE.Group();
  private curve!: THREE.Line;
  private deriv!: THREE.Line;
  private critGroup = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;

  private f: Fn1 = (x) => x * x * x - 3 * x;
  private params = {
    expr: "x*x*x - 3*x",
    showDerivative: true,
    xMin: -3,
    xMax: 3,
    preset: "Cubic explore",
  };

  private presets: Record<string, { expr: string; xMin: number; xMax: number; note: string }> = {
    "Cubic explore": { expr: "x*x*x - 3*x", xMin: -3, xMax: 3, note: "Find the local max and min of a cubic." },
    "Box volume": { expr: "x*(10 - 2*x)*(10 - 2*x)", xMin: 0, xMax: 5, note: "Cut squares of side x from a 10×10 sheet and fold the box. What x gives the biggest volume?" },
    "Rectangle area": { expr: "x*(20 - x)", xMin: 0, xMax: 20, note: "A rectangle with perimeter 20 has area x(20 − x)." },
    "Hill climb": { expr: "sin(x) + 0.5*x", xMin: -6, xMax: 6, note: "A sinusoidal landscape with a steady uphill tilt." },
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
    this.curve = curveXY(this.f, this.params.xMin, this.params.xMax, 400, COLORS.f);
    this.deriv = curveXY((x) => derivative(this.f, x), this.params.xMin, this.params.xMax, 400, COLORS.fPrime);
    this.group.add(this.curve, this.deriv, this.critGroup);

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
    tip(g.add(this.params, "expr").name("f(x)"), "Function to optimise").onFinishChange(() => this.onEdit());
    tip(g.add(this.params, "xMin", -10, 10, 0.1).name("Left edge"), "Left edge of the viewing window").onChange(() => this.update());
    tip(g.add(this.params, "xMax", -10, 10, 0.1).name("Right edge"), "Right edge of the viewing window").onChange(() => this.update());
    tip(g.add(this.params, "showDerivative").name("Show f′(x)"), "Toggle the derivative curve").onChange(() => this.update());
    tip(g.add(this.params, "preset", Object.keys(this.presets)).name("Preset"), "Load a classic optimisation problem").onChange((name: string) => {
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
    updateCurveXY(this.curve, this.f, this.params.xMin, this.params.xMax, 400);
    updateCurveXY(this.deriv, (x) => derivative(this.f, x), this.params.xMin, this.params.xMax, 400);
    this.update();
  }

  private update(): void {
    this.deriv.visible = this.params.showDerivative;

    // Find and classify stationary points.
    this.critGroup.clear();
    const points = stationaryPoints(this.f, this.params.xMin, this.params.xMax, 400);
    const classified: { x: number; y: number; type: string }[] = [];

    for (const x of points) {
      const y = this.f(x);
      const sd = secondDerivative(this.f, x);
      const type = sd > 0.01 ? "minimum" : sd < -0.01 ? "maximum" : "stationary";
      const color = type === "minimum" ? 0x3fb950 : type === "maximum" ? 0xff7b72 : COLORS.critical;
      const m = marker(color, 0.14);
      m.position.set(x, y, 0.1);
      this.critGroup.add(m);
      classified.push({ x, y, type });
    }

    const tableRows = classified
      .sort((a, b) => a.x - b.x)
      .map((p) => `<li>${p.type} at x = ${p.x.toFixed(2)}, f(x) = ${p.y.toFixed(2)}</li>`)
      .join("");

    this.setInfo(`
      <h2>Optimization</h2>
      <p>Calculus finds the best value. The recipe: compute <b>f′(x)</b>, set it to zero, then use <b>f″(x)</b> to classify each point.</p>
      <div class="formula" data-derivation="optimization-stationary">
        <div class="formula-label">Stationary candidates</div>
        <div class="formula-body">f′(x*) = 0</div>
        <div class="formula-note">A smooth interior maximum or minimum has a horizontal tangent.</div>
      </div>
      <div class="formula" data-derivation="second-derivative-test">
        <div class="formula-label">Second-derivative test</div>
        <div class="formula-body">f″(x*) &gt; 0 ⇒ minimum &nbsp;&nbsp; f″(x*) &lt; 0 ⇒ maximum</div>
        <div class="formula-note">Positive curvature bends upward into a valley; negative curvature bends downward into a peak.</div>
      </div>
      <ul>
        <li>f′(x) = 0 &rarr; possible max/min</li>
        <li>f″(x) &gt; 0 &rarr; minimum (smiley cup)</li>
        <li>f″(x) &lt; 0 &rarr; maximum (sad cup)</li>
      </ul>
      <p>Critical points found:</p>
      <ul>${tableRows || "<li>None in the current window</li>"}</ul>
      <p class="example"><b>Try it:</b> choose the "Box volume" preset and confirm the maximum volume occurs when the cut-out squares are about 1.67 units on each side.</p>
    `);
  }
}
