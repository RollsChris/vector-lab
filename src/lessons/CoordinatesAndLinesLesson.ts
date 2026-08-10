import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  createDragControls,
  marker,
  segment,
  updateSegment,
  textSprite,
} from "./helpers";
import {
  lineFromTwoPoints,
  midpoint,
  distance,
  type Point,
} from "../math/functionsGraphs";

/**
 * Coordinates & Straight Lines.
 *
 * Two draggable points define a live line y = m·x + c. The scene shows the rise/run
 * triangle, the midpoint and the connecting segment; the panel reports gradient,
 * intercept, midpoint and distance.
 */
export class CoordinatesAndLinesLesson implements Lesson {
  readonly id = "coordinates-and-lines";
  readonly title = "Coordinates & Straight Lines";
  readonly blurb = "Points, gradient and the equation of a line";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["rearranging-equations", "algebraic-laws"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private viewport!: LessonContext["viewport"];
  private setInfo!: (html: string) => void;
  private stopDrag?: () => void;

  private handleA = marker(0xff7b72, 0.16);
  private handleB = marker(0x79c0ff, 0.16);
  private line!: THREE.Line;
  private connector!: THREE.Line;
  private riseLeg!: THREE.Line;
  private runLeg!: THREE.Line;
  private midDot = marker(0x7ee787, 0.12);
  private labelA!: THREE.Sprite;
  private labelB!: THREE.Sprite;

  private readonly params = {
    ax: -3,
    ay: -1,
    bx: 3,
    by: 3,
    showRiseRun: true,
    showMidpoint: true,
  };

  private ctrls: { updateDisplay: () => void }[] = [];

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 0.5, 0));

    this.buildGrid();
    this.buildScene();
    this.buildControls();
    this.update();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.ctrls = [];
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 16, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    this.group.add(grid);
    this.group.add(segment(new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -8, 0), new THREE.Vector3(0, 8, 0), 0x8b949e));
  }

  private buildScene(): void {
    this.line = segment(new THREE.Vector3(), new THREE.Vector3(), 0xffd166);
    this.connector = segment(new THREE.Vector3(), new THREE.Vector3(), 0x484f58);
    this.riseLeg = segment(new THREE.Vector3(), new THREE.Vector3(), 0x7ee787);
    this.runLeg = segment(new THREE.Vector3(), new THREE.Vector3(), 0xffa657);
    this.labelA = textSprite("A", 0xff7b72, 0.5);
    this.labelB = textSprite("B", 0x79c0ff, 0.5);
    this.group.add(
      this.line, this.connector, this.riseLeg, this.runLeg,
      this.handleA, this.handleB, this.midDot, this.labelA, this.labelB,
    );

    this.stopDrag = createDragControls(this.viewport, [this.handleA, this.handleB], (index, point) => {
      const x = THREE.MathUtils.clamp(Math.round(point.x * 2) / 2, -7, 7);
      const y = THREE.MathUtils.clamp(Math.round(point.y * 2) / 2, -7, 7);
      if (index === 0) {
        this.params.ax = x;
        this.params.ay = y;
      } else {
        this.params.bx = x;
        this.params.by = y;
      }
      for (const c of this.ctrls) c.updateDisplay();
      this.update();
    });
  }

  private buildControls(): void {
    const g = this.gui;
    const fa = g.addFolder("Point A");
    this.ctrls.push(fa.add(this.params, "ax", -7, 7, 0.5).name("A x").onChange(() => this.update()));
    this.ctrls.push(fa.add(this.params, "ay", -7, 7, 0.5).name("A y").onChange(() => this.update()));
    fa.open();
    const fb = g.addFolder("Point B");
    this.ctrls.push(fb.add(this.params, "bx", -7, 7, 0.5).name("B x").onChange(() => this.update()));
    this.ctrls.push(fb.add(this.params, "by", -7, 7, 0.5).name("B y").onChange(() => this.update()));
    fb.open();
    g.add(this.params, "showRiseRun").name("Show rise / run").onChange(() => this.update());
    g.add(this.params, "showMidpoint").name("Show midpoint").onChange(() => this.update());
  }

  private update(): void {
    const a: Point = { x: this.params.ax, y: this.params.ay };
    const b: Point = { x: this.params.bx, y: this.params.by };
    this.handleA.position.set(a.x, a.y, 0.05);
    this.handleB.position.set(b.x, b.y, 0.05);
    this.labelA.position.set(a.x + 0.4, a.y + 0.4, 0.1);
    this.labelB.position.set(b.x + 0.4, b.y + 0.4, 0.1);
    updateSegment(this.connector, new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0));

    const fit = lineFromTwoPoints(a, b);
    if (fit.vertical) {
      updateSegment(this.line, new THREE.Vector3(a.x, -8, 0), new THREE.Vector3(a.x, 8, 0));
    } else {
      const m = fit.m!;
      const c = fit.c!;
      updateSegment(
        this.line,
        new THREE.Vector3(-8, m * -8 + c, 0),
        new THREE.Vector3(8, m * 8 + c, 0),
      );
    }

    // Rise/run right-angle triangle from A across to B's x, then up to B.
    const corner = new THREE.Vector3(b.x, a.y, 0);
    updateSegment(this.runLeg, new THREE.Vector3(a.x, a.y, 0), corner);
    updateSegment(this.riseLeg, corner, new THREE.Vector3(b.x, b.y, 0));
    this.runLeg.visible = this.params.showRiseRun;
    this.riseLeg.visible = this.params.showRiseRun;

    const mid = midpoint(a, b);
    this.midDot.position.set(mid.x, mid.y, 0.06);
    this.midDot.visible = this.params.showMidpoint;

    this.renderInfo(a, b, fit, mid);
  }

  private renderInfo(a: Point, b: Point, fit: ReturnType<typeof lineFromTwoPoints>, mid: Point): void {
    const dist = distance(a, b);
    const rise = b.y - a.y;
    const run = b.x - a.x;
    const eqn = fit.vertical
      ? `x = ${this.fmt(a.x)}`
      : `y = ${this.fmt(fit.m!)}x ${fit.c! >= 0 ? "+" : "−"} ${this.fmt(Math.abs(fit.c!))}`;
    const gradient = fit.vertical ? "undefined (vertical)" : this.fmt(fit.m!);

    this.setInfo(`
      <h2>Coordinates &amp; Straight Lines</h2>
      <p>Every point on the plane has an address <code>(x, y)</code>. Drag the red and
      blue handles: the yellow line through them updates live.</p>
      <div class="readout">
        <div><span>A</span><b>(${this.fmt(a.x)}, ${this.fmt(a.y)})</b></div>
        <div><span>B</span><b>(${this.fmt(b.x)}, ${this.fmt(b.y)})</b></div>
        <div><span>Rise (Δy) / Run (Δx)</span><b>${this.fmt(rise)} / ${this.fmt(run)}</b></div>
        <div><span>Gradient m</span><b>${gradient}</b></div>
        <div><span>Equation</span><b>${eqn}</b></div>
        <div><span>Midpoint</span><b>(${this.fmt(mid.x)}, ${this.fmt(mid.y)})</b></div>
        <div><span>Distance |AB|</span><b>${this.fmt(dist)}</b></div>
      </div>
      <div class="course">
        <h3>How the line's equation appears</h3>
        <p>The <b>gradient</b> is <code>m = rise ÷ run = Δy ÷ Δx</code>: how many units up
        for each unit across (green over orange). The <b>intercept</b> <code>c</code> is the
        height where the line meets <code>x = 0</code>. Together they give
        <code>y = m·x + c</code>.</p>
        <p>The <b>midpoint</b> averages the coordinates: <code>((x₁+x₂)/2, (y₁+y₂)/2)</code>.
        The <b>distance</b> is Pythagoras on the rise/run triangle:
        <code>√(Δx² + Δy²)</code>.</p>
      </div>
      <p class="example"><b>Try it:</b> drag B straight up above A so the run is 0 — the
      gradient becomes undefined and the line stands vertical.</p>
    `);
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
