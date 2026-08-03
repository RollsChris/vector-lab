import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { textSprite } from "./helpers";

type TermId =
  | "centre-radius"
  | "circumference"
  | "chord"
  | "arc"
  | "central-angle"
  | "inscribed-angle"
  | "sector"
  | "segment"
  | "same-segment"
  | "tangent"
  | "secant"
  | "cyclic-quad"
  | "power";

interface Term {
  id: TermId;
  label: string;
  group: "Parts" | "Angles" | "Regions" | "Lines" | "Theorems";
  short: string;
}

const TERMS: readonly Term[] = [
  { id: "centre-radius", label: "Centre, radius, diameter", group: "Parts", short: "O, r, d = 2r" },
  { id: "circumference", label: "Circumference", group: "Parts", short: "C = 2πr" },
  { id: "chord", label: "Chord", group: "Parts", short: "straight AB on the rim" },
  { id: "arc", label: "Arc (minor / major)", group: "Parts", short: "curved rim between A and B" },
  { id: "central-angle", label: "Central angle", group: "Angles", short: "θ at the centre" },
  { id: "inscribed-angle", label: "Inscribed angle", group: "Angles", short: "angle on the rim" },
  { id: "sector", label: "Sector", group: "Regions", short: "pizza slice" },
  { id: "segment", label: "Segment (area)", group: "Regions", short: "cap between chord & arc" },
  { id: "same-segment", label: "Angles in the same segment", group: "Angles", short: "same arc ⇒ equal angles" },
  { id: "tangent", label: "Tangent", group: "Lines", short: "touches once" },
  { id: "secant", label: "Secant", group: "Lines", short: "cuts twice" },
  { id: "cyclic-quad", label: "Cyclic quadrilateral", group: "Theorems", short: "four points on a circle" },
  { id: "power", label: "Power of a point", group: "Theorems", short: "a·b = c·d products" },
];

const GROUPS = ["Parts", "Angles", "Regions", "Lines", "Theorems"] as const;

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
  accent: 0x79c0ff,
  mute: 0x6e7681,
};

const HEX = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

const R = 3.4;
const THETA = (2 * Math.PI) / 3; // 120°

/**
 * Visual dictionary of circle language. Each term gets a labelled diagram so words like
 * "segment" (area) and "same segment" (angles) stop colliding.
 */
