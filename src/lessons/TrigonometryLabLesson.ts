import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  DISCOVER_STEP_META,
  MODE_META,
  SPECIAL_ANGLES,
  amplitudePhase,
  angleArcPoints,
  chordState,
  clamp,
  defaultSolveInput,
  equilateralSplit30,
  evaluateCosineWave,
  formatDegrees,
  formatNumber,
  nearestSpecialAngle,
  quadrantOf,
  referenceAngleDeg,
  rightTriangleState,
  sampleWave,
  smallAngleCheck,
  snapToSpecial,
  solveTriangle,
  unitCircleState,
  wrapDegrees,
  type Point,
  type SolveCase,
  type TriangleSolveInput,
  type TrigLabMode,
} from "../math/trigonometryLab";
import { createDragControls, marker, textSprite, tip } from "./helpers";
import "./formulaDerivations/trigonometryLab";

const BOX = { x: 6.8, y: 4.2 };
const R_CIRCLE = 2.35;
/** Shared origin for triangle mode (right angle at C). */
const TRI_ORIGIN = { x: -2.6, y: -1.5 };
/** Right-angle corner for the Discover triangle steps. */
const DISC_ORIGIN = { x: -2.0, y: -1.7 };
/** Full on-stage hypotenuse length used by the Discover triangle steps. */
const DISC_HYP = 3.7;
/** On-stage length that stands for "1" when the hypotenuse is normalized. */
const DISC_UNIT = 2.5;
/** Seconds for one one-shot beat animation to run start→finish. */
const BEAT_SECONDS = 1.5;
/** Primary story/practice modes shown as the always-visible strip. */
const PRIMARY_MODES: readonly TrigLabMode[] = ["discover", "triangle", "unit-circle", "quadrants", "special"];
/** Secondary "Advanced" modes, demoted below the primary strip. */
const ADVANCED_MODES: readonly TrigLabMode[] = ["solve", "tricks"];

const COL = {
  circle: 0x8b949e,
  radius: 0xf0f6fc,
  sin: 0xff7b72,
  cos: 0x79c0ff,
  tan: 0x7ee787,
  arc: 0xffd166,
  chord: 0xffa657,
  half: 0xd2a8ff,
  ref: 0x56d4dd,
  ok: 0x7ee787,
  bad: 0xff7b72,
  dim: 0x6e7681,
  label: 0xe6edf3,
  handle: 0xffd166,
  waveSin: 0xff7b72,
  waveCos: 0x79c0ff,
  fill: 0x58a6ff,
  q1: 0x7ee787,
  q2: 0x79c0ff,
  q3: 0xffa657,
  q4: 0xd2a8ff,
};

/**
 * Why sin needs only an angle — then the circle story.
 * Discover is a manual 7-step narrative with optional one-shot beat animations.
 * Primary modes: Discover, Triangle, Unit circle, Quadrants, Specials.
 * Advanced: Solve, Tricks.
 */
export class TrigonometryLabLesson implements Lesson {
  readonly id = "trigonometry-lab";
  readonly title = "Trigonometry Lab";
  readonly blurb = "Why sin needs only an angle — then the circle story";
  readonly category = "Trigonometry" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["trig-functions", "pythagoras", "similar-triangles"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labels = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private stopTick?: () => void;
  private previousRotate = true;

  private mode: TrigLabMode = "discover";
  private readonly params = {
    angleDeg: 30,
    hyp: 3.2,
    animate: false,
    smallDeg: 12,
    tricksA: 3,
    tricksB: 4,
  };
  /** Discover story is manual: 0..6. Scene reveals match the active step. */
  private discoverStep = 0;
  /** One-shot beat animation progress (0..1) for the current Discover step. */
  private beatT = 1;
  private beatPlaying = false;
  private waveHistory = 0;
  private static readonly DISCOVER_STEPS = DISCOVER_STEP_META.length;
  private showSinWave = true;
  private showCosWave = true;
  private solveCase: SolveCase = "SAS";
  private solveInput: TriangleSolveInput = defaultSolveInput("SAS");
  private valuesHidden = false;
  private angleCtl?: { updateDisplay(): void };
  private hypCtl?: { updateDisplay(): void };
  private animateCtl?: { updateDisplay(): void };

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tg]");
    if (!button) return;
    const action = button.dataset.tg ?? "";

    if (action.startsWith("mode:")) {
      const next = action.slice(5) as TrigLabMode;
      if (!MODE_META[next]) return;
      this.mode = next;
      // Discover is always manual. Unit circle may spin if the user turns Animate on.
      this.params.animate = false;
      this.discoverStep = 0;
      this.beatPlaying = false;
      this.beatT = 1;
      this.waveHistory = 0;
      this.valuesHidden = false;
      if (next === "discover") this.params.angleDeg = 30;
      this.angleCtl?.updateDisplay();
      this.animateCtl?.updateDisplay();
      this.hypCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (action === "reset") {
      this.resetMode();
      this.renderAll();
      return;
    }

    if (action === "toggle-animate") {
      // Animate never auto-runs Discover — only unit-circle / quadrants / special / tricks.
      if (this.mode === "discover") return;
      this.params.animate = !this.params.animate;
      this.animateCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (action === "discover-next") {
      this.discoverStep = Math.min(TrigonometryLabLesson.DISCOVER_STEPS - 1, this.discoverStep + 1);
      this.resetBeatForStep();
      this.renderAll();
      return;
    }
    if (action === "discover-prev") {
      this.discoverStep = Math.max(0, this.discoverStep - 1);
      this.resetBeatForStep();
      this.renderAll();
      return;
    }
    if (action.startsWith("discover-goto:")) {
      const step = Number(action.slice("discover-goto:".length));
      if (Number.isFinite(step)) {
        this.discoverStep = clamp(Math.floor(step), 0, TrigonometryLabLesson.DISCOVER_STEPS - 1);
        this.resetBeatForStep();
        this.renderAll();
      }
      return;
    }
    if (action === "beat-play") {
      // Start the current step's one-shot animation. Never advances the step.
      if (this.mode !== "discover") return;
      if (!DISCOVER_STEP_META[this.discoverStep]?.hasBeat) return;
      this.beatT = 0;
      this.beatPlaying = true;
      this.renderAll();
      return;
    }
    if (action.startsWith("hyp-preset:")) {
      this.params.hyp = Number(action.slice("hyp-preset:".length));
      this.hypCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (action === "toggle-sin-wave") {
      this.showSinWave = !this.showSinWave;
      this.renderAll();
      return;
    }
    if (action === "toggle-cos-wave") {
      this.showCosWave = !this.showCosWave;
      this.renderAll();
      return;
    }

    if (action.startsWith("angle:")) {
      let deg = Number(action.slice(6));
      // Discover/Triangle work in acute φ — write the clamped value so GUI stays honest.
      if (this.mode === "discover" || this.mode === "triangle") deg = clamp(deg, 5, 85);
      this.params.angleDeg = deg;
      this.angleCtl?.updateDisplay();
      this.waveHistory = 0;
      this.renderAll();
      return;
    }

    if (action.startsWith("snap")) {
      this.params.angleDeg = snapToSpecial(this.params.angleDeg, 20);
      this.angleCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (action.startsWith("solve-case:")) {
      this.solveCase = action.slice(11) as SolveCase;
      this.solveInput = defaultSolveInput(this.solveCase);
      this.renderAll();
      return;
    }

    if (action.startsWith("solve-set:")) {
      // solve-set:a:7
      const parts = action.split(":");
      const key = parts[1] as keyof TriangleSolveInput;
      const value = Number(parts[2]);
      if (key === "case") return;
      this.solveInput = { ...this.solveInput, [key]: value };
      this.renderAll();
      return;
    }

    if (action.startsWith("small:")) {
      this.params.smallDeg = Number(action.slice(6));
      this.renderAll();
      return;
    }

    if (action.startsWith("amp:")) {
      // amp:a:3 or amp:b:-2
      const parts = action.split(":");
      if (parts[1] === "a") this.params.tricksA = Number(parts[2]);
      if (parts[1] === "b") this.params.tricksB = Number(parts[2]);
      this.renderAll();
      return;
    }

    if (action === "hide") {
      this.valuesHidden = true;
      this.renderAll();
      return;
    }
    if (action === "reveal") {
      this.valuesHidden = false;
      this.renderAll();
      return;
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic, this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 16), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildGrid();
    for (let i = 0; i < 3; i++) {
      const h = marker(COL.handle, 0.18);
      h.visible = false;
      this.handles.push(h);
      this.group.add(h);
    }

    this.stopDrag = createDragControls(ctx.viewport, this.handles, (index, point) => {
      this.onDrag(index, {
        x: THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x),
        y: THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y),
      });
    });
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);

    const g = ctx.gui;
    this.angleCtl = tip(
      g.add(this.params, "angleDeg", 0, 360, 1).name("Angle θ (°)"),
      "Central / standard angle. Drag the yellow handle on stage too.",
    ).onChange(() => {
      this.waveHistory = 0;
      this.renderAll();
    });
    this.hypCtl = tip(
      g.add(this.params, "hyp", 1.2, 4.5, 0.1).name("Size / hyp"),
      "Triangle scale in SOH-CAH-TOA mode.",
    ).onChange(() => this.renderAll());
    this.animateCtl = tip(
      g.add(this.params, "animate").name("Animate"),
      "Spin the unit circle / waves. Discover mode is always step-by-step (never auto-plays).",
    ).onChange(() => {
      if (this.mode === "discover") {
        this.params.animate = false;
        this.animateCtl?.updateDisplay();
      }
      this.renderAll();
    });

    this.renderAll();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopTick?.();
    this.stopDrag = undefined;
    this.stopTick = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.labels = new THREE.Group();
    this.handles = [];
    this.viewport = undefined;
  }

