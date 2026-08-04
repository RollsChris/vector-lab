import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  DEFAULT_TRANSFORM,
  orientationName,
  scaleFactor,
  transformTriangle,
  triangleMetrics,
  type Point,
  type Transformation,
  type Triangle,
} from "../math/triangleTransformations";
import { createDragControls, marker, textSprite } from "./helpers";

const BOX = { x: 6.8, y: 4.1 };
const SOURCE_COLOUR = 0x58a6ff;
const IMAGE_COLOUR = 0x7ee787;
const HANDLE_COLOUR = 0xffd166;
const MIRROR_COLOUR = 0xd2a8ff;

const MODE_LABEL: Record<Transformation, string> = {
  translation: "Translation",
  rotation: "Rotation",
  reflection: "Reflection",
  enlargement: "Enlargement",
};

/**
 * A visual course on rigid motions and enlargement. The source vertices are draggable;
 * each image is always calculated from those same corresponding vertices.
 */
export class TriangleTransformationsLesson implements Lesson {
  readonly id = "triangle-transformations";
  readonly title = "Triangle Transformations";
  readonly blurb = "Move, turn, flip and scale a triangle";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["triangle-theorems"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labels = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private sourceLabels: THREE.Sprite[] = [];
  private imageLabels: THREE.Sprite[] = [];
  private originLabel?: THREE.Sprite;
  private stopDrag?: () => void;
  private stopTick?: () => void;
  private previousRotate = true;
  private mode: Transformation = "translation";
  private animationProgress = 1;
  private animationPlaying = false;
  private imageHidden = false;
  private challengeVerdict = "";

  private readonly verts: Point[] = [
    { x: -3.5, y: -1.8 },
    { x: -1.1, y: 2.5 },
    { x: 1.6, y: -1.2 },
  ];

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-xf]");
    if (!button) return;
    const action = button.dataset.xf ?? "";
    if (action.startsWith("mode:")) {
      this.mode = action.slice(5) as Transformation;
      this.animationProgress = 1;
      this.animationPlaying = false;
      this.imageHidden = false;
      this.challengeVerdict = "";
      this.renderPanel();
      this.renderScene();
      return;
    }
    if (action === "animate") {
      this.imageHidden = false;
      this.animationProgress = 0;
      this.animationPlaying = true;
      this.challengeVerdict = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "hide-image") {
      this.imageHidden = true;
      this.animationPlaying = false;
      this.animationProgress = 1;
      this.challengeVerdict = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "reveal-image") {
      this.imageHidden = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action.startsWith("answer:")) {
      const answer = action.slice(7);
      const correct = this.mode === "enlargement" ? "similar" : "congruent";
      this.challengeVerdict = answer === correct
        ? "Correct — now reveal the image and compare every corresponding vertex."
        : this.mode === "enlargement"
          ? "Not quite. Enlargement keeps angles but changes lengths and area."
          : "Not quite. A translation, rotation or reflection keeps every length, angle and area.";
      this.updatePanel();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic, this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 16), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildGrid();
    for (let i = 0; i < 3; i++) {
      const handle = marker(HANDLE_COLOUR, 0.2);
      this.handles.push(handle);
      this.group.add(handle);

      const source = textSprite(["A", "B", "C"][i], SOURCE_COLOUR, 0.32);
      const image = textSprite(["A′", "B′", "C′"][i], IMAGE_COLOUR, 0.32);
      this.sourceLabels.push(source);
      this.imageLabels.push(image);
      this.labels.add(source, image);
    }
    this.originLabel = textSprite("O", MIRROR_COLOUR, 0.28);
    this.originLabel.position.set(0.32, 0.32, 0.35);
    this.labels.add(this.originLabel);

