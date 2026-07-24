import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip, heat, textSprite, setSpriteText } from "./helpers";
import "./formulaDerivations/physics";

interface Material {
  name: string;
  E: number; // Young's modulus (GPa)
  yield: number; // yield strength (MPa)
  color: number;
}

const MATERIALS: Record<string, Material> = {
  Steel: { name: "Steel", E: 200, yield: 250, color: 0x9aa7b4 },
  Aluminium: { name: "Aluminium", E: 69, yield: 95, color: 0xc7ccd1 },
  Titanium: { name: "Titanium", E: 116, yield: 880, color: 0xb0a8c0 },
  Copper: { name: "Copper", E: 117, yield: 70, color: 0xc77b46 },
  Rubber: { name: "Rubber", E: 0.05, yield: 15, color: 0x3a3a3a },
};

/**
 * Lesson 19 — Forces, Stress & Strain (mechanical engineering).
 * An axial bar fixed at the left is pulled by a force. We compute engineering stress
 * σ = F/A, strain ε = σ/E (Hooke's law), elongation ΔL = ε·L0, and a safety factor
 * against the material's yield strength. The bar stretches and recolours by stress, and
 * a live stress–strain graph plots the operating point against the yield line.
 */
export class StressStrainLesson implements Lesson {
  readonly id = "stress-strain";
  readonly title = "19 · Stress & Strain";
  readonly blurb = "Pull a bar: σ = E·ε";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["newtons-laws"] as const;

  private group = new THREE.Group();
  private bar!: THREE.Mesh;
  private forceArrow!: THREE.ArrowHelper;
  private graph = new THREE.Group();
  private opPoint!: THREE.Mesh;
  private lineMat!: THREE.LineBasicMaterial;
  private opLabel!: THREE.Sprite;
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;

  private readonly barBaseLen = 4; // world units representing L0
  private readonly barX0 = -5; // fixed (left) end of the bar in world x
  private readonly visualGain = 25; // exaggerate tiny elastic strains so they're visible

