import * as THREE from "three";
import type { Controller } from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip, textSprite, setSpriteText, marker } from "./helpers";
import {
  GRAVITY,
  smallAnglePeriod,
  exactPeriod,
  energy,
  angularAcceleration,
  linearAngularAcceleration,
  rk4Step,
  type PendulumState,
} from "../math/pendulum";
import "./formulaDerivations/physics";

const DEG = Math.PI / 180;

/**
 * Lesson 20 — The Pendulum.
 * A real (nonlinear) simple pendulum solved by RK4: θ'' = −(g/L)·sinθ − (b/m)·θ'.
 * You type in real values — length, gravity (Earth/Moon/Mars/Jupiter…), release angle,
 * mass and air damping — and watch the bob swing with live tension/velocity/gravity
 * vectors, an energy account, and a rolling θ(t) graph. A translucent "ideal" ghost runs
 * the small-angle (linear) model alongside it, so you can *see* why big swings run slow.
 */
export class PendulumLesson implements Lesson {
  readonly id = "pendulum";
  readonly title = "20 · Pendulum";
  readonly blurb = "Swing a bob: T = 2π√(L/g)";
  readonly category = "Physics" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["differentiation", "integration"] as const;

  private group = new THREE.Group();
  private rod!: THREE.Line;
  private bob!: THREE.Mesh;
  private ghostRod!: THREE.Line;
  private ghostBob!: THREE.Mesh;
  private vArrow!: THREE.ArrowHelper;
  private gArrow!: THREE.ArrowHelper;
  private tArrow!: THREE.ArrowHelper;
  private arc!: THREE.Line;
  private graph = new THREE.Group();
  private realTrace!: THREE.Line;
  private idealTrace!: THREE.Line;
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;

  private readonly pivot = new THREE.Vector3(0, 6, 0);
  private readonly window = 8; // seconds shown on the θ(t) graph

  private real: PendulumState = { theta: 0, omega: 0 };
  private ideal: PendulumState = { theta: 0, omega: 0 };
  private t = 0;
  private acc = 0; // fixed-step integrator accumulator
  private samples: { t: number; real: number; ideal: number }[] = [];

  // Swing counter: count crossings through the bottom (θ = 0). Two crossings make one full
  // period, so periods = ⌊halfSwings / 2⌋. We also time the gap between crossings to read a
  // live *measured* period — the heart of the isochronism demo.
  private prevTheta = 0;
  private halfSwings = 0;
  private lastCrossTime?: number;
  private measuredPeriod = 0;
  private counter!: THREE.Sprite;
  private lastShownCount = -1;
  private lastShownStopped = false;

  // Stopwatch: time how long the bob takes to complete `targetSwings` full swings. A full swing
  // is a return to the *release point* (a turning point on the release side, ω flips sign with θ
  // on that side) — that happens once per period, so the Nth return lands at t ≈ N·T. We capture
  // the precise time then auto-pause so the number holds.
  private stopwatchTime?: number;
  private runCtl!: Controller;
  private flagStopUpdate = false;
  private prevOmega = 0;
  private fullSwings = 0; // returns to the release-side turning point
  private releaseSign = 1; // sign of the release angle (which side "home" is)

