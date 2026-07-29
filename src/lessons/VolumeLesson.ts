import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import { textSprite } from "./helpers";
import "./formulaDerivations/volume";

type Chapter =
  | "meaning"
  | "prisms"
  | "pyramids"
  | "round"
  | "frustums"
  | "composite"
  | "comparisons";

type Shape =
  | "cube"
  | "cuboid"
  | "triangular-prism"
  | "trapezoidal-prism"
  | "polygon-prism"
  | "cylinder"
  | "square-pyramid"
  | "rectangular-pyramid"
  | "tetrahedron"
  | "cone"
  | "sphere"
  | "hemisphere"
  | "spherical-cap"
  | "ellipsoid"
  | "torus"
  | "capsule"
  | "cone-frustum"
  | "square-frustum"
  | "pipe"
  | "silo"
  | "displacement"
  | "archimedes";

type ValueKey = keyof VolumeLesson["values"];
type HandleKind = "radius" | "inner-radius" | "height" | "side";

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: "meaning", label: "1 · What volume is" },
  { id: "prisms", label: "2 · Prisms" },
  { id: "pyramids", label: "3 · Pyramids & cones" },
  { id: "round", label: "4 · Spheres & round solids" },
  { id: "frustums", label: "5 · Frustums" },
  { id: "composite", label: "6 · Composite & hollow" },
  { id: "comparisons", label: "7 · Comparisons & scaling" },
];

const SHAPES: Record<Chapter, { id: Shape; label: string }[]> = {
  meaning: [{ id: "cube", label: "Unit cubes & scaling" }],
  prisms: [
    { id: "cube", label: "Cube" },
    { id: "cuboid", label: "Cuboid" },
    { id: "triangular-prism", label: "Triangular prism" },
    { id: "trapezoidal-prism", label: "Trapezoidal prism" },
    { id: "polygon-prism", label: "Regular n-gon prism" },
    { id: "cylinder", label: "Cylinder" },
  ],
  pyramids: [
    { id: "square-pyramid", label: "Square pyramid" },
    { id: "rectangular-pyramid", label: "Rectangular pyramid" },
    { id: "tetrahedron", label: "Regular tetrahedron" },
    { id: "cone", label: "Cone" },
  ],
  round: [
    { id: "sphere", label: "Sphere" },
    { id: "hemisphere", label: "Hemisphere" },
    { id: "spherical-cap", label: "Spherical cap" },
    { id: "ellipsoid", label: "Ellipsoid" },
    { id: "torus", label: "Torus" },
    { id: "capsule", label: "Capsule" },
  ],
  frustums: [
    { id: "cone-frustum", label: "Cone frustum" },
    { id: "square-frustum", label: "Square-pyramid frustum" },
  ],
  composite: [
    { id: "pipe", label: "Pipe / tube" },
    { id: "silo", label: "Silo" },
    { id: "displacement", label: "Displacement" },
  ],
  comparisons: [{ id: "archimedes", label: "Cone : hemisphere : cylinder" }],
};

const INPUTS: Partial<Record<Shape, ValueKey[]>> = {
  cube: ["side", "scale"],
  cuboid: ["length", "width", "height"],
  "triangular-prism": ["baseA", "depth", "length"],
  "trapezoidal-prism": ["baseA", "baseB", "depth", "length"],
  "polygon-prism": ["sides", "side", "height"],
  cylinder: ["radius", "height"],
  "square-pyramid": ["side", "height"],
  "rectangular-pyramid": ["length", "width", "height"],
  tetrahedron: ["side"],
  cone: ["radius", "height"],
  sphere: ["radius"],
  hemisphere: ["radius"],
  "spherical-cap": ["radius", "capHeight"],
  ellipsoid: ["axisA", "axisB", "axisC"],
  torus: ["majorRadius", "radius"],
  capsule: ["radius", "height"],
  "cone-frustum": ["radius", "innerRadius", "height"],
  "square-frustum": ["side", "topSide", "height"],
  pipe: ["radius", "innerRadius", "height"],
  silo: ["radius", "height"],
  displacement: ["before", "after"],
  archimedes: ["radius", "scale"],
};

const LABELS: Record<ValueKey, [string, string, number]> = {
  side: ["Side a or s", "units", 0.1],
  topSide: ["Top side b", "units", 0.1],
  length: ["Length l", "units", 0.1],
  width: ["Width w", "units", 0.1],
  height: ["Perpendicular height h", "units", 0.1],
  radius: ["Radius r / outer R", "units", 0.1],
  innerRadius: ["Inner / top radius r", "units", 0.1],
  majorRadius: ["Major radius R", "units", 0.1],
  baseA: ["Base side a", "units", 0.1],
  baseB: ["Base side b", "units", 0.1],
  depth: ["Cross-section height d", "units", 0.1],
  capHeight: ["Cap height h", "units", 0.1],
  axisA: ["Semi-axis a", "units", 0.1],
  axisB: ["Semi-axis b", "units", 0.1],
  axisC: ["Semi-axis c", "units", 0.1],
  sides: ["Polygon sides n", "sides", 1],
  scale: ["Length scale factor k", "×", 0.1],
  before: ["Initial liquid reading", "mL", 1],
  after: ["Final liquid reading", "mL", 1],
};

const COL = {
  solid: 0x58a6ff,
  edge: 0xb6d8ff,
  radius: 0xffd166,
  height: 0x7ee787,
  inner: 0xffa657,
  slice: 0xd2a8ff,
  liquid: 0x39c5cf,
};

/**
 * A broad calculation-first volume course. Each chapter uses the same dimensions in the
 * explanation, live substitution and 3D solid so formula and geometry stay connected.
 */
export class VolumeLesson implements Lesson {
  readonly id = "volume";
  readonly title = "Volume of Solids";
  readonly blurb = "Many solids, one slice-and-stack idea";
  readonly category = "Shape" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["geometry", "circle-calculations"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private chapter: Chapter = "meaning";
  private readonly shapeByChapter: Record<Chapter, Shape> = {
    meaning: "cube",
    prisms: "cylinder",
    pyramids: "cone",
    round: "sphere",
    frustums: "cone-frustum",
    composite: "pipe",
    comparisons: "archimedes",
  };

  private readonly values = {
    side: 4,
    topSide: 2,
    length: 6,
    width: 4,
    height: 5,
    radius: 3,
    innerRadius: 1.5,
    majorRadius: 5,
    baseA: 5,
    baseB: 3,
    depth: 3,
    capHeight: 2,
    axisA: 4,
    axisB: 3,
    axisC: 2,
    sides: 6,
    scale: 2,
    before: 1200,
    after: 1510,
  };

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane();
  private handles: THREE.Object3D[] = [];
  private dragging: HandleKind | undefined;
  private dragFrame = 0;
  private sceneScale = 0.65;
  private sweepSlice?: THREE.Object3D;
  private sweepRange?: [number, number];
  private stopTick?: () => void;

  private readonly onPointerDown = (event: PointerEvent): void => {
    const kind = this.pickHandle(event);
    if (!kind) return;
    this.dragging = kind;
    if (this.viewport) {
      this.viewport.controls.enabled = false;
      this.viewport.renderer.domElement.setPointerCapture(event.pointerId);
      this.viewport.renderer.domElement.style.cursor = "grabbing";
    }
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      if (this.viewport) {
        this.viewport.renderer.domElement.style.cursor = this.pickHandle(event) ? "grab" : "";
      }
      return;
    }
    const point = this.pointerOnPlane(event);
    if (!point) return;
    this.applyDrag(this.dragging, point);
    if (this.dragFrame) return;
    this.dragFrame = requestAnimationFrame(() => {
      this.dragFrame = 0;
      this.rebuild();
    });
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = undefined;
    if (this.viewport) {
      this.viewport.controls.enabled = true;
      this.viewport.renderer.domElement.releasePointerCapture?.(event.pointerId);
      this.viewport.renderer.domElement.style.cursor = "";
    }
    this.rebuild();
  };

