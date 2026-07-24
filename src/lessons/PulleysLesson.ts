import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip, heat, textSprite, setSpriteText } from "./helpers";
import "./formulaDerivations/physics";

/**
 * Lesson 18 — Ropes, Pulleys & Weights.
 *
 * The whole subject reduces to three ideas, built up here:
 *   1. One ideal rope carries ONE tension everywhere (massless, frictionless).
 *   2. The load is held up by however many rope segments directly support it (n).
 *      Force balance on the moving block: n · T = W  →  T = W / n.
 *   3. Mechanical advantage MA = n, but energy is conserved: to raise the load by h you
 *      must pull n·h of rope, so F·(n·h) = W·h. You trade distance for force.
 *
 * The user sets the load weight, the number of supporting strands, and (optionally) an
 * efficiency to model friction. They drag a "lift" slider (or animate) to raise the load
 * and watch the effort end travel n× further, with a live work/energy account.
 */
export class PulleysLesson implements Lesson {
  readonly id = "pulleys";
  readonly title = "18 · Ropes & Pulleys";
  readonly blurb = "Lift a weight: F = W / n";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["newtons-laws"] as const;

  private group = new THREE.Group();
  private rig = new THREE.Group(); // rebuilt when strand count changes
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;

  // Persistent scene parts.
  private block!: THREE.Mesh; // movable block
  private load!: THREE.Mesh; // the weight
  private loadLabel!: THREE.Sprite;
  private effortArrow!: THREE.ArrowHelper;
  private effortMarker!: THREE.Mesh;
  private effortLabel!: THREE.Sprite;
  private strandLines: THREE.Line[] = [];
  private topRings: THREE.Mesh[] = [];

  // Layout constants (1 world unit = 1 metre for the readouts).
  private readonly topY = 4.2;
  private readonly restY = -1.2;
  private readonly maxRise = 3.2;
  private readonly effortRailY = 3.6;

  private builtStrands = 0;

  private readonly params = {
    weight: 100, // N (load)
    strands: 2, // supporting rope segments = mechanical advantage
    efficiency: 1.0, // 1 = ideal/frictionless; <1 models friction losses
    lift: 0, // 0..1 fraction of max rise
    animate: false,
    reset: () => {
      this.params.lift = 0;
      this.params.animate = false;
    },
  };