  private readonly params = {
    material: "Steel",
    force: 20, // kN
    area: 100, // mm^2
    length: 1000, // mm
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 3, 14),
      new THREE.Vector3(0, 0.5, 0),
    );

    // Fixed wall at the left end.
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3, 3),
      new THREE.MeshStandardMaterial({ color: 0x30363d }),
    );
    wall.position.set(this.barX0 - 0.2, 1.4, 0);
    this.group.add(wall);

    // The bar (scaled in x to show elongation; pivot kept at the fixed end).
    this.bar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0.2, roughness: 0.5 }),
    );
    this.group.add(this.bar);

    this.forceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1.5,
      0xff5d5d,
      0.4,
      0.25,
    );
    this.group.add(this.forceArrow);

    this.buildGraph();
    this.group.add(this.graph);

    const g = ctx.gui;
    tip(
      g.add(this.params, "material", Object.keys(MATERIALS)).name("Material"),
      "Each material has a different stiffness E and yield strength.",
    );
    tip(
      g.add(this.params, "force", 0, 100, 1).name("Force F (kN)"),
      "Axial pull applied to the bar.",
    );
    tip(
      g.add(this.params, "area", 10, 400, 5).name("Area A (mm²)"),
      "Cross-section area. Bigger area → lower stress for the same force.",
    );
    tip(
      g.add(this.params, "length", 200, 2000, 50).name("Length L₀ (mm)"),
      "Original (unloaded) length. Elongation ΔL scales with L₀.",
    );

    this.stopTick = ctx.viewport.onTick(() => this.update());
    this.update();
  }

  /** Compute the engineering quantities from the current sliders. */
  private compute() {
    const mat = MATERIALS[this.params.material];
    const F = this.params.force * 1000; // kN -> N
    const A = this.params.area * 1e-6; // mm^2 -> m^2
    const L0 = this.params.length / 1000; // mm -> m
    const stress = F / A / 1e6; // Pa -> MPa
    const strain = stress / (mat.E * 1000); // ε = σ/E, E in MPa (GPa*1000)
    const elong = strain * L0 * 1000; // m -> mm
    const safety = stress > 0 ? mat.yield / stress : Infinity;
    return { mat, stress, strain, elong, safety, yielded: stress > mat.yield };
  }

  private buildGraph(): void {
    const ox = 1.5; // graph origin x
    const oy = -2.5; // graph origin y
    const w = 5;
    const h = 4;

    // Axes.
    const axisMat = new THREE.LineBasicMaterial({ color: 0x6e7681 });
    const axes = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ox, oy + h, 0),
      new THREE.Vector3(ox, oy, 0),
      new THREE.Vector3(ox + w, oy, 0),
    ]);
    this.graph.add(new THREE.Line(axes, axisMat));

    const yLabel = textSprite("σ stress", 0xc9d1d9, 0.45);
    yLabel.position.set(ox + 1.0, oy + h + 0.3, 0);
    this.graph.add(yLabel);
    const xLabel = textSprite("ε strain", 0xc9d1d9, 0.45);
    xLabel.position.set(ox + w - 0.6, oy - 0.4, 0);
    this.graph.add(xLabel);

    // The elastic (Hooke) line σ = E·ε, redrawn on update.
    this.lineMat = new THREE.LineBasicMaterial({ color: 0x539bf5 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ox, oy, 0),
      new THREE.Vector3(ox + w, oy + h, 0),
    ]);
    this.graph.add(new THREE.Line(lineGeo, this.lineMat));

    // Operating point marker.
    this.opPoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 }),
    );
    this.graph.add(this.opPoint);

    this.opLabel = textSprite("", 0xffffff, 0.4);
    this.graph.add(this.opLabel);

    this.graph.userData = { ox, oy, w, h };
  }

  private update(): void {
    const { mat, stress, strain, elong, safety, yielded } = this.compute();

    // Bar stretch: original length plus an exaggerated visual elongation.
    const visualLen = this.barBaseLen * (this.params.length / 1000);
    const stretched = visualLen * (1 + strain * this.visualGain);
    this.bar.scale.set(stretched, 1, 1);
    this.bar.position.set(this.barX0 + stretched / 2, 1.4, 0);

    // Colour the bar by how close it is to yield.
    const frac = mat.yield > 0 ? stress / mat.yield : 0;
    (this.bar.material as THREE.MeshStandardMaterial).color.copy(heat(frac));

    // Force arrow at the moving (right) end.
    const tipX = this.barX0 + stretched;
    this.forceArrow.position.set(tipX, 1.4, 0);
    this.forceArrow.setLength(0.5 + this.params.force / 25, 0.4, 0.25);

    // Plot the operating point. Scale axes so the yield point sits high on the graph.
    const { ox, oy, w, h } = this.graph.userData as {
      ox: number;
      oy: number;
      w: number;
      h: number;
    };
    const strainMax = (mat.yield / (mat.E * 1000)) * 1.4; // full-scale strain ≈ 1.4× yield strain
    const stressMax = mat.yield * 1.4;
    const sx = ox + THREE.MathUtils.clamp(strain / strainMax, 0, 1) * w;
    const sy = oy + THREE.MathUtils.clamp(stress / stressMax, 0, 1) * h;
    this.opPoint.position.set(sx, sy, 0);
    (this.opPoint.material as THREE.MeshStandardMaterial).color.copy(heat(frac));
    setSpriteText(this.opLabel, `${stress.toFixed(0)} MPa`, yielded ? 0xff7b72 : 0xffffff);
    this.opLabel.position.set(sx + 0.9, sy + 0.25, 0);

    // The Hooke line spans up to full-scale strain; its slope is E.
    this.lineMat.color.setHex(yielded ? 0xff7b72 : 0x539bf5);

    this.renderInfo(mat, stress, strain, elong, safety, yielded);
  }

  private renderInfo(
    mat: Material,
    stress: number,
    strain: number,
    elong: number,
    safety: number,
    yielded: boolean,
  ): void {
    const warn = yielded
      ? `<p class="err">⚠ Stress exceeds yield (${mat.yield} MPa) — the bar would deform
         permanently or break. Reduce force or increase area.</p>`
      : "";
    this.setInfo(`
      <h2>Forces · Stress · Strain</h2>
      <div class="formula" data-derivation="stress-strain">
        <div class="formula-label">Hooke's law (elastic region)</div>
        <div class="formula-body">σ = E · ε&nbsp;&nbsp;·&nbsp;&nbsp;σ = F / A&nbsp;&nbsp;·&nbsp;&nbsp;ΔL = ε · L₀</div>
      </div>
      <div class="readout">
        <div><span>Material</span><b>${mat.name}</b></div>
        <div><span>Young's modulus E</span><b>${mat.E} GPa</b></div>
        <div><span>Stress σ = F/A</span><b>${stress.toFixed(1)} MPa</b></div>
        <div><span>Strain ε = σ/E</span><b>${(strain * 100).toFixed(3)} %</b></div>
        <div><span>Elongation ΔL</span><b>${elong.toFixed(3)} mm</b></div>
        <div><span>Yield strength</span><b>${mat.yield} MPa</b></div>
        <div><span>Safety factor</span><b>${safety === Infinity ? "∞" : safety.toFixed(2)}</b></div>
      </div>
      ${warn}

      <h3>Stress σ</h3>
      <p>Force spread over the cross-section: <b>σ = F / A</b> (N/m² = Pa; we show MPa).
      The same pull on a thinner bar means higher stress — that's why area matters.</p>

      <h3>Strain ε</h3>
      <p>Fractional stretch: <b>ε = ΔL / L₀</b>. In the elastic region it's tied to stress by
      stiffness E: <b>ε = σ / E</b>. Stiffer materials (steel) strain less than soft ones (rubber).</p>

      <h3>The stress–strain line</h3>
      <p>The blue line is <b>σ = E·ε</b>; its slope <i>is</i> Young's modulus E. The white dot is
      your current operating point. Push past the yield line and it turns red — beyond yield the
      material no longer springs back.</p>

      <p class="example"><b>Try:</b> compare Steel vs Rubber at the same force (rubber strains
      hugely) · shrink the area to drive stress past yield · grow L₀ to see ΔL grow.</p>`);
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.graph = new THREE.Group();
  }
}
