import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { kinematics } from "../math/physics";
import { curveXY, segment, tip, updateCurveXY, updateSegment } from "./helpers";
import "./formulaDerivations/physics";

const COLORS = {
  x: 0x79c0ff,
  v: 0xffa657,
  a: 0xff7b72,
  cursor: 0xffffff,
};

/**
 * Lesson: Kinematics.
 *
 * Three stacked graphs show position x(t), velocity v(t) and acceleration a(t) for
 * motion with constant acceleration. A draggable time cursor links the three plots
 * and highlights the calculus relationships: v = dx/dt and a = dv/dt.
 */
export class KinematicsLesson implements Lesson {
  readonly id = "kinematics";
  readonly title = "Kinematics";
  readonly blurb = "Position, velocity and acceleration";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["differentiation", "integration"] as const;

  private group = new THREE.Group();
  private curves!: {
    x: THREE.Line;
    v: THREE.Line;
    a: THREE.Line;
  };
  private cursors!: {
    x: THREE.Line;
    v: THREE.Line;
    a: THREE.Line;
  };
  private movingDot!: THREE.Mesh;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private stopTick?: () => void;

  private params = {
    x0: 0,
    v0: 2,
    a: -1,
    t: 2,
    play: false,
    showVelocity: true,
    showAcceleration: true,
  };