  private resetMode(): void {
    this.params.animate = false;
    this.discoverStep = 0;
    this.beatPlaying = false;
    this.beatT = 1;
    this.waveHistory = 0;
    this.valuesHidden = false;
    this.params.angleDeg = this.mode === "special" ? 45 : this.mode === "tricks" ? 12 : this.mode === "discover" ? 30 : 60;
    this.params.hyp = 3.2;
    this.params.smallDeg = 12;
    this.params.tricksA = 3;
    this.params.tricksB = 4;
    this.params.animate = false;
    this.solveCase = "SAS";
    this.solveInput = defaultSolveInput("SAS");
    this.angleCtl?.updateDisplay();
    this.hypCtl?.updateDisplay();
    this.animateCtl?.updateDisplay();
  }

  /** Reset the beat to its finished (fully-drawn) state when a step loads. */
  private resetBeatForStep(): void {
    this.beatPlaying = false;
    this.beatT = 1;
  }

  /** Eased 0..1 progress for the active beat (smoothstep). */
  private beatEase(): number {
    const t = clamp(this.beatT, 0, 1);
    return t * t * (3 - 2 * t);
  }

  private tick(dt: number): void {
    // One-shot beat animation (Discover only) — never advances the step itself.
    if (this.beatPlaying) {
      this.beatT = Math.min(1, this.beatT + dt / BEAT_SECONDS);
      if (this.beatT >= 1) this.beatPlaying = false;
      this.renderScene();
      if (this.mode === "discover") this.updatePanelLive();
    }

    // Discover never auto-advances — user owns the pace.
    if (this.mode === "discover" || !this.params.animate) return;

    if (this.mode === "unit-circle" || this.mode === "quadrants" || this.mode === "special") {
      this.params.angleDeg = wrapDegrees(this.params.angleDeg + dt * 36);
      this.waveHistory = Math.min(360, this.waveHistory + dt * 36);
      this.angleCtl?.updateDisplay();
      this.renderScene();
      this.updatePanelLive();
      return;
    }

    if (this.mode === "tricks") {
      this.params.angleDeg = wrapDegrees(this.params.angleDeg + dt * 40);
      this.angleCtl?.updateDisplay();
      this.renderScene();
      this.updatePanelLive();
    }
  }

  private onDrag(index: number, p: Point): void {
    if (this.mode === "triangle") {
      // Handle sits at the far corner P = (C.x+adj, C.y+opp) = C + polar(hyp, θ).
      if (index !== 0) return;
      const dx = Math.max(0.2, p.x - TRI_ORIGIN.x);
      const dy = Math.max(0.2, p.y - TRI_ORIGIN.y);
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      this.params.angleDeg = clamp(deg, 5, 85);
      this.params.hyp = clamp(Math.hypot(dx, dy), 1.4, 4.5);
      this.angleCtl?.updateDisplay();
      this.hypCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (this.mode === "discover") {
      if (index !== 0) return;
      // Hidden meshes are still raycastable in three.js — only chord/unit own the handle.
      const phase = DISCOVER_STEP_META[this.discoverStep]?.phase;
      if (phase !== "chord" && phase !== "unit") return;
      let a = (Math.atan2(p.y, p.x) * 180) / Math.PI;
      if (a < 0) a += 360;
      const phi = phase === "chord" ? a / 2 : a;
      this.params.angleDeg = clamp(phi, 5, 85);
      this.beatPlaying = false;
      this.beatT = 1;
      this.angleCtl?.updateDisplay();
      this.renderAll();
      return;
    }

    if (this.mode === "unit-circle" || this.mode === "quadrants" || this.mode === "special") {
      if (index !== 0) return;
      let a = (Math.atan2(p.y, p.x) * 180) / Math.PI;
      if (a < 0) a += 360;
      this.params.angleDeg = this.mode === "special" ? snapToSpecial(a, 8) : a;
      this.waveHistory = 0;
      this.params.animate = false;
      this.angleCtl?.updateDisplay();
      this.renderAll();
      return;
    }
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 32, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.1;
    this.group.add(grid);
  }

  private renderAll(): void {
    this.renderScene();
    this.renderPanel();
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    this.disposeChildren(this.labels);
    for (const h of this.handles) h.visible = false;

    switch (this.mode) {
      case "discover":
        this.drawDiscover();
        break;
      case "triangle":
        this.drawTriangle();
        break;
      case "unit-circle":
        this.drawUnitCircle(true);
        break;
      case "quadrants":
        this.drawQuadrants();
        break;
      case "special":
        this.drawSpecial();
        break;
      case "solve":
        this.drawSolve();
        break;
      case "tricks":
        this.drawTricks();
        break;
    }
  }

  private drawAxes(extent = R_CIRCLE + 0.9): void {
    this.line(new THREE.Vector3(-extent, 0, 0), new THREE.Vector3(extent, 0, 0), COL.dim, 0.7);
    this.line(new THREE.Vector3(0, -extent, 0), new THREE.Vector3(0, extent, 0), COL.dim, 0.7);
  }

  private drawCircle(radius: number, color: number, opacity = 1): void {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
    );
    this.dynamic.add(line);
  }

  private drawDiscover(): void {
    const phi = clamp(this.params.angleDeg, 5, 85);
    const bt = this.beatEase();
    const phase = DISCOVER_STEP_META[this.discoverStep]?.phase ?? "mystery";

    // Caption title, top of stage — one label, never on the figure.
    if (!this.valuesHidden) {
      this.labelAt(DISCOVER_STEP_META[this.discoverStep]?.title ?? "", COL.label, { x: 0, y: 3.3 }, 0.3);
    }

    switch (phase) {
      case "mystery":
        this.discoverMystery(phi);
        break;
      case "ratio":
        this.discoverRatio(phi, bt);
        break;
      case "scale":
        this.discoverScale(phi, bt);
        break;
      case "normalize":
        this.discoverNormalize(phi, bt);
        break;
      case "thirty":
        this.discoverThirty(bt);
        break;
      case "chord":
        this.discoverChord(phi, bt);
        break;
      case "unit":
        this.discoverUnit(phi);
        break;
    }
  }

  /** Right triangle at φ with the right angle at C, angle φ at A, opposite = CB. */
  private discoverTriangleSides(tri: ReturnType<typeof rightTriangleState>, oppColor: number, hypColor: number, adjColor: number): void {
    this.line(v(tri.C), v(tri.A), adjColor, 1); // adjacent
    this.line(v(tri.C), v(tri.B), oppColor, 1); // opposite
    this.line(v(tri.A), v(tri.B), hypColor, 1); // hypotenuse
    this.drawRightAngle(tri.C, tri.A, tri.B, 0.22, COL.dim);
    this.poly(angleArcPoints(tri.A, tri.C, tri.B, 0.5), COL.arc);
  }

  private discoverMystery(phi: number): void {
    const tri = rightTriangleState(phi, DISC_HYP, DISC_ORIGIN);
    this.fillTriangle(tri.A, tri.B, tri.C, COL.fill, 0.1);
    this.discoverTriangleSides(tri, COL.radius, COL.radius, COL.radius);
    if (!this.valuesHidden) {
      this.labelAt(`φ = ${formatDegrees(phi, 0)}`, COL.arc, { x: tri.A.x - 0.7, y: tri.A.y + 0.4 }, 0.28);
      // Big pending readout — the whole mystery in one line.
      this.labelAt(`sin ${formatDegrees(phi, 0)} = ?`, COL.sin, { x: 1.9, y: 1.4 }, 0.5);
      this.labelAt("no sides given", COL.dim, { x: 1.9, y: 0.7 }, 0.26);
    }
    this.handles[0].visible = false;
  }

