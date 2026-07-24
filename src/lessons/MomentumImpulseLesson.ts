import * as THREE from "three";
import type GUI from "lil-gui";
import type { Controller } from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import {
  forcePulseState,
  impulse,
  momentum,
  recoilVelocities,
} from "../math/momentum";
import { arrow2D, textSprite, updateArrow, tip } from "./helpers";
import "./formulaDerivations/physics";

type Mode = "single" | "pair";
type TimePreset = "start" | "during" | "end" | "after";

const COLORS = {
  cartA: 0x79c0ff,
  cartB: 0xff7b72,
  force: 0xff7b72,
  velocity: 0x7ee787,
  momentum: 0xd2a8ff,
  impulse: 0xffa657,
  comparison: 0x58a6ff,
  track: 0x3fb950,
};

interface MomentumChapter {
  title: string;
  explanation: string;
  action: string;
  mode: Mode;
  preset: {
    mass: number;
    initialVelocity: number;
    force: number;
    duration: number;
    massB: number;
    time: TimePreset;
  };
  check: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

const CHAPTERS: MomentumChapter[] = [
  {
    title: "Momentum = mass × velocity",
    explanation: "Momentum measures how difficult moving mass is to stop or redirect. Double the mass or double the velocity and you double <code>p = mv</code>. Its direction is the velocity direction.",
    action: "Change mass and initial velocity. Watch the purple momentum arrow respond to both.",
    mode: "single",
    preset: { mass: 2, initialVelocity: 3, force: 0, duration: 1, massB: 4, time: "start" },
    check: {
      question: "What is the momentum of a 3 kg cart moving at 4 m/s?",
      options: ["7 kg·m/s", "12 kg·m/s", "12 N"],
      correct: 1,
      explanation: "p = mv = 3 × 4 = 12 kg·m/s. Momentum is not a force, so its unit is not newtons.",
    },
  },
  {
    title: "Impulse changes momentum",
    explanation: "A force acting for time accumulates an impulse. Newton’s second law can be written <code>J = FΔt = Δp</code>: the impulse is exactly the change in momentum.",
    action: "Scrub through the orange force pulse. Momentum rises by the same amount as the shaded force–time area.",
    mode: "single",
    preset: { mass: 2, initialVelocity: 0, force: 8, duration: 1, massB: 4, time: "end" },
    check: {
      question: "What impulse does 8 N applied for 1.5 s deliver?",
      options: ["5.33 N·s", "9.5 N·s", "12 N·s"],
      correct: 2,
      explanation: "J = FΔt = 8 × 1.5 = 12 N·s, which is also a 12 kg·m/s change in momentum.",
    },
  },
  {
    title: "Same impulse, different push",
    explanation: "A large force for a short time can produce the same momentum change as a small force for a long time. Equal rectangle areas on a force–time graph mean equal impulse.",
    action: "Compare the orange 12 N × 0.5 s pulse with the blue 3 N × 2 s pulse. Both areas are 6 N·s.",
    mode: "single",
    preset: { mass: 2, initialVelocity: 0, force: 12, duration: 0.5, massB: 4, time: "end" },
    check: {
      question: "Which gives the same impulse as 12 N for 0.5 s?",
      options: ["3 N for 2 s", "6 N for 0.5 s", "12 N for 2 s"],
      correct: 0,
      explanation: "Both give 6 N·s. Force and time trade against each other when their product stays constant.",
    },
  },
  {
    title: "Area under F–t",
    explanation: "For a changing force, impulse is the area under the force–time graph: <code>J = ∫F(t)dt</code>. The constant-force rectangle is the simplest case, with area <code>FΔt</code>.",
    action: "Change force and duration. The rectangle’s signed area and the cart’s momentum change together.",
    mode: "single",
    preset: { mass: 1.5, initialVelocity: 1, force: 6, duration: 1.5, massB: 4, time: "during" },
    check: {
      question: "On a force–time graph, what does area below the time axis represent?",
      options: ["Negative impulse", "Zero impulse", "Positive acceleration only"],
      correct: 0,
      explanation: "A negative force gives negative signed area, so it reduces or reverses momentum in the chosen positive direction.",
    },
  },
  {
    title: "Stopping safely",
    explanation: "Stopping means applying an impulse equal and opposite to the initial momentum. Increasing the stopping time reduces the average force: <code>F̄ = Δp/Δt</code>. That is why airbags and crumple zones help.",
    action: "The 2 kg cart starts at 8 m/s, so p = 16 kg·m/s. A −8 N force for 2 s supplies −16 N·s and stops it.",
    mode: "single",
    preset: { mass: 2, initialVelocity: 8, force: -8, duration: 2, massB: 4, time: "end" },
    check: {
      question: "For the same stopping impulse, what does doubling stopping time do to average force?",
      options: ["Doubles it", "Halves it", "Does not change it"],
      correct: 1,
      explanation: "F̄ = Δp/Δt. With the same Δp spread over twice the time, average force is halved.",
    },
  },
  {
    title: "Conservation and recoil",
    explanation: "Internal forces come in equal-and-opposite pairs. Each cart receives the opposite impulse, so their momentum changes cancel and total momentum stays constant when no external impulse acts.",
    action: "Two carts push apart. The lighter cart moves faster, but both carry equal-and-opposite momentum.",
    mode: "pair",
    preset: { mass: 2, initialVelocity: 0, force: 8, duration: 1, massB: 4, time: "after" },
    check: {
      question: "Two stationary carts push apart in isolation. What is their total momentum afterward?",
      options: ["Zero", "The heavier cart’s momentum", "The applied force"],
      correct: 0,
      explanation: "Their momenta are equal and opposite. Internal forces redistribute momentum but cannot change the isolated system’s total.",
    },
  },
];

export class MomentumImpulseLesson implements Lesson {
  readonly id = "momentum-impulse";
  readonly title = "Momentum & Impulse";
  readonly blurb = "How pushes accumulate into motion";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["newtons-laws"] as const;