  private readonly params = {
    length: 1.0, // L (m)
    world: "Earth",
    gravity: 9.81, // g (m/s²)
    angle: 40, // release angle θ₀ (degrees)
    mass: 1.0, // m (kg)
    damping: 0.0, // air resistance coefficient b (N·s/m per unit, simplified)
    showIdeal: true, // overlay the small-angle (linear) ghost
    running: true,
    targetSwings: 10, // stopwatch target: auto-stop after this many full swings
    release: () => this.release(),
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0.5, 3.2, 12),
      new THREE.Vector3(1.5, 3, 0),
    );

    // Pivot mount + a little bracket.
    const mount = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x30363d }),
    );
    mount.position.set(this.pivot.x, this.pivot.y + 0.15, 0);
    this.group.add(mount);
    const pin = marker(0xc9d1d9, 0.12);
    pin.position.copy(this.pivot);
    this.group.add(pin);

    // Rod + bob (real, nonlinear) and the translucent ideal ghost.
    this.rod = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([this.pivot.clone(), this.pivot.clone()]),
      new THREE.LineBasicMaterial({ color: 0xc9d1d9 }),
    );
    this.bob = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x539bf5, metalness: 0.2, roughness: 0.5 }),
    );
    this.group.add(this.rod, this.bob);

    this.ghostRod = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([this.pivot.clone(), this.pivot.clone()]),
      new THREE.LineBasicMaterial({ color: 0x8b949e, transparent: true, opacity: 0.5 }),
    );
    this.ghostBob = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x7ee787,
        transparent: true,
        opacity: 0.4,
        emissive: 0x2ea043,
        emissiveIntensity: 0.3,
      }),
    );
    this.group.add(this.ghostRod, this.ghostBob);

    // Vectors on the bob: velocity (green), gravity (red), rod tension (blue).
    const up = new THREE.Vector3(0, 1, 0);
    this.vArrow = new THREE.ArrowHelper(up, this.pivot.clone(), 1, 0x7ee787, 0.3, 0.18);
    this.gArrow = new THREE.ArrowHelper(up, this.pivot.clone(), 1, 0xff7b72, 0.3, 0.18);
    this.tArrow = new THREE.ArrowHelper(up, this.pivot.clone(), 1, 0x79c0ff, 0.3, 0.18);
    this.group.add(this.vArrow, this.gArrow, this.tArrow);

    // Angle arc at the pivot, from the downward vertical to the current angle.
    this.arc = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xd29922 }),
    );
    this.group.add(this.arc);

    this.buildGraph();
    this.group.add(this.graph);

    // A big on-scene swing counter so you can watch the count tick up while the bob swings.
    this.counter = textSprite("0 swings", 0xd29922, 0.6);
    this.counter.position.set(this.pivot.x, this.pivot.y + 0.9, 0);
    this.group.add(this.counter);

    const g = ctx.gui;
    tip(
      g.add(this.params, "length", 0.2, 5, 0.05).name("Length L (m)"),
      "Rod length. Period grows with √L — quadruple L to double the period.",
    );
    tip(
      g.add(this.params, "world", Object.keys(GRAVITY)).name("World (gravity)").onChange((w: string) => {
        this.params.gravity = GRAVITY[w];
        gravityCtl.updateDisplay();
      }),
      "Surface gravity of different worlds. Weaker gravity → slower swing.",
    );
    const gravityCtl = tip(
      g.add(this.params, "gravity", 0.5, 30, 0.01).name("g (m/s²)"),
      "Gravitational acceleration. Drag to explore any value, or pick a world above.",
    );
    tip(
      g.add(this.params, "angle", 1, 170, 1).name("Release angle θ₀ (°)").onChange(() => this.release()),
      "How far back you pull the bob before letting go. Big angles run measurably slower.",
    );
    tip(
      g.add(this.params, "mass", 0.2, 5, 0.1).name("Mass m (kg)"),
      "Bob mass. With no air resistance the period does NOT depend on mass (Galileo).",
    );
    tip(
      g.add(this.params, "damping", 0, 1, 0.01).name("Air damping b"),
      "Air resistance. Removes energy each swing so the amplitude decays.",
    );
    tip(
      g.add(this.params, "showIdeal").name("Show ideal ghost"),
      "Overlay the small-angle (linear sinθ≈θ) solution to compare against the real one.",
    );
    this.runCtl = tip(g.add(this.params, "running").name("Run"), "Play or pause the simulation.");
    tip(
      g.add(this.params, "targetSwings", 1, 50, 1).name("⏱ Stop after N swings").onChange(() => {
        this.stopwatchTime = undefined; // re-arm the stopwatch for the new target
      }),
      "Set a target number of full swings. Hit Release ⟲ and the bob runs, then auto-pauses the moment it completes that many — read the elapsed time in the Stopwatch panel.",
    );
    tip(g.add(this.params, "release").name("Release ⟲"), "Pull the bob back to θ₀ and let go.");

    this.release();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  /** Re-release the bob from the current θ₀ at rest, clearing the graph and counter. */
  private release(): void {
    const a = this.params.angle * DEG;
    this.real = { theta: a, omega: 0 };
    this.ideal = { theta: a, omega: 0 };
    this.t = 0;
    this.acc = 0;
    this.samples = [];
    this.prevTheta = a;
    this.halfSwings = 0;
    this.lastCrossTime = undefined;
    this.measuredPeriod = 0;
    this.lastShownCount = -1;
    this.stopwatchTime = undefined;
    this.prevOmega = 0;
    this.fullSwings = 0;
    this.releaseSign = a >= 0 ? 1 : -1;
    if (!this.params.running) {
      this.params.running = true;
      this.runCtl?.updateDisplay();
    }
  }

  /** Completed full periods so far (two bottom-crossings = one period). */
  private get periods(): number {
    return Math.floor(this.halfSwings / 2);
  }

  private tick(dt: number): void {
    const { length: L, gravity: gv, mass: m, damping: b } = this.params;

    if (this.params.running) {
      // Fixed-step RK4 (decoupled from frame rate) keeps the energy bookkeeping honest.
      const h = 1 / 240;
      this.acc += Math.min(dt, 0.05);
      while (this.acc >= h) {
        this.real = rk4Step(this.real, h, (s) => angularAcceleration(s, L, gv, b, m));
        this.ideal = rk4Step(this.ideal, h, (s) => linearAngularAcceleration(s, L, gv, b, m));
        this.acc -= h;
        this.t += h;
        this.countCrossing();
      }
      this.samples.push({ t: this.t, real: this.real.theta, ideal: this.ideal.theta });
      const cutoff = this.t - this.window;
      while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
    }

    if (this.flagStopUpdate) {
      this.flagStopUpdate = false;
      this.runCtl.updateDisplay(); // reflect the auto-pause in the Run toggle
    }

    this.draw();
    this.renderInfo();
  }

  /** Detect the bob passing through the bottom (θ = 0) and update counts + measured period. */
  private countCrossing(): void {
    const now = this.real.theta;
    const crossed = (this.prevTheta < 0 && now >= 0) || (this.prevTheta > 0 && now <= 0);
    if (crossed && this.prevTheta !== 0) {
      // Linear-interpolate the exact crossing time for a clean measured period.
      const frac = this.prevTheta / (this.prevTheta - now); // in [0,1]
      const tCross = this.t - (1 - frac) / 240;
      if (this.lastCrossTime !== undefined) {
        this.measuredPeriod = 2 * (tCross - this.lastCrossTime); // half-period × 2
      }
      this.lastCrossTime = tCross;
      this.halfSwings++;
    }
    this.prevTheta = now;

    // Stopwatch: detect a turning point (ω changes sign). When it lands on the release side, the
    // bob is back where you let it go — one full swing done. The Nth such return is at t ≈ N·T.
    const omega = this.real.omega;
    const turned = (this.prevOmega > 0 && omega <= 0) || (this.prevOmega < 0 && omega >= 0);
    if (turned && this.prevOmega !== 0 && now * this.releaseSign > 0) {
      const fracO = this.prevOmega / (this.prevOmega - omega); // in [0,1]
      const tTurn = this.t - (1 - fracO) / 240;
      this.fullSwings++;
      if (this.stopwatchTime === undefined && this.fullSwings === this.params.targetSwings) {
        this.stopwatchTime = tTurn;
        this.params.running = false;
        this.flagStopUpdate = true;
      }
    }
    this.prevOmega = omega;
  }

  /** Position of the bob in world space for a given angle and length. */
  private bobPos(theta: number, L: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.pivot.x + L * Math.sin(theta),
      this.pivot.y - L * Math.cos(theta),
      0,
    );
  }

  private draw(): void {
    const { length: L, gravity: gv, mass: m } = this.params;
    const theta = this.real.theta;
    const omega = this.real.omega;
    const pos = this.bobPos(theta, L);

    // Real rod + bob.
    this.rod.geometry.setFromPoints([this.pivot.clone(), pos]);
    this.bob.position.copy(pos);
    const r = 0.12 + 0.18 * Math.cbrt(m);
    this.bob.scale.setScalar(r);

    // Ideal ghost.
    this.ghostRod.visible = this.params.showIdeal;
    this.ghostBob.visible = this.params.showIdeal;
    if (this.params.showIdeal) {
      const gp = this.bobPos(this.ideal.theta, L);
      this.ghostRod.geometry.setFromPoints([this.pivot.clone(), gp]);
      this.ghostBob.position.copy(gp);
      this.ghostBob.scale.setScalar(r * 0.92);
    }

    // Vectors. Velocity is tangential (L·ω along the swing direction); gravity points
    // straight down; tension points up the rod toward the pivot.
    const vel = new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0).multiplyScalar(L * omega);
    this.setArrow(this.vArrow, pos, vel, 0.45);

    const grav = new THREE.Vector3(0, -m * gv, 0);
    this.setArrow(this.gArrow, pos, grav, 0.06);

    const tensionMag = m * gv * Math.cos(theta) + m * L * omega * omega; // along rod
    const toPivot = this.pivot.clone().sub(pos).normalize().multiplyScalar(tensionMag);
    this.setArrow(this.tArrow, pos, toPivot, 0.06);

    this.updateArc(theta, Math.min(L * 0.5, 0.9));
    this.updateGraph();

    // Refresh the on-scene counter only when the count (or the target-reached state) changes.
    const reached = this.stopwatchTime !== undefined;
    if (this.periods !== this.lastShownCount || reached !== this.lastShownStopped) {
      this.lastShownCount = this.periods;
      this.lastShownStopped = reached;
      const label = reached
        ? `${this.periods} swings ✓`
        : `${this.periods} swing${this.periods === 1 ? "" : "s"}`;
      setSpriteText(this.counter, label, reached ? 0x3fb950 : 0xd29922);
    }
  }

  /** Aim an ArrowHelper from `origin` along `vec`, scaling length by `scale`. */
  private setArrow(
    arrow: THREE.ArrowHelper,
    origin: THREE.Vector3,
    vec: THREE.Vector3,
    scale: number,
  ): void {
    const len = vec.length() * scale;
    if (len < 0.04) {
      arrow.visible = false;
      return;
    }
    arrow.visible = true;
    arrow.position.copy(origin);
    arrow.setDirection(vec.clone().normalize());
    arrow.setLength(len, Math.min(0.3, len * 0.35), Math.min(0.18, len * 0.22));
  }

  private updateArc(theta: number, radius: number): void {
    const pts: THREE.Vector3[] = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = (theta * i) / n; // sweep from vertical (0) to θ
      pts.push(
        new THREE.Vector3(
          this.pivot.x + radius * Math.sin(a),
          this.pivot.y - radius * Math.cos(a),
          0,
        ),
      );
    }
    this.arc.geometry.setFromPoints(pts);
  }

  private buildGraph(): void {
    const o = this.graphFrame();
    const axisMat = new THREE.LineBasicMaterial({ color: 0x6e7681 });
    // Box-ish axes: a horizontal zero (time) line and a vertical (angle) axis.
    this.graph.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(o.x, o.y + o.h / 2, 0),
          new THREE.Vector3(o.x, o.y - o.h / 2, 0),
          new THREE.Vector3(o.x + o.w, o.y - o.h / 2, 0),
        ]),
        axisMat,
      ),
    );
    const zeroLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(o.x, o.y, 0),
        new THREE.Vector3(o.x + o.w, o.y, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x30363d }),
    );
    this.graph.add(zeroLine);

    const title = textSprite("θ(t)", 0xc9d1d9, 0.5);
    title.position.set(o.x + 0.6, o.y + o.h / 2 + 0.3, 0);
    this.graph.add(title);

    this.realTrace = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x539bf5 }),
    );
    this.idealTrace = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x7ee787, transparent: true, opacity: 0.7 }),
    );
    this.graph.add(this.realTrace, this.idealTrace);
  }

  private graphFrame() {
    return { x: 3.2, y: 3.4, w: 6, h: 4.4 };
  }

  private updateGraph(): void {
    const o = this.graphFrame();
    const ampMax = Math.max(this.params.angle * DEG, 0.2);
    const t1 = this.t;
    const t0 = t1 - this.window;
    const map = (s: { t: number; v: number }) =>
      new THREE.Vector3(
        o.x + ((s.t - t0) / this.window) * o.w,
        o.y + THREE.MathUtils.clamp(s.v / ampMax, -1, 1) * (o.h / 2),
        0,
      );

    this.realTrace.geometry.setFromPoints(
      this.samples.map((s) => map({ t: s.t, v: s.real })),
    );
    this.idealTrace.visible = this.params.showIdeal;
    if (this.params.showIdeal) {
      this.idealTrace.geometry.setFromPoints(
        this.samples.map((s) => map({ t: s.t, v: s.ideal })),
      );
    }
  }

  private renderInfo(): void {
    const { length: L, gravity: gv, mass: m } = this.params;
    const a0 = this.params.angle * DEG;
    const T0 = smallAnglePeriod(L, gv);
    const Tre = exactPeriod(L, gv, a0);
    const slowPct = ((Tre / T0 - 1) * 100).toFixed(1);
    const e = energy(this.real, L, gv, m);
    const thetaDeg = (this.real.theta / DEG).toFixed(1);
    const vBob = (L * this.real.omega).toFixed(2);

    // Live small-angle approximation quality at the release angle: how far sinθ has fallen
    // below θ (in radians). This is exactly the "missing" restoring pull that the simple
    // formula ignores, so it tracks how badly the small-angle model breaks down.
    const sinRatio = a0 > 1e-6 ? Math.sin(a0) / a0 : 1;
    const weakerPct = ((1 - sinRatio) * 100).toFixed(a0 < 0.4 ? 2 : 1);
    const a0r = a0.toFixed(3);
    const sinA0 = Math.sin(a0).toFixed(3);

    const periods = this.periods;
    const measured = this.measuredPeriod;
    const measuredStr = measured > 0 ? `${measured.toFixed(3)} s` : "—";

    // Stopwatch: predicted time for N swings = N × T (the real, large-angle period). The measured
    // time is the genuine elapsed time captured when the bob finishes the Nth swing.
    const N = this.params.targetSwings;
    const predictedTotal = N * Tre;
    const reached = this.stopwatchTime !== undefined;
    const stopwatchStr = reached
      ? `${this.stopwatchTime!.toFixed(2)} s`
      : `running… ${periods} of ${N}`;
    const stopErrStr =
      reached && predictedTotal > 0
        ? `${(((this.stopwatchTime! - predictedTotal) / predictedTotal) * 100).toFixed(1)}%`
        : "—";

    this.setInfo(`
      <h2>The Pendulum</h2>
      <div class="formula" data-derivation="pendulum-small-period">
        <div class="formula-label">Small-angle period (mass-independent)</div>
        <div class="formula-body">T₀ = 2π · √(L / g)</div>
      </div>
      <div class="formula" data-derivation="pendulum-exact-period">
        <div class="formula-label">Real (large-angle) period — grows with amplitude</div>
        <div class="formula-body">T = 4·√(L/g)·K(sin(θ₀/2)) ≈ T₀·(1 + θ₀²/16 + …)</div>
      </div>
      <div class="readout">
        <div><span>Length L</span><b>${L.toFixed(2)} m</b></div>
        <div><span>Gravity g (${this.params.world})</span><b>${gv.toFixed(2)} m/s²</b></div>
        <div><span>Release angle θ₀</span><b>${this.params.angle.toFixed(0)}°</b></div>
        <div><span>Ideal period T₀</span><b>${T0.toFixed(3)} s</b></div>
        <div><span>Real period T</span><b>${Tre.toFixed(3)} s</b></div>
        <div><span>Real runs slower by</span><b>${slowPct}%</b></div>
        <div><span>Current angle θ</span><b>${thetaDeg}°</b></div>
        <div><span>Bob speed v = L·ω</span><b>${vBob} m/s</b></div>
        <div><span>Kinetic energy</span><b>${e.kinetic.toFixed(2)} J</b></div>
        <div><span>Potential energy</span><b>${e.potential.toFixed(2)} J</b></div>
        <div><span>Total energy</span><b>${e.total.toFixed(2)} J</b></div>
      </div>
      <p>On the bob:
        <span style="color:#7ee787">velocity</span> (tangent to the swing arc — i.e. along the
        direction of motion, always at 90° to the rod),
        <span style="color:#ff7b72">gravity</span> (straight down),
        <span style="color:#79c0ff">tension</span> (up the rod).
        The <span style="color:#7ee787">green ghost</span> is the small-angle model.</p>
      <p>Because the rod length is fixed, the bob can only travel along a circular arc, so its
        velocity is always <b>tangent</b> to that arc and points exactly where it is heading next.
        Speed = L·ω: it is zero at the turning points (where the arrow vanishes) and largest at the
        bottom.</p>

      <h3>From geometry to the equation — step by step</h3>
      <p>Here is the whole journey from "a weight on a string" to T₀ = 2π√(L/g). Each step is just
      one small idea stacked on the last — no leaps.</p>
      <ol class="deriv">
        <li><b class="step-title">One angle says it all</b>
          The rod length L never changes, so the bob cannot wander freely — it is locked onto a
          circle of radius L. A single number, the angle <b>θ</b> measured from straight-down, fixes
          exactly where the bob is.</li>
        <li><b class="step-title">Turn the angle into a distance</b>
          The key piece of geometry: arc length along that circle is <b>s = L·θ</b> — literally the
          definition of a radian (angle = arc ÷ radius). Differentiate with respect to time twice,
          and the speed and acceleration <i>along the arc</i> are just θ with an L bolted on front:
          <div class="formula" data-derivation="pendulum-arc-kinematics"><div class="formula-body" style="font-size:15px">v = L·θ′ &nbsp;&nbsp;&nbsp; a = L·θ″</div></div></li>
        <li><b class="step-title">Split gravity into two pieces</b>
          Two forces act on the bob: gravity <b>m·g</b> straight down, and the rod's tension pointing
          up the rod. Resolve gravity using the right-angled triangle the rod makes with the
          vertical. The slice <b>m·g·cosθ</b> runs <i>along</i> the rod (tension cancels it, so it
          never speeds the bob along its path); the slice <b>m·g·sinθ</b> runs <i>along the arc</i>.
          That tangential slice is the <b>only</b> thing driving the swing — and the
          <b>sinθ comes straight out of the triangle</b> (it's the side opposite the angle θ).</li>
        <li><b class="step-title">It always pulls back home</b>
          Whichever way you displace the bob, that tangential force points back toward the bottom.
          A force that always fights the displacement is a <b>restoring force</b>, so we carry a
          minus sign: the push along the arc is <b>−m·g·sinθ</b>.</li>
        <li><b class="step-title">Apply Newton's second law (F = m·a) along the arc</b>
          Set the force from step 4 equal to mass × the arc-acceleration from step 2:
          <div class="formula" data-derivation="pendulum-nonlinear-equation"><div class="formula-body" style="font-size:15px">m·(L·θ″) = −m·g·sinθ &nbsp;&nbsp;⟹&nbsp;&nbsp; θ″ = −(g ⁄ L)·sinθ</div></div>
          The mass <b>m cancels off both sides</b>. Two surprises fall out for free: mass has
          <i>vanished</i> (a cannonball and a pea on equal strings swing in lock-step), and only L
          and g are left. That <b>θ″ = −(g/L)·sinθ</b> <i>is</i> "the complicated equation".</li>
        <li><b class="step-title">The snag — it has no tidy solution</b>
          Because of the <b>sinθ</b>, this equation is <i>nonlinear</i>: there is no formula
          θ(t) = … built from everyday functions. (This demo simply grinds it out numerically, one
          tiny time-step at a time, with the RK4 method.)</li>
        <li><b class="step-title">The small-angle shortcut</b>
          For a small swing, <b>sinθ ≈ θ</b> (with θ in radians — see the Taylor-series section
          below). Swap it in and the equation goes straight:
          <div class="formula" data-derivation="pendulum-small-angle-equation"><div class="formula-body" style="font-size:15px">θ″ = −(g ⁄ L)·θ</div></div>
          Acceleration is now simply <b>proportional to the displacement</b> and points back — the
          textbook definition of <b>simple harmonic motion</b>, the exact same maths as a mass on a
          spring.</li>
        <li><b class="step-title">Read off the period</b>
          Every SHM equation of the form θ″ = −ω²·θ oscillates as θ(t) = θ₀·cos(ω·t) with the same
          <b>ω = √(g/L)</b>. One full there-and-back takes
          <div class="formula" data-derivation="pendulum-shm-period"><div class="formula-body" style="font-size:15px">T₀ = 2π ⁄ ω = 2π·√(L ⁄ g) = ${T0.toFixed(3)} s</div><div class="formula-note">with your current
          L = ${L.toFixed(2)} m and g = ${gv.toFixed(2)} m/s². Notice what is <b>not</b> in the
          answer: mass and amplitude. That is the whole magic — and it is exact only in the
          small-angle limit.</div></div></li>
      </ol>

      <h3>How it was discovered</h3>
      <ul>
        <li><b>Galileo Galilei (~1602).</b> Legend has the young Galileo watching a lamp swing in
        Pisa cathedral and timing it against his own pulse, noticing that wide and narrow swings
        took the <i>same</i> time (isochronism — true for small swings). He proposed the pendulum as
        a timekeeper, but never built a working clock.</li>
        <li><b>Christiaan Huygens (1656–1673).</b> Built the first working pendulum clock, and in
        <i>Horologium Oscillatorium</i> (1673) derived the law <b>T = 2π√(L/g)</b> rigorously. He
        also proved that a <i>perfectly</i> equal-time path is a <b>cycloid</b>, not a circle —
        which is exactly why a plain circular swing drifts at large angles (the drift you can watch
        on the swing counter above).</li>
        <li><b>Isaac Newton (1687).</b> His three laws of motion — the F = m·a used in step 5 —
        turned the whole problem into the short derivation above. His pendulum experiments also
        confirmed that gravity pulls on <i>every</i> mass equally, which is precisely why the m
        cancelled out.</li>
      </ul>

      <h3>Swing counter</h3>
      <div class="readout">
        <div><span>Full swings completed</span><b>${periods}</b></div>
        <div><span>Elapsed time</span><b>${this.t.toFixed(1)} s</b></div>
        <div><span>Measured period (live)</span><b>${measuredStr}</b></div>
        <div><span>Predicted period T</span><b>${Tre.toFixed(3)} s</b></div>
      </div>
      <p>One <b>swing</b> = there and back — counted each time the bob passes the bottom twice.
      The amber counter floating above the pivot ticks up live; the <b>measured period</b> is
      timed from the bob's own bottom-crossings, so it should land on the predicted T. Hit
      <b>Release ⟲</b> to reset the count.</p>

      <h3>⏱ Stopwatch — how long for N swings?</h3>
      <p>Want to know how long, say, <b>10 swings</b> take? You don't even need to run it — one
      swing lasts T, so <b>N swings take N × T</b>. Set the target with <b>⏱ Stop after N swings</b>,
      then hit <b>Release ⟲</b> to time it for real: the bob auto-pauses the instant it finishes,
      and the counter above turns <span style="color:#3fb950">green ✓</span>.</p>
      <div class="formula" data-derivation="pendulum-multiple-swings">
        <div class="formula-label">Predicted time for N full swings</div>
        <div class="formula-body" style="font-size:16px">t = N · T = ${N} × ${Tre.toFixed(3)} s = ${predictedTotal.toFixed(2)} s</div>
      </div>
      <div class="readout">
        <div><span>Target swings N</span><b>${N}</b></div>
        <div><span>Predicted time (N × T)</span><b>${predictedTotal.toFixed(2)} s</b></div>
        <div><span>Measured time (stopwatch)</span><b>${stopwatchStr}</b></div>
        <div><span>Measured vs predicted</span><b>${stopErrStr}</b></div>
      </div>
      <p>With no air damping the amplitude stays put, so every swing takes the same time and the
      stopwatch lands right on N × T — at <i>any</i> angle, because the T shown here already bakes in
      the large-angle correction. Add <b>air damping</b> and the swing shrinks turn after turn; its
      period changes as it decays (drifting toward T₀), so the real total parts company with the
      single-period estimate. That gap is the amplitude-decay effect you can watch on the counter.</p>

      <h3>Isochronism — equal-time swings</h3>
      <p>Galileo's famous observation (legend has him timing a swinging cathedral lamp against
      his own pulse): for small swings <b>every swing takes the same time, no matter how wide
      it is</b>. "Isochronous" = <i>iso</i> (equal) + <i>chronos</i> (time). Because the period
      ignores amplitude, a pendulum makes a superb clock — as friction quietly steals energy and
      the arcs shrink, each tick still lasts the same T₀, so the clock keeps time instead of
      racing.</p>
      <p><b>See it on the counter:</b> set θ₀ ≈ 10°, nudge <b>air damping</b> up a little, and
      watch the amplitude decay swing after swing while the <i>measured period</i> barely moves —
      that's isochronism. Now set θ₀ ≈ 150° and repeat: those big swings are <b>not</b>
      isochronous — as damping shrinks them, the measured period visibly shortens back toward T₀.
      Equal-time swings are a small-angle privilege, which is exactly why the formula assumes
      one.</p>

      <h3>Why only small angles? The sinθ ≈ θ trick</h3>
      <p>"Proportional to the displacement" is the catch. The real restoring term is
      <b>sinθ</b>, which is <i>not</i> a straight line — but for small angles (measured in
      <b>radians</b>) it's almost one. Its Taylor series is</p>
      <div class="formula" data-derivation="pendulum-sine-series" style="margin:8px 0">
        <div class="formula-body" style="font-size:14px">sinθ = θ − θ³/6 + θ⁵/120 − …</div>
        <div class="formula-note">When θ is small, θ³ is <i>tiny</i> (0.2³ ≈ 0.008), so the
        first dropped term is negligible and <b>sinθ ≈ θ</b>. The clean formula simply replaces
        sinθ with θ to make the equation linear — that swap is the <i>only</i> reason T₀ works.</div>
      </div>
      <p>As θ grows, sinθ falls noticeably below θ, so the true restoring pull is <b>weaker</b>
      than the straight-line guess — the bob is lazier near the turning points, takes longer to
      come back, and the period stretches. The approximation, and the formula built on it,
      quietly fail.</p>
      <div class="readout">
        <div><span>At your θ₀ = ${this.params.angle.toFixed(0)}°&nbsp;&nbsp;θ (rad)</span><b>${a0r}</b></div>
        <div><span>sin θ</span><b>${sinA0}</b></div>
        <div><span>True pull weaker than θ by</span><b>${weakerPct}%</b></div>
        <div><span>⇒ real period slower by</span><b>${slowPct}%</b></div>
      </div>
      <table class="cmp-table">
        <tr><th>θ₀</th><th>sinθ vs θ</th><th>pull weaker by</th><th>period slower by</th></tr>
        <tr><td>5°</td><td>0.0872 vs 0.0873</td><td>0.1%</td><td>~0.05%</td></tr>
        <tr><td>20°</td><td>0.342 vs 0.349</td><td>2.0%</td><td>~0.8%</td></tr>
        <tr><td>45°</td><td>0.707 vs 0.785</td><td>9.9%</td><td>~4%</td></tr>
        <tr><td>90°</td><td>1.000 vs 1.571</td><td>36%</td><td>~18%</td></tr>
        <tr><td>160°</td><td>0.342 vs 2.793</td><td>88%</td><td>~73%</td></tr>
      </table>
      <p class="example">Set θ₀ small (say 5–10°) and the blue (real) and green (ideal) curves
      sit right on top of each other. Crank θ₀ toward 160° and watch the blue curve fall behind:
      that gap <i>is</i> the sinθ ≈ θ approximation breaking down.</p>

      <h3>The real pendulum is nonlinear</h3>
      <p>Keep the honest <b>sinθ</b> and the equation <b>θ'' = −(g/L)·sinθ</b> can no longer be
      solved with a tidy sine wave — we integrate it numerically with RK4, and its exact period
      needs the elliptic integral K. There's no single "period" that's independent of amplitude
      any more; T₀ is just the limit as the swing shrinks to nothing.</p>

      <h3>Energy &amp; damping</h3>
      <p>With no air damping, kinetic and potential energy trade back and forth but the total
      stays put (watch it hold steady). Add damping and each swing loses energy, so the
      amplitude decays toward rest.</p>

      <p class="example"><b>Try:</b> set θ₀ = 10° vs 160° and compare T (amplitude effect) ·
      switch the world to Moon and watch T grow · double L and confirm T scales by √ ·
      change mass and see the period <i>not</i> move (until you add damping).</p>`);
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.graph = new THREE.Group();
  }
}
