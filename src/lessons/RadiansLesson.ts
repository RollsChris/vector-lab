import * as THREE from "three";
import type GUI from "lil-gui";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import { arrow2D, createDragControls, marker, textSprite, updateArrow, tip } from "./helpers";
import "./formulaDerivations/radians";

const R = 2.4; // circle radius in scene units (this is "one radius" = one radian of arc)
const TAU = Math.PI * 2;

const COLORS = {
  circle: 0x8b949e,
  radius: 0x79c0ff,
  arc: 0x7ee787,
  oneRad: 0xffa657,
  dim: 0x484f58,
};

/**
 * Lesson: Radians.
 *
 * A radian is the angle whose arc equals the radius. Sweep the angle and watch the
 * green arc grow at exactly R·θ; drop a marker every time the arc has grown by one more
 * radius, and the count of markers *is* the angle in radians. A full turn takes 2π ≈ 6.28
 * radii of arc, which is why 360° = 2π rad.
 */
export class RadiansLesson implements Lesson {
  readonly id = "radians";
  readonly title = "Radians";
  readonly blurb = "Measuring angles by arc length";
  readonly category = "Trigonometry" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry"] as const;

  private group = new THREE.Group();
  private labels = new THREE.Group();
  private radius!: THREE.Group;
  private arc!: THREE.Line;
  private handle!: THREE.Mesh;
  private radianDots: THREE.Mesh[] = [];
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private viewport!: LessonContext["viewport"];
  private stopDrag?: () => void;
  private stopTick?: () => void;
  private angleCtrl?: { updateDisplay: () => void };

  private params = {
    angleDeg: 60,
    spin: false,
    showTicks: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.world.add(this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 9), new THREE.Vector3(0, 0, 0));

