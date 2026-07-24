import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import { textSprite } from "./helpers";
import { ALGEBRAIC_LAWS_DERIVATIONS } from "./formulaDerivations/algebraicLaws";

registerFormulaDerivations("algebraic-laws", ALGEBRAIC_LAWS_DERIVATIONS);

type Chapter = "terms" | "properties" | "distribute" | "indices";

const CHAPTERS: { id: Chapter; label: string; stage: string }[] = [
  { id: "terms", label: "1 · Terms", stage: "3x² + 3x² = 6x²" },
  { id: "properties", label: "2 · Rearrange safely", stage: "a + b = b + a" },
  { id: "distribute", label: "3 · Brackets", stage: "a(b + c) = ab + ac" },
  { id: "indices", label: "4 · Powers", stage: "xᵐ × xⁿ = xᵐ⁺ⁿ" },
];

export class AlgebraicLawsLesson implements Lesson {
  readonly id = "algebraic-laws";
  readonly title = "Algebraic Laws & Index Rules";
  readonly blurb = "What combines, rearranges, and changes powers";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["multiplication-division"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private chapter: Chapter = "terms";

  private readonly onInfoClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-algebra-chapter]");
    const chapter = button?.dataset.algebraChapter as Chapter | undefined;
    if (!chapter || !CHAPTERS.some((item) => item.id === chapter)) return;
    this.chapter = chapter;
    this.render();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 11), new THREE.Vector3(0, 0, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    this.render();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private render(): void {
    this.drawStage();
    const buttons = CHAPTERS.map((item) =>
      `<button class="course-btn${item.id === this.chapter ? "" : " ghost"}" data-algebra-chapter="${item.id}">${item.label}</button>`,
    ).join("");
    this.setInfo(`
      <h2>Algebraic Laws &amp; Index Rules</h2>
      <p>Algebra is not a bag of shortcuts. Each rule says which changes preserve an expression's
      value. First decide whether you are <b>adding/subtracting terms</b> or
      <b>multiplying/dividing factors</b>; the allowed rules are different.</p>
      <div class="course-chapters">${buttons}</div>
      ${this.chapterBody()}
      <div class="course">
        <h3>One rule that prevents many mistakes</h3>
        <p><b>Never change an exponent across + or −.</b> You may write
        <code>x² + x² = 2x²</code> because the terms are alike. You cannot simplify
        <code>x² + x³</code> because the pieces have different powers. By contrast,
        <code>x² × x³ = x⁵</code> because multiplication joins five x factors.</p>
      </div>

      <details class="course" open>
        <summary>Worked examples — choose the operation before choosing a rule</summary>
        <div class="deriv-work">
          <p><b>Adding like terms:</b><br>
          <code>3x² + 5x² − 2x² = (3 + 5 − 2)x² = 6x²</code><br>
          The power stays <code>2</code>; only the number of identical <code>x²</code> terms changes.</p>

          <p><b>Adding unlike terms:</b><br>
          <code>x² + x³</code> cannot become <code>x⁵</code>.<br>
          They are different kinds of terms, just as 2 apples + 3 oranges cannot be written as 5 apples.</p>

          <p><b>Multiplying matching bases:</b><br>
          <code>x² × x³ = (x × x)(x × x × x) = x⁵</code><br>
          Count the five factors of <code>x</code>; this is when exponents add.</p>

          <p><b>Dividing matching bases:</b><br>
          <code>x⁷ / x³ = x⁴</code><br>
          Three matching factors cancel from top and bottom, so subtract the exponent: <code>7 − 3 = 4</code>.</p>

          <p><b>A power raised to a power:</b><br>
          <code>(2x³)² = 2² × (x³)² = 4x⁶</code><br>
          The outside square applies to <em>everything</em> inside the brackets.</p>

          <p><b>Brackets and a common factor:</b><br>
          <code>4(2x − 3) = 8x − 12</code> and backwards <code>8x − 12 = 4(2x − 3)</code>.<br>
          Multiply every term when expanding; divide every term by the common factor when factoring.</p>
        </div>
      </details>

      <details class="course">
        <summary>Tips and traps</summary>
        <ul>
          <li><b>Circle the operation first.</b> Is the main operation +/−, ×/÷, or a power? That decides which rule can apply.</li>
          <li><b>Terms add; factors multiply.</b> Terms are separated by + or −. Factors are joined by ×, ÷, or brackets.</li>
          <li><b>Brackets are a boundary.</b> <code>(x + y)²</code> is not <code>x² + y²</code>; it means <code>(x + y)(x + y)</code>.</li>
          <li><b>Keep the base exactly the same.</b> <code>x² × y²</code> is not <code>(xy)⁴</code>; the bases differ.</li>
          <li><b>Write the invisible coefficient.</b> <code>x = 1x</code> and <code>−x = −1x</code>. This helps when collecting or dividing terms.</li>
          <li><b>Check with numbers.</b> If unsure, try <code>x = 2</code>. For example, <code>x² + x³ = 4 + 8 = 12</code>, while <code>x⁵ = 32</code>, so they cannot be equal.</li>
        </ul>
      </details>`);
  }

  private chapterBody(): string {
    switch (this.chapter) {
      case "terms":
        return `<div class="course">
          <h3>Terms: add only like with like</h3>
          <p>A <b>term</b> is one piece separated by + or −. Terms are alike only when their
          letter part, including exponents, matches exactly.</p>
          <div class="formula" data-derivation="like-terms">
            <div class="formula-label">Collecting like terms</div>
            <div class="formula-body">3x² + 3x² = 6x² &nbsp;·&nbsp; 5x² − 2x² = 3x²</div>
            <div class="formula-note">Add or subtract the coefficients; keep the common letter part unchanged.</div>
          </div>
          <div class="readout">
            <div><span>Can combine</span><b>4a + 7a = 11a</b></div>
            <div><span>Cannot combine</span><b>x² + x³ stays x² + x³</b></div>
          </div>
        </div>`;
      case "properties":
        return `<div class="course">
          <h3>Rearrange safely</h3>
          <p>The commutative and associative laws let you rearrange or regroup <b>addition</b>
          and <b>multiplication</b>. They do not license swapping subtraction or division.</p>
          <div class="formula" data-derivation="commutative-associative">
            <div class="formula-label">Order and grouping</div>
            <div class="formula-body">a + b = b + a &nbsp;·&nbsp; (a + b) + c = a + (b + c)</div>
            <div class="formula-note">The same is true for multiplication; use it to collect compatible factors or terms.</div>
          </div>
          <div class="readout">
            <div><span>Identity</span><b>a + 0 = a; a × 1 = a</b></div>
            <div><span>Inverse</span><b>a + (−a) = 0; a × 1/a = 1</b></div>
            <div><span>Not commutative</span><b>a − b ≠ b − a</b></div>
          </div>
        </div>`;
      case "distribute":
        return `<div class="course">
          <h3>Brackets: distribute or factor</h3>
          <p>Multiplication reaches <b>every</b> term inside brackets. Factoring is the reverse:
          pull a common factor back outside.</p>
          <div class="formula" data-derivation="distributive">
            <div class="formula-label">Distributive law</div>
            <div class="formula-body">a(b + c) = ab + ac &nbsp;·&nbsp; ab + ac = a(b + c)</div>
            <div class="formula-note">Think “a groups of b and c”, not “multiply only the first term”.</div>
          </div>
          <p class="course-hint">Example: <code>3(x + 4) = 3x + 12</code>, while
          <code>6x + 9 = 3(2x + 3)</code>.</p>
        </div>`;
      case "indices":
        return `<div class="course">
          <h3>Index laws: factors, not terms</h3>
          <p>These rules come from counting repeated factors of the <b>same non-zero base</b>.
          They apply to ×, ÷, and a power raised to a power—not to + or −.</p>
          <div class="formula" data-derivation="product-of-powers">
            <div class="formula-label">Multiply matching bases</div>
            <div class="formula-body">xᵐ × xⁿ = xᵐ⁺ⁿ</div>
            <div class="formula-note">Joining factors adds their count.</div>
          </div>
          <div class="formula" data-derivation="quotient-of-powers">
            <div class="formula-label">Divide matching bases</div>
            <div class="formula-body">xᵐ / xⁿ = xᵐ⁻ⁿ</div>
            <div class="formula-note">Cancelling factors subtracts their count.</div>
          </div>
          <div class="formula" data-derivation="power-of-power">
            <div class="formula-label">Raise a power</div>
            <div class="formula-body">(xᵐ)ⁿ = xᵐⁿ</div>
            <div class="formula-note">Repeating m factors n times gives m × n factors.</div>
          </div>
          <div class="formula" data-derivation="zero-negative-indices">
            <div class="formula-label">Zero and negative indices</div>
            <div class="formula-body">x⁰ = 1 &nbsp;·&nbsp; x⁻ⁿ = 1/xⁿ</div>
            <div class="formula-note">Keep dividing by x and the exponents step down through zero into reciprocals.</div>
          </div>
        </div>`;
    }
  }

  private drawStage(): void {
    this.disposeGroup();
    const chapter = CHAPTERS.find((item) => item.id === this.chapter) ?? CHAPTERS[0];
    const equation = textSprite(chapter.stage, 0x7ee787, 0.62);
    equation.position.set(0, 0.8, 0);
    this.group.add(equation);
    const prompt = textSprite("Choose a rule, then explain why it preserves the value.", 0xc9d1d9, 0.34);
    prompt.position.set(0, -0.35, 0);
    this.group.add(prompt);
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
