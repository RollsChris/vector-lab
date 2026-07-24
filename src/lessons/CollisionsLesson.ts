import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { collide1D } from "../math/physics";
import { arrow2D, textSprite, updateArrow, tip } from "./helpers";
import "./formulaDerivations/physics";

const COLORS = {
  block1: 0xff7b72,
  block2: 0x79c0ff,
  velocity: 0xffa657,
  ground: 0x3fb950,
};

/**
 * Lesson: Collisions.
 *
 * Two blocks on a frictionless track collide. Adjust masses, initial velocities and
 * the coefficient of restitution, then watch momentum conservation in action.
 */
export class CollisionsLesson implements Lesson {
  readonly id = "collisions";
  readonly title = "Collisions";
  readonly blurb = "Momentum before and after impact";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["momentum-impulse"] as const;

  private group = new THREE.Group();
  private block1!: THREE.Mesh;
  private block2!: THREE.Mesh;
  private arrow1!: THREE.Group;
  private arrow2!: THREE.Group;
  private label1!: THREE.Sprite;
  private label2!: THREE.Sprite;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private stopTick?: () => void;

  private params = {
    m1: 2,
    v1: 3,
    m2: 2,
    v2: 0,
    restitution: 1,
    time: 0,
    play: false,
  };

  // Runtime state updated on fire.
  private sim = {
    v1i: 3,
    v2i: 0,
    v1f: 0,
    v2f: 0,
    collisionTime: 0,
    x1Collision: 0,
    x2Collision: 0,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.5, 12),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildScene();
    this.buildControls();
    this.fire();

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (this.params.play) {
        const { collisionTime } = this.sim;
        if (this.params.time < collisionTime) {
          this.params.time = Math.min(this.params.time + dt, collisionTime);
        } else {
          this.params.time += dt;
          if (this.params.time > collisionTime + 3) this.params.time = 0;
        }
        this.update();
      }
    });
  }

  exit(): void {
    this.stopTick?.();
    this.group.clear();
  }

  private buildScene(): void {
    // Track.
    const track = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.ground }),
    );
    this.group.add(track);

    this.block1 = this.createBlock(COLORS.block1);
    this.block2 = this.createBlock(COLORS.block2);
    this.group.add(this.block1, this.block2);

    this.arrow1 = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.velocity, 0.04, 0.1, 0.2);
    this.arrow2 = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.velocity, 0.04, 0.1, 0.2);
    this.group.add(this.arrow1, this.arrow2);

    this.label1 = textSprite("m₁", COLORS.block1, 0.6);
    this.label2 = textSprite("m₂", COLORS.block2, 0.6);
    this.group.add(this.label1, this.label2);
  }

  private createBlock(color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color }),
    );
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "m1", 0.5, 5, 0.1).name("Mass m₁"), "Mass of the left block").onChange(() => this.fire());
    tip(g.add(this.params, "v1", -5, 5, 0.1).name("Velocity v₁"), "Initial velocity of the left block").onChange(() => this.fire());
    tip(g.add(this.params, "m2", 0.5, 5, 0.1).name("Mass m₂"), "Mass of the right block").onChange(() => this.fire());
    tip(g.add(this.params, "v2", -5, 5, 0.1).name("Velocity v₂"), "Initial velocity of the right block").onChange(() => this.fire());
    tip(g.add(this.params, "restitution", 0, 1, 0.05).name("Elasticity e"), "1 = perfectly elastic (kinetic energy conserved), 0 = perfectly inelastic (blocks stick)").onChange(() => this.fire());
    tip(g.add(this.params, "time", 0, 5, 0.01).name("Time"), "Scrub through the collision").onChange(() => { this.params.play = false; this.update(); });
    tip(g.add(this.params, "play").name("Play"), "Animate the collision").onChange(() => this.update());
  }

  private fire(): void {
    this.params.time = 0;
    this.params.play = false;

    const { m1, v1, m2, v2, restitution } = this.params;
    this.sim.v1i = v1;
    this.sim.v2i = v2;

    if (restitution === 0) {
      // Perfectly inelastic: common final velocity from momentum conservation.
      const vf = (m1 * v1 + m2 * v2) / (m1 + m2);
      this.sim.v1f = vf;
      this.sim.v2f = vf;
    } else {
      [this.sim.v1f, this.sim.v2f] = collide1D(m1, v1, m2, v2, restitution);
    }

    // Start positions so collision happens at x = 0 at t = 1.
    this.sim.collisionTime = 1;
    this.sim.x1Collision = -v1 * this.sim.collisionTime;
    this.sim.x2Collision = -v2 * this.sim.collisionTime;

    this.update();
  }

  private update(): void {
    const { m1, m2, time, restitution } = this.params;
    const { v1i, v2i, v1f, v2f, collisionTime, x1Collision, x2Collision } = this.sim;

    let x1: number;
    let x2: number;
    let curV1: number;
    let curV2: number;

    if (time <= collisionTime) {
      x1 = x1Collision + v1i * time;
      x2 = x2Collision + v2i * time;
      curV1 = v1i;
      curV2 = v2i;
    } else {
      const dt = time - collisionTime;
      x1 = v1f * dt;
      x2 = v2f * dt;
      curV1 = v1f;
      curV2 = v2f;
    }

    // Clamp within track for visuals.
    x1 = THREE.MathUtils.clamp(x1, -7.5, 7.5);
    x2 = THREE.MathUtils.clamp(x2, -7.5, 7.5);

    const s1 = 0.6 + m1 * 0.15;
    const s2 = 0.6 + m2 * 0.15;
    this.block1.scale.set(s1, s1, s1);
    this.block2.scale.set(s2, s2, s2);

    this.block1.position.set(x1, 0.5, 0);
    this.block2.position.set(x2, 0.5, 0);

    this.label1.position.set(x1, 1.3, 0.1);
    this.label2.position.set(x2, 1.3, 0.1);

    updateArrow(this.arrow1, new THREE.Vector3(x1, 1.8, 0), new THREE.Vector3(x1 + curV1 * 0.4, 1.8, 0));
    updateArrow(this.arrow2, new THREE.Vector3(x2, 1.8, 0), new THREE.Vector3(x2 + curV2 * 0.4, 1.8, 0));

    const momentumBefore = m1 * v1i + m2 * v2i;
    const momentumAfter = m1 * v1f + m2 * v2f;
    const keBefore = 0.5 * m1 * v1i * v1i + 0.5 * m2 * v2i * v2i;
    const keAfter = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;

    this.setInfo(`
      <h2>Collisions</h2>
      <p>Two blocks collide on a frictionless track. Total momentum is always conserved; kinetic energy is conserved only in an elastic collision.</p>
      <div class="formula" data-derivation="collision-outcomes">
        <div class="formula-label">Momentum plus restitution</div>
        <div class="formula-body">m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂&nbsp;&nbsp;·&nbsp;&nbsp;v₂ − v₁ = e(u₁ − u₂)</div>
      </div>
      <div class="readout">
        <div><span style="color:#ff7b72">m₁</span> = ${m1.toFixed(1)} kg, v₁ = ${v1i.toFixed(2)} m/s &rarr; ${v1f.toFixed(2)} m/s</div>
        <div><span style="color:#79c0ff">m₂</span> = ${m2.toFixed(1)} kg, v₂ = ${v2i.toFixed(2)} m/s &rarr; ${v2f.toFixed(2)} m/s</div>
        <div>Restitution e = ${restitution.toFixed(2)}</div>
        <div>Total momentum: ${momentumBefore.toFixed(2)} &rarr; ${momentumAfter.toFixed(2)} kg·m/s</div>
        <div>Kinetic energy: ${keBefore.toFixed(2)} &rarr; ${keAfter.toFixed(2)} J</div>
      </div>
      <p>${restitution === 1 ? "Elastic: kinetic energy is conserved." : restitution === 0 ? "Perfectly inelastic: the blocks stick together." : "Inelastic: some kinetic energy is lost."}</p>
      <p class="example"><b>Try it:</b> set m₁ = m₂, v₂ = 0 and e = 1. The first block stops and the second moves off at the first block's original speed.</p>
    `);
  }
}
