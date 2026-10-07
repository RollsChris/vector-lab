import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { marker, segment, textSprite, tip } from "./helpers";
import {
  PHI_MAX,
  PHI_MIN,
  STORY_STEPS,
  baseTriangle,
  clampPhi,
  cosZoom,
  sinZoom,
  smoothstep,
  sweepPhi,
  tangentAtP,
  values,
  zoomAt,
  type Point,
  type StoryValues,
} from "../math/trigStory";

/** 1 maths unit = 2.4 world units, so cosec 15° still fits the framed first quadrant. */
const U = 2.4;
const BEAT_SECONDS = 2.2;
const DIM = 0.35;
const STEP_ZOOM = 3;
const STEP_TANGENT_BASE = 8;
const STEP_TANGENT_HEIGHT = 9;
const STEP_ALL = 10;
/** Step 4 demo zoom. Not 2: at 30° that lands the height on exactly 1 and looks like a hint. */
const DEMO_ZOOM = 1.5;
/** textSprite scale → screen-fixed sprite scale (fov 50: 0.44 ≈ 30px tall on a 900px viewport). */
const SCREEN_TEXT = 0.072;

const COL = {
  radius: 0xf0f6fc,
  sin: 0xff5d5d,
  cos: 0x5db4ff,
  tan: 0x5dff8f,
  sec: 0xffa657,
  cosec: 0x39c5cf,
  cot: 0xffd166,
  arc: 0xffd166,
  tangent: 0x8b949e,
  axis: 0x8b949e,
  greyFill: 0x8b949e,
  orangeFill: 0xffa657,
  cyanFill: 0x39c5cf,
};

/**
 * Ten manual steps: one circle, then two zooms about O, then the usual tangent picture.
 * Each step may play a one-shot beat. Nothing auto-advances.
 */
export class TrigFunctionsStoryLesson implements Lesson {
  readonly id = "trig-functions";
  readonly title = "10 · Trigonometric Functions";
  readonly blurb = "Six functions from one triangle and two zooms";
  readonly category = "Trigonometry" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["radians", "triangle-theorems"] as const;