  private discoverRatio(phi: number, bt: number): void {
    const tri = rightTriangleState(phi, DISC_HYP, DISC_ORIGIN);
    this.fillTriangle(tri.A, tri.B, tri.C, COL.fill, 0.1);
    this.discoverTriangleSides(tri, COL.sin, COL.radius, COL.dim);
    // Beat pulse: a dot travels up the opposite, then along the hypotenuse.
    if (this.beatPlaying) {
      let from = tri.C;
      let to = tri.B;
      let local = bt / 0.5;
      if (bt > 0.5) {
        from = tri.A;
        to = tri.B;
        local = (bt - 0.5) / 0.5;
      }
      const dot = marker(bt > 0.5 ? COL.radius : COL.sin, 0.14);
      const pos = lerpPoint(from, to, clamp(local, 0, 1));
      dot.position.set(pos.x, pos.y, 0.4);
      this.dynamic.add(dot);
    }
    if (!this.valuesHidden) {
      this.labelAt("opp", COL.sin, mid(tri.C, tri.B), 0.26, 0, -0.35);
      this.labelAt("hyp", COL.radius, mid(tri.A, tri.B), 0.26, 0.2, 0.2);
      this.labelAt(`φ = ${formatDegrees(phi, 0)}`, COL.arc, { x: tri.A.x - 0.7, y: tri.A.y + 0.4 }, 0.26);
    }
    this.handles[0].visible = false;
  }

  private discoverScale(phi: number, bt: number): void {
    // Two similar triangles sharing corner C and angle φ; the big one grows on beat.
    const smallHyp = DISC_HYP * 0.5;
    const bigHyp = lerp(smallHyp, DISC_HYP, this.beatPlaying ? bt : 1);
    const small = rightTriangleState(phi, smallHyp, DISC_ORIGIN);
    const big = rightTriangleState(phi, bigHyp, DISC_ORIGIN);
    this.fillTriangle(big.A, big.B, big.C, COL.fill, 0.08);
    this.line(v(big.C), v(big.B), COL.sin, 0.9);
    this.line(v(big.C), v(big.A), COL.dim, 0.7);
    this.line(v(big.A), v(big.B), COL.radius, 0.9);
    this.fillTriangle(small.A, small.B, small.C, COL.tan, 0.16);
    this.line(v(small.C), v(small.B), COL.sin, 1);
    this.line(v(small.A), v(small.B), COL.radius, 1);
    this.poly(angleArcPoints(big.A, big.C, big.B, 0.5), COL.arc);
    if (!this.valuesHidden) {
      this.labelAt(`same φ = ${formatDegrees(phi, 0)}`, COL.arc, { x: big.A.x - 1.0, y: big.A.y + 0.4 }, 0.26);
      this.labelAt(`opp/hyp = ${formatNumber(big.sin, 3)}`, COL.ok, { x: 1.9, y: 1.2 }, 0.3);
      this.labelAt("both sizes agree", COL.dim, { x: 1.9, y: 0.6 }, 0.24);
    }
    this.handles[0].visible = false;
  }

  private discoverNormalize(phi: number, bt: number): void {
    // Shrink the hypotenuse to the unit length; the opposite becomes sin φ.
    const hypLen = lerp(DISC_HYP, DISC_UNIT, this.beatPlaying ? bt : 1);
    const tri = rightTriangleState(phi, hypLen, DISC_ORIGIN);
    const sinVal = Math.sin(toRad(phi));
    this.fillTriangle(tri.A, tri.B, tri.C, COL.fill, 0.12);
    this.discoverTriangleSides(tri, COL.sin, COL.radius, COL.dim);
    if (!this.valuesHidden) {
      const atUnit = !this.beatPlaying || bt > 0.98;
      this.labelAt(atUnit ? "1" : "hyp", COL.radius, mid(tri.A, tri.B), 0.26, 0.2, 0.2);
      this.labelAt(atUnit ? `sin φ = ${formatNumber(sinVal, 3)}` : "opp", COL.sin, mid(tri.C, tri.B), 0.26, 0, -0.9);
      this.labelAt(`φ = ${formatDegrees(phi, 0)}`, COL.arc, { x: tri.A.x - 0.7, y: tri.A.y + 0.4 }, 0.26);
    }
    this.handles[0].visible = false;
  }

  private discoverThirty(bt: number): void {
    // Equilateral side 2, split by its altitude into a 30-60-90 (opp 1, hyp 2).
    const eq = equilateralSplit30(2);
    const s = 1.7; // on-stage units per geometric unit
    const BL = { x: -1.7, y: -1.7 };
    const BR = { x: BL.x + eq.side * s, y: BL.y };
    const T = { x: (BL.x + BR.x) / 2, y: BL.y + eq.altitude * s };
    const M = { x: T.x, y: BL.y };
    this.fillTriangle(BL, BR, T, COL.fill, 0.08);
    this.lineLoop([BL, BR, T], COL.radius);
    // Altitude drop grows in on beat.
    const drop = lerpPoint(T, M, this.beatPlaying ? bt : 1);
    this.line(v(T), v(drop), COL.half, 1);
    if (!this.beatPlaying || bt > 0.98) {
      this.drawRightAngle(M, BR, T, 0.2, COL.ok);
      this.fillTriangle(M, BR, T, COL.tan, 0.14);
      this.line(v(M), v(BR), COL.sin, 1); // opposite = 1
      this.line(v(BR), v(T), COL.radius, 1); // hypotenuse = 2
    }
    if (!this.valuesHidden) {
      this.labelAt("1", COL.sin, mid(M, BR), 0.26, -0.3, 0);
      this.labelAt("2", COL.radius, mid(BR, T), 0.26, 0.3, 0.1);
      this.labelAt("30°", COL.arc, { x: T.x + 0.15, y: T.y - 0.55 }, 0.26);
      this.labelAt("sin 30° = 1/2", COL.ok, { x: 0, y: -3.1 }, 0.3);
    }
    this.handles[0].visible = false;
  }

  private discoverChord(phi: number, bt: number): void {
    // Circle at origin; central angle 2φ; half-chord MQ is the opposite side.
    const central = clamp(phi * 2, 10, 170);
    const chord = chordState(central, R_CIRCLE);
    const O = { x: 0, y: 0 };
    const P = { x: R_CIRCLE, y: 0 };
    const Q = polar(R_CIRCLE, central);
    const M = mid(P, Q);
    this.drawCircle(R_CIRCLE, COL.circle);
    this.line(v(O), v(P), COL.radius, 0.9);
    this.line(v(O), v(Q), COL.radius, 0.9);
    this.line(v(P), v(Q), COL.chord, 0.9);
    // Bisector OM draws in on beat.
    const bis = lerpPoint(O, M, this.beatPlaying ? bt : 1);
    this.line(v(O), v(bis), COL.half, 1);
    if (!this.beatPlaying || bt > 0.98) {
      this.line(v(M), v(Q), COL.sin, 1); // half-chord = opposite side
      this.fillTriangle(O, M, Q, COL.half, 0.16);
      this.drawRightAngle(M, O, Q, 0.2, COL.ok);
    }
    this.poly(angleArcPoints(O, M, Q, 0.55), COL.arc);
    if (!this.valuesHidden) {
      this.labelAt("R", COL.radius, polar(R_CIRCLE * 0.55, central + 12), 0.24);
      this.labelAt("½ chord", COL.sin, { x: mid(M, Q).x + 0.35, y: mid(M, Q).y + 0.1 }, 0.24);
      this.labelAt(`φ = ${formatDegrees(phi, 0)}`, COL.arc, polar(R_CIRCLE * 0.3, central * 0.75), 0.24);
      this.labelAt(`sin φ = ${formatNumber(chord.sineHalf, 3)}`, COL.ok, { x: 0, y: -3.1 }, 0.28);
    }
    this.handles[0].visible = true;
    this.handles[0].position.set(Q.x, Q.y, 0.3);
  }

  private discoverUnit(phi: number): void {
    // The normalize step drawn as a circle of radius 1: y-leg is sin φ.
    this.drawAxes(R_CIRCLE + 0.8);
    this.drawCircle(R_CIRCLE, COL.circle);
    const st = unitCircleState(phi, R_CIRCLE);
    const O = { x: 0, y: 0 };
    const P = { x: st.x, y: st.y };
    const H = { x: st.x, y: 0 };
    this.fillTriangle(O, H, P, COL.fill, 0.12);
    this.line(v(O), v(P), COL.radius, 1);
    this.line(v(O), v(H), COL.cos, 1);
    this.line(v(H), v(P), COL.sin, 1);
    this.drawRightAngle(H, O, P, 0.2, COL.ok);
    this.poly(angleArcPoints(O, H, P, 0.55), COL.arc);
    const dot = marker(COL.arc, 0.12);
    dot.position.set(P.x, P.y, 0.2);
    this.dynamic.add(dot);
    if (!this.valuesHidden) {
      this.labelAt(`φ = ${formatDegrees(phi, 0)}`, COL.arc, polar(0.85, phi / 2), 0.24);
      this.labelAt(`sin φ = y = ${formatNumber(st.sin, 3)}`, COL.sin, { x: P.x + 0.35, y: P.y + 0.2 }, 0.26);
      this.labelAt("R = 1", COL.radius, mid(O, P), 0.24, 0.2, 0.2);
    }
    this.handles[0].visible = true;
    this.handles[0].position.set(P.x, P.y, 0.3);
  }

