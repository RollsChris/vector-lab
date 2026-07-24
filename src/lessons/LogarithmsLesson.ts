import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { LOGARITHM_DERIVATIONS } from "./formulaDerivations/foundations";
import { curveXY, marker, segment, textSprite } from "./helpers";

registerFormulaDerivations("logarithms", LOGARITHM_DERIVATIONS);

export class LogarithmsLesson implements Lesson {
  readonly id = "logarithms";
  readonly title = "5 · Logarithms";
  readonly blurb = "Undo powers + log scales";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["powers"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private expCurve!: THREE.Line;
  private logCurve!: THREE.Line;
  private point = marker(0xffd166, 0.13);

  private readonly params = {
    base: 2,
    value: 4,
    showRules: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 2.5, 13),
      new THREE.Vector3(0, 0.4, 0),
    );

    const g = ctx.gui;
    g.add(this.params, "base", 1.2, 12, 0.1).name("Base b").onChange(() => this.rebuild());
    g.add(this.params, "value", 0.01, 10000, 0.01).name("Value x").onChange(() => this.rebuild());
    g.add(this.params, "showRules").name("Show log rules").onChange(() => this.updateInfo());

    this.buildScene();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    this.group.add(segment(new THREE.Vector3(-4.6, 0, 0), new THREE.Vector3(4.6, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 3.4, 0), 0x8b949e));
    // The y = x mirror line: exp and log are reflections of each other across it.
    this.group.add(segment(new THREE.Vector3(-3, -3, 0), new THREE.Vector3(3.4, 3.4, 0), 0x484f58));
    const mirrorLabel = textSprite("y = x", 0x8b949e, 0.32);
    mirrorLabel.position.set(3, 3.2, 0);
    const logLabel = textSprite("y = log_b(x)", 0x58a6ff, 0.38);
    logLabel.position.set(-2.4, 2.8, 0);
    const expLabel = textSprite("y = bˣ", 0xff7b72, 0.38);
    expLabel.position.set(2.2, 2.8, 0);
    this.group.add(mirrorLabel, logLabel, expLabel);

