import * as THREE from "three";
import type GUI from "lil-gui";
import type { Controller } from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { solveProjectile, sampleTrajectory } from "../math/physics";
import { arrow2D, marker, textSprite, updateArrow, tip } from "./helpers";
import "./formulaDerivations/physics";

const COLORS = {
  trajectory: 0x79c0ff,
  velocity: 0xffa657,
  horizontal: 0x79c0ff,
  vertical: 0xff7b72,
  gravity: 0xd2a8ff,
  projectile: 0xffffff,
  ground: 0x3fb950,
  apex: 0xffd166,
};

const GRAVITY_PRESETS = {
  Earth: 9.81,
  Moon: 1.62,
  Mars: 3.72,
  Jupiter: 24.79,
  Sun: 274,
  Custom: 9.81,
};

interface ProjectileChapter {
  title: string;
  explanation: string;
  action: string;
  preset: {
    speed: number;
    angle: number;
    gravityPreset: keyof typeof GRAVITY_PRESETS;
    launchHeight: number;
    time: "start" | "middle" | "apex" | "landing";
  };
  check: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

const CHAPTERS: ProjectileChapter[] = [
  {
    title: "Split the launch vector",
    explanation: "One launch velocity does two jobs. <code>vₓ = v·cosθ</code> controls sideways motion; <code>vᵧ = v·sinθ</code> controls the initial climb. Gravity only changes the vertical part.",
    action: "Look at the blue horizontal and red vertical component arrows. Change the angle and watch speed move between them.",
    preset: { speed: 12, angle: 35, gravityPreset: "Earth", launchHeight: 0, time: "start" },
    check: {
      question: "Which expression gives the initial horizontal velocity?",
      options: ["v·cosθ", "v·sinθ", "g·t"],
      correct: 0,
      explanation: "The horizontal side is adjacent to θ, so vₓ = v·cosθ. The vertical side is vᵧ = v·sinθ.",
    },
  },
  {
    title: "Two motions, one path",
    explanation: "Treat the flight as two independent stories sharing the same clock: <code>x = vₓt</code> at constant speed, while <code>y = h₀ + vᵧt − ½gt²</code> accelerates downward.",
    action: "The blue ghost dots are equally spaced in time. Their horizontal gaps stay equal while their vertical gaps change.",
    preset: { speed: 12, angle: 55, gravityPreset: "Earth", launchHeight: 0, time: "middle" },
    check: {
      question: "Ignoring air resistance, what is the horizontal acceleration?",
      options: ["0 m/s²", "9.81 m/s²", "It depends on angle"],
      correct: 0,
      explanation: "There is no horizontal force in this model, so vₓ stays constant and horizontal acceleration is zero.",
    },
  },
  {
    title: "Understand the apex",
    explanation: "At the highest point, the projectile has not stopped. Only its vertical velocity is momentarily zero; its horizontal velocity is still carrying it forward.",
    action: "The gold marker is the apex. Notice the orange velocity arrow is horizontal there.",
    preset: { speed: 14, angle: 55, gravityPreset: "Earth", launchHeight: 0, time: "apex" },
    check: {
      question: "At the apex, which statement is true?",
      options: ["v = 0", "vᵧ = 0 but vₓ remains", "Gravity becomes zero"],
      correct: 1,
      explanation: "Gravity still acts and vₓ remains constant. Only the upward component vᵧ has fallen to zero.",
    },
  },
  {
    title: "Landing and range",
    explanation: "Flight ends when the vertical equation returns to ground level. Put that flight time into <code>x = vₓt</code> to get the horizontal range.",
    action: "The green landing marker shows the range. Use the time slider to move from launch to landing.",
    preset: { speed: 14, angle: 40, gravityPreset: "Earth", launchHeight: 0, time: "landing" },
    check: {
      question: "On level ground, which pair has the same range at the same speed?",
      options: ["30° and 60°", "30° and 45°", "45° and 60°"],
      correct: 0,
      explanation: "Complementary angles have the same sin(2θ), so 30° and 60° have equal range but different heights and flight times.",
    },
  },
  {
    title: "Why 45° wins",
    explanation: "On level ground with no air resistance, range is <code>v²·sin(2θ)/g</code>. It is largest when <code>sin(2θ) = 1</code>, so <code>2θ = 90°</code> and θ = 45°.",
    action: "Compare 30°, 45° and 60°. The 30° and 60° shots land together; 45° travels furthest.",
    preset: { speed: 15, angle: 45, gravityPreset: "Earth", launchHeight: 0, time: "middle" },
    check: {
      question: "When is the 45° maximum-range rule valid?",
      options: ["Always", "Same launch/landing height with no air resistance", "Only on the Moon"],
      correct: 1,
      explanation: "Launch height, landing height, drag, wind and terrain can all shift the best angle away from 45°.",
    },
  },
  {
    title: "Change the world",
    explanation: "Gravity bends the path. Lower gravity gives the vertical velocity more time to fall to zero, so the projectile stays airborne longer and travels farther.",
    action: "This preset uses the Moon. Switch between Earth, Moon and Jupiter and watch the camera reframe the real-sized trajectory.",
    preset: { speed: 15, angle: 45, gravityPreset: "Moon", launchHeight: 2, time: "middle" },
    check: {
      question: "What does stronger gravity do, all else equal?",
      options: ["Longer flight and range", "Shorter flight and range", "No change to the path"],
      correct: 1,
      explanation: "Stronger downward acceleration removes upward velocity faster, reducing flight time, height and range.",
    },
  },
];

/**
 * Lesson: Projectile Motion.
 *
 * Launch a projectile with adjustable speed, angle and gravity. The parabolic
 * trajectory is drawn, and a velocity vector is shown at the current time.
 */
export class ProjectileMotionLesson implements Lesson {
  readonly id = "projectile-motion";
  readonly title = "Projectile Motion";
  readonly blurb = "Throw things with vectors and gravity";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["vectors", "kinematics"] as const;

