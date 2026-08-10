import * as THREE from "three";
import type GUI from "lil-gui";
import type { Controller } from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  eccentricity,
  ellipseArea,
  focalDistance,
  orderedAxes,
  perimeterArcLength,
  ramanujanPerimeter,
} from "../math/ellipse";
import { createDragControls, marker, segment, setSpriteText, textSprite, tip, updateSegment } from "./helpers";
import "./formulaDerivations/ellipse";

const COLORS = {
  curve: 0x79c0ff,
  focus: 0xff7b72,
  accent: 0xffa657,
  good: 0x3fb950,
  purple: 0xd2a8ff,
  yellow: 0xffd166,
  dim: 0x484f58,
};

const TAU = Math.PI * 2;
/** Radius of the "before" circle in beat 1 and the area demo in beat 5. */
const R0 = 2.4;
const CURVE_SEGMENTS = 240;
const TRACE_POINTS = 900;
const MORPH_DOTS = 12;
/** Length of a camera glide / shape morph between beats, in seconds. */
const TRANSITION = 0.8;

interface Shape {
  a: number;
  b: number;
  h: number;
  k: number;
  theta: number;
}

interface BeatMeta {
  title: string;
  /** Seconds of screen time before autoplay advances. */
  duration: number;
  camera: number;
}

const BEATS: readonly BeatMeta[] = [
  { title: "A circle, stretched", duration: 11, camera: 10 },
  { title: "The string construction", duration: 14, camera: 10.5 },
  { title: "The reflection property", duration: 16, camera: 10.5 },
  { title: "Anatomy", duration: 13, camera: 10 },
  { title: "Variations", duration: 18, camera: 12.5 },
  { title: "The calculations", duration: 20, camera: 11.5 },
];

/** Balls pooled for the reflection beat — only the first `ballCount` are shown. */
const MAX_BALLS = 12;
/** Seconds the balls rest on F₂ between volleys. */
const RAY_REST = 1.6;

