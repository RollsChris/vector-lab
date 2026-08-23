import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  commonFactors,
  divideWhole,
  factors,
  formatDecimal,
  formatScientific,
  gcd,
  lcm,
  multiples,
  percentFromDecimal,
  simplifyRatio,
  toScientific,
} from "../math/numberLanguage";
import { segment, textSprite } from "./helpers";

type Topic = "factors" | "gcf-lcm" | "names" | "ratios" | "notation";

const TOPICS: readonly { id: Topic; label: string }[] = [
  { id: "factors", label: "Factors & multiples" },
  { id: "gcf-lcm", label: "GCF & LCM" },
  { id: "names", label: "Names of parts" },
  { id: "ratios", label: "Ratios" },
  { id: "notation", label: "Decimals & scientific notation" },
] as const;

const NOTATION_PRESETS = [0.35, 0.0034, 34000, 1.5, 0.07] as const;
const COLORS = [0x58a6ff, 0x7ee787, 0xffd166, 0xd2a8ff, 0xff7b72];

function wholeNumber(value: string, min: number, max: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

function finiteNumber(value: string): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return undefined;
  if (Math.abs(parsed) > 1e12 || Math.abs(parsed) < 1e-12) return undefined;
  return parsed;
}

export class FactorsMultiplesLesson implements Lesson {
  readonly id = "factors-multiples";
  readonly title = "Factors, Multiples & Number Language";
  readonly blurb = "GCF, LCM, division names, ratios, decimals, and scientific notation";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["arithmetic-operations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private canvas!: HTMLCanvasElement;
  private topic: Topic = "factors";
  private factorNumber = 12;
  private pairA = 12;
  private pairB = 18;
  private dividend = 17;
  private divisor = 5;
  private ratioA = 2;
  private ratioB = 3;
  private notationValue = 0.35;
  private inputError = "";

  private readonly onInfoClick = (event: Event): void => {
    const topicButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-number-topic]");
    if (topicButton) {
      const topic = topicButton.dataset.numberTopic as Topic;
      if (!TOPICS.some((candidate) => candidate.id === topic)) return;
      this.topic = topic;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-number-topic="${topic}"]`);
      return;
    }

    const presetButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-notation-preset]");
    if (presetButton) {
      const value = Number(presetButton.dataset.notationPreset);
      if (!Number.isFinite(value)) return;
      this.notationValue = value;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-notation-preset="${value}"]`);
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-number-input]");
    if (!input) return;
    const key = input.dataset.numberInput ?? "";
    if (key === "notation") {
      const value = finiteNumber(input.value);
      if (value === undefined) {
        this.inputError = "Enter a non-zero number whose size sits between 10^−12 and 10^12.";
        this.renderPanel();
        this.focusAfterRender('[data-number-input="notation"]');
        return;
      }
      this.notationValue = value;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender('[data-number-input="notation"]');
      return;
    }

    const bounds: Record<string, { min: number; max: number; assign: (value: number) => void }> = {
      factor: { min: 1, max: 24, assign: (value) => { this.factorNumber = value; } },
      pairA: { min: 1, max: 36, assign: (value) => { this.pairA = value; } },
      pairB: { min: 1, max: 36, assign: (value) => { this.pairB = value; } },
      dividend: { min: 0, max: 60, assign: (value) => { this.dividend = value; } },
      divisor: { min: 0, max: 20, assign: (value) => { this.divisor = value; } },
      ratioA: { min: 1, max: 12, assign: (value) => { this.ratioA = value; } },
      ratioB: { min: 1, max: 12, assign: (value) => { this.ratioB = value; } },
    };
    const field = bounds[key];
    if (!field) return;
    const value = wholeNumber(input.value, field.min, field.max);
    if (value === undefined) {
      this.inputError = `Enter a whole number from ${field.min} to ${field.max}.`;
      this.renderPanel();
      this.focusAfterRender(`[data-number-input="${key}"]`);
      return;
    }
    field.assign(value);
    this.inputError = "";
    this.refresh();
    this.focusAfterRender(`[data-number-input="${key}"]`);
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
    const topicButtons = TOPICS.map((topic) => `
      <button class="course-btn${topic.id === this.topic ? "" : " ghost"}"
        data-number-topic="${topic.id}"
        aria-pressed="${topic.id === this.topic}">${topic.label}</button>`).join("");

    this.setInfo(`
      <h2>Factors, Multiples & Number Language</h2>
      <p>A factor sits inside a number. A multiple is a number you can grow to. The same two
      amounts also need names: the top and bottom of a fraction, the two parts of a division,
      and the two parts of a ratio. Decimals, percentages, and scientific notation are just
      other ways to write the same amount.</p>

      <section class="course">
        <h3>Choose a view</h3>
        <div class="operation-lab-tabs" role="group" aria-label="Number language topic">
          ${topicButtons}
        </div>
        ${this.topicInputs()}
        <div class="operation-lab-readout" aria-live="polite">
          <b>${this.stageSummary()}</b>
          <span>${this.stageExplanation()}</span>
        </div>
        ${this.inputError ? `<p class="operation-lab-feedback error" role="alert">${this.inputError}</p>` : ""}
        ${this.topicBody()}
        <p class="course-hint">The canvas is a visual model; every result also appears here as
        text. All controls work with Tab, Shift+Tab, Enter, and Space.</p>
      </section>

      ${this.topicReference()}`);
  }

  private topicInputs(): string {
    switch (this.topic) {
      case "factors":
        return this.numberField("factor", "Whole number", this.factorNumber, 1, 24);
      case "gcf-lcm":
        return `
          <div class="operation-lab-inputs">
            ${this.labeledField("pairA", "First number", this.pairA, 1, 36)}
            ${this.labeledField("pairB", "Second number", this.pairB, 1, 36)}
          </div>`;
      case "names":
        return `
          <div class="operation-lab-inputs">
            ${this.labeledField("dividend", "Dividend", this.dividend, 0, 60)}
            ${this.labeledField("divisor", "Divisor", this.divisor, 0, 20)}
          </div>`;
      case "ratios":
        return `
          <div class="operation-lab-inputs">
            ${this.labeledField("ratioA", "First part", this.ratioA, 1, 12)}
            ${this.labeledField("ratioB", "Second part", this.ratioB, 1, 12)}
          </div>`;
      case "notation": {
        const presets = NOTATION_PRESETS.map((value) => `
          <button class="course-btn${value === this.notationValue ? "" : " ghost"}"
            data-notation-preset="${value}"
            aria-pressed="${value === this.notationValue}">${formatDecimal(value)}</button>`).join("");
        return `
          <div class="operation-lab-inputs">
            ${this.labeledField("notation", "Amount", this.notationValue, undefined, undefined, "decimal")}
          </div>
          <div class="operation-lab-tabs" role="group" aria-label="Example amounts">${presets}</div>`;
      }
    }
  }

  private numberField(key: string, label: string, value: number, min: number, max: number): string {
    return `<div class="operation-lab-inputs">${this.labeledField(key, label, value, min, max)}</div>`;
  }

  private labeledField(
    key: string,
    label: string,
    value: number,
    min?: number,
    max?: number,
    mode: "numeric" | "decimal" = "numeric",
  ): string {
    const bounds = min !== undefined && max !== undefined ? `min="${min}" max="${max}"` : "";
    return `<label>${label}
      <input type="number" ${bounds} inputmode="${mode}" step="${mode === "decimal" ? "any" : "1"}"
        value="${value}" data-number-input="${key}" /></label>`;
  }

  private topicBody(): string {
    switch (this.topic) {
      case "factors": {
        const list = factors(this.factorNumber);
        const firstMultiples = multiples(this.factorNumber, 8);
        return `
          <p>A <b>factor</b> of ${this.factorNumber} is a whole number that divides it with
          nothing left over. A <b>multiple</b> of ${this.factorNumber} is what you get by
          multiplying it by 1, 2, 3, and so on.</p>
          <p>Factors of ${this.factorNumber}: <code>${list.join(", ")}</code>.
          First multiples: <code>${firstMultiples.join(", ")}</code>.</p>
          <p>If A is a factor of B, then B is a multiple of A. So 3 is a factor of 12, and
          12 is a multiple of 3. The two words describe the same relationship from opposite
          ends.</p>`;
      }
      case "gcf-lcm": {
        const shared = gcd(this.pairA, this.pairB);
        const leastMultiple = lcm(this.pairA, this.pairB);
        const sharedList = commonFactors(this.pairA, this.pairB);
        return `
          <p>The <b>greatest common factor</b> (GCF, also called HCF or GCD) is the largest
          whole number that divides both ${this.pairA} and ${this.pairB}. Here that is
          <code>${shared}</code>. Shared factors: <code>${sharedList.join(", ")}</code>.</p>
          <p>The <b>least common multiple</b> (LCM) is the smallest positive number that both
          ${this.pairA} and ${this.pairB} grow into. Here that is <code>${leastMultiple}</code>.</p>
          <p><b>Why we factor out the GCF, not the LCF.</b> The least common factor of any two
          positive whole numbers is <code>1</code>, because 1 divides everything.
          Pulling out 1 from <code>${this.pairA}x + ${this.pairB}</code> gives
          <code>1(${this.pairA}x + ${this.pairB})</code>, which changes nothing.
          Pulling out the GCF gives
          <code>${shared}(${this.pairA / shared}x + ${this.pairB / shared})</code>,
          which is the simplest integer factoring.</p>
          <p>People sometimes confuse LCF with LCM. The LCM
          <code>${leastMultiple}</code> is a <em>multiple</em>, usually larger than both
          numbers, so it cannot be pulled out of both terms. Use the LCM when you need a
          shared repeat — adding fractions, lining up cycles — not when you are factoring a
          sum.</p>`;
      }
      case "names": {
        const division = divideWhole(this.dividend, this.divisor);
        return `
          <div class="operation-lab-rule-grid">
            <div><b>Dividend</b><span>The amount being shared or split. In
              <code>${this.dividend} ÷ ${this.divisor}</code> the dividend is
              ${this.dividend}.</span></div>
            <div><b>Divisor</b><span>How many equal groups, or the size of each group. Here
              the divisor is ${this.divisor}.</span></div>
            <div><b>Numerator</b><span>The top of a fraction: how many pieces you have. In
              <code>${this.dividend}/${this.divisor}</code> the numerator is
              ${this.dividend}.</span></div>
            <div><b>Denominator</b><span>The bottom of a fraction: how many equal pieces make
              one whole. Here the denominator is ${this.divisor}.</span></div>
          </div>
          <p>The same two numbers play the same roles. Fraction language comes from counting
          pieces. Division language comes from sharing. The result of the division is the
          <b>quotient</b>${division ? `, here <code>${division.quotient}</code>` : ""}${
            division && division.remainder
              ? `, with remainder <code>${division.remainder}</code>`
              : ""
          }.</p>
          <p>They are not interchangeable with ratio language. In a ratio both numbers are
          parts of a comparison, not “top versus bottom of one whole.”</p>`;
      }
      case "ratios": {
        const [simpleA, simpleB] = simplifyRatio(this.ratioA, this.ratioB);
        const whole = this.ratioA + this.ratioB;
        const part = this.ratioA / whole;
        return `
          <p>A <b>ratio</b> <code>${this.ratioA}:${this.ratioB}</code> compares two parts of
          the same kind. It says “${this.ratioA} of the first for every ${this.ratioB} of the
          second,” not “${this.ratioA} out of ${this.ratioB}.”</p>
          <p>The matching part-to-whole fraction is
          <code>${this.ratioA}/${whole}</code> for the first part, which is
          <code>${formatDecimal(part)}</code> or
          <code>${formatDecimal(percentFromDecimal(part))}%</code> of the whole.</p>
          <p>Simplify a ratio the same way as a fraction: divide both parts by the GCF.
          <code>${this.ratioA}:${this.ratioB}</code> becomes
          <code>${simpleA}:${simpleB}</code>${
            simpleA === this.ratioA ? ", already simplest." : "."
          }
          Scaling both parts by the same whole number keeps the ratio the same:
          <code>${simpleA}:${simpleB} = ${simpleA * 2}:${simpleB * 2}</code>.</p>`;
      }
      case "notation": {
        const { coefficient, exponent } = toScientific(this.notationValue);
        const percent = percentFromDecimal(this.notationValue);
        return `
          <p>A <b>decimal</b> extends place value through the ones place: tenths, hundredths,
          thousandths. <code>${formatDecimal(this.notationValue)}</code> is already in that
          form.</p>
          <p>A <b>percentage</b> means “per hundred.” Multiply the decimal by 100:
          <code>${formatDecimal(this.notationValue)} = ${formatDecimal(percent)}%</code>.
          Going the other way, divide by 100.</p>
          <p><b>Scientific notation</b> writes a number as a coefficient between 1 and 10,
          times a power of ten:
          <code>${formatScientific(this.notationValue)}</code>.
          The exponent counts how many places the decimal point moved —
          ${Math.abs(exponent)} place${Math.abs(exponent) === 1 ? "" : "s"}
          ${exponent >= 0 ? "left" : "right"} to leave
          <code>${formatDecimal(coefficient)}</code>.</p>
          <p>Use it for very large or very small amounts, and for keeping place value honest
          when a calculator dumps a long string of zeros.</p>`;
      }
    }
  }

  private topicReference(): string {
    switch (this.topic) {
      case "factors":
        return `
          <section class="course">
            <h3>How to find them</h3>
            <ul>
              <li>To list factors, test whole numbers up to the square root and record each pair.</li>
              <li>Prime numbers have exactly two factors: 1 and themselves.</li>
              <li>1 is a factor of every whole number. Every whole number is a multiple of 1.</li>
              <li>0 is a multiple of every whole number, but we usually start the useful list at the number itself.</li>
            </ul>
          </section>`;
      case "gcf-lcm":
        return `
          <section class="course">
            <h3>Which tool to reach for</h3>
            <div class="operation-lab-rule-grid">
              <div><b>Use the GCF to simplify or factor</b>
                <span>Cancel a fraction, scale a ratio down, or pull a shared factor out of a sum.</span></div>
              <div><b>Use the LCM to combine</b>
                <span>Add fractions, line up repeating events, or find a shared period.</span></div>
              <div><b>Ignore the LCF</b>
                <span>It is always 1, so it never simplifies anything.</span></div>
              <div><b>There is no useful GCM</b>
                <span>Shared multiples go on forever, so “greatest common multiple” is not a tool.</span></div>
            </div>
          </section>`;
      case "names":
        return `
          <section class="course">
            <h3>Same numbers, four jobs</h3>
            <p>In <code>a ÷ b</code> and <code>a/b</code>, <code>a</code> is the dividend and
            the numerator, and <code>b</code> is the divisor and the denominator. The words
            change because the picture changes: sharing a pile versus counting equal pieces.
            The quotient is the answer to the sharing. A remainder is what will not make
            another full group.</p>
          </section>`;
      case "ratios":
        return `
          <section class="course">
            <h3>Part-to-part is not part-to-whole</h3>
            <p><code>2:3</code> is not the same claim as <code>2/3</code>. The ratio compares
            two parts. The fraction <code>2/3</code> compares a part with a whole of 3. If
            a mixture is 2 blue to 3 green, blue is <code>2/5</code> of the mixture, not
            <code>2/3</code>.</p>
          </section>`;
      case "notation":
        return `
          <section class="course">
            <h3>Three writings of one amount</h3>
            <ul>
              <li><code>0.35 = 35/100 = 35%</code></li>
              <li><code>0.35 = 3.5 × 10^−1</code></li>
              <li><code>0.0034 = 3.4 × 10^−3 = 0.34%</code></li>
              <li>A coefficient in scientific notation stays at least 1 and below 10, except for 0 itself.</li>
            </ul>
          </section>`;
    }
  }

  private stageSummary(): string {
    switch (this.topic) {
      case "factors":
        return `${this.factorNumber} has ${factors(this.factorNumber).length} factors; its multiples are ${this.factorNumber}, ${this.factorNumber * 2}, ${this.factorNumber * 3}, …`;
      case "gcf-lcm":
        return `GCF(${this.pairA}, ${this.pairB}) = ${gcd(this.pairA, this.pairB)}; LCM = ${lcm(this.pairA, this.pairB)}; LCF = 1`;
      case "names": {
        const division = divideWhole(this.dividend, this.divisor);
        if (!division) return `${this.dividend} ÷ 0 is undefined`;
        return division.remainder === 0
          ? `${this.dividend} ÷ ${this.divisor} = ${division.quotient}`
          : `${this.dividend} ÷ ${this.divisor} = ${division.quotient} remainder ${division.remainder}`;
      }
      case "ratios": {
        const [simpleA, simpleB] = simplifyRatio(this.ratioA, this.ratioB);
        return `${this.ratioA}:${this.ratioB} = ${simpleA}:${simpleB}`;
      }
      case "notation":
        return `${formatDecimal(this.notationValue)} = ${formatDecimal(percentFromDecimal(this.notationValue))}% = ${formatScientific(this.notationValue)}`;
    }
  }

  private stageExplanation(): string {
    switch (this.topic) {
      case "factors":
        return "Each rectangle is one factor pair. The number line below marks the first multiples.";
      case "gcf-lcm":
        return "Shared-factor tiles fit both bars. The two multiple tracks first meet at the LCM.";
      case "names":
        return "The same two numbers are a dividend and divisor in a share, and a numerator and denominator in a fraction.";
      case "ratios":
        return "Coloured counters show the two parts. The grey whole is their sum.";
      case "notation":
        return "Each place-value house is ten times the house on its right. Scientific notation counts how many houses the point moved.";
    }
  }

  private drawStage(): void {
    this.disposeGroup();
    switch (this.topic) {
      case "factors":
        this.drawFactors();
        break;
      case "gcf-lcm":
        this.drawGcfLcm();
        break;
      case "names":
        this.drawNames();
        break;
      case "ratios":
        this.drawRatios();
        break;
      case "notation":
        this.drawNotation();
        break;
    }
  }

  private drawFactors(): void {
    const pairs = factors(this.factorNumber)
      .filter((factor) => factor <= this.factorNumber / factor)
      .map((factor) => [factor, this.factorNumber / factor] as const);
    const spacing = Math.min(2.35, 9 / Math.max(pairs.length, 1));
    pairs.forEach(([rows, cols], index) => {
      const originX = (index - (pairs.length - 1) / 2) * spacing;
      this.drawArray(originX, 1.15, rows, cols, COLORS[index % COLORS.length], 0.95);
      const label = textSprite(`${rows} × ${cols}`, COLORS[index % COLORS.length], 0.24);
      label.position.set(originX, -0.15, 0);
      this.group.add(label);
    });

    const first = multiples(this.factorNumber, 8);
    const width = 9;
    const startX = -width / 2;
    const max = first.at(-1) ?? this.factorNumber;
    const xFor = (value: number): number => startX + (value / max) * width;
    this.group.add(segment(new THREE.Vector3(startX, -1.55, 0), new THREE.Vector3(startX + width, -1.55, 0), 0x8b949e));
    first.forEach((value) => {
      const x = xFor(value);
      this.group.add(segment(new THREE.Vector3(x, -1.72, 0), new THREE.Vector3(x, -1.38, 0), 0x7ee787));
      const tick = textSprite(String(value), 0x7ee787, 0.22);
      tick.position.set(x, -2.05, 0);
      this.group.add(tick);
    });
    const caption = textSprite(`multiples of ${this.factorNumber}`, 0x8b949e, 0.26);
    caption.position.set(0, -2.45, 0);
    this.group.add(caption);
  }

  private drawArray(originX: number, originY: number, rows: number, cols: number, color: number, size: number): void {
    const cell = Math.min(0.28, size / Math.max(rows, cols, 1));
    const geometry = new THREE.BoxGeometry(cell * 0.78, cell * 0.78, 0.12);
    const material = new THREE.MeshBasicMaterial({ color });
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          originX + (col - (cols - 1) / 2) * cell,
          originY + ((rows - 1) / 2 - row) * cell,
          0,
        );
        this.group.add(cube);
      }
    }
  }

  private drawGcfLcm(): void {
    const shared = gcd(this.pairA, this.pairB);
    const leastMultiple = lcm(this.pairA, this.pairB);
    const maxBar = Math.max(this.pairA, this.pairB);
    const width = 8.4;
    const unit = width / maxBar;

    this.drawTiledBar(-1.05, this.pairA, shared, unit, 0x58a6ff, `${this.pairA} = ${this.pairA / shared} × ${shared}`);
    this.drawTiledBar(-2.15, this.pairB, shared, unit, 0x7ee787, `${this.pairB} = ${this.pairB / shared} × ${shared}`);

    const trackMax = leastMultiple;
    const trackUnit = width / trackMax;
    const startX = -width / 2;
    this.group.add(segment(new THREE.Vector3(startX, 1.55, 0), new THREE.Vector3(startX + width, 1.55, 0), 0x315a9a));
    this.group.add(segment(new THREE.Vector3(startX, 0.85, 0), new THREE.Vector3(startX + width, 0.85, 0), 0x2ea043));
    for (const value of multiples(this.pairA, Math.round(trackMax / this.pairA))) {
      this.addDot(startX + value * trackUnit, 1.55, value === leastMultiple ? 0xffd166 : 0x58a6ff, 0.09);
    }
    for (const value of multiples(this.pairB, Math.round(trackMax / this.pairB))) {
      this.addDot(startX + value * trackUnit, 0.85, value === leastMultiple ? 0xffd166 : 0x7ee787, 0.09);
    }
    this.addDot(startX + width, 1.2, 0xffd166, 0.16);
    const meet = textSprite(`first shared multiple ${leastMultiple}`, 0xffd166, 0.28);
    meet.position.set(0, 2.15, 0);
    this.group.add(meet);
    const factorNote = textSprite(`shared tiles have length ${shared}; LCF is 1`, 0xd2a8ff, 0.26);
    factorNote.position.set(0, -2.85, 0);
    this.group.add(factorNote);
  }

  private drawTiledBar(y: number, length: number, tile: number, unit: number, color: number, labelText: string): void {
    const startX = -4.2;
    const tiles = length / tile;
    for (let index = 0; index < tiles; index++) {
      const tileWidth = Math.max(0.12, tile * unit - 0.06);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(tileWidth, 0.42, 0.14),
        new THREE.MeshBasicMaterial({ color }),
      );
      bar.position.set(startX + (index + 0.5) * tile * unit, y, 0);
      this.group.add(bar);
    }
    const label = textSprite(labelText, color, 0.24);
    label.position.set(0, y - 0.42, 0);
    this.group.add(label);
  }

  private addDot(x: number, y: number, color: number, radius: number): void {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 14, 10),
      new THREE.MeshBasicMaterial({ color }),
    );
    dot.position.set(x, y, 0.05);
    this.group.add(dot);
  }

  private drawNames(): void {
    const division = divideWhole(this.dividend, this.divisor);
    const title = textSprite(
      division
        ? `${this.dividend} ÷ ${this.divisor} = ${division.quotient}${division.remainder ? ` r ${division.remainder}` : ""}`
        : `${this.dividend} ÷ 0 is undefined`,
      division ? 0xffffff : 0xff7b72,
      0.55,
    );
    title.position.set(0, 2.35, 0);
    this.group.add(title);

    const fraction = textSprite(`${this.dividend} / ${this.divisor}`, 0xffd166, 0.62);
    fraction.position.set(0, 0.55, 0);
    this.group.add(fraction);

    const left = textSprite(`dividend / numerator = ${this.dividend}`, 0x58a6ff, 0.3);
    left.position.set(-2.6, -0.55, 0);
    this.group.add(left);
    const right = textSprite(`divisor / denominator = ${this.divisor}`, 0x7ee787, 0.3);
    right.position.set(2.55, -0.55, 0);
    this.group.add(right);

    if (division) {
      const result = textSprite(
        division.remainder
          ? `quotient ${division.quotient}, remainder ${division.remainder}`
          : `quotient ${division.quotient}`,
        0xd2a8ff,
        0.32,
      );
      result.position.set(0, -1.45, 0);
      this.group.add(result);
      const rebuild = textSprite(
        `${division.quotient} × ${this.divisor} + ${division.remainder} = ${this.dividend}`,
        0x8b949e,
        0.26,
      );
      rebuild.position.set(0, -2.05, 0);
      this.group.add(rebuild);
    }
  }

  private drawRatios(): void {
    const whole = this.ratioA + this.ratioB;
    const [simpleA, simpleB] = simplifyRatio(this.ratioA, this.ratioB);
    this.drawCounterRow(-0.2, this.ratioA, 0x58a6ff);
    this.drawCounterRow(-1.15, this.ratioB, 0x7ee787);
    const total = textSprite(
      `${this.ratioA} blue : ${this.ratioB} green  ·  whole = ${whole}`,
      0xffffff,
      0.32,
    );
    total.position.set(0, 1.55, 0);
    this.group.add(total);
    const simple = textSprite(
      `simplest ${simpleA}:${simpleB}  ·  first part is ${this.ratioA}/${whole} of the whole`,
      0xffd166,
      0.28,
    );
    simple.position.set(0, 0.85, 0);
    this.group.add(simple);
    const percent = textSprite(
      `${formatDecimal(percentFromDecimal(this.ratioA / whole))}% blue, ${formatDecimal(percentFromDecimal(this.ratioB / whole))}% green`,
      0xd2a8ff,
      0.26,
    );
    percent.position.set(0, -2.15, 0);
    this.group.add(percent);
  }

  private drawCounterRow(y: number, count: number, color: number): void {
    const spacing = Math.min(0.62, 8.4 / Math.max(count, 1));
    for (let index = 0; index < count; index++) {
      const counter = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      counter.position.set((index - (count - 1) / 2) * spacing, y, 0);
      this.group.add(counter);
    }
  }

  private drawNotation(): void {
    const { coefficient, exponent } = toScientific(this.notationValue);
    const places = ["ten thousands", "thousands", "hundreds", "tens", "ones", "tenths", "hundredths", "thousandths", "ten-thousandths"];
    const exponents = [4, 3, 2, 1, 0, -1, -2, -3, -4];
    const width = 9.2;
    const startX = -width / 2;
    const step = width / (places.length - 1);

    places.forEach((place, index) => {
      const x = startX + index * step;
      const active = exponents[index] === exponent;
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, active ? 1.55 : 1.05, 0.18),
        new THREE.MeshBasicMaterial({ color: active ? 0x58a6ff : 0x30363d }),
      );
      house.position.set(x, active ? 0.35 : 0.1, 0);
      this.group.add(house);
      const power = textSprite(`10^${exponents[index]}`, active ? 0xffd166 : 0xc9d1d9, 0.2);
      power.position.set(x, active ? 1.35 : 0.85, 0);
      this.group.add(power);
      const name = textSprite(place, active ? 0x7ee787 : 0x8b949e, 0.18);
      name.position.set(x, -0.7, 0);
      this.group.add(name);
    });

    const onStrip = exponents.includes(exponent);
    const point = textSprite(
      !onStrip
        ? `10^${exponent} sits off this strip; the coefficient is still ${formatDecimal(coefficient)}`
        : exponent >= 0
          ? `move the point ${exponent} place${exponent === 1 ? "" : "s"} left`
          : `move the point ${-exponent} place${exponent === -1 ? "" : "s"} right`,
      0xffffff,
      0.3,
    );
    point.position.set(0, 2.35, 0);
    this.group.add(point);
    const result = textSprite(
      `${formatDecimal(this.notationValue)} = ${formatDecimal(coefficient)} × 10^${exponent} = ${formatDecimal(percentFromDecimal(this.notationValue))}%`,
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
