import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  CATEGORIES,
  CONVERSION_RULE,
  JOURNEY_PRESETS,
  buildFactorTable,
  convert,
  fmt,
  formatDuration,
  journeyTimeSeconds,
  searchFactors,
  toBase,
  unitById,
  categoryById,
  type Category,
  type FactorRow,
  type Unit,
} from "./unitConversions";
import { segment, textSprite } from "./helpers";
import { UNIT_CONVERSION_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("unit-conversions", UNIT_CONVERSION_DERIVATIONS);

/**
 * Lesson — Unit Conversions.
 *
 * A self-contained conversion lesson: it teaches the single
 * underlying rule — multiply by a unit-fraction equal to 1 so unwanted units
 * cancel (dimensional analysis) — and gives a live calculator plus a centre-stage
 * scale visual spanning SI prefixes and everyday unit categories.
 *
 * The journey planner applies the same rule to a compound quantity: reduce a distance and
 * a speed to base units, divide, and the seconds fall out. It is the first place in the
 * course where units are combined rather than merely swapped.
 */
export class UnitConversionsLesson implements Lesson {
  readonly id = "unit-conversions";
  readonly title = "3 · Unit Conversions";
  readonly blurb = "One rule + a live calculator";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["multiplication-division"] as const;

  private setInfo!: (html: string) => void;

  private cat: Category = CATEGORIES.find((c) => c.id === "length") ?? CATEGORIES[0];
  private from: Unit = this.cat.units.find((u) => u.id === "m") ?? this.cat.units[1]; // metre
  private to: Unit = this.cat.units.find((u) => u.id === "km") ?? this.cat.units[0]; // kilometre
  private value = 1;
  private group = new THREE.Group();
  private preview = new THREE.Group();

  /**
   * Which panel owns the centre stage. Both calculators want to draw there, so the one the
   * learner last touched wins instead of the two fighting over the viewport.
   */
  private stage: "convert" | "journey" = "convert";
  private journey = {
    distance: 10,
    distanceUnit: unitById("length", "mi"),
    speed: 30,
    speedUnit: unitById("speed", "mph"),
  };
  private traveller?: THREE.Mesh;
  private journeyLane = { startX: -4, endX: 4 };
  private stopTick?: () => void;

  /** Built once — the factors never change while the lesson is open. */
  private readonly factorRows: FactorRow[] = buildFactorTable();
  private lookupQuery = "";
  private lookupCategory = "all";
  private lookupExactOnly = false;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.preview);
    ctx.viewport.setHelpers(true);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.8, 11),
      new THREE.Vector3(0, 0, 0),
    );
    // One shared loop animates the traveller; it idles whenever the converter owns the stage.
    this.stopTick = ctx.viewport.onTick((_dt, elapsed) => this.animateTraveller(elapsed));
    this.renderPanel();
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.traveller = undefined;
    this.clearPreview();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.preview = new THREE.Group();
  }

  private renderPanel(): void {
    const catOptions = CATEGORIES.map(
      (c) => `<option value="${c.id}"${c === this.cat ? " selected" : ""}>${c.label}</option>`,
    ).join("");

    this.setInfo(`
      <h2>Unit Conversions</h2>
      <p>Swapping units feels like a pile of magic numbers — but it's really one
      idea applied over and over. Learn the rule once, then let the calculator do
      the arithmetic.</p>

      ${CONVERSION_RULE}

      <div class="course" id="conv-calc">
        <h3>Converter</h3>
        <label class="conv-row">
          <span>Category</span>
          <select id="conv-cat">${catOptions}</select>
        </label>
        <div class="conv-equation" aria-label="Unit conversion equation">
          <label class="conv-term">
            <span>Start</span>
            <input id="conv-value" type="number" step="any" value="${this.value}" />
            <select id="conv-from"></select>
          </label>
          <span class="conv-op">×</span>
          <div class="conv-factor-live" aria-label="Conversion factor">
            <output id="conv-factor-top">—</output>
            <output id="conv-factor-bottom">—</output>
          </div>
          <span class="conv-op">=</span>
          <label class="conv-term">
            <span>Result</span>
            <output id="conv-result" class="conv-result">—</output>
            <select id="conv-to"></select>
          </label>
          <button id="conv-swap" class="course-btn ghost" title="Swap units">⇅ Swap</button>
        </div>
        <div class="readout" id="conv-working">—</div>
      </div>

      ${this.journeyHtml()}

      ${this.lookupHtml()}`);

    const root = document.getElementById("info");
    if (!root) return;

    root.querySelector<HTMLSelectElement>("#conv-cat")
      ?.addEventListener("change", (e) => this.onCategory((e.target as HTMLSelectElement).value));
    root.querySelector<HTMLInputElement>("#conv-value")
      ?.addEventListener("input", (e) => {
        this.value = parseFloat((e.target as HTMLInputElement).value);
        this.stage = "convert";
        this.compute();
      });
    root.querySelector<HTMLSelectElement>("#conv-from")
      ?.addEventListener("change", (e) => {
        this.from = this.unit((e.target as HTMLSelectElement).value);
        this.stage = "convert";
        this.compute();
      });
    root.querySelector<HTMLSelectElement>("#conv-to")
      ?.addEventListener("change", (e) => {
        this.to = this.unit((e.target as HTMLSelectElement).value);
        this.stage = "convert";
        this.compute();
      });
    root.querySelector<HTMLButtonElement>("#conv-swap")
      ?.addEventListener("click", () => this.swap());

    this.bindJourneyControls(root);
    this.bindLookupControls(root);
    this.fillUnitSelects();
    this.compute();
    this.computeJourney();
    this.renderLookupRows();
  }

  /**
   * A searchable sheet of the conversion factors worth knowing by heart.
   *
   * Every number here is computed from the same `CATEGORIES` table the converter uses, so the
   * reference can never drift from the calculator. Rows are clickable: tapping one loads that
   * pair into the converter above, which turns a passive lookup into a live experiment.
   */
  private lookupHtml(): string {
    const categories = [...new Set(this.factorRows.map((r) => r.categoryId))].map((id) => {
      const row = this.factorRows.find((r) => r.categoryId === id)!;
      return `<option value="${id}">${row.categoryLabel}</option>`;
    }).join("");

    return `
      <div class="course" id="conv-lookup">
        <h3>Lookup — conversion factors worth knowing</h3>
        <p>Fluency is mostly recall. These are the factors that come up again and again;
        learn them and most everyday conversions become mental arithmetic. Every value below
        is calculated by the same engine as the converter, so it is always in step with it.</p>

        <div class="lookup-controls">
          <label class="lookup-search">
            <span class="visually-hidden">Search conversion factors</span>
            <input id="lookup-search" type="search" placeholder="Search — try &quot;mile&quot;, &quot;kg&quot; or &quot;pressure&quot;" autocomplete="off" />
          </label>
          <label class="lookup-filter">
            <span>Category</span>
            <select id="lookup-category">
              <option value="all">All</option>
              ${categories}
            </select>
          </label>
          <label class="lookup-toggle">
            <input id="lookup-exact-only" type="checkbox" />
            <span>Exact definitions only</span>
          </label>
        </div>

        <p class="course-hint">
          <b class="factor-badge exact">exact</b> means the relationship is true <i>by
          definition</i> — an inch <i>is</i> 25.4 mm, with no rounding.
          <b class="factor-badge approx">≈</b> means the digits shown are rounded.
          Click any row to load it into the converter.
        </p>

        <div class="lookup-table-wrap">
          <ul class="lookup-list" id="lookup-rows"></ul>
        </div>
        <p class="course-hint" id="lookup-count">—</p>
      </div>`;
  }

  private bindLookupControls(root: HTMLElement): void {
    root.querySelector<HTMLInputElement>("#lookup-search")
      ?.addEventListener("input", (e) => {
        this.lookupQuery = (e.target as HTMLInputElement).value;
        this.renderLookupRows();
      });
    root.querySelector<HTMLSelectElement>("#lookup-category")
      ?.addEventListener("change", (e) => {
        this.lookupCategory = (e.target as HTMLSelectElement).value;
        this.renderLookupRows();
      });
    root.querySelector<HTMLInputElement>("#lookup-exact-only")
      ?.addEventListener("change", (e) => {
        this.lookupExactOnly = (e.target as HTMLInputElement).checked;
        this.renderLookupRows();
      });
    // Delegated so the handler survives every re-render of the table body.
    const rowsEl = root.querySelector<HTMLElement>("#lookup-rows");
    rowsEl?.addEventListener("click", (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("li[data-category]");
      if (row) this.loadIntoConverter(row.dataset.category!, row.dataset.from!, row.dataset.to!);
    });
    // Rows are focusable, so they must also respond to the keyboard.
    rowsEl?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const row = (e.target as HTMLElement).closest<HTMLElement>("li[data-category]");
      if (!row) return;
      e.preventDefault();
      this.loadIntoConverter(row.dataset.category!, row.dataset.from!, row.dataset.to!);
    });
  }

  /** Apply the search box, the category filter and the exact-only toggle, in that order. */
  private visibleFactorRows(): FactorRow[] {
    let rows = searchFactors(this.factorRows, this.lookupQuery);
    if (this.lookupCategory !== "all") {
      rows = rows.filter((r) => r.categoryId === this.lookupCategory);
    }
    if (this.lookupExactOnly) rows = rows.filter((r) => r.exact);
    return rows;
  }

  private renderLookupRows(): void {
    const body = document.getElementById("lookup-rows");
    const count = document.getElementById("lookup-count");
    if (!body || !count) return;

    const rows = this.visibleFactorRows();
    if (rows.length === 0) {
      body.innerHTML = `<li class="lookup-empty">No factor matches that search. Try a unit symbol such as "km", or a category such as "energy".</li>`;
      count.textContent = "0 of " + this.factorRows.length + " factors shown.";
      return;
    }

    let lastCategory = "";
    const html: string[] = [];
    for (const row of rows) {
      if (row.categoryId !== lastCategory) {
        html.push(`<li class="lookup-group">${row.categoryLabel}</li>`);
        lastCategory = row.categoryId;
      }
      const badge = row.exact
        ? `<b class="factor-badge exact" title="Exact by definition">exact</b>`
        : `<b class="factor-badge approx" title="The digits shown are rounded">≈</b>`;
      html.push(`
        <li class="lookup-item" data-category="${row.categoryId}" data-from="${row.fromUnitId}" data-to="${row.toUnitId}" tabindex="0" role="button" title="Load into the converter">
          <div class="lookup-main"><code>${row.from} = ${row.to}</code>${badge}</div>
          <div class="lookup-reverse"><code>${row.reverse}</code></div>
          <div class="lookup-hint">${row.hint ?? ""}</div>
        </li>`);
    }
    body.innerHTML = html.join("");
    count.textContent = `${rows.length} of ${this.factorRows.length} factors shown.`;
  }

  /** Point the converter at a reference row: 1 of the "from" unit expressed in the "to" unit. */
  private loadIntoConverter(categoryId: string, fromId: string, toId: string): void {
    this.cat = categoryById(categoryId);
    this.from = unitById(categoryId, fromId);
    this.to = unitById(categoryId, toId);
    this.value = 1;
    this.stage = "convert";

    const catSel = document.getElementById("conv-cat") as HTMLSelectElement | null;
    if (catSel) catSel.value = categoryId;
    const valueInput = document.getElementById("conv-value") as HTMLInputElement | null;
    if (valueInput) valueInput.value = "1";

    this.fillUnitSelects();
    this.compute();
    document.getElementById("conv-calc")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** The journey planner: distance ÷ speed = time, using the same base-unit rule. */
  private journeyHtml(): string {
    const lengthOptions = (selected: Unit) =>
      categoryById("length").units
        .map((u) => `<option value="${u.id}"${u.id === selected.id ? " selected" : ""}>${u.label}</option>`)
        .join("");
    const speedOptions = (selected: Unit) =>
      categoryById("speed").units
        .map((u) => `<option value="${u.id}"${u.id === selected.id ? " selected" : ""}>${u.label}</option>`)
        .join("");
    const presets = JOURNEY_PRESETS.map(
      (preset, index) =>
        `<button type="button" class="course-btn ghost journey-preset" data-journey-preset="${index}">${preset.label}</button>`,
    ).join("");

    return `
      <div class="course" id="journey-calc">
        <h3>Journey planner — how long will it take?</h3>
        <p>Conversions get useful the moment you <b>combine</b> units. Speed is already a
        compound unit — a distance <i>divided by</i> a time — so dividing a distance by a
        speed cancels the distance and leaves a time:</p>

        <p class="conv-rule">time&nbsp;=&nbsp;<span class="conv-frac"><span>distance</span><span>speed</span></span></p>

        <p>Mix miles with kilometres per hour and the units will not cancel. The fix is the
        rule you already know: put both quantities into <b>base units</b> — metres and metres
        per second — then divide.</p>

        <div class="journey-equation" aria-label="Journey time equation">
          <label class="conv-term">
            <span>Distance</span>
            <input id="journey-distance" type="number" step="any" min="0" value="${this.journey.distance}" />
            <select id="journey-distance-unit">${lengthOptions(this.journey.distanceUnit)}</select>
          </label>
          <span class="conv-op">÷</span>
          <label class="conv-term">
            <span>Speed</span>
            <input id="journey-speed" type="number" step="any" min="0" value="${this.journey.speed}" />
            <select id="journey-speed-unit">${speedOptions(this.journey.speedUnit)}</select>
          </label>
          <span class="conv-op">=</span>
          <label class="conv-term">
            <span>Time</span>
            <output id="journey-result" class="conv-result">—</output>
            <span class="journey-result-exact" id="journey-result-exact">—</span>
          </label>
        </div>

        <div class="journey-presets">${presets}</div>
        <p class="course-hint" id="journey-note">Pick a journey, or type your own distance and speed.</p>
        <div class="readout" id="journey-working">—</div>
      </div>`;
  }

  private bindJourneyControls(root: HTMLElement): void {
    root.querySelector<HTMLInputElement>("#journey-distance")
      ?.addEventListener("input", (e) => {
        this.journey.distance = parseFloat((e.target as HTMLInputElement).value);
        this.onJourneyEdit();
      });
    root.querySelector<HTMLInputElement>("#journey-speed")
      ?.addEventListener("input", (e) => {
        this.journey.speed = parseFloat((e.target as HTMLInputElement).value);
        this.onJourneyEdit();
      });
    root.querySelector<HTMLSelectElement>("#journey-distance-unit")
      ?.addEventListener("change", (e) => {
        this.journey.distanceUnit = unitById("length", (e.target as HTMLSelectElement).value);
        this.onJourneyEdit();
      });
    root.querySelector<HTMLSelectElement>("#journey-speed-unit")
      ?.addEventListener("change", (e) => {
        this.journey.speedUnit = unitById("speed", (e.target as HTMLSelectElement).value);
        this.onJourneyEdit();
      });
    root.querySelectorAll<HTMLButtonElement>("[data-journey-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = JOURNEY_PRESETS[Number(button.dataset.journeyPreset)];
        if (!preset) return;
        this.journey = {
          distance: preset.distance,
          distanceUnit: unitById("length", preset.distanceUnitId),
          speed: preset.speed,
          speedUnit: unitById("speed", preset.speedUnitId),
        };
        this.syncJourneyInputs();
        this.onJourneyEdit(preset.note);
      });
    });
  }

  private syncJourneyInputs(): void {
    const distance = document.getElementById("journey-distance") as HTMLInputElement | null;
    const speed = document.getElementById("journey-speed") as HTMLInputElement | null;
    const distanceUnit = document.getElementById("journey-distance-unit") as HTMLSelectElement | null;
    const speedUnit = document.getElementById("journey-speed-unit") as HTMLSelectElement | null;
    if (distance) distance.value = String(this.journey.distance);
    if (speed) speed.value = String(this.journey.speed);
    if (distanceUnit) distanceUnit.value = this.journey.distanceUnit.id;
    if (speedUnit) speedUnit.value = this.journey.speedUnit.id;
  }

  private onJourneyEdit(note?: string): void {
    this.stage = "journey";
    this.computeJourney(note);
  }

  private computeJourney(note?: string): void {
    const resultEl = document.getElementById("journey-result");
    const exactEl = document.getElementById("journey-result-exact");
    const workEl = document.getElementById("journey-working");
    const noteEl = document.getElementById("journey-note");
    if (!resultEl || !exactEl || !workEl) return;
    if (note && noteEl) noteEl.textContent = note;

    const { distance, distanceUnit, speed, speedUnit } = this.journey;
    const seconds = journeyTimeSeconds(distance, distanceUnit, speed, speedUnit);

    if (!isFinite(seconds)) {
      resultEl.textContent = "—";
      exactEl.textContent = "—";
      workEl.innerHTML = speed <= 0 && isFinite(speed)
        ? "At zero speed you never arrive — the time would be infinite. Enter a speed above 0."
        : "Enter a distance of 0 or more and a speed above 0.";
      if (this.stage === "journey") this.drawJourneyPreview(NaN);
      return;
    }

    resultEl.textContent = formatDuration(seconds);
    exactEl.textContent = `${fmt(seconds)} s  ·  ${fmt(seconds / 3600)} hr`;
    workEl.innerHTML = this.journeyWorkingHtml(seconds);
    if (this.stage === "journey") this.drawJourneyPreview(seconds);
  }

  /** Show the base-unit reduction, then the division that cancels the distance unit. */
  private journeyWorkingHtml(seconds: number): string {
    const { distance, distanceUnit, speed, speedUnit } = this.journey;
    const metres = toBase(distanceUnit, distance);
    const mps = toBase(speedUnit, speed);

    const sameSystem = distanceUnit.id === "m" && speedUnit.id === "mps";
    const lines = [
      `Distance in base units: <code>${fmt(distance)} ${distanceUnit.symbol} = ${fmt(metres)} m</code>`,
      `Speed in base units: <code>${fmt(speed)} ${speedUnit.symbol} = ${fmt(mps)} m/s</code>`,
      `Divide: <code>${fmt(metres)} <s>m</s> ÷ ( ${fmt(mps)} <s>m</s> / s ) = ${fmt(seconds)} s</code>`,
      `The metres cancel and the seconds flip up from the bottom of the fraction, leaving a time: <b>${formatDuration(seconds)}</b>.`,
    ];
    if (sameSystem) {
      lines.unshift("Both quantities are already in base units, so no conversion is needed first.");
    }
    return lines.map((line) => `<div class="deriv-work">${line}</div>`).join("");
  }

  private onCategory(id: string): void {
    this.cat = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
    // Default to the first two units of the new category.
    this.from = this.cat.units[Math.min(1, this.cat.units.length - 1)];
    this.to = this.cat.units[0];
    this.stage = "convert";
    this.fillUnitSelects();
    this.compute();
  }

  private unit(id: string): Unit {
    return this.cat.units.find((u) => u.id === id) ?? this.cat.units[0];
  }

  private fillUnitSelects(): void {
    const opts = (sel: Unit) =>
      this.cat.units
        .map((u) => `<option value="${u.id}"${u === sel ? " selected" : ""}>${u.label}</option>`)
        .join("");
    const fromSel = document.getElementById("conv-from") as HTMLSelectElement | null;
    const toSel = document.getElementById("conv-to") as HTMLSelectElement | null;
    if (fromSel) fromSel.innerHTML = opts(this.from);
    if (toSel) toSel.innerHTML = opts(this.to);
  }

  private swap(): void {
    [this.from, this.to] = [this.to, this.from];
    this.stage = "convert";
    this.fillUnitSelects();
    this.compute();
  }

  private compute(): void {
    const resultEl = document.getElementById("conv-result");
    const workEl = document.getElementById("conv-working");
    const factorTop = document.getElementById("conv-factor-top");
    const factorBottom = document.getElementById("conv-factor-bottom");
    if (!resultEl || !workEl || !factorTop || !factorBottom) return;

    if (!isFinite(this.value)) {
      resultEl.textContent = "—";
      factorTop.textContent = "—";
      factorBottom.textContent = "—";
      workEl.innerHTML = "Enter a number to convert.";
      if (this.stage === "convert") this.clearPreview();
      return;
    }

    const out = convert(this.from, this.to, this.value);
    resultEl.textContent = `${fmt(out)} ${this.to.symbol}`;
    this.renderFactor(factorTop, factorBottom);
    workEl.innerHTML = this.workingHtml(out);
    if (this.stage === "convert") this.drawPreview(out);
  }

  private renderFactor(top: HTMLElement, bottom: HTMLElement): void {
    if (this.from.id === this.to.id) {
      top.textContent = `1 ${this.to.symbol}`;
      bottom.textContent = `1 ${this.from.symbol}`;
      return;
    }

    if (!this.cat.linear) {
      top.textContent = "scale + shift";
      bottom.textContent = `${this.from.symbol} → ${this.to.symbol}`;
      return;
    }

    const perFrom = this.from.factor / this.to.factor;
    top.textContent = `${fmt(perFrom)} ${this.to.symbol}`;
    bottom.textContent = `1 ${this.from.symbol}`;
  }

  /** Build the step-by-step "show your working" line for the current conversion. */
  private workingHtml(out: number): string {
    const v = fmt(this.value);
    const o = fmt(out);

    if (this.from.id === this.to.id) {
      return `Same unit — nothing to do: <b>${v} ${this.to.symbol}</b>.`;
    }

    if (!this.cat.linear) {
      // Temperature: show the scale-and-shift, not a unit fraction.
      return `Temperature needs a scale <i>and</i> a shift (the zero points differ):<br>
        <code>${v} ${this.from.symbol}</code> → base ${fmt(this.from.factor * this.value + (this.from.offset ?? 0))} K →
        <b>${o} ${this.to.symbol}</b>.`;
    }

    // Linear: 1 fromUnit = (factor_from / factor_to) toUnit  → the conversion factor.
    const perFrom = this.from.factor / this.to.factor;
    return `Conversion factor: <code>1 ${this.from.symbol} = ${fmt(perFrom)} ${this.to.symbol}</code><br>
      <code>${v} <s>${this.from.symbol}</s> × ( ${fmt(perFrom)} ${this.to.symbol} / 1 <s>${this.from.symbol}</s> ) = ${o} ${this.to.symbol}</code>`;
  }

  private drawPreview(out: number): void {
    this.clearPreview();
    this.traveller = undefined;

    const title = textSprite(this.cat.label, 0xffffff, 0.45);
    title.position.set(0, 2.9, 0);
    this.preview.add(title);

    const equation = textSprite(`${fmt(this.value)} ${this.from.symbol}  =  ${fmt(out)} ${this.to.symbol}`, 0x7ee787, 0.48);
    equation.position.set(0, 2.35, 0);
    this.preview.add(equation);

    if (!this.cat.linear) {
      this.drawTemperaturePreview(out);
      return;
    }

    this.drawLinearScale();
    this.drawAmountBlocks(out);
  }

  private drawLinearScale(): void {
    const units = [...this.cat.units].sort((a, b) => a.factor - b.factor);
    const exponents = units.map((unit) => Math.log10(unit.factor));
    const minExp = Math.min(...exponents);
    const maxExp = Math.max(...exponents);
    const span = Math.max(maxExp - minExp, 1);

    this.preview.add(segment(new THREE.Vector3(-4.1, 0.15, 0), new THREE.Vector3(4.1, 0.15, 0), 0x58a6ff));

    // Units that are close in magnitude (e.g. m/yd/ft, or km/mi/nmi) land almost on top of
    // each other on this log-scaled axis. A single label row would overlap illegibly, so
    // each label claims the first row down where it clears its row-neighbour, stacking
    // into a second/third row instead of colliding.
    const inactiveRows: number[] = [];
    const activeRows: number[] = [];
    const rowStep = 0.36;
    const claimRow = (rows: number[], x: number, minGap: number): number => {
      let row = 0;
      while (rows[row] !== undefined && x - rows[row] < minGap) row++;
      rows[row] = x;
      return row;
    };

    for (const unit of units) {
      const x = -4 + ((Math.log10(unit.factor) - minExp) / span) * 8;
      const active = unit.id === this.from.id || unit.id === this.to.id;
      const tickHeight = active ? 0.7 : 0.38;
      this.preview.add(segment(new THREE.Vector3(x, 0.15 - tickHeight / 2, 0), new THREE.Vector3(x, 0.15 + tickHeight / 2, 0), active ? 0xffd166 : 0x8b949e));

      const scale = active ? 0.34 : 0.26;
      const row = active ? claimRow(activeRows, x, scale * 4.2) : claimRow(inactiveRows, x, scale * 4.2);
      const label = textSprite(unit.symbol, active ? 0xffd166 : 0xc9d1d9, scale);
      label.position.set(x, (active ? -0.65 : -0.42) - row * rowStep, 0);
      this.preview.add(label);
    }

    const fromX = -4 + ((Math.log10(this.from.factor) - minExp) / span) * 8;
    const toX = -4 + ((Math.log10(this.to.factor) - minExp) / span) * 8;
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(Math.sign(toX - fromX) || 1, 0, 0),
      new THREE.Vector3(fromX, 1.15, 0),
      Math.max(Math.abs(toX - fromX), 0.35),
      0x7ee787,
      0.28,
      0.18,
    );
    this.preview.add(arrow);

    const factor = this.from.factor / this.to.factor;
    const factorLabel = textSprite(`× ${fmt(factor)}`, 0x7ee787, 0.34);
    factorLabel.position.set((fromX + toX) / 2, 1.55, 0);
    this.preview.add(factorLabel);
  }

  private drawAmountBlocks(out: number): void {
    const fromBase = this.from.factor * this.value;
    const toBase = this.to.factor * out;
    const maxBase = Math.max(Math.abs(fromBase), Math.abs(toBase), 1e-9);
    const fromWidth = Math.max(0.2, (Math.abs(fromBase) / maxBase) * 3.2);
    const toWidth = Math.max(0.2, (Math.abs(toBase) / maxBase) * 3.2);
    this.preview.add(this.bar(-1.9, -2.1, fromWidth, 0x1f6feb, `${fmt(this.value)} ${this.from.symbol}`));
    this.preview.add(this.bar(1.9, -2.1, toWidth, 0x8957e5, `${fmt(out)} ${this.to.symbol}`));
  }

  private drawTemperaturePreview(out: number): void {
    const fromBase = this.from.factor * this.value + (this.from.offset ?? 0);
    const toBase = this.to.factor * out + (this.to.offset ?? 0);
    const minK = 200;
    const maxK = 400;
    const mapY = (k: number) => -1.8 + ((THREE.MathUtils.clamp(k, minK, maxK) - minK) / (maxK - minK)) * 3.4;
    this.preview.add(segment(new THREE.Vector3(-1, -1.8, 0), new THREE.Vector3(-1, 1.6, 0), 0xff7b72));
    this.preview.add(segment(new THREE.Vector3(1, -1.8, 0), new THREE.Vector3(1, 1.6, 0), 0x58a6ff));
    this.preview.add(segment(new THREE.Vector3(-1, mapY(fromBase), 0), new THREE.Vector3(1, mapY(toBase), 0), 0x7ee787));

    const fromLabel = textSprite(`${fmt(this.value)} ${this.from.symbol}`, 0xffd166, 0.34);
    fromLabel.position.set(-1.8, mapY(fromBase), 0);
    this.preview.add(fromLabel);
    const toLabel = textSprite(`${fmt(out)} ${this.to.symbol}`, 0x7ee787, 0.34);
    toLabel.position.set(1.8, mapY(toBase), 0);
    this.preview.add(toLabel);
  }

  /**
   * Centre-stage journey: a lane from start to finish with a traveller that crosses it in
   * a fixed wall-clock time, so the animation reads as "this trip" rather than implying a
   * literal speed. Distance and time are labelled on the lane itself.
   */
  private drawJourneyPreview(seconds: number): void {
    this.clearPreview();
    this.traveller = undefined;

    const { distance, distanceUnit, speed, speedUnit } = this.journey;
    const { startX, endX } = this.journeyLane;

    const title = textSprite("Journey", 0xffffff, 0.45);
    title.position.set(0, 2.9, 0);
    this.preview.add(title);

    const headline = isFinite(seconds)
      ? `${fmt(distance)} ${distanceUnit.symbol}  ÷  ${fmt(speed)} ${speedUnit.symbol}  =  ${formatDuration(seconds)}`
      : `${fmt(distance)} ${distanceUnit.symbol}  ÷  ${fmt(speed)} ${speedUnit.symbol}  =  never arrives`;
    const equation = textSprite(headline, isFinite(seconds) ? 0x7ee787 : 0xff7b72, 0.44);
    equation.position.set(0, 2.35, 0);
    this.preview.add(equation);

    this.preview.add(segment(new THREE.Vector3(startX, 0, 0), new THREE.Vector3(endX, 0, 0), 0x58a6ff));
    for (const [x, label, colour] of [
      [startX, "Start", 0xffd166],
      [endX, "Finish", 0x7ee787],
    ] as const) {
      this.preview.add(segment(new THREE.Vector3(x, -0.4, 0), new THREE.Vector3(x, 0.6, 0), colour));
      const marker = textSprite(label, colour, 0.3);
      marker.position.set(x, -0.75, 0);
      this.preview.add(marker);
    }

    const distanceLabel = textSprite(`${fmt(distance)} ${distanceUnit.symbol}`, 0xc9d1d9, 0.34);
    distanceLabel.position.set(0, 0.95, 0);
    this.preview.add(distanceLabel);

    const speedLabel = textSprite(`travelling at ${fmt(speed)} ${speedUnit.symbol}`, 0x8b949e, 0.3);
    speedLabel.position.set(0, -1.35, 0);
    this.preview.add(speedLabel);

    if (isFinite(seconds)) {
      const timeLabel = textSprite(formatDuration(seconds), 0x7ee787, 0.4);
      timeLabel.position.set(0, -1.9, 0);
      this.preview.add(timeLabel);

      const traveller = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x3a2c00 }),
      );
      traveller.position.set(startX, 0, 0);
      this.preview.add(traveller);
      this.traveller = traveller;
    }
  }

  /**
   * Sweep the traveller across the lane on a fixed 4-second loop. The loop length is
   * deliberately independent of the journey time: a 7-hour flight cannot be shown in real
   * time, and scaling the animation speed would make short journeys invisible.
   */
  private animateTraveller(elapsed: number): void {
    if (!this.traveller || this.stage !== "journey") return;
    const { startX, endX } = this.journeyLane;
    const phase = (elapsed % 4) / 4;
    this.traveller.position.x = startX + (endX - startX) * phase;
  }

  private bar(x: number, y: number, width: number, color: number, label: string): THREE.Group {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.45, 0.35),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    mesh.position.set(0, 0, 0);
    group.add(mesh);
    const text = textSprite(label, 0xffffff, 0.28);
    text.position.set(0, -0.55, 0);
    group.add(text);
    group.position.set(x, y, 0);
    return group;
  }

  private clearPreview(): void {
    this.preview.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((m) => this.disposeMaterial(m));
      } else if (material) {
        this.disposeMaterial(material);
      }
    });
    this.preview.clear();
  }

  private disposeMaterial(material: THREE.Material): void {
    const withMap = material as THREE.Material & { map?: THREE.Texture };
    withMap.map?.dispose();
    material.dispose();
  }
}
