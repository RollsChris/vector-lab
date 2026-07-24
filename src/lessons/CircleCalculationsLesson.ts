import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { derivationButton } from "../core/FormulaDerivations";
import { textSprite } from "./helpers";
import "./formulaDerivations/circle";

type Chapter =
  | "basics"
  | "angles"
  | "arcs-chords"
  | "regions"
  | "line-circle"
  | "two-circles"
  | "tangents";

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: "basics", label: "1 · Basics" },
  { id: "angles", label: "2 · Angles & arcs" },
  { id: "arcs-chords", label: "3 · Arcs & chords" },
  { id: "regions", label: "4 · Sectors & segments" },
  { id: "line-circle", label: "5 · Line intersections" },
  { id: "two-circles", label: "6 · Two circles" },
  { id: "tangents", label: "7 · Tangents & secants" },
];

const COL = {
  circle: 0x58a6ff,
  radius: 0xffd166,
  arc: 0xd2a8ff,
  chord: 0x7ee787,
  line: 0xffa657,
  point: 0xff7b72,
};

/**
 * A calculation-first companion to Circle Theorems. It deliberately separates formula
 * derivation, numerical substitution, and the picture each calculation describes.
 */
export class CircleCalculationsLesson implements Lesson {
  readonly id = "circle-calculations";
  readonly title = "Circle Geometry & Calculations";
  readonly blurb = "Arcs, chords, sectors and intersections";
  readonly category = "Shape" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["geometry", "circle-theorems"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private chapter: Chapter = "basics";
  private previousRotate = true;
  private readonly values = {
    radius: 5,
    angle: 120,
    offset: 3,
    separation: 8,
  };

  private readonly infoHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-circle-chapter]");
    if (button) {
      const chapter = button.dataset.circleChapter as Chapter;
      if (CHAPTERS.some((item) => item.id === chapter)) {
        this.chapter = chapter;
        this.rebuild();
      }
      return;
    }

