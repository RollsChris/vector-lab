import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tryCompile1, type Fn1 } from "../math/expr";
import { riemann, simpson, type RiemannRule } from "../math/calculus";
import { curveXY, updateCurveXY, heat, tip } from "./helpers";
import "./formulaDerivations/calculus";

/**
 * Lesson 13 — Integration.
 * Shows the area under y = f(x) on [a, b] as Riemann rectangles (or trapezoids).
 * Increasing n visibly converges the approximation toward the exact integral
 * (computed with Simpson's rule as a reference).
 */
export class IntegrationLesson implements Lesson {
  readonly id = "integration";
  readonly title = "13 · Integration";
  readonly blurb = "Area under the curve";
  readonly category = "Calculus" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["differentiation"] as const;

  private group = new THREE.Group();
  private bars = new THREE.Group();
  private curve!: THREE.Line;
  private accumCurve!: THREE.Line;
  private accumDot!: THREE.Mesh;
  private setInfo!: (html: string) => void;

  private f: Fn1 = (x) => Math.sin(x) + 1.5;

  private readonly params = {
    expr: "sin(x) + 1.5",
    a: -3,
    b: 3,
    n: 12,
    rule: "midpoint" as RiemannRule,
    showAccumulation: false,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.bars);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 2, 12),
      new THREE.Vector3(0, 0, 0),
    );

    this.recompile();
    this.curve = curveXY(this.f, -7, 7, 500, 0x5db4ff);
    this.accumCurve = curveXY(() => 0, -7, 7, 500, 0x7ee787);
    this.accumDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x7ee787 }),
    );
    this.group.add(this.curve, this.accumCurve, this.accumDot);

    const g = ctx.gui;
    tip(
      g.add(this.params, "expr").name("f(x)"),
      "The curve whose area you measure. A formula in x.",
    ).onFinishChange(() => this.onEdit());
    tip(
      g.add(this.params, "a", -7, 7, 0.1).name("a (left edge)"),
      "Left edge of the region you are measuring the area of.",
    ).onChange(() => this.rebuild());
    tip(
      g.add(this.params, "b", -7, 7, 0.1).name("b (right edge)"),
      "Right edge of the region you are measuring the area of.",
    ).onChange(() => this.rebuild());
    tip(
      g.add(this.params, "n", 1, 200, 1).name("Slices  n"),
      "How many bars the area is chopped into. More slices = closer to exact.",
    ).onChange(() => this.rebuild());
    tip(
      g.add(this.params, "rule", ["left", "right", "midpoint", "trapezoid"]).name("Bar rule"),
      "Where each bar samples the curve: left edge, right edge, middle, or a slanted top (trapezoid).",
    ).onChange(() => this.rebuild());
    tip(
      g.add(this.params, "showAccumulation").name("Show accumulation F(x)"),
      "Plot the accumulated area from a up to each x — the Fundamental Theorem of Calculus in action.",
    ).onChange(() => this.rebuild());

    this.rebuild();
  }

  private onEdit(): void {
    this.recompile();
    updateCurveXY(this.curve, this.f, -7, 7, 500);
    this.rebuild();
  }

  private recompile(): void {
    const r = tryCompile1(this.params.expr);
    if (r.fn) this.f = r.fn;
  }

  private clearBars(): void {
    this.bars.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) (m.material as THREE.Material).dispose();
    });
    this.bars.clear();
  }

  private rebuild(): void {
    this.clearBars();
    const { a, b, n, rule } = this.params;
    if (b <= a) return;

    const { samples, total } = riemann(this.f, a, b, Math.round(n), rule);
    const maxH = Math.max(...samples.map((s) => Math.abs(s.height)), 1e-6);

    for (const s of samples) {
      const w = s.x1 - s.x0;
      const h = Math.abs(s.height);
      if (h < 1e-6) continue;
      const geo = new THREE.BoxGeometry(w * 0.96, h, 0.2);
      const color = heat(h / maxH);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // Box is centred; lift so its base sits on the x-axis (y=0), signed.
      mesh.position.set((s.x0 + s.x1) / 2, s.height / 2, 0);
      this.bars.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
      );
      edges.position.copy(mesh.position);
      this.bars.add(edges);
    }

    const exact = simpson(this.f, a, b, 2000);
    const err = Math.abs(exact - total);

    // Accumulation function F(x) = ∫_a^x f(t) dt.
    this.accumCurve.visible = this.params.showAccumulation;
    this.accumDot.visible = this.params.showAccumulation;
    if (this.params.showAccumulation) {
      updateCurveXY(this.accumCurve, (x) => {
        if (x <= a) return 0;
        return simpson(this.f, a, x, 200);
      }, -7, 7, 500);
      this.accumDot.position.set(b, exact, 0.2);
    }

    const accumHtml = this.params.showAccumulation
      ? `<p>The <b>green curve</b> is the accumulation function <b>F(x) = ∫<sub>a</sub><sup>x</sup> f(t) dt</b>. Its slope at any point is f(x) — the Fundamental Theorem of Calculus.</p>`
      : "";

    this.setInfo(`
      <h2>Integration</h2>
      <p>The <b>definite integral</b> ∫<sub>a</sub><sup>b</sup> f(x) dx is the signed
      <b>area</b> between the curve and the x-axis. We approximate it by slicing the
      region into <code>n</code> pieces and summing their areas.</p>
      <div class="formula" data-derivation="riemann-sum">
        <div class="formula-label">Finite Riemann sum</div>
        <div class="formula-body">S<sub>n</sub> = Σ f(x<sub>i</sub>*) Δx</div>
        <div class="formula-note">Each slice contributes sampled height × width; the rule selects x<sub>i</sub>*.</div>
      </div>
      <div class="formula" data-derivation="definite-integral">
        <div class="formula-label">Definite integral</div>
        <div class="formula-body">∫<sub>a</sub><sup>b</sup> f(x) dx = lim<sub>n→∞</sub> Σ f(x<sub>i</sub>*) Δx</div>
        <div class="formula-note">The exact signed area is the limit as the widest slice shrinks to zero.</div>
      </div>
      <div class="formula" data-derivation="fundamental-theorem">
        <div class="formula-label">Fundamental Theorem of Calculus</div>
        <div class="formula-body">F(x) = ∫<sub>a</sub><sup>x</sup> f(t) dt &nbsp; ⇒ &nbsp; F′(x) = f(x)</div>
        <div class="formula-note">The slope of accumulated area equals the current height of the original curve.</div>
      </div>
      <div class="readout">
        <div><span>Riemann sum (${rule})</span><b>${total.toFixed(4)}</b></div>
        <div><span>Exact (Simpson)</span><b>${exact.toFixed(4)}</b></div>
        <div><span>Error</span><b>${err.toExponential(2)}</b></div>
      </div>
      ${accumHtml}
      <p>Crank <code>n</code> up: the bars hug the curve and the sum converges to the
      exact value. Area below the axis counts as <b>negative</b> — the inverse of the
      slope idea from the previous lesson.</p>`);
  }

  exit(): void {
    this.clearBars();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }
}
