import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { tryCompile2, type Fn2 } from "../math/expr";
import { updateCurveXY, curveXY, tip } from "./helpers";
import "./formulaDerivations/waves";

interface Harmonic {
  amp: number;
  freq: number;
  phase: number;
  on: boolean;
}

/**
 * Lesson 11 — Waveforms.
 * Three sine components y_k = A·sin(f·x + φ) plus their superposition. Animating
 * time shifts the phase so the waves travel; this connects oscillation, phase and
 * the sine/cosine derivative relationship from earlier lessons.
 */
export class WaveformsLesson implements Lesson {
  readonly id = "waveforms";
  readonly title = "11 · Waveforms";
  readonly blurb = "Sine waves & superposition";
  readonly category = "Trigonometry" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["trig-functions"] as const;

  private group = new THREE.Group();
  private compLines: THREE.Line[] = [];
  private customLine!: THREE.Line;
  private sumLine!: THREE.Line;
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;
  private t = 0;

  private readonly a = -8;
  private readonly b = 8;

  private readonly harmonics: Harmonic[] = [
    { amp: 1.5, freq: 1, phase: 0, on: true },
    { amp: 0.6, freq: 2, phase: 0, on: true },
    { amp: 0.4, freq: 3, phase: 0, on: false },
  ];

  private customFn: Fn2 = () => 0;
  private customError = "";

  private readonly params = {
    animate: true,
    speed: 1.5,
    showComponents: true,
    customExpr: "sin(x + t)",
    customAmp: 1,
    customOn: false,
  };

