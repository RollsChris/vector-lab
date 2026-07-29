import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { derivationButton } from "../core/FormulaDerivations";
import { textSprite } from "./helpers";
import "./formulaDerivations/circle";

type Chapter =
  | "basics"
  | "angles"
  | "arcs"
  | "chords"
  | "regions"
  | "line-circle"
  | "two-circles"
  | "tangents";

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: "basics", label: "1 · Basics" },
  { id: "angles", label: "2 · Angles" },
  { id: "arcs", label: "3 · Arcs" },
  { id: "chords", label: "4 · Chords" },
  { id: "regions", label: "5 · Sectors & segments" },
  { id: "line-circle", label: "6 · Line intersections" },
  { id: "two-circles", label: "7 · Two circles" },
  { id: "tangents", label: "8 · Tangents & secants" },
];

const COL = {
  circle: 0x58a6ff,
  radius: 0xffd166,
  arc: 0xd2a8ff,
  chord: 0x7ee787,
  line: 0xffa657,
  point: 0xff7b72,
  triangle: 0xffa657,
  segment: 0xd2a8ff,
  major: 0x8b949e,
};

const HEX = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

/** Draggable control points, one per quantity a chapter lets you change by hand. */
type HandleKind = "radius" | "angle" | "chord-a" | "chord-b" | "chord-mid" | "offset" | "separation";

const WORLD_SCALE = 0.75;
const MIN_WORLD_R = 1.2;
const MAX_WORLD_R = 5;

