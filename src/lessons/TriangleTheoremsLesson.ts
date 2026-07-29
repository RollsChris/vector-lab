import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { triangleCentres, type Pt } from "../math/triangleCentres";
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
  N: THREE.Vector3; // nine-point centre (midpoint of OH)
  R: number; // circumradius
  r: number; // inradius
  /** Midpoints of BC, CA, AB. */
  midpoints: THREE.Vector3[];
  /** Feet of the altitudes from A, B, C. */
  feet: THREE.Vector3[];
  /** Euler points — midpoints of AH, BH, CH. */
  eulerPoints: THREE.Vector3[];
  valid: boolean;
}

/** One beat of a construction animation: a caption plus geometry that grows with p ∈ [0,1]. */
interface AnimStep {
  caption: string;
  seconds: number;
  draw: (m: Metrics, p: number, add: (o: THREE.Object3D) => void) => void;
}

interface AnimState {
  key: string;
  title: string;
  steps: AnimStep[];
  index: number;
  t: number;
  playing: boolean;
  done: boolean;
}

interface Params {
  labels: boolean;
  medians: boolean;
  circumcircle: boolean;
  incircle: boolean;
  altitudes: boolean;
  eulerLine: boolean;
  medial: boolean;
  ninePoint: boolean;
}

/** Which overlay toggle each animation leaves switched on when it finishes. */
const ANIM_TOGGLE: Record<string, keyof Params> = {
  centroid: "medians",
  circumcentre: "circumcircle",
  incentre: "incircle",
  orthocentre: "altitudes",
  ninePoint: "ninePoint",
  euler: "eulerLine",
};

const ANIM_TITLE: Record<string, string> = {
  centroid: "Centroid G",
  circumcentre: "Circumcentre O",
  incentre: "Incentre I",
  orthocentre: "Orthocentre H",
  ninePoint: "Nine-point circle",
  euler: "Euler line",
};

/** What each construction is actually good for, shown alongside the animation. */
const ANIM_USE: Record<string, string> = {
  centroid:
    "Finding a balance point. Hang or lift a triangular plate, bracket or sail here and it stays level; the same weights (barycentric coordinates) let graphics hardware blend colour, texture and lighting smoothly across every triangle on screen.",
  circumcentre:
    "Siting one thing equidistant from three others — a mast, depot or fire station equally far from three towns. Run it backwards and three points measured on a broken circular part recover its centre and radius. Delaunay triangulation, behind terrain and GIS meshes, tests points against exactly this circle.",
  incentre:
    "Fitting the largest circle inside a triangular space: a round table in a triangular room, the fattest pipe through a triangular duct, or the biggest cutter radius that can clear a triangular pocket without gouging the walls.",
  orthocentre:
    "The altitudes are the everyday part — each one is a height of the triangle, which is what ½ × base × height needs, and what a roof pitch or a truss depth is measured along. H itself is a check: it lands exactly on the corner of a right-angled triangle, so if it drifts off, the corner is not square.",
  ninePoint:
    "Mostly a piece of beautiful structure, but a demanding one: nine points built three different ways must agree to floating-point precision, which makes it a stiff test for geometry code — that is exactly the max-error figure printed below. Feuerbach's theorem then shows it touches the incircle and all three excircles.",
  euler:
    "A constraint you can check. Three centres constructed three unrelated ways must land on one line at fixed 1:2 spacing, so it is a fast sanity test on any triangle geometry — if O, G and H don't line up, the arithmetic is wrong somewhere.",
};

