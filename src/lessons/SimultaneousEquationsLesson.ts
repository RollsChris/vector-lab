import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { marker, segment, updateSegment, tip } from "./helpers";
import { solveLinear2 } from "../math/functionsGraphs";

/**
 * Simultaneous Equations.
 *
 * Two lines in the form a·x + b·y = c with sliders for each coefficient. Their
 * intersection is marked live, and the panel classifies the system as one solution,
 * parallel (none) or coincident (infinitely many).
 */
export class SimultaneousEquationsLesson implements Lesson {
  readonly id = "simultaneous-equations";
  readonly title = "Simultaneous Equations";
  readonly blurb = "Where two lines meet is the shared solution";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["coordinates-and-lines", "rearranging-equations"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private line1!: THREE.Line;
  private line2!: THREE.Line;
  private hit = marker(0xffd166, 0.18);

  private readonly params = {
    a1: 1, b1: 1, c1: 4,
    a2: 1, b2: -1, c2: 0,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 15), new THREE.Vector3(0, 0, 0));

    this.buildGrid();
    this.line1 = segment(new THREE.Vector3(), new THREE.Vector3(), 0xff7b72);
    this.line2 = segment(new THREE.Vector3(), new THREE.Vector3(), 0x79c0ff);
    this.group.add(this.line1, this.line2, this.hit);

    this.buildControls();
    this.update();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 16, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    this.group.add(grid);
    this.group.add(segment(new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -8, 0), new THREE.Vector3(0, 8, 0), 0x8b949e));
  }

  private buildControls(): void {
    const g = this.gui;
    const f1 = g.addFolder("Line 1 (red): a₁x + b₁y = c₁");
    tip(f1.add(this.params, "a1", -5, 5, 0.5).name("a₁"), "x-coefficient of line 1").onChange(() => this.update());
    tip(f1.add(this.params, "b1", -5, 5, 0.5).name("b₁"), "y-coefficient of line 1").onChange(() => this.update());
    tip(f1.add(this.params, "c1", -10, 10, 0.5).name("c₁"), "constant of line 1").onChange(() => this.update());
    f1.open();
    const f2 = g.addFolder("Line 2 (blue): a₂x + b₂y = c₂");
    tip(f2.add(this.params, "a2", -5, 5, 0.5).name("a₂"), "x-coefficient of line 2").onChange(() => this.update());
    tip(f2.add(this.params, "b2", -5, 5, 0.5).name("b₂"), "y-coefficient of line 2").onChange(() => this.update());
    tip(f2.add(this.params, "c2", -10, 10, 0.5).name("c₂"), "constant of line 2").onChange(() => this.update());
    f2.open();
  }

  /** Endpoints of the line a·x + b·y = c across the visible window. */
  private endpoints(a: number, b: number, c: number): [THREE.Vector3, THREE.Vector3] {
    if (Math.abs(b) >= Math.abs(a)) {
      // Solve for y at the left/right edges.
      if (Math.abs(b) < 1e-9) return [new THREE.Vector3(), new THREE.Vector3()];
      return [
        new THREE.Vector3(-8, (c - a * -8) / b, 0),
        new THREE.Vector3(8, (c - a * 8) / b, 0),
      ];
    }
    // Steeper: solve for x at the top/bottom edges.
    return [
      new THREE.Vector3((c - b * -8) / a, -8, 0),
      new THREE.Vector3((c - b * 8) / a, 8, 0),
    ];
  }

  private update(): void {
    const p = this.params;
    updateSegment(this.line1, ...this.endpoints(p.a1, p.b1, p.c1));
    updateSegment(this.line2, ...this.endpoints(p.a2, p.b2, p.c2));

    const sol = solveLinear2(p.a1, p.b1, p.c1, p.a2, p.b2, p.c2);
    if (sol.type === "unique") {
      this.hit.visible = true;
      this.hit.position.set(
        THREE.MathUtils.clamp(sol.x!, -8, 8),
        THREE.MathUtils.clamp(sol.y!, -8, 8),
        0.08,
      );
    } else {
      this.hit.visible = false;
    }

    this.renderInfo(sol);
  }

  private renderInfo(sol: ReturnType<typeof solveLinear2>): void {
    const p = this.params;
    let verdict = "";
    if (sol.type === "unique") {
      verdict = `<div><span>Solution</span><b>x = ${this.fmt(sol.x!)}, y = ${this.fmt(sol.y!)}</b></div>
        <div><span>Type</span><b>One intersection</b></div>`;
    } else if (sol.type === "none") {
      verdict = `<div><span>Solution</span><b>None</b></div>
        <div><span>Type</span><b>Parallel — never meet</b></div>`;
    } else {
      verdict = `<div><span>Solution</span><b>Infinitely many</b></div>
        <div><span>Type</span><b>Same line (coincident)</b></div>`;
    }

    this.setInfo(`
      <h2>Simultaneous Equations</h2>
      <p>Two equations, one shared answer. Each line is every <code>(x, y)</code> that fits
      that equation; the point where they cross fits <b>both</b> at once.</p>
      <div class="readout">
        <div><span>Line 1 (red)</span><b>${this.fmt(p.a1)}x + ${this.fmt(p.b1)}y = ${this.fmt(p.c1)}</b></div>
        <div><span>Line 2 (blue)</span><b>${this.fmt(p.a2)}x + ${this.fmt(p.b2)}y = ${this.fmt(p.c2)}</b></div>
        ${verdict}
      </div>
      <div class="course">
        <h3>Three things that can happen</h3>
        <ul>
          <li><b>One solution</b> — the lines cross once. Most systems look like this.</li>
          <li><b>No solution</b> — the lines are parallel (same gradient, different height),
          so they never meet.</li>
          <li><b>Infinite solutions</b> — the two equations describe the <i>same</i> line, so
          every point on it works.</li>
        </ul>
        <p>Algebraically the test is the determinant <code>a₁b₂ − a₂b₁</code>: when it is zero
        the lines are parallel or identical.</p>
      </div>
      <p class="example"><b>Try it:</b> set line 2 to <code>2x + 2y = 8</code> while line 1 is
      <code>x + y = 4</code> — same line, infinitely many solutions.</p>
    `);
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return parseFloat(n.toFixed(3)).toString();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    group.clear();
  }
}