  private readonly infoHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const chapterButton = target.closest<HTMLButtonElement>("[data-volume-chapter]");
    if (chapterButton) {
      const chapter = (chapterButton.dataset.volumeChapter ?? "") as Chapter;
      if (CHAPTERS.some((item) => item.id === chapter)) {
        this.chapter = chapter;
        this.rebuild();
      }
      return;
    }

    const shapeButton = target.closest<HTMLButtonElement>("[data-volume-shape]");
    if (shapeButton) {
      const shape = (shapeButton.dataset.volumeShape ?? "") as Shape;
      if (SHAPES[this.chapter].some((item) => item.id === shape)) {
        this.shapeByChapter[this.chapter] = shape;
        this.normaliseValues();
        this.rebuild();
      }
      return;
    }

    const input = target.closest<HTMLInputElement>("[data-volume-input]");
    if (!input || event.type !== "change") return;
    const key = (input.dataset.volumeInput ?? "") as ValueKey;
    if (!(key in this.values) || !Number.isFinite(input.valueAsNumber)) return;
    this.values[key] = input.valueAsNumber;
    this.normaliseValues();
    this.rebuild();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(8, 6, 10), new THREE.Vector3(0, 0, 0));
    ctx.viewport.controls.enableRotate = true;
    document.getElementById("info")?.addEventListener("click", this.infoHandler);
    document.getElementById("info")?.addEventListener("change", this.infoHandler);
    const canvas = ctx.viewport.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown, true);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    this.stopTick = ctx.viewport.onTick((_dt, elapsed) => {
      if (!this.sweepSlice || !this.sweepRange) return;
      const [low, high] = this.sweepRange;
      const t = (Math.sin(elapsed * 1.5) + 1) / 2;
      this.sweepSlice.position.y = THREE.MathUtils.lerp(low, high, t);
    });
    this.rebuild();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.infoHandler);
    document.getElementById("info")?.removeEventListener("change", this.infoHandler);
    if (this.viewport) {
      const canvas = this.viewport.renderer.domElement;
      canvas.removeEventListener("pointerdown", this.onPointerDown, true);
      canvas.removeEventListener("pointermove", this.onPointerMove);
      canvas.removeEventListener("pointerup", this.onPointerUp);
      canvas.removeEventListener("pointercancel", this.onPointerUp);
      canvas.style.cursor = "";
      this.viewport.controls.enabled = true;
    }
    this.stopTick?.();
    this.stopTick = undefined;
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
    this.dragFrame = 0;
    this.dragging = undefined;
    this.handles = [];
    this.sweepSlice = undefined;
    this.sweepRange = undefined;
    this.disposeChildren(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.viewport = undefined;
  }

  private get shape(): Shape {
    return this.shapeByChapter[this.chapter];
  }

  private rebuild(): void {
    this.disposeChildren(this.group);
    this.handles = [];
    this.sweepSlice = undefined;
    this.sweepRange = undefined;
    this.drawScene();
    this.renderPanel();
  }

  private renderPanel(): void {
    const chapterNav = CHAPTERS
      .map((item) => `<button class="course-btn${item.id === this.chapter ? "" : " ghost"}" type="button" data-volume-chapter="${item.id}">${item.label}</button>`)
      .join("");
    const shapeNav = SHAPES[this.chapter]
      .map((item) => `<button class="course-btn${item.id === this.shape ? "" : " ghost"}" type="button" data-volume-shape="${item.id}">${item.label}</button>`)
      .join("");
    const inputs = this.inputKeys()
      .map((key) => this.input(key))
      .join("");

    this.setInfo(`
      <h2>Volume of Solids</h2>
      <p>Volume measures filled three-dimensional space. Choose a chapter and solid: each
      calculation shows the general formula, why its slices add that way, and the current
      values substituted with cubic units.</p>
      <div class="course-chapters" style="margin-bottom:10px">${chapterNav}</div>
      <div class="course">
        <h3>Choose the solid</h3>
        <div class="course-chapters">${shapeNav}</div>
        <p class="course-hint" data-volume-drag-hint><b>Drag the 3D view:</b> orbit freely.
        Yellow/orange handles change a radius or side; green handles change perpendicular
        height. Number inputs and calculations follow the handles live.</p>
        <div class="circle-inputs">${inputs}</div>
      </div>
      ${this.chapterIntro()}
      ${this.shapeContent()}
      <details class="course">
        <summary>Units, history and applications</summary>
        <p><b>Units:</b> 1 cm³ is a 1 cm by 1 cm by 1 cm cube. One millilitre is 1 cm³;
        1 litre is 1000 cm³; and 1 m³ is 1000 litres. Convert lengths before cubing them:
        1 m = 100 cm but 1 m³ = 1,000,000 cm³.</p>
        <p><b>History:</b> Egyptian and Babylonian builders used practical solid-volume
        rules. Archimedes compared spheres, cones and cylinders by balancing slices; modern
        calculus formalises the same idea by adding infinitesimally thin cross-sections.</p>
        <p><b>Applications:</b> tanks and packaging, concrete and excavation, engine capacity,
        medical dosage, material mass, buoyancy, 3D printing and computer graphics all depend
        on volume.</p>
      </details>`);
  }

  private chapterIntro(): string {
    switch (this.chapter) {
      case "meaning":
        return `<div class="course">
          <h3>Cubic units and the scaling law</h3>
          <p>A unit cube is one unit long, wide and high. Filling a box with these cubes makes
          volume a count of three-dimensional units. If every length is multiplied by k, there
          are k times as many cubes in each of three directions, so volume multiplies by k³.</p>
          ${this.readout([
            ["Current scale", `k = ${fmt(this.values.scale)}`],
            ["Area multiplier", `k² = ${fmt(this.values.scale)}² = <b>${fmt(this.values.scale ** 2)}×</b>`],
            ["Volume multiplier", `k³ = ${fmt(this.values.scale)}³ = <b>${fmt(this.values.scale ** 3)}×</b>`],
            ["Doubling check", "2³ = <b>8× the volume</b>"],
          ])}
          ${derivationButton("volume-scaling")}
        </div>`;
      case "prisms":
        return `<div class="course">
          <h3>One rule for every prism: V = Bh</h3>
          <p>A prism has the same perpendicular cross-section all the way through. If one slice
          has area B, every equal-thickness slice contains the same amount, so stacking through
          height h gives <b>base area × height</b>. A cylinder is the limiting case as a regular
          polygon gains more and more sides.</p>
        </div>`;
      case "pyramids":
        return `<div class="course">
          <h3>Tapering to a point introduces one third</h3>
          <p>A pyramid or cone has cross-sections similar to its base, but their linear size
          shrinks toward the tip. Their areas therefore shrink with the square of distance.
          Adding those unequal slices gives exactly one third of the matching prism.</p>
        </div>`;
      case "round":
        return `<div class="course">
          <h3>Round solids are sums of changing circular slices</h3>
          <p>Spheres, caps, ellipsoids, tori and capsules do not all have a constant
          cross-section. Imagine cutting them into very thin disks or shells, calculate the
          area of each slice, then add the slices. Cavalieri's principle says solids with equal
          cross-sectional areas at every height have equal volumes.</p>
        </div>`;
      case "frustums":
        return `<div class="course">
          <h3>A frustum is a complete pyramid with its tip removed</h3>
          <p>The two parallel ends have areas A₁ and A₂. Similarity links their missing heights;
          subtracting the small pyramid from the large one simplifies to
          ⅓h(A₁ + A₂ + √(A₁A₂)).</p>
        </div>`;
      case "composite":
        return `<div class="course">
          <h3>Add filled pieces; subtract holes</h3>
          <p>Split a complicated object into familiar solids. Add pieces that contain material,
          subtract drilled or hollow regions, and keep every measurement in one unit first.
          Liquid displacement is the same subtraction idea measured experimentally.</p>
        </div>`;
      case "comparisons":
        return `<div class="course">
          <h3>Compare like with like</h3>
          <p>Keep defining dimensions equal before comparing shapes. For equal radius r and
          height h = r, a cone, hemisphere and cylinder contain volumes in the exact ratio
          1 : 2 : 3. Scaling also explains why small objects have more surface area per unit
          volume than large copies.</p>
        </div>`;
    }
  }

  private shapeContent(): string {
    const v = this.values;
    switch (this.shape) {
      case "cube": {
        const volume = v.side ** 3;
        const area = 6 * v.side ** 2;
        return this.solidCard(
          "Cube",
          "cuboid-volume",
          "V = a³; SA = 6a²",
          "A cube is a stack of a-by-a square layers. Each layer has area a² and the stack is a layers deep.",
          [
            ["Base area", `B = a² = ${fmt(v.side)}² = <b>${fmt(v.side ** 2)} units²</b>`],
            ["Volume", `V = Bh = ${fmt(v.side ** 2)} × ${fmt(v.side)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `SA = 6a² = 6 × ${fmt(v.side)}² = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Find one square layer: B = a².",
            "Stack that layer through the same distance a.",
            "Six congruent square faces give the surface area.",
          ],
        );
      }
      case "cuboid": {
        const volume = v.length * v.width * v.height;
        const area = 2 * (v.length * v.width + v.length * v.height + v.width * v.height);
        return this.solidCard(
          "Cuboid",
          "cuboid-volume",
          "V = lwh; SA = 2(lw + lh + wh)",
          "Every horizontal slice is the same l-by-w rectangle, so its area lw is repeated through height h.",
          [
            ["Base area", `B = lw = ${fmt(v.length)} × ${fmt(v.width)} = <b>${fmt(v.length * v.width)} units²</b>`],
            ["Volume", `V = lwh = ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2(lw + lh + wh) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Calculate the rectangular base area lw.",
            "Multiply by perpendicular height h to count all layers.",
            "Add two faces of each type for surface area.",
          ],
        );
      }
      case "triangular-prism": {
        const base = 0.5 * v.baseA * v.depth;
        const hypotenuse = Math.hypot(v.baseA, v.depth);
        const volume = base * v.length;
        const area = 2 * base + v.length * (v.baseA + v.depth + hypotenuse);
        return this.solidCard(
          "Triangular prism",
          "prism-volume",
          "V = Bh = ½bdL",
          "The triangular end is copied unchanged along length L. Its area is ½bd, so extending it multiplies by L.",
          [
            ["Triangular base", `B = ½bd = ½ × ${fmt(v.baseA)} × ${fmt(v.depth)} = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = BL = ${fmt(base)} × ${fmt(v.length)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2B + L(b + d + √(b²+d²)) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Find the area of one triangular end.",
            "Every slice along L is congruent to that triangle.",
            "For surface area, add both ends and three rectangular side faces.",
          ],
        );
      }
      case "trapezoidal-prism": {
        const base = 0.5 * (v.baseA + v.baseB) * v.depth;
        const leg = Math.hypot(v.depth, (v.baseA - v.baseB) / 2);
        const volume = base * v.length;
        const area = 2 * base + v.length * (v.baseA + v.baseB + 2 * leg);
        return this.solidCard(
          "Trapezoidal prism",
          "prism-volume",
          "V = Bh = ½(a+b)dL",
          "The constant end is a trapezium. Its area is the average parallel side, ½(a+b), multiplied by perpendicular depth d.",
          [
            ["Trapezium base", `B = ½(a+b)d = ½(${fmt(v.baseA)}+${fmt(v.baseB)}) × ${fmt(v.depth)} = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = BL = ${fmt(base)} × ${fmt(v.length)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2B + L(a+b+2s), s = √(d²+((a−b)/2)²) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Average the two parallel sides of the trapezium.",
            "Multiply by their perpendicular separation d to get B.",
            "Extend the unchanged cross-section through length L.",
          ],
        );
      }
      case "polygon-prism": {
        const n = v.sides;
        const base = (n / 4) * v.side ** 2 / Math.tan(Math.PI / n);
        const volume = base * v.height;
        const area = 2 * base + n * v.side * v.height;
        return this.solidCard(
          "Regular polygonal prism",
          "regular-prism-volume",
          "B = (n/4)s²cot(π/n); V = Bh",
          "Join the regular n-gon's centre to its vertices. The base becomes n congruent triangles, then that whole base is stacked through h.",
          [
            ["Base area", `B = (${fmt(n)}/4) × ${fmt(v.side)}² × cot(π/${fmt(n)}) = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = Bh = ${fmt(base)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `SA = 2B + nsh = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Split the base into n centre triangles.",
            "Each triangle contributes ½ × side × apothem.",
            "Stack the resulting base area through perpendicular height h.",
          ],
        );
      }
      case "cylinder": {
        const base = Math.PI * v.radius ** 2;
        const volume = base * v.height;
        const area = 2 * Math.PI * v.radius * (v.radius + v.height);
        return this.solidCard(
          "Cylinder",
          "cylinder-volume",
          "V = πr²h; SA = 2πr(r+h)",
          "A cylinder is a stack of identical circular disks. Each disk has area πr², so h units of disks occupy πr²h.",
          [
            ["Circular base", `B = πr² = π × ${fmt(v.radius)}² = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = Bh = ${fmt(base)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2πr² + 2πrh = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Calculate one circular end: πr².",
            "The moving purple disk shows that same area at every height.",
            "Unroll the curved side into a 2πr-by-h rectangle for surface area.",
          ],
        );
      }
      case "square-pyramid": {
        const base = v.side ** 2;
        const volume = base * v.height / 3;
        const slant = Math.hypot(v.height, v.side / 2);
        const area = base + 2 * v.side * slant;
        return this.solidCard(
          "Square pyramid",
          "pyramid-volume",
          "V = ⅓a²h; SA = a² + 2aℓ",
          "Three congruent pyramids with suitable orientations fill a cube; slice reasoning gives the same one-third factor for every pyramid.",
          [
            ["Base area", `B = a² = ${fmt(v.side)}² = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = ⅓Bh = ⅓ × ${fmt(base)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Slant height", `ℓ = √(h²+(a/2)²) = <b>${fmt(slant)} units</b>`],
            ["Surface area", `a² + 4(½aℓ) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Start with square base area a².",
            "The tapering slices contribute one third of the matching prism.",
            "Each triangular face has area ½aℓ.",
          ],
        );
      }
      case "rectangular-pyramid": {
        const base = v.length * v.width;
        const volume = base * v.height / 3;
        const slantL = Math.hypot(v.height, v.width / 2);
        const slantW = Math.hypot(v.height, v.length / 2);
        const area = base + v.length * slantL + v.width * slantW;
        return this.solidCard(
          "Rectangular pyramid",
          "pyramid-volume",
          "V = ⅓lwh",
          "The base is an l-by-w rectangle. A pyramid above it contains one third of the volume of the l-by-w-by-h prism.",
          [
            ["Base area", `B = lw = ${fmt(v.length)} × ${fmt(v.width)} = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = ⅓Bh = ⅓ × ${fmt(base)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `lw + l√(h²+(w/2)²) + w√(h²+(l/2)²) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Calculate the rectangular base area.",
            "Apply the common pyramid rule ⅓Bh.",
            "Use two different slant heights for the two pairs of triangular faces.",
          ],
        );
      }
      case "tetrahedron": {
        const volume = v.side ** 3 / (6 * Math.sqrt(2));
        const height = v.side * Math.sqrt(2 / 3);
        const base = Math.sqrt(3) * v.side ** 2 / 4;
        const area = Math.sqrt(3) * v.side ** 2;
        return this.solidCard(
          "Regular tetrahedron",
          "tetrahedron-volume",
          "V = a³/(6√2); SA = √3a²",
          "A tetrahedron is a triangular pyramid. Its equilateral base has area √3a²/4 and its perpendicular height is a√(2/3).",
          [
            ["Base area", `B = √3a²/4 = <b>${fmt(base)} units²</b>`],
            ["Height", `h = a√(2/3) = ${fmt(v.side)}√(2/3) = <b>${fmt(height)} units</b>`],
            ["Volume", `V = ⅓Bh = a³/(6√2) = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `4 × (√3a²/4) = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Treat one equilateral triangle as the base.",
            "The apex lies above the base's centre, giving height a√(2/3).",
            "Substitute into the pyramid rule ⅓Bh.",
          ],
        );
      }
      case "cone": {
        const base = Math.PI * v.radius ** 2;
        const volume = base * v.height / 3;
        const slant = Math.hypot(v.radius, v.height);
        const area = Math.PI * v.radius * (v.radius + slant);
        return this.solidCard(
          "Cone",
          "cone-volume",
          "V = ⅓πr²h; SA = πr(r+ℓ)",
          "Circular slices shrink linearly toward the tip, so their areas shrink quadratically. Adding them gives one third of the matching cylinder.",
          [
            ["Base area", `B = πr² = π × ${fmt(v.radius)}² = <b>${fmt(base)} units²</b>`],
            ["Volume", `V = ⅓Bh = ⅓ × ${fmt(base)} × ${fmt(v.height)} = <b>${fmt(volume)} units³</b>`],
            ["Slant height", `ℓ = √(r²+h²) = <b>${fmt(slant)} units</b>`],
            ["Surface area", `πr² + πrℓ = <b>${fmt(area)} units²</b>`],
          ],
          [
            "At distance x from the tip, similar triangles give slice radius rx/h.",
            "The slice area is therefore πr²x²/h².",
            "Adding from x = 0 to h produces ⅓πr²h.",
          ],
        );
      }
      case "sphere": {
        const volume = 4 * Math.PI * v.radius ** 3 / 3;
        const area = 4 * Math.PI * v.radius ** 2;
        return this.solidCard(
          "Sphere",
          "sphere-volume",
          "V = ⁴⁄₃πr³; SA = 4πr²",
          "At height z from the centre, Pythagoras gives disk area π(r²−z²). Adding those disks from −r to r gives ⁴⁄₃πr³.",
          [
            ["Volume", `V = ⁴⁄₃πr³ = ⁴⁄₃π × ${fmt(v.radius)}³ = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `SA = 4πr² = 4π × ${fmt(v.radius)}² = <b>${fmt(area)} units²</b>`],
            ["Great-circle area", `πr² = <b>${fmt(Math.PI * v.radius ** 2)} units²</b>; the surface is four of these`],
          ],
          [
            "A slice z from the centre has radius √(r²−z²).",
            "Its area is π(r²−z²).",
            "Summing all slices gives ⁴⁄₃πr³; a thin-shell argument gives 4πr².",
          ],
        );
      }
      case "hemisphere": {
        const volume = 2 * Math.PI * v.radius ** 3 / 3;
        const curved = 2 * Math.PI * v.radius ** 2;
        const total = 3 * Math.PI * v.radius ** 2;
        return this.solidCard(
          "Hemisphere",
          "hemisphere-volume",
          "V = ⅔πr³; curved SA = 2πr²",
          "A plane through the centre divides a sphere into two congruent halves, so both its volume and curved surface area are halved.",
          [
            ["Volume", `V = ½(⁴⁄₃πr³) = ⅔π × ${fmt(v.radius)}³ = <b>${fmt(volume)} units³</b>`],
            ["Curved surface", `½(4πr²) = <b>${fmt(curved)} units²</b>`],
            ["Including flat base", `2πr² + πr² = <b>${fmt(total)} units²</b>`],
          ],
          [
            "Cut a sphere through its centre.",
            "Symmetry makes the two pieces congruent.",
            "Add the circular base only when total surface area is requested.",
          ],
        );
      }
      case "spherical-cap": {
        const h = v.capHeight;
        const volume = Math.PI * h ** 2 * (3 * v.radius - h) / 3;
        const curved = 2 * Math.PI * v.radius * h;
        const baseRadius = Math.sqrt(Math.max(0, 2 * v.radius * h - h ** 2));
        const total = curved + Math.PI * baseRadius ** 2;
        return this.solidCard(
          "Spherical cap",
          "spherical-cap-volume",
          "V = ⅓πh²(3r−h)",
          "A cap is the part cut from a sphere by a plane. Its circular slices widen according to the sphere equation, and integrating only over cap height h gives the formula.",
          [
            ["Base radius", `a = √(2rh−h²) = √(2×${fmt(v.radius)}×${fmt(h)}−${fmt(h)}²) = <b>${fmt(baseRadius)} units</b>`],
            ["Volume", `V = ⅓π × ${fmt(h)}² × (3×${fmt(v.radius)}−${fmt(h)}) = <b>${fmt(volume)} units³</b>`],
            ["Curved area", `2πrh = <b>${fmt(curved)} units²</b>`],
            ["Including circular cut", `2πrh + πa² = <b>${fmt(total)} units²</b>`],
          ],
          [
            "Measure h from the cutting plane to the sphere's top.",
            "Pythagoras gives each disk radius from its vertical position.",
            "Adding only the disks in the cap produces ⅓πh²(3r−h).",
          ],
        );
      }
      case "ellipsoid": {
        const volume = 4 * Math.PI * v.axisA * v.axisB * v.axisC / 3;
        const p = 1.6075;
        const area = 4 * Math.PI * (
          (v.axisA ** p * v.axisB ** p + v.axisA ** p * v.axisC ** p + v.axisB ** p * v.axisC ** p) / 3
        ) ** (1 / p);
        return this.solidCard(
          "Ellipsoid",
          "ellipsoid-volume",
          "V = ⁴⁄₃πabc",
          "Stretch a unit sphere independently by factors a, b and c. A three-dimensional stretch multiplies volume by the product abc.",
          [
            ["Volume", `V = ⁴⁄₃πabc = ⁴⁄₃π × ${fmt(v.axisA)} × ${fmt(v.axisB)} × ${fmt(v.axisC)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area (approx.)", `Knud Thomsen approximation = <b>${fmt(area)} units²</b>`],
            ["Sphere check", "When a = b = c = r, the formula becomes ⁴⁄₃πr³."],
          ],
          [
            "Begin with a unit sphere of volume 4π/3.",
            "Stretch x by a, y by b and z by c.",
            "The volume scale factor is abc, giving ⁴⁄₃πabc.",
          ],
        );
      }
      case "torus": {
        const volume = 2 * Math.PI ** 2 * v.majorRadius * v.radius ** 2;
        const area = 4 * Math.PI ** 2 * v.majorRadius * v.radius;
        return this.solidCard(
          "Torus",
          "torus-volume",
          "V = 2π²Rr²; SA = 4π²Rr",
          "Rotate a circle of area πr² around an axis whose centre travels distance 2πR. Pappus's centroid theorem multiplies those two quantities.",
          [
            ["Generating circle", `A = πr² = π × ${fmt(v.radius)}² = <b>${fmt(Math.PI * v.radius ** 2)} units²</b>`],
            ["Centroid path", `2πR = 2π × ${fmt(v.majorRadius)} = <b>${fmt(2 * Math.PI * v.majorRadius)} units</b>`],
            ["Volume", `πr² × 2πR = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2πr × 2πR = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Take the circular cross-section of radius r.",
            "Its centre travels one circumference of radius R.",
            "Area × travel distance gives volume; circumference × travel distance gives surface area.",
          ],
        );
      }
      case "capsule": {
        const cylinder = Math.PI * v.radius ** 2 * v.height;
        const sphere = 4 * Math.PI * v.radius ** 3 / 3;
        const volume = cylinder + sphere;
        const area = 2 * Math.PI * v.radius * v.height + 4 * Math.PI * v.radius ** 2;
        return this.solidCard(
          "Capsule",
          "capsule-volume",
          "V = πr²h + ⁴⁄₃πr³",
          "A capsule is one cylinder plus two hemispheres. The hemispheres join to make one complete sphere, so add those two familiar volumes.",
          [
            ["Cylinder", `πr²h = π × ${fmt(v.radius)}² × ${fmt(v.height)} = <b>${fmt(cylinder)} units³</b>`],
            ["Two hemispheres", `⁴⁄₃πr³ = <b>${fmt(sphere)} units³</b>`],
            ["Total volume", `${fmt(cylinder)} + ${fmt(sphere)} = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `2πrh + 4πr² = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Split the capsule at the two joins.",
            "The middle is a cylinder.",
            "The two end caps are two hemispheres, equivalent to one sphere.",
          ],
        );
      }
      case "cone-frustum": {
        const R = v.radius;
        const r = v.innerRadius;
        const volume = Math.PI * v.height * (R ** 2 + R * r + r ** 2) / 3;
        const slant = Math.hypot(v.height, R - r);
        const area = Math.PI * (R + r) * slant + Math.PI * (R ** 2 + r ** 2);
        return this.solidCard(
          "Cone frustum",
          "cone-frustum-volume",
          "V = ⅓πh(R²+Rr+r²)",
          "Extend the sloping sides until they meet. The frustum is the large cone minus the similar small cone removed from its tip.",
          [
            ["Volume", `V = ⅓π × ${fmt(v.height)} × (${fmt(R)}² + ${fmt(R)}×${fmt(r)} + ${fmt(r)}²) = <b>${fmt(volume)} units³</b>`],
            ["Slant height", `s = √(h²+(R−r)²) = <b>${fmt(slant)} units</b>`],
            ["Surface area", `π(R+r)s + πR² + πr² = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Complete the missing tip to make a large cone.",
            "Similarity relates the small and large cone dimensions.",
            "Subtracting their volumes simplifies to the three-term formula.",
          ],
        );
      }
      case "square-frustum": {
        const A1 = v.side ** 2;
        const A2 = v.topSide ** 2;
        const volume = v.height * (A1 + A2 + Math.sqrt(A1 * A2)) / 3;
        const slant = Math.hypot(v.height, (v.side - v.topSide) / 2);
        const area = A1 + A2 + 2 * (v.side + v.topSide) * slant;
        return this.solidCard(
          "Square-pyramid frustum",
          "frustum-volume",
          "V = ⅓h(A₁+A₂+√(A₁A₂))",
          "The general frustum formula uses the two parallel end areas. For squares, √(A₁A₂) becomes the product of their side lengths.",
          [
            ["End areas", `A₁ = ${fmt(v.side)}² = ${fmt(A1)}, A₂ = ${fmt(v.topSide)}² = ${fmt(A2)} units²`],
            ["Volume", `⅓ × ${fmt(v.height)} × (${fmt(A1)}+${fmt(A2)}+√(${fmt(A1)}×${fmt(A2)})) = <b>${fmt(volume)} units³</b>`],
            ["Surface area", `A₁+A₂+2(a+b)s = <b>${fmt(area)} units²</b>`],
          ],
          [
            "Regard the solid as a large pyramid with a smaller similar pyramid removed.",
            "Use A₁ and A₂ for the two parallel ends.",
            "Similarity turns the subtraction into the symmetric √(A₁A₂) term.",
          ],
        );
      }
      case "pipe": {
        const volume = Math.PI * v.height * (v.radius ** 2 - v.innerRadius ** 2);
        const area = 2 * Math.PI * v.height * (v.radius + v.innerRadius)
          + 2 * Math.PI * (v.radius ** 2 - v.innerRadius ** 2);
        return this.solidCard(
          "Pipe or hollow cylinder",
          "pipe-volume",
          "V = πh(R²−r²)",
          "Start with the outer cylinder and subtract the empty inner cylinder. The annular cross-section has area πR²−πr².",
          [
            ["Outer cylinder", `πR²h = π × ${fmt(v.radius)}² × ${fmt(v.height)} = ${fmt(Math.PI * v.radius ** 2 * v.height)} units³`],
            ["Inner void", `πr²h = π × ${fmt(v.innerRadius)}² × ${fmt(v.height)} = ${fmt(Math.PI * v.innerRadius ** 2 * v.height)} units³`],
            ["Material volume", `πh(R²−r²) = <b>${fmt(volume)} units³</b>`],
            ["All surfaces including ends", `<b>${fmt(area)} units²</b>`],
          ],
          [
            "Calculate the volume inside the outer radius.",
            "Calculate the empty bore using the inner radius.",
            "Subtract empty space from the enclosing solid.",
          ],
        );
      }
      case "silo": {
        const cylinder = Math.PI * v.radius ** 2 * v.height;
        const dome = 2 * Math.PI * v.radius ** 3 / 3;
        const volume = cylinder + dome;
        const exterior = 2 * Math.PI * v.radius * v.height + 2 * Math.PI * v.radius ** 2;
        return this.solidCard(
          "Silo: cylinder plus hemisphere",
          "silo-volume",
          "V = πr²h + ⅔πr³",
          "Split the silo at the spring line of its dome. The lower part is a cylinder and the roof is half a sphere.",
          [
            ["Cylinder", `πr²h = <b>${fmt(cylinder)} units³</b>`],
            ["Hemispherical dome", `⅔πr³ = <b>${fmt(dome)} units³</b>`],
            ["Capacity", `${fmt(cylinder)} + ${fmt(dome)} = <b>${fmt(volume)} units³</b>`],
            ["Curved exterior", `2πrh + 2πr² = <b>${fmt(exterior)} units²</b>`],
          ],
          [
            "Draw a boundary between the cylinder and dome.",
            "Calculate each familiar volume separately.",
            "Add them because both regions contain material or storage space.",
          ],
        );
      }
      case "displacement": {
        const displaced = Math.max(0, v.after - v.before);
        return this.solidCard(
          "Volume by liquid displacement",
          "displacement-volume",
          "Vobject = Vfinal − Vinitial",
          "A fully submerged object pushes aside exactly its own volume of liquid. Measuring the rise converts an awkward shape into a subtraction.",
          [
            ["Initial reading", `${fmt(v.before)} mL`],
            ["Final reading", `${fmt(v.after)} mL`],
            ["Object volume", `${fmt(v.after)} − ${fmt(v.before)} = <b>${fmt(displaced)} mL = ${fmt(displaced)} cm³</b>`],
          ],
          [
            "Record the liquid volume before submerging the object.",
            "Submerge it completely without trapping air.",
            "Subtract the initial reading from the final reading.",
          ],
        );
      }
      case "archimedes": {
        const cone = Math.PI * v.radius ** 3 / 3;
        const hemisphere = 2 * Math.PI * v.radius ** 3 / 3;
        const cylinder = Math.PI * v.radius ** 3;
        const sphereRatio = 3 / v.radius;
        const cubeRatio = 6 / v.radius;
        return `<div class="course">
          <h3>Archimedes' 1 : 2 : 3 comparison</h3>
          ${this.formulaCard(
            "archimedes-volume-ratio",
            "Equal r and h = r",
            "Vcone : Vhemisphere : Vcylinder = 1 : 2 : 3",
            "All three solids use the same radius and vertical height.",
          )}
          <ol class="deriv">
            <li><b class="step-title">Cone</b>V = ⅓πr²h and h = r, so V = ⅓πr³.</li>
            <li><b class="step-title">Hemisphere</b>V = ½(⁴⁄₃πr³) = ⅔πr³.</li>
            <li><b class="step-title">Cylinder</b>V = πr²h = πr³.</li>
            <li><b class="step-title">Compare coefficients</b>⅓ : ⅔ : 1 = <b>1 : 2 : 3</b>.</li>
          </ol>
          ${this.readout([
            ["Cone", `⅓π × ${fmt(v.radius)}³ = <b>${fmt(cone)} units³</b>`],
            ["Hemisphere", `⅔π × ${fmt(v.radius)}³ = <b>${fmt(hemisphere)} units³</b>`],
            ["Cylinder", `π × ${fmt(v.radius)}³ = <b>${fmt(cylinder)} units³</b>`],
            ["Ratio check", `${fmt(cone / cone)} : ${fmt(hemisphere / cone)} : ${fmt(cylinder / cone)} = <b>1 : 2 : 3</b>`],
          ])}
        </div>
        <div class="course">
          <h3>Surface-area-to-volume ratio</h3>
          <p>Surface area scales with length² while volume scales with length³. Therefore SA/V
          scales as 1/length: larger similar objects have less surface per unit volume.</p>
          ${this.readout([
            ["Sphere", `SA/V = 3/r = 3/${fmt(v.radius)} = <b>${fmt(sphereRatio)} units⁻¹</b>`],
            ["Cube with side r", `SA/V = 6/a = 6/${fmt(v.radius)} = <b>${fmt(cubeRatio)} units⁻¹</b>`],
            ["Scale by k", `new SA/V = old SA/V ÷ k; for k = ${fmt(v.scale)}, it becomes <b>${fmt(1 / v.scale)}×</b> as large`],
          ])}
          ${derivationButton("surface-volume-scaling")}
          <p class="course-hint">This is why small animals lose heat quickly, small cells exchange
          substances efficiently, and fine powders react faster than solid blocks.</p>
        </div>`;
      }
    }
  }

  private solidCard(
    title: string,
    derivationId: string,
    equation: string,
    explanation: string,
    rows: [string, string][],
    steps: string[],
  ): string {
    return `<div class="course">
      <h3>${title}</h3>
      ${this.formulaCard(derivationId, title, equation, explanation)}
      <ol class="deriv">
        ${steps.map((step, index) => `<li><b class="step-title">${["Identify the base or pieces", "Follow the slices", "Complete the calculation"][index] ?? `Step ${index + 1}`}</b>${step}</li>`).join("")}
      </ol>
      ${this.readout(rows)}
    </div>`;
  }

  private formulaCard(id: string, label: string, equation: string, note: string): string {
    return `<div class="formula" data-derivation="${id}">
      <div class="formula-label">${label}</div>
      <div class="formula-body">${equation}</div>
      <div class="formula-note">${note}</div>
    </div>`;
  }

  private readout(rows: [string, string][]): string {
    return `<div class="readout">${rows.map(([label, value]) => `<div><span>${label}</span> <span>${value}</span></div>`).join("")}</div>`;
  }

  private input(key: ValueKey): string {
    const [label, unit, step] = LABELS[key];
    const min = key === "before" || key === "after" ? 0 : key === "sides" ? 3 : 0.1;
    const max = key === "sides" ? 12 : key === "capHeight" ? 2 * this.values.radius : 1000;
    return `<label class="geom-field">
      <span>${label}</span>
      <input data-volume-input="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${this.values[key]}" />
      <em>${unit}</em>
    </label>`;
  }

  private inputKeys(): ValueKey[] {
    if (this.chapter === "meaning") return ["side", "scale"];
    if (this.shape === "cube") return ["side"];
    return [...(INPUTS[this.shape] ?? [])];
  }

  private normaliseValues(): void {
    const nonNegative: ValueKey[] = [
      "side", "topSide", "length", "width", "height", "radius", "innerRadius",
      "majorRadius", "baseA", "baseB", "depth", "capHeight", "axisA", "axisB",
      "axisC", "scale", "before", "after",
    ];
    for (const key of nonNegative) {
      this.values[key] = round3(THREE.MathUtils.clamp(this.values[key], key === "before" || key === "after" ? 0 : 0.1, 1000));
    }
    this.values.sides = Math.round(THREE.MathUtils.clamp(this.values.sides, 3, 12));
    this.values.innerRadius = Math.min(this.values.innerRadius, Math.max(0.1, this.values.radius - 0.1));
    this.values.majorRadius = Math.max(this.values.majorRadius, this.values.radius + 0.1);
    this.values.capHeight = Math.min(this.values.capHeight, 2 * this.values.radius);
  }

  private pointerOnPlane(event: PointerEvent): THREE.Vector3 | undefined {
    if (!this.viewport) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const normal = this.viewport.camera.getWorldDirection(new THREE.Vector3());
    this.dragPlane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3());
    const target = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.dragPlane, target) ? target : undefined;
  }

  private pickHandle(event: PointerEvent): HandleKind | undefined {
    if (!this.viewport || this.handles.length === 0) return undefined;
    const rect = this.viewport.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.viewport.camera);
    const hit = this.raycaster.intersectObjects(this.handles, false)[0];
    return hit ? (hit.object.userData.handle as HandleKind) : undefined;
  }

  private applyDrag(kind: HandleKind, point: THREE.Vector3): void {
    const inverse = 1 / Math.max(this.sceneScale, 0.01);
    switch (kind) {
      case "radius":
        this.values.radius = Math.abs(point.x) * inverse;
        break;
      case "inner-radius":
        this.values.innerRadius = Math.abs(point.x) * inverse;
        break;
      case "height":
        this.values.height = Math.abs(point.y) * 2 * inverse;
        break;
      case "side":
        this.values.side = Math.abs(point.x) * 2 * inverse;
        break;
    }
    this.normaliseValues();
  }

  private drawScene(): void {
    this.sceneScale = this.scaleForShape();
    switch (this.shape) {
      case "cube":
        this.drawBox(this.values.side, this.values.side, this.values.side);
        this.handle(new THREE.Vector3(this.s(this.values.side) / 2, 0, 0), COL.radius, "side");
        this.label(new THREE.Vector3(this.s(this.values.side) / 2 + 0.6, 0, 0), `a = ${fmt(this.values.side)}`, COL.radius);
        break;
      case "cuboid":
        this.drawBox(this.values.length, this.values.height, this.values.width);
        this.heightHandle(this.values.height);
        this.label(new THREE.Vector3(0, this.s(this.values.height) / 2 + 0.55, 0), `h = ${fmt(this.values.height)}`, COL.height);
        break;
      case "triangular-prism":
        this.drawExtrudedPrism([
          new THREE.Vector2(-this.s(this.values.baseA) / 2, -this.s(this.values.depth) / 2),
          new THREE.Vector2(this.s(this.values.baseA) / 2, -this.s(this.values.depth) / 2),
          new THREE.Vector2(-this.s(this.values.baseA) / 2, this.s(this.values.depth) / 2),
        ], this.values.length);
        break;
      case "trapezoidal-prism": {
        const a = this.s(this.values.baseA);
        const b = this.s(this.values.baseB);
        const d = this.s(this.values.depth);
        this.drawExtrudedPrism([
          new THREE.Vector2(-a / 2, -d / 2),
          new THREE.Vector2(a / 2, -d / 2),
          new THREE.Vector2(b / 2, d / 2),
          new THREE.Vector2(-b / 2, d / 2),
        ], this.values.length);
        break;
      }
      case "polygon-prism":
        this.drawExtrudedPrism(this.regularPolygon(this.values.sides, this.s(this.values.side)), this.values.height);
        this.heightHandle(this.values.height);
        break;
      case "cylinder":
        this.drawCylinder(this.values.radius, this.values.radius, this.values.height);
        this.radiusHeightHandles(this.values.radius, this.values.height);
        this.addSweepDisk(this.values.radius, this.values.height);
        break;
      case "square-pyramid":
        this.addSolid(new THREE.ConeGeometry(this.s(this.values.side) / Math.sqrt(2), this.s(this.values.height), 4));
        this.group.children[0]?.rotateY(Math.PI / 4);
        this.handle(new THREE.Vector3(this.s(this.values.side) / 2, -this.s(this.values.height) / 2, 0), COL.radius, "side");
        this.heightHandle(this.values.height);
        break;
      case "rectangular-pyramid":
        this.addSolid(this.rectangularPyramidGeometry(this.s(this.values.length), this.s(this.values.width), this.s(this.values.height)));
        this.heightHandle(this.values.height);
        break;
      case "tetrahedron":
        this.addSolid(new THREE.TetrahedronGeometry(this.s(this.values.side) * Math.sqrt(6) / 4));
        this.handle(new THREE.Vector3(this.s(this.values.side) / 2, 0, 0), COL.radius, "side");
        break;
      case "cone":
        this.addSolid(new THREE.ConeGeometry(this.s(this.values.radius), this.s(this.values.height), 48));
        this.radiusHeightHandles(this.values.radius, this.values.height);
        break;
      case "sphere":
        this.addSolid(new THREE.SphereGeometry(this.s(this.values.radius), 48, 32));
        this.radiusHandle(this.values.radius);
        break;
      case "hemisphere": {
        const r = this.s(this.values.radius);
        const geometry = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
        geometry.translate(0, -r / 2, 0);
        this.addSolid(geometry);
        const base = new THREE.CircleGeometry(r, 48);
        base.rotateX(-Math.PI / 2);
        base.translate(0, -r / 2, 0);
        this.addSolid(base, COL.solid, 0.24);
        this.radiusHandle(this.values.radius);
        break;
      }
      case "spherical-cap": {
        const r = this.s(this.values.radius);
        const h = this.s(this.values.capHeight);
        const phi = Math.acos(THREE.MathUtils.clamp((r - h) / r, -1, 1));
        const geometry = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, phi);
        geometry.translate(0, -(r - h / 2), 0);
        this.addSolid(geometry);
        const baseRadius = Math.sqrt(Math.max(0, 2 * r * h - h ** 2));
        const base = new THREE.CircleGeometry(baseRadius, 48);
        base.rotateX(-Math.PI / 2);
        base.translate(0, -h / 2, 0);
        this.addSolid(base, COL.solid, 0.24);
        this.radiusHandle(this.values.radius);
        break;
      }
      case "ellipsoid": {
        const geometry = new THREE.SphereGeometry(1, 48, 32);
        geometry.scale(this.s(this.values.axisA), this.s(this.values.axisB), this.s(this.values.axisC));
        this.addSolid(geometry);
        break;
      }
      case "torus":
        this.addSolid(new THREE.TorusGeometry(this.s(this.values.majorRadius), this.s(this.values.radius), 24, 64));
        this.group.children[0]?.rotateX(Math.PI / 2);
        break;
      case "capsule":
        this.drawCapsule();
        this.radiusHeightHandles(this.values.radius, this.values.height);
        break;
      case "cone-frustum":
        this.drawCylinder(this.values.innerRadius, this.values.radius, this.values.height);
        this.radiusHeightHandles(this.values.radius, this.values.height);
        this.handle(new THREE.Vector3(this.s(this.values.innerRadius), this.s(this.values.height) / 2, 0), COL.inner, "inner-radius");
        break;
      case "square-frustum":
        this.addSolid(new THREE.CylinderGeometry(
          this.s(this.values.topSide) / Math.sqrt(2),
          this.s(this.values.side) / Math.sqrt(2),
          this.s(this.values.height),
          4,
        ));
        this.group.children[0]?.rotateY(Math.PI / 4);
        this.handle(new THREE.Vector3(this.s(this.values.side) / 2, -this.s(this.values.height) / 2, 0), COL.radius, "side");
        this.heightHandle(this.values.height);
        break;
      case "pipe":
        this.drawPipe();
        this.radiusHeightHandles(this.values.radius, this.values.height);
        this.handle(new THREE.Vector3(this.s(this.values.innerRadius), 0, 0), COL.inner, "inner-radius");
        break;
      case "silo":
        this.drawSilo();
        this.radiusHeightHandles(this.values.radius, this.values.height);
        break;
      case "displacement":
        this.drawDisplacement();
        break;
      case "archimedes":
        this.drawArchimedes();
        break;
    }
  }

  private scaleForShape(): number {
    const dimensions = (INPUTS[this.shape] ?? [])
      .filter((key) => !["sides", "scale", "before", "after"].includes(key))
      .map((key) => this.values[key]);
    const max = Math.max(1, ...dimensions);
    return Math.min(0.72, 5 / max);
  }

  private s(value: number): number {
    return value * this.sceneScale;
  }

  private drawBox(length: number, height: number, width: number): void {
    this.addSolid(new THREE.BoxGeometry(this.s(length), this.s(height), this.s(width)));
    this.addSweepBox(length, width, height);
  }

  private drawCylinder(topRadius: number, bottomRadius: number, height: number): void {
    this.addSolid(new THREE.CylinderGeometry(
      this.s(topRadius),
      this.s(bottomRadius),
      this.s(height),
      48,
      1,
      false,
    ));
  }

  private drawExtrudedPrism(points: THREE.Vector2[], height: number): void {
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: this.s(height),
      bevelEnabled: false,
      steps: 1,
    });
    geometry.center();
    geometry.rotateX(-Math.PI / 2);
    this.addSolid(geometry);
    this.label(new THREE.Vector3(0, this.s(height) / 2 + 0.55, 0), `h = ${fmt(height)}`, COL.height);
  }

  private regularPolygon(n: number, side: number): THREE.Vector2[] {
    const radius = side / (2 * Math.sin(Math.PI / n));
    return Array.from({ length: n }, (_, index) => {
      const angle = Math.PI / 2 + (index * Math.PI * 2) / n;
      return new THREE.Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
    });
  }

  private rectangularPyramidGeometry(length: number, width: number, height: number): THREE.BufferGeometry {
    const vertices = new Float32Array([
      -length / 2, -height / 2, -width / 2,
      length / 2, -height / 2, -width / 2,
      length / 2, -height / 2, width / 2,
      -length / 2, -height / 2, width / 2,
      0, height / 2, 0,
    ]);
    const indices = [
      0, 2, 1, 0, 3, 2,
      0, 1, 4, 1, 2, 4,
      2, 3, 4, 3, 0, 4,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  private drawCapsule(): void {
    const r = this.s(this.values.radius);
    const h = this.s(this.values.height);
    this.addSolid(new THREE.CylinderGeometry(r, r, h, 48));
    const top = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    top.translate(0, h / 2, 0);
    this.addSolid(top);
    const bottom = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    bottom.translate(0, -h / 2, 0);
    this.addSolid(bottom);
  }

  private drawPipe(): void {
    const outer = this.s(this.values.radius);
    const inner = this.s(this.values.innerRadius);
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: this.s(this.values.height),
      bevelEnabled: false,
      curveSegments: 48,
    });
    geometry.center();
    geometry.rotateX(-Math.PI / 2);
    this.addSolid(geometry);
  }

  private drawSilo(): void {
    const r = this.s(this.values.radius);
    const h = this.s(this.values.height);
    const cylinder = new THREE.CylinderGeometry(r, r, h, 48);
    cylinder.translate(0, -r / 2, 0);
    this.addSolid(cylinder);
    const dome = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(0, h / 2 - r / 2, 0);
    this.addSolid(dome);
  }

  private drawDisplacement(): void {
    const vessel = new THREE.CylinderGeometry(2.2, 2.2, 5, 48, 1, true);
    this.addSolid(vessel, 0x8b949e, 0.12);
    const rise = THREE.MathUtils.clamp((this.values.after - this.values.before) / 600, 0.2, 1.5);
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.05, 2 + rise, 48),
      new THREE.MeshBasicMaterial({ color: COL.liquid, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    liquid.position.y = -1.5 + rise / 2;
    this.group.add(liquid);
    const object = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 1),
      new THREE.MeshStandardMaterial({ color: COL.inner, transparent: true, opacity: 0.75 }),
    );
    object.position.y = -0.8;
    this.group.add(object);
    this.label(new THREE.Vector3(2.8, -0.5, 0), `rise = ${fmt(Math.max(0, this.values.after - this.values.before))} mL`, COL.liquid);
  }

  private drawArchimedes(): void {
    const r = Math.min(1.5, this.s(this.values.radius));
    const h = r;
    this.addSolid(new THREE.ConeGeometry(r, h, 40), 0xffa657, 0.34, new THREE.Vector3(-3.6, 0, 0));
    const hemi = new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    hemi.translate(0, -r / 2, 0);
    this.addSolid(hemi, 0xd2a8ff, 0.34, new THREE.Vector3(0, 0, 0));
    this.addSolid(new THREE.CylinderGeometry(r, r, h, 40), 0x58a6ff, 0.28, new THREE.Vector3(3.6, 0, 0));
    this.label(new THREE.Vector3(-3.6, -1.5, 0), "cone · 1", 0xffa657);
    this.label(new THREE.Vector3(0, -1.5, 0), "hemisphere · 2", 0xd2a8ff);
    this.label(new THREE.Vector3(3.6, -1.5, 0), "cylinder · 3", 0x58a6ff);
  }

  private addSweepDisk(radius: number, height: number): void {
    const slice = new THREE.Mesh(
      new THREE.CylinderGeometry(this.s(radius) * 1.02, this.s(radius) * 1.02, 0.06, 48),
      new THREE.MeshBasicMaterial({ color: COL.slice, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.group.add(slice);
    this.sweepSlice = slice;
    this.sweepRange = [-this.s(height) / 2, this.s(height) / 2];
  }

  private addSweepBox(length: number, width: number, height: number): void {
    const slice = new THREE.Mesh(
      new THREE.BoxGeometry(this.s(length) * 1.01, 0.05, this.s(width) * 1.01),
      new THREE.MeshBasicMaterial({ color: COL.slice, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    this.group.add(slice);
    this.sweepSlice = slice;
    this.sweepRange = [-this.s(height) / 2, this.s(height) / 2];
  }

  private addSolid(
    geometry: THREE.BufferGeometry,
    color = COL.solid,
    opacity = 0.32,
    position = new THREE.Vector3(),
  ): void {
    const solid = new THREE.Group();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.55,
        metalness: 0.05,
      }),
    );
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 18),
      new THREE.LineBasicMaterial({ color: COL.edge, transparent: true, opacity: 0.9 }),
    );
    solid.add(mesh, edges);
    solid.position.copy(position);
    this.group.add(solid);
  }

  private radiusHeightHandles(radius: number, height: number): void {
    this.radiusHandle(radius, 0, -this.s(height) / 2);
    this.heightHandle(height);
    this.label(new THREE.Vector3(this.s(radius) / 2, -this.s(height) / 2 - 0.45, 0), `r = ${fmt(radius)}`, COL.radius);
    this.label(new THREE.Vector3(0.55, this.s(height) / 4, 0), `h = ${fmt(height)}`, COL.height);
  }

  private radiusHandle(radius: number, xOffset = 0, y = 0): void {
    this.handle(new THREE.Vector3(xOffset + this.s(radius), y, 0), COL.radius, "radius");
  }

  private heightHandle(height: number): void {
    this.handle(new THREE.Vector3(0, this.s(height) / 2, 0), COL.height, "height");
  }

  private handle(position: THREE.Vector3, color: number, kind: HandleKind): void {
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 20, 20),
      new THREE.MeshBasicMaterial({ color, depthTest: false }),
    );
    knob.position.copy(position);
    knob.renderOrder = 10;
    knob.userData.handle = kind;
    this.group.add(knob);
    this.handles.push(knob);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
    }));
    halo.position.copy(position);
    halo.scale.set(0.65, 0.65, 0.65);
    this.group.add(halo);
  }

  private label(position: THREE.Vector3, value: string, color: number): void {
    const label = textSprite(value, color, 0.34);
    label.position.copy(position);
    this.group.add(label);
  }

  private disposeChildren(group: THREE.Group): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => this.disposeMaterial(item));
      else if (material) this.disposeMaterial(material);
    });
    group.clear();
  }

  private disposeMaterial(material: THREE.Material): void {
    (material as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    material.dispose();
  }
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, "") : "undefined";
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