  private readonly tMax = 6;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(3, 0, 14),
      new THREE.Vector3(3, 0, 0),
    );

    this.buildAxes();
    this.buildCurves();
    this.buildCursors();
    this.buildControls();
    this.update();

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (this.params.play) {
        this.params.t = (this.params.t + dt) % this.tMax;
        this.update();
      }
    });
  }

  exit(): void {
    this.stopTick?.();
    this.group.clear();
  }

  private buildAxes(): void {
    const makeAxis = (y: number): void => {
      const axis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, y, 0),
          new THREE.Vector3(this.tMax, y, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x8b949e }),
      );
      this.group.add(axis);
      const y0 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, y - 3, 0),
          new THREE.Vector3(this.tMax, y - 3, 0),
        ]),
        new THREE.LineDashedMaterial({ color: 0x30363d, dashSize: 0.1, gapSize: 0.1 }),
      );
      y0.computeLineDistances();
      this.group.add(y0);
    };

    makeAxis(6);
    makeAxis(0);
    makeAxis(-6);

    const labels = [
      { text: "x(t)", y: 6, color: COLORS.x },
      { text: "v(t)", y: 0, color: COLORS.v },
      { text: "a(t)", y: -6, color: COLORS.a },
    ];
    for (const { text, y, color } of labels) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 64;
      const c = canvas.getContext("2d")!;
      c.fillStyle = "#" + color.toString(16).padStart(6, "0");
      c.font = "bold 40px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 64, 32);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(1.2, 0.6, 1);
      sprite.position.set(-0.6, y, 0.1);
      this.group.add(sprite);
    }
  }

  private buildCurves(): void {
    this.curves = {
      x: curveXY(() => 0, 0, this.tMax, 200, COLORS.x),
      v: curveXY(() => 0, 0, this.tMax, 200, COLORS.v),
      a: curveXY(() => 0, 0, this.tMax, 200, COLORS.a),
    };
    this.curves.x.position.y = 6;
    this.curves.v.position.y = 0;
    this.curves.a.position.y = -6;
    this.group.add(this.curves.x, this.curves.v, this.curves.a);
  }

  private buildCursors(): void {
    this.cursors = {
      x: segment(new THREE.Vector3(0, 6, 0), new THREE.Vector3(0, 9, 0), COLORS.cursor),
      v: segment(new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 3, 0), COLORS.cursor),
      a: segment(new THREE.Vector3(0, -9, 0), new THREE.Vector3(0, -3, 0), COLORS.cursor),
    };
    this.group.add(this.cursors.x, this.cursors.v, this.cursors.a);

    const dotGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: COLORS.x });
    this.movingDot = new THREE.Mesh(dotGeo, dotMat);
    this.group.add(this.movingDot);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "x0", -5, 5, 0.1).name("Initial position x₀"), "Where the object starts at t = 0").onChange(() => this.update());
    tip(g.add(this.params, "v0", -5, 5, 0.1).name("Initial velocity v₀"), "Speed at t = 0 (positive = right)").onChange(() => this.update());
    tip(g.add(this.params, "a", -3, 3, 0.1).name("Acceleration a"), "Constant rate of change of velocity").onChange(() => this.update());
    tip(g.add(this.params, "t", 0, this.tMax, 0.05).name("Time t"), "Drag to move the cursor through the graphs").onChange(() => this.update());
    tip(g.add(this.params, "play").name("Play time"), "Animate the cursor").onChange(() => this.update());

    const show = g.addFolder("Show / hide");
    tip(show.add(this.params, "showVelocity").name("Velocity graph"), "Toggle v(t)").onChange(() => this.update());
    tip(show.add(this.params, "showAcceleration").name("Acceleration graph"), "Toggle a(t)").onChange(() => this.update());
  }

  private update(): void {
    const { x0, v0, a, t } = this.params;
    const state = kinematics(x0, v0, a, t);

    // Rescale curves vertically so they stay visible in their tracks.
    const maxAbs = (vals: number[]) => Math.max(1, ...vals.map(Math.abs));

    const xValues: number[] = [];
    const vValues: number[] = [];
    const aValues: number[] = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const tt = (this.tMax * i) / steps;
      const s = kinematics(x0, v0, a, tt);
      xValues.push(s.x);
      vValues.push(s.v);
      aValues.push(s.a);
    }

    const sx = 2.5 / maxAbs(xValues);
    const sv = 2.5 / maxAbs(vValues);
    const sa = 2.5 / maxAbs(aValues);

    const xFn = (tt: number) => sx * kinematics(x0, v0, a, tt).x;
    const vFn = (tt: number) => sv * kinematics(x0, v0, a, tt).v;
    const aFn = (tt: number) => sa * kinematics(x0, v0, a, tt).a;

    updateCurveXY(this.curves.x, xFn, 0, this.tMax, 200);
    updateCurveXY(this.curves.v, vFn, 0, this.tMax, 200);
    updateCurveXY(this.curves.a, aFn, 0, this.tMax, 200);

    this.curves.v.visible = this.params.showVelocity;
    this.curves.a.visible = this.params.showAcceleration;

    updateSegment(this.cursors.x, new THREE.Vector3(t, 6 - 3, 0), new THREE.Vector3(t, 6 + 3, 0));
    updateSegment(this.cursors.v, new THREE.Vector3(t, -3, 0), new THREE.Vector3(t, 3, 0));
    updateSegment(this.cursors.a, new THREE.Vector3(t, -9, 0), new THREE.Vector3(t, -3, 0));

    this.cursors.v.visible = this.params.showVelocity;
    this.cursors.a.visible = this.params.showAcceleration;

    this.movingDot.position.set(t, 6 + xFn(t), 0.1);

    this.setInfo(`
      <h2>Kinematics</h2>
      <p>Constant-acceleration motion. The three graphs are stacked: position, velocity, then acceleration.</p>
      <div class="formula" data-derivation="constant-acceleration">
        <div class="formula-label">Constant-acceleration equations</div>
        <div class="formula-body">v = v₀ + at&nbsp;&nbsp;·&nbsp;&nbsp;x = x₀ + v₀t + ½at²</div>
      </div>
      <div class="readout">
        <div>at t = ${t.toFixed(2)} s:</div>
        <div><span style="color:#79c0ff">x</span> = ${state.x.toFixed(2)} m</div>
        <div><span style="color:#ffa657">v</span> = ${state.v.toFixed(2)} m/s</div>
        <div><span style="color:#ff7b72">a</span> = ${state.a.toFixed(2)} m/s²</div>
      </div>
      <p><b>The slope link:</b> velocity is the slope of the position graph; acceleration is the slope of the velocity graph. That is exactly what you learned in the Differentiation lesson.</p>
      <p class="example"><b>Try it:</b> set acceleration to a negative value. The velocity graph slopes downward, and the position graph curves like an upside-down bowl — a parabola.</p>
    `);
  }
}