    const input = target.closest<HTMLInputElement>("[data-circle-input]");
    if (!input || event.type !== "change") return;
    const key = input.dataset.circleInput as keyof typeof this.values;
    if (!(key in this.values) || !Number.isFinite(input.valueAsNumber)) return;
    this.values[key] = input.valueAsNumber;
    this.normaliseValues();
    this.rebuild();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 15), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;
    document.getElementById("info")?.addEventListener("click", this.infoHandler);
    document.getElementById("info")?.addEventListener("change", this.infoHandler);
    this.rebuild();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.infoHandler);
    document.getElementById("info")?.removeEventListener("change", this.infoHandler);
    this.disposeChildren(this.group);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.viewport = undefined;
  }

  private normaliseValues(): void {
    this.values.radius = THREE.MathUtils.clamp(this.values.radius, 0.1, 100);
    this.values.angle = THREE.MathUtils.clamp(this.values.angle, 1, 359);
    this.values.offset = THREE.MathUtils.clamp(this.values.offset, -100, 100);
    this.values.separation = THREE.MathUtils.clamp(this.values.separation, 0.1, 200);
  }

  private rebuild(): void {
    this.disposeChildren(this.group);
    this.drawScene();
    this.renderPanel();
  }

  private renderPanel(): void {
    const nav = CHAPTERS
      .map((item) => `<button class="course-btn${item.id === this.chapter ? "" : " ghost"}" data-circle-chapter="${item.id}">${item.label}</button>`)
      .join("");

    this.setInfo(`
      <h2>Circle Geometry &amp; Calculations</h2>
      <p>Choose a chapter, then change the values below. Every result shows the formula,
      substitution, and diagram together. Angles are in <b>degrees</b> unless a formula
      explicitly says radians.</p>
      <div class="course-chapters" style="margin-bottom:10px">${nav}</div>
      <div class="course">
        <h3>Explore the same circle</h3>
        <div class="circle-inputs">
          ${this.input("radius", "Radius r", "units", 0.1)}
          ${this.input("angle", "Central angle θ", "°", 1)}
          ${this.chapter === "line-circle" ? this.input("offset", "Line distance k from centre", "units", 0.1) : ""}
          ${this.chapter === "two-circles" || this.chapter === "tangents" ? this.input("separation", "Centre/external distance d", "units", 0.1) : ""}
        </div>
      </div>
      ${this.chapterContent()}
      <details class="course">
        <summary>History and applications</summary>
        <p><b>History:</b> Babylonian and Egyptian builders used practical approximations for π;
        Archimedes later bounded π by placing many-sided polygons inside and outside a circle.
        Greek geometers developed the tangent, chord and angle theorems that let surveyors and
        astronomers measure inaccessible distances.</p>
        <p><b>Where this matters:</b> circular road and rail curves use arc length and radius;
        gears and wheels use circumference; cameras, radar and GPS use circle intersections;
        CAD and collision detection solve line-circle equations continuously.</p>
      </details>`);
  }

  private input(key: keyof typeof this.values, label: string, unit: string, step: number): string {
    return `<label class="geom-field">
      <span>${label}</span>
      <input data-circle-input="${key}" type="number" min="${key === "offset" ? -100 : 0.1}" step="${step}" value="${this.values[key]}" />
      <em>${unit}</em>
    </label>`;
  }

  private chapterContent(): string {
    const { radius: r, angle, offset, separation } = this.values;
    const theta = THREE.MathUtils.degToRad(angle);
    const circumference = 2 * Math.PI * r;
    const area = Math.PI * r * r;
    const arc = r * theta;
    const chord = 2 * r * Math.sin(theta / 2);
    const centreToChord = r * Math.cos(theta / 2);
    const sector = (angle / 360) * area;
    const triangle = 0.5 * r * r * Math.sin(theta);
    const segment = sector - triangle;

    switch (this.chapter) {
      case "basics":
        return `<div class="course">
          <h3>Radius, diameter, circumference and area</h3>
          <p>A <b>radius</b> goes from centre to edge; a <b>diameter</b> crosses the centre, so
          it is two radii. Circumference is the distance <em>around</em>; area is the space
          <em>inside</em>.</p>
          ${this.readout([
            ["Diameter", `d = 2r = 2 × ${fmt(r)} = <b>${fmt(2 * r)} units</b>`],
            ["Circumference", `C = 2πr = 2π × ${fmt(r)} = <b>${fmt(circumference)} units</b>`],
            ["Area", `A = πr² = π × ${fmt(r)}² = <b>${fmt(area)} units²</b>`],
          ])}
          <p class="course-hint"><b>Reverse calculation:</b> if a wheel has circumference C,
          then r = C/(2π). Never confuse C (a length) with A (a square-unit area).</p>
          ${derivationButton("circumference")}
          ${derivationButton("circle-area")}
        </div>`;
      case "angles":
        return `<div class="course">
          <h3>Arc measure, degrees and radians</h3>
          <p>The central angle θ selects the same fraction of a full circle as its arc:
          θ/360. Radians give the more direct measure: one radian cuts off an arc equal in
          length to the radius.</p>
          ${this.readout([
            ["Radians", `θ = ${fmt(angle)}° × π/180 = <b>${fmt(theta)} rad</b>`],
            ["Arc fraction", `${fmt(angle)}°/360° = <b>${fmt(angle / 360)}</b> of the circle`],
            ["Central angle", `arc AB measures <b>${fmt(angle)}°</b>`],
            ["Inscribed angle", `an angle at the circumference on arc AB = θ/2 = <b>${fmt(angle / 2)}°</b>`],
          ])}
          <p class="course-hint"><b>Rule:</b> a central angle equals its intercepted arc;
          an inscribed angle is half that arc. A diameter intercepts 180°, so any angle in a
          semicircle is 90°.</p>
          <p class="course-hint"><b>When lines meet:</b> two chords crossing <em>inside</em>
          make an angle equal to ½(sum of their intercepted arcs). A tangent and chord make
          the same angle as the angle in the opposite segment. Two secants/tangents meeting
          <em>outside</em> make an angle equal to ½(major arc − minor arc).</p>
          ${derivationButton("inscribed-angle")}
        </div>`;
      case "arcs-chords":
        return `<div class="course">
          <h3>Arc length and chord length</h3>
          <p>An <b>arc</b> follows the curve. A <b>chord</b> is the straight shortcut between
          the same endpoints. Convert θ to radians before using s = rθ.</p>
          <ol class="deriv">
            <li><b class="step-title">Start with one full turn</b>A complete circle is
            <b>2π radians</b> around, and its circumference is <b>2πr</b>.</li>
            <li><b class="step-title">Take the same fraction of both</b>This angle is
            θ/(2π) of a full turn, so its arc is
            s = θ/(2π) × 2πr = <b>rθ</b>.</li>
            <li><b class="step-title">Use the values</b>
            s = (${fmt(angle)}°/360°) × 2π × ${fmt(r)} =
            ${fmt(angle / 360)} × ${fmt(circumference)} = <b>${fmt(arc)} units</b>.
            The identical radians route is s = ${fmt(r)} × ${fmt(theta)}.</li>
          </ol>
          ${this.readout([
            ["Arc length", `s = rθ = ${fmt(r)} × ${fmt(theta)} = <b>${fmt(arc)} units</b>`],
            ["Chord length", `c = 2r sin(θ/2) = 2 × ${fmt(r)} × sin(${fmt(angle / 2)}°) = <b>${fmt(chord)} units</b>`],
            ["Centre-to-chord distance", `p = r cos(θ/2) = ${fmt(r)} × cos(${fmt(angle / 2)}°) = <b>${fmt(centreToChord)} units</b>`],
          ])}
          <p class="course-hint"><b>Useful inverse:</b> θ = 2sin⁻¹(c/(2r)). The perpendicular
          from the centre to a chord bisects it, producing the right triangle behind both
          chord formulas. Equal chords have equal arcs and lie the same distance from the
          centre; the longer chord is closer to the centre.</p>
          ${derivationButton("arc-length")}
          ${derivationButton("chord-length")}
        </div>`;
      case "regions":
        return `<div class="course">
          <h3>Sectors, segment area and perimeter</h3>
          <p>A <b>sector</b> is a pizza-slice bounded by two radii and an arc. A <b>segment</b>
          is the cap between a chord and that arc, so subtract the isosceles triangle from
          the sector.</p>
          ${this.readout([
            ["Sector area", `Aₛ = θ/360 × πr² = ${fmt(angle)}/360 × ${fmt(area)} = <b>${fmt(sector)} units²</b>`],
            ["Sector perimeter", `Pₛ = 2r + arc = 2 × ${fmt(r)} + ${fmt(arc)} = <b>${fmt(2 * r + arc)} units</b>`],
            ["Triangle in sector", `½r²sinθ = ½ × ${fmt(r)}² × sin(${fmt(angle)}°) = <b>${fmt(triangle)} units²</b>`],
            ["Minor segment area", `Asegment = Aₛ − Atriangle = ${fmt(sector)} − ${fmt(triangle)} = <b>${fmt(segment)} units²</b>`],
          ])}
          <p class="course-hint"><b>Radians shortcut:</b> sector area = ½r²θ and triangle area
          = ½r²sinθ, where θ is in radians. The major region is the full circle minus the
          minor region.</p>
          ${derivationButton("sector-segment")}
        </div>`;
      case "line-circle":
        return this.lineCircleContent(r, offset);
      case "two-circles":
        return this.twoCirclesContent(r, separation);
      case "tangents":
        return this.tangentContent(r, separation);
    }
  }

  private lineCircleContent(r: number, k: number): string {
    const inside = Math.abs(k) < r;
    const tangent = Math.abs(Math.abs(k) - r) < 1e-9;
    const x = inside ? Math.sqrt(r * r - k * k) : 0;
    const count = inside ? "two" : tangent ? "one" : "no";
    return `<div class="course">
      <h3>Does a line intersect a circle?</h3>
      <p>For the circle x² + y² = r² and a horizontal line y = k, substitute y = k. The
      number under the square root decides the number of crossing points.</p>
      ${this.readout([
        ["Substitute", `x² + (${fmt(k)})² = ${fmt(r)}², so x² = ${fmt(r * r - k * k)}`],
        ["Intersection points", inside ? `x = ±√${fmt(r * r - k * k)} = ±${fmt(x)}, so <b>(${fmt(x)}, ${fmt(k)})</b> and <b>(−${fmt(x)}, ${fmt(k)})</b>` : tangent ? `<b>one point</b>: the line is tangent` : `<b>none</b>: the line misses the circle`],
        ["Classification", `|k| ${inside ? "<" : tangent ? "=" : ">"} r, therefore <b>${count} intersection${count === "one" ? "" : "s"}</b>`],
      ])}
      <p class="course-hint"><b>Any line:</b> substitute y = mx + c (or x = constant) into
      (x − a)² + (y − b)² = r². This makes ax² + bx + c = 0: discriminant &gt; 0 gives two
      intersections, = 0 a tangent, and &lt; 0 no real intersection.</p>
    </div>
    <div class="course">
      <h3>Circle equation and tangent line</h3>
      <p>A circle centred at (a, b) has equation <code>(x − a)² + (y − b)² = r²</code>.
      At a point (x₁, y₁), its tangent is perpendicular to the radius; for a centre at the
      origin its equation is <code>xx₁ + yy₁ = r²</code>.</p>
    </div>
    ${derivationButton("line-circle")}`;
  }

  private twoCirclesContent(r1: number, d: number): string {
    const r2 = r1 * 0.7;
    const meets = d >= Math.abs(r1 - r2) && d <= r1 + r2;
    const tangent = Math.abs(d - (r1 + r2)) < 1e-9 || Math.abs(d - Math.abs(r1 - r2)) < 1e-9;
    const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
    const h2 = r1 * r1 - a * a;
    const h = meets ? Math.sqrt(Math.max(0, h2)) : 0;
    const count = meets ? (tangent ? "one" : "two") : "no";
    return `<div class="course">
      <h3>Two-circle intersections</h3>
      <p>Let the centres be d apart, with radii r₁ and r₂. First compare d with the sum and
      difference of the radii; this avoids trying to calculate impossible intersections.</p>
      ${this.readout([
        ["Radii", `r₁ = ${fmt(r1)}, r₂ = ${fmt(r2)} units`],
        ["Possible crossing test", `|r₁ − r₂| = ${fmt(Math.abs(r1 - r2))} ≤ d = ${fmt(d)} ≤ r₁ + r₂ = ${fmt(r1 + r2)}`],
        ["Number of intersections", `<b>${count}</b>${count === "two" ? " (the circles cross)" : count === "one" ? " (the circles are tangent)" : " (one circle is separate or contained)"}`],
        ["If they meet", meets ? `along-centres distance a = (d² + r₁² − r₂²)/(2d) = <b>${fmt(a)}</b>; perpendicular offset h = √(r₁² − a²) = <b>${fmt(h)}</b>` : "No real h because the circles do not meet."],
      ])}
      <p class="course-hint"><b>Why it works:</b> the two intersections have the same
      x-coordinate along the line of centres. That makes two right triangles, so Pythagoras
      supplies the offset h above and below that line.</p>
      ${derivationButton("circle-intersections")}
    </div>`;
  }

  private tangentContent(r: number, d: number): string {
    const external = Math.max(d, r + 0.01);
    const tangent = Math.sqrt(external * external - r * r);
    const near = external - r;
    const far = external + r;
    return `<div class="course">
      <h3>Tangents, secants and the power of a point</h3>
      <p>A <b>tangent</b> touches once; a <b>secant</b> passes through the circle twice. From
      the same external point P, both calculations share the constant power
      OP² − r².</p>
      ${this.readout([
        ["Tangent length", `PT² = OP² − r² = ${fmt(external)}² − ${fmt(r)}² = ${fmt(external * external - r * r)}, so <b>PT = ${fmt(tangent)} units</b>`],
        ["Secant check", `external × whole = ${fmt(near)} × ${fmt(far)} = <b>${fmt(near * far)}</b>`],
        ["Power theorem", `PT² = PA × PB = <b>${fmt(external * external - r * r)}</b>`],
      ])}
      <p class="course-hint"><b>Also remember:</b> tangents from one external point have equal
      lengths. If two chords cross inside a circle, their segment products are equal:
      PA × PB = PC × PD. If two secants start outside, external × whole is equal for both.</p>
      ${derivationButton("tangent-power")}
    </div>`;
  }

  private readout(rows: [string, string][]): string {
    return `<div class="readout">${rows.map(([label, value]) => `<div><span>${label}</span> <span>${value}</span></div>`).join("")}</div>`;
  }

  private drawScene(): void {
    const r = 3;
    const theta = THREE.MathUtils.degToRad(this.values.angle);
    switch (this.chapter) {
      case "basics":
        this.drawCircle(new THREE.Vector3(), r, COL.circle);
        this.line(new THREE.Vector3(), new THREE.Vector3(r, 0, 0), COL.radius);
        this.label(new THREE.Vector3(r / 2, 0.3, 0), "r", COL.radius);
        this.line(new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0), COL.chord);
        this.label(new THREE.Vector3(0, -0.4, 0), "d = 2r", COL.chord);
        this.dot(new THREE.Vector3(), COL.point);
        break;
      case "angles":
      case "arcs-chords":
      case "regions":
        this.drawAngleDiagram(r, theta);
        break;
      case "line-circle":
        this.drawLineCircle(r);
        break;
      case "two-circles":
        this.drawTwoCircles(r);
        break;
      case "tangents":
        this.drawTangents(r);
        break;
    }
  }

  private drawAngleDiagram(r: number, theta: number): void {
    const a = new THREE.Vector3(r, 0, 0);
    const b = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0);
    const p = new THREE.Vector3(
      r * Math.cos(Math.PI + theta / 2),
      r * Math.sin(Math.PI + theta / 2),
      0,
    );
    this.drawCircle(new THREE.Vector3(), r, COL.circle);
    this.line(new THREE.Vector3(), a, COL.radius);
    this.line(new THREE.Vector3(), b, COL.radius);
    this.line(a, b, COL.chord);
    this.drawArc(new THREE.Vector3(), 0, theta, r, COL.arc);
    this.label(a.clone().multiplyScalar(1.16), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.16), "B", COL.point);
    this.label(new THREE.Vector3(r * 0.75 * Math.cos(theta / 2), r * 0.75 * Math.sin(theta / 2), 0), "θ", COL.arc);
    if (this.chapter === "angles") {
      this.line(a, p, COL.chord);
      this.line(b, p, COL.chord);
      this.drawAngleArc(p, a, b, 0.65, COL.chord);
      const angleBisector = a.clone().sub(p).normalize().add(b.clone().sub(p).normalize()).normalize();
      this.label(p.clone().addScaledVector(angleBisector, 1.05), `${fmt(this.values.angle / 2)}°`, COL.chord);
      this.label(p.clone().multiplyScalar(1.15), "P", COL.point);
      this.dot(p, COL.point);
    }
    if (this.chapter === "regions") {
      const points = [new THREE.Vector2(0, 0)];
      for (let i = 0; i <= 40; i++) points.push(new THREE.Vector2(r * Math.cos((theta * i) / 40), r * Math.sin((theta * i) / 40)));
      const shape = new THREE.Shape(points);
      this.group.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: COL.arc, transparent: true, opacity: 0.2, side: THREE.DoubleSide })));
    }
  }

  private drawLineCircle(r: number): void {
    const k = THREE.MathUtils.clamp((this.values.offset / this.values.radius) * r, -4.5, 4.5);
    this.drawCircle(new THREE.Vector3(), r, COL.circle);
    this.line(new THREE.Vector3(-5, k, 0), new THREE.Vector3(5, k, 0), COL.line);
    if (Math.abs(k) <= r) {
      const x = Math.sqrt(Math.max(0, r * r - k * k));
      this.dot(new THREE.Vector3(x, k, 0), COL.point);
      this.dot(new THREE.Vector3(-x, k, 0), COL.point);
    }
    this.line(new THREE.Vector3(), new THREE.Vector3(0, k, 0), COL.radius);
    this.label(new THREE.Vector3(3.6, k + 0.3, 0), "y = k", COL.line);
  }

  private drawTwoCircles(r1: number): void {
    const r2 = r1 * 0.7;
    const scale = r1 / this.values.radius;
    const d = THREE.MathUtils.clamp(this.values.separation * scale, 0.1, 7);
    const centre2 = new THREE.Vector3(d, 0, 0);
    this.drawCircle(new THREE.Vector3(), r1, COL.circle);
    this.drawCircle(centre2, r2, COL.arc);
    this.dot(new THREE.Vector3(), COL.point);
    this.dot(centre2, COL.point);
    this.line(new THREE.Vector3(), centre2, 0x8b949e);
    this.label(new THREE.Vector3(d / 2, -0.35, 0), "d", 0x8b949e);
    if (d >= Math.abs(r1 - r2) && d <= r1 + r2) {
      const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
      const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
      this.dot(new THREE.Vector3(a, h, 0), COL.chord);
      this.dot(new THREE.Vector3(a, -h, 0), COL.chord);
    }
  }

  private drawTangents(r: number): void {
    const d = Math.max((this.values.separation / this.values.radius) * r, r + 0.2);
    const p = new THREE.Vector3(d, 0, 0);
    const alpha = Math.acos(r / d);
    const t1 = new THREE.Vector3(r * Math.cos(alpha), r * Math.sin(alpha), 0);
    const t2 = new THREE.Vector3(r * Math.cos(alpha), -r * Math.sin(alpha), 0);
    this.drawCircle(new THREE.Vector3(), r, COL.circle);
    this.line(p, t1, COL.line);
    this.line(p, t2, COL.line);
    this.line(new THREE.Vector3(), t1, COL.radius);
    this.line(new THREE.Vector3(), t2, COL.radius);
    this.dot(p, COL.point);
    this.label(p.clone().add(new THREE.Vector3(0.3, 0.3, 0)), "P", COL.point);
    this.label(t1.clone().add(new THREE.Vector3(0.25, 0.25, 0)), "T₁", COL.line);
    this.label(t2.clone().add(new THREE.Vector3(0.25, -0.35, 0)), "T₂", COL.line);
  }

  private drawCircle(centre: THREE.Vector3, radius: number, color: number): void {
    const points = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(centre.x + radius * Math.cos(a), centre.y + radius * Math.sin(a), 0);
    });
    this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color })));
  }

  private drawArc(centre: THREE.Vector3, start: number, sweep: number, radius: number, color: number): void {
    const points = Array.from({ length: 33 }, (_, i) => {
      const a = start + (sweep * i) / 32;
      return new THREE.Vector3(centre.x + radius * Math.cos(a), centre.y + radius * Math.sin(a), 0);
    });
    this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color })));
  }

  private drawAngleArc(vertex: THREE.Vector3, first: THREE.Vector3, second: THREE.Vector3, radius: number, color: number): void {
    const start = Math.atan2(first.y - vertex.y, first.x - vertex.x);
    let sweep = Math.atan2(second.y - vertex.y, second.x - vertex.x) - start;
    while (sweep <= -Math.PI) sweep += Math.PI * 2;
    while (sweep > Math.PI) sweep -= Math.PI * 2;
    this.drawArc(vertex, start, sweep, radius, color);
  }

  private line(a: THREE.Vector3, b: THREE.Vector3, color: number): void {
    this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color })));
  }

  private dot(position: THREE.Vector3, color: number): void {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color }));
    dot.position.copy(position);
    this.group.add(dot);
  }

  private label(position: THREE.Vector3, value: string, color: number): void {
    const label = textSprite(value, color, 0.34);
    label.position.copy(position);
    this.group.add(label);
  }

  private disposeChildren(group: THREE.Group): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => this.disposeMaterial(item));
      else if (material) this.disposeMaterial(material);
    });
    group.clear();
  }

  private disposeMaterial(material: THREE.Material): void {
    (material as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    material.dispose();
  }
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, "") : "undefined";
}
