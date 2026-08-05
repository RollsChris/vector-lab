import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  INTEGER_LAB_PRESETS,
  MAX_INTEGER_LAB_HELPER_ARG,
  MAX_INTEGER_LAB_RANGE,
  type IntegerFn,
  type SeriesResult,
  buildIntegerSeries,
  formatIntegerLabNumber,
  fullSurvivalEnergy,
  instanceIdToInteger,
  survivalEnergy,
  tryCompileIntegerExpr,
} from "../math/integerLab";
import {
  eulerTotient,
  formatPrimeFactorisation,
  isPrime,
  mobius,
  primeFactors,
  primeGaps,
  sieve,
} from "../math/primes";
import { textSprite, tip } from "./helpers";
import { PRIME_DERIVATIONS } from "./formulaDerivations/foundations";
import { PRIME_CHAPTERS, PRIME_REFERENCES, type PrimeVisual } from "./primeCourse";

registerFormulaDerivations("prime-numbers", PRIME_DERIVATIONS);

const COLORS = {
  prime: new THREE.Color(0xffa657),
  selected: new THREE.Color(0x39c5cf),
  one: new THREE.Color(0x8b949e),
  composite: new THREE.Color(0x263041),
  gap: new THREE.Color(0x58a6ff),
  recordGap: new THREE.Color(0xd2a8ff),
  energyBar: new THREE.Color(0x58a6ff),
  energyPrime: new THREE.Color(0xffa657),
  energyComposite: new THREE.Color(0x3d4a5c),
  energySelected: new THREE.Color(0x39c5cf),
  energyNonfinite: new THREE.Color(0x21262d),
};

const PRESET_NAMES = Object.keys(INTEGER_LAB_PRESETS);

export class PrimeNumbersLesson implements Lesson {
  readonly id = "prime-numbers";
  readonly title = "Prime Numbers — Complete Guide";
  readonly blurb = "Patterns, proofs, algorithms and open frontiers";
  readonly category = "Foundations" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["foundations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private viewport!: Viewport;
  private numberMesh?: THREE.InstancedMesh;
  private pointerStart?: { x: number; y: number };
  private chapter = 0;
  private labFn: IntegerFn = (n) => survivalEnergy(n);
  private labExprError = "";
  private labSeries: SeriesResult | null = null;
  private labRangeStart = 1;
  private readonly params = {
    visual: "Sieve" as PrimeVisual,
    limit: 100,
    selected: 29,
    colourByFactor: true,
    rangeStart: 1,
    rangeEnd: 120,
    expr: "energy(n)",
    preset: "survival energy",
    threshold: 1,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0.5, 13),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildControls();
    this.renderPanel();
    this.loadChapter(0);
    ctx.viewport.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    ctx.viewport.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
  }