  private drawTriangle(): void {
    const origin = TRI_ORIGIN;
    const deg = clamp(this.params.angleDeg, 5, 85);
    const tri = rightTriangleState(deg, this.params.hyp, origin);
    const twinHyp = clamp(this.params.hyp * 0.55, 1.1, 3.2);
    const twin = rightTriangleState(deg, twinHyp, { x: origin.x + 0.12, y: origin.y + 0.12 });
    const { A, B, C } = tri;
    // Far corner of the bounding box — matches onDrag polar mapping from C.
    const P = { x: A.x, y: B.y };

    // Twin first (underneath): same angle, different size
    this.fillTriangle(twin.A, twin.B, twin.C, COL.tan, 0.14);
    this.lineLoop([twin.A, twin.B, twin.C], COL.tan);
    this.line(v(twin.C), v(twin.B), COL.sin, 0.7);
    this.line(v(twin.C), v(twin.A), COL.cos, 0.7);
    this.line(v(twin.A), v(twin.B), COL.dim, 0.8);

    this.fillTriangle(A, B, C, COL.fill, 0.16);
    this.lineLoop([A, B, C], COL.fill);
    this.drawRightAngle(C, A, B, 0.22, COL.arc);

    this.line(v(C), v(B), COL.sin, 1);
    this.line(v(C), v(A), COL.cos, 1);
    this.line(v(A), v(B), COL.radius, 1);

    const arcPts = angleArcPoints(A, C, B, 0.45);
    this.poly(arcPts, COL.arc);

    if (!this.valuesHidden) {
      // ≤4 on-stage labels: angle arc + the three side roles. All numbers live in the panel.
      this.labelAt("opp", COL.sin, mid(C, B), 0.26, -0.15);
      this.labelAt("hyp", COL.radius, mid(A, B), 0.26, 0.2);
      this.labelAt(`θ=${formatDegrees(tri.angleDeg, 0)}`, COL.arc, { x: A.x - 0.55, y: A.y + 0.45 }, 0.28);
      this.labelAt("two sizes · one ratio", COL.ok, { x: 0, y: -3.2 }, 0.26);
    }

    // Faint guide to the drag handle (hyp direction from C)
    this.line(v(C), v(P), COL.dim, 0.35);
    this.handles[0].visible = true;
    this.handles[0].position.set(P.x, P.y, 0.3);
  }

  private drawUnitCircle(withWaves: boolean): void {
    this.drawAxes(R_CIRCLE + 1.1);
    this.drawCircle(R_CIRCLE, COL.circle);
    const st = unitCircleState(this.params.angleDeg, R_CIRCLE);
    const O = { x: 0, y: 0 };
    const P = { x: st.x, y: st.y };
    const H = { x: st.x, y: 0 };

    this.fillTriangle(O, H, P, COL.fill, 0.12);
    this.line(v(O), v(P), COL.radius, 1);
    this.line(v(O), v(H), COL.cos, 1);
    this.line(v(H), v(P), COL.sin, 1);
    this.arc(0, st.wrappedDeg === 0 && this.params.angleDeg > 0 ? 360 : st.wrappedDeg, 0.55, COL.arc);

    const dot = marker(COL.arc, 0.12);
    dot.position.set(P.x, P.y, 0.2);
    this.dynamic.add(dot);

    if (!this.valuesHidden) {
      this.labelAt("cos", COL.cos, mid(O, H), 0.24, -0.28);
      this.labelAt("sin", COL.sin, mid(H, P), 0.24, 0.18);
      this.labelAt(`θ=${formatDegrees(st.wrappedDeg, 0)}`, COL.arc, polar(0.85, st.wrappedDeg / 2), 0.26);
      this.labelAt(`(${formatNumber(st.cos)}, ${formatNumber(st.sin)})`, COL.label, { x: P.x + 0.35, y: P.y + 0.25 }, 0.24);
    }

    this.handles[0].visible = true;
    this.handles[0].position.set(P.x, P.y, 0.3);

    if (withWaves) {
      // Wave panel to the right of the circle
      const x0 = R_CIRCLE + 1.15;
      const xScale = 3.6 / 360;
      const yScale = R_CIRCLE;
      this.line(new THREE.Vector3(x0, -yScale, 0), new THREE.Vector3(x0, yScale, 0), COL.dim, 0.6);
      this.line(new THREE.Vector3(x0, 0, 0), new THREE.Vector3(x0 + 3.7, 0, 0), COL.dim, 0.6);

      const hist = Math.max(this.waveHistory, st.wrappedDeg || 0.01);
      if (this.showSinWave) {
        const pts = sampleWave("sin", 0, hist, 80).map((p) => ({
          x: x0 + p.x * xScale,
          y: p.y * yScale,
        }));
        this.poly(pts, COL.waveSin);
        this.line(v(P), new THREE.Vector3(x0 + st.wrappedDeg * xScale, st.sin * yScale, 0), COL.sin, 0.45);
      }
      if (this.showCosWave) {
        const pts = sampleWave("cos", 0, hist, 80).map((p) => ({
          x: x0 + p.x * xScale,
          y: p.y * yScale,
        }));
        this.poly(pts, COL.waveCos);
      }
      if (!this.valuesHidden) {
        this.labelAt("unwrap", COL.label, { x: x0 + 1.8, y: yScale + 0.35 }, 0.26);
        if (this.showSinWave) this.labelAt("sin", COL.waveSin, { x: x0 + 3.4, y: 0.35 }, 0.24);
        if (this.showCosWave) this.labelAt("cos", COL.waveCos, { x: x0 + 3.4, y: -0.35 }, 0.24);
      }
    }
  }

  private drawQuadrants(): void {
    this.drawAxes(R_CIRCLE + 1.0);
    this.drawCircle(R_CIRCLE, COL.circle);

    // Quadrant washes
    const qColors = [COL.q1, COL.q2, COL.q3, COL.q4];
    for (let q = 0; q < 4; q++) {
      const start = q * 90;
      this.sector(start, start + 90, R_CIRCLE, qColors[q], 0.08);
      if (!this.valuesHidden) {
        this.labelAt(`Q${q + 1}`, qColors[q], polar(R_CIRCLE * 0.55, start + 45), 0.3);
      }
    }

    const st = unitCircleState(this.params.angleDeg, R_CIRCLE);
    const P = { x: st.x, y: st.y };
    this.line(v({ x: 0, y: 0 }), v(P), COL.radius, 1);
    this.arc(0, st.wrappedDeg || 0.01, 0.7, COL.arc);

    // Reference angle wedge to nearest x-axis
    const ref = st.referenceDeg;
    const q = st.quadrant;
    let refStart = 0;
    if (q === 1) refStart = 0;
    else if (q === 2) refStart = 180 - ref;
    else if (q === 3) refStart = 180;
    else refStart = 360 - ref;
    this.arc(refStart, refStart + (q === 2 || q === 4 ? ref : ref), 1.05, COL.ref);

    // Drop projections
    this.line(v(P), v({ x: P.x, y: 0 }), COL.sin, 0.9);
    this.line(v(P), v({ x: 0, y: P.y }), COL.cos, 0.35);
    this.line(v({ x: 0, y: 0 }), v({ x: P.x, y: 0 }), COL.cos, 0.9);

    const dot = marker(COL.arc, 0.12);
    dot.position.set(P.x, P.y, 0.2);
    this.dynamic.add(dot);

    this.handles[0].visible = true;
    this.handles[0].position.set(P.x, P.y, 0.3);

    if (!this.valuesHidden) {
      const s = st.signs;
      this.labelAt(`ref ${formatDegrees(ref, 0)}`, COL.ref, polar(1.35, refStart + ref / 2), 0.26);
      this.labelAt(`sin ${signLabel(s.sin)}`, COL.sin, { x: -R_CIRCLE - 0.2, y: 2.6 }, 0.28);
      this.labelAt(`cos ${signLabel(s.cos)}`, COL.cos, { x: -R_CIRCLE - 0.2, y: 2.15 }, 0.28);
      this.labelAt(`tan ${signLabel(s.tan)}`, COL.tan, { x: -R_CIRCLE - 0.2, y: 1.7 }, 0.28);
      this.labelAt("All Students Take Calculus", COL.label, { x: 0, y: -R_CIRCLE - 0.55 }, 0.26);
    }
  }

