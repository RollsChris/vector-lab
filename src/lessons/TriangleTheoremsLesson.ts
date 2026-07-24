import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { createDragControls, marker, textSprite, tip } from "./helpers";
import "./formulaDerivations/triangleTheorems";

const BOX = { x: 7.2, y: 4.4 };

interface Metrics {
  A: THREE.Vector3;
  B: THREE.Vector3;
  C: THREE.Vector3;
  a: number; // |BC|, opposite A
  b: number; // |CA|, opposite B
  c: number; // |AB|, opposite C
  angA: number;
  angB: number;
  angC: number;
  area: number;
  perim: number;
  s: number;
  G: THREE.Vector3; // centroid
  O: THREE.Vector3; // circumcentre
  I: THREE.Vector3; // incentre
  H: THREE.Vector3; // orthocentre
  R: number; // circumradius
  r: number; // inradius
  valid: boolean;
}

const COL = {
  edge: 0x58a6ff,
  vertex: 0xffd166,
  centroid: 0x7ee787,
  circum: 0xd2a8ff,
  incircle: 0xffa657,
  ortho: 0xff7b72,
  euler: 0xf0f6fc,
  medial: 0x79c0ff,
};

/**
 * Lesson 7 — Triangle Theorems.
 *
 * Any three non-collinear points make a triangle; drag the vertices (or hit Randomise) and
 * every classic result recomputes live. Toggle overlays to *see* the theorems: the three
 * medians meeting at the centroid (2:1), perpendicular bisectors giving the circumcircle,
 * angle bisectors giving the incircle, altitudes meeting at the orthocentre, the Euler line
 * that threads three of those centres, and the medial triangle behind the midsegment rule.
 * The panel checks the numbers so you can confirm angle-sum = 180°, the sine and cosine
 * rules, and that three area formulas agree — on whatever random triangle you drew.
 */
export class TriangleTheoremsLesson implements Lesson {
  readonly id = "triangle-theorems";
  readonly title = "7 · Triangle Theorems";
  readonly blurb = "Drag vertices, test the theorems";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private prevRotate = true;

  private verts: THREE.Vector3[] = [
    new THREE.Vector3(-4, -2.4, 0),
    new THREE.Vector3(4.5, -1.4, 0),
    new THREE.Vector3(-1, 3, 0),
  ];