  private group = new THREE.Group();
  private cartA!: THREE.Mesh;
  private cartB!: THREE.Mesh;
  private forceArrow!: THREE.Group;
  private pairForceArrow!: THREE.Group;
  private velocityArrow!: THREE.Group;
  private velocityArrowB!: THREE.Group;
  private momentumArrow!: THREE.Group;
  private momentumArrowB!: THREE.Group;
  private labelA!: THREE.Sprite;
  private labelB!: THREE.Sprite;
  private pulseFill!: THREE.Mesh;
  private comparisonFill!: THREE.Mesh;
  private pulseLabel!: THREE.Sprite;
  private comparisonLabel!: THREE.Sprite;
  private gui!: GUI;
  private setInfo!: (html: string) => void;
  private timeCtrl!: Controller;
  private pairFolder!: GUI;
  private stopTick?: () => void;
  private chapterIndex = 0;

  private params = {
    mass: 2,
    initialVelocity: 3,
    force: 0,
    duration: 1,
    massB: 4,
    time: 0,
    play: false,
  };

  enter(ctx: LessonContext): void {
    this.gui = ctx.gui;
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1, 13),
      new THREE.Vector3(0, -0.3, 0),
    );

    this.buildScene();
    this.buildControls();
    this.selectChapter(0);

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (!this.params.play) return;
      const end = this.params.duration + 2;
      this.params.time += dt;
      if (this.params.time > end) this.params.time = 0;
      this.update(false);
    });
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.disposeGroup(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    const track = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-7, 1.4, 0),
        new THREE.Vector3(7, 1.4, 0),
      ]),
      new THREE.LineBasicMaterial({ color: COLORS.track }),
    );
    this.group.add(track);

    this.cartA = this.cart(COLORS.cartA);
    this.cartB = this.cart(COLORS.cartB);
    this.group.add(this.cartA, this.cartB);

    this.forceArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.force);
    this.pairForceArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(-1, 0), COLORS.force);
    this.velocityArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.velocity);
    this.velocityArrowB = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.velocity);
    this.momentumArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.momentum);
    this.momentumArrowB = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.momentum);
    this.group.add(this.forceArrow, this.pairForceArrow, this.velocityArrow, this.velocityArrowB, this.momentumArrow, this.momentumArrowB);

    this.labelA = textSprite("cart A", COLORS.cartA, 0.42);
    this.labelB = textSprite("cart B", COLORS.cartB, 0.42);
    this.group.add(this.labelA, this.labelB);

    const graphAxes = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-5.5, -3, 0),
        new THREE.Vector3(5.5, -3, 0),
        new THREE.Vector3(-5, -4.2, 0),
        new THREE.Vector3(-5, -0.4, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    this.group.add(graphAxes);
    const timeLabel = textSprite("time Δt", 0x8b949e, 0.34);
    timeLabel.position.set(4.8, -3.35, 0.1);
    const forceLabel = textSprite("force F", 0x8b949e, 0.34);
    forceLabel.position.set(-4.6, -0.7, 0.1);
    this.group.add(timeLabel, forceLabel);

    this.pulseFill = this.graphRectangle(COLORS.impulse, 0.55);
    this.comparisonFill = this.graphRectangle(COLORS.comparison, 0.32);
    this.group.add(this.pulseFill, this.comparisonFill);

    this.pulseLabel = textSprite("J = area = FΔt", COLORS.impulse, 0.34);
    this.comparisonLabel = textSprite("same area", COLORS.comparison, 0.32);
    this.group.add(this.pulseLabel, this.comparisonLabel);
  }

  private cart(color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.85, 0.8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
    );
  }

  private graphRectangle(color: number, opacity: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }),
    );
  }

  private buildControls(): void {
    const cart = this.gui.addFolder("Cart A");
    tip(cart.add(this.params, "mass", 0.5, 8, 0.1).name("Mass (kg)"), "Momentum depends on mass: p = mv").onChange(() => this.update());
    tip(cart.add(this.params, "initialVelocity", -10, 10, 0.1).name("Initial v (m/s)"), "Velocity before the force pulse").onChange(() => this.update());
    cart.open();

    const pulse = this.gui.addFolder("Force pulse");
    tip(pulse.add(this.params, "force", -20, 20, 0.5).name("Force F (N)"), "Signed force during the pulse").onChange(() => this.update());
    tip(pulse.add(this.params, "duration", 0.1, 2.5, 0.1).name("Duration Δt (s)"), "How long the force acts").onChange(() => this.update());
    pulse.open();

    this.pairFolder = this.gui.addFolder("Conservation pair");
    tip(this.pairFolder.add(this.params, "massB", 0.5, 8, 0.1).name("Cart B mass"), "The second cart receives the opposite impulse").onChange(() => this.update());
    this.pairFolder.close();

    const playback = this.gui.addFolder("Playback");
    this.timeCtrl = tip(playback.add(this.params, "time", 0, 3, 0.01).name("Time (s)"), "Scrub through force application and coasting").onChange(() => {
      this.params.play = false;
      this.update();
    });
    tip(playback.add(this.params, "play").name("Play"), "Animate the force pulse and resulting motion").onChange(() => this.update());
    playback.open();
  }

  private update(renderPanel = true): void {
    const chapter = CHAPTERS[this.chapterIndex];
    const pulse = {
      mass: this.params.mass,
      initialVelocity: this.params.initialVelocity,
      force: this.params.force,
      duration: this.params.duration,
    };
    const state = forcePulseState(pulse, this.params.time);
    const totalImpulse = impulse(this.params.force, this.params.duration);
    const initialMomentum = momentum(this.params.mass, this.params.initialVelocity);
    const finalMomentum = initialMomentum + totalImpulse;
    const endTime = this.params.duration + 2;
    this.timeCtrl.max(endTime);
    this.params.time = Math.min(this.params.time, endTime);
    this.timeCtrl.updateDisplay();

    this.updateGraph(totalImpulse);
    if (chapter.mode === "pair") this.updatePair();
    else this.updateSingle(state);

    if (renderPanel) {
      this.setInfo(this.lessonHtml(state, initialMomentum, totalImpulse, finalMomentum));
      this.bindCourseControls();
    } else {
      const live = document.getElementById("momentum-live-readout");
      if (live) live.innerHTML = this.readoutHtml(state, initialMomentum, finalMomentum);
    }
  }

  private updateSingle(state: ReturnType<typeof forcePulseState>): void {
    this.cartB.visible = false;
    this.labelB.visible = false;
    this.momentumArrowB.visible = false;
    this.velocityArrowB.visible = false;
    this.pairForceArrow.visible = false;

    const x = THREE.MathUtils.clamp(-4 + state.position * 0.32, -6.4, 6.4);
    const scale = 0.7 + this.params.mass * 0.08;
    this.cartA.scale.set(scale, scale, scale);
    this.cartA.position.set(x, 1.4 + 0.42 * scale, 0);
    this.labelA.position.set(x, 2.35, 0.1);

    const forceY = 3.3;
    this.forceArrow.visible = Math.abs(state.force) > 1e-8;
    if (this.forceArrow.visible) {
      updateArrow(
        this.forceArrow,
        new THREE.Vector3(x, forceY, 0),
        new THREE.Vector3(x + state.force * 0.09, forceY, 0),
      );
    }
    updateArrow(
      this.velocityArrow,
      new THREE.Vector3(x, 2.85, 0),
      new THREE.Vector3(x + state.velocity * 0.25, 2.85, 0),
    );
    updateArrow(
      this.momentumArrow,
      new THREE.Vector3(x, 2.45, 0),
      new THREE.Vector3(x + state.momentum * 0.1, 2.45, 0),
    );
  }

  private updatePair(): void {
    const applied = Math.abs(this.params.force);
    const stateA = forcePulseState({
      mass: this.params.mass,
      initialVelocity: 0,
      force: -applied,
      duration: this.params.duration,
    }, this.params.time);
    const stateB = forcePulseState({
      mass: this.params.massB,
      initialVelocity: 0,
      force: applied,
      duration: this.params.duration,
    }, this.params.time);

    this.cartB.visible = true;
    this.labelB.visible = true;
    this.momentumArrowB.visible = true;
    this.velocityArrowB.visible = true;
    const xA = THREE.MathUtils.clamp(-1.2 + stateA.position * 0.28, -6.2, 6.2);
    const xB = THREE.MathUtils.clamp(1.2 + stateB.position * 0.28, -6.2, 6.2);
    const scaleA = 0.7 + this.params.mass * 0.08;
    const scaleB = 0.7 + this.params.massB * 0.08;
    this.cartA.scale.set(scaleA, scaleA, scaleA);
    this.cartB.scale.set(scaleB, scaleB, scaleB);
    this.cartA.position.set(xA, 1.4 + 0.42 * scaleA, 0);
    this.cartB.position.set(xB, 1.4 + 0.42 * scaleB, 0);
    this.labelA.position.set(xA, 2.35, 0.1);
    this.labelB.position.set(xB, 2.35, 0.1);

    this.forceArrow.visible = this.params.time <= this.params.duration;
    this.pairForceArrow.visible = this.forceArrow.visible;
    if (this.forceArrow.visible) {
      updateArrow(
        this.forceArrow,
        new THREE.Vector3(xB, 3.2, 0),
        new THREE.Vector3(xB + applied * 0.09, 3.2, 0),
      );
      updateArrow(
        this.pairForceArrow,
        new THREE.Vector3(xA, 3.2, 0),
        new THREE.Vector3(xA - applied * 0.09, 3.2, 0),
      );
    }
    updateArrow(
      this.velocityArrow,
      new THREE.Vector3(xA, 2.85, 0),
      new THREE.Vector3(xA + stateA.velocity * 0.3, 2.85, 0),
    );
    updateArrow(
      this.velocityArrowB,
      new THREE.Vector3(xB, 2.85, 0),
      new THREE.Vector3(xB + stateB.velocity * 0.3, 2.85, 0),
    );
    updateArrow(
      this.momentumArrow,
      new THREE.Vector3(xA, 2.45, 0),
      new THREE.Vector3(xA + stateA.momentum * 0.1, 2.45, 0),
    );
    updateArrow(
      this.momentumArrowB,
      new THREE.Vector3(xB, 2.45, 0),
      new THREE.Vector3(xB + stateB.momentum * 0.1, 2.45, 0),
    );
  }

  private updateGraph(totalImpulse: number): void {
    const originX = -5;
    const axisY = -3;
    const timeScale = 2;
    const forceScale = 0.12;
    const width = Math.max(0.04, this.params.duration * timeScale);
    const height = Math.max(0.04, Math.abs(this.params.force) * forceScale);
    this.pulseFill.scale.set(width, height, 1);
    this.pulseFill.position.set(
      originX + width / 2,
      axisY + Math.sign(this.params.force || 1) * height / 2,
      0,
    );
    this.pulseLabel.position.set(originX + width / 2, axisY + Math.sign(this.params.force || 1) * (height + 0.38), 0.1);

    const compare = this.chapterIndex === 2;
    this.comparisonFill.visible = compare;
    this.comparisonLabel.visible = compare;
    if (compare) {
      const compareDuration = 2;
      const compareForce = totalImpulse / compareDuration;
      const compareWidth = compareDuration * timeScale;
      const compareHeight = Math.abs(compareForce) * forceScale;
      this.comparisonFill.scale.set(compareWidth, compareHeight, 1);
      this.comparisonFill.position.set(
        originX + compareWidth / 2,
        axisY + compareHeight / 2,
        -0.02,
      );
      this.comparisonLabel.position.set(originX + compareWidth - 0.4, axisY + compareHeight + 0.3, 0.1);
    }
  }

  private lessonHtml(
    state: ReturnType<typeof forcePulseState>,
    initialMomentum: number,
    totalImpulse: number,
    finalMomentum: number,
  ): string {
    const chapter = CHAPTERS[this.chapterIndex];
    const progress = ((this.chapterIndex + 1) / CHAPTERS.length) * 100;
    return `
      <h2>Momentum &amp; Impulse</h2>
      <p class="momentum-lead">Momentum describes motion; impulse describes how a force changes it.
      They meet in one equation: <b>J = Δp</b>.</p>
      <div class="momentum-core">
        <div><span>Momentum</span><b>p = mv</b><code>kg·m/s</code>${derivationButton("momentum-definition")}</div>
        <div><span>Impulse</span><b>J = FΔt</b><code>N·s = kg·m/s</code>${derivationButton("impulse-momentum")}</div>
        <div><span>Link</span><b>J = Δp</b><code>F̄ = Δp/Δt</code>${derivationButton("average-force")}</div>
      </div>
      <div class="course momentum-path">
        <h3>Build the idea step by step</h3>
        <div class="glsl-chips">
          ${CHAPTERS.map((entry, index) => `<button class="glsl-chip ${index === this.chapterIndex ? "active" : ""}" data-momentum-chapter="${index}" aria-pressed="${index === this.chapterIndex}">${index + 1}. ${entry.title}</button>`).join("")}
        </div>
      </div>
      <div class="momentum-progress">
        <div><b>${this.chapterIndex + 1}. ${chapter.title}</b><span>${this.chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="momentum-progress-track"><i style="width:${progress}%"></i></div>
      </div>
      <div class="momentum-mental-model">
        <p><b>Big idea:</b> ${chapter.explanation}</p>
        <p><b>Do this:</b> ${chapter.action}</p>
      </div>
      <div class="readout momentum-readout" id="momentum-live-readout">${this.readoutHtml(state, initialMomentum, finalMomentum)}</div>
      <div class="momentum-force-area">
        <b>Force–time area</b>
        <code>J = FΔt = ${this.params.force.toFixed(2)} × ${this.params.duration.toFixed(2)} = ${totalImpulse.toFixed(2)} N·s</code>
        <span>${totalImpulse.toFixed(2)} N·s is the same quantity as ${totalImpulse.toFixed(2)} kg·m/s of momentum change.</span>
      </div>
      ${this.chapterExtra()}
      ${this.quickCheckHtml(chapter)}
      <div class="course-nav momentum-nav">
        <button class="course-btn ghost" data-momentum-nav="previous" ${this.chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${this.chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-momentum-nav="next" ${this.chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `;
  }

  private readoutHtml(
    state: ReturnType<typeof forcePulseState>,
    initialMomentum: number,
    finalMomentum: number,
  ): string {
    const chapter = CHAPTERS[this.chapterIndex];
    const pairImpulse = Math.abs(this.params.force) * Math.min(this.params.time, this.params.duration);
    const [vA, vB] = recoilVelocities(this.params.mass, this.params.massB, pairImpulse);
    const pA = momentum(this.params.mass, vA);
    const pB = momentum(this.params.massB, vB);
    return chapter.mode === "pair"
      ? `
        <div><span>Impulse on A / B</span><b>${(-pairImpulse).toFixed(2)} / +${pairImpulse.toFixed(2)} N·s</b></div>
        <div><span>Momentum pA / pB</span><b>${pA.toFixed(2)} / +${pB.toFixed(2)} kg·m/s</b></div>
        <div><span>Velocity vA / vB</span><b>${vA.toFixed(2)} / +${vB.toFixed(2)} m/s</b></div>
        <div><span>Total momentum</span><b>${(pA + pB).toFixed(2)} kg·m/s</b></div>`
      : `
        <div><span>Initial momentum p₀</span><b>${initialMomentum.toFixed(2)} kg·m/s</b></div>
        <div><span>Impulse so far J</span><b>${state.impulse.toFixed(2)} N·s</b></div>
        <div><span>Momentum now</span><b>${state.momentum.toFixed(2)} kg·m/s</b></div>
        <div><span>Final p = p₀ + J</span><b>${finalMomentum.toFixed(2)} kg·m/s</b></div>
        <div><span>Velocity now</span><b>${state.velocity.toFixed(2)} m/s</b></div>`;
  }

  private chapterExtra(): string {
    if (this.chapterIndex === 2) {
      return `
        <div class="momentum-comparison">
          <div><b>Hard tap</b><code>12 N × 0.5 s = 6 N·s</code></div>
          <div><b>Gentle push</b><code>3 N × 2 s = 6 N·s</code></div>
          <p>Same impulse → same change in momentum. The shape differs; the area matches.</p>
        </div>`;
    }
    if (this.chapterIndex === 4) {
      return `
        <div class="momentum-comparison">
          <div><b>Hard stop</b><code>−32 N × 0.5 s = −16 N·s</code></div>
          <div><b>Cushioned stop</b><code>−8 N × 2 s = −16 N·s</code></div>
          <p>Both stop the cart, but the longer stop needs one quarter of the force.</p>
        </div>`;
    }
    return "";
  }

  private quickCheckHtml(chapter: MomentumChapter): string {
    return `
      <div class="course momentum-check">
        <h3>Check the idea</h3>
        <p>${chapter.check.question}</p>
        <div class="momentum-check-options">
          ${chapter.check.options.map((option, index) => `<button class="glsl-chip" data-momentum-answer="${index}" aria-pressed="false">${option}</button>`).join("")}
        </div>
        <div id="momentum-check-feedback" class="momentum-check-feedback" aria-live="polite">
          Choose an answer, then connect it to the arrows and graph.
        </div>
      </div>`;
  }

  private bindCourseControls(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-momentum-chapter]").forEach((button) => {
      button.addEventListener("click", () => this.selectChapter(Number(button.dataset.momentumChapter)));
    });
    document.querySelectorAll<HTMLButtonElement>("[data-momentum-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.momentumNav === "previous" ? -1 : 1;
        this.selectChapter(this.chapterIndex + delta);
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-momentum-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const check = CHAPTERS[this.chapterIndex].check;
        const selected = Number(button.dataset.momentumAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-momentum-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("momentum-check-feedback");
        if (feedback) {
          feedback.className = `momentum-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(index: number): void {
    if (index < 0 || index >= CHAPTERS.length) return;
    this.chapterIndex = index;
    const chapter = CHAPTERS[index];
    this.params.mass = chapter.preset.mass;
    this.params.initialVelocity = chapter.preset.initialVelocity;
    this.params.force = chapter.preset.force;
    this.params.duration = chapter.preset.duration;
    this.params.massB = chapter.preset.massB;
    this.params.play = false;
    this.params.time = chapter.preset.time === "start"
      ? 0
      : chapter.preset.time === "during"
        ? chapter.preset.duration / 2
        : chapter.preset.time === "end"
          ? chapter.preset.duration
          : chapter.preset.duration + 1;
    const pairMode = chapter.mode === "pair";
    this.pairFolder.controllers.forEach((controller) => controller.enable(pairMode));
    if (pairMode) this.pairFolder.open();
    else this.pairFolder.close();
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.update();
    document.querySelector(".momentum-progress")?.scrollIntoView({ block: "nearest" });
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeMaterial = (entry: THREE.Material): void => {
        const map = (entry as THREE.Material & { map?: THREE.Texture | null }).map;
        map?.dispose();
        entry.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeMaterial);
      else if (material) disposeMaterial(material);
    });
    group.clear();
  }
}