  private drawSpecial(): void {
    this.drawAxes(R_CIRCLE + 0.9);
    this.drawCircle(R_CIRCLE, COL.circle);

    // Mark special angles
    for (const s of SPECIAL_ANGLES) {
      if (s.deg === 360) continue;
      const p = polar(R_CIRCLE, s.deg);
      const m = marker(COL.dim, 0.07);
      m.position.set(p.x, p.y, 0.05);
      this.dynamic.add(m);
    }

    // Snap only when the user is not spinning — never fight tick().
    const deg = this.params.animate
      ? this.params.angleDeg
      : snapToSpecial(this.params.angleDeg, 12);
    if (!this.params.animate && deg !== this.params.angleDeg) {
      this.params.angleDeg = deg;
      this.angleCtl?.updateDisplay();
    }
    const st = unitCircleState(deg, R_CIRCLE);
    const P = { x: st.x, y: st.y };
    const H = { x: st.x, y: 0 };
    this.fillTriangle({ x: 0, y: 0 }, H, P, COL.fill, 0.14);
    this.line(v({ x: 0, y: 0 }), v(P), COL.radius, 1);
    this.line(v({ x: 0, y: 0 }), v(H), COL.cos, 1);
    this.line(v(H), v(P), COL.sin, 1);

    const exact = nearestSpecialAngle(st.wrappedDeg);
    const dot = marker(COL.arc, 0.13);
    dot.position.set(P.x, P.y, 0.2);
    this.dynamic.add(dot);
    this.handles[0].visible = true;
    this.handles[0].position.set(P.x, P.y, 0.3);

    if (!this.valuesHidden) {
      this.labelAt(`${exact.deg}° = ${exact.radLabel}`, COL.arc, { x: 0, y: R_CIRCLE + 0.65 }, 0.3);
      this.labelAt(`sin ${exact.sin}`, COL.sin, { x: 3.3, y: 1.8 }, 0.3);
      this.labelAt(`cos ${exact.cos}`, COL.cos, { x: 3.3, y: 1.25 }, 0.3);
      this.labelAt(`tan ${exact.tan}`, COL.tan, { x: 3.3, y: 0.7 }, 0.3);
      // Construction note
      if (exact.deg === 45 || exact.deg === 135 || exact.deg === 225 || exact.deg === 315) {
        this.labelAt("45-45-90 · sides 1 : 1 : √2", COL.label, { x: 0, y: -R_CIRCLE - 0.5 }, 0.26);
      } else if ([30, 60, 120, 150, 210, 240, 300, 330].includes(exact.deg)) {
        this.labelAt("30-60-90 · sides 1 : √3 : 2", COL.label, { x: 0, y: -R_CIRCLE - 0.5 }, 0.26);
      }
    }
  }

  private drawSolve(): void {
    const result = solveTriangle({ ...this.solveInput, case: this.solveCase });
    const [A, B, C] = result.vertices;

    // Fit triangle into view
    const pts = [A, B, C];
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const w = Math.max(0.5, maxX - minX);
    const h = Math.max(0.5, maxY - minY);
    const scale = Math.min(7.5 / w, 5.2 / h);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const map = (p: Point): Point => ({
      x: (p.x - cx) * scale,
      y: (p.y - cy) * scale - 0.2,
    });
    const Av = map(A);
    const Bv = map(B);
    const Cv = map(C);

    this.fillTriangle(Av, Bv, Cv, result.valid ? COL.fill : COL.bad, 0.18);
    this.lineLoop([Av, Bv, Cv], result.valid ? COL.fill : COL.bad);

    // Side labels a,b,c opposite A,B,C
    if (!this.valuesHidden) {
      this.labelAt(`a=${fmt(result.a)}`, COL.sin, mid(Bv, Cv), 0.26, 0.15);
      this.labelAt(`b=${fmt(result.b)}`, COL.cos, mid(Av, Cv), 0.26, 0.15);
      this.labelAt(`c=${fmt(result.c)}`, COL.tan, mid(Av, Bv), 0.26, -0.25);
      this.labelAt("A", COL.label, { x: Av.x - 0.25, y: Av.y - 0.25 }, 0.28);
      this.labelAt("B", COL.label, { x: Bv.x + 0.2, y: Bv.y - 0.25 }, 0.28);
      this.labelAt("C", COL.label, { x: Cv.x, y: Cv.y + 0.28 }, 0.28);
      if (result.valid) {
        this.labelAt(`A=${formatDegrees(result.A, 1)}`, COL.arc, { x: Av.x - 0.1, y: Av.y + 0.45 }, 0.24);
        this.labelAt(`B=${formatDegrees(result.B, 1)}`, COL.arc, { x: Bv.x - 0.1, y: Bv.y + 0.45 }, 0.24);
        this.labelAt(`C=${formatDegrees(result.C, 1)}`, COL.arc, { x: Cv.x + 0.35, y: Cv.y }, 0.24);
        this.labelAt(`area=${fmt(result.area)}`, COL.ok, { x: 0, y: -3.3 }, 0.28);
      } else {
        this.labelAt(result.reason ?? "Invalid", COL.bad, { x: 0, y: -3.3 }, 0.28);
      }
    }

    // Angle arcs
    if (result.valid) {
      this.poly(angleArcPoints(Av, Bv, Cv, 0.4), COL.arc);
      this.poly(angleArcPoints(Bv, Av, Cv, 0.4), COL.arc);
      this.poly(angleArcPoints(Cv, Av, Bv, 0.4), COL.arc);
    }
  }

  private drawTricks(): void {
    // Left: small-angle comparison; Right: amplitude-phase waves
    const small = smallAngleCheck(this.params.smallDeg);
    const x0 = -5.2;
    // Axes for small-angle plot θ vs value
    this.line(new THREE.Vector3(x0, -2.2, 0), new THREE.Vector3(x0 + 4.2, -2.2, 0), COL.dim, 0.7);
    this.line(new THREE.Vector3(x0, -2.2, 0), new THREE.Vector3(x0, 2.4, 0), COL.dim, 0.7);

    const maxDeg = 40;
    const xScale = 4.0 / maxDeg;
    const yScale = 3.8; // rad-ish scale for y
    const sample = (fn: (deg: number) => number, color: number): void => {
      const pts: Point[] = [];
      for (let i = 0; i <= 50; i++) {
        const d = (maxDeg * i) / 50;
        pts.push({ x: x0 + d * xScale, y: -2.2 + fn(d) * yScale });
      }
      this.poly(pts, color);
    };
    sample((d) => toRad(d), COL.dim); // θ itself
    sample((d) => Math.sin(toRad(d)), COL.sin);
    sample((d) => Math.tan(toRad(d)), COL.tan);
    // marker at current smallDeg
    const sx = x0 + clamp(this.params.smallDeg, 0, maxDeg) * xScale;
    this.line(new THREE.Vector3(sx, -2.2, 0), new THREE.Vector3(sx, -2.2 + small.sin * yScale, 0), COL.arc, 0.8);
    if (!this.valuesHidden) {
      this.labelAt("small θ", COL.label, { x: x0 + 2, y: 2.7 }, 0.28);
      this.labelAt("θ", COL.dim, { x: x0 + 4.0, y: -1.6 }, 0.24);
      this.labelAt("sin", COL.sin, { x: x0 + 4.0, y: -1.15 }, 0.24);
      this.labelAt("tan", COL.tan, { x: x0 + 4.0, y: -0.7 }, 0.24);
      this.labelAt(`θ=${formatDegrees(this.params.smallDeg, 0)}`, COL.arc, { x: x0 + 1.2, y: -2.7 }, 0.24);
    }

    // Right panel: a cos + b sin vs R cos(θ-φ)
    const ap = amplitudePhase(this.params.tricksA, this.params.tricksB);
    const rx = 1.0;
    this.line(new THREE.Vector3(rx, 0, 0), new THREE.Vector3(rx + 5.2, 0, 0), COL.dim, 0.7);
    this.line(new THREE.Vector3(rx, -2.5, 0), new THREE.Vector3(rx, 2.5, 0), COL.dim, 0.7);
    const span = 360;
    const xs = 5.0 / span;
    const ys = 2.0 / Math.max(ap.R, 1);
    const sumPts: Point[] = [];
    const singlePts: Point[] = [];
    for (let i = 0; i <= 90; i++) {
      const deg = (span * i) / 90;
      const th = toRad(deg);
      const sum = this.params.tricksA * Math.cos(th) + this.params.tricksB * Math.sin(th);
      const one = evaluateCosineWave(ap.R, ap.phiRad, th);
      sumPts.push({ x: rx + deg * xs, y: sum * ys });
      singlePts.push({ x: rx + deg * xs, y: one * ys });
    }
    this.poly(sumPts, COL.cos);
    this.poly(singlePts, COL.ok);
    // moving readout
    const thNow = toRad(this.params.angleDeg);
    const yNow = (this.params.tricksA * Math.cos(thNow) + this.params.tricksB * Math.sin(thNow)) * ys;
    const m = marker(COL.arc, 0.1);
    m.position.set(rx + wrapDegrees(this.params.angleDeg) * xs, yNow, 0.2);
    this.dynamic.add(m);

    if (!this.valuesHidden) {
      this.labelAt("a cos + b sin", COL.cos, { x: rx + 2.5, y: 2.8 }, 0.26);
      this.labelAt("= R cos(θ−φ)", COL.ok, { x: rx + 2.5, y: 2.35 }, 0.26);
      this.labelAt(`R=${fmt(ap.R)}  φ=${formatDegrees(ap.phiDeg, 1)}`, COL.label, { x: rx + 2.5, y: -2.9 }, 0.26);
    }
  }

