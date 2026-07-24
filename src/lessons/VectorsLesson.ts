import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { VECTOR_DERIVATIONS } from "./formulaDerivations/foundations";
import { arrow2D, createDragControls, marker, textSprite, updateArrow, tip } from "./helpers";

registerFormulaDerivations("vectors", VECTOR_DERIVATIONS);

type Operation = "add" | "subtract" | "dot" | "cross" | "components";

const COLORS = {
  a: 0xff7b72,
  b: 0x79c0ff,
  result: 0x7ee787,
  projection: 0xffa657,
};

/**
 * Lesson: Vectors.
 *
 * Two draggable vectors A and B (tails pinned at the origin in 2D). Switch between
 * operations and watch the result redraw live. A 3D toggle lets the cross product
 * be visualised out of the plane.
 */
export class VectorsLesson implements Lesson {
  readonly id = "vectors";
  readonly title = "Vectors";
  readonly blurb = "Arrows with magnitude and direction";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["foundations"] as const;

  private group = new THREE.Group();
  private labels = new THREE.Group();
  private aHead!: THREE.Mesh;
  private bHead!: THREE.Mesh;
  private arrowA!: THREE.Group;
  private arrowB!: THREE.Group;
  private arrowResult!: THREE.Group;
  private arrowProj!: THREE.Group;
  private parallelogram!: THREE.Mesh;
  private crossMarker!: THREE.Mesh;
  private grid!: THREE.GridHelper;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private viewport!: LessonContext["viewport"];
  private stopDrag?: () => void;
  /** Component sliders, kept so a drag can push its new values back into the panel. */
  private componentCtrls: { updateDisplay: () => void }[] = [];

  private params = {
    ax: 3,
    ay: 1,
    bx: 1,
    by: 2,
    operation: "add" as Operation,
    show3D: false,
    showGrid: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.world.add(this.labels);
    ctx.viewport.setHelpers(false);

    this.buildGrid();
    this.buildArrows();
    this.buildLabels();
    this.buildControls();
    this.applyCamera();
    this.renderInfo();
    this.update();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.componentCtrls = [];
    this.group.clear();
    this.labels.clear();
  }

  private buildGrid(): void {
    this.grid = new THREE.GridHelper(12, 24, 0x30363d, 0x21262d);
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.z = -0.05;
    this.grid.visible = this.params.showGrid;
    this.group.add(this.grid);

    const axes = new THREE.Group();
    const xAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    const yAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 6, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    axes.add(xAxis, yAxis);
    this.group.add(axes);
  }

