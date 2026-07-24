import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  calculatorsForSection,
  defaultGeometryValues,
  fmtGeometry,
  GEOMETRY_CALCULATORS,
  GEOMETRY_SECTIONS,
  geometryCalculator,
  type GeometryCalculator,
} from "../math/geometry";
import { segment, textSprite } from "./helpers";
import "./formulaDerivations/geometry";

/** Panel-only geometry reference with live shape calculators. */
export class GeometryLesson implements Lesson {
  readonly id = "geometry";
  readonly title = "6 · Geometry";
  readonly blurb = "Shape formulas + calculators";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = [] as const;

  private setInfo!: (html: string) => void;
  private section = GEOMETRY_SECTIONS[0].id;
  private calculatorId = GEOMETRY_CALCULATORS[0].id;
  private readonly valuesByCalculator: Record<string, Record<string, number>> = {};
  private group = new THREE.Group();
  private preview = new THREE.Group();

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.preview);
    ctx.viewport.setHelpers(true);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 2.2, 11),
      new THREE.Vector3(0, 0, 0),
    );
    this.renderPanel();
  }

  exit(): void {
    this.clearPreview();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.preview = new THREE.Group();
  }

  private renderPanel(): void {
    const initialCalc = geometryCalculator(this.calculatorId);
    this.setInfo(`
      <h2>Geometry</h2>
      <p>Use the formulas and calculators here as a quick reference for common
      geometry problems: circles, parallelograms, regular polygons, flat areas
      and solid volumes.</p>

      <div class="geom-sections">
        ${GEOMETRY_SECTIONS.map(
          (section) => `
            <button class="geom-card" type="button" data-geom-section="${section.id}">
              <b>${section.title}</b>
              <span>${section.summary}</span>
            </button>`,
        ).join("")}
      </div>

      <div class="course" id="geom-calc">
        <h3>Calculator</h3>
        <p class="course-hint">Pick a section and shape, then change the measurements.</p>
        <label class="geom-row">
          <span>Section</span>
          <select id="geom-section">
            ${GEOMETRY_SECTIONS.map((section) => `<option value="${section.id}">${section.title}</option>`).join("")}
          </select>
        </label>
        <label class="geom-row">
          <span>Shape</span>
          <select id="geom-calculator"></select>
        </label>
        <div id="geom-formula" class="formula" data-derivation="${initialCalc.id}">
          <div class="formula-label">${initialCalc.title}</div>
          <div class="formula-body">${initialCalc.formula}</div>
          <div class="formula-note">${initialCalc.blurb}</div>
        </div>
        <div id="geom-fields" class="geom-fields"></div>
        <div id="geom-results" class="readout geom-results"></div>
      </div>

      <details class="course" open>
        <summary>Formula sheet</summary>
        <div class="geom-formula-sheet">
          <div><b>Circles</b><code>C = 2πr</code><code>A = πr²</code>${derivationButton("circle")}</div>
          <div><b>Parallelograms</b><code>A = b × h</code><code>P = 2(b + s)</code>${derivationButton("parallelogram")}</div>
          <div><b>Regular polygons</b><code>P = ns</code><code>A = Pa / 2</code>${derivationButton("regular-polygon")}</div>
          <div><b>Area</b><code>triangle: ½bh</code>${derivationButton("triangle-area")}<code>trapezium: ½(a + b)h</code>${derivationButton("trapezium-area")}</div>
          <div><b>Volume</b><code>cuboid: lwh</code>${derivationButton("cuboid-volume")}<code>cylinder: πr²h</code>${derivationButton("cylinder-volume")}<code>sphere: ⁴⁄₃πr³</code>${derivationButton("sphere-volume")}</div>
        </div>
      </details>`);

    const root = document.getElementById("info");
    if (!root) return;

    root.querySelector<HTMLSelectElement>("#geom-section")?.addEventListener("change", (event) => {
      this.section = (event.target as HTMLSelectElement).value;
      this.calculatorId = calculatorsForSection(this.section)[0]?.id ?? GEOMETRY_CALCULATORS[0].id;
      this.renderCalculator();
    });

    root.querySelector<HTMLSelectElement>("#geom-calculator")?.addEventListener("change", (event) => {
      this.calculatorId = (event.target as HTMLSelectElement).value;
      this.renderCalculator();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-geom-section]").forEach((button) => {
      button.addEventListener("click", () => {
        this.section = button.dataset.geomSection ?? GEOMETRY_SECTIONS[0].id;
        this.calculatorId = calculatorsForSection(this.section)[0]?.id ?? GEOMETRY_CALCULATORS[0].id;
        this.renderCalculator();
      });
    });

    this.renderCalculator();
  }

  private renderCalculator(): void {
    const calc = geometryCalculator(this.calculatorId);
    this.section = calc.section;

    const sectionSelect = document.getElementById("geom-section") as HTMLSelectElement | null;
    if (sectionSelect) sectionSelect.value = this.section;

    const calculators = calculatorsForSection(this.section);
    const calculatorSelect = document.getElementById("geom-calculator") as HTMLSelectElement | null;
    if (calculatorSelect) {
      calculatorSelect.innerHTML = calculators
        .map((calculator) => `<option value="${calculator.id}"${calculator.id === calc.id ? " selected" : ""}>${calculator.title}</option>`)
        .join("");
    }

    document.querySelectorAll<HTMLButtonElement>("[data-geom-section]").forEach((button) => {
      button.classList.toggle("active", button.dataset.geomSection === this.section);
    });

    this.renderFormula(calc);
    this.renderFields(calc);
    this.compute(calc);
  }

  private renderFormula(calc: GeometryCalculator): void {
    const formula = document.getElementById("geom-formula");
    if (!formula) return;
    formula.dataset.derivation = calc.id;
    const label = formula.querySelector<HTMLElement>(".formula-label");
    const body = formula.querySelector<HTMLElement>(".formula-body");
    const note = formula.querySelector<HTMLElement>(".formula-note");
    const button = formula.querySelector<HTMLButtonElement>(".formula-derive");
    if (label) label.textContent = calc.title;
    if (body) body.textContent = calc.formula;
    if (note) note.textContent = calc.blurb;
    if (button) button.dataset.derivation = calc.id;
  }

  private renderFields(calc: GeometryCalculator): void {
    const fields = document.getElementById("geom-fields");
    if (!fields) return;

    const values = this.values(calc);
    fields.innerHTML = calc.inputs
      .map(
        (input) => `
          <label class="geom-field">
            <span>${input.label}</span>
            <input
              id="geom-input-${input.id}"
              data-geom-input="${input.id}"
              type="number"
              min="${input.min ?? 0}"
              step="${input.step ?? "any"}"
              value="${values[input.id]}"
            />
            <em>${input.unit}</em>
          </label>`,
      )
      .join("");

    fields.querySelectorAll<HTMLInputElement>("[data-geom-input]").forEach((input) => {
      input.addEventListener("input", () => {
        values[input.dataset.geomInput ?? ""] = input.valueAsNumber;
        this.compute(calc);
      });
    });
  }

  private compute(calc: GeometryCalculator): void {
    const output = document.getElementById("geom-results");
    if (!output) return;

    const result = calc.solve(this.values(calc));
    if (result.error) {
      output.innerHTML = `<p class="err">${result.error}</p>`;
      this.clearPreview();
      return;
    }

    output.innerHTML = `
      ${result.results
        .map(
          (item) => `
            <div data-geom-result="${this.slug(item.label)}">
              <span>${item.label}</span>
              <b>${fmtGeometry(item.value)} ${item.unit}</b>
            </div>
            <p class="geom-working"><code>${item.formula}</code>${derivationButton(calc.id)}</p>`,
        )
        .join("")}
      ${result.note ? `<p class="geom-working">${result.note}</p>` : ""}`;
    this.drawPreview(calc);
  }

  private values(calc: GeometryCalculator): Record<string, number> {
    this.valuesByCalculator[calc.id] ??= defaultGeometryValues(calc);
    return this.valuesByCalculator[calc.id];
  }

  private slug(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  private drawPreview(calc: GeometryCalculator): void {
    this.clearPreview();
    const values = this.values(calc);
    const title = textSprite(calc.title, 0xffffff, 0.42);
    title.position.set(0, 2.9, 0);
    this.preview.add(title);

    switch (calc.id) {
      case "circle":
        this.drawCircle(calc);
        break;
      case "parallelogram":
        this.drawParallelogram(calc);
        break;
      case "regular-polygon":
        this.drawRegularPolygon(calc, Math.max(3, Math.round(values.sides)));
        break;
      case "triangle-area":
        this.drawTriangle(calc);
        break;
      case "rectangle-area":
        this.drawRectangle(calc);
        break;
      case "trapezium-area":
        this.drawTrapezium(calc);
        break;
      case "cuboid-volume": {
        const scale = this.scaleFor(calc, [values.length, values.width, values.height]);
        this.drawMesh(new THREE.BoxGeometry(values.length * scale, values.height * scale, values.width * scale), "l × w × h");
        break;
      }
      case "cylinder-volume": {
        const scale = this.scaleFor(calc, [values.radius * 2, values.height]);
        this.drawMesh(new THREE.CylinderGeometry(values.radius * scale, values.radius * scale, values.height * scale, 48), "πr²h");
        break;
      }
      case "cone-volume": {
        const scale = this.scaleFor(calc, [values.radius * 2, values.height]);
        this.drawMesh(new THREE.ConeGeometry(values.radius * scale, values.height * scale, 48), "⅓πr²h");
        break;
      }
      case "sphere-volume": {
        const scale = this.scaleFor(calc, [values.radius * 2]);
        this.drawMesh(new THREE.SphereGeometry(values.radius * scale, 48, 24), "⁴⁄₃πr³");
        break;
      }
    }
  }

  private drawCircle(calc: GeometryCalculator): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.radius]);
    const radius = values.radius * scale;
    this.drawMesh(new THREE.CircleGeometry(radius, 96), "A = πr²", false);
    this.preview.add(segment(new THREE.Vector3(0, 0, 0.04), new THREE.Vector3(radius, 0, 0.04), 0xffd166));
    const label = textSprite("r", 0xffd166, 0.32);
    label.position.set(radius / 2, 0.28, 0.08);
    this.preview.add(label);
  }

  private drawParallelogram(calc: GeometryCalculator): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.base, values.height, values.side]);
    const base = values.base * scale;
    const height = values.height * scale;
    const side = values.side * scale;
    const offset = Math.sqrt(Math.max(side * side - height * height, 0));
    this.drawPolygon([
      new THREE.Vector3(-base / 2 - offset / 2, -height / 2, 0),
      new THREE.Vector3(base / 2 - offset / 2, -height / 2, 0),
      new THREE.Vector3(base / 2 + offset / 2, height / 2, 0),
      new THREE.Vector3(-base / 2 + offset / 2, height / 2, 0),
    ]);
    this.preview.add(segment(new THREE.Vector3(-base / 2 + offset / 2, height / 2, 0.05), new THREE.Vector3(-base / 2 + offset / 2, -height / 2, 0.05), 0xffd166));
    const label = textSprite("h", 0xffd166, 0.3);
    label.position.set(-base / 2 + offset / 2 - 0.28, 0, 0.08);
    this.preview.add(label);
  }

  private drawRegularPolygon(calc: GeometryCalculator, sides: number): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.sideLength]);
    const radius = (values.sideLength * scale) / (2 * Math.sin(Math.PI / sides));
    const points = Array.from({ length: sides }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI * 2) / sides;
      return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    });
    this.drawPolygon(points);
  }

  private drawTriangle(calc: GeometryCalculator): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.base, values.height]);
    const base = values.base * scale;
    const height = values.height * scale;
    this.drawPolygon([
      new THREE.Vector3(-base / 2, -height / 2, 0),
      new THREE.Vector3(base / 2, -height / 2, 0),
      new THREE.Vector3(0, height / 2, 0),
    ]);
  }

  private drawRectangle(calc: GeometryCalculator): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.length, values.width]);
    const length = values.length * scale;
    const width = values.width * scale;
    this.drawPolygon([
      new THREE.Vector3(-length / 2, -width / 2, 0),
      new THREE.Vector3(length / 2, -width / 2, 0),
      new THREE.Vector3(length / 2, width / 2, 0),
      new THREE.Vector3(-length / 2, width / 2, 0),
    ]);
  }

  private drawTrapezium(calc: GeometryCalculator): void {
    const values = this.values(calc);
    const scale = this.scaleFor(calc, [values.parallelA, values.parallelB, values.height]);
    const bottom = values.parallelA * scale;
    const top = values.parallelB * scale;
    const height = values.height * scale;
    this.drawPolygon([
      new THREE.Vector3(-bottom / 2, -height / 2, 0),
      new THREE.Vector3(bottom / 2, -height / 2, 0),
      new THREE.Vector3(top / 2, height / 2, 0),
      new THREE.Vector3(-top / 2, height / 2, 0),
    ]);
  }

  private scaleFor(calc: GeometryCalculator, currentDimensions: number[]): number {
    const defaults = defaultGeometryValues(calc);
    const defaultDimensions = calc.inputs
      .filter((input) => input.unit)
      .map((input) => defaults[input.id] ?? 1);
    const defaultMax = Math.max(1, ...defaultDimensions.map((value) => Math.abs(value)));
    const currentMax = Math.max(1e-6, ...currentDimensions.map((value) => Math.abs(value)));
    let scale = 3.2 / defaultMax;

    if (currentMax * scale > 5) {
      scale = 5 / currentMax;
    } else if (currentMax * scale < 0.6) {
      scale = 0.6 / currentMax;
    }

    return scale;
  }

  private drawPolygon(points: THREE.Vector3[]): void {
    const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, p.y)));
    this.drawMesh(new THREE.ShapeGeometry(shape), "area", false);
    const loop = [...points, points[0]].map((p) => p.clone().setZ(0.06));
    this.preview.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(loop), new THREE.LineBasicMaterial({ color: 0xffffff })));
  }

  private drawMesh(geometry: THREE.BufferGeometry, label: string, edge = true): void {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x1f6feb,
        roughness: 0.45,
        metalness: 0.08,
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
      }),
    );
    this.preview.add(mesh);

    if (edge) {
      this.preview.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 }),
        ),
      );
    }

    const formula = textSprite(label, 0x7ee787, 0.38);
    formula.position.set(0, -2.65, 0);
    this.preview.add(formula);
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