  private renderPanel(): void {
    const modeBtn = (id: TrigLabMode) =>
      `<button type="button" class="course-btn${this.mode === id ? "" : " ghost"}" data-tg="mode:${id}">${MODE_META[id].label}</button>`;

    const meta = MODE_META[this.mode];
    const chipAngles =
      this.mode === "discover" || this.mode === "triangle"
        ? [30, 45, 60]
        : this.mode === "special"
          ? [30, 45, 60, 90, 120, 150, 180]
          : [0, 30, 45, 60, 90, 120, 150, 180, 270];
    const angleChips = chipAngles
      .map(
        (a) =>
          `<button type="button" class="course-btn ghost" data-tg="angle:${a}"><span class="course-num">${a}°</span></button>`,
      )
      .join("");

    let body = "";
    if (this.mode === "discover") body = this.panelDiscover();
    else if (this.mode === "triangle") body = this.panelTriangle();
    else if (this.mode === "unit-circle") body = this.panelUnitCircle();
    else if (this.mode === "quadrants") body = this.panelQuadrants();
    else if (this.mode === "special") body = this.panelSpecial();
    else if (this.mode === "solve") body = this.panelSolve();
    else body = this.panelTricks();

    const animateBtn =
      this.mode === "discover"
        ? ""
        : `<button type="button" class="course-btn ghost" data-tg="toggle-animate">${this.params.animate ? "Pause spin" : "Spin"}</button>`;

    this.setInfo(`
      <h2>Trigonometry Lab</h2>
      <p>Start in <b>Discover</b>: seven manual steps building one idea — <b>sin is a scale-free ratio of one angle</b>. Nothing auto-advances; optional beats animate within a step.</p>

      <div class="course">
        <h3>Mode</h3>
        <div class="course-chapters tg-mode-primary">
          ${PRIMARY_MODES.map(modeBtn).join("")}
        </div>
        <p class="course-hint tg-mode-advanced-label">Advanced</p>
        <div class="course-chapters tg-mode-advanced">
          ${ADVANCED_MODES.map(modeBtn).join("")}
        </div>
        <p class="course-hint"><b>${meta.title}.</b> ${meta.hint}</p>
        <div class="course-chapters" style="margin-top:8px">
          ${animateBtn}
          <button type="button" class="course-btn ghost" data-tg="reset">Reset mode</button>
          <button type="button" class="course-btn ghost" data-tg="${this.valuesHidden ? "reveal" : "hide"}">${this.valuesHidden ? "Reveal values" : "Hide values"}</button>
        </div>
      </div>

      <div class="course">
        <h3>Quick angles</h3>
        <div class="course-chapters">${angleChips}
          <button type="button" class="course-btn ghost" data-tg="snap">Snap special</button>
        </div>
      </div>

      <div class="course" id="tg-live">
        ${body}
      </div>
    `);
  }

  private updatePanelLive(): void {
    const host = document.getElementById("tg-live");
    if (!host) return;
    if (this.mode === "discover") host.innerHTML = this.panelDiscover();
    else if (this.mode === "triangle") host.innerHTML = this.panelTriangle();
    else if (this.mode === "unit-circle") host.innerHTML = this.panelUnitCircle();
    else if (this.mode === "quadrants") host.innerHTML = this.panelQuadrants();
    else if (this.mode === "special") host.innerHTML = this.panelSpecial();
    else if (this.mode === "solve") host.innerHTML = this.panelSolve();
    else host.innerHTML = this.panelTricks();
  }

  private panelDiscover(): string {
    const phi = clamp(this.params.angleDeg, 5, 85);
    const sinVal = Math.sin(toRad(phi));
    const central = clamp(phi * 2, 10, 170);
    const step = this.discoverStep;
    const total = TrigonometryLabLesson.DISCOVER_STEPS;
    const meta = DISCOVER_STEP_META[step];
    const phiTxt = formatDegrees(phi, 0);
    const bodies = [
      `You type <code>sin(${formatNumber(phi, 0)})</code> and the calculator returns a number with <b>no sides given</b> — just an angle. What is it actually answering? The next six steps settle it.`,
      `Pick any right triangle with your angle φ. Sine is one ratio: <code>sin φ = opposite / hypotenuse</code> — two lengths of the same triangle. Play the beat to trace the opposite, then the hypotenuse.`,
      `Double every side. Opposite doubles, hypotenuse doubles, and <code>(2·opp)/(2·hyp) = opp/hyp</code> — the ratio is untouched. Every right triangle at φ is similar, so they all share one value. Play the beat to grow the triangle; the ratio stays pinned.`,
      `Similar triangles let you choose the size. Set <b>hypotenuse = 1</b> without changing the angle. Then <code>sin φ = opposite / 1 = opposite</code>: the opposite length <i>is</i> the number sin φ. Play the beat to shrink the hypotenuse to 1.`,
      `Where does the value come from without a calculator? Take an equilateral triangle of side 2 (every angle 60°) and drop an altitude. It splits off a 30-60-90 with opposite 1 and hypotenuse 2, so <code>sin 30° = 1/2</code> exactly. Play the beat to drop the altitude.`,
      `This is where sine was born. On a circle of radius R the central angle <code>2φ</code> cuts a chord. Bisect it: the half-chord is the opposite side of a right triangle with angle φ and hypotenuse R. So <code>sin φ = (½ chord) / R = chord(2φ)/(2R)</code>. Drag the point to change φ; play the beat to draw the bisector.`,
      `Set R = 1 and the circle <i>is</i> the normalize step. The point at angle φ has height <code>y = sin φ</code> — the same number as steps 2–4, now read straight off the axis.`,
    ];

    const dots = DISCOVER_STEP_META
      .map((_, i) => {
        const cls = i === step ? "tg-step-dot is-active" : i < step ? "tg-step-dot is-done" : "tg-step-dot";
        return `<button type="button" class="${cls}" data-tg="discover-goto:${i}" aria-label="Go to step ${i + 1}" ${i === step ? 'aria-current="step"' : ""}>${i + 1}</button>`;
      })
      .join("");

    const atStart = step <= 0;
    const atEnd = step >= total - 1;

    const callout =
      step === 0
        ? `<div class="tg-sin-callout"><span>sin ${phiTxt}</span><b>= ?</b></div>`
        : `<div class="tg-sin-callout is-solved"><span>sin ${phiTxt}</span><b>= ${formatNumber(sinVal, 4)}</b></div>`;

    // Step 0 deliberately withholds the numeric sine — the mystery is the point.
    const liveBlock =
      step === 0
        ? `<div class="tg-live-readout" aria-label="Live values">
        <div class="tg-live-row"><span>Working angle</span><code>φ = ${formatDegrees(phi, 1)}</code></div>
        <div class="tg-live-row"><span>Sine</span><code>sin φ = ?</code></div>
        <div class="tg-live-row tg-live-eq"><span>Inputs given</span><code>angle only — no sides</code></div>
      </div>`
        : `<div class="tg-live-readout" aria-label="Live values">
        <div class="tg-live-row"><span>Working angle</span><code>φ = ${formatDegrees(phi, 1)}</code></div>
        <div class="tg-live-row"><span>Sine</span><code>sin φ = ${formatNumber(sinVal, 4)}</code></div>
        ${step >= 1 ? `<div class="tg-live-row tg-live-eq"><span>Definition</span><code>sin φ = opp / hyp</code></div>` : ""}
        ${step === 5 ? `<div class="tg-live-row"><span>Central angle</span><code>2φ = ${formatDegrees(central, 1)}</code></div>` : ""}
        ${step === 5 ? `<div class="tg-live-row tg-live-eq"><span>Chord form</span><code>sin φ = chord(2φ) / (2R)</code></div>` : ""}
        ${step === 6 ? `<div class="tg-live-row tg-live-eq"><span>Unit circle</span><code>sin φ = y when R = 1</code></div>` : ""}
      </div>`;

    const beatBtn = meta?.hasBeat
      ? `<button type="button" class="course-btn tg-beat-btn" data-tg="beat-play" ${this.beatPlaying ? "disabled" : ""}>${this.beatPlaying ? "Playing…" : "▶ Play beat"}</button>`
      : "";

    const derivations =
      step >= 2
        ? `<p>Written derivations: ${derivationButton("sine-angle-only")}${step >= 5 ? ` ${derivationButton("sine-from-chord")}` : ""}${step >= 6 ? ` ${derivationButton("sine-unit-circle")}` : ""}</p>`
        : "";

    return `
      <h3>Why sin needs only an angle</h3>
      <p class="tg-step-progress">Step <b>${step + 1}</b> of <b>${total}</b> — manual: nothing auto-advances.</p>
      <div class="tg-step-dots" role="navigation" aria-label="Discovery steps">${dots}</div>
      <div class="course-chapters tg-step-nav">
        <button type="button" class="course-btn ghost" data-tg="discover-prev" ${atStart ? "disabled" : ""}>← Previous</button>
        <button type="button" class="course-btn" data-tg="discover-next" ${atEnd ? "disabled" : ""}>${atEnd ? "Done" : "Next step →"}</button>
      </div>
      ${callout}
      <article class="tg-step-card">
        <h4>${step + 1} · ${meta?.title ?? ""}</h4>
        <p>${bodies[step] ?? ""}</p>
        <p class="course-hint"><b>Focus:</b> ${meta?.focus ?? ""}</p>
        ${beatBtn ? `<div class="course-chapters" style="margin-top:6px">${beatBtn}</div>` : ""}
      </article>
      ${liveBlock}
      ${derivations}
      ${
        step === 5
          ? `<p class="course-hint">Etymology: half-chord (Sanskrit <i>jya</i>) → Arabic <i>jiba</i> → Latin <i>sinus</i> → English <b>sine</b>.</p>`
          : ""
      }
    `;
  }