export class CircleGlossaryLesson implements Lesson {
  readonly id = "circle-glossary";
  readonly title = "Circle Glossary";
  readonly blurb = "Every circle word, with a diagram";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private term: TermId = "centre-radius";
  private previousRotate = true;
  private angle = THETA;
  /** Rim angle for the inscribed-angle vertex P (kept on the major arc). */
  private pAngle = Math.PI + THETA / 2;
  private handles: THREE.Object3D[] = [];
  private dragging: "angle" | "point" | undefined;
  private dragFrame = 0;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

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
    const a = Math.atan2(point.y, point.x);
    if (this.dragging === "angle") {
      let next = a;
      if (next < 0.2) next = 0.2;
      if (next > Math.PI * 1.75) next = Math.PI * 1.75;
      this.angle = next;
    } else if (this.dragging === "point") {
      // Keep P off chord AB (on the open arc opposite the minor arc 0…angle).
      let next = a < 0 ? a + Math.PI * 2 : a;
      const lo = this.angle + 0.25;
      const hi = Math.PI * 2 - 0.25;
      this.pAngle = THREE.MathUtils.clamp(next, lo, hi);
    }
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
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-glossary-term]");
    if (!button) return;
    const id = button.dataset.glossaryTerm as TermId;
    if (!TERMS.some((term) => term.id === id)) return;
    this.term = id;
    this.rebuild();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;
    document.getElementById("info")?.addEventListener("click", this.infoHandler);
    const canvas = ctx.viewport.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown, true);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    this.rebuild();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.infoHandler);
    if (this.viewport) {
      const canvas = this.viewport.renderer.domElement;
      canvas.removeEventListener("pointerdown", this.onPointerDown, true);
      canvas.removeEventListener("pointermove", this.onPointerMove);
      canvas.removeEventListener("pointerup", this.onPointerUp);
      canvas.removeEventListener("pointercancel", this.onPointerUp);
      canvas.style.cursor = "";
      this.viewport.controls.enabled = true;
      this.viewport.controls.enableRotate = this.previousRotate;
    }
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
    this.dragFrame = 0;
    this.dragging = undefined;
    this.handles = [];
    this.disposeChildren(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.viewport = undefined;
  }

  private rebuild(): void {
    this.handles = [];
    this.disposeChildren(this.group);
    this.drawTerm();
    this.renderPanel();
  }

  private renderPanel(): void {
    const current = TERMS.find((term) => term.id === this.term) ?? TERMS[0];
    const groups = GROUPS.map((group) => {
      const items = TERMS.filter((term) => term.group === group);
      return `<div class="glossary-group">
        <div class="glossary-group-title">${group}</div>
        <div class="glossary-chips">
          ${items
            .map(
              (term) => `<button type="button" class="glossary-chip${term.id === this.term ? " active" : ""}" data-glossary-term="${term.id}" title="${term.short}">
                ${term.label}
              </button>`,
            )
            .join("")}
        </div>
      </div>`;
    }).join("");

    this.setInfo(`
      <h2>Circle Glossary</h2>
      <p>Pick a word. The diagram highlights only that idea. Two meanings of
      <b>segment</b> are listed separately on purpose.</p>
      <div class="glossary-index">${groups}</div>
      <div class="course glossary-entry">
        <h3>${current.label}</h3>
        ${this.termCopy(current.id)}
        <p class="course-hint">${this.whereNext(current.id)}</p>
      </div>`);
  }

  private termCopy(id: TermId): string {
    const deg = fmt(THREE.MathUtils.radToDeg(this.angle));
    switch (id) {
      case "centre-radius":
        return `<p>The <b>centre</b> O is the fixed middle point. Every point on the circle is the
          same distance from O — that distance is the <b>radius</b> r (yellow). The
          <b>diameter</b> is any chord through O; its length is always <b>d = 2r</b>.</p>
          <div class="readout">
            <div><span>Radius</span> <span>r</span></div>
            <div><span>Diameter</span> <span>d = 2r</span></div>
          </div>`;
      case "circumference":
        return `<p>The <b>circumference</b> is the full distance around the rim — one complete
          loop. Formula: <code>C = 2πr</code> (or <code>C = πd</code>). It is a <em>length</em>,
          not an area.</p>
          <div class="readout">
            <div><span>Circumference</span> <span>C = 2πr</span></div>
            <div><span>Also</span> <span>C = πd</span></div>
          </div>`;
      case "chord":
        return `<p>A <b>chord</b> is a straight line joining two points on the circle. It is the
          shortcut under the arc. The diameter is the longest chord. Chord length depends on
          r and the central angle, not on where you spin it around the circle.</p>
          <div class="readout">
            <div><span>Definition</span> <span>straight AB with A, B on the circle</span></div>
            <div><span>Longest chord</span> <span>the diameter</span></div>
          </div>`;
      case "arc":
        return `<p>An <b>arc</b> is the curved piece of rim between two points. The shorter way
          is the <b>minor arc</b>; the long way round is the <b>major arc</b>. Arc length is a
          fraction of the circumference: <code>s = rθ</code> (θ in radians).</p>
          <div class="readout">
            <div><span>Minor arc AB</span> <span>highlighted purple</span></div>
            <div><span>Major arc AB</span> <span>the rest of the rim</span></div>
          </div>`;
      case "central-angle":
        return `<p>A <b>central angle</b> has its vertex at the centre O. Here ∠AOB = ${deg}°.
          Drag B to change it. The same fraction of the full turn appears in arc length and
          sector area: θ/360 of the circle (or θ/(2π) in radians).</p>
          <div class="readout">
            <div><span>Central angle</span> <span>∠AOB = ${deg}°</span></div>
            <div><span>Vertex</span> <span>at the centre O</span></div>
          </div>`;
      case "inscribed-angle":
        return `<p>An <b>inscribed angle</b> (angle at the circumference) has its vertex on the
          rim and sides that cut the circle again. It stands on an arc; the rule is
          <b>central angle = 2 × inscribed angle</b> when both stand on the same arc.</p>
          <div class="readout">
            <div><span>Inscribed ∠APB</span> <span>${fmt(THREE.MathUtils.radToDeg(this.angle) / 2)}° on arc AB</span></div>
            <div><span>Matching centre</span> <span>∠AOB = ${deg}° = 2 × edge</span></div>
          </div>`;
      case "sector":
        return `<p>A <b>sector</b> is the pizza slice: two radii plus the arc between them.
          Area = (θ/360) × πr², or ½r²θ in radians. Perimeter of the sector = 2r + arc.</p>
          <div class="readout">
            <div><span>Bounded by</span> <span>radius OA + radius OB + arc AB</span></div>
            <div><span>Not the same as</span> <span>the segment (cap only)</span></div>
          </div>`;
      case "segment":
        return `<p>An <b>area segment</b> is the cap between a chord and its arc. Cut the sector
          with chord AB: what remains outside the triangle is the segment.</p>
          <p class="region-identity"><b>sector = triangle + segment</b>, so
          <b>segment = sector − triangle</b>.</p>
          <div class="region-legend">
            <span><i style="background:${HEX(COL.triangle)}"></i> Triangle OAB — area ½r²sinθ</span>
            <span><i style="background:${HEX(COL.segment)}"></i> Segment — the curved cap only</span>
          </div>
          <p class="course-hint"><b>Different word, same spelling:</b> “angles in the same
          segment” (next entry) is an <em>angle</em> rule, not this area region.</p>`;
      case "same-segment":
        return `<p><b>Angles in the same segment</b> = two rim angles in the same cut-off region
          that both look at the same arc are equal.</p>
          <ol class="deriv">
            <li><b class="step-title">Draw chord AD</b> — it splits the circle into two segments
            (two “bites”).</li>
            <li><b class="step-title">Park B and C in the same bite</b> — here the upper shaded
            segment.</li>
            <li><b class="step-title">Both look at arc AD</b> — the purple arc on the far side of
            the chord (the bottom arc).</li>
            <li><b class="step-title">Conclusion</b> — <b>∠ACD = ∠ABD</b>. Move either point along
            that upper arc and the angle stays the same.</li>
          </ol>
          <div class="readout">
            <div><span>Equal angles</span> <span>∠ACD = ∠ABD</span></div>
            <div><span>Shared arc</span> <span>arc AD (purple, bottom)</span></div>
            <div><span>Same segment</span> <span>the shaded region holding B and C</span></div>
            <div><span>Not this</span> <span>area formula segment = sector − triangle</span></div>
          </div>`;
      case "tangent":
        return `<p>A <b>tangent</b> touches the circle at exactly one point T. The radius to the
          contact point is perpendicular to the tangent: <b>OT ⊥ tangent</b>. Two tangents from
          the same external point P are equal in length.</p>
          <div class="readout">
            <div><span>Contacts</span> <span>one point T</span></div>
            <div><span>Key fact</span> <span>radius ⊥ tangent at T</span></div>
          </div>`;
      case "secant":
        return `<p>A <b>secant</b> is a straight line that cuts the circle at two points. From an
          external point P, a secant through A then B gives segments PA (external) and PB
          (whole). Power of a point relates those lengths to a tangent from P.</p>
          <div class="readout">
            <div><span>Intersections</span> <span>two points A and B</span></div>
            <div><span>Contrast</span> <span>tangent touches once; secant cuts twice</span></div>
          </div>`;
      case "cyclic-quad":
        return `<p>A <b>cyclic quadrilateral</b> has all four vertices on one circle. Opposite
          angles sum to 180°: ∠A + ∠C = 180°, ∠B + ∠D = 180°. The exterior angle equals the
          opposite interior angle.</p>
          <div class="readout">
            <div><span>Definition</span> <span>ABCD all on the circle</span></div>
            <div><span>Opposite angles</span> <span>sum to 180°</span></div>
          </div>`;
      case "power":
        return `<p><b>Power of a point</b> is one idea with three pictures. Products of pieces
          cut by lines through a fixed point are equal.</p>
          <ul>
            <li><b>Inside:</b> chords AB, CD meet at X → <code>AX · XB = CX · XD</code></li>
            <li><b>Outside, two secants:</b> <code>PA · PB = PC · PD</code></li>
            <li><b>Outside, tangent + secant:</b> <code>PT² = PA · PB</code></li>
          </ul>
          <p class="course-hint">Open <b>Circle Theorems → Secants &amp; power</b> to drag these live.</p>`;
    }
  }

  private whereNext(id: TermId): string {
    switch (id) {
      case "centre-radius":
      case "circumference":
        return "Next: Circle Calculations → 1 · Basics for live numbers.";
      case "chord":
        return "Next: Circle Calculations → 4 · Chords for c = 2r sin(θ/2).";
      case "arc":
        return "Next: Circle Calculations → 3 · Arcs for s = rθ.";
      case "central-angle":
      case "inscribed-angle":
        return "Next: Circle Theorems → centre vs circumference.";
      case "sector":
      case "segment":
        return "Next: Circle Calculations → 5 · Sectors & segments.";
      case "same-segment":
        return "Next: Circle Theorems → same arc / intersecting chords proof.";
      case "tangent":
      case "secant":
      case "power":
        return "Next: Circle Theorems → Tangents and Secants & power.";
      case "cyclic-quad":
        return "Next: Circle Theorems → cyclic quadrilateral.";
    }
  }

  private drawTerm(): void {
    switch (this.term) {
      case "centre-radius":
        this.drawCentreRadius();
        break;
      case "circumference":
        this.drawCircumference();
        break;
      case "chord":
        this.drawChord();
        break;
      case "arc":
        this.drawArcTerm();
        break;
      case "central-angle":
        this.drawCentralAngle();
        break;
      case "inscribed-angle":
        this.drawInscribedAngle();
        break;
      case "sector":
        this.drawSector();
        break;
      case "segment":
        this.drawSegment();
        break;
      case "same-segment":
        this.drawSameSegment();
        break;
      case "tangent":
        this.drawTangent();
        break;
      case "secant":
        this.drawSecant();
        break;
      case "cyclic-quad":
        this.drawCyclicQuad();
        break;
      case "power":
        this.drawPower();
        break;
    }
  }

  private drawCentreRadius(): void {
    this.circle();
    this.line(v(0, 0), v(R, 0), COL.radius);
    this.line(v(-R, 0), v(R, 0), COL.chord);
    this.dot(v(0, 0), COL.point);
    this.dot(v(R, 0), COL.radius);
    this.dot(v(-R, 0), COL.chord);
    this.label(v(0, -0.45), "O", COL.point);
    this.label(v(R / 2, 0.4), "r", COL.radius);
    this.label(v(0, -0.9), "d = 2r", COL.chord);
    this.label(v(R * 1.15, 0.15), "edge", COL.circle);
  }

  private drawCircumference(): void {
    this.circle(COL.arc, 3);
    this.circle(COL.circle, 1);
    this.dot(v(0, 0), COL.point);
    this.label(v(0, -0.4), "O", COL.point);
    this.label(v(0, R * 1.2), "circumference C", COL.arc);
    // tick mark on rim
    this.dot(v(R, 0), COL.point);
    this.label(v(R * 1.2, 0.2), "start / end", COL.point);
  }

  private drawChord(): void {
    const a = polar(R, -0.7);
    const b = polar(R, 0.9);
    this.circle();
    this.line(a, b, COL.chord);
    this.drawArcLine(0, -0.7, 0.9 + 0.7, R, COL.arc);
    this.dot(a, COL.point);
    this.dot(b, COL.point);
    this.dot(v(0, 0), COL.mute);
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(a.clone().add(b).multiplyScalar(0.5).add(v(0, -0.35)), "chord AB", COL.chord);
    this.label(polar(R * 1.05, 0.1), "arc AB", COL.arc);
  }

  private drawArcTerm(): void {
    const a0 = -0.5;
    const sweep = this.angle;
    this.circle(COL.mute);
    this.drawArcLine(0, a0, sweep, R, COL.arc);
    this.drawArcLine(0, a0 + sweep, Math.PI * 2 - sweep, R * 1.0, COL.major);
    const a = polar(R, a0);
    const b = polar(R, a0 + sweep);
    this.dot(a, COL.point);
    this.dot(b, COL.point);
    this.handle(b, COL.point, "angle");
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(polar(R * 0.75, a0 + sweep / 2), "minor arc", COL.arc);
    this.label(polar(R * 0.75, a0 + sweep + (Math.PI * 2 - sweep) / 2), "major arc", COL.major);
  }

  private drawCentralAngle(): void {
    const a = polar(R, 0);
    const b = polar(R, this.angle);
    this.circle();
    this.line(v(0, 0), a, COL.radius);
    this.line(v(0, 0), b, COL.radius);
    this.drawArcLine(0, 0, this.angle, R * 0.55, COL.arc);
    this.drawArcLine(0, 0, this.angle, R, COL.arc);
    this.dot(v(0, 0), COL.point);
    this.dot(a, COL.point);
    this.handle(b, COL.point, "angle");
    this.label(v(0, -0.4), "O", COL.point);
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(polar(R * 0.35, this.angle / 2), "θ", COL.arc);
  }

  private drawInscribedAngle(): void {
    const a = polar(R, 0);
    const b = polar(R, this.angle);
    const lo = this.angle + 0.25;
    const hi = Math.PI * 2 - 0.25;
    this.pAngle = THREE.MathUtils.clamp(this.pAngle, lo, hi);
    const p = polar(R, this.pAngle);
    this.circle();
    // Radii so you can see the central angle θ at O (muted — not the main story).
    this.line(v(0, 0), a, COL.mute);
    this.line(v(0, 0), b, COL.mute);
    this.drawArcLine(0, 0, this.angle, R * 0.45, COL.arc);
    // Inscribed angle at P on the rim.
    this.line(a, p, COL.chord);
    this.line(b, p, COL.chord);
    this.drawArcLine(0, 0, this.angle, R, COL.arc);
    const markR = 0.7;
    this.drawArcLine(p, Math.atan2(a.y - p.y, a.x - p.x), angleBetween(p, a, b), markR, COL.chord);
    this.dot(v(0, 0), COL.mute);
    this.dot(a, COL.point);
    this.dot(b, COL.point);
    this.handle(p, COL.point, "point");
    this.label(v(0, -0.45), "O", COL.mute);
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(p.clone().multiplyScalar(1.18), "P", COL.point);
    // θ at the centre (central angle); ½θ at P (inscribed angle on the same arc).
    this.label(polar(R * 0.28, this.angle / 2), "θ", COL.arc);
    const bisector = a.clone().sub(p).normalize().add(b.clone().sub(p).normalize()).normalize();
    this.label(p.clone().addScaledVector(bisector, markR + 0.45), "½θ", COL.chord);
  }

  private drawSector(): void {
    const a = polar(R, 0);
    const b = polar(R, this.angle);
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 40; i++) {
      const t = (this.angle * i) / 40;
      pts.push(new THREE.Vector2(R * Math.cos(t), R * Math.sin(t)));
    }
    this.fill(pts, COL.arc, 0.28);
    this.circle();
    this.line(v(0, 0), a, COL.radius);
    this.line(v(0, 0), b, COL.radius);
    this.drawArcLine(0, 0, this.angle, R, COL.arc);
    this.dot(v(0, 0), COL.point);
    this.dot(a, COL.point);
    this.handle(b, COL.point, "angle");
    this.label(v(0, -0.4), "O", COL.point);
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(polar(R * 0.45, this.angle / 2), "sector", COL.arc);
  }

  private drawSegment(): void {
    const a = polar(R, 0);
    const b = polar(R, this.angle);
    const mid = this.angle / 2;
    const major: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 80; i++) {
      const ang = this.angle + ((Math.PI * 2 - this.angle) * i) / 80;
      major.push(new THREE.Vector2(R * Math.cos(ang), R * Math.sin(ang)));
    }
    this.fill(major, COL.major, 0.1);
    const seg: THREE.Vector2[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = (this.angle * i) / 48;
      seg.push(new THREE.Vector2(R * Math.cos(t), R * Math.sin(t)));
    }
    this.fill(seg, COL.segment, 0.45);
    this.fill(
      [new THREE.Vector2(0, 0), new THREE.Vector2(a.x, a.y), new THREE.Vector2(b.x, b.y)],
      COL.triangle,
      0.32,
    );
    this.circle();
    this.line(v(0, 0), a, COL.radius);
    this.line(v(0, 0), b, COL.radius);
    this.line(a, b, COL.triangle);
    this.drawArcLine(0, 0, this.angle, R, COL.segment);
    this.dot(v(0, 0), COL.point);
    this.dot(a, COL.point);
    this.handle(b, COL.point, "angle");
    this.label(a.clone().multiplyScalar(1.18), "A", COL.point);
    this.label(b.clone().multiplyScalar(1.18), "B", COL.point);
    this.label(polar(R * 0.55, mid), "triangle", COL.triangle);
    this.label(polar(R * 0.92, mid), "segment", COL.segment);
  }

  private drawSameSegment(): void {
    // Textbook layout: chord AD along the bottom; B and C both on the upper arc.
    // Both ∠ACD and ∠ABD stand on the same lower arc AD → equal.
    const aAng = Math.PI + 0.85; // lower-left
    const dAng = -0.85; // lower-right (≡ 2π - 0.85)
    const cAng = 2.35; // upper-left
    const bAng = 0.85; // upper-right
    const A = polar(R, aAng);
    const D = polar(R, dAng);
    const C = polar(R, cAng);
    const B = polar(R, bAng);

    // Minor arc AD goes the short way along the bottom (from aAng down to dAng through -π…0).
    // Sweep from aAng forward to dAng+2π so we stay continuous.
    const arcStart = aAng;
    const arcSweep = dAng + Math.PI * 2 - aAng; // short bottom arc

    // The segment containing B and C is chord AD + the long upper arc D→C→B→A.
    const upperSeg: THREE.Vector2[] = [new THREE.Vector2(A.x, A.y), new THREE.Vector2(D.x, D.y)];
    const upperStart = dAng;
    const upperSweep = aAng - dAng; // from D up through top to A (positive, < 2π)
    for (let i = 1; i <= 72; i++) {
      const t = upperStart + (upperSweep * i) / 72;
      upperSeg.push(new THREE.Vector2(R * Math.cos(t), R * Math.sin(t)));
    }
    this.fill(upperSeg, COL.segment, 0.2);

    this.circle(COL.mute);
    // Shared arc AD (what both angles stand on) — bright purple along the bottom.
    this.drawArcLine(0, arcStart, arcSweep, R, COL.arc);
    this.drawArcLine(0, arcStart, arcSweep, R * 0.96, COL.arc);

    // Chord AD as the base.
    this.line(A, D, COL.chord);

    // Two separate inscribed angles — draw as two triangles, not one X-first figure.
    this.line(A, C, COL.line);
    this.line(D, C, COL.line);
    this.line(A, B, COL.triangle);
    this.line(D, B, COL.triangle);

    // Angle marks tight on the vertices.
    const markC = 0.48;
    const markB = 0.48;
    this.drawArcLine(C, Math.atan2(A.y - C.y, A.x - C.x), angleBetween(C, A, D), markC, COL.line);
    this.drawArcLine(B, Math.atan2(A.y - B.y, A.x - B.x), angleBetween(B, A, D), markB, COL.triangle);

    this.dot(A, COL.point);
    this.dot(D, COL.point);
    this.dot(C, COL.point);
    this.dot(B, COL.point);

    this.label(A.clone().add(v(-0.35, -0.35)), "A", COL.point);
    this.label(D.clone().add(v(0.35, -0.35)), "D", COL.point);
    this.label(C.clone().add(v(-0.4, 0.25)), "C", COL.point);
    this.label(B.clone().add(v(0.4, 0.25)), "B", COL.point);

    // Labels kept off each other: arc below, chord above the base, angles at vertices, segment up top.
    this.label(v(0, -R * 1.2), "arc AD (shared)", COL.arc);
    this.label(v(0, (A.y + D.y) / 2 + 0.35), "chord AD", COL.chord);
    this.label(C.clone().add(v(0.55, -0.55)), "∠ACD", COL.line);
    this.label(B.clone().add(v(-0.55, -0.55)), "∠ABD", COL.triangle);
    this.label(v(0, R * 0.35), "same segment", COL.segment);
    this.label(v(0, R * 1.18), "∠ACD = ∠ABD", COL.accent);
  }

  private drawTangent(): void {
    const T = polar(R, Math.PI / 2);
    // Tangent is horizontal at top: y = R
    this.circle();
    this.line(v(-R * 1.6, R), v(R * 1.6, R), COL.line);
    this.line(v(0, 0), T, COL.radius);
    this.dot(v(0, 0), COL.point);
    this.dot(T, COL.point);
    // right angle mark
    const s = 0.35;
    this.line(v(0, R - s), v(s, R - s), COL.mute);
    this.line(v(s, R - s), v(s, R), COL.mute);
    this.label(v(0, -0.4), "O", COL.point);
    this.label(T.clone().add(v(0.35, 0.35)), "T", COL.point);
    this.label(v(R * 1.1, R + 0.35), "tangent", COL.line);
    this.label(v(0.55, R / 2), "r ⊥", COL.radius);
  }

  private drawSecant(): void {
    const A = polar(R, 0.4);
    const B = polar(R, Math.PI - 0.35);
    // extend beyond B and A to external P left of circle
    const dir = B.clone().sub(A).normalize();
    const P = A.clone().addScaledVector(dir, -2.2);
    const far = B.clone().addScaledVector(dir, 1.4);
    this.circle();
    this.line(P, far, COL.line);
    this.dot(P, COL.point);
    this.dot(A, COL.chord);
    this.dot(B, COL.chord);
    this.dot(v(0, 0), COL.mute);
    this.label(P.clone().add(v(-0.35, 0.25)), "P", COL.point);
    this.label(A.clone().multiplyScalar(1.15), "A", COL.chord);
    this.label(B.clone().multiplyScalar(1.15), "B", COL.chord);
    this.label(P.clone().add(A).multiplyScalar(0.5).add(v(0, 0.4)), "secant", COL.line);
  }

  private drawCyclicQuad(): void {
    const angs = [0.3, 1.4, 2.5, 5.0];
    const pts = angs.map((a) => polar(R, a));
    this.circle();
    for (let i = 0; i < 4; i++) this.line(pts[i], pts[(i + 1) % 4], COL.chord);
    const names = ["A", "B", "C", "D"];
    pts.forEach((p, i) => {
      this.dot(p, COL.point);
      this.label(p.clone().multiplyScalar(1.18), names[i], COL.point);
    });
    this.label(v(0, 0), "cyclic", COL.mute);
  }

  private drawPower(): void {
    // Two chords crossing inside
    const A = polar(R, -0.4);
    const B = polar(R, Math.PI - 0.5);
    const C = polar(R, 1.1);
    const D = polar(R, Math.PI + 1.0);
    const X = lineIntersect(A, B, C, D) ?? v(0, 0);
    this.circle();
    this.line(A, B, COL.chord);
    this.line(C, D, COL.line);
    this.dot(A, COL.point);
    this.dot(B, COL.point);
    this.dot(C, COL.point);
    this.dot(D, COL.point);
    this.dot(X, COL.arc);
    this.label(A.clone().multiplyScalar(1.15), "A", COL.point);
    this.label(B.clone().multiplyScalar(1.15), "B", COL.point);
    this.label(C.clone().multiplyScalar(1.15), "C", COL.point);
    this.label(D.clone().multiplyScalar(1.15), "D", COL.point);
    this.label(X.clone().add(v(0.25, 0.25)), "X", COL.arc);
    this.label(v(0, -R * 1.15), "AX·XB = CX·XD", COL.arc);
  }

  // --- drawing primitives ---

  private circle(color = COL.circle, width = 1): void {
    const points = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), 0);
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, linewidth: width }),
    );
    this.group.add(line);
  }

  private drawArcLine(centreOrStart: number | THREE.Vector3, start: number, sweep: number, radius: number, color: number): void {
    const cx = typeof centreOrStart === "number" ? 0 : centreOrStart.x;
    const cy = typeof centreOrStart === "number" ? 0 : centreOrStart.y;
    const points = Array.from({ length: 40 }, (_, i) => {
      const a = start + (sweep * i) / 39;
      return new THREE.Vector3(cx + radius * Math.cos(a), cy + radius * Math.sin(a), 0);
    });
    this.group.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color })),
    );
  }

  private fill(points: THREE.Vector2[], color: number, opacity: number): void {
    if (points.length < 3) return;
    this.group.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(new THREE.Shape(points)),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      ),
    );
  }

  private line(a: THREE.Vector3, b: THREE.Vector3, color: number): void {
    this.group.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color })),
    );
  }

  private dot(position: THREE.Vector3, color: number): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.copy(position);
    this.group.add(mesh);
  }

  private handle(position: THREE.Vector3, color: number, kind: "angle" | "point"): void {
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshBasicMaterial({ color }),
    );
    knob.position.copy(position);
    knob.userData.handle = kind;
    this.group.add(knob);
    this.handles.push(knob);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.26, 0.33, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    );
    halo.position.copy(position);
    this.group.add(halo);
  }

  private label(position: THREE.Vector3, value: string, color: number): void {
    const sprite = textSprite(value, color, 0.34);
    sprite.position.copy(position);
    this.group.add(sprite);
  }

  private pointerOnPlane(event: PointerEvent): THREE.Vector3 | undefined {
    if (!this.viewport) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, hit)) return undefined;
    return hit;
  }

  private pickHandle(event: PointerEvent): "angle" | "point" | undefined {
    if (!this.viewport || this.handles.length === 0) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const hits = this.raycaster.intersectObjects(this.handles, false);
    if (hits.length === 0) return undefined;
    return hits[0].object.userData.handle as "angle" | "point";
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

function v(x: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, 0);
}

function polar(r: number, angle: number): THREE.Vector3 {
  return new THREE.Vector3(r * Math.cos(angle), r * Math.sin(angle), 0);
}

function angleBetween(vertex: THREE.Vector3, first: THREE.Vector3, second: THREE.Vector3): number {
  const start = Math.atan2(first.y - vertex.y, first.x - vertex.x);
  let sweep = Math.atan2(second.y - vertex.y, second.x - vertex.x) - start;
  while (sweep <= -Math.PI) sweep += Math.PI * 2;
  while (sweep > Math.PI) sweep -= Math.PI * 2;
  return sweep;
}

function lineIntersect(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
): THREE.Vector3 | undefined {
  const r = b.clone().sub(a);
  const s = d.clone().sub(c);
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return undefined;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  return a.clone().addScaledVector(r, t);
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "?";
}
