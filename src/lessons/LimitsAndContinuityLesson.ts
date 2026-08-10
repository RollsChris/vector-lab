import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, marker, segment, tip } from "./helpers";
import { limitSamples, oneSidedLimit } from "../math/functionsGraphs";

type Preset = "continuous" | "hole" | "jump";

/**
 * Limits & Continuity.
 *
 * Approach a target x₀ from the left and right and watch the outputs home in on a value.
 * An ε (epsilon) window band shows how the outputs are trapped near the limit. Three
 * presets — continuous, a removable hole, and a jump — show when the limit exists.
 */
export class LimitsAndContinuityLesson implements Lesson {
  readonly id = "limits-and-continuity";
  readonly title = "Limits & Continuity";
  readonly blurb = "Sneaking up on a value from both sides";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["functions-and-graphs"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private leftCurve!: THREE.Line;
  private rightCurve!: THREE.Line;
  private sampleDots = new THREE.Group();
  private epsBand!: THREE.Mesh;
  private targetLine!: THREE.Line;
  private holeDot = marker(0x0d1117, 0.13);
  private jumpDot = marker(0xff7b72, 0.13);

  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 240;

  private readonly params = {
    preset: "hole" as Preset,
    x0: 1,
    epsilon: 0.6,
    approach: 0.5,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.5, 14), new THREE.Vector3(0, 0.5, 0));

    this.buildGrid();
    this.leftCurve = curveXY((x) => this.f(x), this.a, this.b, this.n, 0x5db4ff);
    this.rightCurve = curveXY((x) => this.f(x), this.a, this.b, this.n, 0x5db4ff);
    this.targetLine = segment(new THREE.Vector3(), new THREE.Vector3(), 0x8b949e);
    const bandGeo = new THREE.PlaneGeometry(1, 1);
    this.epsBand = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({
      color: 0xffa657, transparent: true, opacity: 0.16, depthWrite: false,
    }));
    this.holeDot.visible = false;
    this.jumpDot.visible = false;
    this.group.add(this.leftCurve, this.rightCurve, this.epsBand, this.targetLine, this.sampleDots, this.holeDot, this.jumpDot);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.sampleDots = new THREE.Group();
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

  /** The demo function; behaviour near x₀ depends on the preset. */
  private f(x: number): number {
    const p = this.params;
    const base = 0.5 * x + 1;
    if (p.preset === "continuous") return THREE.MathUtils.clamp(base, -6, 7);
    if (p.preset === "hole") {
      // (x - x0) cancels except exactly at x0, leaving a removable hole.
      if (Math.abs(x - p.x0) < 1e-6) return NaN;
      return THREE.MathUtils.clamp(base, -6, 7);
    }
    // jump: step up by 2 once past x0.
    return THREE.MathUtils.clamp(base + (x >= p.x0 ? 2 : 0), -6, 7);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "preset", {
      "Continuous": "continuous",
      "Removable hole": "hole",
      "Jump": "jump",
    }).name("Preset"), "Choose how the curve behaves at the target.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "x0", -4, 4, 0.5).name("target x₀"), "The x value being approached.").onChange(() => this.rebuild());
    tip(g.add(this.params, "approach", 0.02, 2, 0.02).name("approach gap").listen(),
      "How far the sample points start from x₀. Shrink it to sneak in closer.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "epsilon", 0.1, 2, 0.05).name("ε window"),
      "Height of the tolerance band around the limit.")
      .onChange(() => this.rebuild());
  }

  private rebuild(): void {
    updateCurveXY(this.leftCurve, (x) => this.f(x), this.a, this.b, this.n);
    updateCurveXY(this.rightCurve, (x) => this.f(x), this.a, this.b, this.n);

    const p = this.params;
    const leftLim = oneSidedLimit((x) => this.f(x), p.x0, "left");
    const rightLim = oneSidedLimit((x) => this.f(x), p.x0, "right");
    const limit = Math.abs(leftLim - rightLim) < 1e-3 ? (leftLim + rightLim) / 2 : NaN;

    // Epsilon band centred on the (two-sided) limit if it exists, else on the left limit.
    const centre = Number.isFinite(limit) ? limit : leftLim;
    const bandY = THREE.MathUtils.clamp(centre, -6, 7);
    this.epsBand.scale.set(14, p.epsilon * 2, 1);
    this.epsBand.position.set(0, bandY, -0.02);

    // Vertical target line at x0.
    this.targetLine.geometry.setFromPoints([
      new THREE.Vector3(p.x0, -6, 0),
      new THREE.Vector3(p.x0, 7, 0),
    ]);

    this.rebuildSamples();

    // Hole / jump markers.
    this.holeDot.visible = p.preset === "hole";
    if (p.preset === "hole") this.holeDot.position.set(p.x0, THREE.MathUtils.clamp(0.5 * p.x0 + 1, -6, 7), 0.08);
    this.jumpDot.visible = p.preset === "jump";
    if (p.preset === "jump") this.jumpDot.position.set(p.x0, THREE.MathUtils.clamp(0.5 * p.x0 + 1 + 2, -6, 7), 0.08);

    this.renderInfo(leftLim, rightLim, limit);
  }

  private rebuildSamples(): void {
    this.clearGroup(this.sampleDots);
    const p = this.params;
    const left = limitSamples((x) => this.f(x), p.x0, "left", 5, p.approach / 5);
    const right = limitSamples((x) => this.f(x), p.x0, "right", 5, p.approach / 5);
    for (const s of [...left, ...right]) {
      if (!Number.isFinite(s.y)) continue;
      const dot = marker(0x7ee787, 0.1);
      dot.position.set(s.x, THREE.MathUtils.clamp(s.y, -6, 7), 0.07);
      this.sampleDots.add(dot);
    }
  }

  private renderInfo(leftLim: number, rightLim: number, limit: number): void {
    const p = this.params;
    const exists = Number.isFinite(limit);
    const continuous = exists && p.preset === "continuous";
    this.setInfo(`
      <h2>Limits &amp; Continuity</h2>
      <p>A <b>limit</b> asks: as <code>x</code> creeps toward <code>x₀</code>, what value does
      <code>f(x)</code> head for? The green dots approach from both sides; the orange band is a
      tolerance <code>ε</code> around the target height.</p>
      <div class="readout">
        <div><span>Target x₀</span><b>${this.fmt(p.x0)}</b></div>
        <div><span>From the left</span><b>${this.fmt(leftLim)}</b></div>
        <div><span>From the right</span><b>${this.fmt(rightLim)}</b></div>
        <div><span>Limit</span><b>${exists ? this.fmt(limit) : "does not exist (sides disagree)"}</b></div>
        <div><span>Continuous here?</span><b>${continuous ? "yes" : "no"}</b></div>
      </div>
      <div class="course">
        <h3>Limit vs value</h3>
        <p>The limit is about the <i>approach</i>, not the point itself. A curve can have a
        <b>removable hole</b> — the limit exists even though <code>f(x₀)</code> is undefined —
        or a <b>jump</b>, where the left and right limits disagree so no single limit exists.</p>
        <p>A function is <b>continuous</b> at <code>x₀</code> when three things line up: the
        function is defined there, the limit exists, and the two are equal — no holes, no jumps,
        no lifting the pen.</p>
      </div>
      <p class="example"><b>Try it:</b> pick the hole preset and shrink the approach gap. The
      samples squeeze toward the limit even though the curve is punctured at x₀.</p>
    `);
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return parseFloat(n.toFixed(3)).toString();
  }

  private clearGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj === group) return;
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    group.clear();
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
