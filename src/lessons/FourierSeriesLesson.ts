import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { textSprite, tip } from "./helpers";
import "./formulaDerivations/waves";

type Waveform = "square" | "sawtooth" | "triangle";

interface FourierChapter {
  title: string;
  body: string;
}

const COLORS = {
  target: 0xf0f6fc,
  sum: 0x7ee787,
  error: 0xff7b72,
  spectrum: 0x79c0ff,
  axis: 0x4b5563,
};

const WAVE_NAMES: Record<Waveform, string> = {
  square: "Square wave",
  sawtooth: "Sawtooth wave",
  triangle: "Triangle wave",
};

const CHAPTERS: FourierChapter[] = [
  {
    title: "A shape is a recipe",
    body: `
      <p>A <b>periodic</b> signal repeats after one period: f(x + 2π) = f(x). Fourier's claim is that a repeatable shape can be described as a weighted recipe of the repeatable building blocks <code>sin(nx)</code> and <code>cos(nx)</code>.</p>
      <p>The integer n is a <b>harmonic</b>: n = 1 completes one cycle in a period, n = 2 completes two, and so on. The reconstruction lane adds those ingredients. Increasing the harmonic count adds finer detail because higher frequencies can change more quickly.</p>
      <p class="example"><b>Read the visual:</b> white is the signal you want; green is what the current recipe produces; red marks the remaining error; purple curves are the individual ingredients; bars below are their signed weights.</p>`,
  },
  {
    title: "Measuring a coefficient",
    body: `
      <p>Sines and cosines are <b>orthogonal</b> over a full period: when different frequencies are multiplied and averaged, their positive and negative areas cancel. That lets us measure one ingredient without the others getting in the way.</p>
      <div class="formula" data-derivation="fourier-coefficients"><div class="formula-label">Fourier coefficients over −π to π</div><div class="formula-body">a<sub>n</sub> = (1/π)∫ f(x)cos(nx) dx &nbsp;&nbsp; b<sub>n</sub> = (1/π)∫ f(x)sin(nx) dx</div><div class="formula-note">Multiply the signal by the candidate wave, then integrate over one full period. The result is that wave's weight.</div></div>
      <p>For the square wave, symmetry removes every cosine term and every even sine term. What remains is <code>4/π · (sin x + sin 3x/3 + sin 5x/5 + ...)</code>. The spectrum makes those missing even harmonics visible.</p>`,
  },
  {
    title: "The full series",
    body: `
      <div class="formula" data-derivation="fourier-real-series"><div class="formula-label">Real Fourier series</div><div class="formula-body">f(x) = a<sub>0</sub>/2 + Σ[a<sub>n</sub>cos(nx) + b<sub>n</sub>sin(nx)]</div><div class="formula-note">The constant term is the signal's average (DC offset). Cosine and sine terms provide independent horizontal phases for every harmonic.</div></div>
      <p>The displayed examples happen to use sine-only recipes because their shapes are odd about the origin. Shift a waveform left or right and cosine terms are needed too. In general, each frequency has both an amplitude and a phase.</p>
      <p><b>Compare decay:</b> square-wave weights fall as 1/n, sawtooth weights also fall as 1/n but alternate sign, and triangle-wave weights fall as 1/n². Faster decay means fewer high harmonics and a smoother-looking reconstruction.</p>`,
  },
  {
    title: "Convergence and Gibbs",
    body: `
      <p>At a point where the target is continuous, adding more terms converges to the target. At a jump, however, the Fourier series converges to the <b>midpoint</b> of the two sides. For a square wave that is zero at each vertical edge, not +1 or −1.</p>
      <p>The red ripples around a jump are the <b>Gibbs phenomenon</b>. More harmonics squeeze the ripples into a narrower region, but the peak overshoot stays about 9% of the jump height. It is a mathematical consequence of representing a discontinuity with smooth waves, not a bug in the renderer.</p>
      <p class="example"><b>Try it:</b> disable the purple component traces, turn on the red gap, then move from 1 to 15 terms on the square wave. Notice what improves globally and what stubbornly remains at the edges.</p>`,
  },
  {
    title: "Complex numbers and practice",
    body: `
      <p>Euler's formula <code>e<sup>inx</sup> = cos(nx) + i sin(nx)</code> combines the two real basis waves into one rotating complex phasor. The same series becomes <code>f(x) = Σ c<sub>n</sub>e<sup>inx</sup></code>, where the complex coefficient c<sub>n</sub> stores a harmonic's strength and phase together. ${derivationButton("fourier-complex-series")}</p>
      <p>This is the language used by FFT algorithms: an <b>FFT</b> rapidly estimates the harmonic coefficients of sampled data. It supports MP3/AAC audio compression, Wi-Fi and radio modulation, MRI reconstruction, vibration fault detection, image filtering, and power-quality analysis.</p>
      <p><b>Fourier series versus transform:</b> a series describes a repeating signal using discrete harmonics. The Fourier transform describes a non-repeating signal using a continuous range of frequencies. A DFT/FFT is the sampled, finite-data version used in software and instruments.</p>`,
  },
];


