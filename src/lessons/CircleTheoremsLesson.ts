import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { mathBlock } from "../core/MathText";
import { commonTangents, type Circle } from "../math/circleTangents";
import { createDragControls, marker, textSprite } from "./helpers";
import "./formulaDerivations/circleTheorems";

const R = 3.1;
const CENTRE = new THREE.Vector3(0, 0, 0);
const EPS_ANGLE = 0.03; // ~1.7°
const EPS_LEN = 0.04;

type Mode =
  | "centre"
  | "sameseg"
  | "thales"
  | "cyclic"
  | "cyclicext"
  | "altseg"
  | "tangent"
  | "twotangents"
  | "tansec"
  | "bitangents"
  | "chord"
  | "chords";

type HandleKind = "circle" | "external" | "centre2" | "radius2" | "none";

interface ModeCfg {
  label: string;
  group: "Angles" | "Tangents" | "Chords";
  handles: HandleKind[];
  init: number[]; // degrees for circle handles (index-aligned)
  ext?: [number, number];
  /** Second circle start state for the common-tangent mode: [x, y, radius]. */
  circle2?: [number, number, number];
  /** Camera distance along +z; the two-circle picture needs more room. */
  camZ?: number;
  /** Where the camera looks, so an off-centre construction still fits the canvas. */
  camTarget?: [number, number];
  hint: string;
}

const MODES: Record<Mode, ModeCfg> = {
  centre: {
    label: "Angle at centre = 2×",
    group: "Angles",
    handles: ["circle", "circle", "circle", "none"],
    init: [200, 340, 80],
    hint: "Drag A, B and P on the circle. The highlighted arc is the one both angles stand on.",
  },
  sameseg: {
    label: "Same segment",
    group: "Angles",
    handles: ["circle", "circle", "circle", "circle"],
    init: [200, 340, 60, 110],
    hint: "Keep P and Q on the same side of chord AB. Crossing AB puts them in opposite segments.",
  },
  thales: {
    label: "Angle in semicircle = 90°",
    group: "Angles",
    handles: ["circle", "circle", "none", "none"],
    init: [180, 60],
    hint: "Drag A to spin the diameter; drag P around the circle. ∠APB stays 90°.",
  },
  cyclic: {
    label: "Cyclic quadrilateral",
    group: "Angles",
    handles: ["circle", "circle", "circle", "circle"],
    init: [200, 320, 40, 130],
    hint: "Drag A–D. Opposite interior angles always sum to 180°.",
  },
  cyclicext: {
    label: "Exterior = opposite interior",
    group: "Angles",
    handles: ["circle", "circle", "circle", "circle"],
    init: [210, 300, 30, 120],
    hint: "Side AB is extended past B. The exterior angle at B equals interior ∠D.",
  },
  altseg: {
    label: "Alternate segment",
    group: "Angles",
    handles: ["circle", "circle", "circle", "none"],
    init: [40, 200, 120],
    hint: "Tangent at A, chord AB, point C in the alternate segment. Orange angle = green angle.",
  },
  tangent: {
    label: "Tangent ⟂ radius",
    group: "Tangents",
    handles: ["circle", "none", "none", "none"],
    init: [40],
    hint: "Drag T around the circle. The radius to the touch point stays perpendicular to the tangent.",
  },
  twotangents: {
    label: "Two tangents equal",
    group: "Tangents",
    handles: ["external", "none", "none", "none"],
    init: [],
    ext: [6.2, 2.4],
    hint: "Drag external point P. The two tangent lengths from P stay equal.",
  },
  tansec: {
    label: "Tangent–secant (power)",
    group: "Tangents",
    handles: ["external", "circle", "none", "none"],
    init: [40],
    ext: [6.0, 1.8],
    hint: "Drag P and A. Green chords TA/TB form the similar triangles behind PT² = PA · PB.",
  },
  bitangents: {
    label: "Common tangents (two circles)",
    group: "Tangents",
    handles: ["centre2", "radius2", "none", "none"],
    init: [],
    circle2: [6.4, 1.2, 1.55],
    camZ: 17,
    camTarget: [2.2, 0],
    hint: "Drag the second centre and its rim handle. Orange = external, green = internal.",
  },
  chord: {
    label: "⟂ from centre bisects chord",
    group: "Chords",
    handles: ["circle", "circle", "none", "none"],
    init: [200, 330],
    hint: "Drag A and B. The perpendicular from O always hits the midpoint of AB.",
  },
  chords: {
    label: "Intersecting chords",
    group: "Chords",
    handles: ["circle", "circle", "circle", "circle"],
    init: [200, 20, 110, 290],
    hint: "Chords AB and CD cross inside the circle at X. AX·XB = CX·XD.",
  },
};

const MODE_ORDER: Mode[] = [
  "centre",
  "sameseg",
  "thales",
  "cyclic",
  "cyclicext",
  "altseg",
  "tangent",
  "twotangents",
  "tansec",
  "bitangents",
  "chord",
  "chords",
];

const CBLUE = 0x58a6ff;
const CYEL = 0xffd166;
const CGRN = 0x7ee787;
const CPUR = 0xd2a8ff;
const CRED = 0xff7b72;
const CORG = 0xffa657;
const CARC = 0x388bfd;

/**
 * Lesson 9 — Circle Theorems.
 *
 * Pick a theorem and drag the points around the circle to see it hold on every
 * configuration. Covers centre/edge angles, same segment, Thales, cyclic quads
 * (interior and exterior), alternate segment, tangent ⟂ radius, equal tangents,
 * tangent–secant power, common tangents, chord bisector, and intersecting chords.
 */
