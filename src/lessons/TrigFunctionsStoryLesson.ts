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
  swing,
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
   * Step 10 sweeps φ, so it frames both ends of the sweep.
   */
  private fitCamera(): void {
    const viewport = this.viewport;
    if (!viewport) return;
    const savedT = this.beatT;
    const savedPhi = this.phiDeg;
    const box = new THREE.Box3();
    const angles = this.step === 9 ? [PHI_MIN, PHI_MAX, savedPhi] : [savedPhi];
    this.beatT = 1;
    for (const angle of angles) {
      this.phiDeg = angle;
      this.renderScene();
      this.dynamic.updateMatrixWorld(true);
      for (const child of this.dynamic.children) {
        if (!child.userData.noFit) box.expandByObject(child);
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

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    this.addAxes();
    const stored = clampPhi(this.phiDeg);
    const step = this.step;

    if (step === 3) {
      this.drawZoomLesson(stored, this.beatT);
      return;
    }
    if (step === 9) {
      this.drawAll(sweepPhi(stored, this.beatT));
      return;
    }

    const phi = stored;
    const ease = smoothstep(this.beatT);
    if (step >= 0) this.drawCircleStep(phi, step === 0 ? ease : 1, step === 0 ? 1 : DIM);
    if (step >= 1) this.drawSinStep(phi, step === 1 ? ease : 1, step === 1 ? 1 : DIM, step === 1);
    if (step >= 2) this.drawCosStep(phi, step === 2 ? ease : 1, step === 2 ? 1 : DIM, step === 2);
    if (step === 4) this.drawCosZoom(phi, this.beatT, 1, false);
    else if (step === 5) this.drawCosZoom(phi, this.beatT, 1, true);
    else if (step > 5) this.drawCosZoom(phi, 1, DIM, false);
    if (step === 6) this.drawSinZoom(phi, this.beatT, 1);
    else if (step > 6) this.drawSinZoom(phi, 1, DIM);
    if (step >= 7) this.drawCotSlide(phi, step === 7 ? this.beatT : 1, step === 7 ? 1 : DIM);
    if (step === 8) this.drawFamous(phi, this.beatT);
  }

  private drawZoomLesson(phi: number, t: number): void {
    const base = baseTriangle(phi);
    const copy = zoomAt(phi, 2, t);
    this.addFill(base.O, base.H, base.P, COL.greyFill, 0.22);
    this.addSeg(base.O, base.H, COL.cos, 1);
    this.addSeg(base.H, base.P, COL.sin, 1);
    this.addSeg(base.O, base.P, COL.radius, 1);
    this.addFill(copy.O, copy.H, copy.P, COL.orangeFill, 0.16);
    this.addSeg(copy.O, copy.H, COL.cos, 1);
    this.addSeg(copy.H, copy.P, COL.sin, 1);
    this.addSeg(copy.O, copy.P, COL.radius, 1);
    this.addDot(copy.P, COL.radius);
    this.addText(`height ${fmt(copy.P.y)}`, { x: copy.P.x + 0.32, y: copy.P.y / 2 }, COL.sin);
    this.addText(`base ${fmt(copy.H.x)}`, { x: copy.H.x / 2, y: -0.28 }, COL.cos);
    this.addText(`hyp ${fmt(Math.hypot(copy.P.x, copy.P.y))}`, offsetMid(copy.O, copy.P, -0.2, 0.16), COL.radius);
  }

  private drawCircleStep(phi: number, grow: number, opacity: number): void {
    const ang = phi * grow;
    const r = (ang * Math.PI) / 180;
    const p = { x: Math.cos(r), y: Math.sin(r) };
    this.addCircle(opacity * 0.9);
    if (grow < 0.999) this.addArc(1, 0, ang, COL.radius, Math.max(opacity, 0.8));
    this.addSeg({ x: 0, y: 0 }, p, COL.radius, opacity);
    this.addArc(0.32, 0, Math.max(ang, 0.01), COL.arc, opacity);
    this.addDot(p, COL.radius, opacity);
    if (opacity > 0.7) {
      this.addText("P", { x: p.x + 0.14, y: p.y + 0.16 }, COL.radius, 1, 0.4);
      this.addText("φ", { x: 0.42, y: 0.06 }, COL.arc, 1, 0.38);
      this.addText("OP = 1", offsetMid({ x: 0, y: 0 }, p, -0.16, 0.16), COL.radius, 1, 0.42);
    }
  }

  private drawSinStep(phi: number, grow: number, opacity: number, label: boolean): void {
    const tri = baseTriangle(phi);
    const end = { x: tri.P.x, y: tri.P.y * (1 - grow) };
    this.addFill(tri.O, tri.H, tri.P, COL.greyFill, opacity > 0.7 ? 0.22 * Math.max(grow, 0.05) : 0.1);
    this.addSeg(tri.P, end, COL.sin, opacity);
    if (label) {
      this.addText(
        `sin φ = ${fmt(tri.P.y * grow)}`,
        { x: tri.P.x + 0.34, y: (tri.P.y + end.y) / 2 },
        COL.sin,
      );
    }
  }

  private drawCosStep(phi: number, grow: number, opacity: number, label: boolean): void {
    const tri = baseTriangle(phi);
    const end = { x: tri.H.x * grow, y: 0 };
    this.addSeg({ x: 0, y: 0 }, end, COL.cos, opacity);
    if (label) {
      this.addText(`cos φ = ${fmt(tri.H.x * grow)}`, { x: Math.max(end.x, 0.2) / 2, y: -0.28 }, COL.cos);
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
      this.addText("A", { x: 1.14, y: -0.22 }, COL.tangent, 1, 0.4);
      this.addText("T", { x: tri.P.x + 0.16, y: tri.P.y + 0.14 }, COL.tan, 1, 0.4);
      if (highlightHyp) {
        this.addText(`sec φ = ${fmt(secNow)}`, offsetMid(tri.O, tri.P, -0.22, 0.16), COL.sec);
      } else {
        this.addText(`tan φ = ${fmt(tri.P.y)}`, { x: tri.H.x + 0.42, y: Math.max(tri.P.y / 2, 0.16) }, COL.tan);
        this.addText(`base ${fmt(tri.H.x)}${t >= 1 ? " ✓" : ""}`, { x: tri.H.x / 2, y: -0.28 }, COL.cos);
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
      this.addText("B", { x: -0.24, y: 1.16 }, COL.tangent, 1, 0.4);
      this.addText("C", { x: tri.P.x + 0.16, y: tri.P.y + 0.14 }, COL.cosec, 1, 0.4);
      this.addText(`cosec φ = ${fmt(hyp)}`, offsetMid(tri.O, tri.P, -0.36, 0.1), COL.cosec);
      this.addText(`height ${fmt(tri.P.y)}${t >= 1 ? " ✓" : ""}`, { x: tri.P.x + 0.5, y: tri.P.y / 2 }, COL.sin);
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
      this.addText(`cot φ = ${fmt(z.H.x)}`, { x: z.H.x / 2, y: -0.28 }, COL.cot);
      this.addText(`B→C = ${fmt(z.H.x)}`, { x: z.H.x / 2, y: y + 0.24 }, COL.cot);
      this.addText("B", { x: -0.24, y: 1.18 }, COL.tangent, 1, 0.4);
      this.addText("C", { x: z.C.x + 0.16, y: 1.16 }, COL.cot, 1, 0.4);
    }
  }

  private drawFamous(phi: number, rawT: number): void {
    const v = values(phi);
    const tang = tangentAtP(phi);
    const first = rawT >= 0.5 ? 1 : smoothstep(rawT / 0.5);
    const second = rawT <= 0.5 ? 0 : smoothstep((rawT - 0.5) / 0.5);
    const swungC = swing(sinZoom(phi).C, (90 - phi) * first);
    const swungT = swing(cosZoom(phi).T, -phi * second);
    this.addSeg(tang.S, tang.Q, COL.tangent, 0.75);
    this.addDot(tang.P, COL.radius);
    this.addDot(tang.S, COL.cosec, 0.85);
    this.addDot(tang.Q, COL.sec, 0.85);
    this.addSeg({ x: 0, y: 0 }, swungC, COL.cosec, 1);
    this.addSeg({ x: 0, y: 0 }, swungT, COL.sec, 1);
    this.addText("P", { x: tang.P.x + 0.12, y: tang.P.y + 0.16 }, COL.radius, 1, 0.4);
    if (first > 0.98) {
      this.addText("S", { x: -0.24, y: tang.S.y + 0.1 }, COL.cosec, 1, 0.4);
      this.addText(`OS = ${fmt(v.cosec)}`, { x: -0.62, y: tang.S.y * 0.6 }, COL.cosec, 1, 0.4);
    }
    if (second > 0.98) {
      this.addText("Q", { x: tang.Q.x + 0.08, y: -0.24 }, COL.sec, 1, 0.4);
      this.addText(`OQ = ${fmt(v.sec)}`, { x: tang.Q.x * 0.5, y: -0.3 }, COL.sec, 1, 0.4);
      this.addSeg(tang.P, tang.Q, COL.tan, 1);
      this.addSeg(tang.S, tang.P, COL.cot, 1);
      this.addText(`PQ = tan φ = ${fmt(v.tan)}`, offsetMid(tang.P, tang.Q, 0.34, 0.14), COL.tan, 1, 0.38);
      this.addText(`SP = cot φ = ${fmt(v.cot)}`, offsetMid(tang.S, tang.P, 0.5, 0.22), COL.cot, 1, 0.38);
    }
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
    this.addText("O", { x: -0.22, y: -0.2 }, 0xc9d1d9, 0.95, 0.38);
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
    if (a1 - a0 < 0.15) return;
    const n = Math.max(8, Math.ceil((a1 - a0) / 4));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const deg = a0 + ((a1 - a0) * i) / n;
      const r = (deg * Math.PI) / 180;
      pts.push(world({ x: Math.cos(r) * radius, y: Math.sin(r) * radius }));
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
        <p class="ts-progress">Step <b>${this.step + 1}</b> of <b>10</b> — nothing auto-advances. φ = ${Math.round(this.phiDeg)}°</p>
        <div class="ts-dots" role="navigation" aria-label="Story steps">${dots}</div>
        <h3>${meta.title}</h3>
        ${copy.sentences.map((sentence) => `<p>${sentence}</p>`).join("")}
        <div class="ts-algebra">
          <span>Algebra ↔ picture</span>
          ${copy.box}
        </div>
        ${this.step === 9 ? `<p><a class="ts-explorer-link" href="#trig-functions-explorer">Open the Trig Functions Explorer →</a></p>` : ""}
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

function stepCopy(step: number, v: StoryValues): { sentences: string[]; box: string } {
  const sin = fmt(v.sin);
  const cos = fmt(v.cos);
  const tan = fmt(v.tan);
  const sec = fmt(v.sec);
  const cosec = fmt(v.cosec);
  const cot = fmt(v.cot);
  const doubled = {
    height: fmt(v.sin * 2),
    base: fmt(v.cos * 2),
    hyp: fmt(2),
  };
  const copies: { sentences: string[]; box: string }[] = [
    {
      sentences: [
        "Everything today is measured in radiuses.",
        "The radius is 1, so a length is just a number of radiuses.",
        "φ is how far the radius has turned up from the flat axis.",
      ],
      box: "<p><code>OP = 1</code></p>",
    },
    {
      sentences: [
        "Sin is opposite divided by the hypotenuse.",
        "The hypotenuse is 1, so sin φ is just the height.",
        "The red line drops from P down to the flat axis.",
      ],
      box: `<p><code>sin φ = opposite ÷ hypotenuse = ${sin} ÷ 1 = ${sin}</code></p>`,
    },
    {
      sentences: [
        "Cos is adjacent divided by the hypotenuse.",
        "The hypotenuse is still 1, so cos φ is just the base.",
        "The blue line runs from O out to the foot of the height.",
      ],
      box: `<p><code>cos φ = adjacent ÷ hypotenuse = ${cos} ÷ 1 = ${cos}</code></p>`,
    },
    {
      sentences: [
        "Zooming by 2 doubles every side but keeps the angle.",
        "Dividing by 0.5 is the same as multiplying by 2, because 1 ÷ 0.5 = 2.",
        "So dividing by a number less than 1 makes the triangle bigger.",
      ],
      box: `<p><code>× 2 = ÷ 0.5</code></p><p><code>height ${sin} → ${doubled.height}; base ${cos} → ${doubled.base}; hypotenuse 1 → ${doubled.hyp}</code></p>`,
    },
    {
      sentences: [
        "Which zoom makes the base 1? Divide by cos φ. That is the same as multiplying by 1 ÷ cos φ.",
        "The height grows too: sin φ ÷ cos φ is tan φ.",
        "That vertical line just touches the circle. It is a tangent, which is where the name comes from.",
      ],
      box: `<p><code>zoom = 1 ÷ cos φ = 1 ÷ ${cos} = ${sec}</code></p><p><code>height = sin φ ÷ cos φ = ${sin} ÷ ${cos} = ${tan} = tan φ</code></p>`,
    },
    {
      sentences: [
        "The hypotenuse was 1. Zoomed by 1 ÷ cos φ it becomes 1 ÷ cos φ, which is sec φ.",
        "The line from O to T cuts through the circle.",
        "Secant means cutting.",
      ],
      box: `<p><code>sec φ = 1 × (1 ÷ cos φ) = 1 ÷ ${cos} = ${sec}</code></p>`,
    },
    {
      sentences: [
        "1 ÷ sin φ is the zoom that turns the height sin φ into 1.",
        "It stretches out from O, along the radius line, until the red height is exactly 1.",
        "The hypotenuse was 1, so it becomes cosec φ. A small sin means a huge zoom.",
      ],
      box: `<p><code>zoom = 1 ÷ sin φ = 1 ÷ ${sin} = ${cosec} → height ${sin} × ${cosec} = 1, hypotenuse 1 × ${cosec} = ${cosec} = cosec φ</code></p>`,
    },
    {
      sentences: [
        "The base grows by the same zoom: cos φ ÷ sin φ is cot φ.",
        "It sits on the top tangent line, just as tan sat on the side one.",
        "Sliding the base up shows the two lengths are equal.",
      ],
      box: `<p><code>cot φ = cos φ ÷ sin φ = ${cos} ÷ ${sin} = ${cot}</code></p><p><code>B → C = ${cot}</code></p>`,
    },
    {
      sentences: [
        "This is the usual diagram with all six.",
        "The long line up the vertical axis is the cosec zoom swung round. Same length, just rotated.",
        "In triangle O, S, P the radius is the opposite side of the angle at S, so sin φ = 1 ÷ OS, which gives OS = 1 ÷ sin φ.",
      ],
      box: `<p><code>OS = OC = 1 ÷ sin φ = ${cosec}; OQ = OT = 1 ÷ cos φ = ${sec}</code></p>`,
    },
    {
      sentences: [
        "Three triangles, one shape: hypotenuse 1 gives sin and cos; base 1 gives tan and sec; height 1 gives cot and cosec.",
        "A small sin means a huge zoom, and a huge cosec.",
        "If the radius is R instead of 1, multiply every length by R.",
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
