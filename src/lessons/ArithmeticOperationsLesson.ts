import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { segment, textSprite } from "./helpers";

type Operation = "addition" | "subtraction" | "multiplication" | "division" | "factorial";
type Rule = "commutative" | "associative" | "distributive" | "order" | "factorial";

interface OperationInputs {
  a: number;
  b: number;
}

const OPERATIONS: readonly { id: Operation; label: string; symbol: string }[] = [
  { id: "addition", label: "Addition", symbol: "+" },
  { id: "subtraction", label: "Subtraction", symbol: "−" },
  { id: "multiplication", label: "Multiplication", symbol: "×" },
  { id: "division", label: "Division", symbol: "÷" },
  { id: "factorial", label: "Factorial", symbol: "!" },
] as const;

const RULES: readonly { id: Rule; label: string }[] = [
  { id: "commutative", label: "Commutative" },
  { id: "associative", label: "Associative" },
  { id: "distributive", label: "Distributive" },
  { id: "order", label: "Order matters" },
  { id: "factorial", label: "Factorial" },
] as const;

const INPUTS: Record<Operation, OperationInputs> = {
  addition: { a: 4, b: 3 },
  subtraction: { a: 7, b: 4 },
  multiplication: { a: 4, b: 3 },
  division: { a: 12, b: 3 },
  factorial: { a: 5, b: 1 },
};

function factorial(n: number): number {
  let value = 1;
  for (let factor = 2; factor <= n; factor++) value *= factor;
  return value;
}

