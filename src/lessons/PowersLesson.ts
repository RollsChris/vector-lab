import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { POWERS_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite, tip } from "./helpers";

registerFormulaDerivations("powers", POWERS_DERIVATIONS);

export class PowersLesson implements Lesson {
  readonly id = "powers";
  readonly title = "Powers & Exponential Growth";
  readonly blurb = "Repeated multiplication, doubling and rapid growth";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["algebraic-laws"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private readonly params = {
    base: 2,
    exponent: 8,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 1.5, 12), new THREE.Vector3(0, 1.5, 0));

    tip(
      ctx.gui.add(this.params, "base", 2, 10, 1).name("Base b"),
      "The number repeatedly multiplied by itself.",
    ).onChange(() => this.refresh());
    tip(
      ctx.gui.add(this.params, "exponent", 1, 12, 1).name("Largest exponent n"),
      "The stage plots b⁰ through bⁿ. Bar height is logarithmic so every value stays visible.",
    ).onChange(() => this.refresh());
    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.disposeGroup();
    const { base, exponent } = this.params;
    const width = Math.min(0.72, 9 / (exponent + 1));

    for (let power = 0; power <= exponent; power++) {
      const value = base ** power;
      const height = 0.28 + Math.log10(value + 1) * 0.9;
      const x = (power - exponent / 2) * Math.min(0.9, 9 / (exponent + 1));
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.35),
        new THREE.MeshStandardMaterial({ color: power === exponent ? 0x2ea043 : 0x1f6feb, roughness: 0.6 }),
      );
      bar.position.set(x, height / 2, 0);
      this.group.add(bar);

      const label = textSprite(`${base}^${power} = ${value.toLocaleString()}`, 0xffffff, 0.28);
      label.position.set(x, height + 0.28, 0.25);
      this.group.add(label);
    }

    const caption = textSprite("Bar height uses a log scale; labels show the exact values.", 0x8b949e, 0.31);
    caption.position.set(0, -0.45, 0);
    this.group.add(caption);
    this.renderPanel();
  }

  private renderPanel(): void {
    const { base, exponent } = this.params;
    const value = base ** exponent;
    const next = value * base;
    const bitStates = 2 ** exponent;

    this.setInfo(`
      <h2>Powers & Exponential Growth</h2>
      <p>A power is compact notation for repeated multiplication: <code>bⁿ</code> means multiply
      <code>b</code> by itself <code>n</code> times. Add one to an exponent and you multiply the
      answer by the base, which is why exponential change becomes dramatic so quickly.</p>

      <h3>Read the growth</h3>
      <div class="readout">
        <div><span>Selected power</span><b>${base}${this.superscript(exponent)} = ${value.toLocaleString()}</b></div>
        <div><span>One step later</span><b>${base}${this.superscript(exponent + 1)} = ${next.toLocaleString()}</b></div>
        <div><span>Growth factor per step</span><b>×${base}</b></div>
      </div>
      ${derivationButton("powers-next")}
      <p>The first values can look harmless, but the multiplier applies to the whole previous
      result. That makes powers fundamentally different from linear growth, where we add a fixed
      amount each step.</p>

      <h3>Interesting facts</h3>
      <ul>
        <li>The total grains in the chessboard doubling story is <code>2⁶⁴ − 1</code>:
        18,446,744,073,709,551,615 grains.</li>
        <li>Every extra binary digit doubles the number of possible states. Ten bits encode
        <code>2¹⁰ = 1,024</code> distinct values; thirty-two bits encode over four billion.</li>
        <li>Writing a huge number in scientific notation is an application of powers of ten:
        <code>6.02 × 10²³</code> is Avogadro's constant.</li>
      </ul>
      ${derivationButton("powers-geometric-sum")}

      <h3>Applications</h3>
      <p><b>Computing:</b> binary storage, cryptographic key spaces and search problems grow in
      powers of two. With ${exponent} binary switches there are <b>${bitStates.toLocaleString()}</b>
      possible on/off patterns.</p>
      <p><b>Finance and science:</b> compound interest uses <code>A = P(1 + r)ᵗ</code>; population
      growth, radioactive decay and signal attenuation all use exponential models. Logarithms are
      the inverse tool that lets us solve for the exponent.</p>
      ${derivationButton("powers-compound-growth")}
      <p class="example"><b>Try it:</b> keep the base at 2 and raise the largest exponent. This is
      the language of bits and doubling. Then switch to base 10 to see why scientific notation
      jumps through such enormous scales.</p>
    `);
  }

  private superscript(value: number): string {
    const digits: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(value).split("").map((digit) => digits[digit]).join("");
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