  private panelTriangle(): string {
    const deg = clamp(this.params.angleDeg, 5, 85);
    const tri = rightTriangleState(deg, this.params.hyp);
    const twin = rightTriangleState(deg, clamp(this.params.hyp * 0.55, 1.1, 3.2));
    return `
      <h3>Triangle · why sin only needs θ</h3>
      <p>Two similar right triangles on stage: <b>same angle θ</b>, different sizes. Sides change; ratios do not.</p>
      <div class="tg-live-readout" aria-label="Two sizes one ratio">
        <div class="tg-live-row"><span>Angle</span><code>θ = ${formatDegrees(tri.angleDeg, 1)}</code></div>
        <div class="tg-live-row"><span>Big hyp</span><code>${fmt(tri.hypotenuse)} → opp ${fmt(tri.opposite)}</code></div>
        <div class="tg-live-row"><span>Small hyp</span><code>${fmt(twin.hypotenuse)} → opp ${fmt(twin.opposite)}</code></div>
        <div class="tg-live-row"><span>Big sin</span><code>${fmt(tri.opposite)} ÷ ${fmt(tri.hypotenuse)} = ${fmt(tri.sin)}</code></div>
        <div class="tg-live-row"><span>Small sin</span><code>${fmt(twin.opposite)} ÷ ${fmt(twin.hypotenuse)} = ${fmt(twin.sin)}</code></div>
        <div class="tg-live-row tg-live-eq"><span>Result</span><code>sin(${formatDegrees(tri.angleDeg, 0)}) = ${fmt(tri.sin)} for both</code></div>
      </div>
      <div class="course-chapters" style="margin-top:8px">
        <button type="button" class="course-btn ghost" data-tg="hyp-preset:2">Size S</button>
        <button type="button" class="course-btn ghost" data-tg="hyp-preset:3.2">Size M</button>
        <button type="button" class="course-btn ghost" data-tg="hyp-preset:4.5">Size L</button>
        <button type="button" class="course-btn ghost" data-tg="angle:30">θ = 30°</button>
        <button type="button" class="course-btn ghost" data-tg="angle:45">θ = 45°</button>
        <button type="button" class="course-btn ghost" data-tg="angle:60">θ = 60°</button>
      </div>
      <div class="tg-live-readout" style="margin-top:10px">
        <div class="tg-live-row"><span>cos θ</span><code>${fmt(tri.adjacent)} ÷ ${fmt(tri.hypotenuse)} = ${fmt(tri.cos)}</code></div>
        <div class="tg-live-row"><span>tan θ</span><code>${fmt(tri.opposite)} ÷ ${fmt(tri.adjacent)} = ${fmt(tri.tan)}</code></div>
      </div>
      <h4>So what does the calculator store?</h4>
      <p>Not your triangle. It stores (or computes) the <b>shared ratio for each angle</b>. When you later know a side, multiply back:</p>
      <p><code>opposite = hypotenuse × sin θ</code> — now you need a length, because you are leaving ratio-land.</p>
      <p class="course-hint">Drag the yellow handle (far corner) to change θ or size. Watch both triangles keep the same sin/cos/tan.</p>
    `;
  }

  private panelUnitCircle(): string {
    const st = unitCircleState(this.params.angleDeg, 1);
    return `
      <h3>Unit circle · projections</h3>
      <div class="pl-implication">
        <div><b>θ</b> ${formatDegrees(st.wrappedDeg, 1)} = ${fmt(st.angleRad)} rad</div>
        <div><b>P</b> (cos, sin) = (<code>${fmt(st.cos)}</code>, <code>${fmt(st.sin)}</code>)</div>
        <div><b>tan</b> ${st.tan === null ? "undefined" : `<code>${fmt(st.tan)}</code>`}
          · <b>sec</b> ${st.sec === null ? "—" : `<code>${fmt(st.sec)}</code>`}
          · <b>csc</b> ${st.csc === null ? "—" : `<code>${fmt(st.csc)}</code>`}</div>
      </div>
      <div class="course-chapters" style="margin-top:8px">
        <button type="button" class="course-btn${this.showSinWave ? "" : " ghost"}" data-tg="toggle-sin-wave">sin wave</button>
        <button type="button" class="course-btn${this.showCosWave ? "" : " ghost"}" data-tg="toggle-cos-wave">cos wave</button>
      </div>
      <p class="course-hint">The right-hand plot unwraps the spinning height (sin) and width (cos) into ordinary graphs.</p>
    `;
  }

  private panelQuadrants(): string {
    const st = unitCircleState(this.params.angleDeg, 1);
    const q = quadrantOf(st.wrappedDeg);
    const ref = referenceAngleDeg(st.wrappedDeg);
    const exact = nearestSpecialAngle(ref);
    return `
      <h3>Quadrants · signs &amp; reference</h3>
      <div class="pl-implication">
        <div><b>Quadrant</b> Q${q} · <b>reference</b> ${formatDegrees(ref, 1)}</div>
        <div><b>Recipe</b> value = (sign from Q) × (acute value of ref)</div>
        <div><b>sin</b> ${signLabel(st.signs.sin)} · <b>cos</b> ${signLabel(st.signs.cos)} · <b>tan</b> ${signLabel(st.signs.tan)}</div>
        <div>Example ref special near ${exact.deg}°: sin ${exact.sin}, cos ${exact.cos}</div>
      </div>
      <p class="course-hint"><b>ASTC</b> — All / Sin / Tan / Cos positive in Q1–Q4. Axes: cos=±1 or sin=±1, tan=0 or undefined.</p>
    `;
  }