function wholeNumber(value: string, min: number, max: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

export class ArithmeticOperationsLesson implements Lesson {
  readonly id = "arithmetic-operations";
  readonly title = "Arithmetic Operations Lab";
  readonly blurb = "See operations, inverses, rules, and factorial growth";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["number-sense-fractions"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private canvas!: HTMLCanvasElement;
  private operation: Operation = "addition";
  private rule: Rule = "commutative";
  private inputs: Record<Operation, OperationInputs> = structuredClone(INPUTS);
  private inputError = "";
  private inverseFeedback = "";

  private readonly onInfoClick = (event: Event): void => {
    const operationButton = (event.target as HTMLElement)
      .closest<HTMLButtonElement>("[data-arithmetic-operation]");
    if (operationButton) {
      const operation = operationButton.dataset.arithmeticOperation as Operation;
      if (!OPERATIONS.some((candidate) => candidate.id === operation)) return;
      this.operation = operation;
      this.inputError = "";
      this.inverseFeedback = "";
      this.refresh();
      this.focusAfterRender(`[data-arithmetic-operation="${operation}"]`);
      return;
    }

    const ruleButton = (event.target as HTMLElement)
      .closest<HTMLButtonElement>("[data-arithmetic-rule]");
    if (ruleButton) {
      const rule = ruleButton.dataset.arithmeticRule as Rule;
      if (!RULES.some((candidate) => candidate.id === rule)) return;
      this.rule = rule;
      this.renderPanel();
      this.focusAfterRender(`[data-arithmetic-rule="${rule}"]`);
      return;
    }

    const actionButton = (event.target as HTMLElement)
      .closest<HTMLButtonElement>("[data-arithmetic-action]");
    if (actionButton?.dataset.arithmeticAction === "inverse-check") {
      this.inverseFeedback = this.inverseCheck();
      this.renderPanel();
      this.focusAfterRender('[data-arithmetic-action="inverse-check"]');
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-arithmetic-input]");
    if (!input) return;
    const key = input.dataset.arithmeticInput;
    const max = this.operation === "factorial" ? 7 : this.operation === "division" && key === "a" ? 60 : 20;
    const value = wholeNumber(input.value, 0, max);
    if (value === undefined) {
      this.inputError = `Enter a whole number from 0 to ${max}.`;
      this.renderPanel();
      this.focusAfterRender(`[data-arithmetic-input="${key}"]`);
      return;
    }
    if (key === "a" || key === "b") this.inputs[this.operation][key] = value;
    this.inputError = "";
    this.inverseFeedback = "";
    this.refresh();
    this.focusAfterRender(
      key === "a" && this.operation !== "factorial"
        ? '[data-arithmetic-input="b"]'
        : '[data-arithmetic-action="inverse-check"]',
    );
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.canvas = ctx.viewport.renderer.domElement;
    this.canvas.setAttribute("role", "img");
    this.canvas.tabIndex = 0;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.3, 12), new THREE.Vector3(0, 0.1, 0));
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
    this.canvas.setAttribute(
      "aria-label",
      `${this.operationSummary()}. ${this.visualExplanation()}`,
    );
  }

  private renderPanel(): void {
    const { a, b } = this.inputs[this.operation];
    const operationButtons = OPERATIONS.map((operation) => `
      <button class="course-btn${operation.id === this.operation ? "" : " ghost"}"
        data-arithmetic-operation="${operation.id}"
        aria-pressed="${operation.id === this.operation}">
        ${operation.symbol} ${operation.label}
      </button>`).join("");
    const ruleButtons = RULES.map((rule) => `
      <button class="course-btn${rule.id === this.rule ? "" : " ghost"}"
        data-arithmetic-rule="${rule.id}"
        aria-pressed="${rule.id === this.rule}">${rule.label}</button>`).join("");

    this.setInfo(`
      <h2>Arithmetic Operations Lab</h2>
      <p>Operations describe changes in quantity. Switch operations, edit the whole numbers, and
      connect each symbolic rule to a visible movement, grouping, sharing, or growth pattern.</p>

      <section class="course">
        <h3>Choose an operation</h3>
        <div class="operation-lab-tabs" role="group" aria-label="Arithmetic operation">
          ${operationButtons}
        </div>
        <div class="operation-lab-inputs">
          <label>${this.operation === "division" ? "Dividend" : this.operation === "factorial" ? "Whole number n" : "First number"}
            <input type="number" min="0" max="${this.operation === "factorial" ? 7 : this.operation === "division" ? 60 : 20}"
              inputmode="numeric" value="${a}" data-arithmetic-input="a" />
          </label>
          ${this.operation === "factorial" ? "" : `
            <label>${this.operation === "division" ? "Divisor" : "Second number"}
              <input type="number" min="0" max="20" inputmode="numeric"
                value="${b}" data-arithmetic-input="b" />
            </label>`}
        </div>
        <div class="operation-lab-readout" aria-live="polite">
          <b>${this.operationSummary()}</b>
          <span>${this.visualExplanation()}</span>
        </div>
        ${this.inputError ? `<p class="operation-lab-feedback error" role="alert">${this.inputError}</p>` : ""}
        <button class="course-btn" data-arithmetic-action="inverse-check">
          ${this.operation === "factorial" ? "Explain the relationship" : "Check with the inverse"}
        </button>
        ${this.inverseFeedback
          ? `<p class="operation-lab-feedback" data-inverse-feedback aria-live="polite">${this.inverseFeedback}</p>`
          : ""}
        <p class="course-hint">The canvas is a visual model; every result and relationship also
        appears here as text. All controls work with Tab, Shift+Tab, Enter, and Space.</p>
      </section>

      <section class="course">
        <h3>Inverse operations undo a change</h3>
        <div class="operation-lab-inverses">
          <div><b>Addition ↔ subtraction</b><span><code>a + b = c</code> means <code>c − b = a</code>.</span></div>
          <div><b>Multiplication ↔ division</b><span><code>a × b = c</code> means <code>c ÷ b = a</code> when <code>b ≠ 0</code>.</span></div>
        </div>
        <p><b>Factorial is not an inverse-operation rule.</b> It is repeated multiplication of
        descending whole numbers: <code>n! = n × (n − 1) × ... × 1</code>. By definition,
        <code>0! = 1</code>.</p>
      </section>

      <section class="course">
        <h3>Rules explorer</h3>
        <div class="operation-lab-rule-tabs" role="group" aria-label="Arithmetic rule">
          ${ruleButtons}
        </div>
        <div class="operation-lab-rule" data-active-rule="${this.rule}" aria-live="polite">
          ${this.ruleExplanation()}
        </div>
        <div class="operation-lab-rule-grid">
          <div><b>Commutative</b><span><code>a + b = b + a</code> and <code>a × b = b × a</code>.</span></div>
          <div><b>Associative</b><span><code>(a + b) + c = a + (b + c)</code>; likewise for multiplication.</span></div>
          <div><b>Distributive</b><span><code>a × (b + c) = a × b + a × c</code>.</span></div>
          <div><b>Order matters</b><span>Subtraction and division are not commutative or associative.</span></div>
        </div>
      </section>

      <section class="course">
        <h3>Zero and one: small numbers, essential rules</h3>
        <ul>
          <li><b>Additive identity:</b> <code>a + 0 = a</code>, and subtracting zero also leaves a number unchanged: <code>a − 0 = a</code>.</li>
          <li><b>Multiplicative identity:</b> <code>a × 1 = a</code> and <code>a ÷ 1 = a</code>.</li>
          <li><b>Multiplication by zero:</b> <code>a × 0 = 0</code>. This loses the original value, so division cannot uniquely undo it.</li>
          <li><b>Division by zero is undefined.</b> No number multiplied by zero can recover a non-zero dividend, and <code>0 ÷ 0</code> has no unique answer.</li>
          <li><b>Factorial base case:</b> <code>0! = 1</code>, the empty product, which keeps counting formulas consistent.</li>
        </ul>
      </section>`);
  }

  private operationSummary(): string {
    const { a, b } = this.inputs[this.operation];
    switch (this.operation) {
      case "addition":
        return `${a} + ${b} = ${a + b}`;
      case "subtraction":
        return `${a} − ${b} = ${a - b}`;
      case "multiplication":
        return `${a} × ${b} = ${a * b}`;
      case "division": {
        if (b === 0) return `${a} ÷ 0 is undefined`;
        const quotient = Math.floor(a / b);
        const remainder = a % b;
        return remainder === 0
          ? `${a} ÷ ${b} = ${quotient}`
          : `${a} ÷ ${b} = ${quotient} remainder ${remainder}`;
      }
      case "factorial": {
        const chain = a === 0
          ? "the empty product"
          : Array.from({ length: a }, (_, index) => a - index).join(" × ");
        return `${a}! = ${chain} = ${factorial(a).toLocaleString()}`;
      }
    }
  }

  private visualExplanation(): string {
    const { a, b } = this.inputs[this.operation];
    switch (this.operation) {
      case "addition":
        return `Start at ${a}; a forward jump of ${b} lands on ${a + b}.`;
      case "subtraction":
        return `Start at ${a}; a backward jump of ${b} lands on ${a - b}.`;
      case "multiplication":
        return `${a} equal groups of ${b} make an array containing ${a * b} counters.`;
      case "division":
        return b === 0
          ? "Sharing into zero groups has no defined meaning."
          : `${a} counters shared between ${b} groups give ${Math.floor(a / b)} per group with ${a % b} left over.`;
      case "factorial":
        return `The descending chain multiplies ${a} through 1; the comparison bars show how quickly 0! through ${a}! grow.`;
    }
  }

  private inverseCheck(): string {
    const { a, b } = this.inputs[this.operation];
    switch (this.operation) {
      case "addition":
        return `Inverse check: ${a + b} − ${b} = ${a}. Subtraction returns to the starting number.`;
      case "subtraction":
        return `Inverse check: ${a - b} + ${b} = ${a}. Addition returns to the starting number.`;
      case "multiplication":
        return b === 0
          ? `The product is 0, but 0 ÷ 0 is undefined, so division cannot recover ${a}.`
          : `Inverse check: ${a * b} ÷ ${b} = ${a}. Division recovers the number of groups.`;
      case "division": {
        if (b === 0) return "Inverse check unavailable: division by zero is undefined.";
        const quotient = Math.floor(a / b);
        const remainder = a % b;
        return `Inverse check: ${quotient} × ${b} + ${remainder} = ${a}. The quotient groups plus the remainder rebuild the dividend.`;
      }
      case "factorial":
        return "Factorial is repeated descending multiplication, not the inverse of another basic arithmetic operation. Advanced mathematics uses the gamma function and inverse gamma, but that is a different idea.";
    }
  }

  private ruleExplanation(): string {
    switch (this.rule) {
      case "commutative":
        return `<b>Commutative means “swap without changing the result.”</b>
          <p><code>3 + 5 = 5 + 3</code> and <code>3 × 5 = 5 × 3</code>. But
          <code>8 − 3 ≠ 3 − 8</code> and <code>8 ÷ 2 ≠ 2 ÷ 8</code>.</p>`;
      case "associative":
        return `<b>Associative means “regroup without changing the result.”</b>
          <p><code>(2 + 3) + 4 = 2 + (3 + 4)</code>, and the same pattern works for
          multiplication. It fails for subtraction and division:
          <code>(12 − 5) − 2 ≠ 12 − (5 − 2)</code>.</p>`;
      case "distributive":
        return `<b>Distribution links multiplication with addition or subtraction.</b>
          <p><code>4 × (10 + 3) = 4 × 10 + 4 × 3 = 52</code>. This rule powers mental
          arithmetic, written multiplication, expanding brackets, and factoring.</p>`;
      case "order":
        return `<b>Subtraction and division depend on order and grouping.</b>
          <p><code>10 − 4 = 6</code>, but <code>4 − 10 = −6</code>.
          <code>12 ÷ 3 = 4</code>, but <code>3 ÷ 12 = 1/4</code>. Parentheses record the
          intended grouping when several operations appear.</p>`;
      case "factorial":
        return `<b>Factorial is a unary operation: it acts on one whole number.</b>
          <p><code>5! = 5 × 4 × 3 × 2 × 1 = 120</code>. It counts arrangements, grows
          faster than ordinary powers with a fixed base, and is neither commutative nor an
          inverse-operation law. The definition <code>0! = 1</code> supplies its base case.</p>`;
    }
  }

  private drawStage(): void {
    this.disposeGroup();
    switch (this.operation) {
      case "addition":
      case "subtraction":
        this.drawNumberLine();
        break;
      case "multiplication":
        this.drawMultiplicationArray();
        break;
      case "division":
        this.drawDivisionSharing();
        break;
      case "factorial":
        this.drawFactorialGrowth();
        break;
    }
  }

  private drawNumberLine(): void {
    const { a, b } = this.inputs[this.operation];
    const result = this.operation === "addition" ? a + b : a - b;
    const min = Math.min(0, result) - 1;
    const max = Math.max(a, result) + 1;
    const width = 9;
    const startX = -width / 2;
    const xFor = (value: number): number => startX + ((value - min) / (max - min)) * width;

    this.group.add(segment(new THREE.Vector3(startX, 0, 0), new THREE.Vector3(startX + width, 0, 0), 0x8b949e));
    for (let value = min; value <= max; value++) {
      const x = xFor(value);
      this.group.add(segment(new THREE.Vector3(x, -0.18, 0), new THREE.Vector3(x, 0.18, 0), 0xc9d1d9));
      const label = textSprite(String(value), value === result ? 0x7ee787 : 0xc9d1d9, 0.27);
      label.position.set(x, -0.52, 0);
      this.group.add(label);
    }

    this.addJump(xFor(0), xFor(a), 1.1, 0x58a6ff, `start at ${a}`);
    this.addJump(
      xFor(a),
      xFor(result),
      1.85,
      this.operation === "addition" ? 0x7ee787 : 0xff7b72,
      `${this.operation === "addition" ? "+" : "−"}${b}`,
    );
    const resultLabel = textSprite(this.operationSummary(), 0xffffff, 0.5);
    resultLabel.position.set(0, -1.35, 0);
    this.group.add(resultLabel);
  }

  private addJump(fromX: number, toX: number, height: number, color: number, labelText: string): void {
    const points: THREE.Vector3[] = [];
    for (let step = 0; step <= 24; step++) {
      const t = step / 24;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(fromX, toX, t),
        Math.sin(Math.PI * t) * height,
        0,
      ));
    }
    this.group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color }),
    ));
    const direction = Math.sign(toX - fromX) || 1;
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.34, 18),
      new THREE.MeshBasicMaterial({ color }),
    );
    arrow.rotation.z = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
    arrow.position.set(toX - direction * 0.08, 0.05, 0);
    this.group.add(arrow);
    const label = textSprite(labelText, color, 0.3);
    label.position.set((fromX + toX) / 2, height + 0.2, 0);
    this.group.add(label);
  }

  private drawMultiplicationArray(): void {
    const { a, b } = this.inputs.multiplication;
    const spacing = Math.min(0.68, 6.8 / Math.max(a, b, 1));
    const geometry = new THREE.BoxGeometry(spacing * 0.62, spacing * 0.62, 0.18);
    const colors = [0x58a6ff, 0x7ee787, 0xffd166, 0xd2a8ff];
    for (let group = 0; group < a; group++) {
      const material = new THREE.MeshBasicMaterial({ color: colors[group % colors.length] });
      for (let item = 0; item < b; item++) {
        const counter = new THREE.Mesh(geometry, material);
        counter.position.set(
          (item - (Math.max(b, 1) - 1) / 2) * spacing,
          ((Math.max(a, 1) - 1) / 2 - group) * spacing + 0.25,
          0,
        );
        this.group.add(counter);
      }
    }
    if (a === 0 || b === 0) {
      const empty = textSprite("No counters: any whole number × 0 = 0", 0xffd166, 0.48);
      empty.position.set(0, 0.3, 0);
      this.group.add(empty);
    }
    const label = textSprite(`${a} groups × ${b} in each group = ${a * b}`, 0xffffff, 0.48);
    label.position.set(0, -3.25, 0);
    this.group.add(label);
  }

  private drawDivisionSharing(): void {
    const { a, b } = this.inputs.division;
    if (b === 0) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.12, 16, 48),
        new THREE.MeshBasicMaterial({ color: 0xff7b72 }),
      );
      this.group.add(ring);
      this.group.add(segment(new THREE.Vector3(-0.9, -0.9, 0.1), new THREE.Vector3(0.9, 0.9, 0.1), 0xff7b72));
      const undefinedLabel = textSprite(`${a} ÷ 0 is undefined`, 0xff7b72, 0.62);
      undefinedLabel.position.set(0, -1.8, 0);
      this.group.add(undefinedLabel);
      return;
    }

    const quotient = Math.floor(a / b);
    const remainder = a % b;
    const groupSpacing = Math.min(1.35, 8 / b);
    const counterSpacing = Math.min(0.38, 2.2 / Math.max(quotient, 1));
    const colors = [0x58a6ff, 0x7ee787, 0xffd166, 0xd2a8ff];
    for (let group = 0; group < b; group++) {
      const x = (group - (b - 1) / 2) * groupSpacing;
      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - groupSpacing * 0.38, -1.45, 0),
          new THREE.Vector3(x + groupSpacing * 0.38, -1.45, 0),
          new THREE.Vector3(x + groupSpacing * 0.38, 1.7, 0),
          new THREE.Vector3(x - groupSpacing * 0.38, 1.7, 0),
        ]),
        new THREE.LineBasicMaterial({ color: colors[group % colors.length] }),
      );
      this.group.add(outline);
      for (let item = 0; item < quotient; item++) {
        const counter = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 16, 10),
          new THREE.MeshBasicMaterial({ color: colors[group % colors.length] }),
        );
        const column = item % 2;
        const row = Math.floor(item / 2);
        counter.position.set(x + (column - 0.5) * counterSpacing, 1.35 - row * counterSpacing, 0);
        this.group.add(counter);
      }
      const groupLabel = textSprite(String(quotient), colors[group % colors.length], 0.27);
      groupLabel.position.set(x, -1.78, 0);
      this.group.add(groupLabel);
    }
    for (let item = 0; item < remainder; item++) {
      const remainderCounter = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 10),
        new THREE.MeshBasicMaterial({ color: 0xff7b72 }),
      );
      remainderCounter.position.set((item - (remainder - 1) / 2) * 0.42, -2.25, 0);
      this.group.add(remainderCounter);
    }
    const check = textSprite(
      `${quotient} × ${b} + ${remainder} = ${a}`,
      remainder ? 0xffd166 : 0x7ee787,
      0.43,
    );
    check.position.set(0, 2.5, 0);
    this.group.add(check);
  }

  private drawFactorialGrowth(): void {
    const { a } = this.inputs.factorial;
    const values = Array.from({ length: a + 1 }, (_, n) => factorial(n));
    const maxLog = Math.log10(Math.max(...values) + 1);
    const spacing = Math.min(1.15, 8 / Math.max(values.length, 1));
    const barWidth = spacing * 0.58;

    values.forEach((value, n) => {
      const height = maxLog === 0 ? 0.5 : 0.45 + (Math.log10(value + 1) / maxLog) * 3.2;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(barWidth, height, 0.22),
        new THREE.MeshBasicMaterial({ color: n === a ? 0xd2a8ff : 0x58a6ff }),
      );
      const x = (n - (values.length - 1) / 2) * spacing;
      bar.position.set(x, -1.55 + height / 2, 0);
      this.group.add(bar);
      const label = textSprite(`${n}!`, n === a ? 0xd2a8ff : 0xc9d1d9, 0.25);
      label.position.set(x, -1.88, 0);
      this.group.add(label);
      const valueLabel = textSprite(value.toLocaleString(), n === a ? 0xffd166 : 0x7ee787, 0.22);
      valueLabel.position.set(x, -1.25 + height, 0);
      this.group.add(valueLabel);
    });

    const factors = a === 0 ? ["empty product"] : Array.from({ length: a }, (_, index) => String(a - index));
    const chain = textSprite(
      a === 0 ? "0! = empty product = 1" : `${a}! = ${factors.join(" × ")} = ${factorial(a).toLocaleString()}`,
      0xffffff,
      0.45,
    );
    chain.position.set(0, 2.75, 0);
    this.group.add(chain);
    const scaleNote = textSprite("Bar height uses a log scale so rapid factorial growth stays visible.", 0x8b949e, 0.26);
    scaleNote.position.set(0, -2.45, 0);
    this.group.add(scaleNote);
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