  /** 0-based story step. Readable by the browser tests. */
  step = 0;
  /** True only while a one-shot ▶ animation is running. */
  beatPlaying = false;
  /** Stored angle in degrees, clamped to [15, 75]. The step-10 beat does not write this. */
  phiDeg = 30;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private stopTick?: () => void;
  private previousRotate = true;
  private beatT = 1;
  private angleCtl?: { updateDisplay(): void };
  private cameraGoal?: { position: THREE.Vector3; target: THREE.Vector3 };
  /** Dots are drawn relative to the framed size so they do not balloon when the camera fits close. */
  private dotScale = 1;

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-ts]");
    if (!button || button.disabled) return;
    const action = button.dataset.ts ?? "";

    if (action === "next") {
      this.step = Math.min(STORY_STEPS.length - 1, this.step + 1);
      this.resetBeat();
      this.renderAll();
      return;
    }
    if (action === "prev") {
      this.step = Math.max(0, this.step - 1);
      this.resetBeat();
      this.renderAll();
      return;
    }
    if (action.startsWith("goto:")) {
      const index = Number(action.slice(5));
      if (!Number.isFinite(index)) return;
      this.step = Math.min(STORY_STEPS.length - 1, Math.max(0, Math.floor(index)));
      this.resetBeat();
      this.renderAll();
      return;
    }
    if (action === "play") {
      if (!STORY_STEPS[this.step]?.hasBeat) return;
      this.beatT = 0;
      this.beatPlaying = true;
      this.renderScene();
      return;
    }
    if (action.startsWith("angle:")) {
      this.phiDeg = clampPhi(Number(action.slice(6)));
      this.angleCtl?.updateDisplay();
      this.resetBeat();
      this.renderAll();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    this.step = 0;
    this.phiDeg = 30;
    this.resetBeat();

    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic);
    ctx.viewport.setHelpers(false);
    // Region about (-0.4, -0.4) to (4.2, 4.2) maths units, with a margin for labels.
    const look = 1.9 * U;
    ctx.viewport.frameCamera(
      new THREE.Vector3(look, look, 14.6),
      new THREE.Vector3(look, look, 0),
    );
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));

    this.angleCtl = tip(
      ctx.gui.add(this, "phiDeg", 15, 75, 1).name("φ (°)"),
      "Angle of the radius. Kept between 15° and 75° so every length stays on stage.",
    ).onChange(() => {
      this.phiDeg = clampPhi(this.phiDeg);
      this.angleCtl?.updateDisplay();
      this.resetBeat();
      this.renderAll();
    });

    this.renderAll();
    if (this.cameraGoal) {
      ctx.viewport.frameCamera(this.cameraGoal.position, this.cameraGoal.target);
      this.cameraGoal = undefined;
    }
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.beatPlaying = false;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.viewport = undefined;
    this.group.parent?.remove(this.group);
    this.disposeObject(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
  }

  private resetBeat(): void {
    this.beatPlaying = false;
    this.beatT = 1;
  }

  private tick(dt: number): void {
    this.glideCamera(dt);
    if (!this.beatPlaying) return;
    const step = Math.min(0.05, Math.max(0, dt));
    this.beatT = Math.min(1, this.beatT + step / BEAT_SECONDS);
    if (this.beatT >= 1) this.beatPlaying = false;
    this.renderScene();
  }

  private renderAll(): void {
    this.fitCamera();
    this.renderScene();
    this.renderPanel();
  }

  /**
   * Frame the finished picture for this step and angle, then glide the camera there.
   * The last step sweeps φ, so it frames both ends of the sweep; the tangent steps frame both ends of the fold.
   */
  private fitCamera(): void {
    // Label gaps depend on the fit, so measure twice and let the scale settle.
    this.measureFit();
    this.measureFit();
  }

  private measureFit(): void {
    const viewport = this.viewport;
    if (!viewport) return;
    const savedT = this.beatT;
    const savedPhi = this.phiDeg;
    const box = new THREE.Box3();
    const angles = this.step === STEP_ALL ? [PHI_MIN, PHI_MAX, savedPhi] : [savedPhi];
    const folds = this.step === STEP_TANGENT_BASE || this.step === STEP_TANGENT_HEIGHT;
    for (const t of folds ? [0, 1] : [1]) {
      this.beatT = t;
      for (const angle of angles) {
        this.phiDeg = angle;
        this.renderScene();
        this.dynamic.updateMatrixWorld(true);
        for (const child of this.dynamic.children) {
          if (!child.userData.noFit) box.expandByObject(child);
        }
      }
    }
    this.phiDeg = savedPhi;
    this.beatT = savedT;
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const camera = viewport.camera;
    const halfFov = (camera.fov * Math.PI) / 360;
    const halfHeight = Math.max(size.y / 2, size.x / 2 / Math.max(camera.aspect, 0.1));
    const distance = (halfHeight * 1.25) / Math.tan(halfFov);
    this.dotScale = Math.min(1, distance / 14.6);
    this.cameraGoal = {
      position: new THREE.Vector3(centre.x, centre.y, distance),
      target: new THREE.Vector3(centre.x, centre.y, 0),
    };
  }

  private glideCamera(dt: number): void {
    const viewport = this.viewport;
    const goal = this.cameraGoal;
    if (!viewport || !goal) return;
    const blend = 1 - Math.exp(-dt * 6);
    viewport.camera.position.lerp(goal.position, blend);
    viewport.controls.target.lerp(goal.target, blend);
    viewport.controls.update();
    if (viewport.camera.position.distanceTo(goal.position) < 0.01) this.cameraGoal = undefined;
  }

  /** Label offset in maths units, shrunk to match how close the camera has fitted. */
  private gap(n: number): number {
    return n * this.dotScale;
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    this.addAxes();
    const stored = clampPhi(this.phiDeg);
    const step = this.step;

    if (step === STEP_ZOOM) {
      this.drawZoomLesson(stored, this.beatT);
      return;
    }
    if (step === STEP_TANGENT_BASE || step === STEP_TANGENT_HEIGHT) {
      this.drawTangentFold(stored, this.beatT, step === STEP_TANGENT_BASE ? "base" : "height");
      return;
    }
    if (step === STEP_ALL) {
      this.drawAll(sweepPhi(stored, this.beatT));
      return;
    }

    const phi = stored;
    const ease = smoothstep(this.beatT);
    if (step >= 0) this.drawCircleStep(phi, step === 0 ? ease : 1, step === 0 ? 1 : DIM, step <= 2);
    if (step >= 1) this.drawSinStep(phi, step === 1 ? ease : 1, step === 1 ? 1 : DIM, step === 1);
    if (step >= 2) this.drawCosStep(phi, step === 2 ? ease : 1, step === 2 ? 1 : DIM, step === 2);
    if (step === 4) this.drawCosZoom(phi, this.beatT, 1, false);
    else if (step === 5) this.drawCosZoom(phi, this.beatT, 1, true);
    else if (step > 5) this.drawCosZoom(phi, 1, DIM, false);
    if (step === 6) this.drawSinZoom(phi, this.beatT, 1);
    else if (step > 6) this.drawSinZoom(phi, 1, DIM);
    if (step >= 7) this.drawCotSlide(phi, step === 7 ? this.beatT : 1, step === 7 ? 1 : DIM);
  }

  private drawZoomLesson(phi: number, t: number): void {
    const base = baseTriangle(phi);
    const copy = zoomAt(phi, DEMO_ZOOM, t);
    this.addFill(base.O, base.H, base.P, COL.greyFill, 0.22);
    this.addSeg(base.O, base.H, COL.cos, 1);
    this.addSeg(base.H, base.P, COL.sin, 1);
    this.addSeg(base.O, base.P, COL.radius, 1);
    this.addFill(copy.O, copy.H, copy.P, COL.orangeFill, 0.16);
    this.addSeg(copy.O, copy.H, COL.cos, 1);
    this.addSeg(copy.H, copy.P, COL.sin, 1);
    this.addSeg(copy.O, copy.P, COL.radius, 1);
    this.addDot(copy.P, COL.radius);
    this.addText(`height ${fmt(copy.P.y)}`, { x: copy.P.x + this.gap(0.32), y: copy.P.y / 2 }, COL.sin);
    this.addText(`base ${fmt(copy.H.x)}`, { x: copy.H.x / 2, y: this.gap(-0.28) }, COL.cos);
    this.addText(`hyp ${fmt(Math.hypot(copy.P.x, copy.P.y))}`, offsetMid(copy.O, copy.P, this.gap(-0.2), this.gap(0.16)), COL.radius);
  }

  private drawCircleStep(phi: number, grow: number, opacity: number, labels: boolean): void {
    const ang = phi * grow;
    const r = (ang * Math.PI) / 180;
    const p = { x: Math.cos(r), y: Math.sin(r) };
    this.addCircle(opacity * 0.9);
    if (grow < 0.999) this.addArc(1, 0, ang, COL.radius, Math.max(opacity, 0.8));
    this.addSeg({ x: 0, y: 0 }, p, COL.radius, opacity);
    this.addArc(0.32, 0, Math.max(ang, 0.01), COL.arc, opacity);
    this.addDot(p, COL.radius, opacity);
    // Steps 1–3 talk about P and φ, so keep their labels even once the circle dims.
    if (labels) {
      this.addText("P", { x: p.x + this.gap(0.14), y: p.y + this.gap(0.16) }, COL.radius, 1, 0.4);
      this.addText("φ", { x: this.gap(0.42), y: this.gap(0.06) }, COL.arc, 1, 0.38);
      this.addText("OP = 1", offsetMid({ x: 0, y: 0 }, p, this.gap(-0.16), this.gap(0.16)), COL.radius, 1, 0.42);
    }
  }

  private drawSinStep(phi: number, grow: number, opacity: number, label: boolean): void {
    const tri = baseTriangle(phi);
    const end = { x: tri.P.x, y: tri.P.y * (1 - grow) };
    this.addFill(tri.O, tri.H, tri.P, COL.greyFill, opacity > 0.7 ? 0.22 * Math.max(grow, 0.05) : 0.1);
    this.addSeg(tri.P, end, COL.sin, opacity);
    if (label) {
      this.addText(
        `HP = ${fmt(tri.P.y * grow)}`,
        { x: tri.P.x + this.gap(0.34), y: (tri.P.y + end.y) / 2 },
        COL.sin,
      );
      this.addText("H", { x: tri.H.x + this.gap(0.14), y: this.gap(-0.2) }, COL.sin, 1, 0.4);
    }
  }

  private drawCosStep(phi: number, grow: number, opacity: number, label: boolean): void {
    const tri = baseTriangle(phi);
    const end = { x: tri.H.x * grow, y: 0 };
    this.addSeg({ x: 0, y: 0 }, end, COL.cos, opacity);
    if (label) {
      this.addText(`OH = ${fmt(tri.H.x * grow)}`, { x: Math.max(end.x, this.gap(0.2)) / 2, y: this.gap(-0.28) }, COL.cos);
      this.addText("H", { x: tri.H.x + this.gap(0.14), y: this.gap(-0.2) }, COL.sin, 1, 0.4);
    }
  }

  private drawCosZoom(phi: number, t: number, opacity: number, highlightHyp: boolean): void {
    const tri = zoomAt(phi, 1 / values(phi).cos, t);
    const secNow = Math.hypot(tri.P.x, tri.P.y);
    this.addVerticalTangent(highlightHyp || opacity > 0.7 ? 0.7 : 0.3);
    this.addFill(tri.O, tri.H, tri.P, COL.orangeFill, opacity > 0.7 ? 0.16 : 0.07);
    this.addSeg(tri.O, tri.H, COL.cos, highlightHyp ? 0.4 : opacity);
    this.addSeg(tri.H, tri.P, COL.tan, highlightHyp ? 0.45 : opacity);
    this.addSeg(tri.O, tri.P, highlightHyp ? COL.sec : COL.radius, highlightHyp ? 1 : opacity);
    this.addDot({ x: 1, y: 0 }, COL.tangent, opacity);
    this.addDot(tri.P, highlightHyp ? COL.sec : COL.tan, opacity);
    if (opacity > 0.7) {
      this.addText("A", { x: 1 + this.gap(0.14), y: this.gap(-0.22) }, COL.tangent, 1, 0.4);
      this.addText("T", { x: tri.P.x + this.gap(0.16), y: tri.P.y + this.gap(0.14) }, COL.tan, 1, 0.4);
      if (highlightHyp) {
        this.addText(`OT = ${fmt(secNow)}`, offsetMid(tri.O, tri.P, this.gap(-0.22), this.gap(0.16)), COL.sec);
      } else {
        this.addText(`${t >= 1 ? "AT" : "height"} = ${fmt(tri.P.y)}`, { x: tri.H.x + this.gap(0.42), y: Math.max(tri.P.y / 2, this.gap(0.16)) }, COL.tan);
        this.addText(`${t >= 1 ? "OA" : "base"} = ${fmt(tri.H.x)}${t >= 1 ? " ✓" : ""}`, { x: tri.H.x / 2, y: this.gap(-0.28) }, COL.cos);
      }
    }
  }

  private drawSinZoom(phi: number, t: number, opacity: number): void {
    const tri = zoomAt(phi, 1 / values(phi).sin, t);
    const hyp = Math.hypot(tri.P.x, tri.P.y);
    this.addHorizontalTangent(opacity > 0.7 ? 0.7 : 0.3);
    this.addFill(tri.O, tri.H, tri.P, COL.cyanFill, opacity > 0.7 ? 0.14 : 0.06);
    this.addSeg(tri.O, tri.H, COL.cot, opacity * 0.75);
    this.addSeg({ x: tri.P.x, y: 0 }, tri.P, COL.sin, opacity);
    this.addSeg(tri.O, tri.P, COL.cosec, opacity);
    this.addDot({ x: 0, y: 1 }, COL.tangent, opacity);
    this.addDot(tri.P, COL.cosec, opacity);
    if (opacity > 0.7) {
      this.addText("B", { x: this.gap(-0.24), y: 1 + this.gap(0.16) }, COL.tangent, 1, 0.4);
      this.addText("C", { x: tri.P.x + this.gap(0.16), y: tri.P.y + this.gap(0.14) }, COL.cosec, 1, 0.4);
      this.addText(`${t >= 1 ? "OC" : "hyp"} = ${fmt(hyp)}`, offsetMid(tri.O, tri.P, this.gap(-0.36), this.gap(0.1)), COL.cosec);
      this.addText(`${t >= 1 ? "DC" : "height"} = ${fmt(tri.P.y)}${t >= 1 ? " ✓" : ""}`, { x: tri.P.x + this.gap(0.5), y: tri.P.y / 2 }, COL.sin);
      if (t >= 1) this.addText("D", { x: tri.P.x + this.gap(0.14), y: this.gap(-0.22) }, COL.sin, 1, 0.4);
    }
  }

  private drawCotSlide(phi: number, t: number, opacity: number): void {
    const z = sinZoom(phi);
    const y = smoothstep(t);
    this.addSeg(z.O, z.H, COL.cot, opacity);
    this.addSeg({ x: 0, y }, { x: z.H.x, y }, COL.cot, opacity);
    this.addDot(z.B, COL.tangent, opacity);
    this.addDot(z.C, COL.cot, opacity);
    if (opacity > 0.7) {
      this.addText(`OD = ${fmt(z.H.x)}`, { x: z.H.x / 2, y: this.gap(-0.28) }, COL.cot);
      this.addText(`BC = ${fmt(z.H.x)}`, { x: z.H.x / 2, y: y + this.gap(0.24) }, COL.cot);
      this.addText("B", { x: this.gap(-0.24), y: 1 + this.gap(0.18) }, COL.tangent, 1, 0.4);
      this.addText("C", { x: z.C.x + this.gap(0.16), y: 1 + this.gap(0.16) }, COL.cot, 1, 0.4);
    }
  }

  /**
   * The tangent at P makes two right triangles with the axes. Each is a zoomed triangle
   * flipped over: OAT folds across the line at φ/2 onto OPQ, OBC across (φ + 90)/2 onto OSP.
   * They are mirror images, so the move is a fold (a 3D half-turn), not a slide.
   */
  private drawTangentFold(phi: number, rawT: number, which: "base" | "height"): void {
    const v = values(phi);
    const tang = tangentAtP(phi);
    const base = baseTriangle(phi);
    const O = { x: 0, y: 0 };
    const P = tang.P;
    const e = smoothstep(rawT);
    const landed = rawT >= 1;
    const isBase = which === "base";

    this.addCircle(0.45);
    this.addArc(0.28, 0, phi, COL.arc, 1);
    this.addFill(base.O, base.H, base.P, COL.greyFill, 0.1);
    this.addSeg(base.O, base.H, COL.cos, DIM);
    this.addSeg(base.H, base.P, COL.sin, DIM);

    // The tangent at P, and the target triangle it makes.
    this.addSeg(tang.S, tang.Q, COL.tangent, 0.35);
    if (isBase) {
      this.addFill(O, P, tang.Q, COL.orangeFill, landed ? 0.18 : 0.06);
      this.addSeg(P, tang.Q, COL.tan, landed ? 1 : 0.45);
      this.addSeg(O, tang.Q, COL.sec, landed ? 1 : 0.45);
    } else {
      this.addFill(O, P, tang.Q, COL.orangeFill, 0.05);
      this.addFill(O, tang.S, P, COL.cyanFill, landed ? 0.16 : 0.05);
      this.addSeg(tang.S, P, COL.cot, landed ? 1 : 0.45);
      this.addSeg(O, tang.S, COL.cosec, landed ? 1 : 0.45);
      this.addArcAt(tang.S, 0.24, -90, -90 + phi, COL.arc, 1);
      const mid = ((-90 + phi / 2) * Math.PI) / 180;
      this.addText("φ", { x: tang.S.x + Math.cos(mid) * 0.4, y: tang.S.y + Math.sin(mid) * 0.4 }, COL.arc, 1, 0.38);
    }
    this.addSeg(O, P, COL.radius, 1);
    this.addRightAngle(P, isBase ? { x: v.sin, y: -v.cos } : { x: -v.sin, y: v.cos });

    // The zoomed triangle, ghosted where it started, then folded over.
    const src = isBase
      ? { a: cosZoom(phi).A, b: cosZoom(phi).T, fill: COL.orangeFill, side: COL.tan, hyp: COL.sec, flat: COL.cos }
      : { a: sinZoom(phi).B, b: sinZoom(phi).C, fill: COL.cyanFill, side: COL.cot, hyp: COL.cosec, flat: COL.sin };
    if (!landed) {
      this.addSeg(src.a, src.b, src.side, 0.2);
      this.addSeg(O, src.b, src.hyp, 0.2);
    }
    if (!landed) {
      const flip = new THREE.Group();
      const saved = this.dynamic;
      this.dynamic = flip;
      this.addFill(O, src.a, src.b, src.fill, 0.22);
      this.addSeg(O, src.a, src.flat, 1);
      this.addSeg(src.a, src.b, src.side, 1);
      this.addSeg(O, src.b, src.hyp, 1);
      this.dynamic = saved;
      const lineDeg = isBase ? phi / 2 : (phi + 90) / 2;
      const r = (lineDeg * Math.PI) / 180;
      flip.quaternion.setFromAxisAngle(new THREE.Vector3(Math.cos(r), Math.sin(r), 0), Math.PI * e);
      this.dynamic.add(flip);
    }

    this.addDot(P, COL.radius);
    this.addText("P", { x: P.x + this.gap(0.16), y: P.y + this.gap(0.16) }, COL.radius, 1, 0.4);
    this.addText("OP = 1", offsetMid(O, P, isBase ? this.gap(-0.2) : this.gap(0.24), isBase ? this.gap(0.18) : this.gap(-0.14)), COL.radius, 1, 0.4);
    const out = { x: v.cos * this.gap(0.3), y: v.sin * this.gap(0.3) };
    if (isBase) {
      this.addDot(tang.Q, COL.sec);
      this.addText("Q", { x: tang.Q.x + this.gap(0.1), y: this.gap(-0.24) }, COL.sec, 1, 0.4);
      if (!landed) {
        this.addText("A", { x: 1 + this.gap(0.14), y: this.gap(-0.22) }, COL.tangent, 0.7, 0.36);
        this.addText("T", { x: src.b.x + this.gap(0.16), y: src.b.y + this.gap(0.14) }, COL.tan, 0.7, 0.36);
      } else {
        const m = offsetMid(P, tang.Q, 0, 0);
        this.addText(`PQ = ${fmt(v.tan)}`, { x: m.x + out.x, y: m.y + out.y }, COL.tan, 1, 0.4);
        this.addText(`OQ = ${fmt(v.sec)}`, { x: tang.Q.x / 2, y: this.gap(-0.3) }, COL.sec, 1, 0.4);
      }
    } else {
      this.addDot(tang.S, COL.cosec);
      this.addText("S", { x: this.gap(-0.24), y: tang.S.y + this.gap(0.06) }, COL.cosec, 1, 0.4);
      if (!landed) {
        this.addText("B", { x: this.gap(-0.24), y: 1 + this.gap(0.16) }, COL.tangent, 0.7, 0.36);
        this.addText("C", { x: src.b.x + this.gap(0.16), y: src.b.y + this.gap(0.14) }, COL.cot, 0.7, 0.36);
      } else {
        const m = offsetMid(tang.S, P, 0, 0);
        this.addText(`SP = ${fmt(v.cot)}`, { x: m.x + out.x, y: m.y + out.y }, COL.cot, 1, 0.4);
        this.addText(`OS = ${fmt(v.cosec)}`, { x: this.gap(-0.6), y: tang.S.y / 2 }, COL.cosec, 1, 0.4);
      }
    }
  }

  private addRightAngle(corner: Point, along: Point): void {
    const size = this.gap(0.1);
    const len = Math.hypot(corner.x, corner.y);
    const toO = { x: (-corner.x / len) * size, y: (-corner.y / len) * size };
    const w = { x: along.x * size, y: along.y * size };
    const pts = [
      { x: corner.x + toO.x, y: corner.y + toO.y },
      { x: corner.x + toO.x + w.x, y: corner.y + toO.y + w.y },
      { x: corner.x + w.x, y: corner.y + w.y },
    ].map((pt) => world(pt));
    this.addLine(pts, 0xe6edf3, 0.8);
  }

  private drawAll(phi: number): void {
    const base = baseTriangle(phi);
    const cz = cosZoom(phi);
    const sz = sinZoom(phi);
    const v = values(phi);
    this.addCircle(0.6);
    this.addVerticalTangent(0.45);
    this.addHorizontalTangent(0.45);
    this.addArc(0.28, 0, phi, COL.arc, 1);
    const tang = tangentAtP(phi);
    this.addSeg(tang.S, tang.Q, COL.tangent, 0.3);
    this.addFill(sz.O, sz.H, sz.C, COL.cyanFill, 0.12);
    this.addFill(cz.O, cz.A, cz.T, COL.orangeFill, 0.16);
    this.addFill(base.O, base.H, base.P, COL.greyFill, 0.28);
    this.addSeg(base.O, base.P, COL.radius, 1);
    this.addSeg(base.O, base.H, COL.cos, 1);
    this.addSeg(base.H, base.P, COL.sin, 1);
    this.addSeg(cz.O, cz.T, COL.sec, 1);
    this.addSeg(cz.A, cz.T, COL.tan, 1);
    this.addSeg(sz.O, sz.C, COL.cosec, 1);
    this.addSeg(sz.O, sz.H, COL.cot, 1);
    this.addSeg(sz.B, sz.C, COL.cot, 0.9);
    this.addDot(base.P, COL.radius);
    // Values live in the panel table; short names keep the picture readable.
    this.addText("sin", { x: base.P.x - 0.16, y: base.P.y / 2 }, COL.sin, 1, 0.36);
    this.addText("cos", { x: base.H.x / 2, y: -0.22 }, COL.cos, 1, 0.36);
    this.addText("tan", { x: 1.24, y: v.tan / 2 }, COL.tan, 1, 0.36);
    this.addText("sec", offsetMid(base.P, cz.T, -0.14 * v.sin, 0.14 * v.cos), COL.sec, 1, 0.36);
    this.addText("cosec", { x: sz.C.x + 0.36, y: 1.14 + 0.04 }, COL.cosec, 1, 0.36);
    this.addText("cot", { x: v.cot / 2, y: 1.16 }, COL.cot, 1, 0.36);
  }

  /** Long guide lines are drawn past the frame, so the camera fit ignores them. */
  private withoutFit(draw: () => void): void {
    const before = this.dynamic.children.length;
    draw();
    for (const child of this.dynamic.children.slice(before)) child.userData.noFit = true;
  }

  private addAxes(): void {
    this.withoutFit(() => {
      this.addSeg({ x: -0.6, y: 0 }, { x: 4.6, y: 0 }, COL.axis, 0.55);
      this.addSeg({ x: 0, y: -0.6 }, { x: 0, y: 4.6 }, COL.axis, 0.55);
    });
    this.addDot({ x: 0, y: 0 }, COL.radius);
    this.addText("O", { x: this.gap(-0.22), y: this.gap(-0.2) }, 0xc9d1d9, 0.95, 0.38);
  }

  private addVerticalTangent(opacity: number): void {
    this.withoutFit(() => this.addSeg({ x: 1, y: -0.6 }, { x: 1, y: 4.6 }, COL.tangent, opacity));
  }

  private addHorizontalTangent(opacity: number): void {
    this.withoutFit(() => this.addSeg({ x: -0.6, y: 1 }, { x: 4.6, y: 1 }, COL.tangent, opacity));
  }

  private addCircle(opacity: number): void {
    const pts: THREE.Vector3[] = [];
    // Only the corner we use: a little past each axis.
    for (let i = 0; i <= 48; i++) {
      const t = ((-12 + (i / 48) * 114) * Math.PI) / 180;
      pts.push(world({ x: Math.cos(t), y: Math.sin(t) }));
    }
    this.addLine(pts, COL.tangent, opacity);
  }

  private addArc(radius: number, a0: number, a1: number, color: number, opacity: number): void {
    this.addArcAt({ x: 0, y: 0 }, radius, a0, a1, color, opacity);
  }

  private addArcAt(centre: Point, radius: number, a0: number, a1: number, color: number, opacity: number): void {
    if (a1 - a0 < 0.15) return;
    const n = Math.max(8, Math.ceil((a1 - a0) / 4));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const deg = a0 + ((a1 - a0) * i) / n;
      const r = (deg * Math.PI) / 180;
      pts.push(world({ x: centre.x + Math.cos(r) * radius, y: centre.y + Math.sin(r) * radius }));
    }
    this.addLine(pts, color, opacity);
  }

  private addLine(pts: THREE.Vector3[], color: number, opacity: number): void {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false }),
    );
    this.dynamic.add(line);
  }

  private addSeg(a: Point, b: Point, color: number, opacity: number): void {
    if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-4) return;
    const line = segment(world(a), world(b), color);
    const mat = line.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = opacity;
    mat.depthTest = false;
    this.dynamic.add(line);
  }

  private addFill(a: Point, b: Point, c: Point, color: number, opacity: number): void {
    const shape = new THREE.Shape();
    shape.moveTo(a.x * U, a.y * U);
    shape.lineTo(b.x * U, b.y * U);
    shape.lineTo(c.x * U, c.y * U);
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.position.z = -0.02;
    this.dynamic.add(mesh);
  }

  private addDot(p: Point, color: number, opacity = 1): void {
    const dot = marker(color, 0.09 * this.dotScale);
    dot.position.copy(world(p, 0.12));
    const mat = dot.material as THREE.MeshStandardMaterial;
    mat.transparent = opacity < 1;
    mat.opacity = opacity;
    this.dynamic.add(dot);
  }

  private addText(text: string, p: Point, color: number, opacity = 1, scale = 0.44): void {
    // Fixed on-screen size, so labels stay readable however far the camera fits out.
    const sprite = textSprite(text, color, scale * SCREEN_TEXT);
    sprite.position.copy(world(p, 0.4));
    const mat = sprite.material as THREE.SpriteMaterial;
    mat.sizeAttenuation = false;
    mat.opacity = opacity;
    mat.depthTest = false;
    sprite.renderOrder = 3;
    this.dynamic.add(sprite);
  }

  private renderPanel(): void {
    const meta = STORY_STEPS[this.step] ?? STORY_STEPS[0];
    const v = values(this.phiDeg);
    const copy = stepCopy(this.step, v);
    const dots = STORY_STEPS.map((_, index) => {
      const cls = index === this.step ? "ts-dot is-active" : index < this.step ? "ts-dot is-done" : "ts-dot";
      const current = index === this.step ? ' aria-current="step"' : "";
      return `<button type="button" class="${cls}" data-ts="goto:${index}" aria-label="Go to step ${index + 1}"${current}>${index + 1}</button>`;
    }).join("");
    const angles = [30, 45, 60]
      .map((angle) => {
        const on = Math.round(this.phiDeg) === angle ? "" : " ghost";
        return `<button type="button" class="course-btn${on}" data-ts="angle:${angle}">${angle}°</button>`;
      })
      .join("");
    const play = meta.hasBeat
      ? `<button type="button" class="course-btn" data-ts="play">▶ Play</button>`
      : "";
    const atStart = this.step <= 0;
    const atEnd = this.step >= STORY_STEPS.length - 1;

    this.setInfo(`
      <div class="ts-panel" data-ts-step="${meta.id}">
        <h2>Trigonometric Functions</h2>
        <p class="ts-progress">Step <b>${this.step + 1}</b> of <b>${STORY_STEPS.length}</b> — nothing auto-advances. φ = ${Math.round(this.phiDeg)}°</p>
        <div class="ts-dots" role="navigation" aria-label="Story steps">${dots}</div>
        <h3>${meta.title}</h3>
        ${copy.sentences.map((sentence) => `<p>${sentence}</p>`).join("")}
        <div class="ts-algebra">
          <span>Algebra ↔ picture</span>
          ${copy.box}
        </div>
        ${this.step === STEP_ALL ? `<p><a class="ts-explorer-link" href="#trig-functions-explorer">Open the Trig Functions Explorer →</a></p>` : ""}
        <div class="ts-actions">
          ${play}
          <button type="button" class="course-btn ghost" data-ts="prev" ${atStart ? "disabled" : ""}>Back</button>
          <button type="button" class="course-btn" data-ts="next" ${atEnd ? "disabled" : ""}>Next</button>
        </div>
        <p class="ts-angle-label">Quick angles</p>
        <div class="ts-actions">${angles}</div>
      </div>
    `);
  }

  private disposeChildren(root: THREE.Object3D): void {
    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
      this.disposeObject(child);
    }
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((item) => item.dispose());
      } else if (mat) {
        const map = (mat as THREE.MeshBasicMaterial).map;
        map?.dispose();
        mat.dispose();
      }
    });
  }
}