const HANDLE_HINT: Record<Exclude<Chapter, never>, string> = {
  basics: "Drag the yellow point on the edge to resize the circle.",
  angles: "Drag point <b>B</b> around the edge to change θ, or the yellow edge point to resize.",
  arcs: "Drag point <b>B</b> around the edge to sweep the arc, or the yellow edge point to resize.",
  chords: "Drag <b>A</b> or <b>B</b> anywhere around the circle — the chord rotates as well as opens. Drag the orange midpoint <b>M</b> to carry the whole chord to any position, in or out from the centre.",
  regions: "Drag point <b>B</b> to open and close the sector.",
  "line-circle": "Drag the orange point on the line up and down to move it through the circle.",
  "two-circles": "Drag the second circle's centre to change the separation d.",
  tangents: "Drag the external point <b>P</b> to move it nearer or further from the circle.",
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
    chordPosition: 0,
  };

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private handles: THREE.Object3D[] = [];
  private dragging: HandleKind | undefined;
  private dragFrame = 0;

  private readonly onPointerDown = (event: PointerEvent): void => {
    const kind = this.pickHandle(event);
    if (!kind) return;
    this.dragging = kind;
    if (this.viewport) {
      this.viewport.controls.enabled = false;
      this.viewport.renderer.domElement.setPointerCapture(event.pointerId);
      this.viewport.renderer.domElement.style.cursor = "grabbing";
    }
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      if (this.viewport) {
        this.viewport.renderer.domElement.style.cursor = this.pickHandle(event) ? "grab" : "";
      }
      return;
    }
    const point = this.pointerOnPlane(event);
    if (!point) return;
    this.applyDrag(this.dragging, point);
    if (this.dragFrame) return;
    this.dragFrame = requestAnimationFrame(() => {
      this.dragFrame = 0;
      this.rebuild();
    });
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = undefined;
    if (this.viewport) {
      this.viewport.controls.enabled = true;
      this.viewport.renderer.domElement.releasePointerCapture?.(event.pointerId);
      this.viewport.renderer.domElement.style.cursor = "";
    }
    this.rebuild();
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
    const canvas = ctx.viewport.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown, true);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    this.rebuild();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.infoHandler);
    document.getElementById("info")?.removeEventListener("change", this.infoHandler);
    if (this.viewport) {
      const canvas = this.viewport.renderer.domElement;
      canvas.removeEventListener("pointerdown", this.onPointerDown, true);
      canvas.removeEventListener("pointermove", this.onPointerMove);
      canvas.removeEventListener("pointerup", this.onPointerUp);
      canvas.removeEventListener("pointercancel", this.onPointerUp);
      canvas.style.cursor = "";
      this.viewport.controls.enabled = true;
    }
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
    this.dragFrame = 0;
    this.dragging = undefined;
    this.handles = [];
    this.disposeChildren(this.group);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.viewport = undefined;
  }

  /** Screen pointer to a point on the z = 0 lesson plane. */
  private pointerOnPlane(event: PointerEvent): THREE.Vector3 | undefined {
    if (!this.viewport) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const target = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.dragPlane, target) ? target : undefined;
  }

  private pickHandle(event: PointerEvent): HandleKind | undefined {
    if (!this.viewport || this.handles.length === 0) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const hit = this.raycaster.intersectObjects(this.handles, false)[0];
    return hit ? (hit.object.userData.handle as HandleKind) : undefined;
  }

  /** Convert a dragged world position back into the lesson's own quantities. */
  private applyDrag(kind: HandleKind, point: THREE.Vector3): void {
    const world = this.worldRadius();
    const perWorldUnit = this.values.radius / world;
    switch (kind) {
      case "radius": {
        const distance = THREE.MathUtils.clamp(Math.hypot(point.x, point.y), MIN_WORLD_R, MAX_WORLD_R);
        this.values.radius = distance / WORLD_SCALE;
        break;
      }
      case "angle": {
        const degrees = THREE.MathUtils.radToDeg(Math.atan2(point.y, point.x));
        this.values.angle = degrees < 0 ? degrees + 360 : degrees;
        break;
      }
      case "chord-a":
      case "chord-b": {
        // Move one endpoint and hold the other, so the chord both rotates and resizes.
        const dragged = wrap360(THREE.MathUtils.radToDeg(Math.atan2(point.y, point.x)));
        const fixed = kind === "chord-a" ? this.chordEndAngles().b : this.chordEndAngles().a;
        const sweep = kind === "chord-a" ? wrap360(fixed - dragged) : wrap360(dragged - fixed);
        this.values.angle = sweep;
        this.values.chordPosition = wrap360(kind === "chord-a" ? dragged + sweep / 2 : fixed + sweep / 2);
        break;
      }
      case "chord-mid": {
        // The midpoint carries the chord bodily: its direction sets where the chord sits,
        // its distance from the centre sets how wide the chord is.
        const distance = THREE.MathUtils.clamp(Math.hypot(point.x, point.y) / world, 0, 1);
        this.values.angle = THREE.MathUtils.radToDeg(2 * Math.acos(distance));
        if (Math.hypot(point.x, point.y) > 1e-4) {
          this.values.chordPosition = wrap360(THREE.MathUtils.radToDeg(Math.atan2(point.y, point.x)));
        }
        break;
      }
      case "offset":
        this.values.offset = point.y * perWorldUnit;
        break;
      case "separation":
        this.values.separation = Math.hypot(point.x, point.y) * perWorldUnit;
        break;
    }
    this.normaliseValues();
  }

  /** Where the chord's two endpoints currently sit, in degrees around the circle. */
  private chordEndAngles(): { a: number; b: number } {
    const half = this.values.angle / 2;
    return {
      a: wrap360(this.values.chordPosition - half),
      b: wrap360(this.values.chordPosition + half),
    };
  }

  /** The circle's on-screen radius, so dragging the edge visibly resizes it. */
  private worldRadius(): number {
    return THREE.MathUtils.clamp(this.values.radius * WORLD_SCALE, MIN_WORLD_R, MAX_WORLD_R);
  }

  private normaliseValues(): void {
    this.values.radius = round3(THREE.MathUtils.clamp(this.values.radius, 0.1, 100));
    this.values.angle = round3(THREE.MathUtils.clamp(this.values.angle, 1, 359));
    this.values.offset = round3(THREE.MathUtils.clamp(this.values.offset, -100, 100));
    this.values.separation = round3(THREE.MathUtils.clamp(this.values.separation, 0.1, 200));
    this.values.chordPosition = round3(wrap360(this.values.chordPosition));
  }

  private rebuild(): void {
    this.disposeChildren(this.group);
    this.handles = [];
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
        <p class="course-hint" data-circle-drag-hint><b>Drag the diagram:</b> ${HANDLE_HINT[this.chapter]}
        The numbers below follow whatever you drag, and typing in them moves the diagram.</p>
        <div class="circle-inputs">
          ${this.input("radius", "Radius r", "units", 0.1)}
          ${this.input("angle", "Central angle θ", "°", 1)}
          ${this.chapter === "chords" ? this.input("chordPosition", "Chord position φ", "°", 1) : ""}
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
      <input data-circle-input="${key}" type="number" min="${key === "offset" ? -100 : key === "chordPosition" ? 0 : 0.1}" step="${step}" value="${this.values[key]}" />
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
      case "arcs":
        return `<div class="course">
          <h3>Arc length</h3>
          <p>An <b>arc</b> is part of the circle's edge: the curved distance between two points
          on the circumference. Its length is simply the same fraction of the circumference as
          its angle is of a full turn.</p>
          <ol class="deriv">
            <li><b class="step-title">Start with one full turn</b>A complete circle is
            <b>360°</b> (or <b>2π radians</b>) around, and its circumference is <b>2πr</b>.</li>
            <li><b class="step-title">Take the same fraction of both</b>This angle is
            θ/(2π) of a full turn, so its arc is
            s = θ/(2π) × 2πr = <b>rθ</b>.</li>
            <li><b class="step-title">Use the values</b>
            s = (${fmt(angle)}°/360°) × 2π × ${fmt(r)} =
            ${fmt(angle / 360)} × ${fmt(circumference)} = <b>${fmt(arc)} units</b>.
            The identical radians route is s = ${fmt(r)} × ${fmt(theta)}.</li>
          </ol>
          ${this.readout([
            ["Arc length (radians)", `s = rθ = ${fmt(r)} × ${fmt(theta)} = <b>${fmt(arc)} units</b>`],
            ["Arc length (degrees)", `s = θ/360 × 2πr = ${fmt(angle)}/360 × ${fmt(circumference)} = <b>${fmt(arc)} units</b>`],
            ["Major arc", `C − s = ${fmt(circumference)} − ${fmt(arc)} = <b>${fmt(circumference - arc)} units</b>`],
          ])}
          <p class="course-hint"><b>Radians only for s = rθ.</b> Using degrees directly in that
          formula is the most common mistake: ${fmt(angle)} × ${fmt(r)} would be wrong.</p>
          <p class="course-hint"><b>Reverse it:</b> if you know the arc and radius, the angle is
          θ = s/r radians. If you know the arc and angle, the radius is r = s/θ.</p>
          ${derivationButton("arc-length")}
        </div>`;
      case "chords":
        return `<div class="course">
          <h3>What a chord is</h3>
          <p>A <b>chord</b> is a straight line joining any two points on the circle. It is the
          direct shortcut between the two ends of an arc, so a chord is always
          <em>shorter</em> than its arc. The <b>diameter</b> is the special case: the longest
          possible chord, because it passes through the centre.</p>
          <p>Here the chord AB spans a central angle of ${fmt(angle)}°, while its arc measures
          ${fmt(arc)} units.</p>
          <p class="course-hint"><b>Position does not matter.</b> Spin the chord to the top,
          bottom or any other part of the circle (φ = ${fmt(this.values.chordPosition)}° here)
          and its length never changes. Chord length depends only on the radius and the angle
          it subtends — which is exactly why equal angles give equal chords.</p>
        </div>
        <div class="course">
          <h3>Method 1 — chord from the central angle</h3>
          <p>Drop a perpendicular from the centre O to the chord AB. That perpendicular
          <b>bisects the chord</b> and <b>bisects the angle</b>, splitting the isosceles
          triangle OAB into two identical right triangles.</p>
          <ol class="deriv">
            <li><b class="step-title">Split the triangle</b>Each right triangle has hypotenuse
            r = ${fmt(r)} (a radius) and angle θ/2 = ${fmt(angle / 2)}° at the centre.</li>
            <li><b class="step-title">Take the sine</b>The side opposite θ/2 is half the chord,
            so sin(θ/2) = (c/2)/r.</li>
            <li><b class="step-title">Rearrange</b>c/2 = r sin(θ/2), therefore
            <b>c = 2r sin(θ/2)</b>.</li>
            <li><b class="step-title">Substitute</b>c = 2 × ${fmt(r)} × sin(${fmt(angle / 2)}°)
            = 2 × ${fmt(r)} × ${fmt(Math.sin(theta / 2))} = <b>${fmt(chord)} units</b>.</li>
          </ol>
          ${derivationButton("chord-length")}
        </div>
        <div class="course">
          <h3>Method 2 — chord from its distance to the centre</h3>
          <p>If you know how far the chord sits from the centre (call it d) instead of the
          angle, use Pythagoras on the same right triangle: the radius is the hypotenuse, d is
          one leg, and half the chord is the other.</p>
          <ol class="deriv">
            <li><b class="step-title">Write Pythagoras</b>(c/2)² + d² = r².</li>
            <li><b class="step-title">Isolate the half-chord</b>c/2 = √(r² − d²).</li>
            <li><b class="step-title">Double it</b><b>c = 2√(r² − d²)</b>.</li>
            <li><b class="step-title">Check against method 1</b>Here d = r cos(θ/2) =
            ${fmt(centreToChord)}, so c = 2√(${fmt(r)}² − ${fmt(centreToChord)}²) =
            <b>${fmt(2 * Math.sqrt(Math.max(0, r * r - centreToChord * centreToChord)))} units</b>
            — the same answer.</li>
          </ol>
          ${this.readout([
            ["Chord length", `c = 2r sin(θ/2) = 2 × ${fmt(r)} × sin(${fmt(angle / 2)}°) = <b>${fmt(chord)} units</b>`],
            ["Half chord", `c/2 = <b>${fmt(chord / 2)} units</b>`],
            ["Distance centre to chord", `d = r cos(θ/2) = ${fmt(r)} × cos(${fmt(angle / 2)}°) = <b>${fmt(centreToChord)} units</b>`],
            ["Chord from distance", `c = 2√(r² − d²) = <b>${fmt(2 * Math.sqrt(Math.max(0, r * r - centreToChord * centreToChord)))} units</b>`],
            ["Arc − chord", `${fmt(arc)} − ${fmt(chord)} = <b>${fmt(arc - chord)} units</b> (the curve is longer)`],
          ])}
        </div>
        <div class="course">
          <h3>Working backwards</h3>
          <p>Each formula can be reversed when a different quantity is unknown.</p>
          ${this.readout([
            ["Angle from chord", `θ = 2sin⁻¹(c/(2r)) = 2sin⁻¹(${fmt(chord)}/${fmt(2 * r)}) = <b>${fmt(angle)}°</b>`],
            ["Radius from chord and distance", `r = √((c/2)² + d²) = √(${fmt(chord / 2)}² + ${fmt(centreToChord)}²) = <b>${fmt(r)} units</b>`],
            ["Distance from chord and radius", `d = √(r² − (c/2)²) = <b>${fmt(centreToChord)} units</b>`],
          ])}
        </div>
        <div class="course">
          <h3>Chord rules worth knowing</h3>
          <ul>
            <li><b>The perpendicular from the centre bisects the chord</b> — and the reverse is
            also true: the perpendicular bisector of any chord passes through the centre. This
            is how you find the centre of a circle from an arc: draw two chords and cross their
            perpendicular bisectors.</li>
            <li><b>Equal chords are equidistant from the centre</b>, and cut off equal arcs.
            Conversely, chords the same distance from the centre are equal in length.</li>
            <li><b>The closer a chord is to the centre, the longer it is.</b> At d = 0 it
            becomes the diameter, ${fmt(2 * r)} units; as d approaches r the chord shrinks to
            nothing.</li>
            <li><b>Intersecting chords:</b> if two chords cross inside a circle at P, the
            products of their pieces are equal: <code>PA × PB = PC × PD</code>.</li>
            <li><b>Tangent-chord angle:</b> the angle between a tangent and a chord equals the
            inscribed angle in the alternate segment.</li>
          </ul>
          <p class="course-hint"><b>Worked example:</b> a circle of radius 10 has a chord 6
          units from the centre. Then c = 2√(10² − 6²) = 2√64 = 2 × 8 = <b>16 units</b>.</p>
        </div>`;
      case "regions":
        return `<div class="course">
          <h3>Sectors, segment area and perimeter</h3>
          <p>A <b>sector</b> is a pizza-slice bounded by two radii and an arc. Cut a straight
          chord across it and the sector splits into exactly two pieces: the
          <b>triangle</b> OAB and the <b>segment</b> cap. That is the whole idea behind the
          segment formula.</p>
          <p class="region-identity"><b>sector = triangle + segment</b>, so
          segment = sector − triangle.</p>
          <div class="region-legend">
            <span><i style="background:${HEX(COL.triangle)}"></i> Triangle OAB — two radii and the chord, area ½r²sinθ = <b>${fmt(triangle)} units²</b></span>
            <span><i style="background:${HEX(COL.segment)}"></i> Segment — between the chord and the arc, area <b>${fmt(segment)} units²</b></span>
            <span><i style="background:${HEX(COL.major)}"></i> Major region — the rest of the circle, area <b>${fmt(area - sector)} units²</b></span>
          </div>
          <p class="course-hint"><b>Yes — ½r²sinθ is the triangle's area.</b> It is the standard
          "two sides and the included angle" triangle formula, ½ab·sinC, with both sides equal
          to the radius: ½ × r × r × sinθ. It is <em>not</em> the area of the curved slice.</p>
          ${this.readout([
            ["Sector area (curved slice)", `Aₛ = θ/360 × πr² = ${fmt(angle)}/360 × ${fmt(area)} = <b>${fmt(sector)} units²</b>`],
            ["Triangle OAB", `½r²sinθ = ½ × ${fmt(r)}² × sin(${fmt(angle)}°) = <b>${fmt(triangle)} units²</b>`],
            ["Minor segment area", `Asegment = Aₛ − Atriangle = ${fmt(sector)} − ${fmt(triangle)} = <b>${fmt(segment)} units²</b>`],
            ["Check", `triangle + segment = ${fmt(triangle)} + ${fmt(segment)} = <b>${fmt(triangle + segment)} units²</b> = the sector`],
            ["Sector perimeter", `Pₛ = 2r + arc = 2 × ${fmt(r)} + ${fmt(arc)} = <b>${fmt(2 * r + arc)} units</b>`],
            ["Segment perimeter", `chord + arc = ${fmt(chord)} + ${fmt(arc)} = <b>${fmt(chord + arc)} units</b>`],
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
    const r = this.worldRadius();
    const theta = THREE.MathUtils.degToRad(this.values.angle);
    switch (this.chapter) {
      case "basics":
        this.drawCircle(new THREE.Vector3(), r, COL.circle);
        this.line(new THREE.Vector3(), new THREE.Vector3(r, 0, 0), COL.radius);
        this.label(new THREE.Vector3(r / 2, 0.3, 0), `r = ${fmt(this.values.radius)}`, COL.radius);
        this.line(new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0), COL.chord);
        this.label(new THREE.Vector3(0, -0.4, 0), `d = ${fmt(2 * this.values.radius)}`, COL.chord);
        this.dot(new THREE.Vector3(), COL.point);
        this.handle(new THREE.Vector3(r, 0, 0), COL.radius, "radius");
        break;
      case "angles":
      case "arcs":
        this.drawAngleDiagram(r, theta);
        break;
      case "regions":
        this.drawRegionDiagram(r, theta);
        break;
      case "chords":
        this.drawChordDiagram(r, theta);
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
    this.label(new THREE.Vector3(r * 0.75 * Math.cos(theta / 2), r * 0.75 * Math.sin(theta / 2), 0), `θ = ${fmt(this.values.angle)}°`, COL.arc);
    this.handle(b, COL.point, "angle");
    this.handle(a, COL.radius, "radius");
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

  /**
   * Sectors and segments, shaded so the identity sector = triangle + segment is visible:
   * the triangle OAB and the segment cap are filled in different colours and never overlap.
   */
  private drawRegionDiagram(r: number, theta: number): void {
    const a = new THREE.Vector3(r, 0, 0);
    const b = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0);
    const arcPoint = (t: number): THREE.Vector2 =>
      new THREE.Vector2(r * Math.cos(theta * t), r * Math.sin(theta * t));

    // The major region: everything outside the sector, shaded faintly for contrast.
    const majorPoints = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 96; i++) {
      const angle = theta + ((Math.PI * 2 - theta) * i) / 96;
      majorPoints.push(new THREE.Vector2(r * Math.cos(angle), r * Math.sin(angle)));
    }
    this.fillShape(majorPoints, COL.major, 0.1);

    // The segment: the cap between the chord AB and the arc.
    const segmentPoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 48; i++) segmentPoints.push(arcPoint(i / 48));
    this.fillShape(segmentPoints, COL.segment, 0.42);

    // The triangle OAB, whose area is the ½r²sinθ term.
    this.fillShape([new THREE.Vector2(0, 0), new THREE.Vector2(a.x, a.y), new THREE.Vector2(b.x, b.y)], COL.triangle, 0.34);

    this.drawCircle(new THREE.Vector3(), r, COL.circle);
    this.drawArc(new THREE.Vector3(), 0, theta, r, COL.segment);
    this.line(new THREE.Vector3(), a, COL.radius);
    this.line(new THREE.Vector3(), b, COL.radius);
    this.line(a, b, COL.triangle);
    this.dot(new THREE.Vector3(), COL.point);
    this.handle(b, COL.point, "angle");
    this.handle(a, COL.radius, "radius");

    const mid = (theta / 2);
    this.label(a.clone().multiplyScalar(1.16), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.16), "B", COL.point);
    this.label(new THREE.Vector3(r * 0.3 * Math.cos(mid), r * 0.3 * Math.sin(mid), 0), `θ = ${fmt(this.values.angle)}°`, COL.arc);
    this.label(new THREE.Vector3(r * 0.62 * Math.cos(mid), r * 0.62 * Math.sin(mid), 0), "triangle", COL.triangle);
    this.label(new THREE.Vector3(r * 0.93 * Math.cos(mid), r * 0.93 * Math.sin(mid), 0), "segment", COL.segment);
    this.label(new THREE.Vector3(r * 0.75 * Math.cos(mid + Math.PI), r * 0.75 * Math.sin(mid + Math.PI), 0), "major region", COL.major);
  }

  private fillShape(points: THREE.Vector2[], color: number, opacity: number): void {
    if (points.length < 3) return;
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(new THREE.Shape(points)),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.group.add(mesh);
  }

  private drawChordDiagram(r: number, theta: number): void {
    const phi = THREE.MathUtils.degToRad(this.values.chordPosition);
    const angleA = phi - theta / 2;
    const angleB = phi + theta / 2;
    const a = new THREE.Vector3(r * Math.cos(angleA), r * Math.sin(angleA), 0);
    const b = new THREE.Vector3(r * Math.cos(angleB), r * Math.sin(angleB), 0);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const centre = new THREE.Vector3();
    const outward = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0);

    this.drawCircle(centre, r, COL.circle);
    this.drawArc(centre, angleA, theta, r, COL.arc);
    this.line(centre, a, COL.radius);
    this.line(centre, b, COL.radius);
    this.line(a, b, COL.chord);
    this.line(centre, mid, COL.line);
    this.dot(centre, COL.point);
    this.handle(a, COL.point, "chord-a");
    this.handle(b, COL.point, "chord-b");
    this.handle(mid, COL.line, "chord-mid");

    this.label(a.clone().multiplyScalar(1.16), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.16), "B", COL.point);
    this.label(mid.clone().addScaledVector(outward, 0.4), "M", COL.line);
    this.label(centre.clone().addScaledVector(outward, -0.45), "O", COL.point);
    this.label(mid.clone().multiplyScalar(0.5).addScaledVector(perpendicular(outward), 0.34), `d = ${fmt(this.values.radius * Math.cos(theta / 2))}`, COL.line);
    this.label(b.clone().add(mid).multiplyScalar(0.5).addScaledVector(outward, 0.42), `c = ${fmt(2 * this.values.radius * Math.sin(theta / 2))}`, COL.chord);
    this.label(new THREE.Vector3(r * 0.42 * Math.cos(phi - theta / 4), r * 0.42 * Math.sin(phi - theta / 4), 0), "θ/2", COL.arc);
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
    this.label(new THREE.Vector3(3.6, k + 0.3, 0), `y = k = ${fmt(this.values.offset)}`, COL.line);
    this.handle(new THREE.Vector3(0, k, 0), COL.line, "offset");
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
    this.label(new THREE.Vector3(d / 2, -0.35, 0), `d = ${fmt(this.values.separation)}`, 0x8b949e);
    this.handle(centre2, COL.arc, "separation");
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
    this.handle(p, COL.point, "separation");
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

  /** A grabbable point: a larger dot inside a halo ring so it reads as draggable. */
  private handle(position: THREE.Vector3, color: number, kind: HandleKind): void {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 20), new THREE.MeshBasicMaterial({ color }));
    knob.position.copy(position);
    knob.userData.handle = kind;
    this.group.add(knob);
    this.handles.push(knob);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.27, 0.34, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    halo.position.copy(position);
    this.group.add(halo);
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

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Fold any angle in degrees into the 0–360 range. */
function wrap360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function perpendicular(direction: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(-direction.y, direction.x, 0);
}
