import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, marker, segment, tip } from "./helpers";
import { quadraticState } from "../math/functionsGraphs";

type Method = "factor" | "complete" | "formula";

/**
 * Quadratics.
 *
 * Sliders a, b, c shape the parabola y = a·x² + b·x + c. Roots, vertex and the
 * discriminant are marked and reported live; a method selector shows the factorised,
 * completed-square or quadratic-formula view of the same quadratic in the panel.
 */
export class QuadraticsLesson implements Lesson {
  readonly id = "quadratics";
  readonly title = "Quadratics";
  readonly blurb = "Parabolas, roots, vertex and the discriminant";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["binomials", "coordinates-and-lines", "functions-and-graphs"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private curve!: THREE.Line;
  private rootDots: THREE.Mesh[] = [];
  private vertexDot = marker(0x7ee787, 0.16);

  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 400;

  private readonly params = {
    a: 1,
    b: -1,
    c: -2,
    method: "factor" as Method,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 15), new THREE.Vector3(0, 0.5, 0));

    this.buildGrid();
    this.curve = curveXY((x) => this.q(x), this.a, this.b, this.n, 0x5db4ff);
    this.group.add(this.curve, this.vertexDot);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.rootDots = [];
    this.group = new THREE.Group();
  }

  private q(x: number): number {
    const p = this.params;
    return THREE.MathUtils.clamp(p.a * x * x + p.b * x + p.c, -7, 7);
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
    tip(g.add(this.params, "a", -3, 3, 0.1).name("a (curvature)"),
      "Stretch and direction. a > 0 opens up, a < 0 opens down, larger |a| is narrower.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "b", -6, 6, 0.1).name("b (tilt)"),
      "Shifts the vertex sideways and tilts the curve.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "c", -6, 6, 0.1).name("c (y-intercept)"),
      "Where the curve crosses the vertical axis.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "method", {
      "Factorised": "factor",
      "Completed square": "complete",
      "Quadratic formula": "formula",
    }).name("Method"), "Choose which algebraic view to read in the panel.")
      .onChange(() => this.renderInfo());
  }

  private rebuild(): void {
    updateCurveXY(this.curve, (x) => this.q(x), this.a, this.b, this.n);
    const state = quadraticState(this.params.a, this.params.b, this.params.c);

    for (const d of this.rootDots) {
      this.group.remove(d);
      d.geometry.dispose();
    }
    this.rootDots = [];
    for (const r of state.roots) {
      if (Math.abs(r) > 7) continue;
      const dot = marker(0xff7b72, 0.15);
      dot.position.set(r, 0, 0.06);
      this.rootDots.push(dot);
      this.group.add(dot);
    }

    this.vertexDot.position.set(
      THREE.MathUtils.clamp(state.vertex.x, -7, 7),
      THREE.MathUtils.clamp(state.vertex.y, -6, 7),
      0.06,
    );

    this.renderInfo();
  }

  private renderInfo(): void {
    const p = this.params;
    const s = quadraticState(p.a, p.b, p.c);
    const rootText = s.rootCount === 0
      ? "no real roots"
      : s.roots.map((r) => this.fmt(r)).join(" and ");
    const discSign = s.disc > 1e-9 ? "positive → two roots"
      : s.disc < -1e-9 ? "negative → no real roots"
      : "zero → one repeated root";

    this.setInfo(`
      <h2>Quadratics</h2>
      <p>A quadratic <code>y = a·x² + b·x + c</code> draws a <b>parabola</b>. Its shape is set
      by the three sliders; where it crosses the x-axis are the <b>roots</b>.</p>
      <div class="readout">
        <div><span>Equation</span><b>y = ${this.fmt(p.a)}x² ${this.sign(p.b)} ${this.fmt(Math.abs(p.b))}x ${this.sign(p.c)} ${this.fmt(Math.abs(p.c))}</b></div>
        <div><span>Opens</span><b>${s.opensUp ? "upward" : "downward"}</b></div>
        <div><span>Vertex</span><b>(${this.fmt(s.vertex.x)}, ${this.fmt(s.vertex.y)})</b></div>
        <div><span>Discriminant b²−4ac</span><b>${this.fmt(s.disc)} (${discSign})</b></div>
        <div><span>Roots</span><b>${rootText}</b></div>
      </div>
      ${this.methodHtml(s)}
      <p class="example"><b>Try it:</b> lower <code>c</code> until the parabola dips through the
      axis — watch the discriminant turn positive and two red roots appear.</p>
    `);
  }

  private methodHtml(s: ReturnType<typeof quadraticState>): string {
    const p = this.params;
    if (this.params.method === "factor") {
      const body = s.rootCount === 2
        ? `<code>y = ${this.fmt(p.a)}(x ${this.sign(-s.roots[0])} ${this.fmt(Math.abs(s.roots[0]))})(x ${this.sign(-s.roots[1])} ${this.fmt(Math.abs(s.roots[1]))})</code>`
        : s.rootCount === 1
        ? `<code>y = ${this.fmt(p.a)}(x ${this.sign(-s.roots[0])} ${this.fmt(Math.abs(s.roots[0]))})²</code>`
        : `This quadratic has no real roots, so it will not factor over the real numbers.`;
      return `<div class="course"><h3>Factorised form</h3>
        <p>Written as a product, the roots are exactly the x values that make a bracket zero.</p>
        <p>${body}</p></div>`;
    }
    if (this.params.method === "complete") {
      const h = s.vertex.x;
      const k = s.vertex.y;
      return `<div class="course"><h3>Completed square</h3>
        <p>Rewriting to <code>a(x − h)² + k</code> exposes the vertex <code>(h, k)</code> directly.</p>
        <p><code>y = ${this.fmt(p.a)}(x ${this.sign(-h)} ${this.fmt(Math.abs(h))})² ${this.sign(k)} ${this.fmt(Math.abs(k))}</code></p></div>`;
    }
    return `<div class="course"><h3>Quadratic formula</h3>
      <p>The roots of any quadratic are <code>x = (−b ± √(b²−4ac)) ÷ (2a)</code>.</p>
      <p>Here <code>x = (${this.fmt(-p.b)} ± √${this.fmt(s.disc)}) ÷ ${this.fmt(2 * p.a)}</code>,
      giving ${s.rootCount === 0 ? "no real solutions" : s.roots.map((r) => this.fmt(r)).join(" and ")}.</p></div>`;
  }

  private sign(n: number): string {
    return n >= 0 ? "+" : "−";
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
