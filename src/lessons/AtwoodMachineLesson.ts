import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { solveAtwoodMachine } from "../math/physics";
import { setSpriteText, textSprite, tip } from "./helpers";
import "./formulaDerivations/physics";

export class AtwoodMachineLesson implements Lesson {
  readonly id = "atwood-machine";
  readonly title = "Atwood Machine";
  readonly blurb = "Two masses, one rope: forces become acceleration";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["newtons-laws", "pulleys"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private stopTick?: () => void;
  private massAMesh!: THREE.Mesh;
  private massBMesh!: THREE.Mesh;
  private massALabel!: THREE.Sprite;
  private massBLabel!: THREE.Sprite;
  private rope!: THREE.Line;
  private readonly forceArrows: THREE.ArrowHelper[] = [];
  private readonly forceLabels: THREE.Sprite[] = [];
  private displacement = 0;
  private velocity = 0;
  private elapsed = 0;
  private readonly maxDisplacement = 1.65;
  private readonly params = {
    massA: 2,
    massB: 4,
    gravity: 9.81,
    running: false,
    reset: () => {
      this.params.running = false;
      this.displacement = 0;
      this.velocity = 0;
      this.elapsed = 0;
      this.updateScene();
    },
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 1.1, 13), new THREE.Vector3(0, 1, 0));
    this.buildScene();

