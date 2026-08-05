import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { createDragControls, marker, textSprite, tip } from "./helpers";
import "./formulaDerivations/quadrilaterals";

const BOX = { x: 6.6, y: 4.0 };

const COL = {
  edge: 0x58a6ff,
  vertex: 0xffd166,
  diag: 0xd2a8ff,
  cross: 0x7ee787,
  angle: 0xffd166,
  warn: 0xff7b72,
};

interface Metrics {
  P: THREE.Vector3[]; // A B C D in order
  sides: number[]; // AB BC CD DA
  interior: number[]; // interior angle at A B C D (radians)
  angleSum: number; // degrees
  area: number; // shoelace
  simple: boolean; // no self-intersection
  orient: number; // +1 CCW, -1 CW
  // diagonals
  dAC: number;
  dBD: number;
  diagsBisect: boolean;
  diagsEqual: boolean;
  diagsPerp: boolean;
  cross: THREE.Vector3 | null; // diagonal intersection point
  // parallel pairs (by index of edge: 0=AB,1=BC,2=CD,3=DA)
  abParDc: boolean; // AB ∥ DC
  bcParAd: boolean; // BC ∥ AD
  kind: string;
}

/**
 * Lesson 8 — Quadrilaterals.
 *
 * Drag the four corners (or pick a preset) and the shape classifies itself live: square,
 * rectangle, parallelogram, rhombus, trapezium, kite or a plain quadrilateral. The angle
 * sum is always 360° — the panel proves it even when you make the shape concave. Turn on
 * the diagonals to watch which special quadrilaterals have diagonals that are equal, that
 * bisect each other, or that cross at right angles.
 */
export class QuadrilateralsLesson implements Lesson {
  readonly id = "quadrilaterals";
  readonly title = "8 · Quadrilaterals";
  readonly blurb = "Classify shapes by their properties";
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

  private verts: THREE.Vector3[] = presetShapes().square.map((v) => v.clone());

