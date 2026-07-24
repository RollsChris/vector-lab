import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { createDragControls, marker, textSprite, updateSegment, tip } from "./helpers";
import "./formulaDerivations/physics";

const COLORS = {
  beam: 0x8b949e,
  pivot: 0xffa657,
  weight1: 0xff7b72,
  weight2: 0x79c0ff,
  momentArm: 0x3fb950,
};

/**
 * Lesson: Moments & Torque.
 *
 * A balanced beam with a central pivot. Drag two weights left or right and watch the
 * beam tilt when the clockwise and anticlockwise moments are unequal. Moment arms are
 * drawn as dashed lines.
 */
export class MomentsLesson implements Lesson {
  readonly id = "moments";
  readonly title = "Moments & Torque";
  readonly blurb = "Turning forces and equilibrium";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["vectors", "newtons-laws"] as const;

  private group = new THREE.Group();
  private beam!: THREE.Line;
  private pivot!: THREE.Mesh;
  private weight1!: THREE.Mesh;
  private weight2!: THREE.Mesh;
  private arm1!: THREE.Line;
  private arm2!: THREE.Line;
  private label1!: THREE.Sprite;
  private label2!: THREE.Sprite;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private viewport!: LessonContext["viewport"];
  private stopDrag?: () => void;

  private params = {
    m1: 2,
    x1: -2,
    m2: 1,
    x2: 2,
    pivotX: 0,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1, 9),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildScene();
    this.buildControls();
    this.update();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.group.clear();
  }

  private buildScene(): void {
    // Ground / pivot base.
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.4),
      new THREE.MeshStandardMaterial({ color: COLORS.pivot }),
    );
    base.position.set(0, -0.3, 0);
    this.group.add(base);

    // Beam.
    this.beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.beam, linewidth: 3 }),
    );
    this.group.add(this.beam);

    // Pivot marker.
    this.pivot = marker(COLORS.pivot, 0.18);
    this.group.add(this.pivot);

    // Weights.
    this.weight1 = this.createWeight(COLORS.weight1);
    this.weight2 = this.createWeight(COLORS.weight2);
    this.group.add(this.weight1, this.weight2);

    // Moment arms.
    this.arm1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)]),
      new THREE.LineDashedMaterial({ color: COLORS.momentArm, dashSize: 0.15, gapSize: 0.1 }),
    );
    this.arm1.computeLineDistances();
    this.arm2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)]),
      new THREE.LineDashedMaterial({ color: COLORS.momentArm, dashSize: 0.15, gapSize: 0.1 }),
    );
    this.arm2.computeLineDistances();
    this.group.add(this.arm1, this.arm2);

    // Labels.
    this.label1 = textSprite("m₁", COLORS.weight1, 0.6);
    this.label2 = textSprite("m₂", COLORS.weight2, 0.6);
    this.group.add(this.label1, this.label2);

    this.stopDrag = createDragControls(this.viewport, [this.weight1, this.weight2], (index, point) => {
      const x = THREE.MathUtils.clamp(point.x, -4.5, 4.5);
      if (index === 0) this.params.x1 = x;
      else this.params.x2 = x;
      this.update();
    });
  }

  private createWeight(color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color }),
    );
    return mesh;
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "m1", 0.1, 5, 0.1).name("Mass m₁"), "Mass of the left weight").onChange(() => this.update());
    tip(g.add(this.params, "x1", -4.5, 4.5, 0.1).name("Position x₁"), "Horizontal position of the left weight").onChange(() => this.update());
    tip(g.add(this.params, "m2", 0.1, 5, 0.1).name("Mass m₂"), "Mass of the right weight").onChange(() => this.update());
    tip(g.add(this.params, "x2", -4.5, 4.5, 0.1).name("Position x₂"), "Horizontal position of the right weight").onChange(() => this.update());
    tip(g.add(this.params, "pivotX", -2, 2, 0.1).name("Pivot position"), "Move the pivot left or right").onChange(() => this.update());
  }

  private update(): void {
    const { m1, x1, m2, x2, pivotX } = this.params;
    const g = 9.81;

    // Moments about the pivot (clockwise positive).
    const moment1 = m1 * g * (x1 - pivotX);
    const moment2 = m2 * g * (x2 - pivotX);
    const netMoment = moment1 + moment2;

    // Simple rotational stiffness for visual tilt.
    const tilt = -netMoment * 0.02;
    const clampedTilt = THREE.MathUtils.clamp(tilt, -0.5, 0.5);

    // Beam endpoints after rotation around pivot.
    const cos = Math.cos(clampedTilt);
    const sin = Math.sin(clampedTilt);
    const beamLeft = new THREE.Vector3(pivotX + (-5) * cos, (-5) * sin, 0);
    const beamRight = new THREE.Vector3(pivotX + 5 * cos, 5 * sin, 0);
    this.beam.geometry.setFromPoints([beamLeft, beamRight]);

    this.pivot.position.set(pivotX, 0, 0);

    // Position weights on the rotated beam.
    const placeOnBeam = (x: number): THREE.Vector3 => {
      return new THREE.Vector3(pivotX + (x - pivotX) * cos, (x - pivotX) * sin, 0);
    };

    const p1 = placeOnBeam(x1);
    const p2 = placeOnBeam(x2);
    this.weight1.position.set(p1.x, p1.y - 0.5, 0.1);
    this.weight2.position.set(p2.x, p2.y - 0.5, 0.1);

    // Scale weights by mass.
    const s1 = 0.5 + m1 * 0.15;
    const s2 = 0.5 + m2 * 0.15;
    this.weight1.scale.set(s1, s1, s1);
    this.weight2.scale.set(s2, s2, s2);

    // Moment arms (perpendicular distance from pivot to line of action = horizontal here).
    updateSegment(this.arm1, new THREE.Vector3(pivotX, 0, 0), new THREE.Vector3(x1, 0, 0));
    updateSegment(this.arm2, new THREE.Vector3(pivotX, 0, 0), new THREE.Vector3(x2, 0, 0));
    this.arm1.computeLineDistances();
    this.arm2.computeLineDistances();

    // Labels.
    this.label1.position.set(p1.x, p1.y - 1.1, 0.2);
    this.label2.position.set(p2.x, p2.y - 1.1, 0.2);

    const reaction = (m1 + m2) * g;

    this.setInfo(`
      <h2>Moments & Torque</h2>
      <p>A moment is a turning force: <b>moment = force × perpendicular distance from the pivot</b>. Here the force is the weight <i>mg</i>.</p>
      <div class="formula" data-derivation="moment-balance">
        <div class="formula-label">Moment and rotational equilibrium</div>
        <div class="formula-body">τ = F·d<sub>⊥</sub>&nbsp;&nbsp;·&nbsp;&nbsp;Στ = 0 when balanced</div>
      </div>
      <div class="readout">
        <div><span style="color:#ff7b72">m₁</span> = ${m1.toFixed(2)} kg at x = ${x1.toFixed(2)} m &rarr; moment = ${moment1.toFixed(2)} N·m</div>
        <div><span style="color:#79c0ff">m₂</span> = ${m2.toFixed(2)} kg at x = ${x2.toFixed(2)} m &rarr; moment = ${moment2.toFixed(2)} N·m</div>
        <div>Net moment = ${netMoment.toFixed(2)} N·m</div>
        <div>Pivot reaction force = ${reaction.toFixed(2)} N</div>
      </div>
      <p>${Math.abs(netMoment) < 0.1 ? "The beam is <b>balanced</b>: clockwise and anticlockwise moments cancel." : "The beam <b>tilts</b> because the moments are not equal."}</p>
      <p class="example"><b>Try it:</b> put m₂ twice as far from the pivot as m₁. How big must m₂ be to balance m₁?</p>
    `);
  }
}