    tip(
      ctx.gui.add(this.params, "massA", 0.5, 10, 0.1).name("Mass A (kg)"),
      "The left-hand mass. Its weight is mA × g.",
    ).onChange(() => this.resetForInputs());
    tip(
      ctx.gui.add(this.params, "massB", 0.5, 10, 0.1).name("Mass B (kg)"),
      "The right-hand mass. Positive acceleration means B moves down.",
    ).onChange(() => this.resetForInputs());
    tip(
      ctx.gui.add(this.params, "gravity", 1, 15, 0.01).name("Gravity g (m/s²)"),
      "Change this to compare Earth with other gravitational fields.",
    ).onChange(() => this.resetForInputs());
    tip(
      ctx.gui.add(this.params, "running").name("Release masses"),
      "Release the ideal machine from rest. It stops at the ends of the visible travel.",
    );
    tip(ctx.gui.add(this.params, "reset").name("Reset"), "Return both masses to the starting height.");

    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    this.updateScene();
  }

  exit(): void {
    this.stopTick?.();
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.38, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x30363d, roughness: 0.65 }),
    );
    beam.position.set(0, 4.05, 0);
    this.group.add(beam);

    const pulley = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.13, 16, 40),
      new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: 0.45, roughness: 0.35 }),
    );
    pulley.position.set(0, 3.5, 0);
    this.group.add(pulley);

    this.rope = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffd166 }),
    );
    this.group.add(this.rope);

    this.massAMesh = this.createMass(0x58a6ff);
    this.massBMesh = this.createMass(0xffa657);
    this.group.add(this.massAMesh, this.massBMesh);
    this.massALabel = textSprite("", 0x79c0ff, 0.42);
    this.massBLabel = textSprite("", 0xffa657, 0.42);
    this.group.add(this.massALabel, this.massBLabel);

    this.addForceArrow(new THREE.Vector3(0, -1, 0), 0xff7b72, "weight");
    this.addForceArrow(new THREE.Vector3(0, 1, 0), 0x7ee787, "tension");
    this.addForceArrow(new THREE.Vector3(0, -1, 0), 0xff7b72, "weight");
    this.addForceArrow(new THREE.Vector3(0, 1, 0), 0x7ee787, "tension");

    const direction = textSprite("A", 0x79c0ff, 0.42);
    direction.position.set(-2, 4.6, 0);
    const directionB = textSprite("B", 0xffa657, 0.42);
    directionB.position.set(2, 4.6, 0);
    this.group.add(direction, directionB);
  }

  private createMass(color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.15, 0.7),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.12 }),
    );
  }

  private addForceArrow(direction: THREE.Vector3, color: number, label: string): void {
    const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(), 1, color, 0.22, 0.13);
    const sprite = textSprite(label, color, 0.28);
    this.forceArrows.push(arrow);
    this.forceLabels.push(sprite);
    this.group.add(arrow, sprite);
  }

  private resetForInputs(): void {
    this.params.running = false;
    this.displacement = 0;
    this.velocity = 0;
    this.elapsed = 0;
    this.updateScene();
  }

  private tick(dt: number): void {
    if (!this.params.running) return;
    const { acceleration } = solveAtwoodMachine(
      this.params.massA,
      this.params.massB,
      this.params.gravity,
    );
    this.velocity += acceleration * dt;
    this.displacement += this.velocity * dt;
    this.elapsed += dt;

    if (Math.abs(this.displacement) >= this.maxDisplacement) {
      this.displacement = Math.sign(this.displacement) * this.maxDisplacement;
      this.velocity = 0;
      this.params.running = false;
    }
    this.updateScene();
  }

  private updateScene(): void {
    const { massA, massB, gravity } = this.params;
    const { acceleration, tension } = solveAtwoodMachine(massA, massB, gravity);
    const baseY = 0.6;
    const aY = baseY + this.displacement;
    const bY = baseY - this.displacement;

    this.massAMesh.position.set(-2, aY, 0);
    this.massBMesh.position.set(2, bY, 0);
    this.massAMesh.scale.setScalar(0.8 + Math.cbrt(massA) * 0.12);
    this.massBMesh.scale.setScalar(0.8 + Math.cbrt(massB) * 0.12);
    this.massALabel.position.set(-2, aY - 0.95, 0.5);
    this.massBLabel.position.set(2, bY - 0.95, 0.5);
    setSpriteText(this.massALabel, `A: ${massA.toFixed(1)} kg`, 0x79c0ff);
    setSpriteText(this.massBLabel, `B: ${massB.toFixed(1)} kg`, 0xffa657);

    this.rope.geometry.setFromPoints([
      new THREE.Vector3(-2, aY + 0.6, 0),
      new THREE.Vector3(-2, 3.5, 0),
      new THREE.Vector3(2, 3.5, 0),
      new THREE.Vector3(2, bY + 0.6, 0),
    ]);

    this.positionForces(-2, aY, massA * gravity, tension, 0);
    this.positionForces(2, bY, massB * gravity, tension, 2);
    this.renderInfo(acceleration, tension);
  }

  private positionForces(
    x: number,
    y: number,
    weight: number,
    tension: number,
    offset: number,
  ): void {
    const weightArrow = this.forceArrows[offset];
    const tensionArrow = this.forceArrows[offset + 1];
    const weightLength = THREE.MathUtils.clamp(weight / 28, 0.35, 1.7);
    const tensionLength = THREE.MathUtils.clamp(tension / 28, 0.35, 1.7);

    weightArrow.position.set(x, y - 0.22, 0.2);
    weightArrow.setLength(weightLength, 0.22, 0.13);
    tensionArrow.position.set(x, y + 0.22, 0.2);
    tensionArrow.setLength(tensionLength, 0.22, 0.13);
    this.forceLabels[offset].position.set(x - 0.55, y - 0.22 - weightLength * 0.55, 0.35);
    this.forceLabels[offset + 1].position.set(x + 0.55, y + 0.22 + tensionLength * 0.55, 0.35);
  }

  private renderInfo(acceleration: number, tension: number): void {
    const { massA, massB } = this.params;
    const direction = Math.abs(acceleration) < 1e-9
      ? "The masses balance: neither side accelerates."
      : acceleration > 0
        ? "B is heavier, so B moves down and A moves up."
        : "A is heavier, so A moves down and B moves up.";
    const kineticEnergy = 0.5 * (massA + massB) * this.velocity ** 2;

    this.setInfo(`
      <h2>Atwood Machine</h2>
      <p>Two masses hang from a single ideal rope over a frictionless pulley. The heavier side
      falls, pulling the lighter side up. The same tension acts throughout the massless rope.</p>
      <div class="formula" data-derivation="atwood-equations">
        <div class="formula-label">Ideal-machine equations</div>
        <div class="formula-body">a = (mB − mA)g / (mA + mB)&nbsp;&nbsp;·&nbsp;&nbsp;T = 2mA·mB·g / (mA + mB)</div>
      </div>
      <div class="readout" id="atwood-readout">
        <div><span>Acceleration (B downward positive)</span><b>${acceleration.toFixed(3)} m/s²</b></div>
        <div><span>Rope tension T</span><b>${tension.toFixed(2)} N</b></div>
        <div><span>Motion</span><b>${direction}</b></div>
        <div><span>Time since release</span><b>${this.elapsed.toFixed(2)} s</b></div>
        <div><span>Speed</span><b>${Math.abs(this.velocity).toFixed(2)} m/s</b></div>
        <div><span>Total kinetic energy</span><b>${kineticEnergy.toFixed(2)} J</b></div>
      </div>

      <h3>Where the acceleration comes from</h3>
      <p>For B, weight pulls down and tension pulls up: <code>mB·g − T = mB·a</code>.
      For A, tension pulls up and weight pulls down: <code>T − mA·g = mA·a</code>.
      Add the equations: tension cancels because it is an internal force, leaving the
      <b>weight difference</b> to accelerate the combined mass.</p>

      <h3>Interesting facts</h3>
      <ul>
        <li>George Atwood introduced this machine in 1784 to make falling motion slow enough to
        measure accurately before modern electronic timing.</li>
        <li>Equal masses give zero acceleration even though both still have weight: the rope tension
        exactly balances each weight.</li>
        <li>Doubling both masses does not change the acceleration. It doubles the driving weight
        difference and the total inertia together.</li>
      </ul>

      <h3>Applications</h3>
      <p><b>Teaching and experiments:</b> the Atwood machine turns Newton's second law into a
      clean, measurable experiment for force, mass, acceleration and energy.</p>
      <p><b>Counterweights:</b> lifts, stage rigging and mine hoists use a related principle:
      counterbalancing reduces the net force an engine must supply, although real systems also
      include motors, friction and safety mechanisms.</p>
      <p class="example"><b>Try it:</b> set A = B to balance the machine, then change B by only
      0.1 kg. Release it and compare the small acceleration with a much larger mass difference.</p>
    `);
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
    this.forceArrows.length = 0;
    this.forceLabels.length = 0;
  }
}
