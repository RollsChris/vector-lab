import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { longDivision, longMultiplication } from "../math/longArithmetic";
import { MULTIPLICATION_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite } from "./helpers";

registerFormulaDerivations("multiplication-division", MULTIPLICATION_DERIVATIONS);

type Method = "multiplication" | "division" | "tricks";

export class MultiplicationDivisionLesson implements Lesson {
  readonly id = "multiplication-division";
  readonly title = "Multiplication & Division";
  readonly blurb = "Long methods, checks and number sense";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["times-tables"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private method: Method = "multiplication";
  private multiplicand = 347;
  private multiplier = 26;
  private dividend = 987;
  private divisor = 6;

  private readonly onInfoClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-arith-action]");
    if (!button) return;
    const action = button.dataset.arithAction;
    if (action === "multiplication" || action === "division" || action === "tricks") {
      this.method = action;
    } else if (action === "multiply-example") {
      this.multiplicand = 347;
      this.multiplier = 26;
    } else if (action === "multiply-big-example") {
      this.multiplicand = 4782;
      this.multiplier = 63;
    } else if (action === "divide-example") {
      this.dividend = 987;
      this.divisor = 6;
    } else if (action === "divide-big-example") {
      this.dividend = 87654;
      this.divisor = 24;
    }
    this.refresh();
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 1) {
      this.renderPanel();
      return;
    }
    switch (input.id) {
      case "arith-multiplicand":
        this.multiplicand = Math.min(value, 9999);
        break;
      case "arith-multiplier":
        this.multiplier = Math.min(value, 999);
        break;
      case "arith-dividend":
        this.dividend = Math.min(value, 99999);
        break;
      case "arith-divisor":
        this.divisor = Math.min(value, 999);
        break;
      default:
        return;
    }
    this.refresh();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 1, 12), new THREE.Vector3(0, 0.8, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    document.getElementById("info")?.addEventListener("change", this.onInfoChange);
    this.refresh();
  }

  exit(): void {
    const info = document.getElementById("info");
    info?.removeEventListener("click", this.onInfoClick);
    info?.removeEventListener("change", this.onInfoChange);
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.rebuildStage();
    this.renderPanel();
  }

  private rebuildStage(): void {
    this.disposeGroup();
    const isMultiplication = this.method === "multiplication";
    const isTricks = this.method === "tricks";
    const operation = isMultiplication
      ? `${this.multiplicand} × ${this.multiplier} = ${longMultiplication(this.multiplicand, this.multiplier).product.toLocaleString()}`
      : isTricks
        ? "Fast arithmetic tricks: understand why they work, then check."
        : (() => {
        const result = longDivision(this.dividend, this.divisor);
        return `${this.dividend} ÷ ${this.divisor} = ${result.quotient.toLocaleString()} r ${result.remainder}`;
      })();
    const label = textSprite(operation, isMultiplication ? 0x7ee787 : isTricks ? 0xd2a8ff : 0x79c0ff, 0.72);
    label.position.set(0, 1.2, 0);
    this.group.add(label);

    const principle = textSprite(
      isMultiplication
        ? "Break the multiplier into place values, then add the partial products."
        : isTricks
          ? "Shortcuts are place value in disguise; use an estimate to check every answer."
          : "Divide → multiply → subtract → bring down. Repeat.",
      0xc9d1d9,
      0.38,
    );
    principle.position.set(0, -0.25, 0);
    this.group.add(principle);
  }

  private renderPanel(): void {
    this.setInfo(
      this.method === "multiplication"
        ? this.multiplicationHtml()
        : this.method === "division"
          ? this.divisionHtml()
          : this.tricksHtml(),
    );
  }

  private multiplicationHtml(): string {
    const { product, partialProducts } = longMultiplication(this.multiplicand, this.multiplier);
    const digits = String(this.multiplier).split("").reverse();
    const working = this.multiplicationWorking(partialProducts, product);
    const repeatedAddition = `${this.multiplicand} × ${this.multiplier} = ${Array.from(
      { length: Math.min(this.multiplier, 8) },
      () => String(this.multiplicand),
    ).join(" + ")}${this.multiplier > 8 ? " + ..." : ""}`;

    return `
      <h2>Multiplication &amp; Division</h2>
      <div class="arith-tabs">
        <button class="course-btn active" data-arith-action="multiplication">Long multiplication</button>
        <button class="course-btn ghost" data-arith-action="division">Long division</button>
        <button class="course-btn ghost" data-arith-action="tricks">Tricks</button>
      </div>
      <p>Multiplication means making equal groups. Long multiplication keeps each digit's
      <b>place value</b> visible, so tens are never accidentally treated as ones.</p>
      <div class="arith-inputs">
        <label>Top number <input id="arith-multiplicand" type="number" min="1" max="9999" value="${this.multiplicand}" /></label>
        <label>Multiply by <input id="arith-multiplier" type="number" min="1" max="999" value="${this.multiplier}" /></label>
      </div>
      <h3>Work it out</h3>
      <pre class="arith-working">${working}</pre>
      <ol class="deriv">
        ${partialProducts.map((partial, index) => `
          <li><b class="step-title">${this.multiplicand.toLocaleString()} × ${digits[index]}${index ? " tens" : " ones"}</b>
          <code>${this.multiplicand.toLocaleString()} × ${(Number(digits[index]) * 10 ** index).toLocaleString()} = ${partial.toLocaleString()}</code>.
          Write it in the correct column: its final ${index} digit${index === 1 ? "" : "s"} are zero.</li>`).join("")}
        <li><b class="step-title">Add the partial products</b>
        <code>${partialProducts.map((partial) => partial.toLocaleString()).join(" + ")} = ${product.toLocaleString()}</code>.</li>
      </ol>
      <div class="readout">
        <div><span>Answer</span><b>${this.multiplicand.toLocaleString()} × ${this.multiplier.toLocaleString()} = ${product.toLocaleString()}</b></div>
        <div><span>Quick estimate</span><b>about ${(Math.round(this.multiplicand / 10) * 10 * Math.round(this.multiplier / 10) * 10).toLocaleString()}</b></div>
      </div>
      <h3>Tips and tricks</h3>
      <ul>
        <li><b>Estimate first.</b> ${this.multiplicand} is about ${Math.round(this.multiplicand / 10) * 10} and
        ${this.multiplier} is about ${Math.round(this.multiplier / 10) * 10}; your final answer should be nearby.</li>
        <li><b>Use place value.</b> The second line for a two-digit multiplier is a tens line, so shift it one place left.</li>
        <li><b>Check by division.</b> ${product.toLocaleString()} ÷ ${this.multiplier} must return ${this.multiplicand}.</li>
        <li><b>Mental shortcut:</b> multiplying by 25 is quartering then multiplying by 100; multiplying by 9 is multiplying by 10 then subtracting one group.</li>
      </ul>
      <p class="example"><b>Try it:</b> enter your own numbers, then use the estimate to catch a misplaced zero.
      <button class="course-btn ghost" data-arith-action="multiply-example">347 × 26</button>
      <button class="course-btn ghost" data-arith-action="multiply-big-example">4,782 × 63</button></p>
      <p class="formula-note">Repeated addition explains multiplication:
      <code>${repeatedAddition}</code>. Place-value methods make that practical for large numbers.</p>
    `;
  }

  private divisionHtml(): string {
    const result = longDivision(this.dividend, this.divisor);
    const steps = result.steps.map((step, index) => {
      const broughtDown = index === 0
        ? `Start with ${step.digit}.`
        : `Bring down ${step.digit}: ${step.partialDividend}.`;
      return `<li><b class="step-title">${broughtDown}</b>
        ${step.partialDividend} ÷ ${this.divisor} = ${step.quotientDigit};
        ${step.quotientDigit} × ${this.divisor} = ${step.product};
        subtract to leave ${step.remainder}.</li>`;
    }).join("");

    return `
      <h2>Multiplication &amp; Division</h2>
      <div class="arith-tabs">
        <button class="course-btn ghost" data-arith-action="multiplication">Long multiplication</button>
        <button class="course-btn active" data-arith-action="division">Long division</button>
        <button class="course-btn ghost" data-arith-action="tricks">Tricks</button>
      </div>
      <p>Division shares a total into equal groups. Long division deals with one place at a time:
      <b>divide, multiply, subtract, bring down</b>.</p>
      <div class="arith-inputs">
        <label>Number to share <input id="arith-dividend" type="number" min="1" max="99999" value="${this.dividend}" /></label>
        <label>Share between <input id="arith-divisor" type="number" min="1" max="999" value="${this.divisor}" /></label>
      </div>
      <h3>Work it out</h3>
      <pre class="arith-working">${this.divisionWorking(result.quotient, result.remainder)}</pre>
      <ol class="deriv">${steps}</ol>
      <div class="readout">
        <div><span>Quotient</span><b>${result.quotient}</b></div>
        <div><span>Remainder</span><b>${result.remainder}</b></div>
        <div><span>Check</span><b>${this.divisor} × ${result.quotient} + ${result.remainder} = ${this.dividend}</b></div>
      </div>
      ${derivationButton("division-algorithm")}
      <h3>Tips and tricks</h3>
      <ul>
        <li><b>Keep the cycle.</b> Every line is divide → multiply → subtract → bring down. Say it as you work.</li>
        <li><b>Estimate the first digit.</b> ${this.dividend} ÷ ${this.divisor} is roughly
        ${Math.round(this.dividend / this.divisor)}, so a quotient far from that needs checking.</li>
        <li><b>The remainder is smaller than the divisor.</b> Here ${result.remainder} is less than ${this.divisor}.</li>
        <li><b>Check by multiplying back.</b> Divisor × quotient + remainder must recreate the dividend.</li>
      </ul>
      <p class="example"><b>Try it:</b> choose a number that does not divide exactly, then use the
      check line to see where the remainder belongs. <button class="course-btn ghost" data-arith-action="divide-example">987 ÷ 6</button>
      <button class="course-btn ghost" data-arith-action="divide-big-example">87,654 ÷ 24</button></p>
    `;
  }

  private tricksHtml(): string {
    return `
      <h2>Multiplication &amp; Division Tricks</h2>
      <div class="arith-tabs">
        <button class="course-btn ghost" data-arith-action="multiplication">Long multiplication</button>
        <button class="course-btn ghost" data-arith-action="division">Long division</button>
        <button class="course-btn active" data-arith-action="tricks">Tricks</button>
      </div>
      <p>These are not magic rules: each shortcut is place value and distribution
      (<code>a(b + c) = ab + ac</code>) made quick. They are ideal for mental arithmetic, but
      use an estimate or inverse operation to check your result.</p>
      ${derivationButton("multiplication-distributive")}

      <h3>Multiply a two-digit number by 11</h3>
      <div class="arith-trick">
        <b>47 × 11</b>
        <pre class="arith-working">4  _  7
  4 + 7 = 11
4  11  7  → carry the 1 → 517</pre>
        <p>Put the outside digits around their sum. When the middle sum is 10 or more, carry:
        <code>47 × 11 = 517</code>. The shortcut works because
        <code>47 × 11 = 47 × (10 + 1) = 470 + 47</code>.</p>
      </div>

      <h3>Multiply by 5, 25, 50 and 125</h3>
      <ul>
        <li><b>×5:</b> multiply by 10, then halve. <code>68 × 5 = 680 ÷ 2 = 340</code>.</li>
        <li><b>×25:</b> divide by 4, then multiply by 100. <code>84 × 25 = 21 × 100 = 2,100</code>.</li>
        <li><b>×50:</b> multiply by 100, then halve. <code>36 × 50 = 3,600 ÷ 2 = 1,800</code>.</li>
        <li><b>×125:</b> divide by 8, then multiply by 1,000. <code>64 × 125 = 8 × 1,000 = 8,000</code>.</li>
      </ul>

      <h3>Near a round number</h3>
      <p>Use a nearby easy number, then correct. <code>49 × 18 = (50 − 1) × 18 = 900 − 18 = 882</code>.
      For squaring near 100: <code>98² = (100 − 2)² = 10,000 − 400 + 4 = 9,604</code>.</p>

      <h3>Division shortcuts</h3>
      <ul>
        <li><b>÷5:</b> multiply by 2, then divide by 10. <code>345 ÷ 5 = 690 ÷ 10 = 69</code>.</li>
        <li><b>÷25:</b> multiply by 4, then divide by 100. <code>1,750 ÷ 25 = 7,000 ÷ 100 = 70</code>.</li>
        <li><b>÷0.5:</b> dividing by a half doubles the number. <code>36 ÷ 0.5 = 72</code>.</li>
      </ul>
      <p class="example"><b>Always check:</b> round first. For <code>4,782 × 63</code>, think
      <code>4,800 × 60 = 288,000</code>; the exact answer <code>301,266</code> should be in that
      neighbourhood, not 30,126 or 3,012,660.</p>
    `;
  }

  private multiplicationWorking(partials: number[], product: number): string {
    const lines = [
      String(this.multiplicand),
      `× ${this.multiplier}`,
      "─".repeat(Math.max(String(this.multiplicand).length, String(this.multiplier).length + 2)),
      ...partials.map(String),
      "─".repeat(String(product).length),
      String(product),
    ];
    const width = Math.max(...lines.map((line) => line.length));
    return lines.map((line) => line.padStart(width)).join("\n");
  }

  private divisionWorking(quotient: number, remainder: number): string {
    const answer = remainder === 0 ? String(quotient) : `${quotient} r ${remainder}`;
    return `        ${answer}\n${this.divisor} ) ${this.dividend}`;
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