  private buildArrows(): void {
    // Faint parallelogram fill spanned by A and B (drawn behind the arrows).
    const paraGeo = new THREE.BufferGeometry();
    paraGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18), 3));
    this.parallelogram = new THREE.Mesh(
      paraGeo,
      new THREE.MeshBasicMaterial({
        color: COLORS.result,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.parallelogram.position.z = -0.02;
    this.parallelogram.visible = false;
    this.group.add(this.parallelogram);

    this.aHead = marker(0xffffff, 0.14);
    this.bHead = marker(0xffffff, 0.14);
    this.group.add(this.aHead, this.bHead);

    this.arrowA = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(this.params.ax, this.params.ay), COLORS.a);
    this.arrowB = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(this.params.bx, this.params.by), COLORS.b);
    this.arrowResult = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), COLORS.result);
    this.arrowProj = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), COLORS.projection, 0.02, 0.06, 0.12);
    this.crossMarker = marker(COLORS.result, 0.16);
    this.crossMarker.visible = false;

    this.group.add(this.arrowA, this.arrowB, this.arrowResult, this.arrowProj, this.crossMarker);

    this.stopDrag = createDragControls(this.viewport, [this.aHead, this.bHead], (index, point) => {
      const clamped = new THREE.Vector2(
        THREE.MathUtils.clamp(point.x, -5, 5),
        THREE.MathUtils.clamp(point.y, -5, 5),
      );
      if (index === 0) {
        this.params.ax = clamped.x;
        this.params.ay = clamped.y;
      } else {
        // In tip-to-tail modes the B handle sits at the chain tip (the result), so
        // recover B from the dragged point; otherwise the handle is B itself.
        const op = this.params.operation;
        if (op === "add") {
          this.params.bx = THREE.MathUtils.clamp(clamped.x - this.params.ax, -5, 5);
          this.params.by = THREE.MathUtils.clamp(clamped.y - this.params.ay, -5, 5);
        } else if (op === "subtract") {
          this.params.bx = THREE.MathUtils.clamp(this.params.ax - clamped.x, -5, 5);
          this.params.by = THREE.MathUtils.clamp(this.params.ay - clamped.y, -5, 5);
        } else {
          this.params.bx = clamped.x;
          this.params.by = clamped.y;
        }
      }
      for (const c of this.componentCtrls) c.updateDisplay();
      this.update();
    });
  }

  private buildLabels(): void {
    const aLabel = textSprite("A", COLORS.a);
    const bLabel = textSprite("B", COLORS.b);
    const rLabel = textSprite("R", COLORS.result);
    aLabel.name = "a";
    bLabel.name = "b";
    rLabel.name = "r";
    this.labels.add(aLabel, bLabel, rLabel);
  }

  private buildControls(): void {
    const g = this.gui;
    const folderA = g.addFolder("Vector A");
    const axCtrl = tip(folderA.add(this.params, "ax", -5, 5, 0.1).name("A x"), "x-component of vector A").onChange(() => this.update());
    const ayCtrl = tip(folderA.add(this.params, "ay", -5, 5, 0.1).name("A y"), "y-component of vector A").onChange(() => this.update());
    folderA.open();

    const folderB = g.addFolder("Vector B");
    const bxCtrl = tip(folderB.add(this.params, "bx", -5, 5, 0.1).name("B x"), "x-component of vector B").onChange(() => this.update());
    const byCtrl = tip(folderB.add(this.params, "by", -5, 5, 0.1).name("B y"), "y-component of vector B").onChange(() => this.update());
    folderB.open();

    this.componentCtrls = [axCtrl, ayCtrl, bxCtrl, byCtrl];

    tip(g.add(this.params, "operation", {
      "A + B": "add",
      "A − B": "subtract",
      "A · B": "dot",
      "A × B": "cross",
      "Components": "components",
    }).name("Operation"), "Choose what to compute and visualise").onChange(() => {
      this.applyCamera();
      this.update();
    });

    tip(g.add(this.params, "show3D").name("3D cross product"), "Tilt the view so the cross product sticks out of the plane").onChange(() => {
      this.applyCamera();
      this.update();
    });

    tip(g.add(this.params, "showGrid").name("Show grid"), "Toggle the reference grid").onChange((v: boolean) => {
      this.grid.visible = v;
    });
  }

  /** Frame the camera for the current view. Only called when the view mode changes,
   *  never on every value update, so dragging and orbiting stay responsive. */
  private applyCamera(): void {
    const origin = new THREE.Vector3(0, 0, 0);
    if (this.params.show3D && this.params.operation === "cross") {
      this.viewport.frameCamera(new THREE.Vector3(5, 5, 7), origin);
    } else {
      this.viewport.frameCamera(new THREE.Vector3(0, 0, 9), origin);
    }
  }

  private updateParallelogram(a: THREE.Vector2, b: THREE.Vector2): void {
    const pos = this.parallelogram.geometry.getAttribute("position") as THREE.BufferAttribute;
    const cx = a.x + b.x;
    const cy = a.y + b.y;
    // Two triangles: O-A-C and O-C-B, where C = A + B.
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, a.x, a.y, 0);
    pos.setXYZ(2, cx, cy, 0);
    pos.setXYZ(3, 0, 0, 0);
    pos.setXYZ(4, cx, cy, 0);
    pos.setXYZ(5, b.x, b.y, 0);
    pos.needsUpdate = true;
    this.parallelogram.geometry.computeBoundingSphere();
  }

  private update(): void {
    const a = new THREE.Vector2(this.params.ax, this.params.ay);
    const b = new THREE.Vector2(this.params.bx, this.params.by);
    const origin = new THREE.Vector3(0, 0, 0);

    // A is always drawn from the origin.
    updateArrow(this.arrowA, origin, new THREE.Vector3(a.x, a.y, 0));
    this.aHead.position.set(a.x, a.y, 0.05);

    const aLabel = this.labels.getObjectByName("a") as THREE.Sprite;
    const bLabel = this.labels.getObjectByName("b") as THREE.Sprite;
    const rLabel = this.labels.getObjectByName("r") as THREE.Sprite;
    aLabel.position.set(a.x + 0.25, a.y + 0.25, 0.1);
    bLabel.visible = true;

    this.arrowProj.visible = false;
    this.crossMarker.visible = false;
    this.parallelogram.visible = false;
    this.arrowResult.visible = true;

    const op = this.params.operation;
    if (op === "add" || op === "subtract") {
      // Tip-to-tail: draw the second leg starting at A's tip, in B's colour, and the
      // green result from the origin to the shared endpoint.
      const r = op === "add" ? a.clone().add(b) : a.clone().sub(b);
      const aTip = new THREE.Vector3(a.x, a.y, 0);
      const rVec = new THREE.Vector3(r.x, r.y, 0);

      updateArrow(this.arrowB, aTip, rVec);
      this.bHead.position.set(r.x, r.y, 0.05);
      updateArrow(this.arrowResult, origin, rVec);

      bLabel.position.set((a.x + r.x) / 2 + 0.25, (a.y + r.y) / 2 + 0.25, 0.1);
      rLabel.position.set(r.x + 0.3, r.y + 0.3, 0.1);
      rLabel.visible = true;

      if (op === "add") {
        this.updateParallelogram(a, b);
        this.parallelogram.visible = true;
      }
    } else {
      // B is drawn from the origin for dot / cross / components.
      updateArrow(this.arrowB, origin, new THREE.Vector3(b.x, b.y, 0));
      this.bHead.position.set(b.x, b.y, 0.05);
      bLabel.position.set(b.x + 0.25, b.y + 0.25, 0.1);

      if (op === "dot") {
        const dot = a.x * b.x + a.y * b.y;
        const projLen = b.lengthSq() > 1e-9 ? dot / b.lengthSq() : 0;
        const proj = b.clone().multiplyScalar(projLen);
        updateArrow(this.arrowProj, origin, new THREE.Vector3(proj.x, proj.y, 0));
        this.arrowProj.visible = true;
        this.arrowResult.visible = false;
        rLabel.visible = false;
        this.group.userData.dot = dot;
      } else if (op === "cross") {
        const cross = a.x * b.y - a.y * b.x;
        // The parallelogram area equals |A × B|, so show it in 2D as well as the z-marker.
        this.updateParallelogram(a, b);
        this.parallelogram.visible = true;
        this.crossMarker.visible = true;
        this.crossMarker.position.set(0, 0, cross * 0.5);
        this.arrowResult.visible = false;
        rLabel.visible = false;
        this.group.userData.cross = cross;
      } else {
        // components
        this.arrowResult.visible = false;
        rLabel.visible = false;
      }
    }

    this.renderInfo();
  }

  private renderInfo(): void {
    const a = new THREE.Vector2(this.params.ax, this.params.ay);
    const b = new THREE.Vector2(this.params.bx, this.params.by);
    const magA = a.length();
    const magB = b.length();
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);

    let opHtml = "";
    if (this.params.operation === "add") {
      const r = a.clone().add(b);
      opHtml = `<p><b>A + B</b> = (${r.x.toFixed(2)}, ${r.y.toFixed(2)}). B is redrawn from the tip of A (tip-to-tail): follow A, then B, and you land on the green result. The shaded parallelogram shows A + B and B + A reach the same point.</p>`;
    } else if (this.params.operation === "subtract") {
      const r = a.clone().sub(b);
      opHtml = `<p><b>A − B</b> = (${r.x.toFixed(2)}, ${r.y.toFixed(2)}). This is A + (−B): B is flipped and drawn from the tip of A, landing on the green result. It is also the arrow from the tip of B to the tip of A.</p>`;
    } else if (this.params.operation === "dot") {
      const dot = a.x * b.x + a.y * b.y;
      opHtml = `<p><b>A · B</b> = ${dot.toFixed(2)}. This measures how much A and B point in the same direction: |A||B|cosθ. The orange arrow is A's shadow (projection) onto B.</p>${derivationButton("vector-dot")}`;
    } else if (this.params.operation === "cross") {
      const cross = a.x * b.y - a.y * b.x;
      opHtml = `<p><b>A × B</b> = ${cross.toFixed(2)} <b>k̂</b>. Its size equals the area of the shaded parallelogram; its sign tells you the turn direction (positive = anticlockwise). Turn on <i>3D cross product</i> to see it stand up out of the plane.</p>${derivationButton("vector-cross")}`;
    } else {
      opHtml = `<p>A vector is a magnitude and a direction. Drag the white handles or use the sliders to change A and B.</p>`;
    }

    this.setInfo(`
      <h2>Vectors</h2>
      <p>Two vectors <span style="color:#ff7b72">A</span> and <span style="color:#79c0ff">B</span> drawn from the origin. Drag their tips or use the sliders.</p>
      <div class="readout">
        <div><b>A</b> = (${a.x.toFixed(2)}, ${a.y.toFixed(2)}) &nbsp;|A| = ${magA.toFixed(2)} &nbsp;θ = ${(angleA * 180 / Math.PI).toFixed(1)}°</div>
        <div><b>B</b> = (${b.x.toFixed(2)}, ${b.y.toFixed(2)}) &nbsp;|B| = ${magB.toFixed(2)} &nbsp;θ = ${(angleB * 180 / Math.PI).toFixed(1)}°</div>
      </div>
      ${derivationButton("vector-magnitude")}
      ${opHtml}
      <p class="example"><b>Try it:</b> set A = (2,0) and B = (0,3). Switch between operations and watch how addition, subtraction and the dot product behave.</p>
    `);
  }
}
