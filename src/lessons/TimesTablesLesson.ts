import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { formatPrimeFactorisation, isPrime } from "../math/primes";
import { textSprite } from "./helpers";
import { TIMES_TABLES_DERIVATIONS } from "./formulaDerivations/timesTables";
import {
  MULTIPLICATION_MAP_LIMIT,
  multiplicationMapTarget,
} from "../math/multiplicationMap";

registerFormulaDerivations("times-tables", TIMES_TABLES_DERIVATIONS);

const PRACTICE = [
  { a: 6, b: 7, hint: "Split 7 into 5 + 2." },
  { a: 8, b: 9, hint: "Use 8 × (10 − 1)." },
  { a: 7, b: 12, hint: "Use 7 × (10 + 2)." },
  { a: 9, b: 6, hint: "Use ten minus one group: 9 × 6 = 10 × 6 − 6." },
  { a: 11, b: 8, hint: "Ten groups plus one group." },
  { a: 4, b: 13, hint: "Double 13 twice." },
] as const;

type MapMode = { kind: "none" } | { kind: "squares" } | { kind: "target"; value: number };

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

function timesArrayVisual(table: number, factor: number): string {
  const total = table * factor;
  const cell = Math.min(26, Math.floor(240 / Math.max(table, factor)));
  const width = factor * cell;
  const height = table * cell;
  const left = (320 - width) / 2;
  const top = 42;
  const groups = Array.from({ length: factor }, (_, column) => {
    const x = left + column * cell;
    const dots = Array.from({ length: table }, (_, row) => {
      const y = top + row * cell;
      return `<circle class="times-array-dot ${column === factor - 1 ? "newest" : ""}" cx="${x + cell / 2}" cy="${y + cell / 2}" r="${Math.max(4, cell * 0.26)}"/>`;
    }).join("");
    return `<g><rect class="times-array-group ${column === factor - 1 ? "newest" : ""}" x="${x + 1}" y="${top + 1}" width="${cell - 2}" height="${height - 2}" rx="4"/>${dots}</g>`;
  }).join("");

  return `
    <figure class="times-array-visual">
      <svg viewBox="0 0 320 ${top + height + 24}" role="img" aria-label="Array of ${factor} columns of ${table} counters, ${total} in total">
        <text class="times-array-title" x="160" y="20" text-anchor="middle">${factor} equal groups of ${table}</text>
        ${groups}
        <text class="times-array-note" x="160" y="${top + height + 16}" text-anchor="middle">each outlined column is one group</text>
      </svg>
      <figcaption><b>${table} × ${factor} = ${total}</b> — ${factor} groups of ${table} counters.</figcaption>
    </figure>`;
}

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
  private factor = 6;
  private practiceIndex = 0;
  private answer = "";
  private feedback = "";
  private tipsOpen = true;
  private factsOpen = false;
  private mapMode: MapMode = { kind: "target", value: 42 };
  private mapInput = "42";
  private mapError = "";

  private readonly onInfoClick = (event: Event): void => {
    const actionElement = (event.target as HTMLElement).closest<HTMLElement>("[data-times-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.timesAction ?? "";
    if (action === "map-show") {
      const target = Number(this.mapInput);
      if (!Number.isInteger(target) || target < 1 || target > MULTIPLICATION_MAP_LIMIT ** 2) {
        this.mapError = `Enter a whole number from 1 to ${MULTIPLICATION_MAP_LIMIT ** 2}.`;
      } else {
        this.mapMode = { kind: "target", value: target };
        this.mapError = "";
      }
      this.paintMap();
    } else if (action === "map-squares") {
      this.mapMode = { kind: "squares" };
      this.mapError = "";
      this.paintMap();
    } else if (action === "map-clear") {
      this.mapMode = { kind: "none" };
      this.mapError = "";
      this.paintMap();
    } else if (action.startsWith("map-target:")) {
      const target = Number(action.slice(11));
      if (!Number.isInteger(target) || target < 1 || target > MULTIPLICATION_MAP_LIMIT ** 2) return;
      this.mapMode = { kind: "target", value: target };
      this.mapInput = String(target);
      this.mapError = "";
      this.paintMap();
    } else if (action.startsWith("map-cell:")) {
      const [a, b] = action.slice(9).split(":").map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1
        || a > MULTIPLICATION_MAP_LIMIT || b > MULTIPLICATION_MAP_LIMIT) return;
      this.table = a === 1 && b !== 1 ? b : a;
      this.factor = a === 1 && b !== 1 ? a : b;
      this.mapMode = { kind: "target", value: a * b };
      this.mapInput = String(a * b);
      this.mapError = "";
      this.render('[data-times-action="map-show"]');
    } else if (action.startsWith("table:")) {
      const table = Number(action.slice(6));
      if (!Number.isInteger(table) || table < 2 || table > 12) return;
      this.table = table;
      this.render(`[data-times-action="table:${table}"]`);
    } else if (action.startsWith("fact:")) {
      const factor = Number(action.slice(5));
      if (!Number.isInteger(factor) || factor < 1 || factor > 12) return;
      this.factor = factor;
      this.render(`[data-times-action="fact:${factor}"]`);
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
    if (input.id === "times-answer") this.answer = input.value;
    else if (input.id === "times-map-target") this.mapInput = input.value;
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

  private render(focusSelector?: string): void {
    this.drawTable();
    const factCards = Array.from({ length: 12 }, (_, index) => {
      const n = index + 1;
      const total = this.table * n;
      const active = n === this.factor;
      return `<button type="button" class="times-fact-card${active ? " active" : ""}" data-times-action="fact:${n}" aria-pressed="${active}" aria-label="${this.table} times ${n} equals ${total}; ${n} groups of ${this.table}">
        <b>${this.table} × ${n} = ${total}</b><small>${n} group${n === 1 ? "" : "s"} of ${this.table}</small>
      </button>`;
    }).join("");
    const tableButtons = Array.from({ length: 11 }, (_, index) => index + 2)
      .map((n) => `<button type="button" class="course-btn${n === this.table ? "" : " ghost"}" data-times-action="table:${n}" aria-pressed="${n === this.table}">×${n}</button>`)
      .join("");
    const current = PRACTICE[this.practiceIndex];
    const selectedTotal = this.table * this.factor;
    const lastDigits = Array.from({ length: 10 }, (_, index) => (this.table * (index + 1)) % 10).join(", ");

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
        <div class="course-chapters times-table-picker">${tableButtons}</div>
        <p class="course-hint">Choose a fact below to connect the equation to an array. In
        <code>${this.table} × ${this.factor}</code>, there are ${this.factor} equal groups of ${this.table}.</p>
        <div class="times-fact-grid" aria-label="${this.table} times table">${factCards}</div>
        ${timesArrayVisual(this.table, this.factor)}
        <p class="times-selected-fact"><b>Selected fact:</b> ${this.table} × ${this.factor} = ${selectedTotal}.
        The highlighted columns in the stage are the ${this.factor} groups being counted.</p>
      </div>

      <div class="course">
        <h3>Patterns in the ×${this.table} table</h3>
        <div class="times-patterns">
          <div><b>Add one more group</b><span>${this.table} × ${this.factor} = ${selectedTotal}; the next fact adds ${this.table}.</span></div>
          <div><b>Ones-digit cycle</b><span>${lastDigits} — the last digit repeats every ten groups.</span></div>
          <div><b>Square anchor</b><span>${this.table} × ${this.table} = ${this.table ** 2}; squares sit on the diagonal of a multiplication grid.</span></div>
        </div>
      </div>

      ${this.mapHtml()}

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

      <details id="times-tips" class="course"${this.tipsOpen ? " open" : ""}>
        <summary>Tips to get faster without guessing</summary>
        <ul>
          <li><b>Learn the anchors first:</b> ×0, ×1, ×2, ×5 and ×10 make most other facts easier.</li>
          <li><b>Use the turn-around:</b> there is no need to memorise both <code>4 × 7</code> and <code>7 × 4</code>.</li>
          <li><b>Say the pattern aloud:</b> the ×9 answers rise by 9; their digit sums are 9 for 9 through 81.</li>
          <li><b>Adjust from a nearby fact:</b> <code>7 × 8 = 7 × (7 + 1) = 49 + 7</code>.</li>
          <li><b>Double and halve together:</b> <code>4 × 18 = 2 × 36 = 72</code>. The total stays the same.</li>
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
      </div>

      <details id="times-interesting-facts" class="course"${this.factsOpen ? " open" : ""}>
        <summary>Interesting facts about multiplication tables</summary>
        <ul>
          <li><b>Turn-arounds cut the memory load:</b> from 2 × 2 to 12 × 12, there are 66 facts once
          <code>3 × 7</code> and <code>7 × 3</code> count as the same product.</li>
          <li><b>Twelve is unusually shareable:</b> it divides evenly by 2, 3, 4, and 6, which helps explain
          why dozens, clocks, and months still feature it.</li>
          <li><b>Tables are old technology:</b> Babylonian clay tablets included numerical tables and reciprocal
          tables to support calculation and division.</li>
        </ul>
      </details>`);

    const tips = document.getElementById("times-tips") as HTMLDetailsElement | null;
    tips?.addEventListener("toggle", () => {
      this.tipsOpen = tips.open;
    });
    const interestingFacts = document.getElementById("times-interesting-facts") as HTMLDetailsElement | null;
    interestingFacts?.addEventListener("toggle", () => {
      this.factsOpen = interestingFacts.open;
    });
    if (focusSelector) this.focusAfterRender(focusSelector);
  }

  private mapHtml(): string {
    const headers = Array.from({ length: MULTIPLICATION_MAP_LIMIT }, (_, index) => `<th scope="col">${index + 1}</th>`).join("");
    const rows = Array.from({ length: MULTIPLICATION_MAP_LIMIT }, (_, rowIndex) => {
      const a = rowIndex + 1;
      const cells = Array.from({ length: MULTIPLICATION_MAP_LIMIT }, (_, columnIndex) => {
        const b = columnIndex + 1;
        return `<td data-map-cell data-times-action="map-cell:${a}:${b}" data-a="${a}" data-b="${b}" data-product="${a * b}" data-highlight="${this.mapCellHighlight(a, b)}" data-selected="${a === this.table && b === this.factor}" aria-label="${a} times ${b} equals ${a * b}">${a * b}</td>`;
      }).join("");
      return `<tr><th scope="row">${a}</th>${cells}</tr>`;
    }).join("");
    const presets = [11, 12, 18, 24, 36, 144]
      .map((target) => `<button type="button" class="course-btn ghost" data-times-action="map-target:${target}">${target}</button>`)
      .join("");

    return `
      <div class="course times-map-course">
        <h3>Multiplication map</h3>
        <p>Choose a product to colour every place it appears. The map makes factor pairs and
        turn-arounds visible: <code>3 × 6</code> and <code>6 × 3</code> mirror each other.</p>
        <div class="times-map-controls">
          <label>Colour every cell equal to
            <input id="times-map-target" type="number" inputmode="numeric" min="1" max="${MULTIPLICATION_MAP_LIMIT ** 2}" value="${this.mapInput}" />
          </label>
          <button type="button" class="course-btn" data-times-action="map-show">Show</button>
          <button type="button" class="course-btn ghost" data-times-action="map-squares" aria-pressed="${this.mapMode.kind === "squares"}">Highlight squares</button>
          <button type="button" class="course-btn ghost" data-times-action="map-clear">Clear</button>
        </div>
        <div class="times-map-presets" aria-label="Product examples"><span>Try:</span>${presets}</div>
        <table class="times-map" aria-describedby="times-map-summary">
          <caption class="visually-hidden">Products from one to twelve. Row and column headers are factors; each cell is their product.</caption>
          <thead><tr><th scope="col">×</th>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div id="times-map-summary" class="times-map-summary" role="status" aria-live="polite">${this.mapSummaryHtml()}</div>
      </div>`;
  }

  private mapCellHighlight(a: number, b: number): "none" | "hit" | "square" {
    if (this.mapMode.kind === "squares") return a === b ? "square" : "none";
    if (this.mapMode.kind === "target" && a * b === this.mapMode.value) return "hit";
    return "none";
  }

  private mapSummaryHtml(): string {
    if (this.mapError) return `<b>${this.mapError}</b>`;
    if (this.mapMode.kind === "none") return "No product is highlighted. Choose a number or the square-number diagonal.";
    if (this.mapMode.kind === "squares") {
      return `<b>Square numbers:</b> 1, 4, 9, …, 144 lie on the diagonal because each is <code>n × n</code>.
        The gaps are odd numbers: <code>(n + 1)² − n² = 2n + 1</code>.`;
    }

    const map = multiplicationMapTarget(this.mapMode.value);
    if (!map.reachable) {
      const reason = isPrime(map.target)
        ? `${map.target} is prime: its only factor pair is 1 × ${map.target}, which extends beyond this 1–12 map.`
        : `${map.target} has no factor pair with both factors from 1 to 12.`;
      return `<b>${map.target} does not appear in this map.</b> ${reason}`;
    }

    const pairs = map.pairs.map(({ a, b }) =>
      `<button type="button" class="times-map-pair" data-times-action="map-cell:${a}:${b}">${a} × ${b}</button>`,
    ).join(" ");
    const squareNote = map.isSquare
      ? `${map.root} × ${map.root} sits once on the diagonal.`
      : "None sits on the diagonal, so every pair has a turn-around mirror.";
    return `<b>${map.target} = ${formatPrimeFactorisation(map.target)}</b> · factor pairs: ${pairs}.
      ${squareNote}`;
  }

  private paintMap(): void {
    const map = document.getElementById("times-map-target") as HTMLInputElement | null;
    if (!map) return;
    map.value = this.mapInput;
    document.querySelectorAll<HTMLTableCellElement>("#info td[data-map-cell]").forEach((cell) => {
      const a = Number(cell.dataset.a);
      const b = Number(cell.dataset.b);
      cell.dataset.highlight = this.mapCellHighlight(a, b);
      cell.dataset.selected = String(a === this.table && b === this.factor);
    });
    const summary = document.getElementById("times-map-summary");
    if (summary) summary.innerHTML = this.mapSummaryHtml();
    document.querySelector<HTMLButtonElement>('[data-times-action="map-squares"]')
      ?.setAttribute("aria-pressed", String(this.mapMode.kind === "squares"));
  }

  private drawTable(): void {
    this.disposeGroup();
    const columns = 12;
    const gap = 0.43;
    const counterGroups = [
      new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.16),
        new THREE.MeshBasicMaterial({ color: 0x58a6ff }),
        columns * this.table,
      ),
      new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.16),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
        columns * this.table,
      ),
      new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.16),
        new THREE.MeshBasicMaterial({ color: 0x334155 }),
        columns * this.table,
      ),
    ];
    const counterCounts = [0, 0, 0];
    const transform = new THREE.Object3D();

    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < this.table; row++) {
        const groupIndex = column < this.factor - 1 ? 0 : column === this.factor - 1 ? 1 : 2;
        const index = counterCounts[groupIndex]++;
        transform.position.set(
          (column - (columns - 1) / 2) * gap,
          ((this.table - 1) / 2 - row) * gap,
          0,
        );
        transform.updateMatrix();
        counterGroups[groupIndex].setMatrixAt(index, transform.matrix);
      }
    }
    counterGroups.forEach((counters, index) => {
      counters.count = counterCounts[index];
      counters.instanceMatrix.needsUpdate = true;
      this.group.add(counters);
    });

    const title = textSprite(`${this.table} × ${this.factor} = ${this.table * this.factor}`, 0xffffff, 0.38);
    title.position.set(0, -(this.table + 1) * gap / 2, 0);
    this.group.add(title);
    const note = textSprite(`${this.factor} highlighted groups of ${this.table}`, 0x8b949e, 0.22);
    note.position.set(0, -(this.table + 1.9) * gap / 2, 0);
    this.group.add(note);
  }

  private focusAfterRender(selector: string): void {
    queueMicrotask(() => document.querySelector<HTMLElement>(`#info ${selector}`)?.focus());
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) object.dispose();
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