  private readonly params = {
    labels: true,
    diagonals: true,
    congruentSides: true,
  };

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-quad]");
    if (!btn) return;
    this.preset(btn.dataset.quad as string);
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

    for (let i = 0; i < 4; i++) {
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
    const f = gui.addFolder("Show");
    tip(f.add(this.params, "labels").name("Sides & angles").onChange(() => this.rebuild()), "Label each side length and interior angle, with an arc at each corner. The four angles always add to 360°.");
    tip(f.add(this.params, "diagonals").name("Diagonals").onChange(() => this.rebuild()), "Draw the two diagonals AC and BD and mark where they cross. Special quadrilaterals have special diagonals.");
    tip(f.add(this.params, "congruentSides").name("Mark equal sides").onChange(() => this.rebuild()), "Matching tick bars show sides with the same length. A square has one tick bar on all four sides.");
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
    const P = this.verts;
    const [A, B, C, D] = P;
    const sides = [A.distanceTo(B), B.distanceTo(C), C.distanceTo(D), D.distanceTo(A)];

    // Signed area (shoelace) → orientation.
    let sa = 0;
    for (let i = 0; i < 4; i++) {
      const p = P[i];
      const q = P[(i + 1) % 4];
      sa += p.x * q.y - q.x * p.y;
    }
    sa /= 2;
    const orient = sa >= 0 ? 1 : -1;
    const area = Math.abs(sa);

    // Interior angles via the turning method so the sum is always 360° for a simple quad,
    // and reflex corners of a concave quad are measured correctly.
    const interior: number[] = [];
    for (let i = 0; i < 4; i++) {
      const prev = P[(i + 3) % 4];
      const v = P[i];
      const next = P[(i + 1) % 4];
      const ein = new THREE.Vector2(v.x - prev.x, v.y - prev.y);
      const eout = new THREE.Vector2(next.x - v.x, next.y - v.y);
      const crossz = ein.x * eout.y - ein.y * eout.x;
      const dot = ein.x * eout.x + ein.y * eout.y;
      const ext = Math.atan2(crossz, dot); // signed exterior angle
      let ang = Math.PI - orient * ext;
      // keep within (0, 2π)
      if (ang < 0) ang += Math.PI * 2;
      if (ang > Math.PI * 2) ang -= Math.PI * 2;
      interior.push(ang);
    }
    const angleSum = interior.reduce((t, r) => t + THREE.MathUtils.radToDeg(r), 0);

    // Simple (non self-intersecting): opposite edges AB↔CD and BC↔DA must not cross.
    const simple =
      !segsCross(A, B, C, D) && !segsCross(B, C, D, A);

    // Diagonals.
    const dAC = A.distanceTo(C);
    const dBD = B.distanceTo(D);
    const cross = lineIntersect(A, C, B, D);
    const midAC = A.clone().add(C).multiplyScalar(0.5);
    const midBD = B.clone().add(D).multiplyScalar(0.5);
    const scale = Math.max(sides.reduce((t, s) => t + s, 0) / 4, 1e-6);
    const diagsBisect = midAC.distanceTo(midBD) < 0.03 * scale;
    const diagsEqual = Math.abs(dAC - dBD) < 0.04 * Math.max(dAC, dBD);
    const acDir = C.clone().sub(A).normalize();
    const bdDir = D.clone().sub(B).normalize();
    const diagsPerp = Math.abs(acDir.dot(bdDir)) < 0.04;

    // Parallel side pairs (AB ∥ DC and BC ∥ AD).
    const abParDc = parallel(B.clone().sub(A), C.clone().sub(D));
    const bcParAd = parallel(C.clone().sub(B), D.clone().sub(A));

    const kind = classify(sides, interior, abParDc, bcParAd, simple);

    return {
      P, sides, interior, angleSum, area, simple, orient,
      dAC, dBD, diagsBisect, diagsEqual, diagsPerp, cross,
      abParDc, bcParAd, kind,
    };
  }

  // ---- draw --------------------------------------------------------------

  private rebuild(): void {
    this.disposeChildren(this.dynamic);
    const m = this.compute();
    const P = m.P;

    for (let i = 0; i < 4; i++) this.handles[i].position.copy(P[i]);

    // Fill (two triangles) + outline.
    const fill = new THREE.Mesh(
      new THREE.BufferGeometry().setFromPoints([P[0], P[1], P[2], P[3]]),
      new THREE.MeshBasicMaterial({ color: COL.edge, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
    );
    fill.geometry.setIndex([0, 1, 2, 0, 2, 3]);
    if (m.simple) this.dynamic.add(fill);
    this.dynamic.add(this.poly(P, COL.edge, true, 2));

    if (!m.simple) {
      const warn = textSprite("Crossed sides — drag a corner back to make a simple shape.", COL.warn, 0.4);
      warn.position.set(0, BOX.y + 0.6, 0);
      this.dynamic.add(warn);
    }

    if (this.params.diagonals) this.drawDiagonals(m);
    if (this.params.congruentSides) this.drawEqualSides(m);
    if (this.params.labels) this.drawLabels(m);

    // Corner name tags.
    const centre = P.reduce((t, p) => t.add(p), new THREE.Vector3()).multiplyScalar(0.25);
    const names = ["A", "B", "C", "D"];
    for (let i = 0; i < 4; i++) {
      const t = textSprite(names[i], 0xffffff, 0.42);
      t.position.copy(P[i].clone().add(outwardOffset(P[i], centre, 0.6)));
      this.dynamic.add(t);
    }

    this.renderPanel(m);
  }

  private drawDiagonals(m: Metrics): void {
    const P = m.P;
    this.dynamic.add(this.poly([P[0], P[2]], COL.diag, false, 1));
    this.dynamic.add(this.poly([P[1], P[3]], COL.diag, false, 1));
    if (m.cross) {
      this.dynamic.add(this.dot(m.cross, COL.cross));
      if (m.diagsPerp && m.simple) {
        this.dynamic.add(this.rightAngleMark(m.cross, P[2].clone().sub(P[0]), P[3].clone().sub(P[1]), 0.35, COL.cross));
      }
    }
  }

  private drawEqualSides(m: Metrics): void {
    const groups: number[][] = [];
    const scale = m.sides.reduce((total, side) => total + side, 0) / m.sides.length;
    for (let i = 0; i < m.sides.length; i++) {
      const group = groups.find(([first]) =>
        Math.abs(m.sides[i] - m.sides[first]) < 0.04 * scale,
      );
      if (group) group.push(i);
      else groups.push([i]);
    }

    for (const [groupIndex, group] of groups.filter((group) => group.length > 1).entries()) {
      for (const edge of group) {
        this.equalSideEdge(m.P[edge], m.P[(edge + 1) % 4], groupIndex + 1);
      }
    }
  }

  private drawLabels(m: Metrics): void {
    const P = m.P;
    const centre = P.reduce((t, p) => t.add(p), new THREE.Vector3()).multiplyScalar(0.25);
    // Side lengths.
    for (let i = 0; i < 4; i++) {
      const p = P[i], q = P[(i + 1) % 4];
      const mp = p.clone().add(q).multiplyScalar(0.5);
      const t = textSprite(fmt(m.sides[i]), 0x9fd1ff, 0.32);
      t.position.copy(mp.add(outwardOffset(mp, centre, 0.42)));
      this.dynamic.add(t);
    }
    // Interior angles.
    for (let i = 0; i < 4; i++) {
      const prev = P[(i + 3) % 4];
      const v = P[i];
      const next = P[(i + 1) % 4];
      const ang = m.interior[i];
      const aNext = Math.atan2(next.y - v.y, next.x - v.x);
      const isRight = Math.abs(THREE.MathUtils.radToDeg(ang) - 90) < 0.7;
      if (isRight && m.simple) {
        this.dynamic.add(this.rightAngleMark(v, next.clone().sub(v), prev.clone().sub(v), 0.5, COL.angle));
      } else {
        this.dynamic.add(this.arcSigned(v, aNext, m.orient * ang, 0.65, COL.angle));
      }
      const bis = aNext + (m.orient * ang) / 2;
      const t = textSprite(`${Math.round(THREE.MathUtils.radToDeg(ang))}°`, COL.angle, 0.3);
      t.position.copy(new THREE.Vector3(v.x + 1.05 * Math.cos(bis), v.y + 1.05 * Math.sin(bis), 0));
      this.dynamic.add(t);
    }
  }

  private equalSideEdge(p: THREE.Vector3, q: THREE.Vector3, count: number): void {
    const dir = q.clone().sub(p).normalize();
    const nrm = new THREE.Vector3(-dir.y, dir.x, 0);
    const mid = p.clone().add(q).multiplyScalar(0.5);
    const gap = 0.14;
    for (let k = 0; k < count; k++) {
      const base = mid.clone().addScaledVector(dir, (k - (count - 1) / 2) * gap);
      this.dynamic.add(this.poly(
        [
          base.clone().addScaledVector(nrm, 0.2),
          base.clone().addScaledVector(nrm, -0.2),
        ],
        COL.edge,
        false,
        1,
      ));
    }
  }

  // ---- primitives --------------------------------------------------------

  private dot(p: THREE.Vector3, color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(p);
    return mesh;
  }

  private poly(points: THREE.Vector3[], color: number, closed: boolean, width: number): THREE.Line | THREE.LineLoop {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, linewidth: width });
    return closed ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
  }

  private arcSigned(v: THREE.Vector3, start: number, sweep: number, radius: number, color: number): THREE.Line {
    const pts: THREE.Vector3[] = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = start + (sweep * i) / n;
      pts.push(new THREE.Vector3(v.x + radius * Math.cos(a), v.y + radius * Math.sin(a), 0));
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  }

  private rightAngleMark(v: THREE.Vector3, dir1: THREE.Vector3, dir2: THREE.Vector3, size: number, color: number): THREE.Line {
    const u = dir1.clone().normalize().multiplyScalar(size);
    const w = dir2.clone().normalize().multiplyScalar(size);
    const p0 = v.clone().add(u);
    const p1 = v.clone().add(u).add(w);
    const p2 = v.clone().add(w);
    return this.poly([p0, p1, p2], color, false, 1) as THREE.Line;
  }

  // ---- presets -----------------------------------------------------------

  private preset(kind: string): void {
    const shapes = presetShapes();
    const v = shapes[kind];
    if (v) {
      this.verts = v.map((p) => p.clone());
      this.rebuild();
    }
  }

  // ---- info panel --------------------------------------------------------

  private renderPanel(m: Metrics): void {
    const degs = m.interior.map((r) => Math.round(THREE.MathUtils.radToDeg(r)));
    const chk = (ok: boolean) => (ok ? `<span style="color:#7ee787">✔</span>` : `<span style="color:var(--muted)">—</span>`);
    const rows = (items: [string, string][]) =>
      items.map(([k, v]) => `<div><span>${k}</span> ${v}</div>`).join("");

    this.setInfo(`
      <h2>Quadrilaterals</h2>
      <p>A quadrilateral is any <b>four-sided shape</b>. <b>Drag</b> the corners A, B, C, D — the
      name below updates to match the properties you make. Or pick a shape to start from:</p>

      <div class="course-chapters" style="margin-bottom:10px">
        <button class="course-btn" data-quad="square">Square</button>
        <button class="course-btn ghost" data-quad="rectangle">Rectangle</button>
        <button class="course-btn ghost" data-quad="parallelogram">Parallelogram</button>
        <button class="course-btn ghost" data-quad="rhombus">Rhombus</button>
        <button class="course-btn ghost" data-quad="trapezium">Trapezium</button>
        <button class="course-btn ghost" data-quad="kite">Kite</button>
        <button class="course-btn ghost" data-quad="general">General</button>
      </div>

      <div class="course">
        <h3>This shape is a…</h3>
        <div class="readout"><div><span>Classification</span> <b style="color:#7ee787;font-size:1.05em">${m.kind}</b></div></div>
        ${m.simple ? "" : `<p class="course-hint" style="color:#ff7b72">The sides cross over — this isn't a simple quadrilateral, so the usual rules don't apply.</p>`}
      </div>

      <div class="course">
        <h3>Angles add to 360° ${derivationButton("angle-sum")}</h3>
        <div class="readout">${rows([
          ["A", `${degs[0]}°`],
          ["B", `${degs[1]}°`],
          ["C", `${degs[2]}°`],
          ["D", `${degs[3]}°`],
          ["Sum", `<b>${fmt(m.angleSum)}°</b>`],
        ])}</div>
        <p class="course-hint">A quadrilateral splits into two triangles, and 2 × 180° = 360°.</p>
      </div>

      <div class="course">
        <h3>Sides</h3>
        <div class="readout">${rows([
          ["AB", fmt(m.sides[0])],
          ["BC", fmt(m.sides[1])],
          ["CD", fmt(m.sides[2])],
          ["DA", fmt(m.sides[3])],
        ])}</div>
      </div>

      <div class="course">
        <h3>Diagonals AC &amp; BD</h3>
        <div class="readout">${rows([
          ["AC", fmt(m.dAC)],
          ["BD", fmt(m.dBD)],
          ["Equal length", chk(m.diagsEqual)],
          ["Bisect each other", chk(m.diagsBisect)],
          ["Cross at 90°", chk(m.diagsPerp)],
        ])}</div>
      </div>

      <div class="course">
        <h3>Area (shoelace) ${derivationButton("shoelace-area")}</h3>
        <div class="readout"><div><span>Area</span> <b>${fmt(m.area)}</b></div></div>
      </div>

      <div class="course">
        <h3>The family tree</h3>
        <ul style="margin:4px 0 0;padding-left:18px">
          <li><b>Trapezium</b> — one pair of parallel sides.</li>
          <li><b>Parallelogram</b> — both pairs parallel; diagonals bisect.</li>
          <li><b>Rhombus</b> — parallelogram with 4 equal sides; diagonals cross at 90°.</li>
          <li><b>Rectangle</b> — parallelogram with 4 right angles; diagonals equal.</li>
          <li><b>Square</b> — rectangle + rhombus: all of the above.</li>
          <li><b>Kite</b> — two pairs of adjacent equal sides; diagonals cross at 90°.</li>
        </ul>
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

// ---- free functions --------------------------------------------------------

function classify(
  sides: number[],
  interior: number[],
  abParDc: boolean,
  bcParAd: boolean,
  simple: boolean,
): string {
  if (!simple) return "Crossed (complex) quadrilateral";
  const [a, b, c, d] = sides;
  const scale = (a + b + c + d) / 4;
  const eq = (x: number, y: number) => Math.abs(x - y) < 0.04 * scale;
  const degs = interior.map((r) => THREE.MathUtils.radToDeg(r));
  const allRight = degs.every((g) => Math.abs(g - 90) < 1.2);

  const bothPar = abParDc && bcParAd;
  const onePar = abParDc !== bcParAd;

  if (bothPar) {
    const allSides = eq(a, b) && eq(b, c) && eq(c, d);
    if (allSides && allRight) return "Square";
    if (allRight) return "Rectangle";
    if (allSides) return "Rhombus";
    return "Parallelogram";
  }

  // Kite: two pairs of adjacent equal sides (AB=DA & BC=CD, or AB=BC & CD=DA).
  const kite = (eq(a, d) && eq(b, c) && !eq(a, b)) || (eq(a, b) && eq(c, d) && !eq(b, c));
  if (kite && !onePar) return "Kite";

  if (onePar) return "Trapezium";
  return "General quadrilateral";
}

function parallel(u: THREE.Vector3, v: THREE.Vector3): boolean {
  const lu = u.length(), lv = v.length();
  if (lu < 1e-6 || lv < 1e-6) return false;
  const sin = Math.abs(u.x * v.y - u.y * v.x) / (lu * lv);
  return sin < 0.03;
}

function segsCross(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3): boolean {
  const d = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d1 = d(p3.x, p3.y, p4.x, p4.y, p1.x, p1.y);
  const d2 = d(p3.x, p3.y, p4.x, p4.y, p2.x, p2.y);
  const d3 = d(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  const d4 = d(p1.x, p1.y, p2.x, p2.y, p4.x, p4.y);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function lineIntersect(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3): THREE.Vector3 | null {
  const r = b.clone().sub(a);
  const s = d.clone().sub(c);
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / denom;
  return a.clone().addScaledVector(r, t);
}

function outwardOffset(p: THREE.Vector3, centre: THREE.Vector3, dist: number): THREE.Vector3 {
  const dir = p.clone().sub(centre);
  if (dir.lengthSq() < 1e-9) return new THREE.Vector3();
  return dir.normalize().multiplyScalar(dist);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return (Math.round(n * 100) / 100).toString();
}

function presetShapes(): Record<string, THREE.Vector3[]> {
  const v = (x: number, y: number) => new THREE.Vector3(x, y, 0);
  return {
    square: [v(-2.6, -2.6), v(2.6, -2.6), v(2.6, 2.6), v(-2.6, 2.6)],
    rectangle: [v(-4, -2.2), v(4, -2.2), v(4, 2.2), v(-4, 2.2)],
    parallelogram: [v(-3.4, -2.2), v(2.6, -2.2), v(4, 2.2), v(-2, 2.2)],
    rhombus: [v(0, -3.2), v(3.4, 0), v(0, 3.2), v(-3.4, 0)],
    trapezium: [v(-4, -2.2), v(4, -2.2), v(2, 2.2), v(-2, 2.2)],
    kite: [v(0, -3.4), v(2.4, -0.4), v(0, 3.2), v(-2.4, -0.4)],
    general: [v(-3.6, -2.4), v(3.8, -1.6), v(2.4, 2.6), v(-2.8, 1.4)],
  };
}