/** Smoothstep easing on [0,1] — used for every camera glide and shape morph. */
function easeInOut(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function lerpShape(from: Shape, to: Shape, t: number, out: Shape): void {
  out.a = THREE.MathUtils.lerp(from.a, to.a, t);
  out.b = THREE.MathUtils.lerp(from.b, to.b, t);
  out.h = THREE.MathUtils.lerp(from.h, to.h, t);
  out.k = THREE.MathUtils.lerp(from.k, to.k, t);
  out.theta = THREE.MathUtils.lerp(from.theta, to.theta, t);
}

/**
 * Lesson: Ellipses.
 *
 * Presented as a six-beat "story mode" rather than the usual slider board: each beat is a
 * self-contained animated scene the learner steps through (or autoplays) with a transport
 * bar in the info panel. Beat 1 stretches a circle, beat 2 draws the two-pin string
 * definition, beat 3 fires balls out of one focus so they bounce off the wall into the
 * other (the reflection property), beat 4 names a, b, c and e, beat 5 sweeps the
 * vertical / translated / rotated variations, and beat 6 does the calculations — area πab
 * and the perimeter, walked numerically and checked against Ramanujan's approximation.
 */
export class EllipseLesson implements Lesson {
  readonly id = "ellipses";
  readonly title = "Ellipses";
  readonly blurb = "Stretched circles & their calculations";
  readonly category = "Shape" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["circle-calculations", "conic-sections"] as const;

  private group = new THREE.Group();
  private labels = new THREE.Group();
  private viewport!: LessonContext["viewport"];
  private gui!: GUI;
  private setInfo!: (html: string) => void;
  private stopTick?: () => void;
  private infoRoot?: HTMLElement;
  private beatControllers: Controller[] = [];
  private disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  // Scene objects.
  private curve!: THREE.Line;
  private ghost!: THREE.Line;
  private trace!: THREE.Line;
  private areaFill!: THREE.Mesh;
  private spokes!: THREE.LineSegments;
  private dots: THREE.Mesh[] = [];
  private pen!: THREE.Mesh;
  private focus1!: THREE.Mesh;
  private focus2!: THREE.Mesh;
  private centre!: THREE.Mesh;
  private string1!: THREE.Line;
  private string2!: THREE.Line;
  private rays!: THREE.LineSegments;
  private balls: THREE.Mesh[] = [];
  private normalLine!: THREE.Line;
  private handleA!: THREE.Mesh;
  private handleB!: THREE.Mesh;
  /** Handles the drag controls may hit — empty outside the reflection beat. */
  private dragHandles: THREE.Object3D[] = [];
  private stopDrag?: () => void;
  private axisA!: THREE.Line;
  private axisB!: THREE.Line;
  private axisC!: THREE.Line;
  private labelA!: THREE.Sprite;
  private labelB!: THREE.Sprite;
  private labelC!: THREE.Sprite;
  private labelF1!: THREE.Sprite;
  private labelF2!: THREE.Sprite;
  private labelR1!: THREE.Sprite;
  private labelR2!: THREE.Sprite;
  private labelP!: THREE.Sprite;
  private spriteText = new Map<THREE.Sprite, string>();

  // Story state.
  private beat = 0;
  private beatTime = 0;
  private playing = false;
  private transition = 1;
  private textTimer = 0;
  private penAngle = 0;
  private walked = 0;
  private walkAngle = 0;
  private walkDone = false;

  private shape: Shape = { a: 3, b: 1.8, h: 0, k: 0, theta: 0 };
  private target: Shape = { a: 3, b: 1.8, h: 0, k: 0, theta: 0 };
  private shapeFrom: Shape = { a: 3, b: 1.8, h: 0, k: 0, theta: 0 };
  private cameraFrom = new THREE.Vector3();
  private cameraTo = new THREE.Vector3();

  private params = {
    stretch: 0,
    autoStretch: true,
    penSpeed: 0.55,
    a: 3,
    b: 1.8,
    h: 1.6,
    k: 0.9,
    thetaDeg: 32,
    ballCount: 8,
    ballSpeed: 1,
  };

  // Scratch vectors, reused every frame.
  private p1 = new THREE.Vector3();
  private p2 = new THREE.Vector3();
  private p3 = new THREE.Vector3();
  private live: Record<string, HTMLElement> = {};

  enter(ctx: LessonContext): void {
    this.viewport = ctx.viewport;
    this.gui = ctx.gui;
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.world.add(this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, BEATS[0].camera), new THREE.Vector3(0, 0, 0));

    this.buildScene();
    this.stopDrag = createDragControls(ctx.viewport, this.dragHandles, (index, point) =>
      this.onHandleDrag(index, point),
    );

    this.infoRoot = document.getElementById("info") ?? undefined;
    this.infoRoot?.addEventListener("click", this.onInfoClick);

    this.goToBeat(0, false);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.dragHandles = [];
    this.infoRoot?.removeEventListener("click", this.onInfoClick);
    this.infoRoot = undefined;
    this.destroyBeatControls();
    this.dots = [];
    this.balls = [];
    this.spriteText.clear();
    this.live = {};
    this.group.clear();
    this.labels.clear();
    for (const item of this.disposables) item.dispose();
    this.disposables = [];
    this.viewport.setHelpers(true);
  }

  // ---------------------------------------------------------------- scene ---

  private buildScene(): void {
    const axisMat = new THREE.LineBasicMaterial({ color: COLORS.dim });
    this.disposables.push(axisMat);
    const axes = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-7, 0, -0.02), new THREE.Vector3(7, 0, -0.02),
        new THREE.Vector3(0, -5, -0.02), new THREE.Vector3(0, 5, -0.02),
      ]),
      axisMat,
    );
    this.disposables.push(axes.geometry);
    this.group.add(axes);

    this.curve = this.makeCurve(COLORS.curve, CURVE_SEGMENTS + 1);
    this.ghost = this.makeCurve(COLORS.dim, CURVE_SEGMENTS + 1);
    this.trace = this.makeCurve(COLORS.yellow, TRACE_POINTS);
    this.trace.geometry.setDrawRange(0, 0);
    this.group.add(this.curve, this.ghost, this.trace);

    const fillMat = new THREE.MeshBasicMaterial({
      color: COLORS.curve,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const fillGeo = new THREE.CircleGeometry(1, 96);
    this.disposables.push(fillMat, fillGeo);
    this.areaFill = new THREE.Mesh(fillGeo, fillMat);
    this.areaFill.position.z = -0.01;
    this.group.add(this.areaFill);

    const spokeMat = new THREE.LineBasicMaterial({ color: COLORS.purple, transparent: true, opacity: 0.6 });
    const spokeGeo = new THREE.BufferGeometry();
    spokeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MORPH_DOTS * 6), 3));
    this.disposables.push(spokeMat, spokeGeo);
    this.spokes = new THREE.LineSegments(spokeGeo, spokeMat);
    this.group.add(this.spokes);

    for (let i = 0; i < MORPH_DOTS; i++) {
      const dot = marker(COLORS.purple, 0.075);
      this.dots.push(dot);
      this.group.add(dot);
    }

    this.pen = marker(COLORS.yellow, 0.13);
    this.focus1 = marker(COLORS.focus, 0.12);
    this.focus2 = marker(COLORS.focus, 0.12);
    this.centre = marker(COLORS.accent, 0.08);
    this.group.add(this.pen, this.focus1, this.focus2, this.centre);

    this.string1 = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), COLORS.accent);
    this.string2 = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), COLORS.good);
    this.axisA = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), COLORS.curve);
    this.axisB = segment(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), COLORS.good);
    this.axisC = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), COLORS.focus);
    this.group.add(this.string1, this.string2, this.axisA, this.axisB, this.axisC);
    for (const line of [this.string1, this.string2, this.axisA, this.axisB, this.axisC]) {
      this.disposables.push(line.geometry, line.material as THREE.Material);
    }

    // Reflection beat: faint flight paths F₁ → wall → F₂, a ball pool, and the normal at
    // the highlighted bounce point (the line the equal angles are measured from).
    const rayMat = new THREE.LineBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0.45 });
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_BALLS * 12), 3));
    this.disposables.push(rayMat, rayGeo);
    this.rays = new THREE.LineSegments(rayGeo, rayMat);
    this.group.add(this.rays);

    for (let i = 0; i < MAX_BALLS; i++) {
      const ball = marker(COLORS.yellow, 0.07);
      this.balls.push(ball);
      this.group.add(ball);
    }

    this.normalLine = segment(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), COLORS.purple);
    this.disposables.push(this.normalLine.geometry, this.normalLine.material as THREE.Material);
    this.group.add(this.normalLine);

    // Grab handles on the right (a) and top (b) vertices, dragged in the reflection beat.
    this.handleA = marker(COLORS.curve, 0.16);
    this.handleB = marker(COLORS.good, 0.16);
    this.group.add(this.handleA, this.handleB);

    this.labelA = textSprite("a", COLORS.curve, 0.5);
    this.labelB = textSprite("b", COLORS.good, 0.5);
    this.labelC = textSprite("c", COLORS.focus, 0.5);
    this.labelF1 = textSprite("F₁", COLORS.focus, 0.5);
    this.labelF2 = textSprite("F₂", COLORS.focus, 0.5);
    this.labelR1 = textSprite("r₁", COLORS.accent, 0.45);
    this.labelR2 = textSprite("r₂", COLORS.good, 0.45);
    this.labelP = textSprite("P", COLORS.yellow, 0.5);
    this.labels.add(this.labelA, this.labelB, this.labelC, this.labelF1, this.labelF2, this.labelR1, this.labelR2, this.labelP);
  }

  private makeCurve(color: number, points: number): THREE.Line {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color });
    this.disposables.push(geo, mat);
    return new THREE.Line(geo, mat);
  }

  /** Point at parameter t on the current shape, written into `out`. */
  private point(t: number, s: Shape, out: THREE.Vector3): THREE.Vector3 {
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const cr = Math.cos(s.theta);
    const sr = Math.sin(s.theta);
    return out.set(
      s.h + s.a * ct * cr - s.b * st * sr,
      s.k + s.a * ct * sr + s.b * st * cr,
      0,
    );
  }

  private writeCurve(line: THREE.Line, s: Shape): void {
    const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i <= CURVE_SEGMENTS; i++) {
      this.point((i / CURVE_SEGMENTS) * TAU, s, this.p1);
      array[i * 3] = this.p1.x;
      array[i * 3 + 1] = this.p1.y;
      array[i * 3 + 2] = 0;
    }
    attr.needsUpdate = true;
    line.geometry.setDrawRange(0, CURVE_SEGMENTS + 1);
    line.geometry.computeBoundingSphere();
  }

  private setLabel(sprite: THREE.Sprite, text: string, color: number): void {
    if (this.spriteText.get(sprite) === text) return;
    this.spriteText.set(sprite, text);
    setSpriteText(sprite, text, color);
  }

  // ---------------------------------------------------------------- story ---

  private goToBeat(index: number, fromUser: boolean): void {
    const next = THREE.MathUtils.clamp(index, 0, BEATS.length - 1);
    if (fromUser) this.playing = false;
    this.beat = next;
    this.beatTime = 0;
    this.transition = 0;
    this.walked = 0;
    this.walkAngle = 0;
    this.walkDone = false;
    this.penAngle = 0;
    this.params.stretch = 0;
    this.params.autoStretch = true;
    this.shapeFrom = { ...this.shape };
    this.cameraFrom.copy(this.viewport.camera.position);
    this.cameraTo.set(0, 0, BEATS[next].camera);
    this.applyVisibility();
    this.buildBeatControls();
    this.renderInfo();
  }

  private onInfoClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>("[data-beat-action]")?.dataset.beatAction;
    if (action === "prev") {
      this.goToBeat(this.beat - 1, true);
      return;
    }
    if (action === "next") {
      this.goToBeat(this.beat + 1, true);
      return;
    }
    if (action === "play") {
      this.playing = !this.playing;
      this.renderInfo();
      return;
    }
    const jump = target?.closest<HTMLElement>("[data-beat-go]")?.dataset.beatGo;
    if (jump !== undefined) this.goToBeat(Number(jump), true);
  };

  private tick(dt: number): void {
    const step = Math.min(dt, 0.05);
    this.beatTime += step;
    this.transition = Math.min(1, this.transition + step / TRANSITION);
    const ease = easeInOut(this.transition);

    switch (this.beat) {
      case 0: this.beatStretch(); break;
      case 1: this.beatString(step); break;
      case 2: this.beatReflection(); break;
      case 3: this.beatAnatomy(); break;
      case 4: this.beatVariations(); break;
      default: this.beatCalculations(step); break;
    }

    lerpShape(this.shapeFrom, this.target, ease, this.shape);
    this.writeCurve(this.curve, this.shape);
    this.placeCommon();

    switch (this.beat) {
      case 0: this.drawStretch(); break;
      case 1: this.drawString(); break;
      case 2: this.drawReflection(); break;
      case 3: this.drawAnatomy(); break;
      case 4: this.drawVariations(); break;
      default: this.drawCalculations(); break;
    }

    // Camera glide between beats.
    if (this.transition < 1) {
      this.viewport.camera.position.lerpVectors(this.cameraFrom, this.cameraTo, ease);
      this.viewport.controls.target.set(0, 0, 0);
      this.viewport.controls.update();
    }

    // Autoplay countdown.
    if (this.playing) {
      const remaining = BEATS[this.beat].duration - this.beatTime;
      if (remaining <= 0) {
        if (this.beat < BEATS.length - 1) {
          const wasPlaying = true;
          this.goToBeat(this.beat + 1, false);
          this.playing = wasPlaying;
          this.renderInfo();
        } else {
          this.playing = false;
          this.renderInfo();
        }
      }
    }

    this.textTimer += step;
    if (this.textTimer > 0.1) {
      this.textTimer = 0;
      this.updateLiveText();
    }
  }

  private placeCommon(): void {
    const s = this.shape;
    const c = focalDistance(s.a, s.b);
    const along = s.a >= s.b
      ? this.p3.set(Math.cos(s.theta), Math.sin(s.theta), 0)
      : this.p3.set(-Math.sin(s.theta), Math.cos(s.theta), 0);

    this.centre.position.set(s.h, s.k, 0.05);
    this.focus1.position.set(s.h - along.x * c, s.k - along.y * c, 0.06);
    this.focus2.position.set(s.h + along.x * c, s.k + along.y * c, 0.06);
    this.labelF1.position.set(this.focus1.position.x, this.focus1.position.y - 0.45, 0.1);
    this.labelF2.position.set(this.focus2.position.x, this.focus2.position.y - 0.45, 0.1);

    this.areaFill.position.set(s.h, s.k, -0.01);
    this.areaFill.scale.set(s.a, s.b, 1);
    this.areaFill.rotation.z = s.theta;
  }

  // Beat 1 — a circle, stretched.
  private beatStretch(): void {
    if (this.params.autoStretch) {
      this.params.stretch = 0.5 - 0.5 * Math.cos(this.beatTime * 0.7);
      this.beatControllers[0]?.updateDisplay();
    }
    const s = this.params.stretch;
    this.target.a = THREE.MathUtils.lerp(R0, 3.6, s);
    this.target.b = THREE.MathUtils.lerp(R0, 1.5, s);
    this.target.h = 0;
    this.target.k = 0;
    this.target.theta = 0;
  }

  private drawStretch(): void {
    const circle: Shape = { a: R0, b: R0, h: 0, k: 0, theta: 0 };
    this.writeCurve(this.ghost, circle);
    const attr = this.spokes.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i < MORPH_DOTS; i++) {
      const t = (i / MORPH_DOTS) * TAU;
      this.point(t, circle, this.p1);
      this.point(t, this.shape, this.p2);
      this.dots[i].position.set(this.p2.x, this.p2.y, 0.05);
      array[i * 6] = this.p1.x;
      array[i * 6 + 1] = this.p1.y;
      array[i * 6 + 2] = 0;
      array[i * 6 + 3] = this.p2.x;
      array[i * 6 + 4] = this.p2.y;
      array[i * 6 + 5] = 0;
    }
    attr.needsUpdate = true;
    this.spokes.geometry.computeBoundingSphere();
  }

  // Beat 2 — the string construction.
  private beatString(dt: number): void {
    this.target.a = this.params.a;
    this.target.b = Math.min(this.params.b, this.params.a);
    this.target.h = 0;
    this.target.k = 0;
    this.target.theta = 0;
    this.penAngle = (this.penAngle + dt * this.params.penSpeed * TAU * 0.25) % TAU;
  }

  private drawString(): void {
    this.point(this.penAngle, this.shape, this.p1);
    this.pen.position.set(this.p1.x, this.p1.y, 0.08);
    this.labelP.position.set(this.p1.x, this.p1.y + 0.45, 0.1);
    updateSegment(this.string1, this.focus1.position, this.pen.position);
    updateSegment(this.string2, this.focus2.position, this.pen.position);
    // Tag each string at its midpoint, nudged outward along the ellipse's radial
    // direction so the labels sit beside the lines rather than on top of them.
    const nx = Math.cos(this.penAngle);
    const ny = Math.sin(this.penAngle);
    this.labelR1.position.set(
      (this.focus1.position.x + this.p1.x) / 2 + nx * 0.35,
      (this.focus1.position.y + this.p1.y) / 2 + ny * 0.35,
      0.1,
    );
    this.labelR2.position.set(
      (this.focus2.position.x + this.p1.x) / 2 + nx * 0.35,
      (this.focus2.position.y + this.p1.y) / 2 + ny * 0.35,
      0.1,
    );

    // Draw the semi-major axis so "2a" in the readout has a referent in the scene.
    const s = this.shape;
    this.p2.set(s.h, s.k, 0.04);
    this.p3.set(s.h + s.a, s.k, 0.04);
    updateSegment(this.axisA, this.p2, this.p3);
    this.setLabel(this.labelA, `a = ${s.a.toFixed(2)}`, COLORS.curve);
    this.labelA.position.set(s.h + s.a / 2, s.k - 0.4, 0.1);
  }

  // Beat 3 — the reflection property.
  private beatReflection(): void {
    this.target.a = this.params.a;
    this.target.b = Math.min(this.params.b, this.params.a);
    this.target.h = 0;
    this.target.k = 0;
    this.target.theta = 0;
  }

  /** Travel + rest timing for one volley of balls: every route has length 2a. */
  private volley(): { dist: number; arrived: boolean } {
    const path = 2 * this.shape.a;
    const travel = path / (2.2 * this.params.ballSpeed);
    const cycle = this.beatTime % (travel + RAY_REST);
    const dist = Math.min(1, cycle / travel) * path;
    return { dist, arrived: dist >= path - 1e-9 };
  }

  private drawReflection(): void {
    const s = this.shape;
    const n = Math.round(this.params.ballCount);
    const { dist, arrived } = this.volley();
    const f1x = this.focus1.position.x;
    const f1y = this.focus1.position.y;
    const f2x = this.focus2.position.x;
    const f2y = this.focus2.position.y;

    const attr = this.rays.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i < MAX_BALLS; i++) {
      const active = i < n;
      this.balls[i].visible = active;
      if (!active) continue;
      // Offset by half a step so no bounce lands exactly on a vertex, where the
      // highlighted normal would sit on the x-axis and read as part of the ellipse.
      const t = ((i + 0.5) / n) * TAU;
      this.point(t, s, this.p1);
      const r1 = Math.hypot(this.p1.x - f1x, this.p1.y - f1y);
      const r2 = Math.hypot(this.p1.x - f2x, this.p1.y - f2y);

      const base = i * 12;
      array[base] = f1x; array[base + 1] = f1y; array[base + 2] = 0.03;
      array[base + 3] = this.p1.x; array[base + 4] = this.p1.y; array[base + 5] = 0.03;
      array[base + 6] = this.p1.x; array[base + 7] = this.p1.y; array[base + 8] = 0.03;
      array[base + 9] = f2x; array[base + 10] = f2y; array[base + 11] = 0.03;

      if (dist <= r1) {
        const u = r1 < 1e-9 ? 0 : dist / r1;
        this.balls[i].position.set(f1x + (this.p1.x - f1x) * u, f1y + (this.p1.y - f1y) * u, 0.09);
      } else {
        const u = r2 < 1e-9 ? 0 : Math.min(1, (dist - r1) / r2);
        this.balls[i].position.set(this.p1.x + (f2x - this.p1.x) * u, this.p1.y + (f2y - this.p1.y) * u, 0.09);
      }

      if (i === 0) {
        // Normal at the highlighted bounce: the gradient direction (cos t / a, sin t / b)
        // for the un-rotated, un-translated shape this beat always uses.
        this.p2.set(Math.cos(t) / s.a, Math.sin(t) / s.b, 0).normalize().multiplyScalar(1.1);
        this.p3.set(this.p1.x - this.p2.x, this.p1.y - this.p2.y, 0.04);
        this.p2.add(this.p1).setZ(0.04);
        updateSegment(this.normalLine, this.p3, this.p2);
      }
    }
    attr.needsUpdate = true;
    this.rays.geometry.setDrawRange(0, n * 4);
    this.rays.geometry.computeBoundingSphere();

    // All paths have the same length, so the whole volley lands on F₂ in one flash.
    this.focus2.scale.setScalar(arrived ? 1 + 0.3 * Math.sin(this.beatTime * 8) : 1);

    // Grab handles ride the right and top vertices.
    this.handleA.position.set(s.h + s.a, s.k, 0.07);
    this.handleB.position.set(s.h, s.k + s.b, 0.07);
  }

  /** Dragging a vertex handle reshapes the ellipse; the rays follow on the next frame. */
  private onHandleDrag(index: number, point: THREE.Vector3): void {
    if (this.beat !== 2) return;
    if (index === 0) {
      this.params.a = THREE.MathUtils.clamp(Math.abs(point.x), 1, 4.5);
      if (this.params.b > this.params.a) this.params.b = this.params.a;
    } else {
      this.params.b = THREE.MathUtils.clamp(Math.abs(point.y), 0.4, this.params.a);
    }
  }

  // Beat 4 — anatomy.
  private beatAnatomy(): void {
    this.target.a = this.params.a;
    this.target.b = Math.min(this.params.b, this.params.a);
    this.target.h = 0;
    this.target.k = 0;
    this.target.theta = 0;
  }

  private drawAnatomy(): void {
    const s = this.shape;
    // A dim marker keeps orbiting so the scene never freezes, and the foci breathe.
    this.point(this.beatTime * 0.5, s, this.p1);
    this.pen.position.set(this.p1.x, this.p1.y, 0.08);
    this.labelP.position.set(this.p1.x, this.p1.y + 0.45, 0.1);
    const pulse = 1 + 0.18 * Math.sin(this.beatTime * 3);
    this.focus1.scale.setScalar(pulse);
    this.focus2.scale.setScalar(pulse);

    this.p1.set(s.h, s.k, 0.04);
    this.p2.set(s.h + s.a, s.k, 0.04);
    updateSegment(this.axisA, this.p1, this.p2);
    this.labelA.position.set(s.h + s.a / 2, s.k + 0.35, 0.1);

    this.p2.set(s.h, s.k + s.b, 0.04);
    updateSegment(this.axisB, this.p1, this.p2);
    this.labelB.position.set(s.h - 0.45, s.k + s.b / 2, 0.1);

    const c = focalDistance(s.a, s.b);
    this.p2.set(s.h + c, s.k, 0.05);
    updateSegment(this.axisC, this.p1, this.p2);
    this.labelC.position.set(s.h + c / 2, s.k - 0.4, 0.1);

    const [major, minor] = orderedAxes(s.a, s.b);
    this.setLabel(this.labelA, `a = ${major.toFixed(2)}`, COLORS.curve);
    this.setLabel(this.labelB, `b = ${minor.toFixed(2)}`, COLORS.good);
    this.setLabel(this.labelC, `c = ${c.toFixed(2)}`, COLORS.focus);
  }

  /** Which variation beat 4 is showing right now (auto-cycles every 6 seconds). */
  private variationPhase(): { index: number; t: number } {
    const span = 6;
    const total = this.beatTime % (span * 3);
    const index = Math.floor(total / span);
    return { index, t: easeInOut(Math.min(1, (total % span) / 1.4)) };
  }

  // Beat 5 — variations.
  private beatVariations(): void {
    const { index, t } = this.variationPhase();
    const a = this.params.a;
    const b = Math.min(this.params.b, this.params.a);
    if (index === 0) {
      // Tall ellipse: the major axis moves onto y, and so do the foci.
      this.target.a = b;
      this.target.b = a;
      this.target.h = 0;
      this.target.k = 0;
      this.target.theta = 0;
    } else if (index === 1) {
      this.target.a = a;
      this.target.b = b;
      this.target.h = this.params.h * t;
      this.target.k = this.params.k * t;
      this.target.theta = 0;
    } else {
      this.target.a = a;
      this.target.b = b;
      this.target.h = 0;
      this.target.k = 0;
      this.target.theta = THREE.MathUtils.degToRad(this.params.thetaDeg) * t;
    }
  }

  private drawVariations(): void {
    this.point(this.beatTime * 0.6, this.shape, this.p1);
    this.pen.position.set(this.p1.x, this.p1.y, 0.08);
    this.labelP.position.set(this.p1.x, this.p1.y + 0.45, 0.1);
    // The un-transformed ellipse stays on screen as the reference outline.
    this.writeCurve(this.ghost, { a: this.params.a, b: Math.min(this.params.b, this.params.a), h: 0, k: 0, theta: 0 });
  }

  // Beat 6 — the calculations.
  private beatCalculations(dt: number): void {
    const a = this.params.a;
    const b = Math.min(this.params.b, this.params.a);
    const areaStage = this.beatTime % 20 < 8;
    this.target.h = 0;
    this.target.k = 0;
    this.target.theta = 0;
    if (areaStage) {
      // Squash the circle of radius a down to the ellipse: area scales by b/a.
      const t = easeInOut(Math.min(1, ((this.beatTime % 20) - 0.6) / 3));
      this.target.a = a;
      this.target.b = THREE.MathUtils.lerp(a, b, t);
      this.walked = 0;
      this.walkAngle = 0;
      this.walkDone = false;
    } else {
      this.target.a = a;
      this.target.b = b;
      if (!this.walkDone) {
        const previous = this.walkAngle;
        this.walkAngle = Math.min(TAU, this.walkAngle + dt * 0.9);
        this.point(previous, this.shape, this.p1);
        this.point(this.walkAngle, this.shape, this.p2);
        this.walked += this.p1.distanceTo(this.p2);
        if (this.walkAngle >= TAU) this.walkDone = true;
      }
    }
  }

  private drawCalculations(): void {
    const areaStage = this.beatTime % 20 < 8;
    this.areaFill.visible = areaStage;
    this.ghost.visible = areaStage;
    this.trace.visible = !areaStage;
    this.pen.visible = !areaStage;
    this.labelP.visible = false;

    if (areaStage) {
      this.writeCurve(this.ghost, { a: this.params.a, b: this.params.a, h: 0, k: 0, theta: 0 });
      this.trace.geometry.setDrawRange(0, 0);
      return;
    }

    const count = Math.max(2, Math.min(TRACE_POINTS, Math.round((this.walkAngle / TAU) * 600) + 1));
    const attr = this.trace.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      this.point((i / (count - 1)) * this.walkAngle, this.shape, this.p1);
      array[i * 3] = this.p1.x;
      array[i * 3 + 1] = this.p1.y;
      array[i * 3 + 2] = 0.04;
    }
    attr.needsUpdate = true;
    this.trace.geometry.setDrawRange(0, count);
    this.trace.geometry.computeBoundingSphere();

    this.point(this.walkAngle, this.shape, this.p1);
    this.pen.position.set(this.p1.x, this.p1.y, 0.09);
  }

  private applyVisibility(): void {
    const beat = this.beat;
    const show = (object: THREE.Object3D, visible: boolean): void => {
      object.visible = visible;
    };
    show(this.ghost, beat === 0 || beat === 4 || beat === 5);
    show(this.spokes, beat === 0);
    for (const dot of this.dots) show(dot, beat === 0);
    show(this.trace, beat === 5);
    show(this.areaFill, beat === 5);
    show(this.pen, beat !== 0 && beat !== 2);
    show(this.labelP, beat === 1);
    show(this.string1, beat === 1);
    show(this.string2, beat === 1);
    show(this.labelR1, beat === 1);
    show(this.labelR2, beat === 1);
    show(this.rays, beat === 2);
    show(this.normalLine, beat === 2);
    for (const ball of this.balls) show(ball, beat === 2);
    show(this.handleA, beat === 2);
    show(this.handleB, beat === 2);
    // The raycaster tests this list live, so dragging only arms during the reflection beat.
    this.dragHandles.length = 0;
    if (beat === 2) this.dragHandles.push(this.handleA, this.handleB);
    show(this.focus1, beat >= 1 && beat <= 4);
    show(this.focus2, beat >= 1 && beat <= 4);
    show(this.labelF1, beat >= 1 && beat <= 4);
    show(this.labelF2, beat >= 1 && beat <= 4);
    show(this.centre, beat >= 3);
    show(this.axisA, beat === 1 || beat === 3);
    show(this.axisB, beat === 3);
    show(this.axisC, beat === 3);
    show(this.labelA, beat === 1 || beat === 3);
    show(this.labelB, beat === 3);
    show(this.labelC, beat === 3);
    this.focus1.scale.setScalar(1);
    this.focus2.scale.setScalar(1);
  }

  // ------------------------------------------------------------- controls ---

  private destroyBeatControls(): void {
    for (const controller of this.beatControllers) controller.destroy();
    this.beatControllers = [];
  }

  private buildBeatControls(): void {
    this.destroyBeatControls();
    const g = this.gui;
    const push = (controller: Controller, hint: string): Controller => {
      tip(controller, hint);
      this.beatControllers.push(controller);
      return controller;
    };

    if (this.beat === 0) {
      push(
        g.add(this.params, "stretch", 0, 1, 0.001).name("Stretch")
          .onChange(() => { this.params.autoStretch = false; this.beatControllers[1]?.updateDisplay(); }),
        "Drag to squash the circle into the ellipse by hand",
      );
      push(g.add(this.params, "autoStretch").name("Auto-stretch"), "Let the stretch breathe on its own");
    } else if (this.beat === 1) {
      push(g.add(this.params, "penSpeed", 0, 1.5, 0.01).name("Pen speed"), "How fast the pen travels round the string");
      push(
        g.add(this.params, "b", 0.6, 4, 0.01).name("Semi-minor b")
          .onChange((value: number) => { this.params.b = Math.min(value, this.params.a); }),
        "Squash the ellipse — the foci slide apart as b shrinks",
      );
    } else if (this.beat === 2) {
      push(g.add(this.params, "ballCount", 2, MAX_BALLS, 1).name("Ball count"), "How many balls leave F₁ in each volley");
      push(
        g.add(this.params, "ballSpeed", 0.4, 2, 0.05).name("Ball speed"),
        "Flight speed — every ball still lands on F₂ at the same instant",
      );
    } else if (this.beat === 3) {
      push(
        g.add(this.params, "a", 1, 4.5, 0.01).name("Semi-major a")
          .onChange((value: number) => {
            if (this.params.b > value) {
              this.params.b = value;
              this.beatControllers[1]?.updateDisplay();
            }
          }),
        "Half the long width of the ellipse",
      );
      push(
        g.add(this.params, "b", 0.4, 4.5, 0.01).name("Semi-minor b")
          .onChange((value: number) => {
            if (value > this.params.a) {
              this.params.b = this.params.a;
              this.beatControllers[1]?.updateDisplay();
            }
          }),
        "Half the short width — push it up to a and the ellipse becomes a circle",
      );
    } else if (this.beat === 4) {
      push(g.add(this.params, "h", -3, 3, 0.01).name("Centre h"), "Slide the centre along x");
      push(g.add(this.params, "k", -2.5, 2.5, 0.01).name("Centre k"), "Slide the centre along y");
      push(g.add(this.params, "thetaDeg", -90, 90, 1).name("Rotation θ°"), "Turn the ellipse about its centre");
    } else {
      push(
        g.add(this.params, "a", 1, 4.5, 0.01).name("Semi-major a")
          .onChange((value: number) => { if (this.params.b > value) this.params.b = value; }),
        "Half the long width — area and perimeter both grow with it",
      );
      push(
        g.add(this.params, "b", 0.4, 4.5, 0.01).name("Semi-minor b")
          .onChange((value: number) => { if (value > this.params.a) this.params.b = this.params.a; }),
        "Squash the ellipse and watch Ramanujan's estimate track the walked length",
      );
    }
  }

  // ------------------------------------------------------------------ info ---

  private renderInfo(): void {
    const body = [
      this.infoStretch,
      this.infoString,
      this.infoReflection,
      this.infoAnatomy,
      this.infoVariations,
      this.infoCalculations,
    ][this.beat].call(this);

    this.setInfo(`
      <h2>Ellipses</h2>
      ${this.transportHtml()}
      <h3>Beat ${this.beat + 1} · ${BEATS[this.beat].title}</h3>
      ${body}
    `);

    this.live = {};
    const root = document.getElementById("info");
    root?.querySelectorAll<HTMLElement>("[data-live]").forEach((element) => {
      const key = element.dataset.live;
      if (key) this.live[key] = element;
    });
    this.updateLiveText();
  }

  private transportHtml(): string {
    const dots = BEATS.map((meta, index) => `
      <button type="button" class="ellipse-dot${index === this.beat ? " is-active" : ""}"
        data-beat-go="${index}" data-testid="beat-dot-${index}"
        aria-label="Beat ${index + 1}: ${meta.title}"
        aria-current="${index === this.beat ? "true" : "false"}"></button>`).join("");

    return `
      <div class="ellipse-transport" role="group" aria-label="Story controls">
        <button type="button" class="ellipse-tbtn" data-beat-action="prev" data-testid="beat-prev"
          aria-label="Previous beat"${this.beat === 0 ? " disabled" : ""}>◀</button>
        <button type="button" class="ellipse-tbtn ellipse-play" data-beat-action="play" data-testid="beat-play"
          aria-label="${this.playing ? "Pause the story" : "Play the story"}"
          aria-pressed="${this.playing ? "true" : "false"}">${this.playing ? "⏸" : "▶"}</button>
        <button type="button" class="ellipse-tbtn" data-beat-action="next" data-testid="beat-next"
          aria-label="Next beat"${this.beat === BEATS.length - 1 ? " disabled" : ""}>▶|</button>
        <div class="ellipse-dots" role="group" aria-label="Jump to a beat">${dots}</div>
        <span class="ellipse-count">Beat ${this.beat + 1} of ${BEATS.length}</span>
      </div>
      <p class="ellipse-hint"><span data-live="autoplay">Paused — press play to run the story.</span></p>
    `;
  }

  private infoStretch(): string {
    return `
      <p>Take a circle and pull it wider in one direction than the other. Every point slides
      straight out along its own line — the round curve becomes an <b>ellipse</b>. Nothing else changes:
      it is still one smooth closed loop, just stretched.</p>
      <div class="formula" data-derivation-exempt="Parametric statement of the stretch, taken as the definition of the curve">
        <div class="formula-label">Parametric point</div>
        <div class="formula-body">(x, y) = (a·cos t, b·sin t)</div>
        <div class="formula-note">The circle is (r·cos t, r·sin t). Stretch x by a and y by b and you have the ellipse.</div>
      </div>
      <div class="readout">
        <div><span>Stretch</span><b data-live="stretch">0%</b></div>
        <div><span>Half-width a</span><b data-live="a">—</b></div>
        <div><span>Half-height b</span><b data-live="b">—</b></div>
      </div>
      <p class="example"><b>Watch:</b> the grey circle is the "before". The purple dots are the same twelve
      points, riding outward and inward as the stretch changes.</p>
    `;
  }

  private infoString(): string {
    return `
      <p>This is the real definition. Pin a loop of string at two points — the <b>foci</b> F₁ and F₂ —
      pull it taut with a pen and go round. The pen's two distances always add to the same total,
      and that total is the full width of the ellipse, <b>2a</b>. Here <b>a</b> is half the long width —
      centre to rightmost point — drawn as the blue line.</p>
      <div class="formula" data-derivation="ellipse-standard-equation">
        <div class="formula-label">Defining property</div>
        <div class="formula-body">r₁ + r₂ = 2a</div>
        <div class="formula-note">Squaring away the two square roots turns this rule into x²/a² + y²/b² = 1.</div>
      </div>
      <div class="readout">
        <div><span>r₁ (to F₁)</span><b data-live="r1">—</b></div>
        <div><span>r₂ (to F₂)</span><b data-live="r2">—</b></div>
        <div><span>r₁ + r₂</span><b data-live="rsum">—</b></div>
        <div><span>2a</span><b data-live="twoa">—</b></div>
      </div>
      <p class="example"><b>Watch:</b> the orange string is r₁ (pen to F₁), the green string is r₂
      (pen to F₂) — both labelled in the scene. Each changes length constantly, but their sum never
      moves off 2a. Shrink b and the foci slide apart — the string still measures 2a.</p>
    `;
  }

  private infoReflection(): string {
    return `
      <p>An ellipse is a whispering wall. Fire a ball out of one focus in <b>any</b> direction and the
      wall bounces it straight into the other focus. That is because the normal at the bounce point
      bisects the angle between the two focal lines, so the law of reflection — angle in equals
      angle out — always routes the ball onto F₂.</p>
      <div class="formula" data-derivation-exempt="Geometric statement of the equal-angle reflection property; the proof needs the tangent direction from calculus">
        <div class="formula-label">Reflection property</div>
        <div class="formula-body">∠F₁PN = ∠NPF₂  ⇒  every path F₁ → P → F₂</div>
        <div class="formula-note">N is the normal at the bounce point P (the purple line on ball 1's path).</div>
      </div>
      <div class="readout">
        <div><span>Semi-major a</span><b data-live="a">—</b></div>
        <div><span>Semi-minor b</span><b data-live="b">—</b></div>
        <div><span>Ball 1's path r₁ + r₂</span><b data-live="pathlen">—</b></div>
        <div><span>2a</span><b data-live="twoa">—</b></div>
        <div><span>Distance flown</span><b data-live="travelled">—</b></div>
        <div><span>Volley</span><b data-live="volley">—</b></div>
      </div>
      <p class="example"><b>Try it:</b> grab the <b>blue handle</b> on the right vertex or the
      <b>green handle</b> on the top vertex and reshape the ellipse mid-volley — every path still
      bounces into F₂, and they still all land together. Whispering galleries and kidney-stone
      lithotripsy both exploit this: sound or shockwaves emitted at one focus collect at the other.</p>
    `;
  }

  private infoAnatomy(): string {
    return `
      <p>Four numbers describe any ellipse. <b>a</b> is half the long width, <b>b</b> is half the short
      width, <b>c</b> is how far each focus sits from the centre, and <b>e</b> says how far from round it is.
      A right-angled triangle ties the first three together: a² = b² + c².</p>
      <div class="formula" data-derivation="ellipse-standard-equation">
        <div class="formula-label">Standard equation · centre at the origin</div>
        <div class="formula-body">x²/a² + y²/b² = 1</div>
        <div class="formula-note">Foci at (±c, 0) with c = √(a² − b²), and eccentricity e = c/a.</div>
      </div>
      <div class="readout">
        <div><span>Semi-major a</span><b data-live="a">—</b></div>
        <div><span>Semi-minor b</span><b data-live="b">—</b></div>
        <div><span>c = √(a² − b²)</span><b data-live="c">—</b></div>
        <div><span>Eccentricity e = c/a</span><b data-live="e">—</b></div>
        <div><span>Focus F₁</span><b data-live="f1">—</b></div>
        <div><span>Focus F₂</span><b data-live="f2">—</b></div>
        <div><span>With numbers</span><b data-live="eq">—</b></div>
      </div>
      <p class="example"><b>Try it:</b> push <b>b</b> up until it meets <b>a</b>. The foci collide at the centre,
      c drops to 0, e → 0 — and the ellipse is a circle.</p>
    `;
  }

  private infoVariations(): string {
    return `
      <p>The same curve, moved around. Standing it up swaps which axis is long. Sliding the centre to
      (h, k) shifts every x and y. Rotating mixes x and y together, which is easiest to write
      parametrically rather than as one Cartesian equation.</p>
      <div class="formula" data-derivation-exempt="The standard equation with the centre translated; no new derivation">
        <div class="formula-label">Translated centre</div>
        <div class="formula-body">(x − h)²/a² + (y − k)²/b² = 1</div>
        <div class="formula-note">Tall ellipse: if b > a the major axis is vertical and the foci are at (h, k ± c).</div>
      </div>
      <div class="formula" data-derivation-exempt="Parametric form obtained by applying a rotation matrix to the standard parametrisation">
        <div class="formula-label">Rotated by θ</div>
        <div class="formula-body">x = h + a·cos t·cos θ − b·sin t·sin θ,  y = k + a·cos t·sin θ + b·sin t·cos θ</div>
        <div class="formula-note">In Cartesian form a rotation introduces an xy term, so the tidy x²/a² + y²/b² split is lost.</div>
      </div>
      <div class="readout">
        <div><span>Showing</span><b data-live="variation">—</b></div>
        <div><span>Centre</span><b data-live="centre">—</b></div>
        <div><span>Rotation θ</span><b data-live="theta">—</b></div>
        <div><span>Eccentricity e</span><b data-live="e">—</b></div>
      </div>
      <p class="example"><b>Watch:</b> the beat cycles vertical → translated → rotated. The grey outline is the
      untouched ellipse, so you can see exactly what each variation did. Use h, k and θ to steer it.</p>
    `;
  }

  private infoCalculations(): string {
    return `
      <p>Area is easy: the ellipse is a circle of radius a squashed by b/a, so its area is squashed by
      the same factor. Perimeter is not — there is <b>no exact formula</b> in elementary functions, so we
      either integrate numerically or use an approximation.</p>
      <div class="formula" data-derivation="ellipse-area">
        <div class="formula-label">Area</div>
        <div class="formula-body">A = πab</div>
        <div class="formula-note">πa² for the circle, times the squash factor b/a.</div>
      </div>
      <div class="formula" data-derivation="ramanujan-perimeter">
        <div class="formula-label">Perimeter · Ramanujan's approximation</div>
        <div class="formula-body">C ≈ π[3(a+b) − √((3a+b)(a+3b))]</div>
        <div class="formula-note">Exact for a circle, and within a whisker of the true value for anything not extremely flat.</div>
      </div>
      <div class="readout">
        <div><span>Focus F₁</span><b data-live="f1">—</b></div>
        <div><span>Focus F₂</span><b data-live="f2">—</b></div>
        <div><span>Area πab</span><b data-live="area">—</b></div>
        <div><span>Walked so far</span><b data-live="walked">—</b></div>
        <div><span>Numerical perimeter</span><b data-live="numeric">—</b></div>
        <div><span>Ramanujan estimate</span><b data-live="ramanujan">—</b></div>
        <div><span>Difference</span><b data-live="diff">—</b></div>
      </div>
      <p class="example"><b>Watch:</b> first the circle of radius a squashes down to the ellipse — the shaded
      area shrinks by exactly b/a. Then the pen walks the rim, adding up tiny straight steps until the
      running total lands on Ramanujan's number.</p>
    `;
  }

  private set(key: string, value: string): void {
    const element = this.live[key];
    if (element && element.textContent !== value) element.textContent = value;
  }

  /**
   * Live F₁/F₂ coordinate readouts, computed the same way placeCommon positions the
   * focus markers: c out along the major axis (which is the rotated x-axis for a ≥ b,
   * the rotated y-axis for b > a).
   */
  private setFociText(): void {
    const s = this.shape;
    const c = focalDistance(s.a, s.b);
    const ux = s.a >= s.b ? Math.cos(s.theta) : -Math.sin(s.theta);
    const uy = s.a >= s.b ? Math.sin(s.theta) : Math.cos(s.theta);
    // Tidy away "-0.00" and rounding dust so a centred circle reads (0.00, 0.00).
    const fmt = (v: number): string => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);
    this.set("f1", `(${fmt(s.h - ux * c)}, ${fmt(s.k - uy * c)})`);
    this.set("f2", `(${fmt(s.h + ux * c)}, ${fmt(s.k + uy * c)})`);
  }

  private updateLiveText(): void {
    const s = this.shape;
    const [major, minor] = orderedAxes(s.a, s.b);
    const c = focalDistance(s.a, s.b);

    if (this.playing) {
      const remaining = Math.max(0, BEATS[this.beat].duration - this.beatTime);
      this.set("autoplay", `Playing — next beat in ${remaining.toFixed(0)}s.`);
    } else {
      this.set("autoplay", "Paused — press play to run the story, or step with ◀ ▶|.");
    }

    switch (this.beat) {
      case 0:
        this.set("stretch", `${(this.params.stretch * 100).toFixed(0)}%`);
        this.set("a", s.a.toFixed(2));
        this.set("b", s.b.toFixed(2));
        break;
      case 1: {
        // Measure in the z=0 plane: pen and foci sit on slightly different z layers for
        // draw order, and the 3D distance would visibly drift off the 2a invariant.
        const px = this.pen.position.x;
        const py = this.pen.position.y;
        const r1 = Math.hypot(px - this.focus1.position.x, py - this.focus1.position.y);
        const r2 = Math.hypot(px - this.focus2.position.x, py - this.focus2.position.y);
        this.set("r1", r1.toFixed(3));
        this.set("r2", r2.toFixed(3));
        this.set("rsum", (r1 + r2).toFixed(3));
        this.set("twoa", (2 * major).toFixed(3));
        break;
      }
      case 2: {
        const n = Math.round(this.params.ballCount);
        const { dist, arrived } = this.volley();
        // Ball 0's bounce parameter, matching drawReflection.
        this.point(0.5 / n * TAU, s, this.p1);
        const r1 = Math.hypot(this.p1.x - this.focus1.position.x, this.p1.y - this.focus1.position.y);
        const r2 = Math.hypot(this.p1.x - this.focus2.position.x, this.p1.y - this.focus2.position.y);
        this.set("a", major.toFixed(2));
        this.set("b", minor.toFixed(2));
        this.set("pathlen", (r1 + r2).toFixed(3));
        this.set("twoa", (2 * major).toFixed(3));
        this.set("travelled", dist.toFixed(2));
        this.set("volley", arrived
          ? `all ${n} landed on F₂ together`
          : `${n} balls in flight`);
        break;
      }
      case 3:
        this.set("a", major.toFixed(2));
        this.set("b", minor.toFixed(2));
        this.set("c", c.toFixed(3));
        this.set("e", eccentricity(s.a, s.b).toFixed(3));
        this.setFociText();
        this.set("eq", `x²/${(major * major).toFixed(2)} + y²/${(minor * minor).toFixed(2)} = 1`);
        break;
      case 4: {
        const names = ["vertical (b > a)", "translated centre (h, k)", "rotated by θ"];
        this.set("variation", names[this.variationPhase().index]);
        this.set("centre", `(${s.h.toFixed(2)}, ${s.k.toFixed(2)})`);
        this.set("theta", `${THREE.MathUtils.radToDeg(s.theta).toFixed(0)}°`);
        this.set("e", eccentricity(s.a, s.b).toFixed(3));
        break;
      }
      default: {
        const numeric = perimeterArcLength(s.a, s.b, 4000);
        const estimate = ramanujanPerimeter(s.a, s.b);
        const areaStage = this.beatTime % 20 < 8;
        const walked = areaStage ? 0 : this.walked;
        this.setFociText();
        this.set("area", ellipseArea(s.a, s.b).toFixed(3));
        this.set("walked", walked.toFixed(3));
        this.set("numeric", numeric.toFixed(3));
        this.set("ramanujan", estimate.toFixed(3));
        this.set("diff", `${Math.abs(estimate - numeric).toFixed(4)} (${(Math.abs(estimate - numeric) / numeric * 100).toFixed(3)}%)`);
        break;
      }
    }
  }
}
