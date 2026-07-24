import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { createDragControls, marker, textSprite } from "./helpers";
import "./formulaDerivations/circleTheorems";

const R = 3.1;
const CENTRE = new THREE.Vector3(0, 0, 0);

type Mode =
  | "centre"
  | "sameseg"
  | "thales"
  | "cyclic"
  | "tangent"
  | "twotangents"
  | "chord";

interface ModeCfg {
  label: string;
  handles: ("circle" | "external" | "none")[];
  init: number[]; // degrees for circle handles (index-aligned)
  ext?: [number, number];
}

const MODES: Record<Mode, ModeCfg> = {
  centre: { label: "Angle at centre = 2×", handles: ["circle", "circle", "circle", "none"], init: [200, 340, 80] },
  sameseg: { label: "Same segment", handles: ["circle", "circle", "circle", "circle"], init: [200, 340, 60, 110] },
  thales: { label: "Angle in semicircle = 90°", handles: ["circle", "circle", "none", "none"], init: [180, 60] },
  cyclic: { label: "Cyclic quadrilateral", handles: ["circle", "circle", "circle", "circle"], init: [200, 320, 40, 130] },
  tangent: { label: "Tangent ⟂ radius", handles: ["circle", "none", "none", "none"], init: [40] },
  twotangents: { label: "Two tangents equal", handles: ["external", "none", "none", "none"], init: [], ext: [6.2, 2.4] },
  chord: { label: "⟂ from centre bisects chord", handles: ["circle", "circle", "none", "none"], init: [200, 330] },
};

const CBLUE = 0x58a6ff;
const CYEL = 0xffd166;
const CGRN = 0x7ee787;
const CPUR = 0xd2a8ff;
const CRED = 0xff7b72;
const CORG = 0xffa657;

