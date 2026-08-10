import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tryCompile1, type Fn1 } from "../math/expr";
import { curveXY, updateCurveXY, marker, segment, tip } from "./helpers";

/**
 * Functions & Graphs.
 *
 * Plot y = f(x), drag an input x along the axis and watch the machine map it to f(x).
 * A vertical-line-test mode drops a movable vertical line to show why a function gives
 * at most one output per input. The panel reports the current mapping and domain.
 */
export class FunctionsAndGraphsLesson implements Lesson {
  readonly id = "functions-and-graphs";
  readonly title = "Functions & Graphs";
  readonly blurb = "A function is a machine: one input, one output";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["coordinates-and-lines", "algebraic-laws"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private curve!: THREE.Line;
  private inputDot = marker(0xffa657, 0.14);
  private outputDot = marker(0x7ee787, 0.14);
  private mapV!: THREE.Line;
  private mapH!: THREE.Line;
  private vlt!: THREE.Line;
  private stopTick?: () => void;

  private f: Fn1 = (x) => 0.4 * x * x - 1;
  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 400;

  private readonly params = {
    expr: "0.4*x*x - 1",
    x: 1.5,
    sweep: false,
    verticalLineTest: false,
    vltX: -2,
  };


  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 14), new THREE.Vector3(0, 0.5, 0));

    this.buildGrid();
    this.recompile();
    this.curve = curveXY(this.f, this.a, this.b, this.n, 0x5db4ff);
    this.mapV = segment(new THREE.Vector3(), new THREE.Vector3(), 0xffa657);
    this.mapH = segment(new THREE.Vector3(), new THREE.Vector3(), 0x7ee787);
    this.vlt = segment(new THREE.Vector3(), new THREE.Vector3(), 0xff7b72);
    this.vlt.visible = false;
    this.group.add(this.curve, this.mapV, this.mapH, this.vlt, this.inputDot, this.outputDot);

    this.buildControls();
    this.update();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
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
    this.group.add(segment(new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 6, 0), 0x8b949e));
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "expr").name("f(x)"),
      "A formula in x, e.g. 0.4*x*x - 1, sin(x), x*x*x - x.")
      .onFinishChange(() => { this.recompile(); updateCurveXY(this.curve, this.f, this.a, this.b, this.n); this.update(); });
    tip(g.add(this.params, "x", this.a, this.b, 0.01).name("input x").listen(),
      "Slide the input. The orange line lifts up to the curve, the green line reads off f(x).")
      .onChange(() => this.update());
    tip(g.add(this.params, "sweep").name("Auto-sweep x"), "Animate x moving left to right.");
    tip(g.add(this.params, "verticalLineTest").name("Vertical line test"),
      "Drop a red vertical line: a graph is a function only if this line hits it at most once.")
      .onChange(() => this.update());
    tip(g.add(this.params, "vltX", this.a, this.b, 0.01).name("test line x"),
      "Slide the red test line across the graph.")
      .onChange(() => this.update());
  }

  private recompile(): void {
    const r = tryCompile1(this.params.expr);
    if (r.fn) this.f = r.fn;
  }

  private tick(dt: number): void {
    if (!this.params.sweep) return;
    this.params.x += dt * 2;
    if (this.params.x > this.b) this.params.x = this.a;
    this.update();
  }

  private update(): void {
    const x = this.params.x;
    const y = this.f(x);
    const yFinite = Number.isFinite(y);
    const yc = yFinite ? THREE.MathUtils.clamp(y, -6, 6) : 0;
    this.inputDot.position.set(x, 0, 0.05);
    this.outputDot.position.set(x, yc, 0.06);
    this.outputDot.visible = yFinite;
    this.mapV.geometry.setFromPoints([new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, yc, 0)]);
    this.mapH.geometry.setFromPoints([new THREE.Vector3(x, yc, 0), new THREE.Vector3(0, yc, 0)]);
    this.mapV.visible = yFinite;
    this.mapH.visible = yFinite;

    this.vlt.visible = this.params.verticalLineTest;
    if (this.params.verticalLineTest) {
      const vx = this.params.vltX;
      this.vlt.geometry.setFromPoints([new THREE.Vector3(vx, -6, 0), new THREE.Vector3(vx, 6, 0)]);
    }

    this.renderInfo(x, y);
  }

  private renderInfo(x: number, y: number): void {
    const domainNote = this.describeDomain();
    this.setInfo(`
      <h2>Functions &amp; Graphs</h2>
      <p>A <b>function</b> is a machine: put a number <code>x</code> in, get exactly one
      number <code>f(x)</code> out. The blue curve shows every input paired with its output.</p>
      <div class="readout">
        <div><span>input x</span><b>${this.fmt(x)}</b></div>
        <div><span>output f(x)</span><b>${Number.isFinite(y) ? this.fmt(y) : "undefined here"}</b></div>
        <div><span>point on graph</span><b>(${this.fmt(x)}, ${Number.isFinite(y) ? this.fmt(y) : "—"})</b></div>
        <div><span>domain</span><b>${domainNote}</b></div>
      </div>
      <div class="course">
        <h3>Reading a graph</h3>
        <p>To find <code>f(x)</code> go up (orange) from <code>x</code> on the horizontal
        axis to the curve, then across (green) to the vertical axis. That height is the output.</p>
        <p>The <b>vertical line test</b> checks whether a picture really is a function: slide a
        vertical line across. If it ever crosses the curve twice, that <code>x</code> would need
        two outputs, so the picture is not a function.</p>
      </div>
      <p class="example"><b>Try it:</b> switch on the vertical line test and slide it across.
      A parabola passes; try typing <code>sqrt(x)</code> and note it is only defined for x ≥ 0.</p>
    `);
  }

  /** Sample the function across the window to describe roughly where it is defined. */
  private describeDomain(): string {
    let defined = 0;
    let total = 0;
    let firstDefined = NaN;
    let lastDefined = NaN;
    for (let i = 0; i <= 60; i++) {
      const x = this.a + ((this.b - this.a) * i) / 60;
      total++;
      const v = this.f(x);
      if (Number.isFinite(v)) {
        defined++;
        if (Number.isNaN(firstDefined)) firstDefined = x;
        lastDefined = x;
      }
    }
    if (defined === total) return "all real numbers (on screen)";
    if (defined === 0) return "undefined on screen";
    return `about ${this.fmt(firstDefined)} to ${this.fmt(lastDefined)}`;
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