    this.stopDrag = createDragControls(ctx.viewport, this.handles, (index, point) => {
      this.verts[index] = {
        x: THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x),
        y: THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y),
      };
      this.renderScene();
      this.updatePanel();
    });
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.renderPanel();
    this.renderScene();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopTick?.();
    this.stopDrag = undefined;
    this.stopTick = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.labels = new THREE.Group();
    this.handles = [];
    this.sourceLabels = [];
    this.imageLabels = [];
    this.originLabel = undefined;
    this.viewport = undefined;
  }

  private tick(dt: number): void {
    if (!this.animationPlaying) return;
    this.animationProgress = Math.min(1, this.animationProgress + dt / 2.2);
    if (this.animationProgress === 1) this.animationPlaying = false;
    this.renderScene();
    this.updatePanel();
  }

  private sourceTriangle(): Triangle {
    return [this.verts[0], this.verts[1], this.verts[2]];
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    const source = this.sourceTriangle();
    const image = transformTriangle(source, this.mode, this.animationProgress);
    if (this.originLabel) this.originLabel.visible = this.mode === "rotation" || this.mode === "enlargement";
    this.drawTransformGuide();
    this.drawTriangle(source, SOURCE_COLOUR, 0.14);
    if (!this.imageHidden) {
      this.drawTriangle(image, IMAGE_COLOUR, 0.29);
      for (let i = 0; i < 3; i++) this.drawCorrespondence(source[i], image[i]);
    }

    source.forEach((point, index) => {
      this.handles[index].position.set(point.x, point.y, 0.3);
      this.sourceLabels[index].position.set(point.x - 0.36, point.y + 0.33, 0.35);
    });
    image.forEach((point, index) => {
      this.imageLabels[index].position.set(point.x + 0.36, point.y + 0.33, 0.35);
      this.imageLabels[index].visible = !this.imageHidden;
    });
  }

  private drawTransformGuide(): void {
    if (this.mode === "reflection") {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-BOX.x, 0, 0), new THREE.Vector3(BOX.x, 0, 0)]),
        new THREE.LineDashedMaterial({ color: MIRROR_COLOUR, dashSize: 0.18, gapSize: 0.12 }),
      );
      line.computeLineDistances();
      this.dynamic.add(line);
    }
    if (this.mode === "rotation" || this.mode === "enlargement") {
      const centre = new THREE.Mesh(
        new THREE.RingGeometry(0.11, 0.17, 24),
        new THREE.MeshBasicMaterial({ color: MIRROR_COLOUR, side: THREE.DoubleSide }),
      );
      this.dynamic.add(centre);
    }
  }

  private drawTriangle(triangle: Triangle, colour: number, opacity: number): void {
    const points = triangle.map((point) => new THREE.Vector2(point.x, point.y));
    const fill = new THREE.Mesh(
      new THREE.ShapeGeometry(new THREE.Shape(points)),
      new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity, side: THREE.DoubleSide }),
    );
    this.dynamic.add(fill);
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(triangle.map((point) => new THREE.Vector3(point.x, point.y, 0.12))),
      new THREE.LineBasicMaterial({ color: colour }),
    );
    this.dynamic.add(outline);
  }

  private drawCorrespondence(source: Point, image: Point): void {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(source.x, source.y, 0.08),
        new THREE.Vector3(image.x, image.y, 0.08),
      ]),
      new THREE.LineDashedMaterial({ color: 0x8b949e, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.72 }),
    );
    line.computeLineDistances();
    this.dynamic.add(line);
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 32, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.08;
    this.group.add(grid);
    this.group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-BOX.x, 0, -0.06), new THREE.Vector3(BOX.x, 0, -0.06)]),
        new THREE.LineBasicMaterial({ color: 0x6e7681 }),
      ),
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -BOX.y, -0.06), new THREE.Vector3(0, BOX.y, -0.06)]),
        new THREE.LineBasicMaterial({ color: 0x6e7681 }),
      ),
    );
  }

  private renderPanel(): void {
    const buttons = (Object.keys(MODE_LABEL) as Transformation[])
      .map((mode) => `<button class="course-btn${mode === this.mode ? "" : " ghost"}" type="button" data-xf="mode:${mode}">${MODE_LABEL[mode]}</button>`)
      .join(" ");
    this.setInfo(`
      <h2>Triangle Transformations</h2>
      <p>Every coloured point is the image of one named source point. Drag A, B or C, then
      switch the rule and watch the triangle move without losing its correspondence.</p>
      <div class="course">
        <h3>Choose a transformation</h3>
        <div class="course-chapters">${buttons}</div>
        <p class="course-hint" id="xf-rule"></p>
        <button class="course-btn" type="button" data-xf="animate" id="xf-animate">▶ Animate this transformation</button>
      </div>
      <div class="course">
        <h3>What stays the same?</h3>
        <div class="readout" id="xf-readout"></div>
        <p class="course-hint" id="xf-note"></p>
      </div>
      <div class="course">
        <h3>Predict, then reveal</h3>
        <p>Hide the green image. Predict where A′, B′ and C′ will land, then choose the
        statement that must be true before revealing it.</p>
        <button class="course-btn ghost" type="button" data-xf="hide-image">Hide image</button>
        <button class="course-btn ghost" type="button" data-xf="reveal-image">Reveal image</button>
        <div class="course-chapters" style="margin-top:8px">
          <button class="course-btn ghost" type="button" data-xf="answer:congruent">All lengths, angles and area match</button>
          <button class="course-btn ghost" type="button" data-xf="answer:similar">Angles match; lengths and area scale</button>
          <button class="course-btn ghost" type="button" data-xf="answer:neither">Nothing predictable remains</button>
        </div>
        <p class="course-hint" id="xf-verdict"></p>
      </div>`);
    this.updatePanel();
  }

  private updatePanel(): void {
    const source = triangleMetrics(this.sourceTriangle());
    const image = triangleMetrics(transformTriangle(this.sourceTriangle(), this.mode));
    const scale = scaleFactor(this.mode);
    const rule = document.getElementById("xf-rule");
    const readout = document.getElementById("xf-readout");
    const note = document.getElementById("xf-note");
    const verdict = document.getElementById("xf-verdict");
    const animate = document.getElementById("xf-animate");
    if (rule) rule.textContent = `${MODE_LABEL[this.mode]}: ${DEFAULT_TRANSFORM[this.mode]}.`;
    if (readout) {
      readout.innerHTML = [
        ["Side AB", `${format(source.sideLengths[2])} → ${format(image.sideLengths[2])} units`],
        ["Area", `${format(source.area)} → ${format(image.area)} units²`],
        ["Angle A", `${degrees(source.angles[0])} → ${degrees(image.angles[0])}`],
        ["Scale factor", `${format(scale)}`],
        ["Orientation", `${orientationName(this.sourceTriangle())} → ${orientationName(transformTriangle(this.sourceTriangle(), this.mode))}`],
      ].map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("");
    }
    if (note) {
      note.textContent = this.mode === "enlargement"
        ? "Enlargement keeps every angle, multiplies all lengths by 1.5, and multiplies area by 1.5² = 2.25."
        : this.mode === "reflection"
          ? "Reflection keeps lengths, angles and area, but reverses the order in which the vertices run around the shape."
          : "This is a rigid transformation: all corresponding lengths, angles and area stay exactly the same.";
    }
    if (verdict) verdict.textContent = this.challengeVerdict || (this.imageHidden ? "Image hidden — make your prediction before revealing it." : "");
    if (animate) animate.textContent = this.animationPlaying ? "Animating…" : "▶ Animate this transformation";
  }

  private disposeChildren(group: THREE.Group): void {
    [...group.children].forEach((child) => this.disposeObject(child));
    group.clear();
  }

  private disposeGroup(group: THREE.Group): void {
    this.disposeChildren(group);
    group.parent?.remove(group);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((item) => {
      const mesh = item as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((entry) => this.disposeMaterial(entry));
      else if (material) this.disposeMaterial(material);
    });
    object.parent?.remove(object);
  }

  private disposeMaterial(material: THREE.Material): void {
    (material as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    material.dispose();
  }
}

function format(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function degrees(radians: number): string {
  return `${format(THREE.MathUtils.radToDeg(radians))}°`;
}