  private animDir = 1;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.2, 16),
      new THREE.Vector3(0, 0.8, 0),
    );

    // Ceiling beam (the fixed support everything hangs from).
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x30363d }),
    );
    beam.position.set(0, this.topY + 0.6, 0);
    this.group.add(beam);

    // Movable block (the lower pulley block the load hangs from).
    this.block = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x539bf5, metalness: 0.2, roughness: 0.5 }),
    );
    this.group.add(this.block);

    // The weight.
    this.load = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x8b949e, metalness: 0.3, roughness: 0.6 }),
    );
    this.group.add(this.load);
    this.loadLabel = textSprite("100 N", 0xffffff, 0.55);
    this.group.add(this.loadLabel);

    // Effort: a guide rail with a marker (the hand) and a downward force arrow.
    this.effortArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(),
      1,
      0xff5d5d,
      0.35,
      0.22,
    );
    this.group.add(this.effortArrow);
    this.effortMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xff7b72, emissive: 0xff7b72, emissiveIntensity: 0.4 }),
    );
    this.group.add(this.effortMarker);
    this.effortLabel = textSprite("F", 0xff7b72, 0.5);
    this.group.add(this.effortLabel);

    this.group.add(this.rig);

    const g = ctx.gui;
    tip(
      g.add(this.params, "weight", 10, 500, 10).name("Load weight W (N)").onChange(() => this.update()),
      "How heavy the weight is, in newtons (≈ kg × 9.81).",
    );
    tip(
      g.add(this.params, "strands", 1, 6, 1).name("Supporting strands n").onChange(() => this.update()),
      "How many rope segments directly hold up the moving block. This IS the mechanical advantage.",
    );
    tip(
      g.add(this.params, "efficiency", 0.4, 1.0, 0.05).name("Efficiency η").onChange(() => this.update()),
      "1 = ideal frictionless. Below 1 models friction: you must pull harder than W/n.",
    );
    tip(
      g.add(this.params, "lift", 0, 1, 0.01).name("Lift the load").onChange(() => this.update()),
      "Drag to raise the load. Watch the effort end (red) travel n× further than the load.",
    );
    tip(g.add(this.params, "animate").name("Auto-lift"), "Continuously raise and lower the load.");
    tip(g.add(this.params, "reset").name("Reset"), "Lower the load back to the start.");

    this.rebuild();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    this.update();
  }

  /** Even spread of strand x-positions, symmetric about 0. */
  private strandXs(n: number): number[] {
    if (n === 1) return [0];
    const span = Math.min(2.6, 0.45 * (n - 1));
    const xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(-span + (2 * span * i) / (n - 1));
    return xs;
  }

  /** Rebuild strands + top pulley rings for the current strand count. */
  private rebuild(): void {
    for (const l of this.strandLines) {
      this.rig.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    }
    for (const r of this.topRings) {
      this.rig.remove(r);
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    }
    this.strandLines = [];
    this.topRings = [];

    const n = this.params.strands;
    const xs = this.strandXs(n);
    const ringGeo = new THREE.TorusGeometry(0.28, 0.07, 12, 28);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: 0.4, roughness: 0.4 });

    for (let i = 0; i < n; i++) {
      // Top anchor/pulley ring for each supporting strand.
      const ring = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
      ring.position.set(xs[i], this.topY, 0);
      this.rig.add(ring);
      this.topRings.push(ring);

      // The supporting strand (positions updated each frame).
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xs[i], this.topY, 0),
        new THREE.Vector3(xs[i], this.restY, 0),
      ]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd166 }));
      this.rig.add(line);
      this.strandLines.push(line);
    }

    // Block width tracks the strand span so the strands meet it neatly.
    const w = Math.max(1.6, (xs[xs.length - 1] - xs[0]) + 1.0);
    this.block.geometry.dispose();
    this.block.geometry = new THREE.BoxGeometry(w, 0.5, 1.0);

    this.builtStrands = n;
  }

  /** Physics derived from the current controls. */
  private compute() {
    const W = this.params.weight;
    const n = this.params.strands;
    const eff = this.params.efficiency;
    const tension = W / n; // ideal tension in each supporting strand
    const effort = W / (n * eff); // force you must actually apply (friction makes it > tension)
    const h = this.params.lift * this.maxRise; // load rise in metres
    const pull = n * h; // rope you must pull in (velocity ratio = n)
    const workOut = W * h; // useful work on the load
    const workIn = effort * pull; // work you put in = workOut / eff
    return { W, n, eff, tension, effort, h, pull, workOut, workIn, VR: n };
  }

  private tick(dt: number): void {
    if (this.params.animate) {
      this.params.lift += this.animDir * dt * 0.25;
      if (this.params.lift >= 1) {
        this.params.lift = 1;
        this.animDir = -1;
      } else if (this.params.lift <= 0) {
        this.params.lift = 0;
        this.animDir = 1;
      }
      this.update();
    }
  }

  private update(): void {
    if (this.params.strands !== this.builtStrands) this.rebuild();
    const { W, n, tension, effort, h, pull } = this.compute();

    // Move the block + load up by h.
    const bottomY = this.restY + h;
    this.block.position.set(0, bottomY, 0);
    this.load.position.set(0, bottomY - 0.25 - 0.7, 0);
    this.loadLabel.position.set(0, bottomY - 0.95, 0.6);
    setSpriteText(this.loadLabel, `${W.toFixed(0)} N`, 0xffffff);

    // Strand colour encodes tension relative to the full load (red = strong, blue = light).
    const tColor = heat(tension / W); // = 1/n
    const xs = this.strandXs(n);
    for (let i = 0; i < this.strandLines.length; i++) {
      const line = this.strandLines[i];
      line.geometry.setFromPoints([
        new THREE.Vector3(xs[i], this.topY, 0),
        new THREE.Vector3(xs[i], bottomY + 0.25, 0),
      ]);
      (line.material as THREE.LineBasicMaterial).color.copy(tColor);
    }

    // Effort end: a marker on a right-hand rail that descends as you pull rope in.
    // Its travel is scaled to fit, but it always reaches the bottom exactly when the
    // load reaches the top — and the readout shows the true n× distance.
    const effortX = (xs[xs.length - 1] ?? 0) + 2.0;
    const railTop = this.effortRailY;
    const railBottom = this.restY - 0.4;
    const effortY = railTop - this.params.lift * (railTop - railBottom);
    this.effortMarker.position.set(effortX, effortY, 0);

    // Force arrow length ∝ effort, capped so it stays on screen.
    const arrowLen = THREE.MathUtils.clamp(effort / 60, 0.4, 3.0);
    this.effortArrow.position.set(effortX, effortY, 0);
    this.effortArrow.setLength(arrowLen, Math.min(0.35, arrowLen * 0.3), Math.min(0.22, arrowLen * 0.25));
    this.effortLabel.position.set(effortX + 0.9, effortY - arrowLen * 0.5, 0);
    setSpriteText(this.effortLabel, `${effort.toFixed(0)} N`, 0xff7b72);

    void pull; // (true pull distance shown in the readout)
    this.renderInfo();
  }

  private renderInfo(): void {
    const { W, n, eff, tension, effort, h, pull, workOut, workIn } = this.compute();
    const effLine =
      eff < 1
        ? `<div><span>Effort with friction</span><b>${effort.toFixed(1)} N</b></div>`
        : "";
    const lossNote =
      eff < 1
        ? `<p class="formula-note">Friction wastes energy: you put in
           <b>${workIn.toFixed(1)} J</b> but only <b>${workOut.toFixed(1)} J</b> reaches the
           load — efficiency η = ${(eff * 100).toFixed(0)} %.</p>`
        : `<p class="formula-note">Ideal system: work in = work out
           (${workIn.toFixed(1)} J = ${workOut.toFixed(1)} J). No energy is created — the
           pulley just repackages it as <i>less force over more distance</i>.</p>`;

    this.setInfo(`
      <h2>Ropes, Pulleys &amp; Weights</h2>
      <div class="formula" data-derivation="pulley-mechanical-advantage">
        <div class="formula-label">The whole idea</div>
        <div class="formula-body">n · T = W&nbsp;&nbsp;→&nbsp;&nbsp;F = W / n&nbsp;&nbsp;·&nbsp;&nbsp;pull = n · h</div>
      </div>
      <div class="readout">
        <div><span>Load weight W</span><b>${W.toFixed(0)} N</b></div>
        <div><span>Supporting strands n (= MA)</span><b>${n}</b></div>
        <div><span>Tension per strand T = W/n</span><b>${tension.toFixed(1)} N</b></div>
        <div><span>Effort needed (ideal)</span><b>${(W / n).toFixed(1)} N</b></div>
        ${effLine}
        <div><span>Velocity ratio</span><b>${n} : 1</b></div>
        <div><span>Load raised h</span><b>${h.toFixed(2)} m</b></div>
        <div><span>Rope you pull = n·h</span><b>${pull.toFixed(2)} m</b></div>
      </div>
      ${lossNote}

      <h3>1 · One rope, one tension</h3>
      <p>An ideal rope is massless and slides freely over frictionless pulleys, so the
      <b>tension is the same at every point</b> along it. Pull the end with force F and every
      part of that rope is at tension F. This single fact is the key to everything below.</p>

      <h3>2 · Count the supporting strands</h3>
      <p>Look at the moving block. Only the rope segments that <i>go up from it</i> hold it up.
      If <b>n</b> of them share the load, balancing forces gives
      <b>n · T = W</b>, so each carries <b>T = W/n</b> and the effort you need is just
      <b>F = W/n</b>. With n = ${n} strands you lift ${W.toFixed(0)} N using only
      ${(W / n).toFixed(1)} N. That ratio is the <b>mechanical advantage</b>.</p>

      <h3>3 · You can't cheat energy</h3>
      <p>The catch: to raise the load by h, every one of the n strands must shorten by h,
      so you reel in <b>n·h</b> of rope. Less force, but proportionally more distance — the
      product (work) is unchanged. Drag <b>Lift</b> and watch the red effort end travel
      ${n}× further than the load.</p>

      <h3>Real pulleys — friction</h3>
      <p>Lower <b>Efficiency η</b> to model friction in the pulley axles. Real effort becomes
      <b>F = W / (n·η)</b>, and some of your work turns into heat instead of lifting the load.</p>

      <p class="example"><b>Try:</b> n = 1 (a single fixed pulley — only changes direction,
      no force saving) · raise n to 4 and watch the effort arrow shrink · then drop η to 0.6
      to feel friction's cost.</p>`);
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.rig = new THREE.Group();
    this.strandLines = [];
    this.topRings = [];
    this.builtStrands = 0;
  }
}