  private panelSpecial(): string {
    const exact = nearestSpecialAngle(this.params.angleDeg);
    return `
      <h3>Special angles · exact values</h3>
      <div class="pl-implication">
        <div><b>${exact.deg}°</b> = ${exact.radLabel}</div>
        <div><b>sin</b> ${exact.sin} ≈ ${fmt(exact.sinValue)}</div>
        <div><b>cos</b> ${exact.cos} ≈ ${fmt(exact.cosValue)}</div>
        <div><b>tan</b> ${exact.tan}${exact.tanValue === null ? "" : ` ≈ ${fmt(exact.tanValue)}`}</div>
      </div>
      <p class="course-hint">Build from two triangles only: isosceles right (45°) and half-equilateral (30°/60°). Everything else is reference + sign.</p>
      <table class="tg-specials">
        <thead><tr><th>θ</th><th>sin</th><th>cos</th><th>tan</th></tr></thead>
        <tbody>
          ${[0, 30, 45, 60, 90]
            .map((d) => {
              const s = nearestSpecialAngle(d);
              return `<tr><td>${s.deg}°</td><td>${s.sin}</td><td>${s.cos}</td><td>${s.tan}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  private panelSolve(): string {
    const result = solveTriangle({ ...this.solveInput, case: this.solveCase });
    const caseBtn = (c: SolveCase, label: string) =>
      `<button type="button" class="course-btn${this.solveCase === c ? "" : " ghost"}" data-tg="solve-case:${c}">${label}</button>`;

    let controls = "";
    if (this.solveCase === "SAS") {
      controls = `
        <div class="course-chapters">
          ${stepper("a", this.solveInput.a, [5, 6, 7, 8, 10])}
          ${stepper("b", this.solveInput.b, [6, 8, 10, 12])}
          ${stepper("C", this.solveInput.C, [30, 45, 60, 90, 120], "°")}
        </div>
        <p class="course-hint">SAS: sides a,b with included angle C. Law of cosines finds c, then angles.</p>`;
    } else if (this.solveCase === "SSS") {
      controls = `
        <div class="course-chapters">
          ${stepper("a", this.solveInput.a, [5, 6, 7, 8, 9])}
          ${stepper("b", this.solveInput.b, [5, 6, 7, 8, 9])}
          ${stepper("c", this.solveInput.c, [5, 6, 7, 8, 9])}
        </div>
        <p class="course-hint">SSS: three sides. Law of cosines for every angle. Area via Heron.</p>`;
    } else {
      controls = `
        <div class="course-chapters">
          ${stepper("A", this.solveInput.A, [30, 40, 50, 60], "°")}
          ${stepper("B", this.solveInput.B, [40, 50, 60, 70], "°")}
          ${stepper("c", this.solveInput.c, [6, 8, 10, 12])}
        </div>
        <p class="course-hint">ASA: angles A,B with included side c. Third angle is 180°−A−B; law of sines for a,b.</p>`;
    }

    return `
      <h3>Solve · laws of sines &amp; cosines</h3>
      <div class="course-chapters">
        ${caseBtn("SAS", "SAS")}
        ${caseBtn("SSS", "SSS")}
        ${caseBtn("ASA", "ASA")}
      </div>
      ${controls}
      <div class="pl-implication">
        <div><b>Status</b> ${result.valid ? `<span style="color:#7ee787">triangle</span>` : `<span style="color:#ff7b72">${result.reason}</span>`}</div>
        <div><b>Sides</b> a=${fmt(result.a)}, b=${fmt(result.b)}, c=${fmt(result.c)}</div>
        <div><b>Angles</b> A=${formatDegrees(result.A, 1)}, B=${formatDegrees(result.B, 1)}, C=${formatDegrees(result.C, 1)}</div>
        <div><b>Area</b> ${result.valid ? fmt(result.area) : "—"} · <b>sum angles</b> ${fmt(result.A + result.B + result.C)}°</div>
      </div>
      <h4>Formulas</h4>
      <ul>
        <li>Law of cosines: c² = a² + b² − 2ab cos C · ${derivationButton("law-of-cosines")}</li>
        <li>Law of sines: a/sin A = b/sin B = c/sin C = 2R</li>
        <li>Area = ½ ab sin C = √[s(s−a)(s−b)(s−c)]</li>
      </ul>
    `;
  }

  private panelTricks(): string {
    const small = smallAngleCheck(this.params.smallDeg);
    const ap = amplitudePhase(this.params.tricksA, this.params.tricksB);
    return `
      <h3>Tricks · speed calculations</h3>
      <h4>1. Small-angle (θ in radians)</h4>
      <div class="course-chapters">
        ${[5, 10, 12, 15, 20, 30].map((d) => `<button type="button" class="course-btn${this.params.smallDeg === d ? "" : " ghost"}" data-tg="small:${d}">${d}°</button>`).join("")}
      </div>
      <div class="pl-implication">
        <div>θ = ${fmt(small.angleRad)} rad</div>
        <div>sin θ = ${fmt(small.sin)} ≈ θ (err ${fmt(small.sinError, 5)})</div>
        <div>tan θ = ${fmt(small.tan)} ≈ θ (err ${Number.isFinite(small.tanError) ? fmt(small.tanError, 5) : "—"})</div>
        <div>cos θ = ${fmt(small.cos)} ≈ 1 − θ²/2 = ${fmt(small.cosApprox)} (err ${fmt(small.cosError, 5)})</div>
      </div>
      <h4>2. One-wave form</h4>
      <p>a cos θ + b sin θ = R cos(θ − φ), R=√(a²+b²), φ=atan2(b,a)</p>
      <div class="course-chapters">
        <span class="course-hint">a:</span>
        ${[-4, -3, -2, 0, 2, 3, 4].map((v) => `<button type="button" class="course-btn${this.params.tricksA === v ? "" : " ghost"}" data-tg="amp:a:${v}">${v}</button>`).join("")}
      </div>
      <div class="course-chapters" style="margin-top:6px">
        <span class="course-hint">b:</span>
        ${[-4, -3, -2, 0, 2, 3, 4].map((v) => `<button type="button" class="course-btn${this.params.tricksB === v ? "" : " ghost"}" data-tg="amp:b:${v}">${v}</button>`).join("")}
      </div>
      <div class="pl-implication">
        <div>${this.params.tricksA} cos θ + ${this.params.tricksB} sin θ</div>
        <div>= <code>${fmt(ap.R)}</code> cos(θ − ${formatDegrees(ap.phiDeg, 1)})</div>
      </div>
      <h4>3. Pocket list</h4>
      <ul>
        <li>Always reduce with reference angle + ASTC before evaluating.</li>
        <li>Prefer law of cosines for SAS/SSS; sines for ASA/AAS (watch SSA ambiguity).</li>
        <li>Degrees ↔ radians: × π/180 or × 180/π. Calculus wants radians.</li>
        <li>sin(−θ)=−sin θ, cos(−θ)=cos θ (odd/even).</li>
        <li>sin(90°−θ)=cos θ (cofunction).</li>
      </ul>
    `;
  }

  // --- drawing primitives ---

  private line(a: THREE.Vector3, b: THREE.Vector3, color: number, opacity = 1): void {
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([a, b]),
        new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
      ),
    );
  }

  private lineLoop(pts: Point[], color: number): void {
    this.dynamic.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0.08))),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  private poly(pts: Point[], color: number): void {
    if (pts.length < 2) return;
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0.1))),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  private fillTriangle(a: Point, b: Point, c: Point, color: number, opacity: number): void {
    const shape = new THREE.Shape([new THREE.Vector2(a.x, a.y), new THREE.Vector2(b.x, b.y), new THREE.Vector2(c.x, c.y)]);
    this.dynamic.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }),
      ),
    );
  }

  private arc(fromDeg: number, toDeg: number, radius: number, color: number): void {
    let start = fromDeg;
    let end = toDeg;
    if (end < start) end += 360;
    const pts: THREE.Vector3[] = [];
    const n = Math.max(8, Math.ceil((end - start) / 3));
    for (let i = 0; i <= n; i++) {
      const t = toRad(start + ((end - start) * i) / n);
      pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0.1));
    }
    this.dynamic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })));
  }

  private sector(fromDeg: number, toDeg: number, radius: number, color: number, opacity: number): void {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const t = toRad(fromDeg + ((toDeg - fromDeg) * i) / n);
      const x = Math.cos(t) * radius;
      const y = Math.sin(t) * radius;
      if (i === 0) shape.lineTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.lineTo(0, 0);
    this.dynamic.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }),
      ),
    );
  }

  private drawRightAngle(vertex: Point, p: Point, q: Point, size: number, color: number): void {
    const u = norm({ x: p.x - vertex.x, y: p.y - vertex.y });
    const v2 = norm({ x: q.x - vertex.x, y: q.y - vertex.y });
    const a = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const b = { x: a.x + v2.x * size, y: a.y + v2.y * size };
    const c = { x: vertex.x + v2.x * size, y: vertex.y + v2.y * size };
    this.poly([a, b, c], color);
  }

  private labelAt(text: string, color: number, p: Point, scale = 0.28, dy = 0, dx = 0): void {
    const s = textSprite(text, color, scale);
    s.position.set(p.x + dx, p.y + dy, 0.35);
    this.labels.add(s);
  }

  private disposeChildren(root: THREE.Object3D): void {
    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
      this.disposeObject(child);
    }
  }

  private disposeGroup(root: THREE.Object3D): void {
    root.parent?.remove(root);
    this.disposeObject(root);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) {
        const map = (mat as THREE.MeshBasicMaterial).map;
        map?.dispose();
        mat.dispose();
      }
    });
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function v(p: Point): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, 0.05);
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function polar(r: number, deg: number): Point {
  const t = toRad(deg);
  return { x: Math.cos(t) * r, y: Math.sin(t) * r };
}

function norm(p: Point): Point {
  const L = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / L, y: p.y / L };
}

function signLabel(s: 1 | -1 | 0 | null): string {
  if (s === null) return "undef";
  if (s > 0) return "+";
  if (s < 0) return "−";
  return "0";
}

function fmt(n: number, d = 3): string {
  return formatNumber(n, d);
}

function stepper(key: string, current: number, values: number[], suffix = ""): string {
  return values
    .map(
      (v) =>
        `<button type="button" class="course-btn${current === v ? "" : " ghost"}" data-tg="solve-set:${key}:${v}">${key}=${v}${suffix}</button>`,
    )
    .join("");
}
