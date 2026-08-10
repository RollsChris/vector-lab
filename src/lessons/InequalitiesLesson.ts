import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, marker, segment, tip } from "./helpers";
import { solveLinearInequality, quadraticState, type InequalityOp } from "../math/functionsGraphs";

type Mode = "linear" | "quadratic";

/**
 * Inequalities.
 *
 * Linear mode solves a·x + b <op> 0 and draws the solution as a ray on a number line,
 * flipping direction live when a is negative. Quadratic mode shades the region between
 * (or outside) the roots of a parabola.
 */
export class InequalitiesLesson implements Lesson {
  readonly id = "inequalities";
  readonly title = "Inequalities";
  readonly blurb = "Solution sets as rays and shaded regions";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["rearranging-equations", "coordinates-and-lines"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private numberLine!: THREE.Line;
  private ray!: THREE.Line;
  private boundDot = marker(0xffd166, 0.16);
  private curve!: THREE.Line;
  private shade!: THREE.Mesh;
  private lowDot = marker(0xff7b72, 0.14);
  private highDot = marker(0xff7b72, 0.14);

  private readonly xa = -6;
  private readonly xb = 6;
  private readonly n = 400;

  private readonly params = {
    mode: "linear" as Mode,
    a: 2,
    b: -4,
    op: ">" as InequalityOp,
    qa: 1,
    qb: 0,
    qc: -4,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 14), new THREE.Vector3(0, 0.5, 0));

    this.buildScene();
    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    this.numberLine = segment(new THREE.Vector3(-6.5, 0, 0), new THREE.Vector3(6.5, 0, 0), 0x8b949e);
    for (let x = -6; x <= 6; x++) {
      this.group.add(segment(new THREE.Vector3(x, -0.12, 0), new THREE.Vector3(x, 0.12, 0), 0x484f58));
    }
    this.ray = segment(new THREE.Vector3(), new THREE.Vector3(), 0x7ee787);
    (this.ray.material as THREE.LineBasicMaterial).linewidth = 3;

