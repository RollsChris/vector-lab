import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { arrow2D, textSprite, updateArrow, tip } from "./helpers";
import "./formulaDerivations/physics";

const G = 9.81;

const COLORS = {
  applied: 0xff7b72,
  friction: 0xffa657,
  net: 0xd2a8ff,
  velocity: 0x7ee787,
  acceleration: 0x79c0ff,
  normal: 0x58a6ff,
  weight: 0xf0883e,
  block: 0x539bf5,
  pusher: 0xffd166,
};

interface LawChapter {
  title: string;
  explanation: string;
  action: string;
  preset: {
    force: number;
    angle: number;
    mass: number;
    friction: number;
    initialVelocity: number;
    running: boolean;
  };
  check: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

const CHAPTERS: LawChapter[] = [
  {
    title: "First law — inertia",
    explanation: "Zero net force means zero acceleration, not zero velocity. An object at rest stays at rest; a moving object keeps the same velocity unless a net force changes it.",
    action: "The cart starts moving with F = 0 and μ = 0. Watch it keep the same speed as it crosses the track.",
    preset: { force: 0, angle: 0, mass: 2, friction: 0, initialVelocity: 3, running: true },
    check: {
      question: "A cart moves right with zero net force. What happens?",
      options: ["It stops", "It keeps constant velocity", "It accelerates right"],
      correct: 1,
      explanation: "ΣF = 0 gives a = 0, so velocity does not change. Motion itself does not require a continuing force.",
    },
  },
  {
    title: "Second law — F = ma",
    explanation: "Net force controls acceleration: <code>ΣF = ma</code>. More net force produces more acceleration; reversing the net force reverses the acceleration.",
    action: "With no friction, the 8 N applied force is the net force. For 2 kg, a = 8/2 = 4 m/s².",
    preset: { force: 8, angle: 0, mass: 2, friction: 0, initialVelocity: 0, running: true },
    check: {
      question: "What acceleration does 10 N give a 2 kg mass?",
      options: ["5 m/s²", "12 m/s²", "20 m/s²"],
      correct: 0,
      explanation: "a = Fnet/m = 10/2 = 5 m/s².",
    },
  },
  {
    title: "Mass resists acceleration",
    explanation: "Mass measures inertia. With the same force, a larger mass changes velocity more slowly because <code>a = F/m</code>.",
    action: "Keep F fixed and move the mass slider between 2 kg and 4 kg. Doubling mass halves acceleration.",
    preset: { force: 8, angle: 0, mass: 4, friction: 0, initialVelocity: 0, running: true },
    check: {
      question: "If force stays fixed and mass doubles, acceleration becomes…",
      options: ["Twice as large", "Half as large", "Unchanged"],
      correct: 1,
      explanation: "Acceleration is inversely proportional to mass: a = F/m.",
    },
  },
  {
    title: "Net force and friction",
    explanation: "Individual forces combine into a net force. Friction opposes attempted or actual sliding, so horizontally <code>Fnet = Fapplied + Ffriction</code>.",
    action: "The force is angled 30° upward. Use cosine for its horizontal part and sine for its vertical part; the upward part also reduces the normal force and therefore friction.",
    preset: { force: 8, angle: 30, mass: 2, friction: 0.2, initialVelocity: 0, running: true },
    check: {
      question: "Applied force is +8 N and friction is −3 N. What is the net force?",
      options: ["+11 N", "+5 N", "−5 N"],
      correct: 1,
      explanation: "Forces are signed vectors: Fnet = +8 + (−3) = +5 N.",
    },
  },
  {
    title: "Third law — force pairs",
    explanation: "Every interaction produces two equal-and-opposite forces on different objects. The pusher acts on the cart; the cart acts back on the pusher.",
    action: "The two red arrows are equal and opposite. They do not cancel because one acts on the cart and the other on the pusher.",
    preset: { force: 8, angle: 0, mass: 2, friction: 0, initialVelocity: 0, running: false },
    check: {
      question: "Why do a third-law pair not cancel the cart’s force?",
      options: ["They have different sizes", "They act at different times", "They act on different objects"],
      correct: 2,
      explanation: "Only forces acting on the same object are added in that object’s free-body diagram.",
    },
  },
  {
    title: "Force becomes impulse",
    explanation: "Newton’s second law also says force is the rate of momentum change: <code>Fnet = Δp/Δt</code>. Over time, the accumulated impulse is <code>J = ∫Fdt = Δp</code>.",
    action: "Run the cart, then continue into Momentum & Impulse to see force–time area become momentum change.",
    preset: { force: 6, angle: 0, mass: 2, friction: 0, initialVelocity: 1, running: true },
    check: {
      question: "What does a constant net force change directly over time?",
      options: ["Momentum", "Mass", "Gravity"],
      correct: 0,
      explanation: "Fnet = Δp/Δt, so impulse accumulates as a change in momentum.",
    },
  },
];

interface HorizontalForces {
  appliedMagnitude: number;
  appliedX: number;
  appliedY: number;
  friction: number;
  netX: number;
  normal: number;
  weight: number;
  frictionLimit: number;
  frictionState: "none" | "static" | "kinetic";
  onTrack: boolean;
}

export class NewtonsLawsLesson implements Lesson {
  readonly id = "newtons-laws";
  readonly title = "Newton's Laws";
  readonly blurb = "Inertia, net force and action–reaction";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["kinematics"] as const;