  private group = new THREE.Group();
  private viewport!: LessonContext["viewport"];
  private ground!: THREE.Line;
  private grid!: THREE.GridHelper;
  private trajectory!: THREE.Line;
  private velocityArrow!: THREE.Group;
  private launchArrow!: THREE.Group;
  private horizontalArrow!: THREE.Group;
  private verticalArrow!: THREE.Group;
  private gravityArrow!: THREE.Group;
  private projectile!: THREE.Mesh;
  private apexMarker!: THREE.Mesh;
  private landingMarker!: THREE.Mesh;
  private apexLabel!: THREE.Sprite;
  private landingLabel!: THREE.Sprite;
  private gravityLabel!: THREE.Sprite;
  private apexLabelBaseScale = new THREE.Vector3();
  private landingLabelBaseScale = new THREE.Vector3();
  private gravityLabelBaseScale = new THREE.Vector3();
  private ghostDots: THREE.Mesh[] = [];
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private timeCtrl!: Controller;
  private gravityCtrl!: Controller;
  private gravityPresetCtrl!: Controller;
  private stopTick?: () => void;
  private chapterIndex = 0;
  private lastTrajectorySignature = "";

  private params = {
    speed: 12,
    angle: 35,
    gravityPreset: "Earth" as keyof typeof GRAVITY_PRESETS,
    gravity: 9.81,
    mass: 1,
    launchDuration: 0.2,
    launchHeight: 0,
    time: 0,
    play: false,
    showVelocity: true,
    showComponents: true,
    showGravity: true,
    showGhosts: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(8, 4, 14),
      new THREE.Vector3(8, 2, 0),
    );

