import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, segment, tip } from "./helpers";
import { transformedFn, type TransformParams } from "../math/functionsGraphs";
import { tryCompile1, type Fn1 } from "../math/expr";

/**
 * Graph Transformations.
 *
 * A faint base curve stays fixed while sliders move a bright copy: vertical/horizontal
 * shift, vertical/horizontal stretch, and reflections in each axis. The panel names the
 * transformed equation and explains the "inside vs outside" rule.
 */
export class GraphTransformationsLesson implements Lesson {
  readonly id = "graph-transformations";
  readonly title = "Graph Transformations";
  readonly blurb = "Shift, stretch and reflect any curve";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["functions-and-graphs"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private baseCurve!: THREE.Line;
  private movedCurve!: THREE.Line;
  private base: Fn1 = (x) => x * x;

  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 400;

  private readonly params = {
    expr: "x*x",
    k: 0,
    h: 0,
    a: 1,
    b: 1,
    reflectX: false,
    reflectY: false,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 15), new THREE.Vector3(0, 0.5, 0));

    this.buildGrid();
    this.recompile();
    this.baseCurve = curveXY((x) => this.clamp(this.base(x)), this.a, this.b, this.n, 0x484f58);
    this.movedCurve = curveXY((x) => this.clamp(this.transformed()(x)), this.a, this.b, this.n, 0x5db4ff);
    this.group.add(this.baseCurve, this.movedCurve);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(14, 14, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    this.group.add(grid);
    this.group.add(segment(new THREE.Vector3(-7, 0, 0), new THREE.Vector3(7, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 7, 0), 0x8b949e));
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "expr").name("base f(x)"),
      "The starting curve, e.g. x*x, sin(x), abs(x).")
      .onFinishChange(() => { this.recompile(); this.rebuild(true); });
    tip(g.add(this.params, "a", -3, 3, 0.1).name("vertical stretch a"),
      "Multiplies the output: taller for |a|>1, squashed for |a|<1.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "b", 0.25, 3, 0.05).name("horizontal stretch b"),
      "Multiplies the input: >1 squeezes the curve in, <1 stretches it out.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "h", -4, 4, 0.1).name("horizontal shift h"),
      "Slides left/right. Positive h moves the curve right.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "k", -4, 4, 0.1).name("vertical shift k"),
      "Slides up/down. Positive k moves the curve up.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "reflectX").name("reflect in x-axis"), "Flip top-to-bottom.").onChange(() => this.rebuild());
    tip(g.add(this.params, "reflectY").name("reflect in y-axis"), "Flip left-to-right.").onChange(() => this.rebuild());
  }

  private recompile(): void {
    const r = tryCompile1(this.params.expr);
    if (r.fn) this.base = r.fn;
  }

  private transformParams(): TransformParams {
    const p = this.params;
    return { h: p.h, k: p.k, a: p.a, b: p.b, reflectX: p.reflectX, reflectY: p.reflectY };
  }

  private transformed(): Fn1 {
    return transformedFn(this.base, this.transformParams());
  }

  private clamp(v: number): number {
    return Number.isFinite(v) ? THREE.MathUtils.clamp(v, -7, 7) : NaN;
  }

  private rebuild(baseChanged = false): void {
    if (baseChanged) updateCurveXY(this.baseCurve, (x) => this.clamp(this.base(x)), this.a, this.b, this.n);
    const t = this.transformed();
    updateCurveXY(this.movedCurve, (x) => this.clamp(t(x)), this.a, this.b, this.n);
    this.renderInfo();
  }

  private renderInfo(): void {
    const p = this.params;
    this.setInfo(`
      <h2>Graph Transformations</h2>
      <p>Start with a base curve (grey) and move a bright copy with the sliders. The whole
      family <code>y = a·f(b(x − h)) + k</code> comes from four moves plus two flips.</p>
      <div class="readout">
        <div><span>Base</span><b>y = f(x) = ${this.escape(p.expr)}</b></div>
        <div><span>Transformed</span><b>y = ${this.fmt(p.a)}·f(${this.fmt(p.b)}(x ${this.sign(-p.h)} ${this.fmt(Math.abs(p.h))})) ${this.sign(p.k)} ${this.fmt(Math.abs(p.k))}</b></div>
        <div><span>Reflections</span><b>${this.reflectText()}</b></div>
      </div>
      <div class="course">
        <h3>Inside vs outside</h3>
        <ul>
          <li><b>Outside</b> changes (a and k) act on the <i>output</i> and behave as you expect:
          <code>·a</code> stretches vertically, <code>+k</code> lifts up.</li>
          <li><b>Inside</b> changes (b and h) act on the <i>input</i> and feel backwards:
          <code>x − h</code> moves <i>right</i> by h, and <code>·b</code> squeezes horizontally.</li>
        </ul>
      </div>
      <p class="example"><b>Try it:</b> set the base to <code>sin(x)</code>, then raise the
      horizontal stretch b — the waves bunch up as the period shrinks.</p>
    `);
  }

  private reflectText(): string {
    const parts: string[] = [];
    if (this.params.reflectX) parts.push("x-axis");
    if (this.params.reflectY) parts.push("y-axis");
    return parts.length ? parts.join(" and ") : "none";
  }

  private sign(n: number): string {
    return n >= 0 ? "+" : "−";
  }

  private escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return parseFloat(n.toFixed(3)).toString();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    group.clear();
  }
}
