import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { isMersennePrime, mersenneNumber } from "../math/pascal";
import { isPrime } from "../math/primes";
import { MERSENNE_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite, tip } from "./helpers";

registerFormulaDerivations("mersenne-primes", MERSENNE_DERIVATIONS);

export class MersennePrimesLesson implements Lesson {
  readonly id = "mersenne-primes";
  readonly title = "Mersenne Primes";
  readonly blurb = "Binary patterns, perfect numbers and a specialised prime test";
  readonly category = "Foundations" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["powers", "prime-numbers"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private readonly params = { exponent: 5 };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 0, 0));
    tip(
      ctx.gui.add(this.params, "exponent", 2, 31, 1).name("Exponent p"),
      "Test the Mersenne number 2ᵖ − 1. The stage shows its binary representation.",
    ).onChange(() => this.refresh());
    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.params.exponent = Math.round(this.params.exponent);
    this.disposeGroup();
    const { exponent } = this.params;
    const primeExponent = isPrime(exponent);
    const mersennePrime = primeExponent && isMersennePrime(exponent);
    const spacing = Math.min(0.45, 10 / exponent);
    const colour = mersennePrime ? 0x2ea043 : primeExponent ? 0xffa657 : 0x263041;

    for (let bit = 0; bit < exponent; bit++) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(spacing * 0.75, 0.65, 0.2),
        new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6 }),
      );
      block.position.set((bit - (exponent - 1) / 2) * spacing, 0, 0);
      this.group.add(block);
      const label = textSprite("1", 0xffffff, Math.min(0.32, spacing * 0.55));
      label.position.set(block.position.x, 0, 0.17);
      this.group.add(label);
    }
    const caption = textSprite(
      `2^${exponent} - 1 is ${exponent} ones in binary`,
      mersennePrime ? 0x7ee787 : 0x8b949e,
      0.4,
    );
    caption.position.set(0, 0.85, 0);
    this.group.add(caption);
    this.renderPanel(primeExponent, mersennePrime);
  }

  private renderPanel(primeExponent: boolean, mersennePrime: boolean): void {
    const { exponent } = this.params;
    const candidate = mersenneNumber(exponent);
    const result = mersennePrime ? "Mersenne prime" : "composite";

    this.setInfo(`
      <h2>Mersenne Primes</h2>
      <p>Start with a power of two, then subtract one. The result is a <b>Mersenne number</b>:
      <code>Mₚ = 2ᵖ − 1</code>. It is a <b>Mersenne prime</b> only when that whole number is prime.
      This simple rule leads from binary arithmetic to perfect numbers and record-breaking computation.</p>

      <h3>1. See the binary pattern</h3>
      <p>In binary, every power of two is a one followed by zeroes. Subtracting one turns those
      zeroes into ones: <code>2⁵ = 100000₂</code>, so <code>M₅ = 31 = 11111₂</code>. The stage
      shows exactly ${exponent} ones because <code>M${this.superscript(exponent)}</code> has
      <code>${exponent}</code> binary digits.</p>
      ${derivationButton("mersenne-binary")}
      <div class="readout">
        <div><span>Selected power</span><b>2${this.superscript(exponent)} = ${(1n << BigInt(exponent)).toString()}</b></div>
        <div><span>Subtract one</span><b>2${this.superscript(exponent)} − 1 = ${candidate.toString()}</b></div>
        <div><span>Binary form</span><b>${"1".repeat(exponent)}₂</b></div>
      </div>

      <h3>2. Filter the exponents</h3>
      <p>The exponent must be prime. If <code>p = rs</code>, then
      <code>2ʳˢ − 1 = (2ʳ − 1)(2ʳ⁽ˢ⁻¹⁾ + ... + 1)</code>, so the candidate already factors.
      But a prime exponent is only a filter, not a proof:
      <code>2¹¹ − 1 = 2047 = 23 × 89</code>.</p>
      ${derivationButton("mersenne-composite-exponent")}

      <h3>Test a candidate</h3>
      <div class="readout">
        <div><span>Exponent p</span><b>${exponent}${primeExponent ? " is prime" : " is composite"}</b></div>
        <div><span>Mₚ</span><b>2${this.superscript(exponent)} − 1 = ${candidate.toString()}</b></div>
        <div><span>Lucas-Lehmer result</span><b>${result}</b></div>
      </div>
      ${primeExponent
        ? `<p>${mersennePrime
          ? `This candidate passes the Lucas-Lehmer test, so it is prime.`
          : `The Lucas-Lehmer test leaves a non-zero remainder, so this candidate is composite.`}</p>`
        : `<p>A composite exponent guarantees a composite Mersenne number, because
        <code>2ʳˢ − 1</code> factors whenever <code>p = rs</code>.</p>`}

      <h3>3. Prove the survivors with Lucas-Lehmer</h3>
      <p>For an odd prime exponent <code>p</code>, start with <code>s₀ = 4</code> and repeatedly calculate
      <code>sₙ₊₁ = sₙ² − 2 (mod Mₚ)</code>. After <code>p − 2</code> rounds,
      <code>Mₚ</code> is prime exactly when the result is zero; <code>M₂ = 3</code> is the simple
      special case. For <code>p = 5</code>:
      <code>4 → 14 → 8 → 0 (mod 31)</code>, proving that <code>31</code> is prime. This test is
      dramatically faster than trying every possible divisor of an enormous candidate.</p>

      <h3>4. Connect primes to perfect numbers</h3>
      <p>A <b>perfect number</b> equals the sum of its positive proper divisors:
      <code>6 = 1 + 2 + 3</code>. Euclid proved that every Mersenne prime creates an even perfect
      number: if <code>Mₚ</code> is prime, then <code>2ᵖ⁻¹Mₚ</code> is perfect. Euler later proved
      the converse: every even perfect number comes from this formula.</p>
      ${derivationButton("mersenne-perfect")}
      <div class="readout">
        <div><span>M₂ = 3</span><b>2 × 3 = 6 = 1 + 2 + 3</b></div>
        <div><span>M₃ = 7</span><b>4 × 7 = 28 = 1 + 2 + 4 + 7 + 14</b></div>
      </div>

      <h3>History, research and use</h3>
      <p>Euclid described the perfect-number construction around 300 BCE. Marin Mersenne published
      a famous but imperfect list of candidate exponents in 1644, giving this family its name.
      Lucas developed the basis of the specialised test in the 19th century, and Lehmer made it
      practical in the 20th.</p>
      <p><b>Computational mathematics:</b> GIMPS distributes Lucas-Lehmer tests among volunteers.
      Only <b>52</b> Mersenne primes are known; the largest is
      <code>2¹³⁶²⁷⁹⁸⁴¹ − 1</code>, with 41,024,320 digits. Their unusually efficient test makes
      them a real-world benchmark for high-precision arithmetic, while their perfect-number link
      keeps them central to number-theory research.</p>
      <p class="example"><b>Try it:</b> choose <code>p = 4</code> to see the factor shortcut,
      <code>p = 5</code> for the first Lucas-Lehmer proof, then <code>p = 11</code> to discover why
      a prime exponent alone is not enough. Finish with <code>p = 13</code>, which produces 8191.</p>
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
