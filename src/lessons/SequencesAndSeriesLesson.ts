import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { marker, segment, textSprite, tip } from "./helpers";
import { apTerm, apSum, gpTerm, gpSum, gpSumInfinite } from "../math/functionsGraphs";

type Kind = "ap" | "gp";

/**
 * Sequences & Series.
 *
 * Toggle between an arithmetic progression (constant step d) and a geometric one (constant
 * ratio r). Term dots plot each value; a growing bar shows the partial sum; the panel gives
 * the sigma readout and — for a convergent GP — the sum to infinity.
 */
export class SequencesAndSeriesLesson implements Lesson {
  readonly id = "sequences-and-series";
  readonly title = "Sequences & Series";
  readonly blurb = "Patterns of numbers and their running totals";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["powers", "functions-and-graphs"] as const;

  private group = new THREE.Group();
  private dots = new THREE.Group();
  private bars = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private readonly params = {
    kind: "ap" as Kind,
    first: 1,
    step: 1.5,
    ratio: 1.4,
    terms: 8,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 1.5, 16), new THREE.Vector3(0, 1.5, 0));

    this.group.add(segment(new THREE.Vector3(-7, 0, 0), new THREE.Vector3(7, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(-6.5, 0, 0), new THREE.Vector3(-6.5, 6, 0), 0x8b949e));
    this.group.add(this.dots, this.bars);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.dots = new THREE.Group();
    this.bars = new THREE.Group();
    this.group = new THREE.Group();
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "kind", { "Arithmetic (AP)": "ap", "Geometric (GP)": "gp" }).name("Type"),
      "Arithmetic adds a fixed step; geometric multiplies by a fixed ratio.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "first", -3, 5, 0.5).name("first term a"), "The starting value.").onChange(() => this.rebuild());
    tip(g.add(this.params, "step", -3, 3, 0.25).name("common difference d"), "Added each step (AP).").onChange(() => this.rebuild());
    tip(g.add(this.params, "ratio", -2, 2, 0.05).name("common ratio r"), "Multiplied each step (GP).").onChange(() => this.rebuild());
    tip(g.add(this.params, "terms", 1, 12, 1).name("number of terms n"), "How many terms to show.").onChange(() => this.rebuild());
  }

  private termAt(n: number): number {
    return this.params.kind === "ap"
      ? apTerm(this.params.first, this.params.step, n)
      : gpTerm(this.params.first, this.params.ratio, n);
  }

  private partialSum(n: number): number {
    return this.params.kind === "ap"
      ? apSum(this.params.first, this.params.step, n)
      : gpSum(this.params.first, this.params.ratio, n);
  }

  private rebuild(): void {
    this.clearGroup(this.dots);
    this.clearGroup(this.bars);

    const count = Math.round(this.params.terms);
    const spacing = 12 / Math.max(count, 1);
    const total = this.partialSum(count);
    const yScale = 4 / Math.max(1, Math.max(...Array.from({ length: count }, (_, i) => Math.abs(this.termAt(i + 1))), Math.abs(total) / 3));

    for (let i = 1; i <= count; i++) {
      const x = -6.5 + spacing * (i - 0.5);
      const t = this.termAt(i);
      const y = THREE.MathUtils.clamp(t * yScale, -5, 5);
      const dot = marker(this.params.kind === "ap" ? 0x79c0ff : 0xff7b72, 0.14);
      dot.position.set(x, y, 0.05);
      this.dots.add(dot);
      this.dots.add(segment(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, y, 0), 0x30363d));
      if (i <= 6 || count <= 8) {
        const label = textSprite(this.fmt(t), 0x8b949e, 0.32);
        label.position.set(x, y + (y >= 0 ? 0.45 : -0.45), 0.1);
        this.dots.add(label);
      }
    }

    // Partial-sum bar climbing on the right.
    const sumH = THREE.MathUtils.clamp(total * (yScale / 3), -5.5, 5.5);
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, Math.abs(sumH) || 0.001),
      new THREE.MeshBasicMaterial({ color: 0x7ee787, transparent: true, opacity: 0.5 }),
    );
    bar.position.set(6, sumH / 2, 0);
    this.bars.add(bar);
    const sumLabel = textSprite(`Σ = ${this.fmt(total)}`, 0x7ee787, 0.4);
    sumLabel.position.set(6, sumH + (sumH >= 0 ? 0.5 : -0.5), 0.1);
    this.bars.add(sumLabel);

    this.renderInfo(count, total);
  }

  private renderInfo(count: number, total: number): void {
    const p = this.params;
    const isAp = p.kind === "ap";
    const termFormula = isAp
      ? `aₙ = a + (n−1)d = ${this.fmt(p.first)} + (n−1)(${this.fmt(p.step)})`
      : `aₙ = a·rⁿ⁻¹ = ${this.fmt(p.first)}·(${this.fmt(p.ratio)})ⁿ⁻¹`;
    const sumFormula = isAp
      ? `Sₙ = n/2 · (2a + (n−1)d)`
      : `Sₙ = a·(rⁿ − 1)/(r − 1)`;
    const infinite = !isAp ? gpSumInfinite(p.first, p.ratio) : null;
    const infiniteRow = !isAp
      ? `<div><span>Sum to infinity</span><b>${infinite === null ? "diverges ( |r| ≥ 1 )" : this.fmt(infinite)}</b></div>`
      : "";

    this.setInfo(`
      <h2>Sequences &amp; Series</h2>
      <p>A <b>sequence</b> is a list of numbers built by a rule; a <b>series</b> is what you get
      by adding them up. Each dot is a term; the green bar is the running total (Σ).</p>
      <div class="readout">
        <div><span>Type</span><b>${isAp ? "Arithmetic — add " + this.fmt(p.step) : "Geometric — multiply by " + this.fmt(p.ratio)}</b></div>
        <div><span>nth term</span><b>${termFormula}</b></div>
        <div><span>${count}th term</span><b>${this.fmt(this.termAt(count))}</b></div>
        <div><span>Sum of ${count} terms</span><b>${sumFormula} = ${this.fmt(total)}</b></div>
        ${infiniteRow}
      </div>
      <div class="course">
        <h3>Two kinds of pattern</h3>
        <p>An <b>arithmetic</b> progression changes by a constant <i>difference</i> d, so its
        terms lie on a straight line. A <b>geometric</b> progression changes by a constant
        <i>ratio</i> r, so its terms curve like an exponential.</p>
        <p>A geometric series with <code>|r| &lt; 1</code> shrinks fast enough that even infinitely
        many terms add to a finite total, <code>a ÷ (1 − r)</code>.</p>
      </div>
      <p class="example"><b>Try it:</b> switch to geometric and set the ratio to 0.5 — the sum
      to infinity settles at twice the first term.</p>
    `);
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 1e5) return n.toExponential(2);
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
