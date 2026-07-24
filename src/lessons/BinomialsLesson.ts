import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { pascalRow } from "../math/pascal";
import { BINOMIAL_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite } from "./helpers";

registerFormulaDerivations("binomials", BINOMIAL_DERIVATIONS);

type Stage = "multiply" | "powers" | "probability";

interface ProductPreset {
  readonly p: number;
  readonly q: number;
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
};

function superscript(value: number): string {
  return String(value).split("").map((digit) => SUPERSCRIPT_DIGITS[digit]).join("");
}

function powerFactor(variable: string, power: number): string {
  if (power === 0) return "";
  if (power === 1) return variable;
  return `${variable}${superscript(power)}`;
}

function algebraTerm(coefficient: number, aPower: number, bPower: number): string {
  if (aPower === 0 && bPower === 0) return String(coefficient);
  const coefficientText = coefficient === 1 ? "" : String(coefficient);
  return `${coefficientText}${powerFactor("a", aPower)}${powerFactor("b", bPower)}`;
}

function xPlusOneTerm(coefficient: number, xPower: number): string {
  if (xPower === 0) return String(coefficient);
  const coefficientText = coefficient === 1 ? "" : String(coefficient);
  return `${coefficientText}${powerFactor("x", xPower)}`;
}

export class BinomialsLesson implements Lesson {
  readonly id = "binomials";
  readonly title = "Binomials";
  readonly blurb = "From four products to Pascal coefficients and coin-flip probability";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["multiplication-division"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private stage: Stage = "multiply";
  private product: ProductPreset = { p: 2, q: 3 };
  private power = 4;
  private xValue = 2;
  private probabilityN = 4;
  private probabilityK = 2;
  private restoreControls: (() => void) | undefined;

  private readonly onInfoClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;

    const nextStage = button.dataset.binomialStage;
    if (nextStage === "multiply" || nextStage === "powers" || nextStage === "probability") {
      this.stage = nextStage;
      this.refresh();
      return;
    }

    const preset = button.dataset.binomialPreset;
    if (preset) {
      const [p, q] = preset.split("-").map(Number);
      if (Number.isInteger(p) && Number.isInteger(q)) {
        this.product = { p, q };
        this.refresh();
      }
      return;
    }

    const power = Number(button.dataset.binomialPower);
    if (Number.isInteger(power) && power >= 0 && power <= 6) {
      this.power = power;
      this.refresh();
      return;
    }

    const xValue = Number(button.dataset.binomialX);
    if (Number.isInteger(xValue) && xValue >= -1 && xValue <= 3) {
      this.xValue = xValue;
      this.refresh();
      return;
    }

    const probabilityN = Number(button.dataset.binomialProbN);
    if (Number.isInteger(probabilityN) && probabilityN >= 1 && probabilityN <= 8) {
      this.probabilityN = probabilityN;
      this.probabilityK = Math.min(this.probabilityK, probabilityN);
      this.refresh();
      return;
    }

    const probabilityK = Number(button.dataset.binomialProbK);
    if (
      Number.isInteger(probabilityK)
      && probabilityK >= 0
      && probabilityK <= this.probabilityN
    ) {
      this.probabilityK = probabilityK;
      this.refresh();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 0, 0));
    const rotateWasEnabled = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;
    this.restoreControls = () => {
      ctx.viewport.controls.enableRotate = rotateWasEnabled;
    };
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    this.refresh();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    this.restoreControls?.();
    this.restoreControls = undefined;
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.disposeGroup();
    if (this.stage === "multiply") this.buildProductScene();
    else if (this.stage === "powers") this.buildPowersScene();
    else this.buildProbabilityScene();
    this.renderPanel();
  }

  private buildProductScene(): void {
    const { p, q } = this.product;
    const xLength = 3.1;
    const unit = 0.62;
    const pLength = p * unit;
    const qLength = q * unit;
    const totalWidth = xLength + qLength;
    const totalHeight = xLength + pLength;
    const left = -totalWidth / 2;
    const bottom = -totalHeight / 2;

    this.addLabel(`(x + ${p})(x + ${q})`, 0, totalHeight / 2 + 1.15, 0x7ee787, 0.68);
    this.addLabel("area = width × height", 0, totalHeight / 2 + 0.55, 0x8b949e, 0.32);

    this.addRegion(left, bottom + pLength, xLength, xLength, 0x1f6feb, "x·x = x²");
    this.addRegion(left + xLength, bottom + pLength, qLength, xLength, 0x8957e5, `x·${q} = ${q}x`);
    this.addRegion(left, bottom, xLength, pLength, 0x2ea043, `${p}·x = ${p}x`);
    this.addRegion(left + xLength, bottom, qLength, pLength, 0xd29922, `${p}·${q} = ${p * q}`);

    const top = totalHeight / 2;
    this.addLabel("x", left + xLength / 2, top + 0.27, 0x79c0ff, 0.34);
    this.addLabel(String(q), left + xLength + qLength / 2, top + 0.27, 0xd2a8ff, 0.34);
    this.addLabel("x", left - 0.33, bottom + pLength + xLength / 2, 0x79c0ff, 0.34);
    this.addLabel(String(p), left - 0.33, bottom + pLength / 2, 0x7ee787, 0.34);
    this.addLabel(
      `x² + ${q}x + ${p}x + ${p * q} = x² + ${p + q}x + ${p * q}`,
      0,
      bottom - 0.72,
      0xe6edf3,
      0.38,
    );
  }

  private buildPowersScene(): void {
    const coefficients = pascalRow(this.power);
    const spacing = Math.min(1.55, 9.4 / coefficients.length);
    const startX = -((coefficients.length - 1) * spacing) / 2;

    this.addLabel(`Pascal row ${this.power} → (a + b)${superscript(this.power)}`, 0, 2.7, 0x7ee787, 0.58);
    this.addLabel("coefficient", -5.1, 0.92, 0x8b949e, 0.28);
    this.addLabel("aligned term", -5.1, -0.65, 0x8b949e, 0.28);

    coefficients.forEach((coefficient, index) => {
      const x = startX + index * spacing;
      this.addBox(x, 0.9, spacing * 0.7, 0.72, 0x1f6feb);
      this.addLabel(String(coefficient), x, 0.9, 0xffffff, 0.42);
      this.group.add(this.line(x, 0.46, x, -0.2, 0x30363d));
      this.addLabel(
        algebraTerm(coefficient, this.power - index, index),
        x,
        -0.65,
        index === 0 || index === coefficients.length - 1 ? 0x79c0ff : 0xd2a8ff,
        Math.min(0.36, spacing * 0.25),
      );
      this.addLabel(
        `a${superscript(this.power - index)}b${superscript(index)}`,
        x,
        -1.22,
        0x8b949e,
        Math.min(0.24, spacing * 0.18),
      );
    });

    const expansion = coefficients
      .map((coefficient, index) => algebraTerm(coefficient, this.power - index, index))
      .join(" + ");
    this.addLabel(`(a + b)${superscript(this.power)} = ${expansion}`, 0, -2.25, 0xe6edf3, 0.38);
  }

  private buildProbabilityScene(): void {
    const coefficients = pascalRow(this.probabilityN);
    const sequences = this.headSequences(this.probabilityN, this.probabilityK);
    const shown = sequences.slice(0, 12);
    const coefficientSpacing = Math.min(1.05, 9.2 / coefficients.length);
    const coefficientStart = -((coefficients.length - 1) * coefficientSpacing) / 2;

    this.addLabel(
      `exactly ${this.probabilityK} heads in ${this.probabilityN} fair flips`,
      0,
      3.75,
      0x7ee787,
      0.55,
    );
    this.addLabel(`Pascal row ${this.probabilityN}`, -4.7, 2.72, 0x8b949e, 0.27);
    coefficients.forEach((coefficient, index) => {
      const selected = index === this.probabilityK;
      const x = coefficientStart + index * coefficientSpacing;
      this.addBox(x, 2.72, coefficientSpacing * 0.72, 0.58, selected ? 0x2ea043 : 0x263041);
      this.addLabel(String(coefficient), x, 2.72, selected ? 0xffffff : 0x8b949e, 0.32);
    });
    this.addLabel(
      `C(${this.probabilityN}, ${this.probabilityK}) = ${coefficients[this.probabilityK]} arrangements`,
      0,
      1.9,
      0x79c0ff,
      0.4,
    );

    shown.forEach((sequence, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = (column - 1) * 3.05;
      const y = 0.95 - row * 0.82;
      this.addBox(x, y, 2.55, 0.58, 0x1c2638);
      this.addLabel(sequence, x, y, 0xe6edf3, 0.34);
    });

    if (sequences.length > shown.length) {
      this.addLabel(
        `showing ${shown.length} of ${sequences.length} arrangements`,
        0,
        -2.65,
        0x8b949e,
        0.32,
      );
    }
  }

  private renderPanel(): void {
    const body = this.stage === "multiply"
      ? this.productHtml()
      : this.stage === "powers"
        ? this.powersHtml()
        : this.probabilityHtml();

    this.setInfo(`
      <section class="binomial-lesson" data-binomial-current-stage="${this.stage}">
        <h2>Binomials</h2>
        <div class="binomial-stage-nav" aria-label="Binomials lesson stages">
          ${this.stageButton("multiply", "1 · multiply")}
          ${this.stageButton("powers", "2 · powers")}
          ${this.stageButton("probability", "3 · probability")}
        </div>
        ${body}
      </section>
    `);
  }

  private productHtml(): string {
    const { p, q } = this.product;
    const middle = p + q;
    const constant = p * q;
    return `
      <div id="binomial-stage-multiply">
        <p>A <b>binomial</b> is an expression with exactly <b>two terms</b>, such as
        <code>x + ${p}</code>. A monomial has one term; <code>x + ${p}</code> has the terms
        <code>x</code> and <code>${p}</code>.</p>
        <div class="binomial-choices" aria-label="Product presets">
          ${this.presetButton(2, 3)}
          ${this.presetButton(1, 4)}
          ${this.presetButton(3, 3)}
        </div>
        <h3>Distribute every term</h3>
        <p>The rectangle has side lengths <code>x + ${p}</code> and <code>x + ${q}</code>.
        Splitting each side makes exactly four regions, so no product can be missed.</p>
        <ol class="deriv binomial-derivation">
          <li><b class="step-title">First term × first term</b>
          <code>x·x = x²</code>.</li>
          <li><b class="step-title">First term × second term</b>
          <code>x·${q} = ${q}x</code>.</li>
          <li><b class="step-title">Second term × first term</b>
          <code>${p}·x = ${p}x</code>.</li>
          <li><b class="step-title">Second term × second term</b>
          <code>${p}·${q} = ${constant}</code>.</li>
          <li><b class="step-title">Add the four regions and combine like terms</b>
          <code>x² + ${q}x + ${p}x + ${constant}</code>, and
          <code>${q}x + ${p}x = ${middle}x</code>, so
          <b data-binomial-product-result><code>x² + ${middle}x + ${constant}</code></b>.</li>
        </ol>
        <p class="example"><b>FOIL is bookkeeping, not a new law.</b> First, Outer, Inner,
        Last names the same four products created by distribution and by the four areas.</p>
        ${derivationButton("binomial-product")}
        <button class="course-btn" data-binomial-stage="powers">Next: powers →</button>
      </div>
    `;
  }

  private powersHtml(): string {
    const coefficients = pascalRow(this.power);
    const expansion = coefficients
      .map((coefficient, index) => algebraTerm(coefficient, this.power - index, index))
      .join(" + ");
    const xExpansion = coefficients
      .map((coefficient, index) => xPlusOneTerm(coefficient, this.power - index))
      .join(" + ");
    const evaluatedTerms = coefficients.map(
      (coefficient, index) => coefficient * this.xValue ** (this.power - index),
    );
    const evaluated = evaluatedTerms.reduce((sum, value) => sum + value, 0);

    return `
      <div id="binomial-stage-powers">
        <p>Squaring is the two-binomial case
        <code>(a + b)² = (a + b)(a + b)</code>. A general power repeats that multiplication
        <code>n</code> times; Pascal's row <code>n</code> records how many identical terms combine.</p>
        <div class="binomial-control">
          <span>Exponent n</span>
          <div class="binomial-choices">${this.numberButtons("binomialPower", 0, 6, this.power)}</div>
        </div>
        <div class="binomial-pascal-map" data-binomial-pascal-row>
          ${coefficients.map((coefficient, index) => `
            <div>
              <b>${coefficient}</b>
              <span>${algebraTerm(coefficient, this.power - index, index)}</span>
            </div>`).join("")}
        </div>
        <div class="formula" data-derivation="binomial-theorem">
          <div class="formula-label">Row ${this.power}: ${coefficients.join(", ")}</div>
          <div class="formula-body" data-binomial-power-expansion>
            (a + b)${superscript(this.power)} = ${expansion}
          </div>
        </div>
        <p>Each choice takes either <code>a</code> or <code>b</code> from every bracket.
        Moving left to right, the number of chosen <code>a</code>s descends
        <code>${this.power} → 0</code>, while the number of chosen <code>b</code>s ascends
        <code>0 → ${this.power}</code>. Their exponents always add to <code>${this.power}</code>.
        The aligned Pascal coefficient counts how many choices produce that term.</p>
        <h3>Evaluate (x + 1)${superscript(this.power)}</h3>
        <div class="binomial-control">
          <span>Choose x</span>
          <div class="binomial-choices">
            ${[-1, 0, 1, 2, 3].map((value) => this.valueButton(value)).join("")}
          </div>
        </div>
        <div class="readout">
          <div><span>Expansion</span><b>${xExpansion}</b></div>
          <div><span>At x = ${this.xValue}</span><b>${evaluatedTerms.join(" + ")} = ${evaluated}</b></div>
          <div><span>Direct check</span><b>(${this.xValue} + 1)${superscript(this.power)} = ${evaluated}</b></div>
        </div>
        <button class="course-btn" data-binomial-stage="probability">Next: probability →</button>
      </div>
    `;
  }

  private probabilityHtml(): string {
    const coefficient = pascalRow(this.probabilityN)[this.probabilityK];
    const outcomes = 2 ** this.probabilityN;
    const probability = coefficient / outcomes;
    const sequences = this.headSequences(this.probabilityN, this.probabilityK);
    const shown = sequences.slice(0, 12);
    const sequenceNote = sequences.length > shown.length
      ? `<p class="binomial-sample-note">Showing ${shown.length} of ${sequences.length}; the coefficient counts the complete list.</p>`
      : "";

    return `
      <div id="binomial-stage-probability">
        <p>A fair coin has two equally likely results per flip. With ${this.probabilityN} flips,
        there are <code>2${superscript(this.probabilityN)} = ${outcomes}</code> equally likely
        sequences. We first count which sequences contain exactly ${this.probabilityK} heads.</p>
        <div class="binomial-control">
          <span>Number of flips n</span>
          <div class="binomial-choices">${this.numberButtons("binomialProbN", 1, 8, this.probabilityN)}</div>
        </div>
        <div class="binomial-control">
          <span>Exact heads k</span>
          <div class="binomial-choices">${this.numberButtons("binomialProbK", 0, this.probabilityN, this.probabilityK)}</div>
        </div>
        <div class="formula" data-derivation="binomial-combinations">
          <div class="formula-label">The same Pascal coefficient</div>
          <div class="formula-body" data-binomial-probability-coefficient>
            C(${this.probabilityN}, ${this.probabilityK}) = ${coefficient}
          </div>
        </div>
        <p><code>C(${this.probabilityN}, ${this.probabilityK})</code> counts the positions where
        the ${this.probabilityK} heads can go. Each particular sequence has probability
        <code>(1/2)${superscript(this.probabilityN)} = 1/${outcomes}</code>, because we multiply
        one factor of <code>1/2</code> for every independent flip.</p>
        <div class="binomial-sequences" aria-label="Head and tail arrangements">
          ${shown.map((sequence) => `<code>${sequence}</code>`).join("")}
        </div>
        ${sequenceNote}
        <div class="readout" data-binomial-probability-result>
          <div><span>Favourable arrangements</span><b>${coefficient}</b></div>
          <div><span>All equally likely sequences</span><b>${outcomes}</b></div>
          <div><span>Probability</span><b>${coefficient} / ${outcomes} = ${(probability * 100).toFixed(2)}%</b></div>
        </div>
        <p class="example"><b>Connection:</b> coefficient ${coefficient} first counted like
        algebra terms in <code>(a + b)${superscript(this.probabilityN)}</code>; now it counts
        coin sequences. Pascal's Triangle supplies the count, and probability supplies the
        factor <code>(1/2)${superscript(this.probabilityN)}</code>.</p>
      </div>
    `;
  }

  private stageButton(stage: Stage, label: string): string {
    const active = this.stage === stage;
    return `<button class="course-btn${active ? "" : " ghost"}" data-binomial-stage="${stage}"
      aria-pressed="${active}">${label}</button>`;
  }

  private presetButton(p: number, q: number): string {
    const active = this.product.p === p && this.product.q === q;
    return `<button class="binomial-choice${active ? " active" : ""}"
      data-binomial-preset="${p}-${q}">(x + ${p})(x + ${q})</button>`;
  }

  private numberButtons(
    dataName: "binomialPower" | "binomialProbN" | "binomialProbK",
    start: number,
    end: number,
    selected: number,
  ): string {
    const attribute = dataName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
      .map((value) => `<button class="binomial-choice binomial-number${value === selected ? " active" : ""}"
        data-${attribute}="${value}">${value}</button>`)
      .join("");
  }

  private valueButton(value: number): string {
    return `<button class="binomial-choice binomial-number${value === this.xValue ? " active" : ""}"
      data-binomial-x="${value}">${value}</button>`;
  }

  private headSequences(n: number, k: number): string[] {
    const sequences: string[] = [];
    const visit = (prefix: string, heads: number): void => {
      const remaining = n - prefix.length;
      if (heads > k || heads + remaining < k) return;
      if (prefix.length === n) {
        if (heads === k) sequences.push(prefix);
        return;
      }
      visit(`${prefix}H`, heads + 1);
      visit(`${prefix}T`, heads);
    };
    visit("", 0);
    return sequences;
  }

  private addRegion(
    left: number,
    bottom: number,
    width: number,
    height: number,
    color: number,
    label: string,
  ): void {
    const x = left + width / 2;
    const y = bottom + height / 2;
    const mesh = this.addBox(x, y, width, height, color);
    (mesh.material as THREE.Material).dispose();
    mesh.material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.12,
      roughness: 0.75,
      transparent: true,
      opacity: 0.86,
    });
    this.addLabel(label, x, y, 0xffffff, Math.min(0.42, width * 0.14, height * 0.18));
  }

  private addBox(x: number, y: number, width: number, height: number, color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, 0.12);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    mesh.position.set(x, y, 0);
    this.group.add(mesh);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x8b949e, transparent: true, opacity: 0.75 }),
    );
    outline.position.set(x, y, 0.07);
    this.group.add(outline);
    return mesh;
  }

  private addLabel(
    label: string,
    x: number,
    y: number,
    color: number,
    scale: number,
  ): void {
    const sprite = textSprite(label, color, scale);
    sprite.position.set(x, y, 0.2);
    this.group.add(sprite);
  }

  private line(x1: number, y1: number, x2: number, y2: number, color: number): THREE.Line {
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0.1),
        new THREE.Vector3(x2, y2, 0.1),
      ]),
      new THREE.LineBasicMaterial({ color }),
    );
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const renderable = object as THREE.Mesh | THREE.Line | THREE.Sprite;
      renderable.geometry?.dispose();
      const material = renderable.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => {
          (entry as THREE.SpriteMaterial).map?.dispose();
          entry.dispose();
        });
      } else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