    this.curve = curveXY((x) => this.q(x), this.xa, this.xb, this.n, 0x5db4ff);
    const shadeGeo = new THREE.BufferGeometry();
    shadeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * (this.n + 1)), 3));
    this.shade = new THREE.Mesh(shadeGeo, new THREE.MeshBasicMaterial({
      color: 0xffa657, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false,
    }));

    this.group.add(this.numberLine, this.ray, this.boundDot, this.curve, this.shade, this.lowDot, this.highDot);
  }

  private q(x: number): number {
    const p = this.params;
    return THREE.MathUtils.clamp(p.qa * x * x + p.qb * x + p.qc, -6, 6);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "mode", { "Linear ray": "linear", "Quadratic shade": "quadratic" }).name("Mode"),
      "Switch between a one-variable ray and a shaded quadratic region.")
      .onChange(() => this.rebuild());

    const lin = g.addFolder("Linear:  a·x + b  <op>  0");
    tip(lin.add(this.params, "a", -5, 5, 0.5).name("a"), "Coefficient of x. Negative values flip the inequality.").onChange(() => this.rebuild());
    tip(lin.add(this.params, "b", -8, 8, 0.5).name("b"), "Constant term.").onChange(() => this.rebuild());
    tip(lin.add(this.params, "op", { "<": "<", "≤": "<=", ">": ">", "≥": ">=" }).name("relation"),
      "The inequality sign to solve.").onChange(() => this.rebuild());
    lin.open();

    const quad = g.addFolder("Quadratic:  qa·x² + qb·x + qc  < 0");
    tip(quad.add(this.params, "qa", -3, 3, 0.5).name("qa"), "Curvature.").onChange(() => this.rebuild());
    tip(quad.add(this.params, "qb", -6, 6, 0.5).name("qb"), "Tilt.").onChange(() => this.rebuild());
    tip(quad.add(this.params, "qc", -6, 6, 0.5).name("qc"), "Height.").onChange(() => this.rebuild());
  }

  private rebuild(): void {
    const linear = this.params.mode === "linear";
    this.numberLine.visible = linear;
    this.ray.visible = linear;
    this.boundDot.visible = linear;
    this.curve.visible = !linear;
    this.shade.visible = !linear;
    this.lowDot.visible = false;
    this.highDot.visible = false;

    if (linear) this.rebuildLinear();
    else this.rebuildQuadratic();
    this.renderInfo();
  }

  private rebuildLinear(): void {
    const p = this.params;
    if (Math.abs(p.a) < 1e-9) {
      this.ray.visible = false;
      this.boundDot.visible = false;
      return;
    }
    const sol = solveLinearInequality(p.a, p.b, p.op);
    const bound = THREE.MathUtils.clamp(sol.bound, -6, 6);
    this.boundDot.position.set(bound, 0, 0.06);
    const rightward = sol.op === ">" || sol.op === ">=";
    const end = rightward ? 6.5 : -6.5;
    this.ray.geometry.setFromPoints([
      new THREE.Vector3(bound, 0, 0.02),
      new THREE.Vector3(end, 0, 0.02),
    ]);
  }

  private rebuildQuadratic(): void {
    updateCurveXY(this.curve, (x) => this.q(x), this.xa, this.xb, this.n);
    const s = quadraticState(this.params.qa, this.params.qb, this.params.qc);
    const pos = this.shade.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    // Build a filled band between the curve and the axis where qa·x²+... < 0.
    let idx = 0;
    for (let i = 0; i < this.n; i++) {
      const x0 = this.xa + ((this.xb - this.xa) * i) / this.n;
      const x1 = this.xa + ((this.xb - this.xa) * (i + 1)) / this.n;
      const y0 = this.params.qa * x0 * x0 + this.params.qb * x0 + this.params.qc;
      const y1 = this.params.qa * x1 * x1 + this.params.qb * x1 + this.params.qc;
      const below0 = y0 < 0;
      const below1 = y1 < 0;
      const cy0 = below0 ? THREE.MathUtils.clamp(y0, -6, 6) : 0;
      const cy1 = below1 ? THREE.MathUtils.clamp(y1, -6, 6) : 0;
      // Two triangles making the quad (x0,0)-(x0,cy0)-(x1,cy1)-(x1,0).
      arr[idx++] = x0; arr[idx++] = 0; arr[idx++] = 0;
      arr[idx++] = x0; arr[idx++] = cy0; arr[idx++] = 0;
      arr[idx++] = x1; arr[idx++] = cy1; arr[idx++] = 0;
      arr[idx++] = x0; arr[idx++] = 0; arr[idx++] = 0;
      arr[idx++] = x1; arr[idx++] = cy1; arr[idx++] = 0;
      arr[idx++] = x1; arr[idx++] = 0; arr[idx++] = 0;
    }
    pos.needsUpdate = true;
    this.shade.geometry.computeBoundingSphere();

    if (s.rootCount === 2) {
      this.lowDot.visible = true;
      this.highDot.visible = true;
      this.lowDot.position.set(THREE.MathUtils.clamp(s.roots[0], -6, 6), 0, 0.06);
      this.highDot.position.set(THREE.MathUtils.clamp(s.roots[1], -6, 6), 0, 0.06);
    }
  }

  private renderInfo(): void {
    const p = this.params;
    if (p.mode === "linear") {
      const opSym = { "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[p.op];
      let solText = "";
      let flipNote = "";
      if (Math.abs(p.a) >= 1e-9) {
        const sol = solveLinearInequality(p.a, p.b, p.op);
        const solSym = { "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[sol.op];
        solText = `x ${solSym} ${this.fmt(sol.bound)}`;
        flipNote = sol.flipped
          ? "Because a is negative, dividing both sides flipped the sign."
          : "a is positive, so the sign stays the same.";
      }
      this.setInfo(`
        <h2>Inequalities</h2>
        <p>An inequality has a whole <b>range</b> of answers, not one. The green ray on the
        number line is every x that works.</p>
        <div class="readout">
          <div><span>Inequality</span><b>${this.fmt(p.a)}x ${this.sign(p.b)} ${this.fmt(Math.abs(p.b))} ${opSym} 0</b></div>
          <div><span>Solution</span><b>${solText || "no x (a = 0)"}</b></div>
        </div>
        <div class="course">
          <h3>The one rule to remember</h3>
          <p>Solve it like an equation, with one twist: <b>multiplying or dividing by a
          negative number flips the inequality sign</b>. ${flipNote}</p>
        </div>
        <p class="example"><b>Try it:</b> make <code>a</code> negative and watch the ray jump
        to the other side as the sign flips.</p>
      `);
      return;
    }

    const s = quadraticState(p.qa, p.qb, p.qc);
    let region = "";
    if (s.rootCount === 2) {
      region = p.qa > 0
        ? `between the roots: ${this.fmt(s.roots[0])} < x < ${this.fmt(s.roots[1])}`
        : `outside the roots: x < ${this.fmt(s.roots[0])} or x > ${this.fmt(s.roots[1])}`;
    } else {
      region = "no crossing points on screen for this choice";
    }
    this.setInfo(`
      <h2>Inequalities</h2>
      <p>For a quadratic inequality <code>${this.fmt(p.qa)}x² ${this.sign(p.qb)} ${this.fmt(Math.abs(p.qb))}x ${this.sign(p.qc)} ${this.fmt(Math.abs(p.qc))} &lt; 0</code>
      the answer is where the parabola dips <b>below</b> the axis (shaded orange).</p>
      <div class="readout">
        <div><span>Roots</span><b>${s.rootCount === 2 ? s.roots.map((r) => this.fmt(r)).join(" and ") : "none / repeated"}</b></div>
        <div><span>Opens</span><b>${s.opensUp ? "upward" : "downward"}</b></div>
        <div><span>Solution region</span><b>${region}</b></div>
      </div>
      <div class="course">
        <h3>Reading the shade</h3>
        <p>Find the roots, then decide which side is below the axis. An upward parabola is
        negative <i>between</i> its roots; a downward one is negative <i>outside</i> them.</p>
      </div>
      <p class="example"><b>Try it:</b> flip <code>qa</code> negative and see the shaded solution
      move to the outside of the two roots.</p>
    `);
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
