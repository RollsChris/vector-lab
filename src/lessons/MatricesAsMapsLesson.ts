import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { arrow2D, updateArrow, segment, textSprite, tip } from "./helpers";
import {
  matrix2Det,
  basisImages,
  unitSquareImage,
  flipsOrientation,
  type Matrix2,
} from "../math/matrices2";

/**
 * Matrices as Maps.
 *
 * The four entries of a 2×2 matrix are sliders. The unit square deforms live into the
 * parallelogram its columns span; the basis images î → (a, c) and ĵ → (b, d) are drawn as
 * arrows, and the determinant is reported as the signed area of the deformed square.
 */
export class MatricesAsMapsLesson implements Lesson {
  readonly id = "matrices-as-maps";
  readonly title = "Matrices as Maps";
  readonly blurb = "A 2×2 matrix bends the plane";
  readonly category = "Foundations" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["vectors", "coordinates-and-lines"] as const;

  private group = new THREE.Group();
  private gui!: GUI;
  private setInfo!: (html: string) => void;

  private square!: THREE.Mesh;
  private iArrow!: THREE.Group;
  private jArrow!: THREE.Group;
  private iLabel!: THREE.Sprite;
  private jLabel!: THREE.Sprite;

  private readonly params = {
    a: 1,
    b: 0.5,
    c: 0.25,
    d: 1,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 0, 0));

    this.buildGrid();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18), 3));
    this.square = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x7ee787, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false,
    }));
    this.iArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), 0xff7b72);
    this.jArrow = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), 0x79c0ff);
    this.iLabel = textSprite("î", 0xff7b72, 0.45);
    this.jLabel = textSprite("ĵ", 0x79c0ff, 0.45);
    this.group.add(this.square, this.iArrow, this.jArrow, this.iLabel, this.jLabel);

    this.buildControls();
    this.rebuild();
  }

  exit(): void {
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(12, 12, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    this.group.add(grid);
    this.group.add(segment(new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0), 0x8b949e));
    this.group.add(segment(new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 6, 0), 0x8b949e));
    // Faint outline of the original unit square for reference.
    const ref = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 1, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x484f58 }),
    );
    this.group.add(ref);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "a", -3, 3, 0.1).name("a  (î x)"), "Top-left. Where î lands horizontally.").onChange(() => this.rebuild());
    tip(g.add(this.params, "c", -3, 3, 0.1).name("c  (î y)"), "Bottom-left. Where î lands vertically.").onChange(() => this.rebuild());
    tip(g.add(this.params, "b", -3, 3, 0.1).name("b  (ĵ x)"), "Top-right. Where ĵ lands horizontally.").onChange(() => this.rebuild());
    tip(g.add(this.params, "d", -3, 3, 0.1).name("d  (ĵ y)"), "Bottom-right. Where ĵ lands vertically.").onChange(() => this.rebuild());
  }

  private matrix(): Matrix2 {
    return { a: this.params.a, b: this.params.b, c: this.params.c, d: this.params.d };
  }

  private rebuild(): void {
    const m = this.matrix();
    const corners = unitSquareImage(m); // (0,0),(1,0),(1,1),(0,1)
    const pos = this.square.geometry.getAttribute("position") as THREE.BufferAttribute;
    // Two triangles: 0-1-2 and 0-2-3.
    pos.setXYZ(0, corners[0].x, corners[0].y, 0);
    pos.setXYZ(1, corners[1].x, corners[1].y, 0);
    pos.setXYZ(2, corners[2].x, corners[2].y, 0);
    pos.setXYZ(3, corners[0].x, corners[0].y, 0);
    pos.setXYZ(4, corners[2].x, corners[2].y, 0);
    pos.setXYZ(5, corners[3].x, corners[3].y, 0);
    pos.needsUpdate = true;
    this.square.geometry.computeBoundingSphere();

    const { i, j } = basisImages(m);
    updateArrow(this.iArrow, new THREE.Vector3(0, 0, 0.02), new THREE.Vector3(i.x, i.y, 0.02));
    updateArrow(this.jArrow, new THREE.Vector3(0, 0, 0.02), new THREE.Vector3(j.x, j.y, 0.02));
    this.iLabel.position.set(i.x + 0.25, i.y + 0.25, 0.1);
    this.jLabel.position.set(j.x + 0.25, j.y + 0.25, 0.1);

    const det = matrix2Det(m);
    (this.square.material as THREE.MeshBasicMaterial).color.set(det < 0 ? 0xff7b72 : 0x7ee787);

    this.renderInfo(m, det);
  }

  private renderInfo(m: Matrix2, det: number): void {
    const flipped = flipsOrientation(m);
    this.setInfo(`
      <h2>Matrices as Maps</h2>
      <p>A 2×2 matrix is a <b>machine that moves every point</b> of the plane. All it really
      records is where the two basis arrows land: î goes to the first column, ĵ to the second.
      Everything else follows.</p>
      <div class="readout">
        <div><span>Matrix</span><b>[ ${this.fmt(m.a)}, ${this.fmt(m.b)} ; ${this.fmt(m.c)}, ${this.fmt(m.d)} ]</b></div>
        <div><span>î lands at</span><b>(${this.fmt(m.a)}, ${this.fmt(m.c)})</b></div>
        <div><span>ĵ lands at</span><b>(${this.fmt(m.b)}, ${this.fmt(m.d)})</b></div>
        <div><span>Determinant</span><b>${this.fmt(det)}</b></div>
        <div><span>Orientation</span><b>${flipped ? "flipped (mirror)" : Math.abs(det) < 1e-9 ? "collapsed to a line" : "preserved"}</b></div>
      </div>
      <div class="course">
        <h3>The determinant is an area</h3>
        <p>The unit square has area 1. After the map it becomes a parallelogram whose area is
        exactly the <b>determinant</b>. A determinant of 2 doubles areas; a determinant of 0
        squashes the square flat onto a line; a <b>negative</b> determinant means the plane was
        flipped over, like a mirror.</p>
        <p>Because the map is linear, whatever it does to the unit square it does to every shape:
        the same area scale factor applies everywhere.</p>
      </div>
      <p class="example"><b>Try it:</b> set b = 1 and c = 1 with a = d = 0. The square flips and
      the determinant reads −1 — that is a reflection swapping the axes.</p>
    `);
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return parseFloat(n.toFixed(2)).toString();
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