    this.buildScene();
    this.buildControls();
    this.stopTick = ctx.viewport.onTick((dt) => {
      if (!this.params.spin) return;
      this.params.angleDeg = (this.params.angleDeg + dt * 40) % 360;
      this.angleCtrl?.updateDisplay();
      this.update();
    });
    this.update();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopTick?.();
    this.stopDrag = undefined;
    this.stopTick = undefined;
    this.radianDots = [];
    this.group.clear();
    this.labels.clear();
  }

  private buildScene(): void {
    // The circle of radius R, plus faint axes.
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * TAU;
      pts.push(new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0));
    }
    const circle = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: COLORS.circle }),
    );
    this.group.add(circle);

    const axisMat = new THREE.LineBasicMaterial({ color: COLORS.dim });
    const xAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-R - 0.8, 0, 0), new THREE.Vector3(R + 0.8, 0, 0)]), axisMat);
    const yAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -R - 0.8, 0), new THREE.Vector3(0, R + 0.8, 0)]), axisMat);
    this.group.add(xAxis, yAxis);

    // Highlighted arc (0 -> theta), the radius arrow, and the draggable handle.
    this.arc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.arc }));
    this.group.add(this.arc);

    this.radius = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(R, 0), COLORS.radius, 0.03, 0.1, 0.22);
    this.group.add(this.radius);

    this.handle = marker(0xffffff, 0.14);
    this.group.add(this.handle);

    // A dot at every whole radian around the circle: the count of green dots is the angle.
    for (let k = 1; k <= 6; k++) {
      const dot = marker(COLORS.dim, 0.1);
      this.radianDots.push(dot);
      this.group.add(dot);
      const lab = textSprite(`${k}`, COLORS.dim, 0.4);
      lab.name = `radlab${k}`;
      this.labels.add(lab);
    }

    const thetaLab = textSprite("θ", COLORS.arc, 0.6);
    thetaLab.name = "theta";
    this.labels.add(thetaLab);

    this.stopDrag = createDragControls(this.viewport, [this.handle], (_i, point) => {
      let a = Math.atan2(point.y, point.x);
      if (a < 0) a += TAU; // keep in [0, 2π)
      this.params.angleDeg = (a * 180) / Math.PI;
      this.angleCtrl?.updateDisplay();
      this.update();
    });
  }

  private buildControls(): void {
    const g = this.gui;
    this.angleCtrl = tip(
      g.add(this.params, "angleDeg", 0, 360, 1).name("Angle (°)"),
      "Sweep the angle. Drag the white handle on the circle too.",
    ).onChange(() => this.update());

    const presets = {
      "¼ turn (90° = π/2)": 90,
      "½ turn (180° = π)": 180,
      "Full turn (360° = 2π)": 360,
      "Exactly 1 radian (≈57.3°)": 57.29578,
      "60° = π/3": 60,
      "45° = π/4": 45,
      "30° = π/6": 30,
    };
    tip(
      g.add({ preset: "" }, "preset", presets).name("Jump to"),
      "Special angles in both degrees and radians",
    ).onChange((v: number) => {
      this.params.angleDeg = v;
      this.angleCtrl?.updateDisplay();
      this.update();
    });

    tip(g.add(this.params, "showTicks").name("Radius markers"), "Mark every whole radian around the circle").onChange(() => this.update());
    tip(g.add(this.params, "spin").name("Auto-sweep"), "Rotate the angle continuously");
  }

  private update(): void {
    const theta = (this.params.angleDeg * Math.PI) / 180;
    const px = Math.cos(theta) * R;
    const py = Math.sin(theta) * R;

    updateArrow(this.radius, new THREE.Vector3(0, 0, 0), new THREE.Vector3(px, py, 0));
    this.handle.position.set(px, py, 0.05);

    // Rebuild the green arc from 0 to theta.
    const seg = Math.max(2, Math.round((theta / TAU) * 128));
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = (theta * i) / seg;
      arcPts.push(new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0.02));
    }
    this.arc.geometry.setFromPoints(arcPts);

    const thetaLab = this.labels.getObjectByName("theta") as THREE.Sprite;
    const midT = theta / 2;
    thetaLab.position.set(Math.cos(midT) * (R + 0.5), Math.sin(midT) * (R + 0.5), 0.1);

    // Whole-radian markers: green up to theta (the count = radians swept), dim beyond.
    for (let k = 1; k <= 6; k++) {
      const dot = this.radianDots[k - 1];
      const lab = this.labels.getObjectByName(`radlab${k}`) as THREE.Sprite;
      const show = this.params.showTicks && k <= TAU; // 6 <= 6.28
      dot.visible = show;
      lab.visible = show;
      if (!show) continue;
      const on = k <= theta + 1e-9;
      dot.position.set(Math.cos(k) * R, Math.sin(k) * R, 0.06);
      const c = k === 1 ? COLORS.oneRad : on ? COLORS.arc : COLORS.dim;
      const mat = dot.material as THREE.MeshStandardMaterial;
      mat.color.set(c);
      mat.emissive.set(c);
      lab.position.set(Math.cos(k) * (R + 0.45), Math.sin(k) * (R + 0.45), 0.1);
    }

    this.renderInfo(theta);
  }

  private renderInfo(theta: number): void {
    const deg = this.params.angleDeg;
    const arcLen = theta; // in units of R (arc = R·θ, so arc/R = θ)
    const radii = theta; // how many radius-lengths of arc
    const asPi = theta / Math.PI;
    this.setInfo(`
      <h2>Radians</h2>
      <p>How big is an angle? Degrees chop a circle into 360 arbitrary pieces. A <b>radian</b>
      measures the angle by the <b>arc it sweeps</b>, in units of the circle's own radius —
      no arbitrary numbers, just the shape itself.</p>
      <p><b>One radian</b> is the angle whose arc length equals the radius (the orange marker).
      So the angle in radians is simply <i>how many radius-lengths of arc you have swept</i>:
      count the green dots.</p>
      <div class="readout">
        <div><span>angle</span><b>${deg.toFixed(1)}° = ${theta.toFixed(3)} rad = ${asPi.toFixed(3)}π</b>${derivationButton("radian-conversion")}</div>
        <div><span>arc length s = R·θ</span><b>${arcLen.toFixed(3)} × R</b>${derivationButton("arc-length")}</div>
        <div><span>radius-lengths of arc</span><b>${radii.toFixed(2)}</b></div>
      </div>
      <p>Go all the way round: the circumference is <b>2πR</b>, which is <b>2π ≈ 6.28</b> radius-lengths
      of arc. That is why a full turn is <b>2π rad = 360°</b>, a half turn is <b>π rad = 180°</b>, and
      <b>1 rad = 180/π ≈ 57.3°</b>. To convert: multiply degrees by π/180, or radians by 180/π.</p>
      <p><b>Why bother?</b> Because radians make the maths clean. Arc length is just <code>s = R·θ</code>
      ${derivationButton("arc-length")} and speed on a circle is <code>v = R·ω</code> ${derivationButton("tangential-speed")} — no stray factors. And in calculus
      <code>d/dx sin x = cos x</code> ${derivationButton("sine-derivative")} is only true when x is in radians; in degrees an ugly π/180 leaks
      in. Every wave, rotation and oscillation later in the course is written in radians for this reason.</p>
      <p class="example"><b>Try it:</b> jump to "Exactly 1 radian" and see the arc match one radius (orange).
      Then set a full turn and count: the arc wraps 2π ≈ 6.28 radii around — just past the 6th dot.</p>
    `);
  }
}
