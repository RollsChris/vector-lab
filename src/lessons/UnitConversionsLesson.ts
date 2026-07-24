import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  CATEGORIES,
  CONVERSION_RULE,
  convert,
  fmt,
  type Category,
  type Unit,
} from "./unitConversions";
import { segment, textSprite } from "./helpers";
import { UNIT_CONVERSION_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("unit-conversions", UNIT_CONVERSION_DERIVATIONS);

/**
 * Lesson — Unit Conversions.
 *
 * A self-contained conversion lesson: it teaches the single
 * underlying rule — multiply by a unit-fraction equal to 1 so unwanted units
 * cancel (dimensional analysis) — and gives a live calculator plus a centre-stage
 * scale visual spanning SI prefixes and everyday unit categories.
 */
export class UnitConversionsLesson implements Lesson {
  readonly id = "unit-conversions";
  readonly title = "3 · Unit Conversions";
  readonly blurb = "One rule + a live calculator";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["multiplication-division"] as const;

  private setInfo!: (html: string) => void;

  private cat: Category = CATEGORIES.find((c) => c.id === "length") ?? CATEGORIES[0];
  private from: Unit = this.cat.units.find((u) => u.id === "m") ?? this.cat.units[1]; // metre
  private to: Unit = this.cat.units.find((u) => u.id === "km") ?? this.cat.units[0]; // kilometre
  private value = 1;
  private group = new THREE.Group();
  private preview = new THREE.Group();

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.preview);
    ctx.viewport.setHelpers(true);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.8, 11),
      new THREE.Vector3(0, 0, 0),
    );
    this.renderPanel();
  }

  exit(): void {
    this.clearPreview();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.preview = new THREE.Group();
  }

  private renderPanel(): void {
    const catOptions = CATEGORIES.map(
      (c) => `<option value="${c.id}"${c === this.cat ? " selected" : ""}>${c.label}</option>`,
    ).join("");

    this.setInfo(`
      <h2>Unit Conversions</h2>
      <p>Swapping units feels like a pile of magic numbers — but it's really one
      idea applied over and over. Learn the rule once, then let the calculator do
      the arithmetic.</p>

      ${CONVERSION_RULE}

      <div class="course" id="conv-calc">
        <h3>Converter</h3>
        <label class="conv-row">
          <span>Category</span>
          <select id="conv-cat">${catOptions}</select>
        </label>
        <div class="conv-equation" aria-label="Unit conversion equation">
          <label class="conv-term">
            <span>Start</span>
            <input id="conv-value" type="number" step="any" value="${this.value}" />
            <select id="conv-from"></select>
          </label>
          <span class="conv-op">×</span>
          <div class="conv-factor-live" aria-label="Conversion factor">
            <output id="conv-factor-top">—</output>
            <output id="conv-factor-bottom">—</output>
          </div>
          <span class="conv-op">=</span>
          <label class="conv-term">
            <span>Result</span>
            <output id="conv-result" class="conv-result">—</output>
            <select id="conv-to"></select>
          </label>
          <button id="conv-swap" class="course-btn ghost" title="Swap units">⇅ Swap</button>
        </div>
        <div class="readout" id="conv-working">—</div>
      </div>`);

    const root = document.getElementById("info");
    if (!root) return;

    root.querySelector<HTMLSelectElement>("#conv-cat")
      ?.addEventListener("change", (e) => this.onCategory((e.target as HTMLSelectElement).value));
    root.querySelector<HTMLInputElement>("#conv-value")
      ?.addEventListener("input", (e) => {
        this.value = parseFloat((e.target as HTMLInputElement).value);
        this.compute();
      });
    root.querySelector<HTMLSelectElement>("#conv-from")
      ?.addEventListener("change", (e) => {
        this.from = this.unit((e.target as HTMLSelectElement).value);
        this.compute();
      });
    root.querySelector<HTMLSelectElement>("#conv-to")
      ?.addEventListener("change", (e) => {
        this.to = this.unit((e.target as HTMLSelectElement).value);
        this.compute();
      });
    root.querySelector<HTMLButtonElement>("#conv-swap")
      ?.addEventListener("click", () => this.swap());

    this.fillUnitSelects();
    this.compute();
  }

  private onCategory(id: string): void {
    this.cat = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
    // Default to the first two units of the new category.
    this.from = this.cat.units[Math.min(1, this.cat.units.length - 1)];
    this.to = this.cat.units[0];
    this.fillUnitSelects();
    this.compute();
  }

  private unit(id: string): Unit {
    return this.cat.units.find((u) => u.id === id) ?? this.cat.units[0];
  }

  private fillUnitSelects(): void {
    const opts = (sel: Unit) =>
      this.cat.units
        .map((u) => `<option value="${u.id}"${u === sel ? " selected" : ""}>${u.label}</option>`)
        .join("");
    const fromSel = document.getElementById("conv-from") as HTMLSelectElement | null;
    const toSel = document.getElementById("conv-to") as HTMLSelectElement | null;
    if (fromSel) fromSel.innerHTML = opts(this.from);
    if (toSel) toSel.innerHTML = opts(this.to);
  }

  private swap(): void {
    [this.from, this.to] = [this.to, this.from];
    this.fillUnitSelects();
    this.compute();
  }

  private compute(): void {
    const resultEl = document.getElementById("conv-result");
    const workEl = document.getElementById("conv-working");
    const factorTop = document.getElementById("conv-factor-top");
    const factorBottom = document.getElementById("conv-factor-bottom");
    if (!resultEl || !workEl || !factorTop || !factorBottom) return;

    if (!isFinite(this.value)) {
      resultEl.textContent = "—";
      factorTop.textContent = "—";
      factorBottom.textContent = "—";
      workEl.innerHTML = "Enter a number to convert.";
      this.clearPreview();
      return;
    }

    const out = convert(this.from, this.to, this.value);
    resultEl.textContent = `${fmt(out)} ${this.to.symbol}`;
    this.renderFactor(factorTop, factorBottom);
    workEl.innerHTML = this.workingHtml(out);
    this.drawPreview(out);
  }

  private renderFactor(top: HTMLElement, bottom: HTMLElement): void {
    if (this.from.id === this.to.id) {
      top.textContent = `1 ${this.to.symbol}`;
      bottom.textContent = `1 ${this.from.symbol}`;
      return;
    }

    if (!this.cat.linear) {
      top.textContent = "scale + shift";
      bottom.textContent = `${this.from.symbol} → ${this.to.symbol}`;
      return;
    }

    const perFrom = this.from.factor / this.to.factor;
    top.textContent = `${fmt(perFrom)} ${this.to.symbol}`;
    bottom.textContent = `1 ${this.from.symbol}`;
  }

  /** Build the step-by-step "show your working" line for the current conversion. */
  private workingHtml(out: number): string {
    const v = fmt(this.value);
    const o = fmt(out);

    if (this.from.id === this.to.id) {
      return `Same unit — nothing to do: <b>${v} ${this.to.symbol}</b>.`;
    }

    if (!this.cat.linear) {
      // Temperature: show the scale-and-shift, not a unit fraction.
      return `Temperature needs a scale <i>and</i> a shift (the zero points differ):<br>
        <code>${v} ${this.from.symbol}</code> → base ${fmt(this.from.factor * this.value + (this.from.offset ?? 0))} K →
        <b>${o} ${this.to.symbol}</b>.`;
    }

    // Linear: 1 fromUnit = (factor_from / factor_to) toUnit  → the conversion factor.
    const perFrom = this.from.factor / this.to.factor;
    return `Conversion factor: <code>1 ${this.from.symbol} = ${fmt(perFrom)} ${this.to.symbol}</code><br>
      <code>${v} <s>${this.from.symbol}</s> × ( ${fmt(perFrom)} ${this.to.symbol} / 1 <s>${this.from.symbol}</s> ) = ${o} ${this.to.symbol}</code>`;
  }

  private drawPreview(out: number): void {
    this.clearPreview();

    const title = textSprite(this.cat.label, 0xffffff, 0.45);
    title.position.set(0, 2.9, 0);
    this.preview.add(title);

    const equation = textSprite(`${fmt(this.value)} ${this.from.symbol}  =  ${fmt(out)} ${this.to.symbol}`, 0x7ee787, 0.48);
    equation.position.set(0, 2.35, 0);
    this.preview.add(equation);

    if (!this.cat.linear) {
      this.drawTemperaturePreview(out);
      return;
    }

    this.drawLinearScale();
    this.drawAmountBlocks(out);
  }

  private drawLinearScale(): void {
    const units = [...this.cat.units].sort((a, b) => a.factor - b.factor);
    const exponents = units.map((unit) => Math.log10(unit.factor));
    const minExp = Math.min(...exponents);
    const maxExp = Math.max(...exponents);
    const span = Math.max(maxExp - minExp, 1);

    this.preview.add(segment(new THREE.Vector3(-4.1, 0.15, 0), new THREE.Vector3(4.1, 0.15, 0), 0x58a6ff));

    // Units that are close in magnitude (e.g. m/yd/ft, or km/mi/nmi) land almost on top of
    // each other on this log-scaled axis. A single label row would overlap illegibly, so
    // each label claims the first row down where it clears its row-neighbour, stacking
    // into a second/third row instead of colliding.
    const inactiveRows: number[] = [];
    const activeRows: number[] = [];
    const rowStep = 0.36;
    const claimRow = (rows: number[], x: number, minGap: number): number => {
      let row = 0;
      while (rows[row] !== undefined && x - rows[row] < minGap) row++;
      rows[row] = x;
      return row;
    };

    for (const unit of units) {
      const x = -4 + ((Math.log10(unit.factor) - minExp) / span) * 8;
      const active = unit.id === this.from.id || unit.id === this.to.id;
      const tickHeight = active ? 0.7 : 0.38;
      this.preview.add(segment(new THREE.Vector3(x, 0.15 - tickHeight / 2, 0), new THREE.Vector3(x, 0.15 + tickHeight / 2, 0), active ? 0xffd166 : 0x8b949e));

      const scale = active ? 0.34 : 0.26;
      const row = active ? claimRow(activeRows, x, scale * 4.2) : claimRow(inactiveRows, x, scale * 4.2);
      const label = textSprite(unit.symbol, active ? 0xffd166 : 0xc9d1d9, scale);
      label.position.set(x, (active ? -0.65 : -0.42) - row * rowStep, 0);
      this.preview.add(label);
    }

    const fromX = -4 + ((Math.log10(this.from.factor) - minExp) / span) * 8;
    const toX = -4 + ((Math.log10(this.to.factor) - minExp) / span) * 8;
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(Math.sign(toX - fromX) || 1, 0, 0),
      new THREE.Vector3(fromX, 1.15, 0),
      Math.max(Math.abs(toX - fromX), 0.35),
      0x7ee787,
      0.28,
      0.18,
    );
    this.preview.add(arrow);

    const factor = this.from.factor / this.to.factor;
    const factorLabel = textSprite(`× ${fmt(factor)}`, 0x7ee787, 0.34);
    factorLabel.position.set((fromX + toX) / 2, 1.55, 0);
    this.preview.add(factorLabel);
  }

  private drawAmountBlocks(out: number): void {
    const fromBase = this.from.factor * this.value;
    const toBase = this.to.factor * out;
    const maxBase = Math.max(Math.abs(fromBase), Math.abs(toBase), 1e-9);
    const fromWidth = Math.max(0.2, (Math.abs(fromBase) / maxBase) * 3.2);
    const toWidth = Math.max(0.2, (Math.abs(toBase) / maxBase) * 3.2);
    this.preview.add(this.bar(-1.9, -2.1, fromWidth, 0x1f6feb, `${fmt(this.value)} ${this.from.symbol}`));
    this.preview.add(this.bar(1.9, -2.1, toWidth, 0x8957e5, `${fmt(out)} ${this.to.symbol}`));
  }

  private drawTemperaturePreview(out: number): void {
    const fromBase = this.from.factor * this.value + (this.from.offset ?? 0);
    const toBase = this.to.factor * out + (this.to.offset ?? 0);
    const minK = 200;
    const maxK = 400;
    const mapY = (k: number) => -1.8 + ((THREE.MathUtils.clamp(k, minK, maxK) - minK) / (maxK - minK)) * 3.4;
    this.preview.add(segment(new THREE.Vector3(-1, -1.8, 0), new THREE.Vector3(-1, 1.6, 0), 0xff7b72));
    this.preview.add(segment(new THREE.Vector3(1, -1.8, 0), new THREE.Vector3(1, 1.6, 0), 0x58a6ff));
    this.preview.add(segment(new THREE.Vector3(-1, mapY(fromBase), 0), new THREE.Vector3(1, mapY(toBase), 0), 0x7ee787));

    const fromLabel = textSprite(`${fmt(this.value)} ${this.from.symbol}`, 0xffd166, 0.34);
    fromLabel.position.set(-1.8, mapY(fromBase), 0);
    this.preview.add(fromLabel);
    const toLabel = textSprite(`${fmt(out)} ${this.to.symbol}`, 0x7ee787, 0.34);
    toLabel.position.set(1.8, mapY(toBase), 0);
    this.preview.add(toLabel);
  }

  private bar(x: number, y: number, width: number, color: number, label: string): THREE.Group {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.45, 0.35),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    mesh.position.set(0, 0, 0);
    group.add(mesh);
    const text = textSprite(label, 0xffffff, 0.28);
    text.position.set(0, -0.55, 0);
    group.add(text);
    group.position.set(x, y, 0);
    return group;
  }

  private clearPreview(): void {
    this.preview.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((m) => this.disposeMaterial(m));
      } else if (material) {
        this.disposeMaterial(material);
      }
    });
    this.preview.clear();
  }

  private disposeMaterial(material: THREE.Material): void {
    const withMap = material as THREE.Material & { map?: THREE.Texture };
    withMap.map?.dispose();
    material.dispose();
  }
}