function world(p: Point, z = 0.04): THREE.Vector3 {
  return new THREE.Vector3(p.x * U, p.y * U, z);
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function offsetMid(a: Point, b: Point, ox: number, oy: number): Point {
  return { x: (a.x + b.x) / 2 + ox, y: (a.y + b.y) / 2 + oy };
}

function eq(...lines: string[]): string {
  return lines.map((line) => `<p class="ts-eq">${line}</p>`).join("");
}

function stepCopy(step: number, v: StoryValues): { sentences: string[]; box: string } {
  const sin = fmt(v.sin);
  const cos = fmt(v.cos);
  const tan = fmt(v.tan);
  const sec = fmt(v.sec);
  const cosec = fmt(v.cosec);
  const cot = fmt(v.cot);
  const zoomed = {
    height: fmt(v.sin * DEMO_ZOOM),
    base: fmt(v.cos * DEMO_ZOOM),
    hyp: fmt(DEMO_ZOOM),
  };
  const copies: { sentences: string[]; box: string }[] = [
    {
      sentences: [
        "Every length today is measured in radiuses, and the radius is 1.",
        "That matters later: sin, cos and the rest are ratios, plain numbers. A ratio only equals a length when the side we divide by is 1.",
        "φ is how far the radius has turned up from the flat axis.",
      ],
      box: eq("OP = 1 (the radius)"),
    },
    {
      sentences: [
        "Sin is a ratio: opposite ÷ hypotenuse.",
        "Here the opposite side is the red line HP, and the hypotenuse is OP = 1.",
        "Dividing by 1 changes nothing, so the ratio sin φ and the length HP are the same number.",
      ],
      box: eq("sin φ = HP ÷ OP", `sin φ = ${sin} ÷ 1 = ${sin}`, `so HP = ${sin}`),
    },
    {
      sentences: [
        "Cos is a ratio: adjacent ÷ hypotenuse.",
        "The adjacent side is the blue line OH, and the hypotenuse is still OP = 1.",
        "So the ratio cos φ and the length OH are the same number.",
      ],
      box: eq("cos φ = OH ÷ OP", `cos φ = ${cos} ÷ 1 = ${cos}`, `so OH = ${cos}`),
    },
    {
      sentences: [
        `Zooming by ${DEMO_ZOOM} makes every side ${DEMO_ZOOM} times longer. The angle does not change, so the ratios do not change.`,
        "Dividing by a number less than 1 also zooms bigger: ÷ 0.5 is the same as × 2.",
        "No side is aiming for 1 yet. That starts on the next step.",
      ],
      box: eq(
        `× ${DEMO_ZOOM}: every side ${DEMO_ZOOM} times longer`,
        `height: ${sin} → ${zoomed.height}`,
        `base: ${cos} → ${zoomed.base}`,
        `hypotenuse: 1 → ${zoomed.hyp}`,
      ),
    },
    {
      sentences: [
        "Now pick the zoom that makes the base exactly 1: divide every side by cos φ.",
        "The base OA becomes 1, so the side we divide by is 1 again. That makes the ratio tan φ = AT ÷ OA equal to the length AT.",
        "The vertical line through A just touches the circle. It is a tangent, which is where the name comes from.",
      ],
      box: eq(
        `zoom = 1 ÷ cos φ = 1 ÷ ${cos} = ${sec}`,
        `OA: ${cos} → 1`,
        `AT: ${sin} → ${tan}`,
        `tan φ = AT ÷ OA = ${tan} ÷ 1 = ${tan}`,
      ),
    },
    {
      sentences: [
        "Same zoom, now look at the hypotenuse. It was 1, so it grows to 1 ÷ cos φ.",
        "sec φ is the ratio hypotenuse ÷ adjacent = OT ÷ OA. OA is 1, so sec φ equals the length OT.",
        "The line OT cuts through the circle. Secant means cutting.",
      ],
      box: eq(`OT: 1 → ${sec}`, `sec φ = OT ÷ OA = ${sec} ÷ 1 = ${sec}`),
    },
    {
      sentences: [
        "Now pick the zoom that makes the height exactly 1: divide every side by sin φ.",
        "The height DC becomes 1. cosec φ is the ratio hypotenuse ÷ opposite = OC ÷ DC, and DC is 1, so cosec φ equals the length OC.",
        "A small sin means a big zoom, and a long OC.",
      ],
      box: eq(
        `zoom = 1 ÷ sin φ = 1 ÷ ${sin} = ${cosec}`,
        `DC: ${sin} → 1`,
        `OC: 1 → ${cosec}`,
        `cosec φ = OC ÷ DC = ${cosec} ÷ 1 = ${cosec}`,
      ),
    },
    {
      sentences: [
        "Same zoom, now look at the base OD. It grows from cos φ to cos φ ÷ sin φ.",
        "cot φ is the ratio adjacent ÷ opposite = OD ÷ DC. DC is 1, so cot φ equals the length OD.",
        "Slide OD up to the top line and it fits exactly from B to C, along the tangent at B.",
      ],
      box: eq(`OD: ${cos} → ${cot}`, `cot φ = OD ÷ DC = ${cot} ÷ 1 = ${cot}`, `BC = OD = ${cot}`),
    },
    {
      sentences: [
        "Draw the line that just touches the circle at P. A tangent is always square to the radius, so the corner at P is a right angle. The line meets the flat axis at Q.",
        "Triangle OPQ has that right angle and the angle φ at O, so it is the same shape as every triangle so far. Its base is OP = 1, so it is the base-1 triangle from step 5.",
        "Press Play: OAT flips over and lands exactly on OPQ. It has to flip, not slide, because the two are mirror images.",
      ],
      box: eq(
        "corner at P = 90°, angle at O = φ",
        "OP = 1 is the base",
        `PQ = AT = tan φ = ${tan}`,
        `OQ = OT = sec φ = ${sec}`,
      ),
    },
    {
      sentences: [
        "Carry the same tangent on until it meets the upright axis at S. Triangle OSP also has its right angle at P.",
        "The angle at O is 90° − φ. The three angles add to 180°, so the angle at S is φ. Seen from S, OP = 1 is the height, so this is the height-1 triangle from step 7.",
        "Press Play: OBC flips over onto OSP. That is why the long line up the y-axis, OS, is cosec φ.",
      ],
      box: eq(
        "angle at S = 180° − 90° − (90° − φ) = φ",
        "OP = 1 is the height",
        `SP = BC = cot φ = ${cot}`,
        `OS = OC = cosec φ = ${cosec}`,
      ),
    },
    {
      sentences: [
        "Three triangles, one shape: hypotenuse 1 gives sin and cos; base 1 gives tan and sec; height 1 gives cot and cosec.",
        "A small sin means a huge zoom, and a huge cosec.",
        "Each label names a length, and the length equals the ratio because the side we divided by is 1. If the radius is R, every length is R times bigger, but the ratios stay the same.",
      ],
      box: `<table class="ts-values">
        <tr><th>sin φ</th><td>${sin}</td><th>cos φ</th><td>${cos}</td></tr>
        <tr><th>tan φ</th><td>${tan}</td><th>sec φ</th><td>${sec}</td></tr>
        <tr><th>cosec φ</th><td>${cosec}</td><th>cot φ</th><td>${cot}</td></tr>
      </table>`,
    },
  ];
  return copies[step] ?? copies[0];
}
