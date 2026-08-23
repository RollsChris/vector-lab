import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  decimalFromPercent,
  digitAtPlace,
  formatDecimal,
  formatScientific,
  percentFromDecimal,
  toScientific,
  writtenPlaceSpan,
} from "../math/numberLanguage";
import { setSpriteText, textSprite } from "./helpers";

type View = "decimal" | "percent" | "scientific";

const VIEWS: readonly { id: View; label: string }[] = [
  { id: "decimal", label: "Decimals" },
  { id: "percent", label: "Percentages" },
  { id: "scientific", label: "Scientific notation" },
] as const;

const PRESETS = [0.35, 0.0034, 34000, 1.5, 0.07] as const;
const DIGIT_STEP = 0.28;
const HOP_STEP = 0.42;
const FILL_RATE = 64;
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
  private stopTick?: () => void;
  private playElapsed = 0;
  private animating = false;
  private stripXs: number[] = [];
  private startPoint = 0;
  private endPoint = 0;
  private digitSprites: THREE.Sprite[] = [];
  private placeLabels: THREE.Sprite[] = [];
  private pointMarker?: THREE.Mesh;
  private captionSprite?: THREE.Sprite;
  private cells: THREE.Mesh[] = [];
  private cellFilled = new THREE.MeshBasicMaterial({ color: 0x7ee787 });
  private cellEmpty = new THREE.MeshBasicMaterial({ color: 0x30363d });
  private cellPartial = new THREE.MeshBasicMaterial({ color: 0xffd166 });

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
      return;
    }

    const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-notation-action]");
    if (actionButton?.dataset.notationAction === "replay") {
      this.restartAnimation();
      this.focusAfterRender('[data-notation-action="replay"]');
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
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    this.refresh();
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
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
        <button class="course-btn" data-notation-action="replay">Replay the motion</button>
        ${this.viewBody()}
        <p class="course-hint">The canvas is a visual model; every result also appears here as
        text. All controls work with Tab, Shift+Tab, Enter, and Space.</p>
      </section>

      ${this.viewReference()}`);
  }

  private viewBody(): string {
    const { exponent } = toScientific(this.amount);
    const percent = percentFromDecimal(this.amount);
    switch (this.view) {
      case "decimal":
        return `
          <p>Each place is ten times the place on its right. After the ones come tenths,
          hundredths, thousandths. Watch the digits of
          <code>${formatDecimal(this.amount)}</code> drop into those columns, largest
          place first.</p>
          <p>Moving one house left multiplies by ten. Moving one house right divides by ten.</p>`;
      case "percent":
        return `
          <p><b>Percent</b> means per hundred. That is the same as moving the decimal point
          two places to the right:
          <code>${formatDecimal(this.amount)} = ${formatDecimal(percent)}%</code>.</p>
          <p>When the result sits between 0 and 200, the hundred-grid fills to match —
          35% lights 35 of 100 squares. Going back, divide by 100:
          <code>${formatDecimal(percent)}% = ${formatDecimal(decimalFromPercent(percent))}</code>.</p>`;
      case "scientific":
        return `
          <p>Scientific notation writes a number as a coefficient between 1 and 10, times a
          power of ten: <code>${formatScientific(this.amount)}</code>.</p>
          <p>Watch the point hop until one non-zero digit sits on its left. That took
          ${Math.abs(exponent)} hop${Math.abs(exponent) === 1 ? "" : "s"}
          ${exponent >= 0 ? "left" : "right"}, so the power is
          <code>10^${exponent}</code>.</p>`;
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
        return "Digits drop into their place-value columns. Press Replay to watch again.";
      case "percent":
        return "The point hops two places to multiply by 100, then the hundred-grid fills when the size fits.";
      case "scientific":
        return "The point hops until the coefficient sits between 1 and 10. Each hop is one power of ten.";
    }
  }

  private drawStage(): void {
    this.disposeGroup();
    this.digitSprites = [];
    this.placeLabels = [];
    this.cells = [];
    this.pointMarker = undefined;
    this.captionSprite = undefined;
    switch (this.view) {
      case "decimal":
        this.buildDecimalStage();
        break;
      case "percent":
        this.buildPercentStage();
        break;
      case "scientific":
        this.buildScientificStage();
        break;
    }
    this.restartAnimation();
  }

  private restartAnimation(): void {
    this.playElapsed = 0;
    this.animating = true;
    this.updateAnimation();
  }

  private tick(dt: number): void {
    if (!this.animating) return;
    this.playElapsed += dt;
    this.updateAnimation();
  }

  private updateAnimation(): void {
    switch (this.view) {
      case "decimal":
        this.updateDecimalAnimation();
        break;
      case "percent":
        this.updatePercentAnimation();
        break;
      case "scientific":
        this.updateScientificAnimation();
        break;
    }
  }

  private buildDecimalStage(): void {
    const span = writtenPlaceSpan(this.amount);
    const exponents = this.exponentsBetween(span.maxExp, span.minExp);
    this.layoutStrip(exponents, 0.35);
    this.startPoint = exponents.indexOf(0) + 1;
    this.endPoint = this.startPoint;
    exponents.forEach((exponent, index) => {
      this.addPlaceColumn(this.stripXs[index], exponent, digitAtPlace(this.amount, exponent));
    });
    this.addPointMarker();
    this.setPointAfter(this.startPoint);
    this.captionSprite = this.addCaption("digits drop into their columns", 2.35);
    this.addCaption(this.stageSummary(), -2.15, 0xd2a8ff, 0.28);
  }

  private buildPercentStage(): void {
    const span = writtenPlaceSpan(this.amount);
    const exponents = this.exponentsBetween(span.maxExp, span.minExp - 2);
    this.layoutStrip(exponents, 1.35);
    const onesIndex = exponents.indexOf(0);
    this.startPoint = onesIndex + 1;
    this.endPoint = this.startPoint + 2;
    exponents.forEach((exponent, index) => {
      this.addPlaceColumn(this.stripXs[index], exponent, digitAtPlace(this.amount, exponent));
    });
    this.addPointMarker();
    this.setPointAfter(this.startPoint);
    const percent = percentFromDecimal(this.amount);
    if (percent > 0 && percent <= 200) {
      const wholes = Math.floor(percent / 100);
      for (let grid = 0; grid <= wholes && grid < 2; grid++) {
        this.addHundredGrid((wholes === 0 ? 0 : grid === 0 ? -2.15 : 2.15), -1.35);
      }
    }
    this.captionSprite = this.addCaption("hop two places to count per hundred", 2.55);
    this.addCaption(
      `${formatDecimal(this.amount)} → ${formatDecimal(percent)}%`,
      -2.55,
      0xd2a8ff,
      0.28,
    );
  }

  private buildScientificStage(): void {
    const { exponent } = toScientific(this.amount);
    const span = writtenPlaceSpan(this.amount);
    const exponents = this.exponentsBetween(span.maxExp, span.minExp);
    this.layoutStrip(exponents, 0.25);
    const onesIndex = Math.max(0, exponents.indexOf(0));
    const leadIndex = Math.max(0, exponents.indexOf(exponent));
    this.startPoint = onesIndex + 1;
    this.endPoint = leadIndex + 1;
    exponents.forEach((place, index) => {
      this.addPlaceColumn(this.stripXs[index], place, digitAtPlace(this.amount, place));
    });
    this.addPointMarker();
    this.setPointAfter(this.startPoint);
    this.captionSprite = this.addCaption("the point hops until one non-zero digit sits on its left", 2.35);
    this.addCaption(formatScientific(this.amount), -2.15, 0xd2a8ff, 0.3);
  }

  private updateDecimalAnimation(): void {
    const shown = Math.min(this.digitSprites.length, Math.floor(this.playElapsed / DIGIT_STEP) + 1);
    this.digitSprites.forEach((sprite, index) => {
      sprite.visible = index < shown;
    });
    if (shown >= this.digitSprites.length) this.animating = false;
  }

  private updatePercentAnimation(): void {
    const hops = this.endPoint - this.startPoint;
    const hopProgress = Math.min(Math.abs(hops), this.playElapsed / HOP_STEP);
    const current = this.startPoint + Math.sign(hops || 1) * hopProgress;
    this.setPointAfter(current);
    const hopDone = hopProgress >= Math.abs(hops);
    const hopsText = hopDone
      ? `point moved two places: ${formatDecimal(percentFromDecimal(this.amount))}%`
      : `hop ${Math.min(Math.floor(hopProgress) + 1, 2)} of 2 — multiply by ten`;
    this.setCaption(hopsText);

    if (!this.cells.length) {
      if (hopDone) this.animating = false;
      return;
    }

    const fillElapsed = Math.max(0, this.playElapsed - Math.abs(hops) * HOP_STEP);
    const percent = Math.min(percentFromDecimal(this.amount), 200);
    const target = percent;
    const shown = hopDone ? Math.min(target, fillElapsed * FILL_RATE) : 0;
    this.paintCells(shown);
    if (hopDone && shown >= target) this.animating = false;
  }

  private updateScientificAnimation(): void {
    const hops = this.endPoint - this.startPoint;
    const total = Math.abs(hops);
    const hopProgress = Math.min(total, this.playElapsed / HOP_STEP);
    const current = this.startPoint + Math.sign(hops || 1) * hopProgress;
    this.setPointAfter(current);
    const finished = hopProgress >= total;
    const { exponent } = toScientific(this.amount);
    const direction = exponent >= 0 ? "left" : "right";
    this.setCaption(
      finished
        ? `${total} hop${total === 1 ? "" : "s"} ${direction} → ${formatScientific(this.amount)}`
        : `hop ${Math.min(Math.floor(hopProgress) + 1, total || 1)} of ${total || 0} ${direction}`,
    );
    if (finished) {
      this.fadePaddingDigits();
      this.animating = false;
    }
  }

  private fadePaddingDigits(): void {
    this.digitSprites.forEach((sprite) => {
      const digit = sprite.userData.digit as number;
      sprite.material.opacity = digit === 0 ? 0.25 : 1;
    });
  }

  private paintCells(shown: number): void {
    const full = Math.floor(shown);
    const part = shown - full;
    this.cells.forEach((cell, index) => {
      const baseY = cell.userData.baseY as number;
      if (index < full) {
        cell.material = this.cellFilled;
        cell.scale.y = 1;
        cell.position.y = baseY;
      } else if (index === full && part > 0.001) {
        cell.material = this.cellPartial;
        cell.scale.y = Math.max(part, 0.12);
        cell.position.y = baseY - 0.12 * (1 - cell.scale.y);
      } else {
        cell.material = this.cellEmpty;
        cell.scale.y = 1;
        cell.position.y = baseY;
      }
    });
  }

  private columnY = 0.15;

  private layoutStrip(exponents: number[], y: number): void {
    const spacing = Math.min(0.95, 8.8 / Math.max(exponents.length, 1));
    this.stripXs = exponents.map((_, index) => (index - (exponents.length - 1) / 2) * spacing);
    this.columnY = y;
  }

  private addPlaceColumn(x: number, exponent: number, digit: number): void {
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.9, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x21262d }),
    );
    house.position.set(x, this.columnY, 0);
    this.group.add(house);
    const sprite = textSprite(String(digit), 0x58a6ff, 0.42);
    sprite.position.set(x, this.columnY + 0.05, 0.08);
    sprite.userData.digit = digit;
    sprite.visible = this.view !== "decimal";
    this.group.add(sprite);
    this.digitSprites.push(sprite);
    const label = textSprite(this.placeName(exponent), exponent === 0 ? 0xffd166 : 0x8b949e, 0.16);
    label.position.set(x, this.columnY - 0.77, 0);
    this.group.add(label);
    this.placeLabels.push(label);
  }

  private addPointMarker(): void {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    marker.position.set(0, this.columnY + 0.7, 0.12);
    this.group.add(marker);
    this.pointMarker = marker;
  }

  private setPointAfter(afterIndex: number): void {
    if (!this.pointMarker || this.stripXs.length === 0) return;
    const spacing = this.stripXs.length > 1 ? this.stripXs[1] - this.stripXs[0] : 0.9;
    const left = this.stripXs[0] - spacing / 2;
    const right = this.stripXs[this.stripXs.length - 1] + spacing / 2;
    const whole = Math.floor(afterIndex);
    const frac = afterIndex - whole;
    const xAt = (index: number): number => {
      if (index <= 0) return left;
      if (index >= this.stripXs.length) return right;
      return (this.stripXs[index - 1] + this.stripXs[index]) / 2;
    };
    this.pointMarker.position.x = THREE.MathUtils.lerp(xAt(whole), xAt(whole + 1), frac);
  }

  private addHundredGrid(originX: number, originY: number): void {
    const gap = 0.3;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.08), this.cellEmpty);
        const y = originY + (4.5 - row) * gap;
        cell.userData.baseY = y;
        cell.position.set(originX + (col - 4.5) * gap, y, 0);
        this.group.add(cell);
        this.cells.push(cell);
      }
    }
  }

  private addCaption(text: string, y: number, color = 0xffffff, scale = 0.3): THREE.Sprite {
    const sprite = textSprite(text, color, scale);
    sprite.position.set(0, y, 0);
    this.group.add(sprite);
    return sprite;
  }

  private setCaption(text: string): void {
    if (!this.captionSprite) return;
    setSpriteText(this.captionSprite, text, 0xffffff);
  }

  private exponentsBetween(maxExp: number, minExp: number): number[] {
    const list: number[] = [];
    for (let exponent = maxExp; exponent >= minExp; exponent--) list.push(exponent);
    return list;
  }

  private placeName(exponent: number): string {
    return PLACES.find((place) => place.exponent === exponent)?.name ?? `10^${exponent}`;
  }

  private focusAfterRender(selector: string): void {
    queueMicrotask(() => document.querySelector<HTMLElement>(`#info ${selector}`)?.focus());
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeOne = (item: THREE.Material): void => {
        if (item === this.cellFilled || item === this.cellEmpty || item === this.cellPartial) return;
        (item as THREE.SpriteMaterial).map?.dispose();
        item.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeOne);
      else if (material) disposeOne(material);
    });
    this.group.clear();
  }
}