/**
 * Build a periodic waveform from its sine-wave components. The top lane is the
 * desired waveform, the middle lane is its partial Fourier sum, and the lower
 * bars reveal which harmonics are doing the work.
 */
export class FourierSeriesLesson implements Lesson {
  readonly id = "fourier-series";
  readonly title = "Fourier Series";
  readonly blurb = "Build any periodic shape from sine waves";
  readonly category = "Calculus" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["waveforms", "complex-numbers"] as const;

  private group = new THREE.Group();
  private targetLine!: THREE.Line;
  private sumLine!: THREE.Line;
  private errorLines!: THREE.LineSegments;
  private spectrumBars!: THREE.LineSegments;
  private componentLines: THREE.Line[] = [];
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private chapterIndex = 0;

  private params = {
    waveform: "square" as Waveform,
    terms: 5,
    showComponents: true,
    showError: true,
  };

  private readonly samples = 360;
  private readonly xMin = -5;
  private readonly xMax = 5;
  private readonly targetY = 2.1;
  private readonly sumY = -0.35;
  private readonly spectrumY = -3.05;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 11), new THREE.Vector3(0, -0.25, 0));

    this.buildScene();
    this.buildControls();
    this.update();
  }

  exit(): void {
    this.disposeGroup(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.componentLines = [];
  }

  private buildScene(): void {
    const axes = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(this.xMin, this.targetY, 0), new THREE.Vector3(this.xMax, this.targetY, 0),
        new THREE.Vector3(this.xMin, this.sumY, 0), new THREE.Vector3(this.xMax, this.sumY, 0),
        new THREE.Vector3(this.xMin, this.spectrumY, 0), new THREE.Vector3(this.xMax, this.spectrumY, 0),
      ]),
      new THREE.LineBasicMaterial({ color: COLORS.axis }),
    );
    this.group.add(axes);

    this.targetLine = this.makeLine(COLORS.target);
    this.sumLine = this.makeLine(COLORS.sum);
    this.errorLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: COLORS.error, transparent: true, opacity: 0.5 }),
    );
    this.spectrumBars = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: COLORS.spectrum }),
    );
    this.group.add(this.targetLine, this.sumLine, this.errorLines, this.spectrumBars);

    this.addLabel("Target waveform", this.targetY + 1.35, COLORS.target);
    this.addLabel("Fourier reconstruction", this.sumY + 1.35, COLORS.sum);
    this.addLabel("Harmonic recipe", this.spectrumY - 0.35, COLORS.spectrum);
  }

  private makeLine(color: number): THREE.Line {
    return new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  }

  private addLabel(text: string, y: number, color: number): void {
    const label = textSprite(text, color, 0.38);
    label.position.set(this.xMin + 0.15, y, 0.1);
    this.group.add(label);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "waveform", {
      "Square wave": "square",
      "Sawtooth wave": "sawtooth",
      "Triangle wave": "triangle",
    }).name("Target shape"), "Choose the repeating shape to reconstruct with sine waves").onChange(() => this.update());
    tip(g.add(this.params, "terms", 1, 15, 1).name("Harmonics"), "How many sine-wave terms to include in the reconstruction").onChange(() => this.update());
    tip(g.add(this.params, "showComponents").name("Show sine components"), "Show each individual harmonic faintly behind the green sum").onChange(() => this.update());
    tip(g.add(this.params, "showError").name("Show approximation gap"), "Show the remaining difference between target and reconstruction").onChange(() => this.update());
  }

  private update(): void {
    const targetPoints: THREE.Vector3[] = [];
    const sumPoints: THREE.Vector3[] = [];
    const errorPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= this.samples; i++) {
      const x = this.xMin + ((this.xMax - this.xMin) * i) / this.samples;
      const phase = (x / 5) * Math.PI;
      const target = this.target(phase);
      const sum = this.partialSum(phase);
      targetPoints.push(new THREE.Vector3(x, this.targetY + target, 0));
      sumPoints.push(new THREE.Vector3(x, this.sumY + sum, 0));
      if (i % 12 === 0) {
        errorPoints.push(
          new THREE.Vector3(x, this.sumY + sum, 0),
          new THREE.Vector3(x, this.sumY + target, 0),
        );
      }
    }
    this.targetLine.geometry.setFromPoints(targetPoints);
    this.sumLine.geometry.setFromPoints(sumPoints);
    this.errorLines.geometry.setFromPoints(errorPoints);
    this.errorLines.visible = this.params.showError;

    this.updateComponents();
    this.updateSpectrum();
    this.setInfo(this.infoHtml());
    this.bindCourseControls();
  }

  private updateComponents(): void {
    while (this.componentLines.length < this.params.terms) {
      const line = this.makeLine(0xd2a8ff);
      const material = line.material as THREE.LineBasicMaterial;
      material.transparent = true;
      material.opacity = 0.22;
      this.componentLines.push(line);
      this.group.add(line);
    }
    this.componentLines.forEach((line, index) => {
      const term = index + 1;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= this.samples; i++) {
        const x = this.xMin + ((this.xMax - this.xMin) * i) / this.samples;
        const phase = (x / 5) * Math.PI;
        points.push(new THREE.Vector3(x, this.sumY + this.coefficient(term) * Math.sin(term * phase), -0.01));
      }
      line.geometry.setFromPoints(points);
      line.visible = this.params.showComponents && index < this.params.terms && Math.abs(this.coefficient(term)) > 1e-8;
    });
  }

  private updateSpectrum(): void {
    const points: THREE.Vector3[] = [];
    for (let term = 1; term <= this.params.terms; term++) {
      const coefficient = this.coefficient(term);
      const x = -4.6 + ((term - 1) * 9.2) / Math.max(1, this.params.terms - 1);
      points.push(
        new THREE.Vector3(x, this.spectrumY, 0),
        new THREE.Vector3(x, this.spectrumY + coefficient * 0.8, 0),
      );
    }
    this.spectrumBars.geometry.setFromPoints(points);
  }

  private target(x: number): number {
    switch (this.params.waveform) {
      case "square":
        return Math.sin(x) >= 0 ? 1 : -1;
      case "sawtooth":
        return x / Math.PI;
      case "triangle":
        return (2 / Math.PI) * Math.asin(Math.sin(x));
    }
  }

  private coefficient(term: number): number {
    switch (this.params.waveform) {
      case "square":
        return term % 2 === 1 ? 4 / (Math.PI * term) : 0;
      case "sawtooth":
        return (2 / Math.PI) * (term % 2 === 1 ? 1 : -1) / term;
      case "triangle": {
        if (term % 2 === 0) return 0;
        const order = (term - 1) / 2;
        return (8 / Math.PI ** 2) * (order % 2 === 0 ? 1 : -1) / (term * term);
      }
    }
  }

  private partialSum(x: number): number {
    let sum = 0;
    for (let term = 1; term <= this.params.terms; term++) {
      sum += this.coefficient(term) * Math.sin(term * x);
    }
    return sum;
  }

  private infoHtml(): string {
    const name = WAVE_NAMES[this.params.waveform];
    const formula = this.params.waveform === "square"
      ? "4/π · (sin x + sin 3x/3 + sin 5x/5 + ...)"
      : this.params.waveform === "sawtooth"
        ? "2/π · (sin x − sin 2x/2 + sin 3x/3 − ...)"
        : "8/π² · (sin x − sin 3x/3² + sin 5x/5² − ...)";
    const seriesDerivation = this.params.waveform === "square"
      ? "fourier-square-wave"
      : this.params.waveform === "sawtooth"
        ? "fourier-sawtooth-wave"
        : "fourier-triangle-wave";
    const active = Array.from({ length: this.params.terms }, (_, index) => index + 1)
      .filter((term) => Math.abs(this.coefficient(term)) > 1e-8);

    const chapter = CHAPTERS[this.chapterIndex];
    return `
      <h2>Fourier Series</h2>
      <p>A Fourier series rebuilds a repeating shape by adding simple sine waves. The white line is the target; the green line is the sum of the first <b>${this.params.terms}</b> harmonics. Purple traces show the ingredients, and blue bars show their signed strengths.</p>
      <div class="readout">
        <div><span>Target</span><b>${name}</b></div>
        <div><span>Active harmonics</span><b>${active.join(", ") || "none"}</b></div>
        <div><span>Series</span><b>${formula}</b>${derivationButton(seriesDerivation)}</div>
      </div>
      <section class="course fourier-course" aria-labelledby="fourier-course-heading">
        <h3 id="fourier-course-heading">Learn it deeply</h3>
        <p class="course-hint">Follow the argument from a visual recipe to coefficients, convergence, and the complex-number form used in software.</p>
        <div class="course-chapters">
          ${CHAPTERS.map((entry, index) => `<button class="course-chapter ${index === this.chapterIndex ? "active" : ""}" data-fourier-chapter="${index}" aria-pressed="${index === this.chapterIndex}"><span class="course-num">${index + 1}</span>${entry.title}</button>`).join("")}
        </div>
      </section>
      <section class="course-lesson fourier-lesson" aria-live="polite">
        <div class="course-lesson-title">${this.chapterIndex + 1}. ${chapter.title}</div>
        ${chapter.body}
      </section>
    `;
  }

  private bindCourseControls(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-fourier-chapter]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.fourierChapter);
        if (index < 0 || index >= CHAPTERS.length) return;
        this.chapterIndex = index;
        this.update();
        document.querySelector(".fourier-lesson")?.scrollIntoView({ block: "nearest" });
      });
    });
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material?.dispose();
    });
    group.clear();
  }
}