  private group = new THREE.Group();
  private block!: THREE.Mesh;
  private pusher!: THREE.Mesh;
  private arrows: Record<string, THREE.Group> = {};
  private labels: Record<string, THREE.Sprite> = {};
  private gui!: GUI;
  private setInfo!: (html: string) => void;
  private stopTick?: () => void;
  private chapterIndex = 0;

  private x = 0;
  private v = 3;
  private a = 0;

  private params = {
    mass: 2,
    force: 0,
    angle: 0,
    friction: 0,
    initialVelocity: 3,
    running: true,
    reset: () => this.reset(),
  };

  enter(ctx: LessonContext): void {
    this.gui = ctx.gui;
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.5, 13),
      new THREE.Vector3(0, 1.2, 0),
    );

    this.buildScene();
    this.buildControls();
    this.selectChapter(0);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.disposeGroup(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.18, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x30363d, roughness: 0.8 }),
    );
    track.position.set(0, -0.09, 0);
    this.group.add(track);

    this.block = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 0.9),
      new THREE.MeshStandardMaterial({ color: COLORS.block, roughness: 0.55 }),
    );
    this.group.add(this.block);

    this.pusher = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.85, 0.7),
      new THREE.MeshStandardMaterial({ color: COLORS.pusher, roughness: 0.65 }),
    );
    this.pusher.visible = false;
    this.group.add(this.pusher);

    this.arrows.applied = arrow2D(new THREE.Vector2(), new THREE.Vector2(1, 0), COLORS.applied);
    this.arrows.appliedX = arrow2D(new THREE.Vector2(), new THREE.Vector2(1, 0), COLORS.applied);
    this.arrows.appliedY = arrow2D(new THREE.Vector2(), new THREE.Vector2(0, 1), COLORS.applied);
    this.arrows.reaction = arrow2D(new THREE.Vector2(), new THREE.Vector2(-1, 0), COLORS.applied);
    this.arrows.friction = arrow2D(new THREE.Vector2(), new THREE.Vector2(-1, 0), COLORS.friction);
    this.arrows.net = arrow2D(new THREE.Vector2(), new THREE.Vector2(1, 0), COLORS.net);
    this.arrows.velocity = arrow2D(new THREE.Vector2(), new THREE.Vector2(1, 0), COLORS.velocity);
    this.arrows.acceleration = arrow2D(new THREE.Vector2(), new THREE.Vector2(1, 0), COLORS.acceleration);
    this.arrows.normal = arrow2D(new THREE.Vector2(), new THREE.Vector2(0, 1), COLORS.normal);
    this.arrows.weight = arrow2D(new THREE.Vector2(), new THREE.Vector2(0, -1), COLORS.weight);
    Object.values(this.arrows).forEach((arrow) => this.group.add(arrow));

    const labelSpecs: Array<[string, string, number]> = [
      ["applied", "F applied", COLORS.applied],
      ["appliedX", "F cos θ", COLORS.applied],
      ["appliedY", "F sin θ", COLORS.applied],
      ["reaction", "reaction", COLORS.applied],
      ["friction", "friction", COLORS.friction],
      ["net", "F net", COLORS.net],
      ["velocity", "v", COLORS.velocity],
      ["acceleration", "a", COLORS.acceleration],
      ["normal", "N", COLORS.normal],
      ["weight", "W = mg", COLORS.weight],
    ];
    for (const [key, text, color] of labelSpecs) {
      this.labels[key] = textSprite(text, color, 0.3);
      this.labels[key].visible = false;
      this.group.add(this.labels[key]);
    }
  }

  private buildControls(): void {
    const forces = this.gui.addFolder("Applied force vector");
    tip(forces.add(this.params, "force", -25, 25, 0.5).name("Force F (N)"), "Magnitude along the arrow; negative reverses its direction").onChange(() => this.refresh());
    tip(forces.add(this.params, "angle", -60, 60, 1).name("Angle θ (°)"), "Measured from the horizontal: Fx = F cos θ and Fy = F sin θ").onChange(() => this.refresh());
    tip(forces.add(this.params, "friction", 0, 0.6, 0.01).name("Friction μ"), "Maximum friction is μN, where N is the normal force").onChange(() => this.refresh());
    forces.open();

    const motion = this.gui.addFolder("Mass and motion");
    tip(motion.add(this.params, "mass", 0.5, 8, 0.5).name("Mass (kg)"), "Mass measures inertia").onChange(() => this.refresh());
    tip(motion.add(this.params, "initialVelocity", -6, 6, 0.1).name("Reset velocity"), "Velocity restored by Reset").onChange(() => this.reset());
    tip(motion.add(this.params, "running").name("Run"), "Play or pause the simulation").onChange(() => this.refresh());
    tip(motion.add(this.params, "reset").name("Reset cart"), "Return to the centre with the reset velocity");
    motion.open();
  }

  private computeForces(): HorizontalForces {
    const angleRadians = THREE.MathUtils.degToRad(this.params.angle);
    const appliedMagnitude = this.params.force;
    const appliedX = appliedMagnitude * Math.cos(angleRadians);
    const appliedY = appliedMagnitude * Math.sin(angleRadians);
    const weight = this.params.mass * G;
    const normal = Math.max(0, weight - appliedY);
    const onTrack = normal > 1e-10 || appliedY <= weight;
    const frictionLimit = this.params.friction * normal;
    if (frictionLimit < 1e-10) {
      return {
        appliedMagnitude,
        appliedX,
        appliedY,
        friction: 0,
        netX: appliedX,
        normal,
        weight,
        frictionLimit,
        frictionState: "none",
        onTrack,
      };
    }

    if (Math.abs(this.v) < 0.02) {
      const friction = Math.abs(appliedX) <= frictionLimit
        ? -appliedX
        : -Math.sign(appliedX) * frictionLimit;
      return {
        appliedMagnitude,
        appliedX,
        appliedY,
        friction,
        netX: appliedX + friction,
        normal,
        weight,
        frictionLimit,
        frictionState: "static",
        onTrack,
      };
    }

    const friction = -Math.sign(this.v) * frictionLimit;
    return {
      appliedMagnitude,
      appliedX,
      appliedY,
      friction,
      netX: appliedX + friction,
      normal,
      weight,
      frictionLimit,
      frictionState: "kinetic",
      onTrack,
    };
  }

  private tick(dt: number): void {
    const step = Math.min(dt, 0.04);
    let forces = this.computeForces();
    this.a = forces.netX / this.params.mass;

    if (this.params.running) {
      const oldV = this.v;
      let nextV = oldV + this.a * step;
      if (
        Math.abs(oldV) >= 0.02 &&
        Math.sign(oldV) !== Math.sign(nextV) &&
        Math.abs(forces.appliedX) <= forces.frictionLimit
      ) {
        nextV = 0;
      }
      this.x += ((oldV + nextV) / 2) * step;
      this.v = nextV;
      if (this.x > 7.1) this.x = -7.1;
      else if (this.x < -7.1) this.x = 7.1;

      forces = this.computeForces();
      this.a = forces.netX / this.params.mass;
    }

    this.updateScene(forces);
    this.updateLivePanel(forces);
  }

  private reset(): void {
    this.x = 0;
    this.v = this.params.initialVelocity;
    const forces = this.computeForces();
    this.a = forces.netX / this.params.mass;
    this.updateScene(forces);
    this.updateLivePanel(forces);
  }

  private refresh(): void {
    const forces = this.computeForces();
    this.a = forces.netX / this.params.mass;
    this.updateScene(forces);
    this.updateLivePanel(forces);
  }

  private updateScene(forces: HorizontalForces): void {
    const scale = 0.82 + this.params.mass * 0.05;
    this.block.scale.set(scale, scale, scale);
    this.block.position.set(this.x, 0.5 * scale, 0);

    const thirdLaw = this.chapterIndex === 4;
    const showVertical = this.chapterIndex === 3 || thirdLaw;
    const pushSide = Math.sign(forces.appliedX || 1);
    this.pusher.visible = thirdLaw;
    this.pusher.position.set(this.x - pushSide * (0.9 * scale + 0.35), 0.42, 0);

    this.setAppliedForceArrows(forces);
    this.setSignedArrow("friction", forces.friction, 0.11, 2.35, this.x);
    this.setSignedArrow("net", forces.netX, 0.13, 1.95, this.x);
    this.setSignedArrow("velocity", this.v, 0.28, 1.55, this.x);
    this.setSignedArrow("acceleration", this.a, 0.3, 1.15, this.x);

    this.arrows.reaction.visible = thirdLaw && Math.abs(forces.appliedMagnitude) > 0.02;
    this.labels.reaction.visible = this.arrows.reaction.visible;
    if (this.arrows.reaction.visible) {
      const pusherX = this.pusher.position.x;
      const arrowScale = 0.11;
      updateArrow(
        this.arrows.reaction,
        new THREE.Vector3(pusherX, 1.25, 0),
        new THREE.Vector3(
          pusherX - forces.appliedX * arrowScale,
          1.25 - forces.appliedY * arrowScale,
          0,
        ),
      );
      this.labels.reaction.position.set(
        pusherX - forces.appliedX * arrowScale * 0.5,
        1.52 - forces.appliedY * arrowScale * 0.5,
        0.1,
      );
    }

    this.arrows.normal.visible = showVertical && forces.normal >= 0.04;
    this.arrows.weight.visible = showVertical;
    this.labels.normal.visible = this.arrows.normal.visible;
    this.labels.weight.visible = showVertical;
    if (showVertical) {
      const forceDiagramZ = 0.65;
      const normalLength = Math.min(2.2, forces.normal * 0.055);
      const weightLength = Math.min(2.2, forces.weight * 0.055);
      if (this.arrows.normal.visible) {
        updateArrow(
          this.arrows.normal,
          new THREE.Vector3(this.x - 0.22, 0.55, forceDiagramZ),
          new THREE.Vector3(this.x - 0.22, 0.55 + normalLength, forceDiagramZ),
        );
      }
      updateArrow(
        this.arrows.weight,
        new THREE.Vector3(this.x + 0.22, 0.55, forceDiagramZ),
        new THREE.Vector3(this.x + 0.22, 0.55 - weightLength, forceDiagramZ),
      );
      this.labels.normal.position.set(this.x - 0.55, 0.8 + normalLength, 0.75);
      this.labels.weight.position.set(this.x + 0.75, 0.3 - weightLength, 0.75);
    }
  }

  private setAppliedForceArrows(forces: HorizontalForces): void {
    const origin = new THREE.Vector3(this.x, 2.75, 0);
    const scale = 0.14;
    const xTip = new THREE.Vector3(origin.x + forces.appliedX * scale, origin.y, 0);
    const tip = new THREE.Vector3(xTip.x, origin.y + forces.appliedY * scale, 0);
    const showForce = Math.abs(forces.appliedMagnitude) >= 0.04;
    const showComponents = showForce && Math.abs(this.params.angle) >= 1;

    this.arrows.applied.visible = showForce;
    this.labels.applied.visible = showForce;
    this.arrows.appliedX.visible = showComponents;
    this.labels.appliedX.visible = showComponents;
    this.arrows.appliedY.visible = showComponents && Math.abs(forces.appliedY) >= 0.04;
    this.labels.appliedY.visible = this.arrows.appliedY.visible;
    if (!showForce) return;

    updateArrow(this.arrows.applied, origin, tip);
    this.labels.applied.position.set(
      (origin.x + tip.x) / 2,
      (origin.y + tip.y) / 2 + 0.34,
      0.1,
    );
    if (!showComponents) return;

    updateArrow(this.arrows.appliedX, origin, xTip);
    this.labels.appliedX.position.set((origin.x + xTip.x) / 2, origin.y - 0.28, 0.1);
    if (this.arrows.appliedY.visible) {
      updateArrow(this.arrows.appliedY, xTip, tip);
      this.labels.appliedY.position.set(xTip.x + Math.sign(forces.appliedX || 1) * 0.55, (xTip.y + tip.y) / 2, 0.1);
    }
  }

  private setSignedArrow(
    key: string,
    value: number,
    scale: number,
    y: number,
    x: number,
  ): void {
    const arrow = this.arrows[key];
    const label = this.labels[key];
    const length = Math.min(3.5, Math.abs(value) * scale);
    arrow.visible = length >= 0.04;
    label.visible = arrow.visible;
    if (!arrow.visible) return;
    const signedLength = Math.sign(value) * length;
    updateArrow(
      arrow,
      new THREE.Vector3(x, y, 0),
      new THREE.Vector3(x + signedLength, y, 0),
    );
    label.position.set(x + signedLength / 2, y + 0.27, 0.1);
  }

  private renderPanel(): void {
    const chapter = CHAPTERS[this.chapterIndex];
    const progress = ((this.chapterIndex + 1) / CHAPTERS.length) * 100;
    this.setInfo(`
      <h2>Newton's Laws of Motion</h2>
      <p class="newton-lead">Newton’s laws answer three different questions: what happens with
      no net force, how net force changes motion, and how interactions create force pairs.</p>
      <div class="newton-core">
        <div><span>First law</span><b>ΣF = 0 → a = 0</b><code>velocity stays constant</code></div>
        <div><span>Second law</span><b>ΣF = ma</b><code>a = Fnet/m</code>${derivationButton("newton-acceleration")}</div>
        <div><span>Third law</span><b>F<sub>A→B</sub> = −F<sub>B→A</sub></b><code>different objects</code></div>
        <div><span>Velocity from acceleration</span><b>v(t) = v₀ + at</b><code>also written v = u + at</code>${derivationButton("newton-velocity")}</div>
      </div>
      <details class="newton-symbol-key" open>
        <summary>Symbol and units key</summary>
        <table>
          <thead><tr><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead>
          <tbody>
            <tr><td><code>F</code></td><td>Force; a push or pull</td><td>newton, <code>N</code></td></tr>
            <tr><td><code>ΣF</code> or <code>F<sub>net</sub></code></td><td>Vector sum of all forces on the chosen object; <code>Σ</code> means “add them all”</td><td><code>N</code></td></tr>
            <tr><td><code>Fₓ</code>, <code>Fᵧ</code></td><td>Horizontal and vertical components of a force; subscripts <code>x</code>/<code>y</code> name the direction</td><td><code>N</code></td></tr>
            <tr><td><code>m</code></td><td>Mass: how much inertia the object has</td><td>kilogram, <code>kg</code></td></tr>
            <tr><td><code>a</code>, <code>aₓ</code></td><td>Acceleration: rate at which velocity changes</td><td><code>m/s²</code></td></tr>
            <tr><td><code>v(t)</code></td><td>Velocity at time <code>t</code>; speed with direction</td><td><code>m/s</code></td></tr>
            <tr><td><code>v₀</code> or <code>u</code></td><td>Initial velocity at <code>t = 0</code></td><td><code>m/s</code></td></tr>
            <tr><td><code>t</code>, <code>Δt</code></td><td>Time, and a time interval</td><td>second, <code>s</code></td></tr>
            <tr><td><code>W</code></td><td>Weight: Earth’s gravitational force on the object, <code>W = mg</code></td><td><code>N</code></td></tr>
            <tr><td><code>g</code></td><td>Gravitational acceleration; about <code>9.81 m/s²</code> near Earth</td><td><code>m/s²</code></td></tr>
            <tr><td><code>N</code> beside an arrow</td><td>Normal force: the surface’s perpendicular push on the object</td><td><code>N</code></td></tr>
            <tr><td><code>f</code></td><td>Friction force, parallel to the contact surface</td><td><code>N</code></td></tr>
            <tr><td><code>μ</code></td><td>Coefficient of friction; compares friction with normal force</td><td>no unit</td></tr>
            <tr><td><code>θ</code></td><td>Angle measured from the horizontal in this lesson</td><td>degree, <code>°</code></td></tr>
            <tr><td><code>p</code>, <code>J</code></td><td>Momentum (<code>p = mv</code>) and impulse (<code>J = Δp</code>)</td><td><code>kg·m/s</code> or <code>N·s</code></td></tr>
            <tr><td><code>Δ</code></td><td>“Change in”: final value minus initial value</td><td>depends on the quantity</td></tr>
            <tr><td><code>A→B</code></td><td>“Force exerted by object A on object B”</td><td>—</td></tr>
          </tbody>
        </table>
        <p><b>Two meanings of N:</b> italic <code>N</code> used as a quantity means normal force; <code>N</code> written after a number is the unit newton.</p>
      </details>
      <div class="course newton-path">
        <h3>Build the laws step by step</h3>
        <div class="glsl-chips">
          ${CHAPTERS.map((entry, index) => `<button class="glsl-chip ${index === this.chapterIndex ? "active" : ""}" data-newton-chapter="${index}" aria-pressed="${index === this.chapterIndex}">${index + 1}. ${entry.title}</button>`).join("")}
        </div>
      </div>
      <div class="newton-progress">
        <div><b>${this.chapterIndex + 1}. ${chapter.title}</b><span>${this.chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="newton-progress-track"><i style="width:${progress}%"></i></div>
      </div>
      <div class="newton-mental-model">
        <p><b>Big idea:</b> ${chapter.explanation}</p>
        <p><b>Do this:</b> ${chapter.action}</p>
      </div>
      <div class="newton-trig-reference">
        <h3>Resolve an angled force with trigonometry</h3>
        <div class="newton-trig-layout">
          <svg viewBox="0 0 220 125" role="img" aria-label="Right triangle showing an applied force split into horizontal and vertical components">
            <defs>
              <marker id="newton-arrowhead" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill="#ff7b72"></path>
              </marker>
            </defs>
            <line x1="22" y1="102" x2="188" y2="102" stroke="#ffb3ad" stroke-width="3" marker-end="url(#newton-arrowhead)"></line>
            <line x1="188" y1="102" x2="188" y2="24" stroke="#ffb3ad" stroke-width="3" marker-end="url(#newton-arrowhead)"></line>
            <line x1="22" y1="102" x2="188" y2="24" stroke="#ff7b72" stroke-width="4" marker-end="url(#newton-arrowhead)"></line>
            <path d="M58 102 A36 36 0 0 0 54 86" fill="none" stroke="#d2a8ff" stroke-width="2"></path>
            <text x="65" y="94" fill="#d2a8ff">θ</text>
            <text x="91" y="119" fill="#ffb3ad">Fₓ = F cos θ</text>
            <text x="194" y="67" fill="#ffb3ad">Fᵧ</text>
            <text x="92" y="54" fill="#ff7b72">F</text>
          </svg>
          <div>
            <p><b>θ is measured from the horizontal.</b> The horizontal side is adjacent to θ, so use cosine. The vertical side is opposite θ, so use sine.</p>
            <div class="newton-sohcahtoa"><code>cos θ = adjacent / hypotenuse</code><code>sin θ = opposite / hypotenuse</code></div>
            <p>Therefore <code>Fₓ = F cos θ</code> and <code>Fᵧ = F sin θ</code>. A negative angle makes <code>Fᵧ</code> downward. If θ were measured from the vertical, sine and cosine would swap.</p>
            ${derivationButton("newton-force-components")}
          </div>
        </div>
      </div>
      <div class="newton-equations" id="newton-live-equations"></div>
      <div class="readout newton-readout" id="newton-live-readout"></div>
      <div class="newton-legend">
        <span style="color:#ff7b72">applied / reaction</span>
        <span style="color:#ffa657">friction</span>
        <span style="color:#d2a8ff">net force</span>
        <span style="color:#7ee787">velocity</span>
        <span style="color:#79c0ff">acceleration / normal</span>
      </div>
      <div class="newton-force-reference">
        <h3>What each arrow actually means</h3>
        <div class="newton-force-grid">
          <article><b style="color:#ff7b72">Applied force, F</b><p>An external contact force from a hand, rope, engine or pusher <em>on the cart</em>. At an angle it must be split into <code>Fₓ</code> and <code>Fᵧ</code>.</p></article>
          <article><b style="color:#f0883e">Weight, W = mg</b><p>Earth’s gravitational pull <em>on the cart</em>. It points vertically downward and equals mass × gravitational field strength.</p></article>
          <article><b style="color:#58a6ff">Normal force, N</b><p>The track’s push <em>on the cart</em>, perpendicular to the track. It is not always <code>mg</code>: an upward pull reduces it; a downward push increases it.</p></article>
          <article><b style="color:#ffa657">Friction, f</b><p>A surface force parallel to the track that opposes slipping or attempted slipping. Its limit is <code>|f| ≤ μN</code>, not automatically <code>μmg</code>.</p></article>
          <article><b style="color:#d2a8ff">Net force, ΣF</b><p>Not a new interaction. It is the vector total of all forces acting on the chosen object. Here <code>ΣFₓ = Fₓ + f</code>.</p></article>
          <article><b style="color:#ff7b72">Reaction force</b><p>The cart pushes back on the hand or pusher with equal magnitude and opposite direction. It acts on the <em>other object</em>, so it is not added to the cart’s forces.</p></article>
        </div>
        <p class="newton-force-note"><b>Important:</b> velocity and acceleration arrows describe motion; they are not forces. In the diagram, <code>N</code> beside an arrow means normal force, while <code>N</code> after a number is the unit newton.</p>
      </div>
      ${this.chapterExtra()}
      ${this.quickCheckHtml(chapter)}
      <div class="course-nav newton-nav">
        <button class="course-btn ghost" data-newton-nav="previous" ${this.chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${this.chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-newton-nav="next" ${this.chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `);
    this.bindCourseControls();
    this.refresh();
  }

  private updateLivePanel(forces: HorizontalForces): void {
    const equations = document.getElementById("newton-live-equations");
    if (equations) {
      const verticalNet = forces.normal + forces.appliedY - forces.weight;
      const contactExplanation = forces.onTrack
        ? `${forces.normal.toFixed(2)} + ${forces.appliedY.toFixed(2)} − ${forces.weight.toFixed(2)} = 0.00 N`
        : `0.00 + ${forces.appliedY.toFixed(2)} − ${forces.weight.toFixed(2)} = ${verticalNet.toFixed(2)} N → lift-off`;
      equations.innerHTML = `
        <div><span>Horizontal part</span><code>Fₓ = F cos θ = ${forces.appliedMagnitude.toFixed(2)} cos(${this.params.angle.toFixed(0)}°) = ${forces.appliedX.toFixed(2)} N</code></div>
        <div><span>Vertical part</span><code>Fᵧ = F sin θ = ${forces.appliedMagnitude.toFixed(2)} sin(${this.params.angle.toFixed(0)}°) = ${forces.appliedY.toFixed(2)} N</code></div>
        <div><span>Weight</span><code>W = mg = ${this.params.mass.toFixed(2)} × ${G.toFixed(2)} = ${forces.weight.toFixed(2)} N</code></div>
        <div><span>Normal force</span><code>N = mg − Fᵧ = max(0, ${forces.weight.toFixed(2)} − ${forces.appliedY.toFixed(2)}) = ${forces.normal.toFixed(2)} N</code></div>
        <div><span>Friction limit</span><code>μN = ${this.params.friction.toFixed(2)} × ${forces.normal.toFixed(2)} = ${forces.frictionLimit.toFixed(2)} N</code></div>
        <div><span>Horizontal sum</span><code>ΣFₓ = ${forces.appliedX.toFixed(2)} + (${forces.friction.toFixed(2)}) = ${forces.netX.toFixed(2)} N</code></div>
        <div><span>Acceleration</span><code>aₓ = ΣFₓ/m = ${forces.netX.toFixed(2)} N / ${this.params.mass.toFixed(2)} kg = ${this.a.toFixed(2)} N/kg = ${this.a.toFixed(2)} m/s²</code></div>
        <div><span>Unit check</span><code>1 N/kg = (1 kg·m/s²) / kg = 1 m/s²</code></div>
        <div><span>Velocity</span><code>v(t) = v₀ + aₓt = v₀ + (${this.a.toFixed(2)})t m/s &nbsp; (while aₓ is constant)</code></div>
        <div><span>Vertical sum</span><code>ΣFᵧ = N + Fᵧ − W = ${contactExplanation}</code></div>`;
    }
    const readout = document.getElementById("newton-live-readout");
    if (readout) {
      readout.innerHTML = `
        <div><span>Applied force</span><b>${forces.appliedMagnitude.toFixed(2)} N at ${this.params.angle.toFixed(0)}°</b></div>
        <div><span>Horizontal component Fₓ</span><b>${forces.appliedX.toFixed(2)} N</b></div>
        <div><span>Vertical component Fᵧ</span><b>${forces.appliedY.toFixed(2)} N</b></div>
        <div><span>Weight W</span><b>${forces.weight.toFixed(2)} N</b></div>
        <div><span>Normal force N</span><b>${forces.normal.toFixed(2)} N</b></div>
        <div><span>Friction (${forces.frictionState})</span><b>${forces.friction.toFixed(2)} N</b></div>
        <div><span>Horizontal net force</span><b>${forces.netX.toFixed(2)} N</b></div>
        <div><span>Mass</span><b>${this.params.mass.toFixed(2)} kg</b></div>
        <div><span>Acceleration</span><b>${this.a.toFixed(2)} m/s²</b></div>
        <div><span>Velocity</span><b>${this.v.toFixed(2)} m/s</b></div>`;
    }
  }

  private chapterExtra(): string {
    if (this.chapterIndex === 4) {
      return `
        <div class="newton-pair-card">
          <b>Do not put both arrows on one free-body diagram.</b>
          <div><code>F<sub>pusher→cart</sub> = +${Math.abs(this.params.force).toFixed(1)} N</code></div>
          <div><code>F<sub>cart→pusher</sub> = −${Math.abs(this.params.force).toFixed(1)} N</code></div>
          <p>Equal magnitude, opposite direction, different objects.</p>
        </div>`;
    }
    if (this.chapterIndex === 5) {
      return `
        <div class="newton-momentum-link">
          <b>Same law, accumulated over time</b>
          <code>F = ma = m·Δv/Δt = Δp/Δt</code>
          <p>Multiply by Δt: <code>FΔt = Δp</code>. That is the starting point of the
          <b>Momentum &amp; Impulse</b> lesson.</p>
          ${derivationButton("newton-impulse")}
        </div>`;
    }
    return "";
  }

  private quickCheckHtml(chapter: LawChapter): string {
    return `
      <div class="course newton-check">
        <h3>Check the law</h3>
        <p>${chapter.check.question}</p>
        <div class="newton-check-options">
          ${chapter.check.options.map((option, index) => `<button class="glsl-chip" data-newton-answer="${index}" aria-pressed="false">${option}</button>`).join("")}
        </div>
        <div id="newton-check-feedback" class="newton-check-feedback" aria-live="polite">
          Choose an answer, then connect it to the force arrows.
        </div>
      </div>`;
  }

  private bindCourseControls(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-newton-chapter]").forEach((button) => {
      button.addEventListener("click", () => this.selectChapter(Number(button.dataset.newtonChapter)));
    });
    document.querySelectorAll<HTMLButtonElement>("[data-newton-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.newtonNav === "previous" ? -1 : 1;
        this.selectChapter(this.chapterIndex + delta);
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-newton-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const check = CHAPTERS[this.chapterIndex].check;
        const selected = Number(button.dataset.newtonAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-newton-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("newton-check-feedback");
        if (feedback) {
          feedback.className = `newton-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(index: number): void {
    if (index < 0 || index >= CHAPTERS.length) return;
    this.chapterIndex = index;
    const preset = CHAPTERS[index].preset;
    this.params.force = preset.force;
    this.params.angle = preset.angle;
    this.params.mass = preset.mass;
    this.params.friction = preset.friction;
    this.params.initialVelocity = preset.initialVelocity;
    this.params.running = preset.running;
    this.x = 0;
    this.v = preset.initialVelocity;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.renderPanel();
    document.querySelector(".newton-progress")?.scrollIntoView({ block: "nearest" });
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