export class CircleTheoremsLesson implements Lesson {
  readonly id = "circle-theorems";
  readonly title = "9 · Circle Theorems";
  readonly blurb = "Drag points, verify the theorems";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["triangle-theorems"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private prevRotate = true;

  private mode: Mode = "centre";
  private angles: number[] = [];
  private ext = new THREE.Vector3(6, 2, 0);
  /** Second circle used by the common-tangent mode. */
  private c2 = new THREE.Vector3(7.6, 1.4, 0);
  private r2 = 1.7;
  /** Direction the radius handle sits in, so it follows the pointer while dragging. */
  private r2Dir = 0;
  private camFraming = "0,0,14";

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-circle]");
    if (!btn) return;
    const action = btn.dataset.circle;
    if (action === "reset") {
      this.setMode(this.mode);
      return;
    }
    this.setMode(action as Mode);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 0, 0));
    this.prevRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.group.add(this.circle(CENTRE, R, 0x8b949e));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8b949e }));
    c.position.copy(CENTRE);
    this.group.add(c);

    for (let i = 0; i < 4; i++) {
      const h = marker(CYEL, 0.2);
      h.userData.handle = `circle-theorem-${i}`;
      this.handles.push(h);
      this.group.add(h);
    }

    this.stopDrag = createDragControls(ctx.viewport, this.handles, (i, p) => this.onDrag(i, p));

    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.setMode("centre");
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.prevRotate;
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.handles = [];
    this.viewport = undefined;
  }

  private setMode(mode: Mode): void {
    if (!MODES[mode]) return;
    this.mode = mode;
    const cfg = MODES[mode];
    this.angles = cfg.init.map((d) => THREE.MathUtils.degToRad(d));
    if (cfg.ext) this.ext.set(cfg.ext[0], cfg.ext[1], 0);
    if (cfg.circle2) {
      this.c2.set(cfg.circle2[0], cfg.circle2[1], 0);
      this.r2 = cfg.circle2[2];
      this.r2Dir = Math.PI / 2;
    }
    const camZ = cfg.camZ ?? 14;
    const [tx, ty] = cfg.camTarget ?? [0, 0];
    const framing = `${tx},${ty},${camZ}`;
    if (this.viewport && framing !== this.camFraming) {
      this.camFraming = framing;
      this.viewport.frameCamera(new THREE.Vector3(tx, ty, camZ), new THREE.Vector3(tx, ty, 0));
    }
    this.rebuild();
  }

  private onDrag(i: number, p: THREE.Vector3): void {
    const kind = MODES[this.mode].handles[i];
    if (kind === "circle") {
      this.angles[i] = Math.atan2(p.y - CENTRE.y, p.x - CENTRE.x);
    } else if (kind === "external") {
      const v = p.clone().sub(CENTRE);
      if (v.length() < R + 0.6) v.setLength(R + 0.6);
      this.ext.copy(CENTRE).add(v);
    } else if (kind === "centre2") {
      this.c2.set(THREE.MathUtils.clamp(p.x, -8, 9), THREE.MathUtils.clamp(p.y, -6, 6), 0);
    } else if (kind === "radius2") {
      const v = p.clone().sub(this.c2);
      const len = v.length();
      if (len > 1e-4) this.r2Dir = Math.atan2(v.y, v.x);
      this.r2 = THREE.MathUtils.clamp(len, 0.35, 3.8);
    } else {
      return;
    }
    this.rebuild();
  }

  private onCircle(i: number): THREE.Vector3 {
    const a = this.angles[i];
    return new THREE.Vector3(CENTRE.x + R * Math.cos(a), CENTRE.y + R * Math.sin(a), 0);
  }

  // ---- draw --------------------------------------------------------------

  private rebuild(): void {
    this.disposeChildren(this.dynamic);
    const cfg = MODES[this.mode];

    for (let i = 0; i < 4; i++) {
      const kind = cfg.handles[i];
      const h = this.handles[i];
      h.visible = kind !== "none";
      if (kind === "circle") h.position.copy(this.onCircle(i));
      else if (kind === "external") h.position.copy(this.ext);
      else if (kind === "centre2") h.position.copy(this.c2);
      else if (kind === "radius2") {
        h.position.set(this.c2.x + this.r2 * Math.cos(this.r2Dir), this.c2.y + this.r2 * Math.sin(this.r2Dir), 0);
      }
    }

    let html = "";
    switch (this.mode) {
      case "centre": html = this.drawCentre(); break;
      case "sameseg": html = this.drawSameSeg(); break;
      case "thales": html = this.drawThales(); break;
      case "cyclic": html = this.drawCyclic(); break;
      case "cyclicext": html = this.drawCyclicExt(); break;
      case "altseg": html = this.drawAltSeg(); break;
      case "tangent": html = this.drawTangent(); break;
      case "twotangents": html = this.drawTwoTangents(); break;
      case "tansec": html = this.drawTanSec(); break;
      case "bitangents": html = this.drawBitangents(); break;
      case "chord": html = this.drawChord(); break;
      case "chords": html = this.drawIntersectChords(); break;
    }
    this.renderPanel(html);
  }

  private drawCentre(): string {
    const A = this.onCircle(0), B = this.onCircle(1), P = this.onCircle(2);
    this.line([A, CENTRE], CPUR);
    this.line([B, CENTRE], CPUR);
    this.line([A, P], CBLUE);
    this.line([B, P], CBLUE);
    this.line([A, B], 0x6e7681);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(P, "P"); this.tag(CENTRE, "O", 0x8b949e);

    const inscribed = angleAt(P, A, B);
    const aA = this.angles[0], aB = this.angles[1], aP = this.angles[2];
    const d1 = mod2pi(aB - aA);
    const pOn1 = mod2pi(aP - aA) < d1;
    const sweep = pOn1 ? -(2 * Math.PI - d1) : d1;
    const central = Math.abs(sweep);
    this.highlightArc(aA, sweep, CARC);
    this.dynamic.add(arcAngle(CENTRE, aA, sweep, 0.95, CPUR));
    this.dynamic.add(this.angleArc(P, A, B, 0.8, CBLUE));
    this.arcLabel(CENTRE, aA + sweep / 2, 1.35, degStr(central), CPUR);

    const ratio = inscribed > 1e-6 ? central / inscribed : NaN;
    const ok = Number.isFinite(ratio) && Math.abs(ratio - 2) < 0.04;
    return `<h3>Angle at the centre = 2 × angle at the edge ${derivationButton("centre-angle")}</h3>
      <p>Points <b>A</b>, <b>B</b> and <b>P</b> sit on the circle. The angle the highlighted arc AB makes
      at the <b>centre O</b> is always exactly twice the angle it makes at any point <b>P</b>
      on the remaining arc.</p>
      <div class="readout">
        <div><span>∠AOB (centre)</span> <b>${degStr(central)}</b></div>
        <div><span>∠APB (edge)</span> <b>${degStr(inscribed)}</b></div>
        <div><span>centre ÷ edge</span> <b>${Number.isFinite(ratio) ? ratio.toFixed(3) : "—"}</b></div>
      </div>
      ${checkChip(ok, ok ? "centre = 2 × edge" : "degenerate — spread A, B and P")}`;
  }

  private drawSameSeg(): string {
    const A = this.onCircle(0), B = this.onCircle(1), P = this.onCircle(2), Q = this.onCircle(3);
    this.line([A, B], CPUR);
    this.line([A, P], CBLUE); this.line([B, P], CBLUE);
    this.line([A, Q], CGRN); this.line([B, Q], CGRN);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(P, "P"); this.tag(Q, "Q");
    this.dynamic.add(this.angleArc(P, A, B, 0.75, CBLUE));
    this.dynamic.add(this.angleArc(Q, A, B, 0.75, CGRN));

    const sideP = orient(A, B, P);
    const sideQ = orient(A, B, Q);
    const same = sideP * sideQ > 0;
    const aA = this.angles[0], aB = this.angles[1];
    const d1 = mod2pi(aB - aA);
    const midOn1 = new THREE.Vector3(CENTRE.x + R * Math.cos(aA + d1 / 2), CENTRE.y + R * Math.sin(aA + d1 / 2), 0);
    const mid1Side = orient(A, B, midOn1);
    if (same) {
      const sweep = mid1Side * sideP > 0 ? -(2 * Math.PI - d1) : d1;
      this.highlightArc(aA, sweep, CARC);
    } else {
      this.highlightArc(aA, d1, CARC);
      this.highlightArc(aA + d1, 2 * Math.PI - d1, 0x6e7681);
    }

    const ap = angleAt(P, A, B), aq = angleAt(Q, A, B);
    const equal = Math.abs(ap - aq) < EPS_ANGLE;
    const ok = same && equal;
    const status = !same
      ? "P and Q are on opposite sides of AB — not the same segment"
      : ok
        ? "same segment: angles equal"
        : "same segment but angles drifted — check for coincident points";

    return `<h3>Angles in the same segment are equal ${derivationButton("same-segment")}</h3>
      <p>The chord <b>AB</b> is seen from two points <b>P</b> and <b>Q</b>. When both sit on the
      <b>same side</b> of AB they stand on the same arc and see AB at the same angle.</p>
      <div class="readout">
        <div><span>∠APB</span> <b>${degStr(ap)}</b></div>
        <div><span>∠AQB</span> <b>${degStr(aq)}</b></div>
        <div><span>segment</span> <b>${same ? "same" : "opposite"}</b></div>
      </div>
      ${checkChip(ok, status)}`;
  }

  private drawThales(): string {
    const A = this.onCircle(0);
    const B = A.clone().multiplyScalar(-1);
    const P = this.onCircle(1);
    this.line([A, B], CPUR);
    this.line([A, P], CBLUE); this.line([B, P], CBLUE);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(P, "P"); this.tag(CENTRE, "O", 0x8b949e);
    const aA = this.angles[0];
    const aP = this.angles[1];
    const sweep = mod2pi(aP - aA) <= Math.PI ? Math.PI : -Math.PI;
    this.highlightArc(aA, sweep, CARC);
    this.dynamic.add(this.rightAngleMark(P, A, B, CRED));
    const ang = angleAt(P, A, B);
    const ok = Math.abs(ang - Math.PI / 2) < EPS_ANGLE;
    return `<h3>Angle in a semicircle = 90° ${derivationButton("thales")}</h3>
      <p><b>AB</b> is a <b>diameter</b> (drag A to spin it). Any point <b>P</b> on the circle
      sees the diameter at a right angle.</p>
      <div class="readout"><div><span>∠APB</span> <b>${degStr(ang)}</b></div></div>
      ${checkChip(ok, ok ? "angle in a semicircle is 90°" : "degenerate — move P off A/B")}`;
  }

  private drawCyclic(): string {
    const pts = [this.onCircle(0), this.onCircle(1), this.onCircle(2), this.onCircle(3)];
    const names = ["A", "B", "C", "D"];
    const order = [0, 1, 2, 3].sort((i, j) => this.angles[i] - this.angles[j]);
    const q = order.map((i) => pts[i]);
    const qNames = order.map((i) => names[i]);
    for (let i = 0; i < 4; i++) this.line([q[i], q[(i + 1) % 4]], CBLUE);
    pts.forEach((v, i) => this.tag(v, names[i]));
    const ang = q.map((v, i) => angleAt(v, q[(i + 3) % 4], q[(i + 1) % 4]));
    q.forEach((v, i) => this.dynamic.add(this.angleArc(v, q[(i + 3) % 4], q[(i + 1) % 4], 0.55, CYEL)));
    for (let i = 0; i < 4; i++) {
      const a0 = Math.atan2(q[i].y, q[i].x);
      const a1 = Math.atan2(q[(i + 1) % 4].y, q[(i + 1) % 4].x);
      this.highlightArc(a0, signedSweep(a0, a1), i % 2 === 0 ? CARC : 0x3d444d);
    }
    const sumAC = ang[0] + ang[2];
    const sumBD = ang[1] + ang[3];
    const ok = Math.abs(sumAC - Math.PI) < EPS_ANGLE && Math.abs(sumBD - Math.PI) < EPS_ANGLE;
    return `<h3>Cyclic quadrilateral — opposite angles add to 180° ${derivationButton("cyclic-opposites")}</h3>
      <p>Four points on a circle make a <b>cyclic quadrilateral</b>. Labels stay with the
      handles you drag; edges connect in circle order (${qNames.join("→")}).</p>
      <div class="readout">
        <div><span>${qNames[0]} + ${qNames[2]}</span> <b>${degStr(sumAC)}</b></div>
        <div><span>${qNames[1]} + ${qNames[3]}</span> <b>${degStr(sumBD)}</b></div>
      </div>
      ${checkChip(ok, ok ? "opposite angles sum to 180°" : "points nearly coincident")}`;
  }

  private drawCyclicExt(): string {
    const pts = [this.onCircle(0), this.onCircle(1), this.onCircle(2), this.onCircle(3)];
    const names = ["A", "B", "C", "D"];
    const order = [0, 1, 2, 3].sort((i, j) => this.angles[i] - this.angles[j]);
    const q = order.map((i) => pts[i]);
    const qNames = order.map((i) => names[i]);
    for (let i = 0; i < 4; i++) this.line([q[i], q[(i + 1) % 4]], CBLUE);
    pts.forEach((v, i) => this.tag(v, names[i]));

    const dir = q[1].clone().sub(q[0]).normalize();
    const extPt = q[1].clone().addScaledVector(dir, 2.4);
    this.line([q[1], extPt], CORG);
    this.tag(extPt, "E", CORG, dir.clone().multiplyScalar(0.35));

    const exterior = angleAt(q[1], extPt, q[2]);
    const opposite = angleAt(q[3], q[2], q[0]);
    this.dynamic.add(this.angleArc(q[1], extPt, q[2], 0.7, CORG));
    this.dynamic.add(this.angleArc(q[3], q[2], q[0], 0.65, CGRN));

    const a0 = Math.atan2(q[0].y, q[0].x);
    const a2 = Math.atan2(q[2].y, q[2].x);
    this.highlightArc(a0, signedSweep(a0, a2), CARC);

    const ok = Math.abs(exterior - opposite) < EPS_ANGLE;
    return `<h3>Exterior angle of a cyclic quad = opposite interior ${derivationButton("cyclic-exterior")}</h3>
      <p>Extend side <b>${qNames[0]}${qNames[1]}</b> past <b>${qNames[1]}</b>. The orange exterior
      angle equals the green interior at opposite corner <b>${qNames[3]}</b>.</p>
      <div class="readout">
        <div><span>exterior at ${qNames[1]}</span> <b>${degStr(exterior)}</b></div>
        <div><span>interior at ${qNames[3]}</span> <b>${degStr(opposite)}</b></div>
      </div>
      ${checkChip(ok, ok ? "exterior = opposite interior" : "degenerate configuration")}`;
  }

  private drawAltSeg(): string {
    const A = this.onCircle(0), B = this.onCircle(1), C = this.onCircle(2);
    const radial = A.clone().sub(CENTRE).normalize();
    const tangentDir = new THREE.Vector3(-radial.y, radial.x, 0);
    this.line([A.clone().addScaledVector(tangentDir, -3.2), A.clone().addScaledVector(tangentDir, 3.2)], CORG);
    this.line([A, B], CBLUE);
    this.line([A, C], CGRN); this.line([B, C], CGRN);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(C, "C");
    this.dynamic.add(this.rightAngleMark(A, CENTRE, A.clone().addScaledVector(tangentDir, 1), CRED));

    const angTan1 = angleAt(A, A.clone().addScaledVector(tangentDir, 1), B);
    const angTan2 = angleAt(A, A.clone().addScaledVector(tangentDir, -1), B);
    const angC = angleAt(C, A, B);

    const sideC = orient(A, B, C);
    const tanProbe = A.clone().addScaledVector(tangentDir, 1);
    const sideTanPos = orient(A, B, tanProbe);

    let tanAngle: number;
    let tanPoint: THREE.Vector3;
    // Measure the tangent–chord angle on the side opposite C (alternate segment).
    if (sideC * sideTanPos < 0) {
      tanAngle = angTan1;
      tanPoint = A.clone().addScaledVector(tangentDir, 1);
    } else {
      tanAngle = angTan2;
      tanPoint = A.clone().addScaledVector(tangentDir, -1);
    }

    this.dynamic.add(this.angleArc(A, tanPoint, B, 0.75, CORG));
    this.dynamic.add(this.angleArc(C, A, B, 0.7, CGRN));

    const aA = this.angles[0], aB = this.angles[1], aC = this.angles[2];
    const d1 = mod2pi(aB - aA);
    const cOn1 = mod2pi(aC - aA) < d1;
    const sweep = cOn1 ? d1 : -(2 * Math.PI - d1);
    this.highlightArc(aA, sweep, CARC);

    const ok = Math.abs(tanAngle - angC) < EPS_ANGLE;
    const note = ok
      ? "tangent–chord angle = angle in alternate segment"
      : "drag C into the alternate segment (other side of chord AB)";

    return `<h3>Alternate segment theorem ${derivationButton("alternate-segment")}</h3>
      <p>Tangent at <b>A</b> (orange) and chord <b>AB</b>. Point <b>C</b> in the
      <b>alternate segment</b> (highlighted arc) sees AB at the same angle as the
      tangent–chord angle.</p>
      <div class="readout">
        <div><span>tangent–chord ∠</span> <b>${degStr(tanAngle)}</b></div>
        <div><span>∠ACB (alt. segment)</span> <b>${degStr(angC)}</b></div>
      </div>
      ${checkChip(ok, note)}`;
  }

  private drawTangent(): string {
    const T = this.onCircle(0);
    const radial = T.clone().sub(CENTRE).normalize();
    const tangentDir = new THREE.Vector3(-radial.y, radial.x, 0);
    const pTan = T.clone().addScaledVector(tangentDir, 1);
    this.line([CENTRE, T], CPUR);
    this.line([T.clone().addScaledVector(tangentDir, -3.2), T.clone().addScaledVector(tangentDir, 3.2)], CORG);
    this.tag(T, "T"); this.tag(CENTRE, "O", 0x8b949e);
    this.dynamic.add(this.rightAngleMark(T, CENTRE, pTan, CRED));
    const ang = angleAt(T, CENTRE, pTan);
    const ok = Math.abs(ang - Math.PI / 2) < EPS_ANGLE;
    return `<h3>A tangent meets the radius at 90° ${derivationButton("tangent-radius")}</h3>
      <p>The orange line just touches the circle at <b>T</b>. The radius <b>OT</b> drawn to
      that point is always perpendicular to it.</p>
      <div class="readout"><div><span>angle between OT and tangent</span> <b>${degStr(ang)}</b></div></div>
      ${checkChip(ok, "radius ⟂ tangent at the point of contact")}`;
  }

  private drawTwoTangents(): string {
    const P = this.ext.clone();
    const d = P.distanceTo(CENTRE);
    const base = Math.atan2(P.y - CENTRE.y, P.x - CENTRE.x);
    const off = Math.acos(THREE.MathUtils.clamp(R / d, -1, 1));
    const T1 = new THREE.Vector3(CENTRE.x + R * Math.cos(base + off), CENTRE.y + R * Math.sin(base + off), 0);
    const T2 = new THREE.Vector3(CENTRE.x + R * Math.cos(base - off), CENTRE.y + R * Math.sin(base - off), 0);
    this.line([P, T1], CORG); this.line([P, T2], CORG);
    this.line([CENTRE, T1], CPUR); this.line([CENTRE, T2], CPUR);
    this.line([CENTRE, P], 0x6e7681);
    this.tag(P, "P"); this.tag(T1, "T₁"); this.tag(T2, "T₂"); this.tag(CENTRE, "O", 0x8b949e);
    this.dynamic.add(this.rightAngleMark(T1, CENTRE, P, CRED));
    this.dynamic.add(this.rightAngleMark(T2, CENTRE, P, CRED));
    const l1 = P.distanceTo(T1), l2 = P.distanceTo(T2);
    const apex = angleAt(CENTRE, T1, T2);
    this.dynamic.add(this.angleArc(CENTRE, T1, T2, 0.7, CYEL));
    const ok = Math.abs(l1 - l2) < EPS_LEN;
    return `<h3>Two tangents from a point are equal ${derivationButton("equal-tangents")}</h3>
      <p>From external point <b>P</b> there are exactly two tangents. Distances to the touch
      points are equal, and the two right triangles share OP (RHS).</p>
      <div class="readout">
        <div><span>P T₁</span> <b>${l1.toFixed(2)}</b></div>
        <div><span>P T₂</span> <b>${l2.toFixed(2)}</b></div>
        <div><span>∠T₁OT₂</span> <b>${degStr(apex)}</b></div>
      </div>
      ${checkChip(ok, "PT₁ = PT₂")}`;
  }

  private drawTanSec(): string {
    const P = this.ext.clone();
    const Ahandle = this.onCircle(0);
    const secDir = Ahandle.clone().sub(P);
    const hits = lineCircleHits(P, secDir, CENTRE, R);

    let A: THREE.Vector3;
    let B: THREE.Vector3;
    if (hits && hits.length === 2) {
      hits.sort((u, v) => u.distanceTo(P) - v.distanceTo(P));
      A = hits[0];
      B = hits[1];
      this.angles[0] = Math.atan2(A.y - CENTRE.y, A.x - CENTRE.x);
      this.handles[0].position.copy(A);
    } else {
      A = Ahandle;
      B = Ahandle.clone();
    }

    const d = P.distanceTo(CENTRE);
    const base = Math.atan2(P.y - CENTRE.y, P.x - CENTRE.x);
    const off = Math.acos(THREE.MathUtils.clamp(R / d, -1, 1));
    const T = new THREE.Vector3(CENTRE.x + R * Math.cos(base + off), CENTRE.y + R * Math.sin(base + off), 0);

    this.line([P, T], CORG);
    if (hits) {
      this.line([P, B.clone().addScaledVector(B.clone().sub(P).normalize(), 0.5)], CBLUE);
      // Chords TA and TB — sides of △PTA and △PBT in the similar-triangle proof.
      this.line([T, A], CGRN);
      this.line([T, B], CGRN);
      this.dynamic.add(this.angleArc(T, P, A, 0.55, CORG));
      this.dynamic.add(this.angleArc(B, P, T, 0.55, CGRN));
      this.dynamic.add(this.dot(A, CBLUE));
      this.dynamic.add(this.dot(B, CBLUE));
      this.tag(A, "A"); this.tag(B, "B");
      const aA = Math.atan2(A.y, A.x), aB = Math.atan2(B.y, B.x);
      this.highlightArc(aA, signedSweep(aA, aB), CARC);
    }
    this.line([CENTRE, T], CPUR);
    this.dynamic.add(this.rightAngleMark(T, CENTRE, P, CRED));
    this.tag(P, "P"); this.tag(T, "T"); this.tag(CENTRE, "O", 0x8b949e);

    const pt = P.distanceTo(T);
    const pa = P.distanceTo(A);
    const pb = P.distanceTo(B);
    const lhs = pt * pt;
    const rhs = pa * pb;
    const ok = !!hits && Math.abs(lhs - rhs) < 0.15;

    let angleRows = "";
    let angleChip = "";
    if (hits) {
      const angPTA = angleAt(T, P, A);
      const angPBT = angleAt(B, P, T);
      const anglesMatch = Math.abs(angPTA - angPBT) < EPS_ANGLE;
      angleRows = `
        <div><span>∠PTA</span> <b>${degStr(angPTA)}</b></div>
        <div><span>∠PBT</span> <b>${degStr(angPBT)}</b></div>`;
      angleChip = checkChip(
        anglesMatch,
        anglesMatch ? "∠PTA = ∠PBT (alt. segment) → △PTA ∼ △PBT" : "∠PTA vs ∠PBT",
      );
    }

    return `<h3>Tangent–secant theorem (power of a point) ${derivationButton("tangent-secant")}</h3>
      <p>From external <b>P</b>: tangent touches at <b>T</b>, secant cuts at <b>A</b> then <b>B</b>.
      Green chords <b>TA</b> and <b>TB</b> make △PTA and △PBT — similar by alternate segment + shared
      ∠P, which forces <b>PT² = PA · PB</b>. Drag P or A to steer the secant.</p>
      <div class="readout">
        <div><span>PT²</span> <b>${lhs.toFixed(2)}</b></div>
        <div><span>PA · PB</span> <b>${rhs.toFixed(2)}</b></div>
        <div><span>PT / PA / PB</span> <b>${pt.toFixed(2)} / ${pa.toFixed(2)} / ${pb.toFixed(2)}</b></div>
        ${angleRows}
      </div>
      ${checkChip(ok, ok ? "PT² = PA · PB" : "secant needs two intersections — move P or A")}
      ${angleChip}`;
  }

  private drawBitangents(): string {
    const a: Circle = { centre: { x: CENTRE.x, y: CENTRE.y }, radius: R };
    const b: Circle = { centre: { x: this.c2.x, y: this.c2.y }, radius: this.r2 };
    const res = commonTangents(a, b);
    const O2 = this.c2.clone();

    this.dynamic.add(this.circle(O2, this.r2, 0x8b949e));
    this.dynamic.add(this.dot(O2, 0x8b949e));
    this.line([CENTRE, O2], 0x6e7681);
    this.tag(CENTRE, "O₁", 0x8b949e, new THREE.Vector3(-0.35, -0.55, 0));
    this.tag(O2, "O₂", 0x8b949e, new THREE.Vector3(0, -0.6, 0));

    const all = [...res.external, ...res.internal];
    all.forEach((t, idx) => {
      const colour = t.kind === "external" ? CORG : CGRN;
      const T1 = new THREE.Vector3(t.touchA.x, t.touchA.y, 0);
      const T2 = new THREE.Vector3(t.touchB.x, t.touchB.y, 0);
      const dir = T2.clone().sub(T1);
      if (dir.lengthSq() < 1e-8) dir.set(-t.normal.y, t.normal.x, 0);
      dir.normalize();
      this.line([T1.clone().addScaledVector(dir, -1.6), T2.clone().addScaledVector(dir, 1.6)], colour);
      this.line([CENTRE, T1], CPUR);
      this.line([O2, T2], CPUR);
      this.dynamic.add(this.dot(T1, colour));
      this.dynamic.add(this.dot(T2, colour));
      if (idx === 0 || (t.kind === "internal" && idx === res.external.length)) {
        this.dynamic.add(this.rightAngleMark(T1, CENTRE, T1.clone().addScaledVector(dir, 1), CRED));
      }
    });

    const first = res.external[0];
    if (first && res.externalLength !== undefined && res.externalLength > 0.3) {
      const mid = new THREE.Vector3((first.touchA.x + first.touchB.x) / 2, (first.touchA.y + first.touchB.y) / 2, 0);
      this.arcLabelAt(mid.clone().addScaledVector(new THREE.Vector3(first.normal.x, first.normal.y, 0), -0.55),
        res.externalLength.toFixed(2), CORG);
    }
    const firstIn = res.internal[0];
    if (firstIn && res.internalLength !== undefined && res.internalLength > 0.3) {
      const mid = new THREE.Vector3((firstIn.touchA.x + firstIn.touchB.x) / 2, (firstIn.touchA.y + firstIn.touchB.y) / 2, 0);
      this.arcLabelAt(mid.clone().addScaledVector(new THREE.Vector3(firstIn.normal.x, firstIn.normal.y, 0), -0.5),
        res.internalLength.toFixed(2), CGRN);
    }

    const d = res.distance;
    const total = res.external.length + res.internal.length;
    const alpha = Math.abs(R - this.r2) <= d && d > 1e-6
      ? Math.asin(THREE.MathUtils.clamp(Math.abs(R - this.r2) / d, -1, 1)) : undefined;
    const beta = R + this.r2 <= d
      ? Math.asin(THREE.MathUtils.clamp((R + this.r2) / d, -1, 1)) : undefined;
    const note = RELATIONSHIP_NOTE[res.relationship];

    return `<h3>Common tangents to two circles ${derivationButton("common-tangents")}</h3>
      <p>Drag the <b>centre</b> of the second circle, and drag its <b>rim handle</b> to resize
      it. <b class="tan-ext">External</b> tangents keep both circles on the same side;
      <b class="tan-int">internal</b> ones cross between them.</p>

      <div class="readout">
        <div><span data-math>r₁ / r₂</span> <b>${R.toFixed(2)} / ${this.r2.toFixed(2)}</b></div>
        <div><span data-math>d = |O₁O₂|</span> <b>${d.toFixed(3)}</b></div>
        <div><span>tangents in total</span> <b>${total}</b></div>
        <div><span data-math>√(d² − (r₁ − r₂)²)</span> <b>${res.externalLength !== undefined ? res.externalLength.toFixed(3) : "—"}</b></div>
        <div><span data-math>√(d² − (r₁ + r₂)²)</span> <b>${res.internalLength !== undefined ? res.internalLength.toFixed(3) : "—"}</b></div>
        <div><span data-math>α = sin⁻¹(|r₁ − r₂|/d)</span> <b>${alpha !== undefined ? degStr(alpha) : "—"}</b></div>
        <div><span data-math>β = sin⁻¹((r₁ + r₂)/d)</span> <b>${beta !== undefined ? degStr(beta) : "—"}</b></div>
      </div>

      <p class="tangent-note">${total} common tangent${total === 1 ? "" : "s"} — ${note}. Lengths are
      touch-to-touch; α and β are the angles those tangents make with O₁O₂.</p>

      <details class="circle-method">
        <summary>How to calculate them</summary>
        <dl class="symbol-key">
          ${SYMBOL_KEY.map(([symbol, meaning]) => `<dt data-math>${symbol}</dt><dd>${meaning}</dd>`).join("")}
        </dl>
        <ol class="circle-tangent-steps">
          <li>Write the tangent line in <b>normal form</b>:
          ${mathBlock("n·X = c,   |n| = 1", "distance from a point O to that line = |n·O − c|")}</li>
          <li>Touching both circles:
          ${mathBlock(["n·O₁ − c = s₁r₁", "n·O₂ − c = s₂r₂"], "s₁, s₂ = ±1 pick which side of the line each centre lies on")}</li>
          <li>Subtract to pin the normal along the centre line:
          ${mathBlock("h = n·û = (s₂r₂ − s₁r₁)/d", "û = unit vector from O₁ to O₂,  d = |O₁O₂|")}</li>
          <li>Unit length gives the perpendicular leftover; ± is the mirror pair:
          ${mathBlock("n = h·û ± √(1 − h²)·û⊥", "û⊥ = û turned through 90°")}</li>
          <li>Same signs → <b class="tan-ext">external</b>; opposite → <b class="tan-int">internal</b>:
          ${mathBlock(["c = n·O₁ − s₁r₁", "T = O − s·r·n"])}</li>
          <li>Real answers need <b>|h| ≤ 1</b>:
          ${mathBlock(["external: d ≥ |r₁ − r₂|", "internal: d ≥ r₁ + r₂"])}</li>
        </ol>
        <p><b>Shortcut:</b> shrink both by r₂ — external tangents become the two tangents from a point.
        ${mathBlock(["L_ext = √(d² − (r₁ − r₂)²)", "L_int = √(d² − (r₁ + r₂)²)"])}</p>
      </details>`;
  }

  private drawChord(): string {
    const A = this.onCircle(0), B = this.onCircle(1);
    const M = A.clone().add(B).multiplyScalar(0.5);
    this.line([A, B], CBLUE);
    this.line([CENTRE, M], CPUR);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(M, "M", CGRN); this.tag(CENTRE, "O", 0x8b949e);
    this.dynamic.add(this.dot(M, CGRN));
    if (M.distanceTo(CENTRE) > 0.05) this.dynamic.add(this.rightAngleMark(M, CENTRE, A, CRED));
    const am = A.distanceTo(M), mb = B.distanceTo(M);
    const om = M.distanceTo(CENTRE);
    const chord = A.distanceTo(B);
    const aA = this.angles[0], aB = this.angles[1];
    this.highlightArc(aA, signedSweep(aA, aB), CARC);
    const ok = Math.abs(am - mb) < EPS_LEN;
    return `<h3>The perpendicular from the centre bisects a chord ${derivationButton("chord-bisector")}</h3>
      <p>Drop a perpendicular from <b>O</b> to chord <b>AB</b>: it lands on midpoint <b>M</b>.
      Longer chords sit closer to the centre.</p>
      <div class="readout">
        <div><span>AM</span> <b>${am.toFixed(2)}</b></div>
        <div><span>MB</span> <b>${mb.toFixed(2)}</b></div>
        <div><span>AB (chord)</span> <b>${chord.toFixed(2)}</b></div>
        <div><span>OM (to centre)</span> <b>${om.toFixed(2)}</b></div>
      </div>
      ${checkChip(ok, "AM = MB")}`;
  }

  private drawIntersectChords(): string {
    const A = this.onCircle(0), B = this.onCircle(1), C = this.onCircle(2), D = this.onCircle(3);
    this.line([A, B], CBLUE);
    this.line([C, D], CGRN);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(C, "C"); this.tag(D, "D");

    const X = segmentIntersection(A, B, C, D) ?? (() => {
      const xl = lineIntersection(A, B, C, D);
      return xl && isBetween(A, B, xl) && isBetween(C, D, xl) ? xl : null;
    })();

    if (!X || X.distanceTo(CENTRE) > R - 0.02) {
      return `<h3>Intersecting chords theorem ${derivationButton("intersecting-chords")}</h3>
        <p>Chords <b>AB</b> and <b>CD</b> need to cross <b>inside</b> the circle. Drag the
        endpoints until they intersect.</p>
        <div class="readout"><div><span>intersection</span> <b>none inside</b></div></div>
        ${checkChip(false, "drag A–D so the chords cross inside the circle")}`;
    }

    this.dynamic.add(this.dot(X, CYEL));
    this.tag(X, "X", CYEL);
    const ax = A.distanceTo(X), xb = X.distanceTo(B);
    const cx = C.distanceTo(X), xd = X.distanceTo(D);
    const lhs = ax * xb, rhs = cx * xd;
    const ok = Math.abs(lhs - rhs) < 0.12;
    this.highlightArc(this.angles[0], signedSweep(this.angles[0], this.angles[1]), CARC);
    return `<h3>Intersecting chords theorem ${derivationButton("intersecting-chords")}</h3>
      <p>Chords <b>AB</b> and <b>CD</b> meet at <b>X</b> inside the circle.
      Then <b>AX · XB = CX · XD</b>.</p>
      <div class="readout">
        <div><span>AX · XB</span> <b>${lhs.toFixed(2)}</b></div>
        <div><span>CX · XD</span> <b>${rhs.toFixed(2)}</b></div>
        <div><span>AX / XB</span> <b>${ax.toFixed(2)} / ${xb.toFixed(2)}</b></div>
        <div><span>CX / XD</span> <b>${cx.toFixed(2)} / ${xd.toFixed(2)}</b></div>
      </div>
      ${checkChip(ok, "AX·XB = CX·XD")}`;
  }

  // ---- primitives --------------------------------------------------------

  private line(pts: THREE.Vector3[], color: number): void {
    this.dynamic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })));
  }

  private tag(p: THREE.Vector3, name: string, color = 0xffffff, offset?: THREE.Vector3): void {
    const t = textSprite(name, color, 0.4);
    const dir = p.clone().sub(CENTRE);
    const off = offset ?? (dir.lengthSq() < 1e-6 ? new THREE.Vector3(0.4, -0.4, 0) : dir.normalize().multiplyScalar(0.5));
    t.position.copy(p.clone().add(off));
    this.dynamic.add(t);
  }

  private dot(p: THREE.Vector3, color: number): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(p);
    return m;
  }

  private circle(centre: THREE.Vector3, radius: number, color: number): THREE.LineLoop {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 120; i++) {
      const t = (i / 120) * Math.PI * 2;
      pts.push(new THREE.Vector3(centre.x + radius * Math.cos(t), centre.y + radius * Math.sin(t), 0));
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  }

  /** Thick arc on the main circle marking the controlling arc of the active theorem. */
  private highlightArc(aStart: number, sweep: number, color: number): void {
    if (Math.abs(sweep) < 1e-6) return;
    const pts: THREE.Vector3[] = [];
    const n = Math.max(12, Math.round((Math.abs(sweep) / (Math.PI * 2)) * 96));
    for (let i = 0; i <= n; i++) {
      const a = aStart + (sweep * i) / n;
      pts.push(new THREE.Vector3(CENTRE.x + R * Math.cos(a), CENTRE.y + R * Math.sin(a), 0.01));
    }
    this.dynamic.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    ));
    const pts2 = pts.map((p) => {
      const v = p.clone().sub(CENTRE).setLength(R * 0.97).add(CENTRE);
      v.z = 0.01;
      return v;
    });
    this.dynamic.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts2),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
    ));
  }

  private angleArc(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3, radius: number, color: number): THREE.Line {
    const a0 = Math.atan2(p.y - v.y, p.x - v.x);
    const a1 = Math.atan2(q.y - v.y, q.x - v.x);
    let diff = a1 - a0;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return arcAngle(v, a0, diff, radius, color);
  }

  private rightAngleMark(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3, color: number): THREE.Line {
    const u = p.clone().sub(v).normalize().multiplyScalar(0.4);
    const w = q.clone().sub(v).normalize().multiplyScalar(0.4);
    const pts = [v.clone().add(u), v.clone().add(u).add(w), v.clone().add(w)];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  }

  private arcLabel(centre: THREE.Vector3, angle: number, radius: number, text: string, color: number): void {
    const t = textSprite(text, color, 0.32);
    t.position.set(centre.x + radius * Math.cos(angle), centre.y + radius * Math.sin(angle), 0);
    this.dynamic.add(t);
  }

  private arcLabelAt(p: THREE.Vector3, text: string, color: number): void {
    const t = textSprite(text, color, 0.32);
    t.position.copy(p);
    this.dynamic.add(t);
  }

  // ---- info panel --------------------------------------------------------

  private renderPanel(body: string): void {
    const groups: Array<"Angles" | "Tangents" | "Chords"> = ["Angles", "Tangents", "Chords"];
    const chapters = groups.map((group) => {
      const buttons = MODE_ORDER.filter((m) => MODES[m].group === group)
        .map((m) => {
          const active = m === this.mode;
          return `<button type="button" class="course-btn${active ? "" : " ghost"}" data-circle="${m}" aria-pressed="${active}">${MODES[m].label}</button>`;
        })
        .join(" ");
      return `<div class="circle-mode-group"><span class="circle-mode-label">${group}</span><div class="course-chapters">${buttons}</div></div>`;
    }).join("");

    const hint = MODES[this.mode].hint;

    this.setInfo(`
      <h2>Circle Theorems</h2>
      <p>A handful of rules govern angles and lines in a circle. Pick a theorem, then
      <b>drag the yellow points</b> — the picture and the measured numbers update so you
      can watch the rule hold for every position.</p>

      <div class="course">
        <h3>Choose a theorem</h3>
        <div class="circle-mode-groups">${chapters}</div>
        <p class="course-hint" data-circle-drag-hint><b>Drag:</b> ${hint}
          <button type="button" class="course-btn ghost" data-circle="reset" style="margin-left:8px">Reset</button>
        </p>
      </div>

      <div class="course">${body}</div>`);
  }

  // ---- disposal ----------------------------------------------------------

  private disposeChildren(g: THREE.Group): void {
    [...g.children].forEach((c) => this.disposeObject(c));
    g.clear();
  }

  private disposeGroup(g: THREE.Group): void {
    this.disposeChildren(g);
    for (const h of this.handles) this.disposeObject(h);
    g.parent?.remove(g);
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((mm) => this.disposeMaterial(mm));
      else if (mat) this.disposeMaterial(mat);
    });
    obj.parent?.remove(obj);
  }

  private disposeMaterial(m: THREE.Material): void {
    (m as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    m.dispose();
  }
}