  private readonly params = {
    labels: true,
    medians: false,
    circumcircle: false,
    incircle: false,
    altitudes: false,
    eulerLine: false,
    medial: false,
  };

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tri]");
    if (!btn) return;
    const act = btn.dataset.tri as string;
    if (act === "random") this.randomise();
    else this.preset(act);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 17), new THREE.Vector3(0, 0, 0));
    this.prevRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    for (let i = 0; i < 3; i++) {
      const h = marker(COL.vertex, 0.22);
      this.handles.push(h);
      this.group.add(h);
    }

    this.stopDrag = createDragControls(ctx.viewport, this.handles, (i, p) => {
      this.verts[i].set(
        THREE.MathUtils.clamp(p.x, -BOX.x, BOX.x),
        THREE.MathUtils.clamp(p.y, -BOX.y, BOX.y),
        0,
      );
      this.rebuild();
    });

    const gui = ctx.gui;
    const f = gui.addFolder("Theorems to show");
    tip(f.add(this.params, "labels").name("Sides, angles & sum").onChange(() => this.rebuild()), "Label the sides a,b,c and angles A,B,C, with angle arcs. Their sum is always 180°.");
    tip(f.add(this.params, "medians").name("Medians → centroid").onChange(() => this.rebuild()), "The three medians (vertex → opposite midpoint) always meet at the centroid G, which splits each 2:1.");
    tip(f.add(this.params, "circumcircle").name("Circumcircle (O)").onChange(() => this.rebuild()), "Perpendicular bisectors of the sides meet at the circumcentre O — the centre of the circle through all three vertices.");
    tip(f.add(this.params, "incircle").name("Incircle (I)").onChange(() => this.rebuild()), "Angle bisectors meet at the incentre I — the centre of the largest circle that fits inside.");
    tip(f.add(this.params, "altitudes").name("Altitudes → orthocentre").onChange(() => this.rebuild()), "The three altitudes (vertex ⟂ opposite side) meet at the orthocentre H.");
    tip(f.add(this.params, "eulerLine").name("Euler line").onChange(() => this.rebuild()), "O, G and H are always collinear, and G divides OH in the ratio 1:2.");
    tip(f.add(this.params, "medial").name("Medial triangle").onChange(() => this.rebuild()), "Joining the three midpoints makes a triangle whose sides are parallel to, and half the length of, the originals (the midsegment theorem).");
    f.open();

    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.rebuild();
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

  // ---- geometry ----------------------------------------------------------

  private compute(): Metrics {
    const [A, B, C] = this.verts;
    const a = B.distanceTo(C);
    const b = C.distanceTo(A);
    const c = A.distanceTo(B);
    const angA = angleAt(A, B, C);
    const angB = angleAt(B, C, A);
    const angC = angleAt(C, A, B);
    const cross = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
    const area = Math.abs(cross) / 2;
    const perim = a + b + c;
    const s = perim / 2;

    const G = new THREE.Vector3().addVectors(A, B).add(C).multiplyScalar(1 / 3);

    // Circumcentre via the standard determinant formula.
    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    const A2 = A.x * A.x + A.y * A.y;
    const B2 = B.x * B.x + B.y * B.y;
    const C2 = C.x * C.x + C.y * C.y;
    const valid = Math.abs(d) > 1e-6 && area > 1e-4;
    const Ox = valid ? (A2 * (B.y - C.y) + B2 * (C.y - A.y) + C2 * (A.y - B.y)) / d : G.x;
    const Oy = valid ? (A2 * (C.x - B.x) + B2 * (A.x - C.x) + C2 * (B.x - A.x)) / d : G.y;
    const O = new THREE.Vector3(Ox, Oy, 0);
    const R = O.distanceTo(A);

    // Incentre = weighted by opposite side lengths.
    const I = new THREE.Vector3()
      .addScaledVector(A, a)
      .addScaledVector(B, b)
      .addScaledVector(C, c)
      .multiplyScalar(1 / perim);
    const r = area / s;

    // Orthocentre from Euler's relation H = A + B + C − 2O.
    const H = new THREE.Vector3().addVectors(A, B).add(C).addScaledVector(O, -2);

    return { A, B, C, a, b, c, angA, angB, angC, area, perim, s, G, O, I, H, R, r, valid };
  }

  // ---- draw --------------------------------------------------------------

  private rebuild(): void {
    this.disposeChildren(this.dynamic);
    const m = this.compute();
    const { A, B, C } = m;

    this.handles[0].position.copy(A);
    this.handles[1].position.copy(B);
    this.handles[2].position.copy(C);

    // Filled triangle + outline.
    const fill = new THREE.Mesh(
      new THREE.BufferGeometry().setFromPoints([A, B, C]),
      new THREE.MeshBasicMaterial({ color: COL.edge, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
    );
    fill.geometry.setIndex([0, 1, 2]);
    this.dynamic.add(fill);
    this.dynamic.add(this.poly([A, B, C], COL.edge, true, 2));

    if (!m.valid) {
      const warn = textSprite("Too flat — that's almost a straight line, not a triangle.", 0xff7b72, 0.42);
      warn.position.set(0, 4, 0);
      this.dynamic.add(warn);
    }

    if (this.params.labels) this.drawLabels(m);
    if (this.params.medial) this.drawMedial(m);
    if (this.params.medians) this.drawMedians(m);
    if (this.params.circumcircle && m.valid) this.drawCircumcircle(m);
    if (this.params.incircle && m.valid) this.drawIncircle(m);
    if (this.params.altitudes && m.valid) this.drawAltitudes(m);
    if (this.params.eulerLine && m.valid) this.drawEuler(m);

    // Vertex name tags.
    for (const [v, name] of [[A, "A"], [B, "B"], [C, "C"]] as [THREE.Vector3, string][]) {
      const t = textSprite(name, 0xffffff, 0.42);
      t.position.copy(v.clone().add(outwardOffset(v, m.G, 0.55)));
      this.dynamic.add(t);
    }

    this.renderPanel(m);
  }

  private drawLabels(m: Metrics): void {
    const { A, B, C } = m;
    const mid = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().add(q).multiplyScalar(0.5);
    // Side lengths at edge midpoints (nudged outward from centroid).
    const sides: [THREE.Vector3, THREE.Vector3, number][] = [
      [B, C, m.a],
      [C, A, m.b],
      [A, B, m.c],
    ];
    for (const [p, q, len] of sides) {
      const t = textSprite(fmt(len), 0x9fd1ff, 0.34);
      const mp = mid(p, q);
      t.position.copy(mp.add(outwardOffset(mp, m.G, 0.42)));
      this.dynamic.add(t);
    }
    // Angle arcs + degree labels.
    const arcs: [THREE.Vector3, THREE.Vector3, THREE.Vector3, number][] = [
      [A, B, C, m.angA],
      [B, C, A, m.angB],
      [C, A, B, m.angC],
    ];
    for (const [v, p, q, ang] of arcs) {
      this.dynamic.add(this.arc(v, p, q, 0.7, 0xffd166));
      const bis = p.clone().sub(v).normalize().add(q.clone().sub(v).normalize()).normalize();
      const t = textSprite(`${Math.round(THREE.MathUtils.radToDeg(ang))}°`, 0xffd166, 0.32);
      t.position.copy(v.clone().addScaledVector(bis, 1.15));
      this.dynamic.add(t);
    }
  }

  private drawMedians(m: Metrics): void {
    const { A, B, C, G } = m;
    const mid = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().add(q).multiplyScalar(0.5);
    this.dynamic.add(this.poly([A, mid(B, C)], COL.centroid, false, 1));
    this.dynamic.add(this.poly([B, mid(C, A)], COL.centroid, false, 1));
    this.dynamic.add(this.poly([C, mid(A, B)], COL.centroid, false, 1));
    this.addCentre(G, "G", COL.centroid);
  }

  private drawMedial(m: Metrics): void {
    const { A, B, C } = m;
    const mid = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().add(q).multiplyScalar(0.5);
    const mab = mid(A, B), mbc = mid(B, C), mca = mid(C, A);
    this.dynamic.add(this.poly([mab, mbc, mca], COL.medial, true, 1.5));
    for (const p of [mab, mbc, mca]) this.dynamic.add(this.dot(p, COL.medial));
  }

  private drawCircumcircle(m: Metrics): void {
    this.dynamic.add(this.circle(m.O, m.R, COL.circum));
    // Perpendicular bisectors (from O to each edge midpoint, extended).
    const { A, B, C, O } = m;
    const mid = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().add(q).multiplyScalar(0.5);
    for (const [p, q] of [[A, B], [B, C], [C, A]] as [THREE.Vector3, THREE.Vector3][]) {
      this.dynamic.add(this.poly([O, mid(p, q)], COL.circum, false, 1));
    }
    this.addCentre(O, "O", COL.circum);
  }

  private drawIncircle(m: Metrics): void {
    this.dynamic.add(this.circle(m.I, m.r, COL.incircle));
    const { A, B, C, I } = m;
    for (const v of [A, B, C]) this.dynamic.add(this.poly([v, I], COL.incircle, false, 1));
    this.addCentre(I, "I", COL.incircle);
  }

  private drawAltitudes(m: Metrics): void {
    const { A, B, C, H } = m;
    // Foot of altitude from each vertex onto the opposite side line.
    const foot = (v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3) => {
      const pq = q.clone().sub(p);
      const t = v.clone().sub(p).dot(pq) / pq.lengthSq();
      return p.clone().addScaledVector(pq, t);
    };
    // The vertex, its foot and the orthocentre H are always collinear. Draw the whole
    // altitude spanning all three so the lines still visibly meet at H when it lies
    // outside the triangle (obtuse case), and dot the foot on the opposite side.
    const drawOne = (v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3) => {
      const f = foot(v, p, q);
      const dir = f.clone().sub(v);
      if (dir.lengthSq() < 1e-9) return;
      dir.normalize();
      const ts = [0, f.clone().sub(v).dot(dir), H.clone().sub(v).dot(dir)];
      const lo = Math.min(...ts), hi = Math.max(...ts);
      this.dynamic.add(this.poly([v.clone().addScaledVector(dir, lo), v.clone().addScaledVector(dir, hi)], COL.ortho, false, 1));
      this.dynamic.add(this.dot(f, COL.ortho));
    };
    drawOne(A, B, C);
    drawOne(B, C, A);
    drawOne(C, A, B);
    this.addCentre(H, "H", COL.ortho);
  }

  private drawEuler(m: Metrics): void {
    const { O, H, G } = m;
    // Extend the O–H line to the edges of the view for emphasis.
    const dir = H.clone().sub(O);
    if (dir.lengthSq() < 1e-6) return;
    dir.normalize();
    const a = O.clone().addScaledVector(dir, -14);
    const b = O.clone().addScaledVector(dir, 14);
    this.dynamic.add(this.poly([a, b], COL.euler, false, 1));
    for (const [p, name, col] of [[O, "O", COL.circum], [G, "G", COL.centroid], [H, "H", COL.ortho]] as [THREE.Vector3, string, number][]) {
      this.addCentre(p, name, col);
    }
  }

  // ---- primitives --------------------------------------------------------

  private addCentre(p: THREE.Vector3, name: string, color: number): void {
    this.dynamic.add(this.dot(p, color));
    const t = textSprite(name, color, 0.36);
    t.position.copy(p.clone().add(new THREE.Vector3(0.35, 0.35, 0)));
    this.dynamic.add(t);
  }

  private dot(p: THREE.Vector3, color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.copy(p);
    return mesh;
  }

  private poly(points: THREE.Vector3[], color: number, closed: boolean, width: number): THREE.Line | THREE.LineLoop {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, linewidth: width });
    return closed ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
  }

  private circle(center: THREE.Vector3, radius: number, color: number): THREE.LineLoop {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(center.x + radius * Math.cos(t), center.y + radius * Math.sin(t), 0));
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  }

  private arc(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3, radius: number, color: number): THREE.Line {
    let a0 = Math.atan2(p.y - v.y, p.x - v.x);
    let a1 = Math.atan2(q.y - v.y, q.x - v.x);
    let diff = a1 - a0;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (diff * i) / n;
      pts.push(new THREE.Vector3(v.x + radius * Math.cos(a), v.y + radius * Math.sin(a), 0));
    }
    void a1;
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  }

  // ---- presets / random --------------------------------------------------

  private randomise(): void {
    for (let attempt = 0; attempt < 60; attempt++) {
      const p = () =>
        new THREE.Vector3(
          THREE.MathUtils.randFloat(-BOX.x + 0.5, BOX.x - 0.5),
          THREE.MathUtils.randFloat(-BOX.y + 0.5, BOX.y - 0.5),
          0,
        );
      const cand = [p(), p(), p()];
      const angs = [
        angleAt(cand[0], cand[1], cand[2]),
        angleAt(cand[1], cand[2], cand[0]),
        angleAt(cand[2], cand[0], cand[1]),
      ];
      const minAng = Math.min(...angs);
      if (minAng > THREE.MathUtils.degToRad(22)) {
        this.verts = cand;
        this.rebuild();
        return;
      }
    }
  }

  private preset(kind: string): void {
    const presets: Record<string, THREE.Vector3[]> = {
      equilateral: ringTriangle(),
      right: [new THREE.Vector3(-4, -2.5, 0), new THREE.Vector3(4, -2.5, 0), new THREE.Vector3(-4, 3.5, 0)],
      isosceles: [new THREE.Vector3(-4, -2.5, 0), new THREE.Vector3(4, -2.5, 0), new THREE.Vector3(0, 3.8, 0)],
      obtuse: [new THREE.Vector3(-5.5, -1.5, 0), new THREE.Vector3(5, -2.5, 0), new THREE.Vector3(2.5, 1.5, 0)],
    };
    const v = presets[kind];
    if (v) {
      this.verts = v;
      this.rebuild();
    }
  }

  // ---- info panel --------------------------------------------------------

  private renderPanel(m: Metrics): void {
    const degA = deg(m.angA), degB = deg(m.angB), degC = deg(m.angC);
    const sum = degA + degB + degC;
    const sineA = m.a / Math.sin(m.angA);
    const sineB = m.b / Math.sin(m.angB);
    const sineC = m.c / Math.sin(m.angC);
    const cosCheck = m.a * m.a + m.b * m.b - 2 * m.a * m.b * Math.cos(m.angC); // should ≈ c²
    const areaHeron = Math.sqrt(Math.max(m.s * (m.s - m.a) * (m.s - m.b) * (m.s - m.c), 0));
    const areaSine = 0.5 * m.a * m.b * Math.sin(m.angC);

    const rows = (items: [string, string][]) =>
      items.map(([k, v]) => `<div><span>${k}</span> ${v}</div>`).join("");

    this.setInfo(`
      <h2>Triangle Theorems</h2>
      <p>A triangle is just <b>three points that aren't in a straight line</b>. <b>Drag</b> any
      corner (A, B, C) or hit <b>Randomise</b> — every theorem below recomputes on the shape
      you make. Use the <i>Theorems to show</i> panel to draw each one.</p>

      <div class="course-chapters" style="margin-bottom:10px">
        <button class="course-btn" data-tri="random">🎲 Randomise</button>
        <button class="course-btn ghost" data-tri="right">Right</button>
        <button class="course-btn ghost" data-tri="equilateral">Equilateral</button>
        <button class="course-btn ghost" data-tri="isosceles">Isosceles</button>
        <button class="course-btn ghost" data-tri="obtuse">Obtuse</button>
      </div>

      <div class="course">
        <h3>Angle sum = 180° ${derivationButton("angle-sum")}</h3>
        <div class="readout">${rows([
          ["A", `${fmt(degA)}°`],
          ["B", `${fmt(degB)}°`],
          ["C", `${fmt(degC)}°`],
          ["A+B+C", `<b>${fmt(sum)}°</b>`],
        ])}</div>
        <p class="course-hint"><b>Real world:</b> know any two angles and the third is free — used
        laying out roof trusses, staircases and set-square work.</p>
      </div>

      <div class="course">
        <h3>Sine rule &nbsp;<span style="color:var(--muted);font-weight:normal">a⁄sinA = b⁄sinB = c⁄sinC = 2R</span> ${derivationButton("sine-rule")}</h3>
        <div class="readout">${rows([
          ["a / sinA", fmt(sineA)],
          ["b / sinB", fmt(sineB)],
          ["c / sinC", fmt(sineC)],
          ["2R", `<b>${fmt(2 * m.R)}</b>`],
        ])}</div>
        <p class="course-hint"><b>Real world:</b> triangulation. Two observers a known distance
        apart each measure the angle to a far ship, fire or star, and the sine rule gives its
        range without going there.</p>
      </div>

      <div class="course">
        <h3>Cosine rule &nbsp;<span style="color:var(--muted);font-weight:normal">c² = a² + b² − 2ab·cosC</span> ${derivationButton("cosine-rule")}</h3>
        <div class="readout">${rows([
          ["a² + b² − 2ab·cosC", fmt(cosCheck)],
          ["c²", `<b>${fmt(m.c * m.c)}</b>`],
        ])}</div>
        <p class="course-hint"><b>Real world:</b> a generalised Pythagoras for triangles with no
        right angle. Sail 12 km on one bearing, turn, sail 8 km on another — how far from port?
        Also robot-arm reach and surveying distances you can't walk across.</p>
      </div>

      <div class="course">
        <h3>Area — three ways agree</h3>
        <div class="readout">${rows([
          ["Shoelace", `${fmt(m.area)} ${derivationButton("shoelace-area")}`],
          ["Heron √(s(s−a)(s−b)(s−c))", `${fmt(areaHeron)} ${derivationButton("heron-area")}`],
          ["½·a·b·sinC", `${fmt(areaSine)} ${derivationButton("sine-area")}`],
        ])}</div>
        <p class="course-hint"><b>Real world:</b> pick the formula that fits your data. Heron from
        three paced side lengths (a surveyor's field), ½·a·b·sinC from two sides and an angle (a
        sail or garden bed), shoelace from map coordinates (GIS land parcels).</p>
      </div>

      <div class="course">
        <h3>The four centres</h3>
        <ul style="margin:4px 0 0;padding-left:18px">
          <li><b style="color:#7ee787">Centroid G</b> — medians meet, splits each 2:1.
          <span style="color:var(--muted)">The balance point / centre of mass: where to lift or
          support a triangular plate without tipping. Graphics use it (barycentric coords) to blend
          colour and light across every triangle in a 3D model.</span></li>
          <li><b style="color:#d2a8ff">Circumcentre O</b> — perpendicular bisectors; circle through all vertices (R = ${fmt(m.R)}).
          <span style="color:var(--muted)">The point equidistant from three <i>places</i>: site a
          cell tower or depot the same distance from three towns, or recover a circular part's
          centre and radius from three measured edge points.</span></li>
          <li><b style="color:#ffa657">Incentre I</b> — angle bisectors; largest inside circle (r = ${fmt(m.r)}).
          <span style="color:var(--muted)">The point equidistant from three <i>sides</i>, and the
          biggest circle that fits inside: a round table in a triangular room, a pipe in a
          triangular duct, or the largest fillet a tool can cut into a triangular pocket.</span></li>
          <li><b style="color:#ff7b72">Orthocentre H</b> — altitudes meet here.
          <span style="color:var(--muted)">Mostly a theoretical centre; drag to an obtuse shape and
          it slips outside the triangle.</span></li>
        </ul>
        <p class="course-hint" style="margin-top:8px"><b style="color:#f0f6fc">Euler line:</b>
        O, G and H are always collinear — turn it on and drag: they stay on one line. A neat
        consistency check rather than an everyday tool.</p>
        <p class="course-hint"><b>Medial triangle:</b> joining the midpoints gives sides parallel
        and half-length — exactly the split used to subdivide a triangle mesh into four smaller
        ones for 3D graphics and finite-element modelling.</p>
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

function angleAt(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3): number {
  const u = p.clone().sub(v);
  const w = q.clone().sub(v);
  const d = u.length() * w.length();
  if (d < 1e-9) return 0;
  return Math.acos(THREE.MathUtils.clamp(u.dot(w) / d, -1, 1));
}

function outwardOffset(p: THREE.Vector3, centre: THREE.Vector3, dist: number): THREE.Vector3 {
  const dir = p.clone().sub(centre);
  if (dir.lengthSq() < 1e-9) return new THREE.Vector3();
  return dir.normalize().multiplyScalar(dist);
}

function ringTriangle(): THREE.Vector3[] {
  const r = 3.6;
  return [90, 210, 330].map((d) => {
    const a = THREE.MathUtils.degToRad(d);
    return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a) - 0.4, 0);
  });
}

function deg(rad: number): number {
  return THREE.MathUtils.radToDeg(rad);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return (Math.round(n * 100) / 100).toString();
}
