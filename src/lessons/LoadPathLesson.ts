import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip, heat, textSprite, setSpriteText } from "./helpers";
import "./formulaDerivations/physics";

const RAD2DEG = 180 / Math.PI;

/**
 * Lesson 17 — Forces, Angles & Load Paths (statics).
 *
 * A weight hangs from a knot held by two angled cables that run up to the tops of two
 * columns. This single picture teaches two big ideas the pulley lesson hinted at:
 *
 *   1. Resolving a force at an angle. A cable tension T at angle θ has a horizontal part
 *      T·cosθ and a vertical part T·sinθ. At the knot all forces must cancel (ΣFx = 0,
 *      ΣFy = 0), which lets us solve both cable tensions. Shallow cables ⇒ huge tension
 *      (T = W / (2·sinθ) when symmetric) — why a tight rope can snap its anchors.
 *
 *   2. The load path to the ground. The vertical components of the two tensions add back
 *      up to the full weight and travel down the columns into the ground: V_L + V_R = W.
 *      The horizontal components are a sideways thrust the foundation must resist.
 *
 * The user drags the weight's position and the cable sag and watches every force — at the
 * knot, in the cables, down the columns, and into the ground — update live.
 */
export class LoadPathLesson implements Lesson {
  readonly id = "load-paths";
  readonly title = "17 · Forces & Load Paths";
  readonly blurb = "Angled cables → the ground";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["newtons-laws", "vectors"] as const;

  private group = new THREE.Group();
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;

  // Fixed geometry.
  private readonly a = 3.4; // half-distance between the two columns
  private readonly h = 3.0; // height of the cable anchors (column tops)
  private readonly groundY = -3.2;

  // Scene parts.
  private cableL!: THREE.Line;
  private cableR!: THREE.Line;
  private knot!: THREE.Mesh;
  private weight!: THREE.Mesh;
  private weightLabel!: THREE.Sprite;
  private columnL!: THREE.Mesh;
  private columnR!: THREE.Mesh;

  // Force arrows.
  private aWeight!: THREE.ArrowHelper;
  private aTensionL!: THREE.ArrowHelper;
  private aTensionR!: THREE.ArrowHelper;
  private aColLoadL!: THREE.ArrowHelper;
  private aColLoadR!: THREE.ArrowHelper;
  private aReactL!: THREE.ArrowHelper;
  private aReactR!: THREE.ArrowHelper;
  private aThrustL!: THREE.ArrowHelper;
  private aThrustR!: THREE.ArrowHelper;
  // Component arrows (toggleable): horizontal + vertical parts of each tension.
  private aCompLx!: THREE.ArrowHelper;
  private aCompLy!: THREE.ArrowHelper;
  private aCompRx!: THREE.ArrowHelper;
  private aCompRy!: THREE.ArrowHelper;

  private labels: THREE.Sprite[] = [];