/**
 * Lesson 9 — Circle Theorems.
 *
 * Pick a theorem and drag the points around the circle to see it hold on every
 * configuration. Covers the angle at the centre being twice the angle at the edge, equal
 * angles in the same segment, the right angle in a semicircle (Thales), opposite angles of
 * a cyclic quadrilateral summing to 180°, a tangent meeting the radius at 90°, the two
 * equal tangents from an external point, and the perpendicular from the centre bisecting a
 * chord. Each mode measures the relevant angles/lengths independently and checks them live.
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

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-circle]");
    if (!btn) return;
    this.setMode(btn.dataset.circle as Mode);
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

    // Static base circle + centre.
    this.group.add(this.circle(CENTRE, R, 0x8b949e));
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8b949e }));
    c.position.copy(CENTRE);
    this.group.add(c);

    for (let i = 0; i < 4; i++) {
      const h = marker(CYEL, 0.2);
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

    // Position + show/hide handles.
    for (let i = 0; i < 4; i++) {
      const kind = cfg.handles[i];
      const h = this.handles[i];
      h.visible = kind !== "none";
      if (kind === "circle") h.position.copy(this.onCircle(i));
      else if (kind === "external") h.position.copy(this.ext);
    }

    let html = "";
    switch (this.mode) {
      case "centre": html = this.drawCentre(); break;
      case "sameseg": html = this.drawSameSeg(); break;
      case "thales": html = this.drawThales(); break;
      case "cyclic": html = this.drawCyclic(); break;
      case "tangent": html = this.drawTangent(); break;
      case "twotangents": html = this.drawTwoTangents(); break;
      case "chord": html = this.drawChord(); break;
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
    // Independent central angle: the arc AB not containing P.
    const aA = this.angles[0], aB = this.angles[1], aP = this.angles[2];
    const d1 = mod2pi(aB - aA);
    const pOn1 = mod2pi(aP - aA) < d1;
    const sweep = pOn1 ? -(2 * Math.PI - d1) : d1;
    const central = Math.abs(sweep);
    this.dynamic.add(arcAngle(CENTRE, aA, sweep, 0.95, CPUR));
    this.dynamic.add(this.angleArc(P, A, B, 0.8, CBLUE));
    this.arcLabel(CENTRE, aA + sweep / 2, 1.35, `${degStr(central)}`, CPUR);

    return `<h3>Angle at the centre = 2 × angle at the edge ${derivationButton("centre-angle")}</h3>
      <p>Points <b>A</b>, <b>B</b> and <b>P</b> sit on the circle. The angle the arc AB makes
      at the <b>centre O</b> is always exactly twice the angle it makes at any point <b>P</b>
      on the remaining arc.</p>
      <div class="readout">
        <div><span>∠AOB (centre)</span> <b>${degStr(central)}</b></div>
        <div><span>∠APB (edge)</span> <b>${degStr(inscribed)}</b></div>
        <div><span>centre ÷ edge</span> <b>${(central / inscribed).toFixed(3)}</b> (always 2)</div>
      </div>`;
  }

  private drawSameSeg(): string {
    const A = this.onCircle(0), B = this.onCircle(1), P = this.onCircle(2), Q = this.onCircle(3);
    this.line([A, B], CPUR);
    this.line([A, P], CBLUE); this.line([B, P], CBLUE);
    this.line([A, Q], CGRN); this.line([B, Q], CGRN);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(P, "P"); this.tag(Q, "Q");
    this.dynamic.add(this.angleArc(P, A, B, 0.75, CBLUE));
    this.dynamic.add(this.angleArc(Q, A, B, 0.75, CGRN));
    const ap = angleAt(P, A, B), aq = angleAt(Q, A, B);
    return `<h3>Angles in the same segment are equal ${derivationButton("same-segment")}</h3>
      <p>The chord <b>AB</b> is seen from two points <b>P</b> and <b>Q</b> on the same arc.
      Both "see" AB at the same angle, wherever they slide along that arc.</p>
      <div class="readout">
        <div><span>∠APB</span> <b>${degStr(ap)}</b></div>
        <div><span>∠AQB</span> <b>${degStr(aq)}</b></div>
      </div>`;
  }

  private drawThales(): string {
    const A = this.onCircle(0);
    const B = A.clone().multiplyScalar(-1); // diametrically opposite through centre
    const P = this.onCircle(1);
    this.line([A, B], CPUR); // diameter
    this.line([A, P], CBLUE); this.line([B, P], CBLUE);
    this.tag(A, "A"); this.tag(B, "B"); this.tag(P, "P");
    this.dynamic.add(this.rightAngleMark(P, A, B, CRED));
    const ang = angleAt(P, A, B);
    return `<h3>Angle in a semicircle = 90° ${derivationButton("thales")}</h3>
      <p>When <b>AB</b> is a <b>diameter</b> (it passes through the centre), any point <b>P</b>
      on the circle sees it at a right angle. Drag P around — it's always 90°.</p>
      <div class="readout"><div><span>∠APB</span> <b>${degStr(ang)}</b></div></div>`;
  }

  private drawCyclic(): string {
    const P = [this.onCircle(0), this.onCircle(1), this.onCircle(2), this.onCircle(3)];
    // Sort by angle so the quadrilateral is non-self-intersecting.
    const order = [0, 1, 2, 3].sort((i, j) => this.angles[i] - this.angles[j]);
    const q = order.map((i) => P[i]);
    for (let i = 0; i < 4; i++) this.line([q[i], q[(i + 1) % 4]], CBLUE);
    const names = ["A", "B", "C", "D"];
    q.forEach((v, i) => this.tag(v, names[i]));
    const ang = q.map((v, i) => angleAt(v, q[(i + 3) % 4], q[(i + 1) % 4]));
    q.forEach((v, i) => this.dynamic.add(this.angleArc(v, q[(i + 3) % 4], q[(i + 1) % 4], 0.6, CYEL)));
    return `<h3>Cyclic quadrilateral — opposite angles add to 180° ${derivationButton("cyclic-opposites")}</h3>
      <p>Four points on a circle make a <b>cyclic quadrilateral</b>. Each pair of
      <b>opposite</b> corners always sums to a straight angle.</p>
      <div class="readout">
        <div><span>A + C</span> <b>${degStr(ang[0] + ang[2])}</b></div>
        <div><span>B + D</span> <b>${degStr(ang[1] + ang[3])}</b></div>
      </div>`;
  }

  private drawTangent(): string {
    const T = this.onCircle(0);
    const radial = T.clone().sub(CENTRE).normalize();
    const tangentDir = new THREE.Vector3(-radial.y, radial.x, 0);
    this.line([CENTRE, T], CPUR);
    this.line([T.clone().addScaledVector(tangentDir, -3.2), T.clone().addScaledVector(tangentDir, 3.2)], CORG);
    this.tag(T, "T"); this.tag(CENTRE, "O", 0x8b949e);
    this.dynamic.add(this.rightAngleMark(T, CENTRE, T.clone().addScaledVector(tangentDir, 1), CRED));
    return `<h3>A tangent meets the radius at 90° ${derivationButton("tangent-radius")}</h3>
      <p>The orange line just touches the circle at <b>T</b> (a <b>tangent</b>). The radius
      <b>OT</b> drawn to that point is always perpendicular to it.</p>
      <div class="readout"><div><span>angle between OT and tangent</span> <b>90.00°</b></div></div>`;
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
    this.tag(P, "P"); this.tag(T1, "T₁"); this.tag(T2, "T₂"); this.tag(CENTRE, "O", 0x8b949e);
    this.dynamic.add(this.rightAngleMark(T1, CENTRE, P, CRED));
    this.dynamic.add(this.rightAngleMark(T2, CENTRE, P, CRED));
    const l1 = P.distanceTo(T1), l2 = P.distanceTo(T2);
    return `<h3>Two tangents from a point are equal ${derivationButton("equal-tangents")}</h3>
      <p>From an external point <b>P</b> (drag it) there are exactly two tangents to the
      circle. The distances from P to the two touch points are always equal.</p>
      <div class="readout">
        <div><span>P T₁</span> <b>${l1.toFixed(2)}</b></div>
        <div><span>P T₂</span> <b>${l2.toFixed(2)}</b></div>
      </div>`;
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
    return `<h3>The perpendicular from the centre bisects a chord ${derivationButton("chord-bisector")}</h3>
      <p>Drop a line from the <b>centre O</b> to a chord <b>AB</b> so it meets at a right
      angle: it always lands on the <b>midpoint M</b>, splitting the chord into two equal
      halves.</p>
      <div class="readout">
        <div><span>AM</span> <b>${am.toFixed(2)}</b></div>
        <div><span>MB</span> <b>${mb.toFixed(2)}</b></div>
      </div>`;
  }

  // ---- primitives --------------------------------------------------------

  private line(pts: THREE.Vector3[], color: number): void {
    this.dynamic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })));
  }

  private tag(p: THREE.Vector3, name: string, color = 0xffffff): void {
    const t = textSprite(name, color, 0.4);
    const dir = p.clone().sub(CENTRE);
    const off = dir.lengthSq() < 1e-6 ? new THREE.Vector3(0.4, -0.4, 0) : dir.normalize().multiplyScalar(0.5);
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

  // ---- info panel --------------------------------------------------------

  private renderPanel(body: string): void {
    const buttons = (Object.keys(MODES) as Mode[])
      .map((m) => `<button class="course-btn${m === this.mode ? "" : " ghost"}" data-circle="${m}">${MODES[m].label}</button>`)
      .join(" ");

    this.setInfo(`
      <h2>Circle Theorems</h2>
      <p>A handful of rules govern angles and lines in a circle. Pick a theorem, then
      <b>drag the coloured points</b> — the picture and the measured numbers update so you
      can watch the rule hold for every position.</p>

      <div class="course">
        <h3>Choose a theorem</h3>
        <div class="course-chapters">${buttons}</div>
      </div>

      <div class="course">${body}</div>

      <div class="course">
        <h3>Circle basics ${derivationButton("circle-basics")}</h3>
        <div class="readout">
          <div><span>Radius r</span> ${R.toFixed(2)}</div>
          <div><span>Circumference 2πr</span> ${(2 * Math.PI * R).toFixed(2)}</div>
          <div><span>Area πr²</span> ${(Math.PI * R * R).toFixed(2)}</div>
        </div>
      </div>`);
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

function degStr(rad: number): string {
  return `${(THREE.MathUtils.radToDeg(rad)).toFixed(2)}°`;
}