    this.buildScene();
    this.buildControls();
    this.update();

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (this.params.play) {
        const { flightTime } = solveProjectile(this.currentParams());
        this.params.time = Math.min(this.params.time + dt, flightTime);
        if (this.params.time >= flightTime) this.params.time = 0;
        this.update(false);
      }
    });
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.disposeGroup(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.ghostDots = [];
  }

  private currentParams() {
    return {
      speed: this.params.speed,
      angleDeg: this.params.angle,
      gravity: this.params.gravity,
      launchHeight: this.params.launchHeight,
    };
  }

  private buildScene(): void {
    // Ground line.
    this.ground = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2, 0, 0), new THREE.Vector3(30, 0, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.ground }),
    );
    this.group.add(this.ground);

    // Grid.
    this.grid = new THREE.GridHelper(30, 30, 0x30363d, 0x21262d);
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.set(13, -0.05, 0);
    this.group.add(this.grid);

    this.trajectory = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: COLORS.trajectory, linewidth: 2 }),
    );
    this.group.add(this.trajectory);

    this.velocityArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), COLORS.velocity);
    this.launchArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), COLORS.velocity);
    this.horizontalArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), COLORS.horizontal);
    this.verticalArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), COLORS.vertical);
    this.gravityArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, -1), COLORS.gravity);
    this.group.add(this.velocityArrow, this.launchArrow, this.horizontalArrow, this.verticalArrow, this.gravityArrow);

    this.projectile = marker(COLORS.projectile, 0.18);
    this.group.add(this.projectile);

    this.apexMarker = marker(COLORS.apex, 0.13);
    this.landingMarker = marker(COLORS.ground, 0.13);
    this.group.add(this.apexMarker, this.landingMarker);

    this.apexLabel = textSprite("apex: vᵧ = 0", COLORS.apex, 0.34);
    this.landingLabel = textSprite("landing / range", COLORS.ground, 0.34);
    this.gravityLabel = textSprite("Fᵧ = −mg", COLORS.gravity, 0.3);
    this.apexLabelBaseScale.copy(this.apexLabel.scale);
    this.landingLabelBaseScale.copy(this.landingLabel.scale);
    this.gravityLabelBaseScale.copy(this.gravityLabel.scale);
    this.group.add(this.apexLabel, this.landingLabel, this.gravityLabel);

    for (let i = 0; i < 12; i++) {
      const dot = marker(COLORS.trajectory, 0.06);
      dot.visible = false;
      this.ghostDots.push(dot);
      this.group.add(dot);
    }
  }

  private buildControls(): void {
    const g = this.gui;
    const launch = g.addFolder("Launch setup");
    tip(launch.add(this.params, "speed", 1, 25, 0.5).name("Speed (m/s)"), "Magnitude of the initial velocity").onChange(() => this.update());
    tip(launch.add(this.params, "angle", 0, 90, 0.5).name("Angle (degrees)"), "Angle above the horizontal").onChange(() => this.update());
    tip(launch.add(this.params, "launchHeight", 0, 10, 0.1).name("Height (m)"), "Launch point above the landing ground").onChange(() => this.update());
    tip(launch.add(this.params, "launchDuration", 0.02, 2, 0.01).name("Push time (s)"), "Estimated time the hand, bat or launcher applies force before release").onChange(() => this.update());
    launch.open();

    const environment = g.addFolder("Environment");
    this.gravityPresetCtrl = tip(environment.add(this.params, "gravityPreset", Object.keys(GRAVITY_PRESETS)).name("World"), "Choose a gravity preset").onChange((v: keyof typeof GRAVITY_PRESETS) => {
      this.params.gravity = GRAVITY_PRESETS[v];
      this.gravityCtrl.updateDisplay();
      this.update();
    });
    this.gravityCtrl = tip(environment.add(this.params, "gravity", 0.1, 300, 0.1).name("g (m/s²)"), "Custom downward acceleration; Sun gravity is 274 m/s²").onChange(() => {
      this.params.gravityPreset = "Custom";
      this.gravityPresetCtrl.updateDisplay();
      this.update();
    });
    tip(environment.add(this.params, "mass", 0.1, 10, 0.1).name("Mass (kg)"), "Mass changes the weight force mg, but not the trajectory when air resistance is ignored").onChange(() => this.update());
    environment.close();

    const playback = g.addFolder("Playback");
    this.timeCtrl = tip(playback.add(this.params, "time", 0, 5, 0.01).name("Time (s)"), "Scrub from launch to landing").onChange(() => this.update());
    tip(playback.add(this.params, "play").name("Play flight"), "Animate the projectile").onChange(() => this.update());
    playback.open();

    const show = g.addFolder("Show / hide");
    tip(show.add(this.params, "showVelocity").name("Velocity vector"), "Show the velocity vector at the current time").onChange(() => this.update());
    tip(show.add(this.params, "showComponents").name("Launch components"), "Split launch velocity into horizontal and vertical parts").onChange(() => this.update());
    tip(show.add(this.params, "showGravity").name("Gravity arrow"), "Show the constant downward acceleration direction").onChange(() => this.update());
    tip(show.add(this.params, "showGhosts").name("Ghost positions"), "Show evenly-spaced positions during the flight").onChange(() => this.update());
    show.close();
  }

  private update(renderPanel = true): void {
    const p = this.currentParams();
    const solved = solveProjectile(p);
    const pts = sampleTrajectory(p, 100);
    const theta = (p.angleDeg * Math.PI) / 180;
    const vx = p.speed * Math.cos(theta);
    const vy = p.speed * Math.sin(theta);
    const g = Math.abs(p.gravity);
    const apexTime = vy / g;
    const apexX = vx * apexTime;

    this.timeCtrl.max(Math.max(0.01, solved.flightTime));
    this.params.time = Math.min(this.params.time, solved.flightTime);
    this.timeCtrl.updateDisplay();

    const signature = `${p.speed}|${p.angleDeg}|${p.gravity}|${p.launchHeight}`;
    if (signature !== this.lastTrajectorySignature) {
      this.lastTrajectorySignature = signature;
      this.frameTrajectory(solved);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(
      pts.map((pt) => new THREE.Vector3(pt.x, Math.max(0, pt.y), 0)),
    );
    this.trajectory.geometry.dispose();
    this.trajectory.geometry = geo;

    // Ghost dots at equal time intervals.
    const ghostCount = this.params.showGhosts ? Math.min(12, pts.length) : 0;
    for (let i = 0; i < this.ghostDots.length; i++) {
      const dot = this.ghostDots[i];
      if (i >= ghostCount) {
        dot.visible = false;
        continue;
      }
      const idx = Math.floor(((pts.length - 1) * (i + 1)) / (ghostCount + 1));
      const pt = pts[idx];
      dot.position.set(pt.x, Math.max(0, pt.y), 0.05);
      dot.visible = true;
    }

    const curX = vx * this.params.time;
    const curY = Math.max(0, p.launchHeight + vy * this.params.time - 0.5 * g * this.params.time * this.params.time);
    const curVy = vy - g * this.params.time;
    const extent = Math.max(10, solved.range, solved.maxHeight * 2);
    const vectorScale = extent / Math.max(p.speed * 6, 1);
    const launch = new THREE.Vector3(0, p.launchHeight, 0);
    const componentTip = new THREE.Vector3(vx * vectorScale, p.launchHeight, 0);
    const launchTip = new THREE.Vector3(vx * vectorScale, p.launchHeight + vy * vectorScale, 0);

    this.projectile.position.set(curX, curY, 0.1);

    this.velocityArrow.visible = this.params.showVelocity;
    if (this.params.showVelocity) {
      updateArrow(
        this.velocityArrow,
        new THREE.Vector3(curX, curY, 0),
        new THREE.Vector3(curX + vx * vectorScale, curY + curVy * vectorScale, 0),
      );
    }

    this.launchArrow.visible = this.params.showComponents;
    this.horizontalArrow.visible = this.params.showComponents;
    this.verticalArrow.visible = this.params.showComponents;
    if (this.params.showComponents) {
      updateArrow(this.launchArrow, launch, launchTip);
      updateArrow(this.horizontalArrow, launch, componentTip);
      updateArrow(this.verticalArrow, componentTip, launchTip);
    }

    this.gravityArrow.visible = this.params.showGravity;
    this.gravityLabel.visible = this.params.showGravity;
    if (this.params.showGravity) {
      updateArrow(
        this.gravityArrow,
        new THREE.Vector3(curX, curY, 0),
        new THREE.Vector3(curX, curY - extent * 0.12, 0),
      );
      const gravityLabelScale = Math.max(1, extent / 18);
      this.gravityLabel.scale.copy(this.gravityLabelBaseScale).multiplyScalar(gravityLabelScale);
      this.gravityLabel.position.set(curX + extent * 0.035, curY - extent * 0.07, 0.1);
    }

    const markerScale = Math.max(1, extent / 25);
    this.apexMarker.position.set(apexX, solved.maxHeight, 0.08);
    this.apexMarker.scale.setScalar(markerScale);
    this.landingMarker.position.set(solved.range, 0, 0.08);
    this.landingMarker.scale.setScalar(markerScale);
    const labelScale = Math.max(1, extent / 15);
    this.apexLabel.scale.copy(this.apexLabelBaseScale).multiplyScalar(labelScale);
    this.landingLabel.scale.copy(this.landingLabelBaseScale).multiplyScalar(labelScale);
    this.apexLabel.position.set(apexX, solved.maxHeight + extent * 0.045, 0.1);
    this.landingLabel.position.set(solved.range, extent * 0.035, 0.1);

    const phase = this.flightPhase(curVy, solved.flightTime);
    if (renderPanel) {
      this.setInfo(this.lessonHtml(solved, vx, vy, curVy, phase));
      this.bindCourseControls();
    } else {
      const phaseValue = document.getElementById("projectile-live-phase");
      if (phaseValue) phaseValue.textContent = phase;
      const resultant = document.getElementById("projectile-live-resultant");
      if (resultant) resultant.innerHTML = this.resultantHtml(vx, curVy);
      const readout = document.getElementById("projectile-live-readout");
      if (readout) readout.innerHTML = this.metricsHtml(solved);
    }
  }

  private frameTrajectory(solved: ReturnType<typeof solveProjectile>): void {
    const width = Math.max(10, solved.range);
    const height = Math.max(4, solved.maxHeight);
    const gridSize = Math.max(20, width * 1.2, height * 4);
    this.grid.position.set(solved.range / 2, -0.05, 0);
    this.grid.scale.setScalar(gridSize / 30);
    this.ground.geometry.dispose();
    this.ground.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width * 0.06, 0, 0),
      new THREE.Vector3(solved.range + width * 0.08, 0, 0),
    ]);

    const distance = Math.max(12, width * 1.38, height * 2.7);
    const target = new THREE.Vector3(solved.range / 2, height * 0.45, 0);
    this.viewport.frameCamera(
      new THREE.Vector3(target.x, target.y, distance),
      target,
    );
  }

  private flightPhase(curVy: number, flightTime: number): string {
    const tolerance = Math.max(0.03, flightTime * 0.02);
    if (this.params.time <= tolerance) return "launch";
    if (this.params.time >= flightTime - tolerance) return "landed";
    if (Math.abs(curVy) <= Math.max(0.08, this.params.gravity * tolerance)) return "apex";
    return curVy > 0 ? "rising" : "falling";
  }

  private lessonHtml(
    solved: ReturnType<typeof solveProjectile>,
    vx: number,
    vy: number,
    curVy: number,
    phase: string,
  ): string {
    const chapter = CHAPTERS[this.chapterIndex];
    const progress = ((this.chapterIndex + 1) / CHAPTERS.length) * 100;
    const weight = this.params.mass * this.params.gravity;
    const impulse = this.params.mass * this.params.speed;
    const averageNetForce = impulse / this.params.launchDuration;
    const launchForceX = this.params.mass * vx / this.params.launchDuration;
    const launchForceY = this.params.mass * vy / this.params.launchDuration + weight;
    const launchForce = Math.hypot(launchForceX, launchForceY);
    return `
      <h2>Projectile Motion</h2>
      <p class="projectile-lead">A projectile is not one complicated curved motion. It is
      <b>constant horizontal motion</b> plus <b>accelerated vertical motion</b>, running at the same time.</p>
      <div class="projectile-launch-model">
        <h3>Before release — where the initial velocity comes from</h3>
        <p>The flight simulation begins at <code>t = 0</code>, immediately after the projectile
        leaves the hand, bat or launcher. It does not simulate that contact. Assuming the
        projectile starts from rest, the launcher must deliver an impulse:</p>
        <div><span>Momentum change</span><code>J = Δp = m·v₀ = ${impulse.toFixed(2)} N·s</code></div>
        <div><span>Average net force</span><code>F̄<sub>net</sub> = J/Δt = ${averageNetForce.toFixed(2)} N</code></div>
        <div><span>Launcher force x</span><code>F̄<sub>launch,x</sub> = m·vₓ/Δt = ${launchForceX.toFixed(2)} N</code></div>
        <div><span>Launcher force y</span><code>F̄<sub>launch,y</sub> = m·vᵧ/Δt + mg = ${launchForceY.toFixed(2)} N</code></div>
        <div><span>Launcher magnitude</span><code>|F̄<sub>launch</sub>| ≈ ${launchForce.toFixed(2)} N over ${this.params.launchDuration.toFixed(2)} s</code></div>
        <p class="formula-note">This is an average-force estimate. A real throw or impact has a
        changing force curve; its total area over time is the same impulse <code>J</code>.</p>
        ${derivationButton("launch-impulse")}
      </div>
      <div class="projectile-axis-model">
        <section>
          <h3>Horizontal x — no force after release</h3>
          <div><span>Force</span><code>Fₓ = 0 N</code></div>
          <div><span>Acceleration</span><code>aₓ = Fₓ/m = 0</code></div>
          <div><span>Speed</span><code>vₓ(t) = v₀cosθ = ${vx.toFixed(2)} m/s</code></div>
          <div><span>Position</span><code>x(t) = vₓt = ${vx.toFixed(2)}t</code></div>
        </section>
        <section>
          <h3>Vertical y — gravity</h3>
          <div><span>Force</span><code>Fᵧ = −mg = −${weight.toFixed(2)} N</code></div>
          <div><span>Acceleration</span><code>aᵧ = Fᵧ/m = −g = −${this.params.gravity.toFixed(2)} m/s²</code></div>
          <div><span>Speed</span><code>vᵧ(t) = v₀sinθ − gt = ${vy.toFixed(2)} − ${this.params.gravity.toFixed(2)}t</code></div>
          <div><span>Position</span><code>y(t) = h₀ + v₀sinθ·t − ½gt²</code></div>
        </section>
        ${derivationButton("projectile-motion-equations")}
      </div>
      <p class="projectile-inertia-note"><b>Moving does not require a continuing force.</b>
      The hand, bat or launcher supplies force <i>before release</i> and gives the projectile
      its initial velocity. Once it is airborne, zero horizontal force means
      <code>aₓ = 0</code>, so <code>vₓ</code> stays constant—not that <code>vₓ = 0</code>.
      With air resistance included, drag would provide a backward horizontal force and slow it down.</p>
      <div class="projectile-resultant" id="projectile-live-resultant">${this.resultantHtml(vx, curVy)}</div>
      <p class="projectile-mass-note"><b>Why mass does not change the path:</b>
      <code>Fᵧ = −mg</code> and <code>F = ma</code>, so <code>maᵧ = −mg</code>.
      The mass cancels, leaving <code>aᵧ = −g</code>.</p>
      <div class="course projectile-path">
        <h3>Launch-to-landing course</h3>
        <div class="glsl-chips">
          ${CHAPTERS.map((entry, index) => `<button class="glsl-chip ${index === this.chapterIndex ? "active" : ""}" data-projectile-chapter="${index}" aria-pressed="${index === this.chapterIndex}">${index + 1}. ${entry.title}</button>`).join("")}
        </div>
      </div>
      <div class="projectile-progress">
        <div><b>${this.chapterIndex + 1}. ${chapter.title}</b><span>${this.chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="projectile-progress-track"><i style="width:${progress}%"></i></div>
      </div>
      <div class="projectile-mental-model">
        <p><b>Big idea:</b> ${chapter.explanation}</p>
        <p><b>Do this:</b> ${chapter.action}</p>
        ${this.chapterIndex === 4 ? derivationButton("level-ground-range") : ""}
      </div>
      <div class="projectile-phase"><span>Current phase</span><b id="projectile-live-phase">${phase}</b></div>
      <div class="readout projectile-readout" id="projectile-live-readout">${this.metricsHtml(solved)}</div>
      ${this.quickCheckHtml(chapter)}
      <div class="course-nav projectile-nav">
        <button class="course-btn ghost" data-projectile-nav="previous" ${this.chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${this.chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-projectile-nav="next" ${this.chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `;
  }

  private resultantHtml(vx: number, vy: number): string {
    const speed = Math.hypot(vx, vy);
    const direction = Math.atan2(vy, vx) * 180 / Math.PI;
    return `
      <span>Velocity now</span>
      <b>v = (${vx.toFixed(2)}, ${vy.toFixed(2)}) m/s</b>
      <code>|v| = √(vₓ² + vᵧ²) = ${speed.toFixed(2)} m/s · direction ${direction.toFixed(1)}°</code>
      ${derivationButton("resultant-speed")}`;
  }

  private metricsHtml(solved: ReturnType<typeof solveProjectile>): string {
    const weight = this.params.mass * this.params.gravity;
    return `
      <div><span>Time now</span><b>${this.params.time.toFixed(2)} s</b></div>
      <div><span>Flight time</span><b>${solved.flightTime.toFixed(2)} s</b></div>
      <div><span>Range</span><b>${solved.range.toFixed(2)} m</b></div>
      <div><span>Maximum height</span><b>${solved.maxHeight.toFixed(2)} m</b></div>
      <div><span>Weight force</span><b>${weight.toFixed(2)} N downward</b></div>`;
  }

  private quickCheckHtml(chapter: ProjectileChapter): string {
    return `
      <div class="course projectile-check">
        <h3>Predict before changing the sliders</h3>
        <p>${chapter.check.question}</p>
        <div class="projectile-check-options">
          ${chapter.check.options.map((option, index) => `<button class="glsl-chip" data-projectile-answer="${index}" aria-pressed="false">${option}</button>`).join("")}
        </div>
        <div id="projectile-check-feedback" class="projectile-check-feedback" aria-live="polite">
          Choose an answer, then connect the explanation back to the arrows.
        </div>
      </div>`;
  }

  private bindCourseControls(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-projectile-chapter]").forEach((button) => {
      button.addEventListener("click", () => this.selectChapter(Number(button.dataset.projectileChapter)));
    });
    document.querySelectorAll<HTMLButtonElement>("[data-projectile-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.projectileNav === "previous" ? -1 : 1;
        this.selectChapter(this.chapterIndex + delta);
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-projectile-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const check = CHAPTERS[this.chapterIndex].check;
        const selected = Number(button.dataset.projectileAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-projectile-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("projectile-check-feedback");
        if (feedback) {
          feedback.className = `projectile-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Try the picture again."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(index: number): void {
    if (index < 0 || index >= CHAPTERS.length) return;
    this.chapterIndex = index;
    const preset = CHAPTERS[index].preset;
    this.params.speed = preset.speed;
    this.params.angle = preset.angle;
    this.params.gravityPreset = preset.gravityPreset;
    this.params.gravity = GRAVITY_PRESETS[preset.gravityPreset];
    this.params.launchHeight = preset.launchHeight;
    this.params.play = false;
    const solved = solveProjectile(this.currentParams());
    const vy = solved.vy;
    this.params.time = preset.time === "start"
      ? 0
      : preset.time === "middle"
        ? solved.flightTime / 2
        : preset.time === "apex"
          ? vy / this.params.gravity
          : solved.flightTime;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.update();
    document.querySelector(".projectile-progress")?.scrollIntoView({ block: "nearest" });
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
