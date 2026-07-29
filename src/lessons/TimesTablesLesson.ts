import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { textSprite } from "./helpers";
import { TIMES_TABLES_DERIVATIONS } from "./formulaDerivations/timesTables";

registerFormulaDerivations("times-tables", TIMES_TABLES_DERIVATIONS);

const PRACTICE = [
  { a: 6, b: 7, hint: "Split 7 into 5 + 2." },
  { a: 8, b: 9, hint: "Use 8 × (10 − 1)." },
  { a: 7, b: 12, hint: "Use 7 × (10 + 2)." },
  { a: 9, b: 6, hint: "Use ten minus one group: 9 × 6 = 10 × 6 − 6." },
  { a: 11, b: 8, hint: "Ten groups plus one group." },
  { a: 4, b: 13, hint: "Double 13 twice." },
] as const;

const TWELVE_VISUAL = `
  <figure class="times-twelve-visual">
    <svg viewBox="0 0 360 150" role="img" aria-label="A dozen shown as twelve counters arranged in three rows of four, with equivalent groupings of two rows of six and four rows of three">
      <text x="16" y="23" fill="#d2a8ff" font-size="16" font-weight="700">One dozen: 12 counters</text>
      ${Array.from({ length: 12 }, (_, index) => {
        const x = 38 + (index % 4) * 46;
        const y = 48 + Math.floor(index / 4) * 30;
        return `<circle cx="${x}" cy="${y}" r="10" fill="${index < 6 ? "#58a6ff" : "#7ee787"}"/>`;
      }).join("")}
      <path d="M15 80h210M15 111h210M84 32v96M176 32v96" fill="none" stroke="#8b949e" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="246" y="57" fill="#79c0ff" font-size="15">3 × 4</text>
      <text x="246" y="82" fill="#7ee787" font-size="15">2 × 6</text>
      <text x="246" y="107" fill="#ffd166" font-size="15">4 × 3</text>
      <text x="246" y="132" fill="#c9d1d9" font-size="14">12 = 2² × 3</text>
    </svg>
    <figcaption>A dozen splits evenly into 2, 3, 4, and 6 equal groups.</figcaption>
  </figure>`;

export class TimesTablesLesson implements Lesson {
  readonly id = "times-tables";
  readonly title = "Times Tables & Multiplication Strategies";
  readonly blurb = "Patterns, shortcuts, and guided practice";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["arithmetic-operations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private table = 7;
  private practiceIndex = 0;
  private answer = "";
  private feedback = "";

  private readonly onInfoClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-times-action]");
    if (!button) return;
    const action = button.dataset.timesAction ?? "";
    if (action.startsWith("table:")) {
      this.table = Number(action.slice(6));
      this.render();
    } else if (action === "check") {
      const current = PRACTICE[this.practiceIndex];
      const correct = current.a * current.b;
      this.feedback = Number(this.answer) === correct
        ? `Correct — ${current.a} × ${current.b} = ${correct}.`
        : `Not yet. ${current.hint}`;
      this.render();
    } else if (action === "next") {
      this.practiceIndex = (this.practiceIndex + 1) % PRACTICE.length;
      this.answer = "";
      this.feedback = "";
      this.render();
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.id !== "times-answer") return;
    this.answer = input.value;
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 11), new THREE.Vector3(0, 0, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    document.getElementById("info")?.addEventListener("input", this.onInfoChange);
    this.render();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    document.getElementById("info")?.removeEventListener("input", this.onInfoChange);
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private render(): void {
    this.drawTable();
    const rows = Array.from({ length: 12 }, (_, index) => {
      const n = index + 1;
      return `<div><span>${this.table} × ${n}</span><b>${this.table * n}</b></div>`;
    }).join("");
    const tableButtons = Array.from({ length: 11 }, (_, index) => index + 2)
      .map((n) => `<button class="course-btn${n === this.table ? "" : " ghost"}" data-times-action="table:${n}">×${n}</button>`)
      .join("");
    const current = PRACTICE[this.practiceIndex];

    this.setInfo(`
      <h2>Times Tables &amp; Multiplication Strategies</h2>
      <p>Fluency is not only memorising facts. Build a small set of facts you trust, then use
      patterns to derive the rest quickly and check your answer.</p>

      <div class="course">
        <h3>Why do traditional tables go to ×12?</h3>
        <p>They do not stop there: the same strategies work for every multiplier. But ×12 is a
        useful traditional endpoint because a <b>dozen</b> splits equally into 2, 3, 4, and 6.
        That made it practical for sharing and measuring long before decimal calculation became
        standard.</p>
        ${TWELVE_VISUAL}
        <div class="times-twelve-uses" aria-label="Everyday uses of twelve">
          <div><b>12</b><span>months in a year</span></div>
          <div><b>12</b><span>hours on a clock face</span></div>
          <div><b>12</b><span>items in a dozen</span></div>
        </div>
      </div>

      <div class="course">
        <h3>Choose a table</h3>
        <div class="course-chapters">${tableButtons}</div>
        <p class="course-hint">The stage turns the selected table into 12 visible equal groups:
        one column for each fact from ×1 to ×12.</p>
        <div class="readout times-table-readout">${rows}</div>
      </div>

      <div class="course">
        <h3>High-value facts and shortcuts</h3>
        <div class="deriv-work">
          <p><b>×2, ×4, ×8:</b> double once, twice, or three times. Example:
          <code>13 × 4 = 26 × 2 = 52</code>.</p>
          <p><b>×5:</b> multiply by ten, then halve. <code>38 × 5 = 380 ÷ 2 = 190</code>.</p>
          <p><b>×9:</b> multiply by ten, then subtract one group.
          <code>7 × 9 = 70 − 7 = 63</code>.</p>
          <p><b>×11:</b> multiply by ten, then add one group.
          <code>8 × 11 = 80 + 8 = 88</code>.</p>
          <p><b>Swap the order:</b> <code>3 × 12 = 12 × 3</code>. Start with the table you know best.</p>
          <p><b>Split difficult facts:</b> <code>6 × 7 = 6 × (5 + 2) = 30 + 12 = 42</code>.</p>
        </div>
        ${derivationButton("times-double")}
        ${derivationButton("times-five")}
        ${derivationButton("times-nine")}
        ${derivationButton("times-split")}
      </div>

      <details class="course" open>
        <summary>Tips to get faster without guessing</summary>
        <ul>
          <li><b>Learn the anchors first:</b> ×0, ×1, ×2, ×5 and ×10 make most other facts easier.</li>
          <li><b>Use the turn-around:</b> there is no need to memorise both <code>4 × 7</code> and <code>7 × 4</code>.</li>
          <li><b>Say the pattern aloud:</b> the ×9 answers rise by 9; their digit sums are 9 for 9 through 81.</li>
          <li><b>Estimate before calculating:</b> <code>7 × 8</code> should be near <code>7 × 10 = 70</code>, but smaller.</li>
          <li><b>Practise the facts you miss:</b> a short daily set of difficult facts beats rereading a whole table.</li>
          <li><b>Check by inverse:</b> if <code>6 × 7 = 42</code>, then <code>42 ÷ 6 = 7</code>.</li>
        </ul>
      </details>

      <div class="course">
        <h3>Quick practice</h3>
        <p><b>${current.a} × ${current.b} = ?</b> &nbsp; <span class="course-hint">${current.hint}</span></p>
        <label class="times-answer">Answer <input id="times-answer" type="number" inputmode="numeric" value="${this.answer}" /></label>
        <button class="course-btn" data-times-action="check">Check</button>
        <button class="course-btn ghost" data-times-action="next">Next fact</button>
        ${this.feedback ? `<p class="formula-note"><b>${this.feedback}</b></p>` : ""}
      </div>`);
  }

  private drawTable(): void {
    this.disposeGroup();
    const columns = 12;
    const gap = 0.43;
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.16);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const counters = new THREE.InstancedMesh(geometry, material, columns * this.table);
    const transform = new THREE.Object3D();
    const colors = [new THREE.Color(0x58a6ff), new THREE.Color(0x7ee787), new THREE.Color(0xffd166)];

    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < this.table; row++) {
        const index = column * this.table + row;
        transform.position.set(
          (column - (columns - 1) / 2) * gap,
          ((this.table - 1) / 2 - row) * gap,
          0,
        );
        transform.updateMatrix();
        counters.setMatrixAt(index, transform.matrix);
        counters.setColorAt(index, colors[column < 5 ? 0 : column < 10 ? 1 : 2]);
      }
    }
    counters.instanceMatrix.needsUpdate = true;
    if (counters.instanceColor) counters.instanceColor.needsUpdate = true;
    this.group.add(counters);

    const title = textSprite(`12 groups of ${this.table} = ${this.table * 12}`, 0xffffff, 0.38);
    title.position.set(0, -(this.table + 1) * gap / 2, 0);
    this.group.add(title);
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
