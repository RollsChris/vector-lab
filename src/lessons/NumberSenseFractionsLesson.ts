import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { segment, textSprite } from "./helpers";

interface Fraction {
  id: string;
  numerator: number;
  denominator: number;
  label: string;
  color: number;
}

const FRACTIONS: readonly Fraction[] = [
  { id: "one-half", numerator: 1, denominator: 2, label: "one half", color: 0x58a6ff },
  { id: "two-thirds", numerator: 2, denominator: 3, label: "two thirds", color: 0x7ee787 },
  { id: "three-quarters", numerator: 3, denominator: 4, label: "three quarters", color: 0xffd166 },
  { id: "five-quarters", numerator: 5, denominator: 4, label: "five quarters", color: 0xd2a8ff },
] as const;

const PLOT_COLORS = [0x58a6ff, 0x7ee787, 0xffd166, 0xd2a8ff, 0xff7b72, 0x79c0ff];

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "");
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

export class NumberSenseFractionsLesson implements Lesson {
  readonly id = "number-sense-fractions";
  readonly title = "Number Sense & Fractions";
  readonly blurb = "Numbers, fractions, and exact sharing";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["foundations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private plotted: Fraction[] = [FRACTIONS[0]];
  private selectedId = FRACTIONS[0].id;
  private customNumerator = "";
  private customDenominator = "";
  private customError = "";
  private simplificationMessage = "";
  private barScale = 1;
  private viewport!: LessonContext["viewport"];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private pointerStart: { x: number; y: number } | undefined;

  private readonly onInfoClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-fraction]");
    if (button) {
      const index = Number(button.dataset.fraction);
      if (!Number.isInteger(index) || index < 0 || index >= FRACTIONS.length) return;
      this.addToPlot(FRACTIONS[index]);
      return;
    }