// ---- geometry helpers ----

const SYMBOL_KEY: readonly [string, string][] = [
  ["O₁, O₂", "the two circle centres (O₁ is the fixed circle)"],
  ["r₁, r₂", "their radii"],
  ["d", "distance between the centres, |O₁O₂|"],
  ["û", "unit vector pointing from O₁ towards O₂"],
  ["û⊥", "û rotated 90°, so the two together span the plane"],
  ["n", "unit normal of the tangent line — the direction it faces, at right angles to it"],
  ["c", "how far the line sits from the origin along n"],
  ["X", "any point on the tangent line"],
  ["s₁, s₂", "either +1 or −1, recording which side of the line each centre falls on"],
  ["h", "n·û — the share of the normal that points along the centre line"],
  ["T", "a touch point, where a tangent meets a circle"],
  ["L_ext, L_int", "the tangent segment lengths, touch point to touch point"],
];

const RELATIONSHIP_NOTE: Record<string, string> = {
  separate: "the circles are apart, so both families exist",
  "externally-tangent": "the circles touch outside: the two internal tangents have merged into one",
  intersecting: "the circles overlap, so no line can pass between them",
  "internally-tangent": "one circle touches the other from inside: a single shared tangent",
  contained: "one circle is swallowed by the other, so nothing can touch both",
  identical: "the circles coincide, so every tangent is shared",
};