  exit(): void {
    this.viewport.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.viewport.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "visual", [
        "Sieve",
        "Ulam spiral",
        "Prime gaps",
        "Integer energy",
      ]).name("Visual"),
      "Switch between a number grid, the Ulam spiral, prime gaps, and the Integer Energy Lab chart.",
    ).onChange(() => this.rebuild());
    tip(
      this.gui.add(this.params, "limit", 30, 2500, 1).name("Numbers through").listen(),
      "Upper limit used by the sieve, spiral and gap visualisations.",
    ).onFinishChange(() => this.rebuild());
    tip(
      this.gui.add(this.params, "selected", 1, 100000, 1).name("Inspect n").listen(),
      "Inspect primality, factorisation, Euler's totient and the Möbius function.",
    ).onFinishChange(() => this.rebuild());
    tip(
      this.gui.add(this.params, "colourByFactor").name("Factor colours"),
      "Colour composites by their smallest prime factor in the grid views.",
    ).onChange(() => this.rebuild());

    const lab = this.gui.addFolder("Integer Energy Lab");
    tip(
      lab.add(this.params, "rangeStart", 1, 5000, 1).name("Range start").listen(),
      "First integer on the energy chart (inclusive).",
    ).onFinishChange(() => this.rebuild());
    tip(
      lab.add(this.params, "rangeEnd", 1, 10000, 1).name("Range end").listen(),
      `Last integer on the chart. Span is capped at ${MAX_INTEGER_LAB_RANGE.toLocaleString()} points.`,
    ).onFinishChange(() => this.rebuild());
    tip(
      lab.add(this.params, "preset", PRESET_NAMES).name("Preset"),
      "Load a classic integer function. Choose Custom after editing the expression freely.",
    ).onChange((name: string) => {
      const expr = INTEGER_LAB_PRESETS[name];
      if (expr) {
        this.params.expr = expr;
        this.applyLabExpression(true);
      }
    });
    tip(
      lab.add(this.params, "expr").name("f(n)"),
      `Strict integer expression in n. Helpers: isprime, phi, mu, omega, gcd, lcm, energy, fullenergy (args |x|≤${MAX_INTEGER_LAB_HELPER_ARG.toLocaleString()}).`,
    ).onFinishChange(() => this.applyLabExpression(true));
    tip(
      lab.add(this.params, "threshold", -20, 40, 0.25).name("Threshold").listen(),
      "y ≥ threshold marks candidates for precision/recall against true primes.",
    ).onFinishChange(() => this.rebuild());
    lab.open();
  }

  /** Compile f(n); on failure keep the last valid function and series. */
  private applyLabExpression(rebuild: boolean): void {
    const result = tryCompileIntegerExpr(this.params.expr);
    if (result.fn) {
      this.labFn = result.fn;
      this.labExprError = "";
    } else {
      this.labExprError = result.error;
    }
    if (rebuild) this.rebuild();
  }

  private renderPanel(): void {
    const chips = PRIME_CHAPTERS.map((chapter, index) => `
      <button class="course-chapter" data-prime-ch="${index}">
        <span class="course-num">${index + 1}</span>${chapter.title}
      </button>`).join("");

    this.setInfo(`
      <h2>Prime Numbers — Complete Guide</h2>
      <p>Prime numbers are arithmetic's indivisible building blocks. No finite lesson can contain
      every research paper about them; this course maps the established core, the major algorithms
      and the frontier where knowledge becomes conjecture.</p>
      <div class="course">
        <h3>Known territory → open frontier</h3>
        <p class="course-hint">Each chapter selects a useful visual. Change the limit or inspect any
        integer in the controls to test the claims yourself.</p>
        <div class="course-chapters">${chips}</div>
        <div id="prime-lesson" class="course-lesson"></div>
        <div class="course-nav">
          <button id="prime-prev" class="course-btn ghost">‹ Prev</button>
          <span id="prime-progress" class="course-progress">—</span>
          <button id="prime-next" class="course-btn">Next ›</button>
        </div>
      </div>
      <div class="readout" id="prime-readout"></div>
      <div class="formula" data-derivation-exempt="Visual stage legend, not a mathematical formula">
        <div class="formula-label">Stage legend</div>
        <div class="formula-note"><b style="color:#ffa657">Orange</b> = prime,
        <b style="color:#39c5cf">cyan</b> = selected integer,
        <b style="color:#d2a8ff">purple</b> = record gap so far. Composite colours identify
        their smallest prime factor when enabled. In the Integer Energy Lab, bar height is
        <code>f(n)</code> with prime/composite colour context.
        <b>Click any bar or square</b> to inspect factors and lab metrics.</div>
      </div>
      ${PRIME_REFERENCES}`);

    const root = document.getElementById("info");
    root?.querySelectorAll<HTMLButtonElement>("[data-prime-ch]").forEach((button) => {
      button.addEventListener("click", () => this.loadChapter(Number(button.dataset.primeCh)));
    });
    root?.querySelector<HTMLButtonElement>("#prime-prev")
      ?.addEventListener("click", () => this.loadChapter(this.chapter - 1));
    root?.querySelector<HTMLButtonElement>("#prime-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
  }

  private loadChapter(index: number): void {
    this.chapter = Math.max(0, Math.min(PRIME_CHAPTERS.length - 1, index));
    const chapter = PRIME_CHAPTERS[this.chapter];
    this.params.visual = chapter.visual;
    this.params.limit = chapter.limit;
    this.params.selected = chapter.selected;
    if (chapter.visual === "Integer energy") {
      this.params.rangeStart = 1;
      this.params.rangeEnd = chapter.limit;
      this.params.preset = "survival energy";
      this.params.expr = INTEGER_LAB_PRESETS["survival energy"];
      this.params.threshold = 1;
      this.applyLabExpression(false);
    }
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.refreshCourse();
    this.rebuild();
    document.getElementById("prime-lesson")?.scrollIntoView({ block: "nearest" });
  }

  private refreshCourse(): void {
    document.querySelectorAll<HTMLElement>("[data-prime-ch]").forEach((button, index) => {
      button.classList.toggle("active", index === this.chapter);
    });
    const chapter = PRIME_CHAPTERS[this.chapter];
    const lesson = document.getElementById("prime-lesson");
    if (lesson) {
      lesson.innerHTML = `
        <div class="course-lesson-title">${this.chapter + 1} · ${chapter.title}</div>
        <p><b>Goal:</b> ${chapter.objective}</p>${chapter.content}`;
    }
    const progress = document.getElementById("prime-progress");
    if (progress) progress.textContent = `${this.chapter + 1} / ${PRIME_CHAPTERS.length}`;
    const previous = document.getElementById("prime-prev") as HTMLButtonElement | null;
    const next = document.getElementById("prime-next") as HTMLButtonElement | null;
    if (previous) previous.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === PRIME_CHAPTERS.length - 1;
  }

  private rebuild(): void {
    this.params.limit = Math.max(30, Math.min(2500, Math.round(this.params.limit)));
    this.params.selected = Math.max(1, Math.min(100000, Math.round(this.params.selected)));
    this.params.rangeStart = Math.max(1, Math.min(100000, Math.round(this.params.rangeStart)));
    this.params.rangeEnd = Math.max(1, Math.min(100000, Math.round(this.params.rangeEnd)));
    this.params.threshold = Number.isFinite(this.params.threshold) ? this.params.threshold : 1;
    this.numberMesh = undefined;
    this.disposeGroup();

    if (this.params.visual === "Sieve") this.drawSieve();
    else if (this.params.visual === "Ulam spiral") this.drawUlamSpiral();
    else if (this.params.visual === "Integer energy") this.drawIntegerEnergy();
    else this.drawPrimeGaps();
    this.updateReadout();
  }

  private drawIntegerEnergy(): void {
    const series = buildIntegerSeries(
      this.params.rangeStart,
      this.params.rangeEnd,
      this.labFn,
      this.params.threshold,
    );
    this.labSeries = series;
    this.labRangeStart = series.range.start;

    // Keep selected inside the plotted window when possible so click/readout stay aligned.
    if (this.params.selected < series.range.start || this.params.selected > series.range.end) {
      // Do not force-clamp on every rebuild — user may inspect outside the chart.
    }

    const count = series.points.length;
    if (count === 0) return;

    const width = 10 / count;
    const barWidth = Math.max(0.01, width * 0.78);
    const geometry = new THREE.BoxGeometry(barWidth, 1, 0.2);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.04 });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    this.numberMesh = mesh;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    series.points.forEach((point, index) => {
      const t = series.scale.normalize(point.finite ? point.y : Number.NaN);
      const height = Math.max(0.06, t * 7.2);
      position.set(-5 + (index + 0.5) * width, -3.7 + height / 2, 0);
      scale.set(1, height, 1);
      matrix.compose(position, quat, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, this.energyColour(point.n, point.prime, point.finite));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);

    // Baseline
    const axis = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.03, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x8b949e, roughness: 0.9 }),
    );
    axis.position.set(0, -3.7, -0.05);
    this.group.add(axis);
  }

  private energyColour(n: number, prime: boolean, finite: boolean): THREE.Color {
    if (n === this.params.selected) return COLORS.energySelected;
    if (!finite) return COLORS.energyNonfinite;
    if (prime) return COLORS.energyPrime;
    if (n === 1) return COLORS.one;
    return COLORS.energyComposite;
  }

  private drawSieve(): void {
    const limit = this.params.limit;
    const columns = Math.ceil(Math.sqrt(limit));
    const rows = Math.ceil(limit / columns);
    const cell = Math.min(10 / columns, 8 / rows);
    const geometry = new THREE.BoxGeometry(cell * 0.78, cell * 0.78, 1);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(geometry, material, limit);
    this.numberMesh = mesh;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    this.group.add(mesh);

    for (let number = 1; number <= limit; number++) {
      const column = (number - 1) % columns;
      const row = Math.floor((number - 1) / columns);
      const height = isPrime(number) ? 0.28 : 0.08;
      position.set(
        (column - (columns - 1) / 2) * cell,
        ((rows - 1) / 2 - row) * cell,
        height / 2,
      );
      scale.set(1, 1, height);
      matrix.compose(position, new THREE.Quaternion(), scale);
      mesh.setMatrixAt(number - 1, matrix);
      mesh.setColorAt(number - 1, this.numberColour(number));
      if (isPrime(number)) {
        this.addPrimeLabel(number, position.x, position.y, height + 0.035, cell);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  private drawUlamSpiral(): void {
    const limit = this.params.limit;
    const coordinates = this.spiralCoordinates(limit);
    const radius = Math.max(1, ...coordinates.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    const cell = 4.8 / radius;
    const geometry = new THREE.BoxGeometry(cell * 0.72, cell * 0.72, 1);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.72 });
    const mesh = new THREE.InstancedMesh(geometry, material, limit);
    this.numberMesh = mesh;
    const matrix = new THREE.Matrix4();
    this.group.add(mesh);

    coordinates.forEach(([x, y], index) => {
      const number = index + 1;
      const height = isPrime(number) ? 0.34 : 0.055;
      matrix.compose(
        new THREE.Vector3(x * cell, y * cell, height / 2),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, height),
      );
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, this.numberColour(number));
      if (isPrime(number)) {
        this.addPrimeLabel(number, x * cell, y * cell, height + 0.04, cell);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  private drawPrimeGaps(): void {
    const gaps = primeGaps(this.params.limit);
    if (gaps.length === 0) return;
    const maxGap = Math.max(...gaps.map((entry) => entry.gap));
    const width = 10 / gaps.length;
    const geometry = new THREE.BoxGeometry(Math.max(0.012, width * 0.75), 1, 0.18);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.65 });
    const mesh = new THREE.InstancedMesh(geometry, material, gaps.length);
    const matrix = new THREE.Matrix4();
    let record = 0;

    gaps.forEach((entry, index) => {
      const height = Math.max(0.08, (entry.gap / maxGap) * 7.5);
      matrix.compose(
        new THREE.Vector3(-5 + (index + 0.5) * width, -3.75 + height / 2, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(1, height, 1),
      );
      mesh.setMatrixAt(index, matrix);
      const isRecord = entry.gap > record;
      if (isRecord) record = entry.gap;
      const selected = entry.lower === this.params.selected || entry.upper === this.params.selected;
      mesh.setColorAt(index, selected ? COLORS.selected : isRecord ? COLORS.recordGap : COLORS.gap);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  private numberColour(number: number): THREE.Color {
    if (isPrime(number)) return COLORS.prime;
    if (number === this.params.selected) return COLORS.selected;
    if (number === 1) return COLORS.one;
    if (!this.params.colourByFactor) return COLORS.composite;

    const smallest = primeFactors(number)[0] ?? 2;
    const hue = ((smallest * 0.137) % 1 + 1) % 1;
    return new THREE.Color().setHSL(hue, 0.5, 0.28);
  }

  private addPrimeLabel(number: number, x: number, y: number, z: number, cell: number): void {
    const label = textSprite(String(number), 0x1c2128, cell * 0.32);
    label.position.set(x, y, z);
    label.scale.set(cell * 0.68, cell * 0.32, 1);
    label.renderOrder = 2;
    this.group.add(label);
  }

  private updateReadout(): void {
    const n = this.params.selected;
    const primes = sieve(this.params.limit);
    const factors = primeFactors(n);
    const distinctFactors = new Set(factors);
    const divisorCount = n === 1
      ? 1
      : [...distinctFactors].reduce((count, factor) => {
          const exponent = factors.filter((value) => value === factor).length;
          return count * (exponent + 1);
        }, 1);
    const gaps = primeGaps(this.params.limit);
    const largestGap = gaps.reduce((best, gap) => gap.gap > best.gap ? gap : best, gaps[0]);
    const status = isPrime(n) ? "prime" : n === 1 ? "unit (neither prime nor composite)" : "composite";
    const divisors = this.positiveDivisors(n);
    const factorPairs = divisors
      .filter((factor) => factor <= n / factor)
      .map((factor) => `${factor} × ${n / factor}`)
      .join(", ");
    const readout = document.getElementById("prime-readout");
    if (!readout) return;

    const labExtra = this.params.visual === "Integer energy"
      ? this.integerLabReadout(n, status)
      : "";

    readout.innerHTML = `
      <div><span>Inspected integer</span><b>${n.toLocaleString()} — ${status}</b></div>
      <div><span>Prime factorisation</span><b>${formatPrimeFactorisation(n)}</b></div>
      <div><span>All positive factors</span><b>${divisors.join(", ")}</b></div>
      <div><span>Factor pairs</span><b>${factorPairs}</b></div>
      <div><span>Positive divisors</span><b>${divisorCount.toLocaleString()}</b></div>
      <div><span>Euler φ(n)</span><b>${eulerTotient(n).toLocaleString()}</b></div>
      <div><span>Möbius μ(n)</span><b>${mobius(n)}</b></div>
      <div><span>π(${this.params.limit.toLocaleString()})</span><b>${primes.length.toLocaleString()} primes</b></div>
      <div><span>Density through limit</span><b>${((primes.length / this.params.limit) * 100).toFixed(2)}%</b></div>
      <div><span>Largest gap through limit</span><b>${largestGap ? `${largestGap.gap} (${largestGap.lower} → ${largestGap.upper})` : "—"}</b></div>
      ${labExtra}`;
  }

  private integerLabReadout(n: number, status: string): string {
    const series = this.labSeries;
    let yText = "—";
    let above = false;
    let energy = survivalEnergy(n);
    let full = fullSurvivalEnergy(n);
    if (series) {
      const point = series.points.find((entry) => entry.n === n);
      if (point) {
        yText = point.finite ? this.formatLabNumber(point.y) : "non-finite";
        above = point.aboveThreshold;
        energy = point.energy;
        full = point.fullEnergy;
      } else {
        try {
          const y = this.labFn(n);
          yText = Number.isFinite(y) ? this.formatLabNumber(y) : "non-finite";
          above = Number.isFinite(y) && y >= this.params.threshold;
        } catch {
          yText = "error";
        }
      }
    }
    const metrics = series?.metrics;
    const range = series?.range;
    const exprNote = this.labExprError
      ? `<div><span>Expression</span><b class="warn">Invalid — kept last plot (${this.escapeHtml(this.labExprError)})</b></div>`
      : `<div><span>Expression</span><b><code>${this.escapeHtml(this.params.expr)}</code></b></div>`;
    const factorsNote = status === "composite"
      ? `<div><span>Lab factors</span><b>${formatPrimeFactorisation(n)}</b></div>`
      : "";

    return `
      ${exprNote}
      <div><span>f(${n.toLocaleString()})</span><b>${yText}</b></div>
      <div><span>Survival energy E(n)</span><b>${energy} / full ${full}${energy === full && n >= 2 ? " (survived √n)" : ""}</b></div>
      <div><span>Threshold status</span><b>${above ? `candidate (y ≥ ${this.formatLabNumber(this.params.threshold)})` : `below ${this.formatLabNumber(this.params.threshold)}`}</b></div>
      ${factorsNote}
      <div><span>Lab range</span><b>${range ? `${range.start}…${range.end} (${range.count} pts${range.capped ? ", capped" : ""})` : "—"}</b></div>
      <div><span>Candidates</span><b>${metrics ? metrics.candidateCount.toLocaleString() : "—"}</b></div>
      <div><span>Prime hits</span><b>${metrics ? metrics.primeHits.toLocaleString() : "—"}</b></div>
      <div><span>Precision</span><b>${metrics ? `${(metrics.precision * 100).toFixed(1)}%` : "—"}</b></div>
      <div><span>Recall</span><b>${metrics ? `${(metrics.recall * 100).toFixed(1)}%` : "—"}</b></div>`;
  }

  private formatLabNumber(value: number): string {
    return formatIntegerLabNumber(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private positiveDivisors(value: number): number[] {
    const lower: number[] = [];
    const upper: number[] = [];
    for (let factor = 1; factor * factor <= value; factor++) {
      if (value % factor !== 0) continue;
      lower.push(factor);
      if (factor * factor !== value) upper.push(value / factor);
    }
    return lower.concat(upper.reverse());
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.pointerStart = { x: event.clientX, y: event.clientY };
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart || event.button !== 0 || !this.numberMesh) return;
    const moved = Math.hypot(
      event.clientX - this.pointerStart.x,
      event.clientY - this.pointerStart.y,
    );
    this.pointerStart = undefined;
    if (moved > 5) return;

    const canvas = this.viewport.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.viewport.camera);
    const hit = raycaster.intersectObject(this.numberMesh, false)[0];
    if (hit?.instanceId === undefined) return;

    const number = this.params.visual === "Integer energy"
      ? instanceIdToInteger(hit.instanceId, this.labRangeStart)
      : hit.instanceId + 1;
    this.params.selected = number;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.rebuild();
  };

  private spiralCoordinates(limit: number): Array<readonly [number, number]> {
    const coordinates: Array<readonly [number, number]> = [[0, 0]];
    let x = 0;
    let y = 0;
    let direction = 0;
    let runLength = 1;
    const moves = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;

    while (coordinates.length < limit) {
      for (let repeat = 0; repeat < 2 && coordinates.length < limit; repeat++) {
        const [dx, dy] = moves[direction % 4];
        for (let step = 0; step < runLength && coordinates.length < limit; step++) {
          x += dx;
          y += dy;
          coordinates.push([x, y]);
        }
        direction++;
      }
      runLength++;
    }
    return coordinates;
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) object.dispose();
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((material) => {
        if (material instanceof THREE.SpriteMaterial) material.map?.dispose();
        material.dispose();
      });
    });
    this.group.clear();
  }
}