const COL = {
  edge: 0x58a6ff,
  vertex: 0xffd166,
  centroid: 0x7ee787,
  circum: 0xd2a8ff,
  incircle: 0xffa657,
  ortho: 0xff7b72,
  euler: 0xf0f6fc,
  medial: 0x79c0ff,
  nine: 0x56d4dd,
  ghost: 0x8b949e,
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
  private animLayer = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private stopTick?: () => void;
  private prevRotate = true;
  private anim?: AnimState;
  private animDirty = true;
  private readonly playback = { speed: 1 };
  private controllers: Partial<Record<keyof Params, { updateDisplay(): void }>> = {};

  private verts: THREE.Vector3[] = [
    new THREE.Vector3(-4, -2.4, 0),
    new THREE.Vector3(4.5, -1.4, 0),
    new THREE.Vector3(-1, 3, 0),
  ];

  private readonly params: Params = {
    labels: true,
    medians: false,
    circumcircle: false,
    incircle: false,
    altitudes: false,
    eulerLine: false,
    medial: false,
    ninePoint: false,
  };

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tri]");
    if (!btn) return;
    const act = btn.dataset.tri as string;
    if (act.startsWith("anim:")) this.startAnim(act.slice(5));
    else if (act === "anim-play") this.toggleAnimPlay();
    else if (act === "anim-restart") this.startAnim(this.anim?.key ?? "centroid");
    else if (act === "anim-back") this.stepAnim(-1);
    else if (act === "anim-next") this.stepAnim(1);
    else if (act === "anim-close") this.stopAnim();
    else if (act === "clear-all") this.clearAll();
    else if (act === "random") this.randomise();
    else this.preset(act);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic);
    this.group.add(this.animLayer);
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
      this.animDirty = true;
      this.rebuild();
    });

    const gui = ctx.gui;
    const f = gui.addFolder("Theorems to show");
    tip(f.add(this.params, "labels").name("Sides, angles & sum").onChange(() => this.rebuild()), "Label the sides a,b,c and angles A,B,C, with angle arcs. Their sum is always 180°.");
    this.controllers.medians = tip(f.add(this.params, "medians").name("Medians → centroid").onChange(() => this.rebuild()), "The three medians (vertex → opposite midpoint) always meet at the centroid G, which splits each 2:1.");
    this.controllers.circumcircle = tip(f.add(this.params, "circumcircle").name("Circumcircle (O)").onChange(() => this.rebuild()), "Perpendicular bisectors of the sides meet at the circumcentre O — the centre of the circle through all three vertices.");
    this.controllers.incircle = tip(f.add(this.params, "incircle").name("Incircle (I)").onChange(() => this.rebuild()), "Angle bisectors meet at the incentre I — the centre of the largest circle that fits inside.");
    this.controllers.altitudes = tip(f.add(this.params, "altitudes").name("Altitudes → orthocentre").onChange(() => this.rebuild()), "The three altitudes (vertex ⟂ opposite side) meet at the orthocentre H.");
    this.controllers.ninePoint = tip(f.add(this.params, "ninePoint").name("Nine-point circle (N)").onChange(() => this.rebuild()), "One circle of radius R/2, centred at the midpoint of OH, through the three side midpoints, the three altitude feet and the three Euler points.");
    this.controllers.eulerLine = tip(f.add(this.params, "eulerLine").name("Euler line").onChange(() => this.rebuild()), "O, G, N and H are always collinear, and G divides OH in the ratio 1:2.");
    this.controllers.medial = tip(f.add(this.params, "medial").name("Medial triangle").onChange(() => this.rebuild()), "Joining the three midpoints makes a triangle whose sides are parallel to, and half the length of, the originals (the midsegment theorem).");
    f.open();

    const a = gui.addFolder("Construction animation");
    tip(a.add(this.playback, "speed", 0.25, 3, 0.25).name("Speed ×"), "How fast a construction animation plays. Start one with the ▶ buttons in the info panel.");
    a.open();

    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.rebuild();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.stopTick?.();
    this.stopTick = undefined;
    this.anim = undefined;
    this.controllers = {};
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.prevRotate;
    this.disposeChildren(this.animLayer);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.animLayer = new THREE.Group();
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
    const centres = triangleCentres(A, B, C);
    const valid = centres !== null;

    const O = centres ? v3(centres.O) : G.clone();
    const R = centres ? centres.R : 0;
    const I = centres ? v3(centres.I) : G.clone();
    const r = centres ? centres.r : 0;
    const H = centres ? v3(centres.H) : G.clone();
    const N = centres ? v3(centres.ninePoint.centre) : G.clone();
    const midpoints = centres ? centres.ninePoint.sideMidpoints.map(v3) : [G.clone(), G.clone(), G.clone()];
    const feet = centres ? centres.ninePoint.altitudeFeet.map(v3) : [G.clone(), G.clone(), G.clone()];
    const eulerPoints = centres ? centres.ninePoint.eulerPoints.map(v3) : [G.clone(), G.clone(), G.clone()];

    return {
      A, B, C, a, b, c, angA, angB, angC, area, perim, s,
      G, O, I, H, N, R, r, midpoints, feet, eulerPoints, valid,
    };
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
    if (this.params.ninePoint && m.valid) this.drawNinePoint(m);
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
    const { O, H, G, N } = m;
    // Extend the O–H line to the edges of the view for emphasis.
    const dir = H.clone().sub(O);
    if (dir.lengthSq() < 1e-6) return;
    dir.normalize();
    const a = O.clone().addScaledVector(dir, -14);
    const b = O.clone().addScaledVector(dir, 14);
    this.dynamic.add(this.poly([a, b], COL.euler, false, 1));
    for (const [p, name, col] of [[O, "O", COL.circum], [N, "N", COL.nine], [G, "G", COL.centroid], [H, "H", COL.ortho]] as [THREE.Vector3, string, number][]) {
      this.addCentre(p, name, col);
    }
  }

  private drawNinePoint(m: Metrics): void {
    this.dynamic.add(this.circle(m.N, m.R / 2, COL.nine));
    for (const p of m.midpoints) this.dynamic.add(this.dot(p, COL.nine));
    for (const p of m.feet) this.dynamic.add(this.dot(p, COL.nine));
    for (const p of m.eulerPoints) this.dynamic.add(this.dot(p, COL.nine));
    // The Euler points are the halfway marks on the vertex→H segments.
    for (const v of [m.A, m.B, m.C]) this.dynamic.add(this.poly([v, m.H], COL.nine, false, 1));
    this.addCentre(m.N, "N", COL.nine);
  }

  // ---- construction animation -------------------------------------------

  /** Start (or restart) the step-by-step construction for one centre. */
  private startAnim(key: string): void {
    const steps = this.buildSteps(key);
    if (!steps.length) return;
    const toggle = ANIM_TOGGLE[key];
    if (toggle) {
      // Hide the matching static overlay so the construction builds up from nothing
      // rather than starting with the answer already on screen.
      this.params[toggle] = false;
      this.controllers[toggle]?.updateDisplay();
    }
    this.anim = { key, title: ANIM_TITLE[key] ?? key, steps, index: 0, t: 0, playing: true, done: false };
    this.animDirty = true;
    this.rebuild();
    this.drawAnim();
  }

  private stopAnim(): void {
    this.anim = undefined;
    this.disposeChildren(this.animLayer);
    this.rebuild();
  }

  /** Reset the viewport to a bare triangle: no animation, no construction overlays. */
  private clearAll(): void {
    this.anim = undefined;
    this.disposeChildren(this.animLayer);
    for (const key of ["medians", "circumcircle", "incircle", "altitudes", "ninePoint", "eulerLine", "medial"] as (keyof Params)[]) {
      this.params[key] = false;
      this.controllers[key]?.updateDisplay();
    }
    this.rebuild();
  }

  private toggleAnimPlay(): void {
    const a = this.anim;
    if (!a) return;
    if (a.done) {
      this.startAnim(a.key);
      return;
    }
    a.playing = !a.playing;
    this.animDirty = true;
    this.updateCaption();
  }

  /**
   * Manual transport. Each stepped-to step is shown *complete*, so the caption and the
   * geometry it describes always match; pressing Play then carries on from the next one.
   */
  private stepAnim(dir: number): void {
    const a = this.anim;
    if (!a) return;
    a.playing = false;
    if (dir > 0 && a.index >= a.steps.length - 1) {
      this.finishAnim();
      return;
    }
    a.index = THREE.MathUtils.clamp(a.index + dir, 0, a.steps.length - 1);
    a.t = a.steps[a.index].seconds;
    a.done = false;
    this.animDirty = true;
    this.updateCaption();
    this.drawAnim();
  }

  /** Last step reached: freeze the finished construction on screen. */
  private finishAnim(): void {
    const a = this.anim;
    if (!a) return;
    a.index = a.steps.length - 1;
    a.t = a.steps[a.index].seconds;
    a.playing = false;
    a.done = true;
    this.animDirty = true;
    this.updateCaption();
    this.drawAnim();
  }

  private tick(dt: number): void {
    const a = this.anim;
    if (!a) return;
    if (a.playing) {
      a.t += dt * this.playback.speed;
      let stepped = false;
      while (a.t >= a.steps[a.index].seconds) {
        if (a.index >= a.steps.length - 1) {
          this.finishAnim();
          return;
        }
        a.t -= a.steps[a.index].seconds;
        a.index++;
        stepped = true;
      }
      if (stepped) this.updateCaption();
      this.drawAnim();
      return;
    }
    // Paused or finished: only redraw when something actually moved.
    if (this.animDirty) {
      this.animDirty = false;
      this.drawAnim();
    }
  }

  /**
   * Redraw the construction from scratch every frame: completed steps at full
   * extent, the current one part-drawn. Because it reads live metrics you can
   * drag a vertex mid-animation and the construction follows.
   */
  private drawAnim(): void {
    this.disposeChildren(this.animLayer);
    const a = this.anim;
    if (!a) return;
    const m = this.compute();
    if (!m.valid) return;
    const add = (o: THREE.Object3D) => this.animLayer.add(o);
    for (let i = 0; i < a.index; i++) a.steps[i].draw(m, 1, add);
    const cur = a.steps[a.index];
    const raw = a.done ? 1 : THREE.MathUtils.clamp(a.t / cur.seconds, 0, 1);
    cur.draw(m, ease(raw), add);
    const bar = document.getElementById("tri-progress");
    if (bar) bar.style.width = `${Math.round(((a.index + raw) / a.steps.length) * 100)}%`;
  }

  /** Refresh just the transport strip, so the whole info panel doesn't reflow mid-play. */
  private updateCaption(): void {
    const a = this.anim;
    if (!a) return;
    const cap = document.getElementById("tri-caption");
    if (cap) cap.innerHTML = a.steps[a.index].caption;
    const step = document.getElementById("tri-step");
    if (step) step.textContent = `Step ${a.index + 1} of ${a.steps.length}`;
    const play = document.getElementById("tri-play");
    if (play) play.textContent = a.done ? "↺ Replay" : a.playing ? "⏸ Pause" : "▶ Play";
    const back = document.getElementById("tri-back") as HTMLButtonElement | null;
    if (back) back.disabled = a.index === 0 && !a.done;
    const next = document.getElementById("tri-next") as HTMLButtonElement | null;
    if (next) next.disabled = a.done;
  }

  // ---- animation drawing helpers ----------------------------------------

  private growLine(from: THREE.Vector3, to: THREE.Vector3, p: number, color: number, width = 2): THREE.Line {
    const end = from.clone().lerp(to, Math.max(p, 0.0001));
    return this.poly([from, end], color, false, width) as THREE.Line;
  }

  /** A line that grows outwards from `centre` in both directions along `dir`. */
  private growBoth(centre: THREE.Vector3, dir: THREE.Vector3, half: number, p: number, color: number): THREE.Line {
    const d = dir.clone().normalize().multiplyScalar(half * Math.max(p, 0.0001));
    return this.poly([centre.clone().sub(d), centre.clone().add(d)], color, false, 2) as THREE.Line;
  }

  /** Partial circle, swept anticlockwise from the 3 o'clock position. */
  private growCircle(centre: THREE.Vector3, radius: number, p: number, color: number): THREE.Line {
    const span = Math.PI * 2 * THREE.MathUtils.clamp(p, 0.0001, 1);
    const n = Math.max(2, Math.ceil(96 * p));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = (span * i) / n;
      pts.push(new THREE.Vector3(centre.x + radius * Math.cos(t), centre.y + radius * Math.sin(t), 0));
    }
    return this.poly(pts, color, false, 2) as THREE.Line;
  }

  private popDot(pos: THREE.Vector3, color: number, p: number): THREE.Mesh {
    const d = this.dot(pos, color);
    // Slight overshoot so each point "lands" rather than fading in.
    const s = p < 0.7 ? (p / 0.7) * 1.35 : 1.35 - ((p - 0.7) / 0.3) * 0.35;
    d.scale.setScalar(Math.max(s, 0.001));
    return d;
  }

  private tag(pos: THREE.Vector3, text: string, color: number, size = 0.36): THREE.Sprite {
    const t = textSprite(text, color, size);
    t.position.copy(pos);
    return t;
  }

  /** Small square marking a right angle at `corner`, opening towards p and q. */
  private rightAngle(corner: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3, color: number, size = 0.32): THREE.Line {
    const u = p.clone().sub(corner).normalize().multiplyScalar(size);
    const w = q.clone().sub(corner).normalize().multiplyScalar(size);
    return this.poly(
      [corner.clone().add(u), corner.clone().add(u).add(w), corner.clone().add(w)],
      color,
      false,
      2,
    ) as THREE.Line;
  }

  /** Where the ray from `v` through `via` meets the line pq. */
  private rayToSide(v: THREE.Vector3, via: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3): THREE.Vector3 {
    const d = via.clone().sub(v);
    const e = q.clone().sub(p);
    const den = d.x * e.y - d.y * e.x;
    if (Math.abs(den) < 1e-9) return via.clone();
    const t = ((p.x - v.x) * e.y - (p.y - v.y) * e.x) / den;
    return v.clone().addScaledVector(d, t);
  }

  // ---- animation scripts -------------------------------------------------

  private buildSteps(key: string): AnimStep[] {
    switch (key) {
      case "centroid":
        return this.centroidSteps();
      case "circumcentre":
        return this.circumcentreSteps();
      case "incentre":
        return this.incentreSteps();
      case "orthocentre":
        return this.orthocentreSteps();
      case "ninePoint":
        return this.ninePointSteps();
      case "euler":
        return this.eulerSteps();
      default:
        return [];
    }
  }

  private centroidSteps(): AnimStep[] {
    const col = COL.centroid;
    const median = (i: number) => (m: Metrics): [THREE.Vector3, THREE.Vector3] =>
      [[m.A, m.midpoints[0]], [m.B, m.midpoints[1]], [m.C, m.midpoints[2]]][i] as [THREE.Vector3, THREE.Vector3];
    const names = ["A", "B", "C"];
    const opposite = ["BC", "CA", "AB"];
    const steps: AnimStep[] = [
      {
        caption: "Mark the <b>midpoint</b> of each side — the exact halfway point of BC, CA and AB.",
        seconds: 1.8,
        draw: (m, p, add) => {
          m.midpoints.forEach((mp, i) => add(this.popDot(mp, col, stagger(i, 3, p))));
        },
      },
    ];
    for (let i = 0; i < 3; i++) {
      steps.push({
        caption: `Join vertex <b>${names[i]}</b> to the midpoint of the opposite side ${opposite[i]}. That segment is a <b>median</b>.`,
        seconds: 1.6,
        draw: (m, p, add) => {
          const [from, to] = median(i)(m);
          add(this.growLine(from, to, p, col));
        },
      });
    }
    steps.push({
      caption: "All three medians pass through <b>one</b> point — the <b>centroid G</b>. That is never a coincidence, whatever shape you drag.",
      seconds: 1.6,
      draw: (m, p, add) => {
        add(this.popDot(m.G, col, p));
        if (p > 0.4) add(this.tag(m.G.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "G", col));
      },
    });
    steps.push({
      caption: "G sits <b>two-thirds</b> of the way along every median: AG : GM = 2 : 1. It is the balance point — support a triangular plate here and it won't tip.",
      seconds: 2.4,
      draw: (m, p, add) => {
        const [from, to] = median(0)(m);
        add(this.growLine(from, m.G, Math.min(p * 2, 1), COL.vertex, 3));
        if (p > 0.5) add(this.growLine(m.G, to, (p - 0.5) * 2, COL.euler, 3));
        if (p > 0.6) {
          add(this.tag(from.clone().lerp(m.G, 0.5).add(new THREE.Vector3(0.28, 0.28, 0)), "2", COL.vertex, 0.34));
          add(this.tag(m.G.clone().lerp(to, 0.5).add(new THREE.Vector3(0.28, 0.28, 0)), "1", COL.euler, 0.34));
        }
        add(this.popDot(m.G, col, 1));
      },
    });
    return steps;
  }

  private circumcentreSteps(): AnimStep[] {
    const col = COL.circum;
    const bisector = (m: Metrics, i: number, p: number): THREE.Line => {
      const [u, w] = ([[m.B, m.C], [m.C, m.A], [m.A, m.B]][i]) as [THREE.Vector3, THREE.Vector3];
      const dir = new THREE.Vector3(-(w.y - u.y), w.x - u.x, 0);
      const mid = m.midpoints[i];
      const reach = Math.max(mid.distanceTo(m.O) * 1.6, 3.5);
      return this.growBoth(mid, dir, reach, p, col);
    };
    return [
      {
        caption: "Take side <b>AB</b> and mark its midpoint — equally far from A and from B.",
        seconds: 1.6,
        draw: (m, p, add) => {
          add(this.popDot(m.midpoints[2], col, p));
        },
      },
      {
        caption: "Draw the line through it at <b>right angles</b> to AB: the <b>perpendicular bisector</b>. Every point on it is equidistant from A and B.",
        seconds: 2,
        draw: (m, p, add) => {
          add(bisector(m, 2, p));
          add(this.rightAngle(m.midpoints[2], m.A, m.O.distanceTo(m.midpoints[2]) > 1e-6 ? m.O : m.G, col));
        },
      },
      {
        caption: "Do exactly the same on side <b>BC</b> — points on this one are equidistant from B and C.",
        seconds: 1.8,
        draw: (m, p, add) => add(bisector(m, 0, p)),
      },
      {
        caption: "The two bisectors cross at a single point <b>O</b>. It is the same distance from A, B <i>and</i> C.",
        seconds: 1.6,
        draw: (m, p, add) => {
          add(this.popDot(m.O, col, p));
          if (p > 0.4) add(this.tag(m.O.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "O", col));
        },
      },
      {
        caption: "The third bisector, on <b>CA</b>, has to pass through O as well — two of the three distances already match there.",
        seconds: 1.8,
        draw: (m, p, add) => add(bisector(m, 1, p)),
      },
      {
        caption: "Measure out: OA = OB = OC. Call that common distance <b>R</b>, the circumradius.",
        seconds: 2,
        draw: (m, p, add) => {
          [m.A, m.B, m.C].forEach((v, i) => add(this.growLine(m.O, v, stagger(i, 3, p), COL.vertex, 2)));
          if (p > 0.6) add(this.tag(m.O.clone().lerp(m.A, 0.5).add(new THREE.Vector3(0.2, 0.25, 0)), `R = ${fmt(m.R)}`, COL.vertex, 0.32));
        },
      },
      {
        caption: "So one circle centred at O sweeps through all three vertices — the <b>circumcircle</b>. Three towns, one equidistant site.",
        seconds: 2.2,
        draw: (m, p, add) => {
          add(this.growCircle(m.O, m.R, p, col));
          add(this.popDot(m.O, col, 1));
        },
      },
    ];
  }

  private incentreSteps(): AnimStep[] {
    const col = COL.incircle;
    const names = ["A", "B", "C"];
    const at = (m: Metrics, i: number): [THREE.Vector3, THREE.Vector3, THREE.Vector3] =>
      [[m.A, m.B, m.C], [m.B, m.C, m.A], [m.C, m.A, m.B]][i] as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
    const steps: AnimStep[] = [];
    for (let i = 0; i < 3; i++) {
      steps.push({
        caption: i === 0
          ? "Cut angle <b>A</b> exactly in half. Every point on that <b>bisector</b> is the same distance from side AB as from side AC."
          : `Bisect angle <b>${names[i]}</b> the same way.`,
        seconds: 1.8,
        draw: (m, p, add) => {
          const [v, q, w] = at(m, i);
          add(this.arc(v, q, w, 0.9, col));
          const target = this.rayToSide(v, m.I, q, w);
          add(this.growLine(v, target, p, col));
        },
      });
    }
    steps.push({
      caption: "The three bisectors meet at the <b>incentre I</b> — equidistant from all three <i>sides</i> (not the vertices).",
      seconds: 1.6,
      draw: (m, p, add) => {
        add(this.popDot(m.I, col, p));
        if (p > 0.4) add(this.tag(m.I.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "I", col));
      },
    });
    steps.push({
      caption: "Drop a perpendicular from I onto each side: all three lengths are equal. Call it <b>r</b>.",
      seconds: 2,
      draw: (m, p, add) => {
        const pairs: [THREE.Vector3, THREE.Vector3][] = [[m.B, m.C], [m.C, m.A], [m.A, m.B]];
        pairs.forEach(([u, w], i) => {
          const f = footOf(m.I, u, w);
          const sp = stagger(i, 3, p);
          add(this.growLine(m.I, f, sp, COL.vertex, 2));
          if (sp > 0.8) add(this.rightAngle(f, u, m.I, COL.vertex, 0.26));
        });
        if (p > 0.8) add(this.tag(m.I.clone().add(new THREE.Vector3(-0.9, -0.5, 0)), `r = ${fmt(m.r)}`, COL.vertex, 0.32));
      },
    });
    steps.push({
      caption: "The circle centred at I with radius r touches all three sides — the <b>incircle</b>, the biggest circle that fits inside.",
      seconds: 2.2,
      draw: (m, p, add) => {
        add(this.growCircle(m.I, m.r, p, col));
        add(this.popDot(m.I, col, 1));
      },
    });
    return steps;
  }

  private orthocentreSteps(): AnimStep[] {
    const col = COL.ortho;
    const names = ["A", "B", "C"];
    const opp = ["BC", "CA", "AB"];
    const sideOf = (m: Metrics, i: number): [THREE.Vector3, THREE.Vector3] =>
      [[m.B, m.C], [m.C, m.A], [m.A, m.B]][i] as [THREE.Vector3, THREE.Vector3];
    const vertexOf = (m: Metrics, i: number) => [m.A, m.B, m.C][i];
    const steps: AnimStep[] = [];
    for (let i = 0; i < 3; i++) {
      steps.push({
        caption: i === 0
          ? "Drop a line from <b>A</b> straight down onto the opposite side BC, meeting it at right angles. That's an <b>altitude</b> — the triangle's height from A."
          : `Now the altitude from <b>${names[i]}</b>, perpendicular to ${opp[i]}.`,
        seconds: 1.8,
        draw: (m, p, add) => {
          const v = vertexOf(m, i);
          const [u] = sideOf(m, i);
          const f = m.feet[i];
          add(this.growLine(v, f, p, col));
          if (p > 0.9) {
            add(this.rightAngle(f, u, v, col, 0.28));
            add(this.popDot(f, col, 1));
          }
        },
      });
    }
    steps.push({
      caption: "Extend them if the triangle is obtuse — all three still cross at one point, the <b>orthocentre H</b>.",
      seconds: 2.2,
      draw: (m, p, add) => {
        for (let i = 0; i < 3; i++) {
          const v = vertexOf(m, i);
          const f = m.feet[i];
          const dir = f.clone().sub(v);
          if (dir.lengthSq() < 1e-9) continue;
          dir.normalize();
          const ts = [0, f.clone().sub(v).dot(dir), m.H.clone().sub(v).dot(dir)];
          const lo = Math.min(...ts), hi = Math.max(...ts);
          const a0 = v.clone().addScaledVector(dir, lo);
          const b0 = v.clone().addScaledVector(dir, hi);
          add(this.growLine(a0, b0, p, col, 1.5));
        }
        add(this.popDot(m.H, col, p));
        if (p > 0.4) add(this.tag(m.H.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "H", col));
      },
    });
    steps.push({
      caption: "H is the escape artist: drag a vertex until the triangle is <b>obtuse</b> and H slides outside the triangle altogether. In a right-angled triangle it lands exactly on the right-angle vertex.",
      seconds: 2.4,
      draw: (m, p, add) => {
        add(this.popDot(m.H, col, 1));
        if (p > 0.2) add(this.growCircle(m.H, 0.45 + 0.15 * Math.sin(p * Math.PI * 4), 1, col));
      },
    });
    return steps;
  }

  private ninePointSteps(): AnimStep[] {
    const col = COL.nine;
    return [
      {
        caption: "Start with three easy points: the <b>midpoints of the sides</b>.",
        seconds: 1.8,
        draw: (m, p, add) => m.midpoints.forEach((q, i) => add(this.popDot(q, col, stagger(i, 3, p)))),
      },
      {
        caption: "Add three more: the <b>feet of the altitudes</b>, where each height meets the opposite side.",
        seconds: 2,
        draw: (m, p, add) => {
          [m.A, m.B, m.C].forEach((v, i) => add(this.growLine(v, m.feet[i], stagger(i, 3, p), COL.ghost, 1)));
          m.feet.forEach((q, i) => add(this.popDot(q, col, stagger(i, 3, p))));
        },
      },
      {
        caption: "And three that look unrelated: the <b>Euler points</b> — the midpoints of AH, BH and CH, where H is the orthocentre.",
        seconds: 2.2,
        draw: (m, p, add) => {
          add(this.popDot(m.H, COL.ortho, Math.min(p * 3, 1)));
          if (p > 0.2) add(this.tag(m.H.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "H", COL.ortho, 0.32));
          [m.A, m.B, m.C].forEach((v, i) => add(this.growLine(v, m.H, stagger(i, 3, p), COL.ghost, 1)));
          m.eulerPoints.forEach((q, i) => add(this.popDot(q, col, stagger(i, 3, p))));
        },
      },
      {
        caption: "Nine points from three different constructions. Now mark <b>N</b>, the midpoint of O and H.",
        seconds: 2,
        draw: (m, p, add) => {
          add(this.growLine(m.O, m.H, p, COL.euler, 1.5));
          add(this.popDot(m.O, COL.circum, Math.min(p * 3, 1)));
          if (p > 0.2) add(this.tag(m.O.clone().add(new THREE.Vector3(0.4, -0.4, 0)), "O", COL.circum, 0.32));
          add(this.popDot(m.N, col, Math.max(0, (p - 0.5) * 2)));
          if (p > 0.7) add(this.tag(m.N.clone().add(new THREE.Vector3(0.4, 0.4, 0)), "N", col));
        },
      },
      {
        caption: "One circle, centre N and radius <b>R/2</b>, passes through <i>all nine</i> — the <b>nine-point circle</b>.",
        seconds: 2.4,
        draw: (m, p, add) => {
          add(this.growCircle(m.N, m.R / 2, p, col));
          m.midpoints.forEach((q) => add(this.popDot(q, col, 1)));
          m.feet.forEach((q) => add(this.popDot(q, col, 1)));
          m.eulerPoints.forEach((q) => add(this.popDot(q, col, 1)));
        },
      },
      {
        caption: "Why R/2? It is the circumcircle shrunk by half about H. Drag any vertex — the nine points move, and every one stays on the circle.",
        seconds: 2.4,
        draw: (m, p, add) => {
          add(this.growCircle(m.O, m.R, Math.min(p * 1.5, 1), COL.ghost));
          add(this.growCircle(m.N, m.R / 2, 1, col));
          if (p > 0.5) {
            const off = (m.R / 2) * 0.72 + 0.35;
            add(this.tag(m.N.clone().add(new THREE.Vector3(-off, off, 0)), `R/2 = ${fmt(m.R / 2)}`, col, 0.32));
          }
        },
      },
    ];
  }

  private eulerSteps(): AnimStep[] {
    const mark = (pos: THREE.Vector3, name: string, color: number, p: number, add: (o: THREE.Object3D) => void) => {
      add(this.popDot(pos, color, p));
      if (p > 0.4) add(this.tag(pos.clone().add(new THREE.Vector3(0.4, 0.4, 0)), name, color));
    };
    return [
      {
        caption: "Mark the <b>circumcentre O</b> — from the perpendicular bisectors.",
        seconds: 1.4,
        draw: (m, p, add) => mark(m.O, "O", COL.circum, p, add),
      },
      {
        caption: "Mark the <b>centroid G</b> — from the medians.",
        seconds: 1.4,
        draw: (m, p, add) => mark(m.G, "G", COL.centroid, p, add),
      },
      {
        caption: "Mark the <b>orthocentre H</b> — from the altitudes. Three centres built three completely different ways.",
        seconds: 1.6,
        draw: (m, p, add) => mark(m.H, "H", COL.ortho, p, add),
      },
      {
        caption: "They are never scattered: one straight line threads all three — the <b>Euler line</b>.",
        seconds: 2.2,
        draw: (m, p, add) => {
          const dir = m.H.clone().sub(m.O);
          if (dir.lengthSq() < 1e-6) return;
          add(this.growBoth(m.O.clone().lerp(m.H, 0.5), dir, 14, p, COL.euler));
        },
      },
      {
        caption: "The spacing is fixed too: <b>OG : GH = 1 : 2</b>. G is always a third of the way from O to H.",
        seconds: 2.2,
        draw: (m, p, add) => {
          add(this.growLine(m.O, m.G, Math.min(p * 2, 1), COL.circum, 4));
          if (p > 0.5) add(this.growLine(m.G, m.H, (p - 0.5) * 2, COL.ortho, 4));
          if (p > 0.7) {
            // Offset the ratio labels off the line itself so they stay readable.
            const n = new THREE.Vector3(-(m.H.y - m.O.y), m.H.x - m.O.x, 0).normalize().multiplyScalar(0.42);
            add(this.tag(m.O.clone().lerp(m.G, 0.5).add(n), "1", COL.circum, 0.34));
            add(this.tag(m.G.clone().lerp(m.H, 0.5).add(n), "2", COL.ortho, 0.34));
          }
        },
      },
      {
        caption: "And the nine-point centre <b>N</b> sits exactly halfway between O and H — a fourth passenger on the same line. Only the incentre I stays off it (unless the triangle is isosceles).",
        seconds: 2.4,
        draw: (m, p, add) => {
          mark(m.N, "N", COL.nine, p, add);
          if (p > 0.5) mark(m.I, "I", COL.incircle, (p - 0.5) * 2, add);
        },
      },
    ];
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
        this.animDirty = true;
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
      this.animDirty = true;
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

    const a = this.anim;
    const transport = a
      ? `<div style="margin:8px 0 12px;padding:10px;border:1px solid #30363d;border-radius:8px;background:#0d1117">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <b style="color:#f0f6fc">Building: ${a.title}</b>
            <span id="tri-step" style="color:var(--muted);font-size:12px">Step ${a.index + 1} of ${a.steps.length}</span>
          </div>
          <div style="height:4px;border-radius:2px;background:#21262d;margin:8px 0">
            <div id="tri-progress" style="height:100%;width:0%;border-radius:2px;background:#58a6ff"></div>
          </div>
          <p id="tri-caption" style="margin:6px 0 10px;color:#c9d1d9">${a.steps[a.index].caption}</p>
          <p style="margin:0 0 10px;padding:8px 10px;border-left:2px solid #58a6ff;background:#161b22;border-radius:0 6px 6px 0;color:var(--muted);font-size:13px"><b style="color:#f0f6fc">Used for:</b> ${ANIM_USE[a.key] ?? ""}</p>
          <div class="course-chapters" style="margin:0">
            <button class="course-btn" data-tri="anim-play" id="tri-play">${a.done ? "↺ Replay" : a.playing ? "⏸ Pause" : "▶ Play"}</button>
            <button class="course-btn ghost" data-tri="anim-back" id="tri-back"${a.index === 0 && !a.done ? " disabled" : ""}>⏮ Back</button>
            <button class="course-btn ghost" data-tri="anim-next" id="tri-next"${a.done ? " disabled" : ""}>⏭ Next</button>
            <button class="course-btn ghost" data-tri="anim-close">✕ Clear this</button>
          </div>
          <p class="course-hint" style="margin-top:8px">Back and Next show one step at a time,
          fully drawn; Play carries on from there. Drag a vertex at any point — the construction
          rebuilds on the new shape.</p>
        </div>`
      : "";

    const animBtn = (key: string, label: string) =>
      `<button class="course-btn ghost" data-tri="anim:${key}" style="padding:2px 8px;font-size:12px">▶ Animate</button> <span style="color:var(--muted);font-size:12px">${label}</span>`;

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
        <h3>Watch a centre get built</h3>
        <p style="margin:2px 0 8px">Click one and the construction draws itself, step by step, with
        the reasoning at each stage. Everything stays live — drag a vertex mid-animation.</p>
        <div class="course-chapters" style="margin:0">
          <button class="course-btn" data-tri="anim:centroid">▶ Centroid G</button>
          <button class="course-btn" data-tri="anim:circumcentre">▶ Circumcentre O</button>
          <button class="course-btn" data-tri="anim:incentre">▶ Incentre I</button>
          <button class="course-btn" data-tri="anim:orthocentre">▶ Orthocentre H</button>
          <button class="course-btn" data-tri="anim:ninePoint">▶ Nine-point circle</button>
          <button class="course-btn" data-tri="anim:euler">▶ Euler line</button>
          <button class="course-btn ghost" data-tri="clear-all">✕ Clear all overlays</button>
        </div>
        <p class="course-hint" style="margin-top:8px">The animation draws in its own layer, so
        <b>✕ Clear this</b> always removes it. <b>✕ Clear all overlays</b> also unticks everything
        in <i>Theorems to show</i>, giving you a bare triangle again.</p>
      </div>

      ${transport}

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
          <li><b style="color:#7ee787">Centroid G</b> — medians meet, splits each 2:1. ${animBtn("centroid", "medians → G")}
          <span style="color:var(--muted)">The balance point / centre of mass: where to lift or
          support a triangular plate without tipping. Graphics use it (barycentric coords) to blend
          colour and light across every triangle in a 3D model.</span></li>
          <li><b style="color:#d2a8ff">Circumcentre O</b> — perpendicular bisectors; circle through all vertices (R = ${fmt(m.R)}). ${animBtn("circumcentre", "bisectors → O")}
          <span style="color:var(--muted)">The point equidistant from three <i>places</i>: site a
          cell tower or depot the same distance from three towns, or recover a circular part's
          centre and radius from three measured edge points.</span></li>
          <li><b style="color:#ffa657">Incentre I</b> — angle bisectors; largest inside circle (r = ${fmt(m.r)}). ${animBtn("incentre", "bisectors → I")}
          <span style="color:var(--muted)">The point equidistant from three <i>sides</i>, and the
          biggest circle that fits inside: a round table in a triangular room, a pipe in a
          triangular duct, or the largest fillet a tool can cut into a triangular pocket.</span></li>
          <li><b style="color:#ff7b72">Orthocentre H</b> — altitudes meet here. ${animBtn("orthocentre", "altitudes → H")}
          <span style="color:var(--muted)">The altitudes are the useful part: each is a
          <i>height</i> of the triangle, which is what ½·base·height needs, and what a roof pitch
          or truss depth is measured along. H itself is a check — it sits exactly on the corner of
          a right-angled triangle, and slips outside the triangle entirely once it turns
          obtuse.</span></li>
        </ul>
        <p class="course-hint" style="margin-top:8px"><b style="color:#f0f6fc">Euler line:</b>
        O, G, N and H are always collinear, with OG : GH = 1 : 2. That makes it a constraint you
        can test: three centres built three unrelated ways must land on one line, so if they don't,
        the arithmetic is wrong. ${animBtn("euler", "O, G, H on one line")}</p>
        <p class="course-hint"><b>Medial triangle:</b> joining the midpoints gives sides parallel
        and half-length — exactly the split used to subdivide a triangle mesh into four smaller
        ones for 3D graphics and finite-element modelling.</p>
      </div>

      <div class="course">
        <h3>Nine-point circle ${animBtn("ninePoint", "build all nine")}</h3>
        <div class="readout">${rows([
          ["Centre N (midpoint of OH)", `(${fmt(m.N.x)}, ${fmt(m.N.y)})`],
          ["Radius R/2", `<b>${fmt(m.R / 2)}</b>`],
          ["Check: |N − midpoint(O,H)|", fmt(m.N.distanceTo(m.O.clone().add(m.H).multiplyScalar(0.5)))],
          ["Check: all nine on the circle", ninePointCheck(m)],
        ])}</div>
        <p style="margin:6px 0 0">One circle of radius <b>R/2</b>, centred at N, passes through
        <b>nine</b> points: the three <b>side midpoints</b>, the three <b>altitude feet</b>, and the
        three <b>Euler points</b> (midpoints of AH, BH, CH). It is the circumcircle shrunk by half
        about H, which is why the radius is exactly R/2.</p>
        <p class="course-hint"><b>Real world:</b> mostly a beautiful result rather than a tool —
        but Feuerbach's theorem goes further: this circle is tangent to the incircle and to all
        three excircles, a fact used in triangle-geometry proofs and in computational geometry
        test cases.</p>
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

/** Largest deviation of the nine points from the nine-point circle, as a readout string. */
function ninePointCheck(m: Metrics): string {
  if (!m.valid) return "—";
  const target = m.R / 2;
  const worst = [...m.midpoints, ...m.feet, ...m.eulerPoints]
    .reduce((acc, p) => Math.max(acc, Math.abs(p.distanceTo(m.N) - target)), 0);
  return `<b>max error ${worst.toExponential(1)}</b>`;
}

function v3(p: Pt): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, 0);
}

/** Smoothstep, so each construction step starts and stops gently. */
function ease(p: number): number {
  const t = THREE.MathUtils.clamp(p, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Sub-progress for item `i` of `n` drawn one after another across a step. */
function stagger(i: number, n: number, p: number): number {
  return THREE.MathUtils.clamp(p * n - i, 0, 1);
}

/** Foot of the perpendicular from v onto the line pq. */
function footOf(v: THREE.Vector3, p: THREE.Vector3, q: THREE.Vector3): THREE.Vector3 {
  const pq = q.clone().sub(p);
  const lenSq = pq.lengthSq();
  if (lenSq < 1e-12) return p.clone();
  const t = v.clone().sub(p).dot(pq) / lenSq;
  return p.clone().addScaledVector(pq, t);
}
