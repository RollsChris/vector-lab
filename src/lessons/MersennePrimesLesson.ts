import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { classifyMersenne, lucasLehmerSteps, mersenneNumber } from "../math/pascal";
import { sieve } from "../math/primes";
import { MERSENNE_DERIVATIONS } from "./formulaDerivations/foundations";
import { textSprite, tip } from "./helpers";

registerFormulaDerivations("mersenne-primes", MERSENNE_DERIVATIONS);

const GREEN = 0x2ea043;
const AMBER = 0xffa657;
const SLATE = 0x263041;
const BLUE = 0x1f6feb;

/** Primes small enough to sit on the comparison strip without crowding it. */
const COMPARISON_LIMIT = 40;

export class MersennePrimesLesson implements Lesson {
  readonly id = "mersenne-primes";
  readonly title = "Mersenne Primes";
  readonly blurb = "Which primes have the shape 2ᵖ − 1, and which do not";
  readonly category = "Foundations" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["powers", "prime-numbers"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private readonly params = { exponent: 5 };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 13), new THREE.Vector3(0, 0, 0));
    tip(
      this.gui.add(this.params, "exponent", 2, 31, 1).name("Exponent p"),
      "Build the Mersenne number 2ᵖ − 1. Green means it is prime, amber means the prime exponent still failed, grey means the exponent itself is composite.",
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
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.disposeGroup();
    this.buildComparisonStrip();
    this.buildBinaryRow();
    this.renderPanel();
  }

  /**
   * Top strip: every prime below the limit, with the rare ones that also have Mersenne shape
   * picked out. This is the picture that separates "prime" from "Mersenne prime".
   */
  private buildComparisonStrip(): void {
    const primes = sieve(COMPARISON_LIMIT);
    const mersennePrimes = new Set([3, 7, 31]); // Mersenne primes below 40.
    const spacing = Math.min(0.95, 12 / primes.length);
    const current = Number(mersenneNumber(this.params.exponent));

    const heading = textSprite("Ordinary primes up to 40 — green ones are also Mersenne primes", 0x8b949e, 0.36);
    heading.position.set(0, 4.5, 0);
    this.group.add(heading);

    for (let index = 0; index < primes.length; index++) {
      const prime = primes[index];
      const isMersenne = mersennePrimes.has(prime);
      const selected = prime === current;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(spacing * 0.78, 0.62, 0.2),
        new THREE.MeshStandardMaterial({
          color: isMersenne ? GREEN : BLUE,
          emissive: selected ? 0x0b3d1b : 0x000000,
          roughness: 0.6,
        }),
      );
      tile.position.set((index - (primes.length - 1) / 2) * spacing, 3.6, 0);
      this.group.add(tile);
      const label = textSprite(String(prime), 0xffffff, Math.min(0.34, spacing * 0.55));
      label.position.set(tile.position.x, 3.6, 0.18);
      this.group.add(label);
    }

    const footnote = textSprite(
      "5, 11, 13, 17, 19 … are prime but never one less than a power of two",
      0x8b949e,
      0.32,
    );
    footnote.position.set(0, 2.85, 0);
    this.group.add(footnote);
  }

  /** Lower half: the selected Mersenne number as a row of binary ones, colour-coded. */
  private buildBinaryRow(): void {
    const { exponent } = this.params;
    const classification = classifyMersenne(exponent);
    const spacing = Math.min(0.45, 10 / exponent);
    const colour = classification.kind === "mersenne-prime"
      ? GREEN
      : classification.kind === "prime-exponent-composite"
        ? AMBER
        : SLATE;

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
      `M${subscript(exponent)} = 2${superscript(exponent)} − 1 = ${classification.value} = ${exponent} ones in binary`,
      colour === SLATE ? 0x8b949e : 0xffffff,
      0.42,
    );
    caption.position.set(0, 0.95, 0);
    this.group.add(caption);

    const verdict = textSprite(
      this.verdictLine(classification),
      colour === SLATE ? 0x8b949e : colour === AMBER ? AMBER : 0x7ee787,
      0.4,
    );
    verdict.position.set(0, -1.1, 0);
    this.group.add(verdict);

    const legendLines = [
      "green = Mersenne prime (prime, and one less than a power of two)",
      "amber = prime exponent, but the Mersenne number still factors",
      "grey = composite exponent, so the Mersenne number cannot be prime",
    ];
    const legendColours = [0x7ee787, AMBER, 0x8b949e];
    for (let line = 0; line < legendLines.length; line++) {
      const sprite = textSprite(legendLines[line], legendColours[line], 0.32);
      sprite.position.set(0, -2.1 - line * 0.5, 0);
      this.group.add(sprite);
    }
  }

  private verdictLine(classification: ReturnType<typeof classifyMersenne>): string {
    switch (classification.kind) {
      case "mersenne-prime":
        return `${classification.value} is prime AND is 2ᵖ − 1 → Mersenne prime`;
      case "prime-exponent-composite":
        return `${classification.value} = ${formatFactors(classification.factors)} → Mersenne number, not prime`;
      default:
        return `p = ${classification.exponent} is composite → ${classification.value} = ${formatFactors(classification.factors)}, never prime`;
    }
  }

  private renderPanel(): void {
    const { exponent } = this.params;
    const classification = classifyMersenne(exponent);
    const { value, primeExponent, mersennePrime, factors } = classification;
    const steps = lucasLehmerSteps(exponent);

    this.setInfo(`
      <h2>Mersenne Primes</h2>
      <p>Two different questions get mixed up here, so separate them first.
      <b>"Is it prime?"</b> is about <i>divisors</i>. <b>"Is it a Mersenne number?"</b> is about
      <i>shape</i> — is it exactly one less than a power of two? A <b>Mersenne prime</b> is a number
      that answers yes to both. Almost every prime fails the shape test, and most numbers with the
      right shape fail the divisor test, which is why only 52 Mersenne primes are known.</p>

      <h3>1. Three things with confusingly similar names</h3>
      <ul>
        <li><b>Ordinary prime</b> — a whole number above 1 whose only positive divisors are 1 and
        itself: <code>2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, …</code></li>
        <li><b>Mersenne number</b> — anything of the form <code>Mₚ = 2ᵖ − 1</code>, prime or not:
        <code>1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, …</code></li>
        <li><b>Mersenne prime</b> — a Mersenne number that also happens to be prime:
        <code>3, 7, 31, 127, 8191, …</code></li>
      </ul>
      <p>The Mersenne primes are a thin slice of the primes <i>and</i> a thin slice of the Mersenne
      numbers. Every Mersenne prime is a prime; hardly any prime is a Mersenne prime.</p>
      ${derivationButton("mersenne-vs-prime")}
      <div class="readout">
        <div><span>Ordinary prime, wrong shape</span><b>11 is prime, but 11 is not 2ᵖ − 1 (2³−1 = 7, 2⁴−1 = 15)</b></div>
        <div><span>Right shape, not prime</span><b>2⁴ − 1 = 15 = 3 × 5</b></div>
        <div><span>Right shape, prime exponent, still not prime</span><b>2¹¹ − 1 = 2047 = 23 × 89</b></div>
        <div><span>Both at once</span><b>2⁵ − 1 = 31 is prime → Mersenne prime</b></div>
      </div>

      <h3>2. Classify the number on stage</h3>
      <p>The stage draws <code>M${subscript(exponent)}</code> as a row of binary ones and colours it
      by classification. The chips below run the same three checks in order: is the exponent prime,
      is the Mersenne number prime, and what does that make it?</p>
      <div class="readout">
        <div><span>p prime?</span><b>${exponent} — ${primeExponent ? "yes" : "no"}</b></div>
        <div><span>Mₚ = 2ᵖ − 1</span><b>${value}</b></div>
        <div><span>Mₚ prime?</span><b>${mersennePrime ? "yes" : "no"}</b></div>
        <div><span>Factorisation</span><b>${mersennePrime ? `${value} (prime)` : formatFactors(factors)}</b></div>
        <div><span>Classification</span><b>${classificationLabel(classification.kind)}</b></div>
      </div>

      <h3>3. Why the binary row looks like that</h3>
      <p>In binary a power of two is a one followed by zeroes, and subtracting one turns every zero
      into a one: <code>2⁵ = 100000₂</code>, so <code>M₅ = 31 = 11111₂</code>. That is also why these
      numbers matter to computers — <code>Mₚ</code> is the largest value that fits in
      <code>p</code> bits.</p>
      ${derivationButton("mersenne-binary")}
      <div class="readout">
        <div><span>Power of two</span><b>2${superscript(exponent)} = ${(1n << BigInt(exponent)).toString()}</b></div>
        <div><span>Subtract one</span><b>${value}</b></div>
        <div><span>Binary form</span><b>${"1".repeat(exponent)}₂</b></div>
      </div>

      <h3>4. First filter: the exponent must be prime</h3>
      <p>If <code>p = rs</code> with both parts above 1, then
      <code>2ʳˢ − 1 = (2ʳ − 1)(2ʳ⁽ˢ⁻¹⁾ + … + 1)</code>, so the candidate is factored before you test
      anything. That removes every composite exponent at once — but a prime exponent is only a
      filter, never a proof: <code>p = 11</code> is prime and <code>2047 = 23 × 89</code>.</p>
      ${derivationButton("mersenne-composite-exponent")}

      <h3>5. Second filter: the Lucas-Lehmer test</h3>
      <p>For an odd prime exponent, set <code>s₀ = 4</code> and repeat
      <code>sₖ₊₁ = sₖ² − 2 (mod Mₚ)</code> exactly <code>p − 2</code> times.
      <code>Mₚ</code> is prime precisely when the last value is 0. <code>M₂ = 3</code> is the special
      case, settled by inspection.</p>
      ${this.lucasLehmerTable(steps, exponent, mersennePrime)}

      <h3>6. Payoff: perfect numbers</h3>
      <p>A <b>perfect number</b> equals the sum of its proper divisors: <code>6 = 1 + 2 + 3</code>.
      Euclid proved that a Mersenne prime <code>Mₚ</code> always builds one, <code>2ᵖ⁻¹Mₚ</code>, and
      Euler proved every even perfect number arises this way. Each new Mersenne prime therefore
      hands over a new perfect number for free.</p>
      ${derivationButton("mersenne-perfect")}
      <div class="readout">
        <div><span>M₂ = 3</span><b>2 × 3 = 6 = 1 + 2 + 3</b></div>
        <div><span>M₃ = 7</span><b>4 × 7 = 28 = 1 + 2 + 4 + 7 + 14</b></div>
        <div><span>M₅ = 31</span><b>16 × 31 = 496</b></div>
      </div>

      <h3>History, research and use</h3>
      <p>Euclid described the perfect-number construction around 300 BCE. Marin Mersenne published a
      famous but partly wrong list of candidate exponents in 1644, which is why the family carries
      his name. Lucas devised the specialised test in the 19th century and Lehmer made it practical
      in the 20th.</p>
      <p><b>Computational mathematics:</b> GIMPS distributes Lucas-Lehmer tests among volunteers.
      Only <b>52</b> Mersenne primes are known; the largest is <code>2¹³⁶²⁷⁹⁸⁴¹ − 1</code>, with
      41,024,320 digits. The test's speed makes them the standard benchmark for high-precision
      arithmetic, and the perfect-number link keeps them central to number theory.</p>

      <p class="example"><b>Try it:</b> set <code>p = 4</code> (grey: composite exponent, 15 = 3 × 5),
      then <code>p = 5</code> (green: 31 is a genuine Mersenne prime), then <code>p = 11</code>
      (amber: prime exponent, but 2047 = 23 × 89). Compare each with the blue primes on the top
      strip — 5, 11, 13 and 17 are perfectly good primes that simply do not have the shape.</p>
    `);
  }

  private lucasLehmerTable(steps: readonly bigint[], exponent: number, mersennePrime: boolean): string {
    if (steps.length === 0) {
      return `<p class="example">The Lucas-Lehmer test needs an odd prime exponent, so it does not apply to
      <code>p = ${exponent}</code>. ${exponent === 2
        ? "M₂ = 3 is prime by inspection."
        : "A composite exponent is already ruled out by step 4."}</p>`;
    }
    const rows = steps
      .map((residue, index) => `<div><span>s${subscript(index)}</span><b>${residue}</b></div>`)
      .join("");
    return `
      <div class="readout">${rows}</div>
      <p>${steps.length - 1} rounds ran for <code>p = ${exponent}</code>; the final residue is
      <code>${steps[steps.length - 1]}</code>, so <code>M${subscript(exponent)}</code> is
      <b>${mersennePrime ? "prime" : "composite"}</b>.</p>`;
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

function formatFactors(factors: readonly bigint[]): string {
  if (factors.length === 0) return "too large to factorise here";
  if (factors.length === 1) return `${factors[0]} (prime)`;
  return factors.join(" × ");
}

function classificationLabel(kind: ReturnType<typeof classifyMersenne>["kind"]): string {
  switch (kind) {
    case "mersenne-prime":
      return "Mersenne prime — prime, and one less than a power of two";
    case "prime-exponent-composite":
      return "Mersenne number only — right shape, but composite";
    default:
      return "Mersenne number with a composite exponent — composite by construction";
  }
}
