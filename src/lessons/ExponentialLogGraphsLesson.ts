import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, segment, textSprite, tip } from "./helpers";

/**
 * Exponential & Log Graphs.
 *
 * y = bˣ and its inverse y = log_b(x) drawn together with the y = x mirror line, showing
 * that exponentials and logs are reflections of each other. A base slider reshapes both,
 * and an e-highlight snaps the base to Euler's number.
 */
export class ExponentialLogGraphsLesson implements Lesson {
  readonly id = "exponential-log-graphs";
  readonly title = "Exponential & Log Graphs";
  readonly blurb = "bˣ and log_b(x) are mirror images";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["logarithms", "functions-and-graphs"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private expCurve!: THREE.Line;
  private logCurve!: THREE.Line;

  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 400;

  private readonly params = {
    base: 2,
    useE: false,
  };

  private baseCtrl!: { updateDisplay: () => void };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 15), new THREE.Vector3(0, 0.5, 0));

    this.buildScene();
    this.expCurve = curveXY((x) => this.expAt(x), this.a, this.b, this.n, 0xff7b72);
    this.logCurve = curveXY((x) => this.logAt(x), this.a, this.b, this.n, 0x58a6ff);
    this.group.add(this.expCurve, this.logCurve);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    this.group.add(segment(new THREE.Vector3(-7, 0, 0), new THREE.Vector3(7, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 7, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(-6, -6, 0), new THREE.Vector3(7, 7, 0), 0x484f58));
    const mirror = textSprite("y = x", 0x8b949e, 0.4);
    mirror.position.set(5.5, 6, 0);
    const expLabel = textSprite("y = bˣ", 0xff7b72, 0.5);
    expLabel.position.set(2.2, 5.5, 0);
    const logLabel = textSprite("y = log_b x", 0x58a6ff, 0.5);
    logLabel.position.set(-3, 3.4, 0);
    this.group.add(mirror, expLabel, logLabel);
  }

  private base(): number {
    return this.params.useE ? Math.E : Math.max(1.05, this.params.base);
  }

  private expAt(x: number): number {
    return THREE.MathUtils.clamp(Math.pow(this.base(), x), -6, 7);
  }

  private logAt(x: number): number {
    if (x <= 0) return NaN;
    return THREE.MathUtils.clamp(Math.log(x) / Math.log(this.base()), -6, 7);
  }

  private buildControls(): void {
    const g = this.gui;
    this.baseCtrl = tip(g.add(this.params, "base", 1.2, 8, 0.1).name("base b").listen(),
      "The growth factor. b > 1 grows; the log undoes it.")
      .onChange(() => { this.params.useE = false; this.rebuild(); });
    tip(g.add(this.params, "useE").name("snap to e ≈ 2.718"),
      "Use Euler's number, the natural growth base.")
      .onChange((v: boolean) => {
        if (v) this.params.base = Math.E;
        this.baseCtrl.updateDisplay();
        this.rebuild();
      });
  }

  private rebuild(): void {
    updateCurveXY(this.expCurve, (x) => this.expAt(x), this.a, this.b, this.n);
    updateCurveXY(this.logCurve, (x) => this.logAt(x), this.a, this.b, this.n);
    this.renderInfo();
  }

  private renderInfo(): void {
    const b = this.base();
    this.setInfo(`
      <h2>Exponential &amp; Log Graphs</h2>
      <p>The exponential <code>y = bˣ</code> (red) and the logarithm <code>y = log_b(x)</code>
      (blue) are <b>inverse</b> functions: each undoes the other. That is why they are mirror
      images across the dashed line <code>y = x</code>.</p>
      <div class="readout">
        <div><span>Base b</span><b>${this.fmt(b)}${this.params.useE ? " (e)" : ""}</b></div>
        <div><span>Exponential passes through</span><b>(0, 1) and (1, ${this.fmt(b)})</b></div>
        <div><span>Log passes through</span><b>(1, 0) and (${this.fmt(b)}, 1)</b></div>
      </div>
      <div class="course">
        <h3>Reading the mirror</h3>
        <p>Reflecting a point <code>(p, q)</code> in the line <code>y = x</code> gives
        <code>(q, p)</code>. Since <code>bˣ</code> sends <code>x</code> to <code>y</code>,
        its mirror <code>log_b</code> sends that same <code>y</code> back to <code>x</code>.</p>
        <p>The exponential never touches the x-axis (it approaches <code>y = 0</code>), and the
        logarithm never touches the y-axis (it is undefined for <code>x ≤ 0</code>). Those are
        each other's asymptotes reflected.</p>
      </div>
      <p class="example"><b>Try it:</b> snap the base to <code>e</code>. The natural pair
      <code>eˣ</code> and <code>ln(x)</code> is the one calculus prefers.</p>
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
