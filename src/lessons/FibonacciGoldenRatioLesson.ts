import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  GOLDEN_RATIO,
  fibonacci,
  fibonacciRatio,
  fibonacciSequence,
  goldenSpiralSquares,
  ratioError,
  spiralBounds,
} from "../math/fibonacci";
import { FIBONACCI_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite, tip } from "./helpers";

registerFormulaDerivations("fibonacci-golden-ratio", FIBONACCI_DERIVATIONS);

const VISUALS = ["Bars", "Golden spiral"] as const;
type Visual = (typeof VISUALS)[number];

/** Squares stay readable up to F(11) = 89; beyond that the tiling is mostly empty space. */
const MAX_SPIRAL_STEPS = 11;

export class FibonacciGoldenRatioLesson implements Lesson {
  readonly id = "fibonacci-golden-ratio";
  readonly title = "Fibonacci & the Golden Ratio";
  readonly blurb = "Self-similar growth from adding neighbours to φ";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["foundations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private readonly params = {
    terms: 12,
    highlight: 8,
    visual: "Bars" as Visual,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 0, 0));

    tip(
      this.gui.add(this.params, "terms", 5, 20, 1).name("Terms shown"),
      "How many Fibonacci numbers to draw, counting F₀ = 0 as the first term.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "highlight", 1, 19, 1).name("Highlight n"),
      "Pick a term to inspect. The readout shows F(n), F(n+1) and how close their ratio is to φ.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "visual", [...VISUALS]).name("Visual"),
      "Bars compare the sizes of the terms; the golden spiral tiles Fibonacci squares into a rectangle.",
    ).onChange(() => this.refresh());

    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.params.terms = Math.round(this.params.terms);
    this.params.highlight = Math.max(1, Math.min(this.params.terms - 1, Math.round(this.params.highlight)));
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());

    this.disposeGroup();
    if (this.params.visual === "Bars") this.buildBars();
    else this.buildSpiral();
    this.renderPanel();
  }

  private buildBars(): void {
    const terms = fibonacciSequence(this.params.terms);
    const spacing = Math.min(0.9, 13 / this.params.terms);
    const largest = Math.log(Number(terms[terms.length - 1]) + 1) || 1;

    for (let index = 0; index < terms.length; index++) {
      const value = Number(terms[index]);
      // A log height keeps F(0) visible while F(19) still fits on screen.
      const height = Math.max(0.12, (Math.log(value + 1) / largest) * 6.4);
      const selected = index === this.params.highlight || index === this.params.highlight + 1;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(spacing * 0.68, height, 0.25),
        new THREE.MeshStandardMaterial({
          color: index === this.params.highlight ? 0x2ea043 : selected ? 0xffa657 : 0x1f6feb,
          emissive: selected ? 0x0b3d1b : 0x000000,
          roughness: 0.6,
        }),
      );
      const x = (index - (terms.length - 1) / 2) * spacing;
      bar.position.set(x, height / 2 - 3.2, 0);
      this.group.add(bar);

      const label = textSprite(terms[index].toString(), selected ? 0xffffff : 0x8b949e, Math.min(0.42, spacing * 0.6));
      label.position.set(x, height - 2.95, 0.2);
      this.group.add(label);

      const indexLabel = textSprite(`F${subscript(index)}`, 0x8b949e, Math.min(0.34, spacing * 0.5));
      indexLabel.position.set(x, -3.55, 0.2);
      this.group.add(indexLabel);
    }

    const n = this.params.highlight;
    const caption = textSprite(
      `F${subscript(n + 1)} / F${subscript(n)} = ${fibonacci(n + 1)} / ${fibonacci(n)} = ${fibonacciRatio(n).toFixed(6)}`,
      0x7ee787,
      0.46,
    );
    caption.position.set(0, 4.1, 0);
    this.group.add(caption);
    const target = textSprite(`φ = ${GOLDEN_RATIO.toFixed(6)}`, 0xffa657, 0.4);
    target.position.set(0, 3.45, 0);
    this.group.add(target);
  }

  private buildSpiral(): void {
    const steps = Math.max(2, Math.min(MAX_SPIRAL_STEPS, this.params.terms - 1));
    const squares = goldenSpiralSquares(steps);
    const bounds = spiralBounds(squares);
    const scale = Math.min(12 / bounds.width, 7.2 / bounds.height);
    const offsetX = -(bounds.minX + bounds.width / 2) * scale;
    const offsetY = -(bounds.minY + bounds.height / 2) * scale;
    const place = (x: number, y: number): THREE.Vector3 =>
      new THREE.Vector3(x * scale + offsetX, y * scale + offsetY, 0);

    for (const square of squares) {
      const side = square.side * scale;
      const centre = place(square.x + square.side / 2, square.y + square.side / 2);
      const highlighted = square.index + 1 === this.params.highlight;
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(side * 0.98, side * 0.98),
        new THREE.MeshStandardMaterial({
          color: highlighted ? 0x2ea043 : 0x263041,
          roughness: 0.8,
          transparent: true,
          opacity: 0.85,
        }),
      );
      face.position.copy(centre).setZ(-0.05);
      this.group.add(face);

      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          place(square.x, square.y),
          place(square.x + square.side, square.y),
          place(square.x + square.side, square.y + square.side),
          place(square.x, square.y + square.side),
        ]),
        new THREE.LineBasicMaterial({ color: highlighted ? 0x7ee787 : 0x1f6feb }),
      );
      this.group.add(outline);

      const arcPoints: THREE.Vector3[] = [];
      const segments = 48;
      for (let step = 0; step <= segments; step++) {
        const angle = square.startAngle + (step / segments) * (square.endAngle - square.startAngle);
        arcPoints.push(place(
          square.centreX + square.side * Math.cos(angle),
          square.centreY + square.side * Math.sin(angle),
        ));
      }
      const arc = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(arcPoints),
        new THREE.LineBasicMaterial({ color: 0xffa657 }),
      );
      arc.position.setZ(0.08);
      this.group.add(arc);

      if (side > 0.5) {
        const label = textSprite(String(square.side), highlighted ? 0xffffff : 0x8b949e, Math.min(0.6, side * 0.35));
        label.position.copy(centre).setZ(0.15);
        this.group.add(label);
      }
    }

    const caption = textSprite(
      `${bounds.width} × ${bounds.height} rectangle · ratio ${bounds.aspect.toFixed(6)}`,
      0x7ee787,
      0.44,
    );
    caption.position.set(0, 4.2, 0);
    this.group.add(caption);
  }

  private renderPanel(): void {
    const n = this.params.highlight;
    const terms = fibonacciSequence(this.params.terms);
    const table = terms
      .map((value, index) => `<span>F${subscript(index)} = ${value}</span>`)
      .join(" · ");
    const previous = fibonacci(n - 1);
    const current = fibonacci(n);
    const next = fibonacci(n + 1);
    const ratio = fibonacciRatio(n);
    const spiralSteps = Math.max(2, Math.min(MAX_SPIRAL_STEPS, this.params.terms - 1));
    const bounds = spiralBounds(goldenSpiralSquares(spiralSteps));

    this.setInfo(`
      <h2>Fibonacci &amp; the Golden Ratio</h2>
      <p>Start with two numbers and keep adding the last two together. That one rule produces the
      <b>Fibonacci sequence</b>, and dividing each term by the one before it drives a single number
      out of the arithmetic: the <b>golden ratio</b> <code>φ ≈ 1.618034</code>.</p>

      <h3>1. The sequence</h3>
      <p>The modern convention starts at <code>F₀ = 0</code> and <code>F₁ = 1</code>, then
      <code>Fₙ = Fₙ₋₁ + Fₙ₋₂</code>. Fibonacci's own rabbit problem started a step later, at
      <code>1, 1, 2, 3, 5, 8…</code>; the two lists are the same sequence with a different starting
      index, so always check which convention a source uses.</p>
      <div class="readout">
        <div><span>First ${this.params.terms} terms</span><b>${terms.join(", ")}</b></div>
        <div><span>Indexed</span><b>${table}</b></div>
      </div>

      <h3>2. Build the next term</h3>
      <p>Every term is the sum of its two neighbours to the left. Nothing else is needed — no
      formula, no multiplication.</p>
      <div class="readout">
        <div><span>F${subscript(n - 1)} + F${subscript(n)}</span><b>${previous} + ${current} = ${previous + current}</b></div>
        <div><span>So F${subscript(n + 1)}</span><b>${next}</b></div>
        <div><span>Check</span><b>${next === previous + current ? "the rule reproduces the table" : "mismatch"}</b></div>
      </div>

      <h3>3. Divide neighbours and watch the ratio settle</h3>
      <p>The terms themselves grow without limit, but their <i>ratios</i> do not. They bounce above
      and below one value and close in on it fast: each step roughly shrinks the error by a factor
      of <code>φ² ≈ 2.618</code>.</p>
      <div class="readout">
        <div><span>F${subscript(n + 1)} ÷ F${subscript(n)}</span><b>${next} ÷ ${current} = ${ratio.toFixed(9)}</b></div>
        <div><span>φ</span><b>${GOLDEN_RATIO.toFixed(9)}</b></div>
        <div><span>Distance from φ</span><b>${ratioError(n).toExponential(3)}</b></div>
        <div><span>Above or below</span><b>${ratio > GOLDEN_RATIO ? "above φ" : "below φ"} — consecutive ratios alternate</b></div>
      </div>
      ${derivationButton("fibonacci-ratio-limit")}

      <h3>4. What the golden ratio actually is</h3>
      <p><code>φ = (1 + √5) / 2 = 1.6180339887…</code> is the one positive number that is exactly one
      more than its own reciprocal: <code>φ = 1 + 1/φ</code>, equivalently <code>φ² = φ + 1</code>.
      Geometrically, cut a <code>φ × 1</code> rectangle by removing a <code>1 × 1</code> square and
      the leftover piece is another <code>φ × 1</code> rectangle — the shape reproduces itself.</p>
      ${derivationButton("golden-ratio-equation")}
      <div class="readout">
        <div><span>φ</span><b>${GOLDEN_RATIO.toFixed(9)}</b></div>
        <div><span>1 + 1/φ</span><b>${(1 + 1 / GOLDEN_RATIO).toFixed(9)}</b></div>
        <div><span>φ² − φ</span><b>${(GOLDEN_RATIO * GOLDEN_RATIO - GOLDEN_RATIO).toFixed(9)}</b></div>
        <div><span>Spiral rectangle</span><b>${bounds.width} × ${bounds.height}, ratio ${bounds.aspect.toFixed(6)}</b></div>
      </div>

      <h3>5. Binet's formula: powers of φ give whole numbers</h3>
      <p>Because the sequence grows geometrically, it has a closed form:
      <code>Fₙ = (φⁿ − ψⁿ)/√5</code> with <code>ψ = (1 − √5)/2 ≈ −0.618</code>. The second term is
      always smaller than a half, so in practice <code>Fₙ</code> is just <code>φⁿ/√5</code> rounded
      to the nearest whole number.</p>
      ${derivationButton("binet-formula")}
      <div class="readout">
        <div><span>φ${superscript(n)} ÷ √5</span><b>${(GOLDEN_RATIO ** n / Math.sqrt(5)).toFixed(4)}</b></div>
        <div><span>Rounded</span><b>${Math.round(GOLDEN_RATIO ** n / Math.sqrt(5))}</b></div>
        <div><span>Exact F${subscript(n)}</span><b>${current}</b></div>
      </div>

      <h3>6. Where else it turns up</h3>
      <p><b>Pascal's triangle:</b> add the shallow diagonals of the triangle and the Fibonacci
      numbers fall out: <code>1, 1, 2, 3, 5, 8…</code> because
      <code>Fₙ₊₁ = ΣC(n − k, k)</code>. <b>Growth in nature:</b> sunflower seed heads, pine cones and
      leaf spacing tend to Fibonacci counts because a turn of <code>360° / φ ≈ 137.5°</code> between
      successive growths packs new material with the least overlap — an efficiency result, not
      mysticism. <b>Algorithms:</b> the Euclidean algorithm takes its worst case on consecutive
      Fibonacci numbers, and Fibonacci search splits a range in the same proportion.</p>
      <p class="example"><b>Careful:</b> claims that φ governs the Parthenon, the Mona Lisa or the
      human body are mostly retrofitted. The mathematics is solid; much of the aesthetic folklore is
      not.</p>

      <h3>Try it</h3>
      <p class="example"><b>Try it:</b> keep the <b>Bars</b> visual and drag <b>Highlight n</b> from
      1 to 10, watching "Distance from φ" collapse by roughly a factor of 2.6 at every step. Then
      switch <b>Visual</b> to <b>Golden spiral</b> and raise <b>Terms shown</b>: each new square has
      the side of the next Fibonacci number, and the surrounding rectangle's ratio
      (${bounds.aspect.toFixed(6)}) creeps towards φ.</p>
    `);
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

const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";
const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function subscript(value: number): string {
  return String(value).split("").map((digit) => SUBSCRIPT_DIGITS[Number(digit)]).join("");
}

function superscript(value: number): string {
  return String(value).split("").map((digit) => SUPERSCRIPT_DIGITS[Number(digit)]).join("");
}
