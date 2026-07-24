import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { pascalRow } from "../math/pascal";
import { PASCAL_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite, tip } from "./helpers";

registerFormulaDerivations("pascal-triangle", PASCAL_DERIVATIONS);

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
  "9": "⁹",
};

function superscript(value: number): string {
  return String(value).split("").map((digit) => SUPERSCRIPT_DIGITS[digit]).join("");
}

export class PascalTriangleLesson implements Lesson {
  readonly id = "pascal-triangle";
  readonly title = "Pascal's Triangle";
  readonly blurb = "Patterns, binomials, paths and probability";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["binomials"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private readonly params = {
    row: 5,
    a: 1,
    b: 1,
    choose: 2,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0, 11),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildControls();
    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "row", 0, 10, 1).name("Pascal row n"),
      "Rows start at 0 so each entry aligns with its standard C(n, k) notation. Each interior entry is the sum of the two entries directly above it.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "a", -4, 4, 1).name("Value of a"),
      "Substitute a value into the expansion of (a + b)ⁿ.",
    ).onChange(() => this.renderPanel());
    tip(
      this.gui.add(this.params, "b", -4, 4, 1).name("Value of b"),
      "Substitute a value into the expansion of (a + b)ⁿ.",
    ).onChange(() => this.renderPanel());
    tip(
      this.gui.add(this.params, "choose", 0, 10, 1).name("Choose k"),
      "The entry C(n, k) counts ways to choose k objects from n.",
    ).onChange(() => this.refresh());
  }

  private refresh(): void {
    this.params.row = Math.max(0, Math.min(10, Math.round(this.params.row)));
    this.params.choose = Math.min(this.params.row, Math.round(this.params.choose));
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.rebuildTriangle();
    this.renderPanel();
  }

  private rebuildTriangle(): void {
    this.disposeGroup();

    const selectedRow = this.params.row;
    const spacing = Math.min(1.1, 9 / (selectedRow + 1));
    const verticalSpacing = 0.76;

    for (let row = 0; row <= selectedRow; row++) {
      const coefficients = pascalRow(row);
      const y = (selectedRow / 2 - row) * verticalSpacing;
      for (let column = 0; column < coefficients.length; column++) {
        const x = (column - row / 2) * spacing;
        const selected = row === selectedRow;
        const selectedEntry = selected && column === this.params.choose;
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(spacing * 0.72, 0.48, 0.16),
          new THREE.MeshStandardMaterial({
            color: selectedEntry ? 0x2ea043 : selected ? 0x1f6feb : 0x263041,
            emissive: selectedEntry ? 0x0b3d1b : selected ? 0x0d419d : 0x000000,
            roughness: 0.6,
          }),
        );
        block.position.set(x, y, 0);
        this.group.add(block);

        const label = textSprite(
          String(coefficients[column]),
          selected ? 0xffffff : 0x8b949e,
          Math.min(0.4, spacing * 0.34),
        );
        label.position.set(x, y, 0.16);
        this.group.add(label);
      }
    }

    const title = textSprite(`Pascal's triangle - selected row ${selectedRow}`, 0x7ee787, 0.42);
    title.position.set(0, selectedRow * verticalSpacing / 2 + 0.72, 0.1);
    this.group.add(title);
  }

  private renderPanel(): void {
    const { row, a, b, choose } = this.params;
    const coefficients = pascalRow(row);
    const rowSum = coefficients.reduce((sum, coefficient) => sum + coefficient, 0);
    const expansion = coefficients
      .map((coefficient, index) => this.formatTerm(coefficient, row - index, index))
      .join(" + ");
    const evaluated = coefficients.reduce(
      (sum, coefficient, index) => sum + coefficient * a ** (row - index) * b ** index,
      0,
    );
    const combinations = coefficients[choose];
    const outcomes = 2 ** row;
    const probability = combinations / outcomes;

    this.setInfo(`
      <h2>Pascal's Triangle</h2>
      <p>Every interior entry is made by adding the two entries above it. This deceptively simple
      rule links algebra, counting, probability, geometry and even cellular automata.</p>

      <h3>Binomial expansions</h3>
      <p>Rows start at <b>0</b> so they match the standard <code>C(n, k)</code> notation:
      row <b>${row}</b> contains the coefficients of <code>(a + b)${superscript(row)}</code>.</p>
      <div class="readout" id="pascal-readout">
        <div><span>Row ${row}</span><b>${coefficients.join(", ")}</b></div>
        <div><span>Symbolic expansion</span><b>${expansion}</b></div>
        <div><span>With a = ${a}, b = ${b}</span><b>(${a} + ${b})${superscript(row)} = ${evaluated}</b></div>
      </div>
      ${derivationButton("pascal-binomial")}
      <p class="example"><b>Try it:</b> choose row 4, read the symbolic line as
      <code>(x + 2)⁴ = x⁴ + 8x³ + 24x² + 32x + 16</code>, then use the numeric controls to
      check the same coefficients with particular values.</p>

      <h3>Interesting pattern: powers of two</h3>
      <p>Set <code>a = 1</code> and <code>b = 1</code>. Every term becomes its coefficient, so
      the row sum is <code>(1 + 1)${superscript(row)} = 2${superscript(row)}</code>.</p>
      ${derivationButton("pascal-row-sum")}
      <div class="readout">
        <div><span>Sum of row ${row}</span><b>${coefficients.join(" + ")} = ${rowSum}</b></div>
        <div><span>Power-of-two check</span><b>2${superscript(row)} = ${2 ** row}</b></div>
      </div>
      <p>The diagonal sums also follow the Fibonacci sequence: <code>1, 1, 2, 3, 5, 8, ...</code>.
      Colour odd entries only and Pascal's Triangle becomes the Sierpinski triangle, a fractal.</p>

      <h3>Applications: counting and probability</h3>
      <div class="readout">
        <div><span>Ways to choose ${choose} from ${row}</span><b>C(${row}, ${choose}) = ${combinations}</b></div>
        <div><span>${row} fair coin flips: exactly ${choose} heads</span><b>${combinations} / ${outcomes} = ${(probability * 100).toFixed(2)}%</b></div>
      </div>
      ${derivationButton("pascal-combinations")}
      <p>That same coefficient counts routes through a grid, possible teams, hands of cards and
      the ways a binomial random variable can produce a result. For example, there are
      <code>C(52, 5) = 2,598,960</code> possible five-card poker hands.</p>
      <p class="example"><b>Try it:</b> set row 10 and choose 5. The central entry,
      <code>C(10, 5) = 252</code>, is the most likely count of heads in ten fair coin flips.</p>
    `);
  }

  private formatTerm(coefficient: number, aPower: number, bPower: number): string {
    const factors: string[] = [];
    if (coefficient !== 1 || (aPower === 0 && bPower === 0)) factors.push(String(coefficient));
    if (aPower > 0) factors.push(`a${superscript(aPower)}`);
    if (bPower > 0) factors.push(`b${superscript(bPower)}`);
    return factors.join("");
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else if (material) {
        const spriteMaterial = material as THREE.SpriteMaterial;
        spriteMaterial.map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