    this.expCurve = curveXY((x) => this.safeExp(x), -4.4, 4.4, 300, 0xff7b72);
    this.logCurve = curveXY((x) => this.safeLog(x), -4.4, 4.4, 300, 0x58a6ff);
    this.group.add(this.expCurve, this.logCurve, this.point);
  }

  private rebuild(): void {
    this.params.base = Math.max(1.01, this.params.base);
    this.params.value = Math.max(0.000001, this.params.value);

    this.expCurve.geometry.dispose();
    this.expCurve.geometry = curveXY((x) => this.safeExp(x), -4.4, 4.4, 300, 0xff7b72).geometry;
    this.logCurve.geometry.dispose();
    this.logCurve.geometry = curveXY((x) => this.safeLog(x), -4.4, 4.4, 300, 0x58a6ff).geometry;

    const y = this.logBase(this.params.value);
    // The marker sits on the log curve at (x, log_b(x)); clamp only so it stays on screen.
    const px = THREE.MathUtils.clamp(this.params.value, -4.4, 4.4);
    const py = THREE.MathUtils.clamp(y, -3, 3.4);
    this.point.position.set(px, py, 0.08);
    this.updateInfo();
  }

  private updateInfo(): void {
    const b = this.params.base;
    const x = this.params.value;
    const y = this.logBase(x);
    const natural = Math.log(x);
    const common = Math.log10(x);

    this.setInfo(`
      <h2>Logarithms</h2>
      <p>A logarithm answers one question: <b>what power do I need?</b>
      If <code>${this.fmt(b)}<sup>${this.fmt(y)}</sup> = ${this.fmt(x)}</code>, then
      <code>log<sub>${this.fmt(b)}</sub>(${this.fmt(x)}) = ${this.fmt(y)}</code>.</p>
      <div class="readout">
        <div><span>Current equation</span><b>log<sub>${this.fmt(b)}</sub>(${this.fmt(x)}) = ${this.fmt(y)}</b></div>
        <div><span>Undo check</span><b>${this.fmt(b)}<sup>${this.fmt(y)}</sup> = ${this.fmt(b ** y)}</b></div>
        <div><span>Natural log ln(x)</span><b>${this.fmt(natural)}</b></div>
        <div><span>Common log log₁₀(x)</span><b>${this.fmt(common)}</b></div>
      </div>
      <p>Logs turn multiplication into addition and repeated growth into a straight-ish scale.
      That is why they show up in <b>pH</b>, <b>decibels</b>, the <b>Richter scale</b>,
      compound interest, half-life, and computer science.</p>
      <div class="course">
        <h3>Why base e is called natural</h3>
        <p><code>e ≈ 2.71828</code> is the continuous-growth base. The exponential
        <code>eˣ</code> is the one whose slope is itself, so calculus treats it as the
        “default” exponential. Its inverse is <code>ln(x)</code>, the natural log.</p>
        ${this.eWorkedExampleIntro()}
        ${this.eApproachVisual()}
      </div>
      ${this.params.showRules ? this.rulesHtml() : ""}`);
  }

  private eApproachVisual(): string {
    const rows = [
      ["1 yearly jump", 1],
      ["2 half-year jumps", 2],
      ["4 quarterly jumps", 4],
      ["12 monthly jumps", 12],
      ["365 daily jumps", 365],
      ["10,000 tiny jumps", 10000],
    ].map(([label, n]) => {
      const steps = n as number;
      const value = (1 + 1 / steps) ** steps;
      return { label, n: steps, value };
    });

    return `
      <div class="e-approach" aria-label="Visual approach to e by compound growth">
        <div class="e-formula">Same £1 example: split 100% interest into <code>n</code>
        smaller chunks and compound each chunk.</div>
        ${rows.map((row) => `
          <div class="e-row">
            <span>${row.label}</span>
            <div class="e-track">
              <i style="width: ${(row.value / Math.E) * 100}%"></i>
              <em>e</em>
            </div>
            <b>£${row.value.toFixed(row.n >= 365 ? 5 : 4)}</b>
          </div>`).join("")}
        <div class="e-limit">The bars get closer and closer to <code>£${Math.E.toFixed(5)}...</code>, so this is where <code>e</code> comes from.</div>
      </div>`;
  }

  private eWorkedExampleIntro(): string {
    return `
      <div class="e-worked">
        <h4>Worked example: £1 earning 100% interest</h4>
        <p>Start with <b>£1</b>. A 100% interest rate means “add one whole copy of the starting amount”
        over the year. If that interest is added more often, each new bit starts earning interest too.</p>
        ${this.halfYearExplanation()}
        <div class="e-step"><span>Once per year</span><code>£1 × (1 + 1) = £2.00</code></div>
        <div class="e-step"><span>Twice per year</span><code>£1 × (1 + 1/2)² = £2.25</code></div>
        <div class="e-step"><span>Monthly</span><code>£1 × (1 + 1/12)¹² = £2.613...</code></div>
        <div class="e-step"><span>Daily</span><code>£1 × (1 + 1/365)³⁶⁵ = £2.71457...</code></div>
        <p>If you compound infinitely often, the final amount does not explode forever;
        it settles toward <b>£2.71828...</b>. That number is <b>e</b>.</p>
        ${derivationButton("natural-e-limit")}
      </div>`;
  }

  private halfYearExplanation(): string {
    return `
      <div class="e-plain">
        <b>Why <code>1 + 1/2</code>?</b>
        The <code>1</code> means “keep the money you already have”. The <code>1/2</code>
        means “add half of it as interest”. Twice per year means the 100% yearly interest
        is split into two 50% chunks:
        <code>£1 → £1.50 → £2.25</code>.
      </div>`;
  }

  private rulesHtml(): string {
    return `
      <div class="course">
        <h3>Rules that make logs useful</h3>
        <ul>
          <li><code>log_b(MN) = log_b(M) + log_b(N)</code> — multiplication becomes addition.</li>
          <li><code>log_b(M/N) = log_b(M) - log_b(N)</code> — division becomes subtraction.</li>
          <li><code>log_b(M^p) = p log_b(M)</code> — powers can move out front.</li>
          <li><code>ln(x)</code> means base <code>e</code>, the natural growth base.</li>
        </ul>
        ${derivationButton("log-laws")}
      </div>`;
  }

  private safeExp(x: number): number {
    return THREE.MathUtils.clamp(this.params.base ** x, -3, 3.4);
  }

  private safeLog(x: number): number {
    if (x <= 0) return -3;
    return THREE.MathUtils.clamp(this.logBase(x), -3, 3.4);
  }

  private logBase(x: number): number {
    return Math.log(x) / Math.log(this.params.base);
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 1e5 || (Math.abs(n) < 1e-4 && n !== 0)) return n.toExponential(3);
    return parseFloat(n.toPrecision(5)).toString();
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