  private readonly colors = [0x5db4ff, 0xffa657, 0xbf91ff];

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 2, 13),
      new THREE.Vector3(0, 0, 0),
    );

    for (let k = 0; k < this.harmonics.length; k++) {
      const kk = k;
      const line = curveXY((x) => this.component(kk, x), this.a, this.b, 500, this.colors[kk]);
      (line.material as THREE.LineBasicMaterial).transparent = true;
      (line.material as THREE.LineBasicMaterial).opacity = 0.5;
      this.compLines.push(line);
      this.group.add(line);
    }
    // Custom user-defined wave.
    this.customLine = curveXY((x) => this.customWave(x), this.a, this.b, 500, 0xffffff);
    (this.customLine.material as THREE.LineBasicMaterial).transparent = true;
    (this.customLine.material as THREE.LineBasicMaterial).opacity = 0.5;
    this.group.add(this.customLine);

    this.sumLine = curveXY((x) => this.sum(x), this.a, this.b, 600, 0x5dff8f);
    (this.sumLine.material as THREE.LineBasicMaterial).linewidth = 2;
    this.group.add(this.sumLine);

    this.compileCustom();

    const g = ctx.gui;
    tip(
      g.add(this.params, "animate").name("Animate (travel)"),
      "Make the waves slide sideways over time, like ripples moving.",
    );
    tip(
      g.add(this.params, "speed", 0, 4, 0.1).name("Speed"),
      "How fast the animation travels.",
    );
    tip(
      g.add(this.params, "showComponents").name("Show components"),
      "Show each individual wave (faint), not just their sum (green).",
    ).onChange((v: boolean) => {
      this.compLines.forEach((l) => (l.visible = v));
    });

    this.harmonics.forEach((h, k) => {
      const folder = g.addFolder(`Wave ${k + 1}`);
      tip(folder.add(h, "on").name("Enabled"), "Include this wave in the sum.")
        .onChange(() => this.redraw());
      tip(
        folder.add(h, "amp", 0, 3, 0.05).name("Amplitude"),
        "Height of the wave — how tall the peaks are.",
      ).onChange(() => this.redraw());
      tip(
        folder.add(h, "freq", 0.25, 6, 0.25).name("Frequency"),
        "How many wiggles fit across — higher = more tightly packed.",
      ).onChange(() => this.redraw());
      tip(
        folder.add(h, "phase", 0, 2 * Math.PI, 0.05).name("Phase"),
        "Sideways shift of the wave (where it starts).",
      ).onChange(() => this.redraw());
      if (k > 0) folder.close();
    });

    const custom = g.addFolder("Custom wave");
    tip(
      custom.add(this.params, "customExpr").name("y(x,t)"),
      "Type your own wave function. Use x and t. e.g. sin(x*2 + t), exp(-x*x)*sin(t)",
    ).onFinishChange(() => {
      this.compileCustom();
      this.redraw();
    });
    tip(custom.add(this.params, "customAmp", 0, 3, 0.05).name("Amplitude"), "Scale the custom wave").onChange(() => this.redraw());
    tip(custom.add(this.params, "customOn").name("Enabled"), "Include the custom wave in the sum").onChange(() => this.redraw());
    custom.close();

    this.redraw();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  private component(k: number, x: number): number {
    const h = this.harmonics[k];
    if (!h.on) return 0;
    return h.amp * Math.sin(h.freq * x + h.phase + this.t);
  }

  private customWave(x: number): number {
    if (!this.params.customOn) return 0;
    return this.params.customAmp * this.customFn(x, this.t);
  }

  private compileCustom(): void {
    const r = tryCompile2(this.params.customExpr);
    if (r.fn) {
      this.customFn = r.fn;
      this.customError = "";
    } else {
      this.customFn = () => 0;
      this.customError = r.error;
    }
  }

  private sum(x: number): number {
    let y = 0;
    for (let k = 0; k < this.harmonics.length; k++) y += this.component(k, x);
    y += this.customWave(x);
    return y;
  }

  private redraw(): void {
    for (let k = 0; k < this.harmonics.length; k++) {
      const kk = k;
      updateCurveXY(this.compLines[kk], (x) => this.component(kk, x), this.a, this.b, 500);
    }
    updateCurveXY(this.customLine, (x) => this.customWave(x), this.a, this.b, 500);
    updateCurveXY(this.sumLine, (x) => this.sum(x), this.a, this.b, 600);

    const active = this.harmonics.filter((h) => h.on);
    const terms = active
      .map((h) => `${h.amp.toFixed(2)}·sin(${h.freq}x${h.phase ? " + φ" : ""})`)
      .join(" + ") || "0";
    const customTerm = this.params.customOn ? ` + ${this.params.customAmp.toFixed(2)}·[${this.params.customExpr}]` : "";
    const errorHtml = this.customError ? `<p style="color:#ff7b72"><b>Custom wave error:</b> ${this.customError}</p>` : "";
    this.setInfo(`
      <h2>Waveforms</h2>
      <p>Any periodic signal can be built from <b>sine waves</b>. Each component is
      <code>A·sin(f·x + φ)</code>: <b>A</b> sets height (amplitude), <b>f</b> sets how
      tightly it wiggles (frequency), <b>φ</b> shifts it sideways (phase).</p>
      <div class="formula" data-derivation="wave-sinusoid">
        <div class="formula-label">One sinusoidal component</div>
        <div class="formula-body">y(x) = A·sin(f·x + φ)</div>
        <div class="formula-note">Amplitude scales height, frequency advances the cycle, and phase chooses where the cycle starts.</div>
      </div>
      <div class="formula" data-derivation="wave-superposition">
        <div class="formula-label">Superposition</div>
        <div class="formula-body">y(x,t) = Σ y<sub>k</sub>(x,t)</div>
        <div class="formula-note">At each point, add the signed heights of every enabled component.</div>
      </div>
      <div class="readout"><div><span>Sum y(x,t)</span><b>${terms}${customTerm}</b></div></div>
      ${errorHtml}
      <p>The green curve is the <b>superposition</b> (the sum). Toggle waves and watch
      how they reinforce or cancel — this is the heart of Fourier analysis. Animation
      adds <code>+t</code> to the phase so the waves travel. Note: the derivative of
      <code>sin</code> is <code>cos</code> — a quarter-wave phase shift, tying back to
      Lesson 12. ${derivationButton("wave-sine-derivative")}</p>`);
  }

  private tick(dt: number): void {
    if (!this.params.animate) return;
    this.t += dt * this.params.speed;
    for (let k = 0; k < this.harmonics.length; k++) {
      const kk = k;
      updateCurveXY(this.compLines[kk], (x) => this.component(kk, x), this.a, this.b, 500);
    }
    updateCurveXY(this.customLine, (x) => this.customWave(x), this.a, this.b, 500);
    updateCurveXY(this.sumLine, (x) => this.sum(x), this.a, this.b, 600);
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.compLines = [];
  }
}
