import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { LOGARITHM_DERIVATIONS } from "./formulaDerivations/foundations";
import { marker, segment, setSpriteText, textSprite, tip, updateSegment } from "./helpers";

registerFormulaDerivations("logarithms", LOGARITHM_DERIVATIONS);

const X0 = -1.6;
const X1 = 8.6;
const Y0 = -2.6;
const Y1 = 8.6;
const SAMPLES = 360;

export class LogarithmsLesson implements Lesson {
  readonly id = "logarithms";
  readonly title = "5 · Logarithms";
  readonly blurb = "Undo powers + log scales";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["powers"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private previousRotate = true;
  private expCurve!: THREE.Line;
  private logCurve!: THREE.Line;
  private mirror!: THREE.Line;
  private logPoint = marker(0xffd166, 0.13);
  private expPoint = marker(0xff7b72, 0.13);
  private dropX!: THREE.Line;
  private dropY!: THREE.Line;
  private link!: THREE.Line;
  private logLabel!: THREE.Sprite;
  private expLabel!: THREE.Sprite;
  private mirrorLabel!: THREE.Sprite;

  private readonly params = {
    base: 2,
    value: 4,
    showRules: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.controls.enableRotate = false;
    ctx.viewport.frameCamera(
      new THREE.Vector3(3.2, 2.8, 20),
      new THREE.Vector3(3.2, 2.8, 0),
    );

    const g = ctx.gui;
    tip(g.add(this.params, "base", 1.5, 10, 0.1).name("Base b"),
      "The number being raised to a power. 2, e and 10 are the usual choices.")
      .onChange(() => this.rebuild());
    tip(g.add(this.params, "value", 0.25, 8, 0.01).name("Value x"),
      "Ask: what power of b gives this x? The gold point is the answer.")
      .onChange(() => this.rebuild());
    g.add(this.params, "showRules").name("Show log rules").onChange(() => this.updateInfo());

    this.buildScene();
    this.rebuild();
  }

  exit(): void {
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    const paper = new THREE.GridHelper(16, 16, 0x30363d, 0x21262d);
    paper.rotation.x = Math.PI / 2;
    paper.position.set(3.5, 3, -0.06);
    this.group.add(paper);

    this.group.add(segment(new THREE.Vector3(X0, 0, 0), new THREE.Vector3(X1, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, Y0, 0), new THREE.Vector3(0, Y1, 0), 0x8b949e));
    for (let n = Math.ceil(X0); n <= Math.floor(X1); n++) {
      if (n === 0) continue;
      this.group.add(segment(new THREE.Vector3(n, -0.1, 0), new THREE.Vector3(n, 0.1, 0), 0x6e7681));
    }
    for (let n = Math.ceil(Y0); n <= Math.floor(Y1); n++) {
      if (n === 0) continue;
      this.group.add(segment(new THREE.Vector3(-0.1, n, 0), new THREE.Vector3(0.1, n, 0), 0x6e7681));
    }
    const xName = textSprite("x", 0x8b949e, 0.32);
    xName.position.set(X1 - 0.15, -0.35, 0.04);
    const yName = textSprite("y", 0x8b949e, 0.32);
    yName.position.set(-0.35, Y1 - 0.15, 0.04);
    this.group.add(xName, yName);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const alongX = textSprite(String(n), 0x6e7681, 0.24);
      alongX.position.set(n, -0.32, 0.04);
      const alongY = textSprite(String(n), 0x6e7681, 0.24);
      alongY.position.set(-0.32, n, 0.04);
      this.group.add(alongX, alongY);
    }

    this.mirror = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: 0x6e7681, dashSize: 0.16, gapSize: 0.1 }),
    );
    const m0 = Math.max(X0, Y0);
    const m1 = Math.min(X1, Y1);
    this.mirror.geometry.setFromPoints([
      new THREE.Vector3(m0, m0, 0),
      new THREE.Vector3(m1, m1, 0),
    ]);
    this.mirror.computeLineDistances();
    this.mirrorLabel = textSprite("y = x", 0x8b949e, 0.3);
    this.group.add(this.mirror, this.mirrorLabel);

    this.logLabel = textSprite("y = log_b(x)", 0x58a6ff, 0.34);
    this.expLabel = textSprite("y = bˣ", 0xff7b72, 0.34);
    this.group.add(this.logLabel, this.expLabel);

    this.expCurve = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xff7b72 }),
    );
    this.logCurve = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x58a6ff }),
    );
    this.dropX = segment(new THREE.Vector3(), new THREE.Vector3(), 0xffd166);
    this.dropY = segment(new THREE.Vector3(), new THREE.Vector3(), 0x58a6ff);
    this.link = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: 0x484f58, dashSize: 0.12, gapSize: 0.1 }),
    );
    this.group.add(
      this.expCurve,
      this.logCurve,
      this.dropX,
      this.dropY,
      this.link,
      this.logPoint,
      this.expPoint,
    );
  }

  private rebuild(): void {
    this.params.base = Math.max(1.05, this.params.base);
    this.params.value = Math.max(0.05, this.params.value);
    const b = this.params.base;

    const expLo = Math.max(X0, this.logBase(0.04));
    const expHi = Math.min(X1, this.logBase(Y1 - 0.05));
    this.setLine(this.expCurve, expLo, expHi, (x) => b ** x);

    const logLo = Math.max(0.06, b ** Y0);
    const logHi = Math.min(X1, b ** Y1);
    this.setLine(this.logCurve, logLo, logHi, (x) => this.logBase(x));

    const x = this.params.value;
    const y = this.logBase(x);
    const logOn = this.inWindow(x, y);
    const expOn = this.inWindow(y, x);
    this.logPoint.visible = logOn;
    this.expPoint.visible = expOn;
    this.logPoint.position.set(x, y, 0.08);
    this.expPoint.position.set(y, x, 0.08);

    updateSegment(this.dropX, new THREE.Vector3(x, 0, 0.02), new THREE.Vector3(x, y, 0.02));
    updateSegment(this.dropY, new THREE.Vector3(0, y, 0.02), new THREE.Vector3(x, y, 0.02));
    this.dropX.visible = logOn;
    this.dropY.visible = logOn;
    this.link.geometry.setFromPoints([
      new THREE.Vector3(x, y, 0.03),
      new THREE.Vector3(y, x, 0.03),
    ]);
    this.link.computeLineDistances();
    this.link.visible = logOn && expOn;

    const logLabelX = THREE.MathUtils.clamp(3.1, logLo + 0.4, logHi - 0.2);
    const logLabelY = this.logBase(logLabelX);
    this.logLabel.position.set(logLabelX, logLabelY + 0.42, 0.05);
    setSpriteText(this.logLabel, `y = log_${this.fmtBase(b)}(x)`, 0x58a6ff);

    const expLabelX = THREE.MathUtils.clamp(1.15, expLo + 0.15, expHi - 0.15);
    const expLabelY = b ** expLabelX;
    this.expLabel.position.set(expLabelX + 0.55, expLabelY + 0.28, 0.05);
    setSpriteText(this.expLabel, `y = ${this.fmtBase(b)}ˣ`, 0xff7b72);

    const m = Math.min(X1, Y1) - 0.35;
    this.mirrorLabel.position.set(m + 0.45, m + 0.15, 0.05);

    this.updateInfo();
  }

  private setLine(line: THREE.Line, a: number, b: number, f: (x: number) => number): void {
    const pts: THREE.Vector3[] = [];
    if (b > a) {
      for (let i = 0; i <= SAMPLES; i++) {
        const x = a + ((b - a) * i) / SAMPLES;
        const y = f(x);
        if (Number.isFinite(y) && y >= Y0 - 0.15 && y <= Y1 + 0.15) {
          pts.push(new THREE.Vector3(x, y, 0));
        }
      }
    }
    if (pts.length < 2) {
      pts.length = 0;
      pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    }
    line.geometry.setFromPoints(pts);
  }

  private inWindow(x: number, y: number): boolean {
    return Number.isFinite(x) && Number.isFinite(y) &&
      x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
  }

  private fmtBase(b: number): string {
    if (Math.abs(b - Math.E) < 0.03) return "e";
    return this.fmt(b);
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
        <div><span>Gold point (log)</span><b>(${this.fmt(x)}, ${this.fmt(y)})</b></div>
        <div><span>Coral point (exp)</span><b>(${this.fmt(y)}, ${this.fmt(x)})</b></div>
        <div><span>Natural log ln(x)</span><b>${this.fmt(natural)}</b></div>
        <div><span>Common log log₁₀(x)</span><b>${this.fmt(common)}</b></div>
      </div>
      <p>The gold point sits on the blue log curve. The coral point is the same pair
      swapped, so it sits on the red exponential. The dashed line <code>y = x</code>
      is the mirror that swaps them.</p>
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
