import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  decimalFromPercent,
  formatDecimal,
  formatScientific,
  percentFromDecimal,
  toScientific,
} from "../math/numberLanguage";
import { textSprite } from "./helpers";

type View = "decimal" | "percent" | "scientific";

const VIEWS: readonly { id: View; label: string }[] = [
  { id: "decimal", label: "Decimals" },
  { id: "percent", label: "Percentages" },
  { id: "scientific", label: "Scientific notation" },
] as const;

const PRESETS = [0.35, 0.0034, 34000, 1.5, 0.07] as const;
const PLACES = [
  { name: "ten thousands", exponent: 4 },
  { name: "thousands", exponent: 3 },
  { name: "hundreds", exponent: 2 },
  { name: "tens", exponent: 1 },
  { name: "ones", exponent: 0 },
  { name: "tenths", exponent: -1 },
  { name: "hundredths", exponent: -2 },
  { name: "thousandths", exponent: -3 },
  { name: "ten-thousandths", exponent: -4 },
] as const;

function finiteNumber(value: string): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return undefined;
  if (Math.abs(parsed) > 1e12 || Math.abs(parsed) < 1e-12) return undefined;
  return parsed;
}

export class DecimalsScientificNotationLesson implements Lesson {
  readonly id = "decimals-scientific-notation";
  readonly title = "Decimals, Percentages & Scientific Notation";
  readonly blurb = "Same amount, three writings: decimal, percent, and a power of ten";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["number-sense-fractions"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private canvas!: HTMLCanvasElement;
  private view: View = "decimal";
  private amount = 0.35;
  private inputError = "";

  private readonly onInfoClick = (event: Event): void => {
    const viewButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-notation-view]");
    if (viewButton) {
      const view = viewButton.dataset.notationView as View;
      if (!VIEWS.some((candidate) => candidate.id === view)) return;
      this.view = view;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-notation-view="${view}"]`);
      return;
    }

    const presetButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-notation-preset]");
    if (presetButton) {
      const value = Number(presetButton.dataset.notationPreset);
      if (!Number.isFinite(value)) return;
      this.amount = value;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-notation-preset="${value}"]`);
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-notation-input]");
    if (!input) return;
    const value = finiteNumber(input.value);
    if (value === undefined) {
      this.inputError = "Enter a non-zero number whose size sits between 10^−12 and 10^12.";
      this.renderPanel();
      this.focusAfterRender("[data-notation-input]");
      return;
    }
    this.amount = value;
    this.inputError = "";
    this.refresh();
    this.focusAfterRender("[data-notation-input]");
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.canvas = ctx.viewport.renderer.domElement;
    this.canvas.setAttribute("role", "img");
    this.canvas.tabIndex = 0;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.25, 12), new THREE.Vector3(0, 0.05, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    document.getElementById("info")?.addEventListener("change", this.onInfoChange);
    this.refresh();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    document.getElementById("info")?.removeEventListener("change", this.onInfoChange);
    this.canvas.removeAttribute("role");
    this.canvas.setAttribute("aria-label", "Interactive WebGL lesson scene");
    this.canvas.removeAttribute("tabindex");
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.drawStage();
    this.renderPanel();
    this.canvas.setAttribute("aria-label", this.stageSummary());
  }

  private renderPanel(): void {
    const viewButtons = VIEWS.map((view) => `
      <button class="course-btn${view.id === this.view ? "" : " ghost"}"
        data-notation-view="${view.id}"
        aria-pressed="${view.id === this.view}">${view.label}</button>`).join("");
    const presets = PRESETS.map((value) => `
      <button class="course-btn${value === this.amount ? "" : " ghost"}"
        data-notation-preset="${value}"
        aria-pressed="${value === this.amount}">${formatDecimal(value)}</button>`).join("");

    this.setInfo(`
      <h2>Decimals, Percentages & Scientific Notation</h2>
      <p>A decimal, a percentage, and scientific notation are three writings of one amount.
      The decimal extends place value through the ones. The percentage counts per hundred.
      Scientific notation packs the same digits as a coefficient times a power of ten.</p>

      <section class="course">
        <h3>Choose a writing</h3>
        <div class="operation-lab-tabs" role="group" aria-label="Amount writing">
          ${viewButtons}
        </div>
        <div class="operation-lab-inputs">
          <label>Amount
            <input type="number" inputmode="decimal" step="any" value="${this.amount}"
              data-notation-input />
          </label>
        </div>
        <div class="operation-lab-tabs" role="group" aria-label="Example amounts">${presets}</div>
        <div class="operation-lab-readout" aria-live="polite">
          <b>${this.stageSummary()}</b>
          <span>${this.stageExplanation()}</span>
        </div>
        ${this.inputError ? `<p class="operation-lab-feedback error" role="alert">${this.inputError}</p>` : ""}
        ${this.viewBody()}
        <p class="course-hint">The canvas is a visual model; every result also appears here as
        text. All controls work with Tab, Shift+Tab, Enter, and Space.</p>
      </section>

      ${this.viewReference()}`);
  }

  private viewBody(): string {
    const { coefficient, exponent } = toScientific(this.amount);
    const percent = percentFromDecimal(this.amount);
    switch (this.view) {
      case "decimal":
        return `
          <p>Each place is ten times the place on its right. After the ones come tenths,
          hundredths, thousandths. <code>${formatDecimal(this.amount)}</code> already sits
          in that grid.</p>
          <p>The highlighted house is the leading place of this amount. Moving one house
          left multiplies by ten. Moving one house right divides by ten.</p>`;
      case "percent":
        return `
          <p><b>Percent</b> means per hundred. Multiply the decimal by 100, or move the
          point two places left-to-right:
          <code>${formatDecimal(this.amount)} = ${formatDecimal(percent)}%</code>.</p>
          <p>Going back, divide by 100:
          <code>${formatDecimal(percent)}% = ${formatDecimal(decimalFromPercent(percent))}</code>.
          A percentage larger than 100, such as 150%, is just an amount larger than one whole.</p>`;
      case "scientific":
        return `
          <p>Scientific notation writes a number as a coefficient between 1 and 10, times a
          power of ten: <code>${formatScientific(this.amount)}</code>.</p>
          <p>The exponent counts how many places the point moved —
          ${Math.abs(exponent)} place${Math.abs(exponent) === 1 ? "" : "s"}
          ${exponent >= 0 ? "left" : "right"} to leave
          <code>${formatDecimal(coefficient)}</code>.
          A positive exponent is a large number. A negative exponent is a small number.</p>`;
    }
  }

  private viewReference(): string {
    switch (this.view) {
      case "decimal":
        return `
          <section class="course">
            <h3>Place value after the ones</h3>
            <ul>
              <li>0.3 is 3 tenths. 0.03 is 3 hundredths. 0.003 is 3 thousandths.</li>
              <li>A terminating decimal is a fraction whose denominator is a power of ten.</li>
              <li>1/3 is 0.333… — a repeating decimal, not a finite one.</li>
            </ul>
          </section>`;
      case "percent":
        return `
          <section class="course">
            <h3>Three writings of one amount</h3>
            <ul>
              <li><code>0.35 = 35/100 = 35%</code></li>
              <li><code>0.07 = 7/100 = 7%</code></li>
              <li><code>1.5 = 150/100 = 150%</code></li>
              <li><code>0.0034 = 0.34%</code> — smaller than one percent.</li>
            </ul>
          </section>`;
      case "scientific":
        return `
          <section class="course">
            <h3>Keep the coefficient honest</h3>
            <ul>
              <li><code>0.35 = 3.5 × 10^−1</code></li>
              <li><code>0.0034 = 3.4 × 10^−3</code></li>
              <li><code>34000 = 3.4 × 10^4</code>, not <code>34 × 10^3</code>.</li>
              <li>The coefficient stays at least 1 and below 10, except for 0 itself.</li>
            </ul>
          </section>`;
    }
  }

  private stageSummary(): string {
    return `${formatDecimal(this.amount)} = ${formatDecimal(percentFromDecimal(this.amount))}% = ${formatScientific(this.amount)}`;
  }

  private stageExplanation(): string {
    switch (this.view) {
      case "decimal":
        return "Each house is ten times the house on its right. The highlight marks the leading place.";
      case "percent":
        return "Percent means per hundred, so the same amount is counted in hundredths.";
      case "scientific":
        return "Scientific notation counts how many houses the point moved to leave a coefficient between 1 and 10.";
    }
  }

  private drawStage(): void {
    this.disposeGroup();
    const { coefficient, exponent } = toScientific(this.amount);
    const width = 9.2;
    const startX = -width / 2;
    const step = width / (PLACES.length - 1);

    PLACES.forEach((place, index) => {
      const x = startX + index * step;
      const active = place.exponent === exponent;
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, active ? 1.55 : 1.05, 0.18),
        new THREE.MeshBasicMaterial({ color: active ? 0x58a6ff : 0x30363d }),
      );
      house.position.set(x, active ? 0.35 : 0.1, 0);
      this.group.add(house);
      const power = textSprite(`10^${place.exponent}`, active ? 0xffd166 : 0xc9d1d9, 0.2);
      power.position.set(x, active ? 1.35 : 0.85, 0);
      this.group.add(power);
      const name = textSprite(place.name, active ? 0x7ee787 : 0x8b949e, 0.18);
      name.position.set(x, -0.7, 0);
      this.group.add(name);
    });

    const onStrip = PLACES.some((place) => place.exponent === exponent);
    const headline = this.view === "percent"
      ? `${formatDecimal(this.amount)} is ${formatDecimal(percentFromDecimal(this.amount))} per hundred`
      : !onStrip
        ? `10^${exponent} sits off this strip; the coefficient is still ${formatDecimal(coefficient)}`
        : exponent >= 0
          ? `move the point ${exponent} place${exponent === 1 ? "" : "s"} left`
          : `move the point ${-exponent} place${exponent === -1 ? "" : "s"} right`;
    const point = textSprite(headline, 0xffffff, 0.3);
    point.position.set(0, 2.35, 0);
    this.group.add(point);
    const result = textSprite(
      `${formatDecimal(this.amount)} = ${formatDecimal(coefficient)} × 10^${exponent} = ${formatDecimal(percentFromDecimal(this.amount))}%`,
      0xd2a8ff,
      0.28,
    );
    result.position.set(0, -1.45, 0);
    this.group.add(result);
  }

  private focusAfterRender(selector: string): void {
    queueMicrotask(() => document.querySelector<HTMLElement>(`#info ${selector}`)?.focus());
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