  private readonly params = {
    weight: 200, // N
    knotX: 0, // horizontal position of the knot
    sag: 2.2, // how far the knot drops below the anchor line
    showComponents: true,
    reset: () => {
      this.params.knotX = 0;
      this.params.sag = 2.2;
    },
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0.4, 16),
      new THREE.Vector3(0, 0.2, 0),
    );

    // Ground.
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.4, 3),
      new THREE.MeshStandardMaterial({ color: 0x2d333b }),
    );
    ground.position.set(0, this.groundY - 0.2, 0);
    this.group.add(ground);

    // Columns (supports) from the ground up to the anchors.
    const colGeo = new THREE.BoxGeometry(0.5, this.h - this.groundY, 0.5);
    const colMat = () =>
      new THREE.MeshStandardMaterial({ color: 0x8b949e, metalness: 0.2, roughness: 0.6 });
    this.columnL = new THREE.Mesh(colGeo, colMat());
    this.columnR = new THREE.Mesh(colGeo.clone(), colMat());
    this.columnL.position.set(-this.a, (this.h + this.groundY) / 2, 0);
    this.columnR.position.set(this.a, (this.h + this.groundY) / 2, 0);
    this.group.add(this.columnL, this.columnR);

    // Anchor caps.
    for (const sx of [-this.a, this.a]) {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xc9d1d9 }),
      );
      cap.position.set(sx, this.h, 0);
      this.group.add(cap);
    }

    // Cables.
    this.cableL = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffd166 }),
    );
    this.cableR = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffd166 }),
    );
    this.group.add(this.cableL, this.cableR);

    // Knot + weight.
    this.knot = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x888888 }),
    );
    this.group.add(this.knot);
    this.weight = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x539bf5, metalness: 0.3, roughness: 0.5 }),
    );
    this.group.add(this.weight);
    this.weightLabel = textSprite("200 N", 0xffffff, 0.5);
    this.group.add(this.weightLabel);

    // Build all force arrows up front; we just move/scale them each update.
    const mk = (color: number, head = 0.35, headW = 0.22) =>
      new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, color, head, headW);
    this.aWeight = mk(0xf0f6fc);
    this.aTensionL = mk(0xffa657);
    this.aTensionR = mk(0xffa657);
    this.aColLoadL = mk(0xff7b72, 0.28, 0.18);
    this.aColLoadR = mk(0xff7b72, 0.28, 0.18);
    this.aReactL = mk(0x7ee787);
    this.aReactR = mk(0x7ee787);
    this.aThrustL = mk(0xd2a8ff, 0.28, 0.18);
    this.aThrustR = mk(0xd2a8ff, 0.28, 0.18);
    this.aCompLx = mk(0x79c0ff, 0.22, 0.14);
    this.aCompLy = mk(0x79c0ff, 0.22, 0.14);
    this.aCompRx = mk(0x79c0ff, 0.22, 0.14);
    this.aCompRy = mk(0x79c0ff, 0.22, 0.14);
    this.group.add(
      this.aWeight,
      this.aTensionL,
      this.aTensionR,
      this.aColLoadL,
      this.aColLoadR,
      this.aReactL,
      this.aReactR,
      this.aThrustL,
      this.aThrustR,
      this.aCompLx,
      this.aCompLy,
      this.aCompRx,
      this.aCompRy,
    );

    // Floating numeric labels for the key forces.
    for (let i = 0; i < 5; i++) {
      const s = textSprite("", 0xffffff, 0.42);
      this.labels.push(s);
      this.group.add(s);
    }

    const g = ctx.gui;
    tip(
      g.add(this.params, "weight", 50, 500, 10).name("Weight W (N)").onChange(() => this.update()),
      "The hanging load. Its weight must be carried all the way to the ground.",
    );
    tip(
      g.add(this.params, "knotX", -3, 3, 0.1).name("Weight position").onChange(() => this.update()),
      "Slide the weight left/right. Off-centre makes the two cable tensions unequal.",
    );
    tip(
      g.add(this.params, "sag", 0.5, 4, 0.05).name("Cable sag").onChange(() => this.update()),
      "How far the knot hangs below the anchors. Less sag = flatter cables = much higher tension.",
    );
    tip(
      g.add(this.params, "showComponents").name("Show H/V components").onChange(() => this.update()),
      "Break each cable tension into its horizontal and vertical parts (blue).",
    );
    tip(g.add(this.params, "reset").name("Reset"), "Centre the weight at the default sag.");

    this.stopTick = ctx.viewport.onTick(() => {});
    this.update();
  }

  /** Solve the static equilibrium of the knot and the load path to the ground. */
  private compute() {
    const W = this.params.weight;
    const kx = this.params.knotX;
    const ky = this.h - this.params.sag;

    // Unit vectors from the knot toward each anchor (the direction each cable pulls).
    const dLx = -this.a - kx;
    const dLy = this.h - ky;
    const dRx = this.a - kx;
    const dRy = this.h - ky;
    const lenL = Math.hypot(dLx, dLy);
    const lenR = Math.hypot(dRx, dRy);
    const uLx = dLx / lenL;
    const uLy = dLy / lenL;
    const uRx = dRx / lenR;
    const uRy = dRy / lenR;

    // Knot equilibrium:  T_L·uL + T_R·uR = (0, W)   (cables hold up the weight W).
    //   T_L·uLx + T_R·uRx = 0
    //   T_L·uLy + T_R·uRy = W
    const det = uLx * uRy - uRx * uLy;
    const TL = (-uRx * W) / det;
    const TR = (uLx * W) / det;

    // Angles of each cable from the horizontal.
    const thetaL = Math.atan2(dLy, Math.abs(dLx)) * RAD2DEG;
    const thetaR = Math.atan2(dRy, Math.abs(dRx)) * RAD2DEG;

    // Components and the load travelling down each column.
    const VL = TL * uLy; // vertical pull on the left anchor = load into the left column
    const VR = TR * uRy;
    const HL = Math.abs(TL * uLx); // horizontal thrust each base must resist
    const HR = Math.abs(TR * uRx);

    return {
      W, kx, ky,
      uLx, uLy, uRx, uRy,
      TL, TR, thetaL, thetaR,
      VL, VR, HL, HR,
      knot: new THREE.Vector3(kx, ky, 0),
      anchorL: new THREE.Vector3(-this.a, this.h, 0),
      anchorR: new THREE.Vector3(this.a, this.h, 0),
    };
  }

  /** Newtons → world length, with the weight arrow ≈ 1.6 units and a sane clamp. */
  private forceScale(): number {
    return 1.6 / this.params.weight;
  }

  private setArrow(
    arrow: THREE.ArrowHelper,
    origin: THREE.Vector3,
    fx: number,
    fy: number,
  ): void {
    const mag = Math.hypot(fx, fy);
    if (mag < 1e-6) {
      arrow.visible = false;
      return;
    }
    arrow.visible = true;
    arrow.position.copy(origin);
    arrow.setDirection(new THREE.Vector3(fx / mag, fy / mag, 0));
    const len = THREE.MathUtils.clamp(mag * this.forceScale(), 0.25, 4.5);
    arrow.setLength(len, Math.min(0.32, len * 0.35), Math.min(0.2, len * 0.25));
  }

  private update(): void {
    const c = this.compute();

    // Knot + weight + cables.
    this.knot.position.copy(c.knot);
    this.weight.position.set(c.kx, c.ky - 0.85, 0);
    this.weightLabel.position.set(c.kx + 0.95, c.ky - 0.85, 0.5);
    setSpriteText(this.weightLabel, `${c.W.toFixed(0)} N`, 0xffffff);
    this.cableL.geometry.setFromPoints([c.knot, c.anchorL]);
    this.cableR.geometry.setFromPoints([c.knot, c.anchorR]);

    // Colour cables + columns by how much force they carry (relative to the weight).
    const maxT = Math.max(c.TL, c.TR, c.W);
    (this.cableL.material as THREE.LineBasicMaterial).color.copy(heat(c.TL / maxT));
    (this.cableR.material as THREE.LineBasicMaterial).color.copy(heat(c.TR / maxT));
    (this.columnL.material as THREE.MeshStandardMaterial).color.copy(heat(c.VL / c.W));
    (this.columnR.material as THREE.MeshStandardMaterial).color.copy(heat(c.VR / c.W));

    // Forces at the knot: weight pulls down; cables pull toward their anchors.
    this.setArrow(this.aWeight, c.knot, 0, -c.W);
    this.setArrow(this.aTensionL, c.knot, c.TL * c.uLx, c.TL * c.uLy);
    this.setArrow(this.aTensionR, c.knot, c.TR * c.uRx, c.TR * c.uRy);

    // Components of each tension (toggle).
    const showC = this.params.showComponents;
    this.aCompLx.visible = this.aCompLy.visible = showC;
    this.aCompRx.visible = this.aCompRy.visible = showC;
    if (showC) {
      this.setArrow(this.aCompLx, c.knot, c.TL * c.uLx, 0);
      this.setArrow(this.aCompLy, c.knot, 0, c.TL * c.uLy);
      this.setArrow(this.aCompRx, c.knot, c.TR * c.uRx, 0);
      this.setArrow(this.aCompRy, c.knot, 0, c.TR * c.uRy);
    }

    // Load travelling DOWN each column (compression), drawn mid-column.
    const midL = new THREE.Vector3(-this.a, (this.h + this.groundY) / 2 + 0.6, 0);
    const midR = new THREE.Vector3(this.a, (this.h + this.groundY) / 2 + 0.6, 0);
    this.setArrow(this.aColLoadL, midL, 0, -c.VL);
    this.setArrow(this.aColLoadR, midR, 0, -c.VR);

    // Ground reactions: vertical (up) supports the load, horizontal resists the thrust.
    const baseL = new THREE.Vector3(-this.a, this.groundY, 0);
    const baseR = new THREE.Vector3(this.a, this.groundY, 0);
    this.setArrow(this.aReactL, baseL, 0, c.VL);
    this.setArrow(this.aReactR, baseR, 0, c.VR);
    // Cables pull the column tops inward, so each base is pushed outward — the foundation
    // resists by pushing back inward (toward the centre).
    this.setArrow(this.aThrustL, baseL, c.HL, 0); // points +x (inward) on the left base
    this.setArrow(this.aThrustR, baseR, -c.HR, 0); // points -x (inward) on the right base

    // Labels.
    this.placeLabel(0, `T_L ${c.TL.toFixed(0)} N`, c.knot.clone().lerp(c.anchorL, 0.5).add(new THREE.Vector3(-0.2, 0.35, 0)), 0xffa657);
    this.placeLabel(1, `T_R ${c.TR.toFixed(0)} N`, c.knot.clone().lerp(c.anchorR, 0.5).add(new THREE.Vector3(0.2, 0.35, 0)), 0xffa657);
    this.placeLabel(2, `${c.VL.toFixed(0)} N`, baseL.clone().add(new THREE.Vector3(-0.95, 0.5, 0)), 0x7ee787);
    this.placeLabel(3, `${c.VR.toFixed(0)} N`, baseR.clone().add(new THREE.Vector3(0.95, 0.5, 0)), 0x7ee787);
    this.placeLabel(4, `V_L+V_R = ${(c.VL + c.VR).toFixed(0)} N = W`, new THREE.Vector3(0, this.groundY + 0.55, 0), 0x7ee787);

    this.renderInfo(c);
  }

  private placeLabel(i: number, text: string, pos: THREE.Vector3, color: number): void {
    const s = this.labels[i];
    setSpriteText(s, text, color);
    s.position.copy(pos);
  }

  private renderInfo(c: ReturnType<LoadPathLesson["compute"]>): void {
    const sum = c.VL + c.VR;
    this.setInfo(`
      <h2>Forces, Angles &amp; Load Paths</h2>
      <div class="formula" data-derivation="load-path-equilibrium">
        <div class="formula-label">Resolve, then balance</div>
        <div class="formula-body">F<sub>x</sub> = T·cosθ&nbsp;·&nbsp;F<sub>y</sub> = T·sinθ&nbsp;&nbsp;→&nbsp;&nbsp;ΣF<sub>x</sub> = 0,&nbsp; ΣF<sub>y</sub> = 0</div>
      </div>
      <div class="readout">
        <div><span>Weight W</span><b>${c.W.toFixed(0)} N</b></div>
        <div><span>Left cable angle θ_L</span><b>${c.thetaL.toFixed(1)}°</b></div>
        <div><span>Right cable angle θ_R</span><b>${c.thetaR.toFixed(1)}°</b></div>
        <div><span>Left tension T_L</span><b>${c.TL.toFixed(1)} N</b></div>
        <div><span>Right tension T_R</span><b>${c.TR.toFixed(1)} N</b></div>
        <div><span>Into left column V_L</span><b>${c.VL.toFixed(1)} N</b></div>
        <div><span>Into right column V_R</span><b>${c.VR.toFixed(1)} N</b></div>
        <div><span>V_L + V_R</span><b>${sum.toFixed(1)} N = W ✓</b></div>
        <div><span>Sideways thrust per base</span><b>${c.HL.toFixed(1)} N</b></div>
      </div>

      <h3>1 · A force at an angle has two parts</h3>
      <p>A cable pulling with tension T at angle θ above horizontal does two jobs at once:
      it pulls <b>sideways</b> with T·cosθ and <b>upwards</b> with T·sinθ. Turn on
      <b>Show H/V components</b> to see each tension split into its blue horizontal and
      vertical arrows.</p>

      <h3>2 · The knot must balance</h3>
      <p>The knot isn't moving, so every force on it cancels. Horizontally the two cables'
      side-pulls must be equal and opposite (ΣF<sub>x</sub> = 0); vertically their upward
      parts must add up to the weight (ΣF<sub>y</sub> = 0). Those two equations fix both
      tensions. Slide the weight off-centre and watch T_L and T_R diverge.</p>

      <h3>3 · Shallow cables, brutal tension</h3>
      <p>When the cables are flat (small θ) only a sliver of each tension points upward, so
      the tension has to be enormous to add up to W. Symmetrically
      <b>T = W / (2·sinθ)</b> → as θ → 0, T → ∞. Drop the <b>sag</b> and watch the cables
      turn red. This is why you can't pull a clothesline perfectly straight, and why guy-wires
      snap their anchors.</p>

      <h3>4 · Follow the load to the ground</h3>
      <p>The upward parts of the tensions are really the weight, repackaged: they press
      <b>down through the columns</b> (red arrows) and into the ground, where the two green
      reactions <b>V_L + V_R add back up to the full weight W</b>. Nothing is lost — the
      structure just splits the load between its supports. The leftover horizontal pulls
      (purple) are a <b>thrust</b> the foundation must resist, or the columns would splay
      outward.</p>

      <p class="example"><b>Try:</b> centre the weight (equal tensions, equal reactions) ·
      slide it toward one column (that side takes more) · cut the sag to feel tension explode
      while the ground reactions still only ever sum to W.</p>`);
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.labels = [];
  }
}