    const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-fraction-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.fractionAction ?? "";
    if (action === "add-custom") this.addCustomFraction();
    else if (action.startsWith("scale:")) {
      const scale = Number(action.slice(6));
      if ([1, 2, 4].includes(scale)) {
        this.barScale = scale;
        this.render();
        this.focusBar();
      }
    }
    else if (action === "clear") {
      this.plotted = [];
      this.selectedId = "";
      this.render();
    } else if (action === "remove") {
      const id = actionButton.dataset.fractionId;
      this.plotted = this.plotted.filter((fraction) => fraction.id !== id);
      if (this.selectedId === id) this.selectedId = this.plotted.at(-1)?.id ?? "";
      this.render();
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.id === "fraction-numerator") this.customNumerator = input.value;
    if (input.id === "fraction-denominator") this.customDenominator = input.value;
  };

  private readonly onStagePointerDown = (event: PointerEvent): void => {
    if (event.button === 0) this.pointerStart = { x: event.clientX, y: event.clientY };
  };

  private readonly onStagePointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart || event.button !== 0) return;
    const moved = Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y);
    this.pointerStart = undefined;
    if (moved > 5) return;

    const canvas = this.viewport.renderer.domElement;
    const bounds = canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const marker = this.raycaster.intersectObjects(this.group.children, true)
      .find(({ object }) => typeof object.userData.fractionId === "string");
    const id = marker?.object.userData.fractionId;
    if (typeof id !== "string" || id === this.selectedId) return;
    this.selectedId = id;
    this.render();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.4, 12), new THREE.Vector3(0, 0, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    document.getElementById("info")?.addEventListener("input", this.onInfoChange);
    ctx.viewport.renderer.domElement.addEventListener("pointerdown", this.onStagePointerDown);
    ctx.viewport.renderer.domElement.addEventListener("pointerup", this.onStagePointerUp);
    this.render();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    document.getElementById("info")?.removeEventListener("input", this.onInfoChange);
    this.viewport.renderer.domElement.removeEventListener("pointerdown", this.onStagePointerDown);
    this.viewport.renderer.domElement.removeEventListener("pointerup", this.onStagePointerUp);
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private render(): void {
    this.drawFraction();
    const fraction = this.plotted.find((candidate) => candidate.id === this.selectedId);
    const barExplanation = fraction
      ? `<div class="course-hint">
          <p><b>Sharing view:</b> split <b>${fraction.numerator} total units</b> into
          <b>${fraction.denominator} equal groups</b>. The purple group contains
          <b>${formatDecimal(fraction.numerator / fraction.denominator)}</b> units.</p>
          <p><b>Counting-parts view:</b> count <b>${fraction.numerator}</b> pieces, each of size
          <code>1/${fraction.denominator}</code>. Those pieces total
          <b>${formatDecimal(fraction.numerator / fraction.denominator)}</b> wholes.</p>
        </div>`
      : "";
    const selectedDescription = fraction
      ? `<p><b>${fraction.numerator}/${fraction.denominator}</b> is ${fraction.label}:
        the numerator <code>${fraction.numerator}</code> counts the shaded parts and the
        denominator <code>${fraction.denominator}</code> names the equal-size partition.
        <code>${fraction.numerator} ÷ ${fraction.denominator} = ${formatDecimal(fraction.numerator / fraction.denominator)}</code>.
        The number line shows every plotted value; the bar explains the selected fraction.</p>`
      : `<p>Add a fraction to put a labelled point on the number line. Select another example or
        enter your own numerator and denominator below.</p>`;
    const countedFractions = fraction
      ? Array.from({ length: Math.min(fraction.numerator, 8) }, (_, index) =>
        `<code>${index + 1}/${fraction.denominator}</code>`).join(", ")
      : "";
    const divisionExplanation = fraction
      ? `<p class="course-hint">The smaller ticks now divide <b>every whole interval into
        ${fraction.denominator}</b> equal part${fraction.denominator === 1 ? "" : "s"}. For
        <code>${fraction.numerator}/${fraction.denominator}</code>, count
        ${countedFractions}${fraction.numerator > 8 ? `, …, <code>${fraction.numerator}/${fraction.denominator}</code>` : ""}
        from zero.</p>`
      : "";
    const buttons = FRACTIONS.map((candidate, index) => `
      <button class="course-btn${candidate.id === this.selectedId ? "" : " ghost"}" data-fraction="${index}">
        ${candidate.numerator}/${candidate.denominator}
      </button>`).join("");
    const plottedFractions = this.plotted.map((candidate) => `
      <li data-plotted-fraction="${candidate.id}">
        <span class="fraction-swatch" style="--fraction-color: #${candidate.color.toString(16).padStart(6, "0")}"></span>
        <b>${candidate.numerator}/${candidate.denominator}</b>
        <button class="deriv-try" data-fraction-action="remove" data-fraction-id="${candidate.id}"
          aria-label="Remove ${candidate.numerator}/${candidate.denominator} from plot">Remove</button>
      </li>`).join("");

    this.setInfo(`
      <h2>Number Sense &amp; Fractions</h2>
      <p>Mathematics starts by naming quantities reliably. In a fraction <code>a/b</code>, the
      <b>numerator</b> <code>a</code> is the quantity being shared and the
      <b>denominator</b> <code>b</code> is the number of equal groups. So
      <code>a/b</code> means <code>a ÷ b</code>. For proper fractions, this is also the familiar
      picture of <b>a shaded equal parts out of b</b>.</p>

      <section class="course">
        <h3>Plot fractions on the number line</h3>
        <p>Choose an example or add your own. Every added fraction stays on the number line in its
        own colour, so you can compare values and spot equivalent fractions.</p>
        <div class="course-chapters">${buttons}</div>
        <div class="fraction-inputs">
          <label>Numerator <input id="fraction-numerator" type="number" min="0"
            inputmode="numeric" value="${this.customNumerator}" /></label>
          <span aria-hidden="true">/</span>
          <label>Denominator <input id="fraction-denominator" type="number" min="1"
            inputmode="numeric" value="${this.customDenominator}" /></label>
          <button class="course-btn" data-fraction-action="add-custom">Add to plot</button>
        </div>
        <p class="course-hint">Use any non-negative whole numerator and positive whole denominator.
        Larger denominators create more equal parts.</p>
        <div class="fraction-bar-scale" data-bar-scale="${this.barScale}">
          <span>Bar magnification</span>
          ${[1, 2, 4].map((scale) => `
            <button class="course-btn${scale === this.barScale ? "" : " ghost"}"
              data-fraction-action="scale:${scale}" aria-pressed="${scale === this.barScale}">${scale}×</button>`).join("")}
        </div>
        <p class="course-hint">Choose 2× or 4× to focus the stage on the selected bar. At 4×,
        right-drag to pan across a long bar and inspect its equal parts.</p>
        ${this.customError ? `<p class="formula-note"><b>${this.customError}</b></p>` : ""}
        ${this.simplificationMessage ? `<p class="formula-note">${this.simplificationMessage}</p>` : ""}
        ${this.plotted.length
          ? `<ul class="fraction-plot-list">${plottedFractions}</ul>
             <button class="course-btn ghost" data-fraction-action="clear">Clear plot</button>`
          : ""}
        ${selectedDescription}
        <p class="course-hint">Click any coloured dot on the number line to make it the selected
        fraction and update both diagrams.</p>
        ${divisionExplanation}
        ${barExplanation}
      </section>

      <section class="course">
        <h3>Three habits that make fractions dependable</h3>
        <ol class="deriv">
          <li><b>Equal parts first.</b> The denominator says how many equal pieces make one whole.
          A larger denominator means smaller pieces.</li>
          <li><b>Rename before adding.</b> <code>1/2 + 1/3 = 3/6 + 2/6 = 5/6</code>.
          Sixths are a common-sized piece, so they can be counted together.</li>
          <li><b>Keep exact values when possible.</b> <code>1/3</code> is exact, while
          <code>0.333...</code> is a decimal approximation that continues forever.</li>
        </ol>
      </section>

      <section class="course">
        <h3>From sharing to algebra</h3>
        <p>Fractions support ratios, percentages, rates, probability, scale drawings, unit
        conversion, and algebra. For example, if 3 of 4 equal parts are shaded, the proportion
        is <code>3/4 = 0.75 = 75%</code>.</p>
        <p class="formula-note"><b>Check:</b> a proper fraction is below 1; an improper fraction
        such as <code>5/4</code> is one whole and one quarter more, so it belongs beyond 1.</p>
      </section>`);
  }

  private addToPlot(fraction: Fraction): void {
    const existing = this.plotted.find((candidate) =>
      candidate.numerator === fraction.numerator && candidate.denominator === fraction.denominator,
    );
    if (existing) this.selectedId = existing.id;
    else {
      this.plotted.push(fraction);
      this.selectedId = fraction.id;
    }
    this.customError = "";
    this.simplificationMessage = "";
    this.render();
  }

  private addCustomFraction(): void {
    const numerator = Number(this.customNumerator);
    const denominator = Number(this.customDenominator);
    if (!Number.isSafeInteger(numerator) || numerator < 0 ||
      !Number.isSafeInteger(denominator) || denominator < 1) {
      this.customError = "Enter a non-negative whole numerator and a positive whole denominator.";
      this.simplificationMessage = "";
      this.render();
      return;
    }
    const divisor = greatestCommonDivisor(numerator, denominator);
    const reducedNumerator = numerator / divisor;
    const reducedDenominator = denominator / divisor;
    const existing = this.plotted.find((fraction) =>
      fraction.numerator === numerator && fraction.denominator === denominator,
    );
    if (existing) {
      this.selectedId = existing.id;
    } else {
      const id = `custom-${numerator}-${denominator}`;
      this.plotted.push({
        id,
        numerator,
        denominator,
        label: "your fraction",
        color: PLOT_COLORS[this.plotted.length % PLOT_COLORS.length],
      });
      this.selectedId = id;
    }
    this.customError = "";
    this.simplificationMessage = divisor === 1
      ? `<b>${numerator}/${denominator} is already in simplest terms.</b> Its only positive common factor is 1.`
      : `<b>${numerator}/${denominator} is not in simplest terms.</b> Divide both numbers by
        <code>${divisor}</code>: <code>${numerator}/${denominator} = ${reducedNumerator}/${reducedDenominator}</code>.`;
    this.render();
  }

  private focusBar(): void {
    this.viewport.frameCamera(
      new THREE.Vector3(0, -1.1, 12 / this.barScale),
      new THREE.Vector3(0, -1.1, 0),
    );
  }

  private drawFraction(): void {
    this.disposeGroup();
    if (!this.plotted.length) return;
    const fraction = this.plotted.find((candidate) => candidate.id === this.selectedId) ?? this.plotted[0];
    const values = this.plotted.map((candidate) => candidate.numerator / candidate.denominator);
    const min = Math.min(0, Math.floor(Math.min(...values)));
    const max = Math.max(2, Math.ceil(Math.max(...values)));
    const range = max - min;
    const subdivisions = fraction.denominator;
    const start = -4.5;
    const width = 9;
    const lineY = 1.4;
    const xForValue = (value: number): number => start + ((value - min) / range) * width;

    this.group.add(segment(
      new THREE.Vector3(start, lineY, 0),
      new THREE.Vector3(start + width, lineY, 0),
      0x8b949e,
    ));
    for (let tick = 0; tick <= range * subdivisions; tick++) {
      const value = min + tick / subdivisions;
      const x = xForValue(value);
      this.group.add(segment(
        new THREE.Vector3(x, lineY - 0.22, 0),
        new THREE.Vector3(x, lineY + 0.22, 0),
        tick % subdivisions === 0 ? 0xc9d1d9 : 0x484f58,
      ));
      if (tick % subdivisions === 0) {
        const label = textSprite(String(value), 0xc9d1d9, 0.28);
        label.position.set(x, lineY - 0.55, 0);
        this.group.add(label);
      }
    }

    this.plotted.forEach((candidate, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 20, 12),
        new THREE.MeshBasicMaterial({ color: candidate.color }),
      );
      marker.userData.fractionId = candidate.id;
      marker.position.set(xForValue(candidate.numerator / candidate.denominator), lineY, 0.1 + index * 0.01);
      this.group.add(marker);
      const markerLabel = textSprite(
        `${candidate.numerator}/${candidate.denominator}`,
        candidate.color,
        0.34,
      );
      markerLabel.position.set(marker.position.x, lineY + 0.55 + (index % 2) * 0.35, 0);
      this.group.add(markerLabel);
    });

    this.drawSharingBar(fraction, -0.65, -1.27);
    this.drawCountingPartsBar(fraction, -2.15, -2.8);
  }

  private drawSharingBar(fraction: Fraction, y: number, labelY: number): void {
    const barWidth = 6.4;
    const unitCount = Math.max(fraction.numerator, 1);
    const unitWidth = barWidth / unitCount;
    const groupSize = fraction.numerator / fraction.denominator;
    const cellGap = Math.min(0.025, unitWidth * 0.2);
    for (let index = 0; index < unitCount; index++) {
      const cellStart = -barWidth / 2 + index * unitWidth;
      const purpleUnits = THREE.MathUtils.clamp(groupSize - index, 0, 1);
      const parts = [
        { start: 0, units: purpleUnits, color: fraction.color },
        { start: purpleUnits, units: 1 - purpleUnits, color: 0x30363d },
      ];
      for (const part of parts) {
        if (part.units === 0) continue;
        const width = part.units * unitWidth;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(width - cellGap, width * 0.7), 0.62, 0.18),
          new THREE.MeshBasicMaterial({ color: part.color }),
        );
        mesh.position.set(cellStart + part.start * unitWidth + width / 2, y, 0);
        this.group.add(mesh);
      }
    }
    for (let group = 1; group < fraction.denominator; group++) {
      const x = -barWidth / 2 + (barWidth * group) / fraction.denominator;
      this.group.add(segment(
        new THREE.Vector3(x, y - 0.37, 0.15),
        new THREE.Vector3(x, y + 0.37, 0.15),
        0xc9d1d9,
      ));
    }
    const label = textSprite(
      `A. Share ${fraction.numerator} total units between ${fraction.denominator} groups: ${formatDecimal(groupSize)} each`,
      0xc9d1d9,
      0.27,
    );
    label.position.set(0, labelY, 0);
    this.group.add(label);
  }

  private drawCountingPartsBar(fraction: Fraction, y: number, labelY: number): void {
    const barWidth = 6.4;
    const groupCount = Math.ceil(fraction.numerator / fraction.denominator) || 1;
    const partCount = Math.max(fraction.numerator, fraction.denominator);
    const groupGap = groupCount > 1 ? Math.min(0.1, barWidth / (groupCount * 8)) : 0;
    const partWidth = (barWidth - groupGap * (groupCount - 1)) / partCount;
    for (let index = 0; index < partCount; index++) {
      const completedGroups = Math.floor(index / fraction.denominator);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(partWidth - 0.035, partWidth * 0.75), 0.62, 0.18),
        new THREE.MeshBasicMaterial({ color: index < fraction.numerator ? fraction.color : 0x30363d }),
      );
      mesh.position.set(
        -barWidth / 2 + partWidth * (index + 0.5) + groupGap * completedGroups,
        y,
        0,
      );
      this.group.add(mesh);
    }
    const label = textSprite(
      `B. Count ${fraction.numerator} pieces of 1/${fraction.denominator}: ${formatDecimal(fraction.numerator / fraction.denominator)} wholes`,
      0xc9d1d9,
      0.27,
    );
    label.position.set(0, labelY, 0);
    this.group.add(label);
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