function checkChip(ok: boolean, label: string): string {
  return `<div class="theorem-check ${ok ? "ok" : "bad"}" role="status">${ok ? "✓" : "✗"} ${label}</div>`;
}

function angleAt(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3): number {
  const u = p.clone().sub(v);
  const w = q.clone().sub(v);
  const d = u.length() * w.length();
  if (d < 1e-9) return 0;
  return Math.acos(THREE.MathUtils.clamp(u.dot(w) / d, -1, 1));
}

function arcAngle(centre: THREE.Vector3, aStart: number, sweep: number, radius: number, color: number): THREE.Line {
  const pts: THREE.Vector3[] = [];
  const n = Math.max(8, Math.round((Math.abs(sweep) / (Math.PI * 2)) * 96));
  for (let i = 0; i <= n; i++) {
    const a = aStart + (sweep * i) / n;
    pts.push(new THREE.Vector3(centre.x + radius * Math.cos(a), centre.y + radius * Math.sin(a), 0));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
}

function mod2pi(a: number): number {
  const t = a % (Math.PI * 2);
  return t < 0 ? t + Math.PI * 2 : t;
}

function signedSweep(a0: number, a1: number): number {
  return mod2pi(a1 - a0);
}

/** Cross-product sign of B−A × P−A in 2D. */
function orient(a: THREE.Vector3, b: THREE.Vector3, p: THREE.Vector3): number {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  if (Math.abs(cross) < 1e-9) return 0;
  return Math.sign(cross);
}

function degStr(rad: number): string {
  return `${THREE.MathUtils.radToDeg(rad).toFixed(2)}°`;
}

function lineCircleHits(origin: THREE.Vector3, dir: THREE.Vector3, centre: THREE.Vector3, radius: number): THREE.Vector3[] | null {
  const d = dir.clone();
  if (d.lengthSq() < 1e-12) return null;
  d.normalize();
  const f = origin.clone().sub(centre);
  const b = 2 * f.dot(d);
  const c = f.dot(f) - radius * radius;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = (-b - s) / 2;
  const t2 = (-b + s) / 2;
  return [origin.clone().addScaledVector(d, t1), origin.clone().addScaledVector(d, t2)];
}

function lineIntersection(a1: THREE.Vector3, a2: THREE.Vector3, b1: THREE.Vector3, b2: THREE.Vector3): THREE.Vector3 | null {
  const dax = a2.x - a1.x, day = a2.y - a1.y;
  const dbx = b2.x - b1.x, dby = b2.y - b1.y;
  const den = dax * dby - day * dbx;
  if (Math.abs(den) < 1e-10) return null;
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den;
  return new THREE.Vector3(a1.x + t * dax, a1.y + t * day, 0);
}

function segmentIntersection(a1: THREE.Vector3, a2: THREE.Vector3, b1: THREE.Vector3, b2: THREE.Vector3): THREE.Vector3 | null {
  const dax = a2.x - a1.x, day = a2.y - a1.y;
  const dbx = b2.x - b1.x, dby = b2.y - b1.y;
  const den = dax * dby - day * dbx;
  if (Math.abs(den) < 1e-10) return null;
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den;
  const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return new THREE.Vector3(a1.x + t * dax, a1.y + t * day, 0);
}

function isBetween(a: THREE.Vector3, b: THREE.Vector3, p: THREE.Vector3): boolean {
  const ab = b.clone().sub(a);
  const ap = p.clone().sub(a);
  const t = ab.dot(ap) / (ab.lengthSq() || 1);
  return t > 0.02 && t < 0.98;
}
