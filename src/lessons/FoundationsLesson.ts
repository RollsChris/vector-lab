import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { classifyNumber, containsSet } from "../math/numberTypes";
import { textSprite } from "./helpers";
import { foundationChapterContext } from "./foundationContext";
import { FOUNDATIONS_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("foundations", FOUNDATIONS_DERIVATIONS);

const SETS = [
  { id: "complex", label: "Complex", x: 0, y: 0, r: 4.25, color: 0x30363d },
  { id: "real", label: "Real", x: -0.6, y: 0, r: 3.35, color: 0x1f6feb },
  { id: "rational", label: "Rational", x: -2.0, y: 0, r: 1.85, color: 0x2ea043 },
  { id: "integer", label: "Integer", x: -2.25, y: 0, r: 1.35, color: 0xffa657 },
  { id: "whole", label: "Whole", x: -2.45, y: 0, r: 0.95, color: 0xd2a8ff },
  { id: "natural", label: "Natural", x: -2.62, y: 0, r: 0.6, color: 0x7ee787 },
];

interface Trap {
  id: string;
  title: string;
  trap: string;
  rule: string;
  example: string;
  steps: string[];
}

const TRAPS: Trap[] = [
  {
    id: "order",
    title: "Order of operations",
    trap: "2 + 3 × 4 is not 20.",
    rule: "Brackets, Orders (powers), Divide/Multiply, then Add/Subtract — BODMAS / PEMDAS.",
    example: "2 + 3 × 4",
    steps: ["Multiply first: 3 × 4 = 12", "Then add: 2 + 12 = 14"],
  },
  {
    id: "neg-times-neg",
    title: "Minus × minus = plus",
    trap: "-2 × -3 is not -6.",
    rule: "Two negatives cancel: a sign flip, then a second sign flip, lands back positive.",
    example: "-2 × -3",
    steps: [
      "−2 means flip 2 to the negative side.",
      "Multiplying by −3 flips direction again and scales by 3.",
      "Flip + flip = no flip, so the answer is positive: −2 × −3 = +6.",
    ],
  },
  {
    id: "brackets-powers",
    title: "Brackets before powers",
    trap: "(1 + 1/2)² is not 1² + 2/2.",
    rule: "A power outside brackets applies to the whole bracket.",
    example: "(1 + 1/2)²",
    steps: [
      "(1 + 1/2)² = (1 + 1/2) × (1 + 1/2)",
      "1 + 1/2 = 1.5",
      "1.5 × 1.5 = 2.25",
      "Expansion check: (a + b)² = a² + 2ab + b²",
    ],
  },
  {
    id: "fractions",
    title: "Fractions are division",
    trap: "1/2 + 1/3 is not 2/5.",
    rule: "To add fractions, use a shared bottom number.",
    example: "1/2 + 1/3",
    steps: ["Common denominator is 6", "1/2 = 3/6", "1/3 = 2/6", "3/6 + 2/6 = 5/6"],
  },
  {
    id: "negatives",
    title: "Negatives need brackets",
    trap: "-3² means -(3²), not (-3)².",
    rule: "If the negative is part of the base, put it inside brackets.",
    example: "-3² vs (-3)²",
    steps: ["-3² = -(3 × 3) = -9", "(-3)² = (-3) × (-3) = 9"],
  },
  {
    id: "distribution",
    title: "Distribute to every term",
    trap: "3(x + 2) is not 3x + 2.",
    rule: "Multiply every term inside the bracket.",
    example: "3(x + 2)",
    steps: ["3(x + 2) = 3×x + 3×2", "That gives 3x + 6"],
  },
];

interface Chapter {
  id: string;
  code: string;
  title: string;
  objective: string;
}

const CHAPTERS: Chapter[] = [
  { id: "arithmetic", code: "F.1", title: "Arithmetic", objective: "Classify numbers and avoid the arithmetic traps that derail later algebra." },
  { id: "algebra", code: "F.2", title: "Introduction to algebra", objective: "Treat letters as numbers and simplify expressions without changing their value." },
  { id: "expressions", code: "F.3", title: "Expressions and equations", objective: "Tell expressions from equations and preserve equality while isolating an unknown." },
  { id: "graphs", code: "F.4", title: "Graphs", objective: "Read slope, intercepts, roots and turning points from a graph." },
  { id: "linear", code: "F.5", title: "Linear equations", objective: "Connect a first-power equation to a straight line and its solution." },
  { id: "polynomial", code: "F.6", title: "Polynomial equations", objective: "Recognise polynomial degree and use roots, factors and the discriminant." },
  { id: "binomials", code: "F.7", title: "Binomials", objective: "Expand powers of two-term expressions using patterns instead of repeated multiplication." },
  { id: "partial-fractions", code: "F.8", title: "Partial fractions", objective: "Split a difficult rational expression into simpler fractions." },
  { id: "trigonometry", code: "F.9", title: "Trigonometry", objective: "Relate angles to side ratios and choose the right triangle rule." },
  { id: "functions", code: "F.10", title: "Functions", objective: "See a function as a reliable input-to-output machine." },
  { id: "trig-exp", code: "F.11", title: "Trigonometric and exponential functions", objective: "Contrast repeating waves with continuous growth and decay." },
  { id: "differentiation", code: "F.12", title: "Differentiation", objective: "Interpret a derivative as the slope of a curve at one point." },
  { id: "integration", code: "F.13", title: "Integration", objective: "Interpret an integral as accumulated signed area and the reverse of differentiation." },
];

interface QuickCheck {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUICK_CHECKS: Record<string, QuickCheck> = {
  arithmetic: {
    question: "What is the smallest listed family that contains −3?",
    options: ["Natural", "Whole", "Integer"],
    correct: 2,
    explanation: "−3 is an integer. It is not whole or natural because those sets do not include negative values.",
  },
  algebra: {
    question: "Simplify 4x + 3x.",
    options: ["7x", "7x²", "12x"],
    correct: 0,
    explanation: "They are like terms, so add the coefficients: 4x + 3x = (4 + 3)x = 7x.",
  },
  expressions: {
    question: "Which move always preserves an equation's equality?",
    options: ["Change either side", "Do the same operation to both sides", "Move a term without changing its sign"],
    correct: 1,
    explanation: "An equation is a balance: applying the same valid operation to both sides keeps it balanced.",
  },
  graphs: {
    question: "In y = mx + c, what does m control?",
    options: ["The slope", "The y-intercept", "The x-axis scale"],
    correct: 0,
    explanation: "m is the gradient: the change in y for each one-unit change in x.",
  },
  linear: {
    question: "Solve 3x + 2 = 11.",
    options: ["x = 3", "x = 9", "x = 13/3"],
    correct: 0,
    explanation: "Subtract 2 from both sides to get 3x = 9, then divide both sides by 3.",
  },
  polynomial: {
    question: "If b² − 4ac > 0, how many distinct real roots does a quadratic have?",
    options: ["None", "One", "Two"],
    correct: 2,
    explanation: "A positive discriminant makes the square-root term non-zero and real, producing two distinct roots.",
  },
  binomials: {
    question: "What is the middle term of (a + b)²?",
    options: ["ab", "2ab", "a²b²"],
    correct: 1,
    explanation: "(a + b)² = a² + ab + ab + b² = a² + 2ab + b².",
  },
  "partial-fractions": {
    question: "Why split a rational expression into partial fractions?",
    options: ["To make simpler terms", "To increase its degree", "To remove the denominator"],
    correct: 0,
    explanation: "The split rewrites one awkward fraction as a sum of simpler fractions that are easier to integrate or transform.",
  },
  trigonometry: {
    question: "Which ratio defines sin θ in a right triangle?",
    options: ["adjacent / hypotenuse", "opposite / hypotenuse", "opposite / adjacent"],
    correct: 1,
    explanation: "SOH gives sin θ = opposite / hypotenuse.",
  },
  functions: {
    question: "What must be true for a rule to be a function?",
    options: ["Every input has exactly one output", "Every output has one input", "Inputs must be positive"],
    correct: 0,
    explanation: "Different inputs may share an output, but one input cannot produce two different outputs.",
  },
  "trig-exp": {
    question: "In y = A·eᵏᵗ, what happens when k < 0?",
    options: ["Periodic motion", "Exponential decay", "Linear growth"],
    correct: 1,
    explanation: "A negative exponent becomes more negative as t grows, so eᵏᵗ shrinks toward zero.",
  },
  differentiation: {
    question: "Differentiate x³.",
    options: ["x²", "3x²", "3x"],
    correct: 1,
    explanation: "The power rule brings the 3 down and reduces the power by one: d/dx(x³) = 3x².",
  },
  integration: {
    question: "What is ∫2x dx?",
    options: ["2", "x² + C", "2x² + C"],
    correct: 1,
    explanation: "Increase the power to 2 and divide by 2: 2x²/2 = x², then include the constant C.",
  },
};

const SCENE_STEPS: Record<string, string[]> = {
  algebra: ["3a + 2a", "collect like terms", "5a"],
  expressions: ["2x + 3 = 11", "subtract 3", "2x = 8", "divide by 2", "x = 4"],
  binomials: ["(a + b)²", "(a + b)(a + b)", "a² + 2ab + b²"],
  "partial-fractions": ["one awkward fraction", "split by denominator factors", "simple fraction + simple fraction"],
  functions: ["input x", "f(x) = x² + 1", "output y"],
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export class FoundationsLesson implements Lesson {
  readonly id = "foundations";
  readonly title = "1 · Foundation topics";
  readonly blurb = "F.1–F.13: arithmetic → integration";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = [] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private input = "√2";
  private classification = classifyNumber(this.input);
  private trap = TRAPS[0];
  private chapterId = "arithmetic";

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0, 11),
      new THREE.Vector3(0, 0, 0),
    );
    this.renderPanel();
    this.drawScene();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private get chapter(): Chapter {
    return CHAPTERS.find((c) => c.id === this.chapterId) ?? CHAPTERS[0];
  }

  private renderPanel(): void {
    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    const progress = ((chapterIndex + 1) / CHAPTERS.length) * 100;
    this.setInfo(`
      <h2>Foundation topics</h2>
      <p>A guided 13-chapter bridge from arithmetic to calculus. Pick a topic, study the
      visual and key rules, then use the quick check to confirm the idea.</p>
      <div class="course" id="foundation-strip">
        <div class="glsl-chips" id="foundation-chapters">
          ${CHAPTERS.map((c) => `<button class="glsl-chip" data-chapter="${c.id}" aria-pressed="${c.id === this.chapterId}">${c.code} ${c.title}</button>`).join("")}
        </div>
      </div>
      <div class="foundation-progress" aria-label="Foundation course progress">
        <div><b>${this.chapter.code} · ${this.chapter.title}</b><span>Chapter ${chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="foundation-progress-track"><i style="width:${progress}%"></i></div>
        <p>${this.chapter.objective}</p>
      </div>
      <div id="foundation-body">${foundationChapterContext(this.chapterId)}${this.chapterBody()}${this.quickCheck()}</div>
      <div class="course-nav foundation-nav">
        <button class="course-btn ghost" data-foundation-nav="previous" ${chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-foundation-nav="next" ${chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>`);
    this.bindChapterStrip();
    this.bindCourseControls();
    if (this.chapterId === "arithmetic") this.bindArithmetic();
  }

  private bindChapterStrip(): void {
    const root = document.getElementById("info");
    root?.querySelectorAll<HTMLButtonElement>("[data-chapter]").forEach((button) => {
      button.classList.toggle("active", button.dataset.chapter === this.chapterId);
      button.addEventListener("click", () => {
        this.selectChapter(button.dataset.chapter ?? "arithmetic");
      });
    });
  }

  private bindCourseControls(): void {
    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    document.querySelectorAll<HTMLButtonElement>("[data-foundation-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.foundationNav === "previous" ? -1 : 1;
        const target = CHAPTERS[chapterIndex + delta];
        if (target) this.selectChapter(target.id);
      });
    });

    const check = QUICK_CHECKS[this.chapterId];
    document.querySelectorAll<HTMLButtonElement>("[data-foundation-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.foundationAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-foundation-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("foundation-check-feedback");
        if (feedback) {
          feedback.className = `foundation-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(id: string): void {
    this.chapterId = CHAPTERS.some((chapter) => chapter.id === id) ? id : "arithmetic";
    this.renderPanel();
    this.drawScene();
    document.querySelector(".foundation-progress")?.scrollIntoView({ block: "nearest" });
  }

  private quickCheck(): string {
    const check = QUICK_CHECKS[this.chapterId];
    return `
      <div class="course foundation-check">
        <h3>Quick check</h3>
        <p>${check.question}</p>
        <div class="foundation-check-options">
          ${check.options.map((option, index) => `<button class="glsl-chip" data-foundation-answer="${index}" aria-pressed="false">${option}</button>`).join("")}
        </div>
        <div id="foundation-check-feedback" class="foundation-check-feedback" aria-live="polite">
          Choose an answer, then use the explanation to check your reasoning.
        </div>
      </div>`;
  }

  private chapterBody(): string {
    switch (this.chapterId) {
      case "arithmetic": return this.arithmeticBody();
      case "algebra": return this.algebraBody();
      case "expressions": return this.expressionsBody();
      case "graphs": return this.graphsBody();
      case "linear": return this.linearBody();
      case "polynomial": return this.polynomialBody();
      case "binomials": return this.binomialsBody();
      case "partial-fractions": return this.partialFractionsBody();
      case "trigonometry": return this.trigBody();
      case "functions": return this.functionsBody();
      case "trig-exp": return this.trigExpBody();
      case "differentiation": return this.differentiationBody();
      case "integration": return this.integrationBody();
      default: return this.arithmeticBody();
    }
  }

  private arithmeticBody(): string {
    return `
      <div class="course" id="number-zoo-card">
        <h3>F.1 · Arithmetic — number classifier</h3>
        <label class="conv-row">
          <span>Number</span>
          <input id="number-zoo-input" type="text" value="${escapeHtml(this.input)}" placeholder="7, 1/3, √2, π, e, i" />
        </label>
        <div class="readout" id="number-zoo-result"></div>
        <div class="glsl-chips">
          ${["7", "-3", "0", "1/3", "0.25", "√2", "π", "e", "i"].map((sample) => `<button class="glsl-chip" data-number-sample="${sample}">${sample}</button>`).join("")}
        </div>
      </div>
      <div class="course">
        <h3>Nested families</h3>
        <p><b>Natural ⊂ Whole ⊂ Integer ⊂ Rational ⊂ Real ⊂ Complex.</b>
        Irrational numbers are real but not rational; transcendentals like <code>π</code>
        and <code>e</code> are not even algebraic.</p>
      </div>
      ${this.arithmeticKit()}
      <div class="course">
        <h3>Why a minus times a minus is a plus</h3>
        <p>Multiplying by <code>-1</code> means “turn around”. Do it twice and you face the
        original way, so <code>-2 × -3 = +6</code>.</p>
        <table class="number-type-table">
          <thead><tr><th>Signs</th><th>Result</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td>+ × +</td><td><b>+</b></td><td><code>2 × 3 = 6</code></td></tr>
            <tr><td>+ × −</td><td><b>−</b></td><td><code>2 × -3 = -6</code></td></tr>
            <tr><td>− × +</td><td><b>−</b></td><td><code>-2 × 3 = -6</code></td></tr>
            <tr><td>− × −</td><td><b>+</b></td><td><code>-2 × -3 = 6</code></td></tr>
          </tbody>
        </table>
      </div>
      <details class="course" open>
        <summary>What is <code>e</code>?</summary>
        <p><b>e ≈ 2.71828</b> appears whenever growth is <i>continuous</i>: £1 at 100%
        interest paid in ever-smaller chunks approaches £2.71828. <code>y = eˣ</code> has
        slope <code>eˣ</code>, which is why it underpins calculus, growth and decay.</p>
      </details>
      ${this.numberTypesReference()}`;
  }

  private arithmeticKit(): string {
    return `
      <div class="course" id="arithmetic-kit">
        <h3>Arithmetic survival kit</h3>
        <p>Order of operations, powers, fractions and negatives — pick a trap:</p>
        <div class="glsl-chips">
          ${TRAPS.map((t) => `<button class="glsl-chip" data-trap="${t.id}">${t.title}</button>`).join("")}
        </div>
        <div class="formula" data-derivation-exempt="Dynamic trap example and rule, not a general formula">
          <div class="formula-label">Trap</div>
          <div class="formula-body">${this.trap.trap}</div>
          <div class="formula-note"><b>Rule:</b> ${this.trap.rule}</div>
        </div>
        <div class="readout survival-steps">
          <div><span>Example</span><b>${this.trap.example}</b></div>
          ${this.trap.steps.map((step, index) => `<p><code>${index + 1}.</code> ${step}</p>`).join("")}
        </div>
      </div>`;
  }

  private algebraBody(): string {
    return this.refCard("F.2 · Introduction to algebra",
      "Letters stand in for numbers so one rule covers every case. Collect like terms, keep both sides balanced, and obey the same BODMAS order as arithmetic.",
      [
        ["Like terms", "3a + 2a = 5a; 3a + 2b stays as is"],
        ["Indices", "xᵐ·xⁿ = xᵐ⁺ⁿ, xᵐ/xⁿ = xᵐ⁻ⁿ, (xᵐ)ⁿ = xᵐⁿ, x⁰ = 1, x⁻¹ = 1/x", "foundation-index-laws"],
        ["Distribute", "a(b + c) = ab + ac", "foundation-distributive"],
        ["Factor", "ab + ac = a(b + c)"],
      ]);
  }

  private expressionsBody(): string {
    return this.refCard("F.3 · Expressions and equations",
      "An expression has no equals sign; an equation balances two expressions. Do the same legal move to both sides to isolate the unknown.",
      [
        ["Rearrange", "v = u + at → t = (v − u)/a", "foundation-rearrange"],
        ["Both sides", "2x + 3 = 11 → 2x = 8 → x = 4"],
        ["Substitute", "Put known values in last, after simplifying"],
        ["Identity vs equation", "(a+b)² ≡ a²+2ab+b² for all x; x+1 = 3 only x = 2"],
      ]);
  }

  private graphsBody(): string {
    return this.refCard("F.4 · Graphs",
      "A graph plots y = f(x): the scene shows y = sin(x) for orientation. Gradient and intercepts read straight off the picture.",
      [
        ["Line", "y = m·x + c — slope m, intercept c"],
        ["Parabola", "y = x² — symmetric U through the origin"],
        ["Reciprocal", "y = 1/x — two branches, never touches the axes"],
        ["Reading", "roots = x-axis crossings; turning points = flat tangent"],
      ]);
  }

  private linearBody(): string {
    return this.refCard("F.5 · Linear equations",
      "Highest power of x is 1, so the graph is a straight line and there is one solution. Simultaneous pairs meet where two lines cross.",
      [
        ["Single", "5x − 2 = 13 → x = 3"],
        ["Slope-intercept", "y = mx + c"],
        ["Simultaneous", "x + y = 5, x − y = 1 → x = 3, y = 2"],
        ["Methods", "substitution or elimination"],
      ]);
  }

  private polynomialBody(): string {
    return this.refCard("F.6 · Polynomial equations",
      "Powers of x added together. A quadratic factorises or yields to the formula; cubics+ use the factor theorem.",
      [
        ["Quadratic", "ax² + bx + c = 0"],
        ["Formula", "x = (−b ± √(b² − 4ac)) / 2a", "foundation-quadratic"],
        ["Discriminant", "b²−4ac: >0 two roots, =0 one, <0 complex"],
        ["Factor theorem", "if f(a)=0 then (x−a) is a factor"],
      ]);
  }

  private binomialsBody(): string {
    return this.refCard("F.7 · Binomials",
      "Expand (a + b)ⁿ without multiplying it out: coefficients come from Pascal's triangle / nCr.",
      [
        ["Square", "(a+b)² = a² + 2ab + b²"],
        ["Cube", "(a+b)³ = a³ + 3a²b + 3ab² + b³"],
        ["General", "(a+b)ⁿ = Σ nCr·aⁿ⁻ʳ·bʳ", "foundation-binomial"],
        ["Pascal", "1 / 1 1 / 1 2 1 / 1 3 3 1 …"],
      ]);
  }

  private partialFractionsBody(): string {
    return this.refCard("F.8 · Partial fractions",
      "Split one awkward fraction into simpler ones — the reverse of adding fractions. Vital for integration and Laplace transforms.",
      [
        ["Goal", "(5x−4)/((x−1)(x+2)) = A/(x−1) + B/(x+2)"],
        ["Solve", "match numerators; A = 1/3, B = 14/3"],
        ["Repeated", "use A/(x−1) + B/(x−1)²"],
        ["Proper first", "if top degree ≥ bottom, divide out first"],
      ]);
  }

  private trigBody(): string {
    return this.refCard("F.9 · Trigonometry",
      "Ratios of right-triangle sides, extended to all angles by the unit circle. SOH-CAH-TOA plus the identity below cover most of it.",
      [
        ["Ratios", "sin = opp/hyp, cos = adj/hyp, tan = opp/adj"],
        ["Identity", "sin²θ + cos²θ = 1", "foundation-trig-identity"],
        ["Sine rule", "a/sinA = b/sinB = c/sinC"],
        ["Cosine rule", "c² = a² + b² − 2ab·cosC"],
      ]);
  }

  private functionsBody(): string {
    return this.refCard("F.10 · Functions",
      "A function is a rule giving exactly one output per input. Compose and invert them to build bigger maths.",
      [
        ["Notation", "f(x) = x² + 1, so f(3) = 10"],
        ["Domain/range", "allowed inputs / resulting outputs"],
        ["Compose", "f(g(x)) — inner first"],
        ["Inverse", "f⁻¹ undoes f; reflect in y = x"],
      ]);
  }

  private trigExpBody(): string {
    return this.refCard("F.11 · Trigonometric and exponential functions",
      "Periodic waves and continuous growth, the two engines of engineering signals. eˣ and ln are inverses; see the Logarithms lesson for the inverse relationship.",
      [
        ["Wave", "y = A·sin(ωt + φ): amplitude, frequency, phase"],
        ["Growth/decay", "y = A·eᵏᵗ — k>0 grows, k<0 decays"],
        ["Inverse", "ln(eˣ) = x, e^(ln x) = x"],
        ["Link", "e^(iθ) = cosθ + i·sinθ"],
      ]);
  }

  private differentiationBody(): string {
    return this.refCard("F.12 · Differentiation",
      "Rate of change / slope of the curve. Foundation level here; the Differentiation lesson builds it from scratch with live secants and tangents.",
      [
        ["Power", "d/dx xⁿ = n·xⁿ⁻¹"],
        ["Sin/cos", "d/dx sinx = cosx, d/dx cosx = −sinx"],
        ["Exp", "d/dx eˣ = eˣ"],
        ["Next", "Differentiation lesson"],
      ]);
  }

  private integrationBody(): string {
    return this.refCard("F.13 · Integration",
      "Reverse of differentiation; area under the curve. Foundation level here; the Integration lesson shows Riemann/trapezoid convergence live.",
      [
        ["Power", "∫xⁿ dx = xⁿ⁺¹/(n+1) + C"],
        ["1/x", "∫1/x dx = ln|x| + C"],
        ["Definite", "area = F(b) − F(a)"],
        ["Next", "Integration lesson"],
      ]);
  }

  private refCard(title: string, intro: string, rows: string[][]): string {
    return `
      <div class="course">
        <h3>${title}</h3>
        <p>${intro}</p>
        <table class="number-type-table">
          <tbody>${rows.map(([k, v, derivation]) => `<tr><td><b>${k}</b></td><td><code>${v}</code>${derivation ? derivationButton(derivation) : ""}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  private bindArithmetic(): void {
    const root = document.getElementById("info");
    root?.querySelector<HTMLInputElement>("#number-zoo-input")?.addEventListener("input", (event) => {
      this.input = (event.target as HTMLInputElement).value;
      this.classification = classifyNumber(this.input);
      this.updateResult();
      this.drawScene();
    });
    root?.querySelectorAll<HTMLButtonElement>("[data-number-sample]").forEach((button) => {
      button.addEventListener("click", () => {
        this.input = button.dataset.numberSample ?? "0";
        const input = document.getElementById("number-zoo-input") as HTMLInputElement | null;
        if (input) input.value = this.input;
        this.classification = classifyNumber(this.input);
        this.updateResult();
        this.drawScene();
      });
    });
    root?.querySelectorAll<HTMLButtonElement>("[data-trap]").forEach((button) => {
      button.classList.toggle("active", button.dataset.trap === this.trap.id);
      button.addEventListener("click", () => {
        this.trap = TRAPS.find((t) => t.id === button.dataset.trap) ?? TRAPS[0];
        this.renderPanel();
      });
    });
    this.updateResult();
  }

  private updateResult(): void {
    const output = document.getElementById("number-zoo-result");
    if (!output) return;
    if (this.classification.error) {
      output.innerHTML = `<p class="err">${escapeHtml(this.classification.error)}</p><p>${this.classification.facts.join(" ")}</p>`;
      return;
    }
    output.innerHTML = `
      <div><span>Input</span><b>${escapeHtml(this.classification.display)}</b></div>
      <div><span>Families</span><b>${this.classification.sets.join(" · ")}</b></div>
      ${this.classification.facts.map((fact) => `<p class="geom-working">${fact}</p>`).join("")}`;
  }

  private numberTypesReference(): string {
    const rows = [
      ["Natural", "Counting numbers.", "1, 2, 3, 4"],
      ["Whole", "Natural numbers plus zero.", "0, 1, 2, 3"],
      ["Integer", "Whole numbers and their negatives; no fractional part.", "-3, 0, 12"],
      ["Rational", "Can be written as a fraction p/q where p and q are integers and q ≠ 0.", "1/3, -5, 0.25"],
      ["Irrational", "Real numbers that cannot be written as a fraction; decimals never terminate or repeat.", "√2, π"],
      ["Real", "Every number on the normal number line.", "-2, 0.5, √2, π"],
      ["Complex", "Numbers with a real part and an imaginary part: a + bi.", "3 + 2i, i"],
      ["Imaginary", "Complex numbers involving i, where i² = -1.", "i, 4i"],
      ["Algebraic", "Can be a root/solution of a polynomial with rational coefficients.", "√2 solves x² - 2 = 0"],
      ["Transcendental", "Not algebraic; cannot be a root of any non-zero rational polynomial.", "π, e"],
      ["Prime", "A natural number greater than 1 with exactly two factors: 1 and itself.", "2, 3, 5, 7"],
      ["Composite", "A natural number greater than 1 with more than two factors.", "4, 6, 8, 9"],
    ];

    return `
      <details class="course" open>
        <summary>What each number type means</summary>
        <table class="number-type-table">
          <thead><tr><th>Type</th><th>Meaning</th><th>Examples</th></tr></thead>
          <tbody>
            ${rows.map(([type, meaning, examples]) => `<tr><td><b>${type}</b></td><td>${meaning}</td><td><code>${examples}</code></td></tr>`).join("")}
          </tbody>
        </table>
      </details>`;
  }

  private drawScene(): void {
    this.disposeGroup(this.group);
    switch (this.chapterId) {
      case "arithmetic": this.drawZoo(); break;
      case "graphs": this.drawSine(); break;
      case "linear": this.drawLinear(); break;
      case "polynomial": this.drawPolynomial(); break;
      case "trigonometry": this.drawTriangle(); break;
      case "trig-exp": this.drawTrigAndExponential(); break;
      case "differentiation": this.drawDerivative(); break;
      case "integration": this.drawIntegral(); break;
      default: this.drawConceptFlow(SCENE_STEPS[this.chapterId] ?? [this.chapter.title]); break;
    }
  }

  private drawSine(): void {
    this.drawPlotAxes();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -5 + (10 * i) / 200;
      pts.push(new THREE.Vector3(x, 2 * Math.sin(x), 0));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x58a6ff }),
    );
    this.group.add(line);
    const label = textSprite("y = sin(x)", 0x7ee787, 0.5);
    label.position.set(0, 2.8, 0);
    this.group.add(label);
  }

  private drawLinear(): void {
    this.drawPlotAxes();
    this.group.add(this.curve((x) => 0.6 * x + 0.5, 0x58a6ff));
    this.group.add(this.curve((x) => -0.45 * x - 0.9, 0xffa657));
    const x = -1.4 / 1.05;
    const y = 0.6 * x + 0.5;
    const point = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 24),
      new THREE.MeshBasicMaterial({ color: 0x7ee787 }),
    );
    point.position.set(x, y, 0.1);
    this.group.add(point);
    const label = textSprite("solution = intersection", 0x7ee787, 0.42);
    label.position.set(x, y + 0.65, 0.12);
    this.group.add(label);
  }

  private drawPolynomial(): void {
    this.drawPlotAxes();
    this.group.add(this.curve((x) => 0.28 * (x - 2) * (x + 2), 0xd2a8ff));
    for (const x of [-2, 2]) {
      const root = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 24),
        new THREE.MeshBasicMaterial({ color: 0x7ee787 }),
      );
      root.position.set(x, 0, 0.1);
      this.group.add(root);
    }
    const label = textSprite("roots are where f(x) = 0", 0x7ee787, 0.45);
    label.position.set(0, 3.1, 0.1);
    this.group.add(label);
  }

  private drawTriangle(): void {
    const a = new THREE.Vector3(-3.3, -2.3, 0);
    const b = new THREE.Vector3(3.3, -2.3, 0);
    const c = new THREE.Vector3(-3.3, 2.2, 0);
    this.group.add(this.line([a, b, c, a], 0x58a6ff));
    const square = this.line([
      new THREE.Vector3(-3.3, -1.75, 0),
      new THREE.Vector3(-2.75, -1.75, 0),
      new THREE.Vector3(-2.75, -2.3, 0),
    ], 0x7ee787);
    this.group.add(square);
    this.addLabel("opposite", -3.85, 0, 0xffa657, 0.4);
    this.addLabel("adjacent", 0, -2.8, 0x7ee787, 0.4);
    this.addLabel("hypotenuse", 0.4, 0.35, 0xd2a8ff, 0.4);
    this.addLabel("sin θ = opposite / hypotenuse", 0, 3.25, 0xffffff, 0.48);
  }

  private drawTrigAndExponential(): void {
    this.drawPlotAxes();
    this.group.add(this.curve((x) => 1.5 * Math.sin(x), 0x58a6ff));
    this.group.add(this.curve((x) => Math.exp(x / 2.8) - 1, 0x7ee787));
    this.addLabel("sin x repeats", -2.8, 2.8, 0x58a6ff, 0.42);
    this.addLabel("eˣ grows", 2.8, 2.8, 0x7ee787, 0.42);
  }

  private drawDerivative(): void {
    this.drawPlotAxes();
    this.group.add(this.curve((x) => 0.22 * x * x - 1.6, 0x58a6ff));
    const x0 = 2;
    const y0 = 0.22 * x0 * x0 - 1.6;
    const slope = 0.44 * x0;
    this.group.add(this.curve((x) => y0 + slope * (x - x0), 0x7ee787));
    const point = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    point.position.set(x0, y0, 0.1);
    this.group.add(point);
    this.addLabel("derivative = tangent slope", 0.5, 3, 0x7ee787, 0.46);
  }

  private drawIntegral(): void {
    this.drawPlotAxes();
    const f = (x: number): number => 1.3 + 0.65 * Math.sin(x);
    for (let x = -4; x < 4; x += 0.5) {
      const height = f(x + 0.25);
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, height),
        new THREE.MeshBasicMaterial({ color: 0x1f6feb, transparent: true, opacity: 0.48, side: THREE.DoubleSide }),
      );
      bar.position.set(x + 0.25, height / 2, -0.02);
      this.group.add(bar);
    }
    this.group.add(this.curve(f, 0x7ee787));
    this.addLabel("integral ≈ accumulated area", 0, 3.2, 0x7ee787, 0.46);
  }

  private drawConceptFlow(steps: string[]): void {
    this.addLabel(`${this.chapter.code} · ${this.chapter.title}`, 0, 3.35, 0xffffff, 0.5);
    const gap = Math.min(1.45, 6 / Math.max(steps.length, 1));
    const startY = ((steps.length - 1) * gap) / 2;
    steps.forEach((step, index) => {
      const y = startY - index * gap;
      const width = Math.min(7.8, Math.max(2.6, step.length * 0.18));
      const box = new THREE.Mesh(
        new THREE.PlaneGeometry(width, 0.78),
        new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? 0x1f6feb : 0x21262d, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
      );
      box.position.set(0, y, 0);
      this.group.add(box);
      this.addLabel(step, 0, y, index % 2 === 0 ? 0xffffff : 0x7ee787, 0.38);
      if (index < steps.length - 1) this.addLabel("↓", 0, y - gap / 2, 0x8b949e, 0.3);
    });
  }

  private drawPlotAxes(): void {
    this.group.add(this.line([new THREE.Vector3(-5.2, 0, 0), new THREE.Vector3(5.2, 0, 0)], 0x48515e));
    this.group.add(this.line([new THREE.Vector3(0, -3.4, 0), new THREE.Vector3(0, 3.4, 0)], 0x48515e));
  }

  private curve(f: (x: number) => number, color: number): THREE.Line {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -5 + (10 * i) / 200;
      points.push(new THREE.Vector3(x, f(x), 0));
    }
    return this.line(points, color);
  }

  private line(points: THREE.Vector3[], color: number): THREE.Line {
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color }),
    );
  }

  private addLabel(text: string, x: number, y: number, color: number, scale: number): void {
    const label = textSprite(text, color, scale);
    label.position.set(x, y, 0.1);
    this.group.add(label);
  }

  private drawZoo(): void {
    for (const set of SETS) {
      const active = containsSet(this.classification, set.id);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(set.r - 0.035, set.r + 0.035, 96),
        new THREE.MeshBasicMaterial({ color: active ? 0x7ee787 : set.color, transparent: true, opacity: active ? 0.95 : 0.35, side: THREE.DoubleSide }),
      );
      ring.position.set(set.x, set.y, 0);
      this.group.add(ring);

      const label = textSprite(set.label, active ? 0x7ee787 : 0xc9d1d9, active ? 0.34 : 0.28);
      label.position.set(set.x, set.y + set.r - 0.45, 0.04);
      this.group.add(label);
    }

    this.addZone("Irrational real", containsSet(this.classification, "irrational"), 1.1, 0.55, 2.15, 2.55, 0x58a6ff);
    this.addZone("Algebraic root", containsSet(this.classification, "irrational") && containsSet(this.classification, "algebraic"), 1.1, 1.05, 1.75, 0.55, 0xd2a8ff);
    this.addZone("Transcendental", containsSet(this.classification, "transcendental"), 1.1, 0.1, 1.75, 0.55, 0xff7b72);
    this.addZone("Algebraic", containsSet(this.classification, "algebraic"), -0.6, -2.6, 1.85, 0.5, 0xd2a8ff);
    this.addZone("Imaginary", containsSet(this.classification, "imaginary"), 1.3, -2.8, 1.75, 0.55, 0xffd166);

    const pos = this.zooValuePosition();
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 28),
      new THREE.MeshBasicMaterial({ color: this.classification.error ? 0xff7b72 : 0xffd166 }),
    );
    dot.position.set(pos.x, pos.y, 0.1);
    this.group.add(dot);

    const value = textSprite(this.classification.error ? "?" : this.classification.display, this.classification.error ? 0xff7b72 : 0xffffff, 0.5);
    value.position.set(pos.x, pos.y + 0.5, 0.12);
    this.group.add(value);
  }

  /**
   * Where to drop the value marker inside the nested number sets, based on what the number
   * actually is. It should land in the most specific region it belongs to: e.g. √2 sits in
   * the "Real" ring but outside "Rational" (irrational) and in the algebraic band, while a
   * fraction sits inside "Rational" but outside "Integer".
   */
  private zooValuePosition(): { x: number; y: number } {
    const has = (id: string) => containsSet(this.classification, id);
    if (this.classification.error) return { x: 3.4, y: -3.5 };
    if (has("imaginary")) return { x: 2.8, y: 2.3 }; // complex but outside the real line
    if (has("transcendental")) return { x: 2.35, y: 0.1 }; // irrational real, not algebraic (π, e)
    if (has("irrational")) return { x: 2.25, y: 1.05 }; // irrational real + algebraic (√2)
    if (!has("integer")) return { x: -0.5, y: 0 }; // rational, not integer (fractions)
    if (!has("whole")) return { x: -1.2, y: 0 }; // integer, not whole (negatives)
    if (!has("natural")) return { x: -1.75, y: 0 }; // whole, not natural (zero)
    return { x: -2.62, y: 0 }; // natural
  }

  private addZone(label: string, active: boolean, x: number, y: number, width: number, height: number, color: number): void {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.08),
      new THREE.MeshBasicMaterial({ color: active ? color : 0x21262d, transparent: true, opacity: active ? 0.85 : 0.45 }),
    );
    box.position.set(x, y, 0);
    this.group.add(box);
    const text = this.wideTextSprite(label, active ? 0xffffff : 0x8b949e, 0.24);
    text.position.set(x, y, 0.08);
    this.group.add(text);
  }

  private wideTextSprite(text: string, color = 0xffffff, scale = 0.8): THREE.Sprite {
    const w = 512;
    const h = 80;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
    ctx.font = "bold 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
    );
    sprite.scale.set(scale * (w / h), scale, scale);
    return sprite;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeMaterial = (entry: THREE.Material): void => {
        const map = (entry as THREE.Material & { map?: THREE.Texture | null }).map;
        map?.dispose();
        entry.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeMaterial);
      else if (material) disposeMaterial(material);
    });
    group.clear();
  }
}
