import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  flowerOfLife,
  PLATONIC_SOLIDS,
  seedOfLife,
  type PlatonicSolidId,
  type SacredPoint,
} from "../math/sacredGeometry";

type View = "construction" | "solids";
type ConstructionStep = "first-circle" | "vesica" | "seed" | "flower";

interface Construction {
  readonly id: ConstructionStep;
  readonly label: string;
  readonly circleCount: number;
  readonly copy: string;
}

const CONSTRUCTIONS: readonly Construction[] = [
  {
    id: "first-circle",
    label: "1 · First circle",
    circleCount: 1,
    copy: "Set a compass width once. The first circle fixes that radius for every circle that follows.",
  },
  {
    id: "vesica",
    label: "2 · Vesica piscis",
    circleCount: 2,
    copy: "Put the next centre on the first circle's rim. Each centre is exactly one radius from the other.",
  },
  {
    id: "seed",
    label: "3 · Seed of Life",
    circleCount: 7,
    copy: "Continue in sixty-degree turns around the centre. Six equal circles make a hexagonal ring around the original one.",
  },
  {
    id: "flower",
    label: "4 · Flower of Life",
    circleCount: 19,
    copy: "Extend the same triangular lattice by one ring. The traditional name is Flower of Life; the geometry is nineteen congruent circles.",
  },
];

const CIRCLE_RADIUS = 1.45;
const CIRCLE_SEGMENTS = 128;

/** Construct a hexagonal circle lattice, then inspect the five convex regular polyhedra. */
export class SacredGeometryLesson implements Lesson {
  readonly id = "sacred-geometry";
  readonly title = "Sacred Geometry";
  readonly blurb = "Circle constructions + Platonic solids";
  readonly category = "Shape" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["circle-glossary", "volume"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private view: View = "construction";
  private construction: ConstructionStep = "first-circle";
  private solidId: PlatonicSolidId = "tetrahedron";
  private constructionLines: THREE.Line[] = [];
  private rotatingSolid?: THREE.Group;
  private animationStarted = 0;
  private stopTick?: () => void;
  private previousRotate = true;

  private readonly infoHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const viewButton = target.closest<HTMLButtonElement>("[data-sacred-view]");
    if (viewButton) {
      const view = viewButton.dataset.sacredView as View;
      if (view === "construction" || view === "solids") {
        this.view = view;
        this.rebuild();
      }
      return;
    }

    const stepButton = target.closest<HTMLButtonElement>("[data-sacred-step]");
    if (stepButton) {
      const step = stepButton.dataset.sacredStep as ConstructionStep;
      if (CONSTRUCTIONS.some((item) => item.id === step)) {
        this.construction = step;
        this.rebuild();
      }
      return;
    }

    if (target.closest<HTMLButtonElement>("[data-sacred-replay]")) {
      this.animationStarted = 0;
      return;
    }

    const solidButton = target.closest<HTMLButtonElement>("[data-sacred-solid]");
    if (!solidButton) return;
    const solidId = solidButton.dataset.sacredSolid as PlatonicSolidId;
    if (PLATONIC_SOLIDS.some((solid) => solid.id === solidId)) {
      this.solidId = solidId;
      this.rebuild();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    document.getElementById("info")?.addEventListener("click", this.infoHandler);
    this.stopTick = ctx.viewport.onTick((dt, elapsed) => this.tick(dt, elapsed));
    this.rebuild();
  }

  exit(): void {
    document.getElementById("info")?.removeEventListener("click", this.infoHandler);
    this.stopTick?.();
    this.stopTick = undefined;
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.disposeChildren(this.group);
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.constructionLines = [];
    this.rotatingSolid = undefined;
    this.viewport = undefined;
  }

  private rebuild(): void {
    this.disposeChildren(this.group);
    this.constructionLines = [];
    this.rotatingSolid = undefined;
    this.animationStarted = 0;
    this.configureCamera();
    if (this.view === "construction") this.drawConstruction();
    else this.drawSolid();
    this.renderPanel();
  }

  private configureCamera(): void {
    if (!this.viewport) return;
    this.viewport.setHelpers(false);
    if (this.view === "construction") {
      this.viewport.controls.enableRotate = false;
      this.viewport.frameCamera(new THREE.Vector3(0, 0, 13), new THREE.Vector3(0, 0, 0));
    } else {
      this.viewport.controls.enableRotate = true;
      this.viewport.frameCamera(new THREE.Vector3(7, 5, 9), new THREE.Vector3(0, 0, 0));
    }
  }

  private tick(dt: number, elapsed: number): void {
    if (this.view === "construction") {
      if (this.animationStarted === 0) this.animationStarted = elapsed;
      const progress = (elapsed - this.animationStarted) / 0.32;
      this.constructionLines.forEach((line, index) => {
        const circleProgress = THREE.MathUtils.clamp(progress - index, 0, 1);
        line.geometry.setDrawRange(0, Math.round(circleProgress * (CIRCLE_SEGMENTS + 1)));
      });
      return;
    }
    if (this.rotatingSolid) this.rotatingSolid.rotation.y += dt * 0.45;
  }

  private drawConstruction(): void {
    for (const centre of this.centresForConstruction()) {
      this.drawCircle(centre);
      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(0.055, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 }),
      );
      marker.position.set(centre.x, centre.y, 0.02);
      this.group.add(marker);
    }
  }

  private centresForConstruction(): SacredPoint[] {
    switch (this.construction) {
      case "first-circle":
        return [{ x: 0, y: 0 }];
      case "vesica":
        return [{ x: 0, y: 0 }, { x: CIRCLE_RADIUS, y: 0 }];
      case "seed":
        return seedOfLife(CIRCLE_RADIUS);
      case "flower":
        return flowerOfLife(CIRCLE_RADIUS);
    }
  }

  private drawCircle(centre: SacredPoint): void {
    const points = Array.from({ length: CIRCLE_SEGMENTS + 1 }, (_, index) => {
      const angle = (index / CIRCLE_SEGMENTS) * Math.PI * 2;
      return new THREE.Vector3(
        centre.x + CIRCLE_RADIUS * Math.cos(angle),
        centre.y + CIRCLE_RADIUS * Math.sin(angle),
        0,
      );
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x79c0ff, transparent: true, opacity: 0.86 }),
    );
    line.geometry.setDrawRange(0, 0);
    this.constructionLines.push(line);
    this.group.add(line);
  }

  private drawSolid(): void {
    const solid = new THREE.Group();
    const geometry = this.geometryForSolid(this.solidId);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x1f6feb,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.15,
      }),
    );
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xb6d8ff, transparent: true, opacity: 0.95 }),
    );
    solid.add(mesh, edges);
    solid.rotation.x = 0.26;
    this.rotatingSolid = solid;
    this.group.add(solid);
  }

  private geometryForSolid(id: PlatonicSolidId): THREE.BufferGeometry {
    switch (id) {
      case "tetrahedron":
        return new THREE.TetrahedronGeometry(2.8);
      case "cube":
        return new THREE.BoxGeometry(4.2, 4.2, 4.2);
      case "octahedron":
        return new THREE.OctahedronGeometry(3);
      case "dodecahedron":
        return new THREE.DodecahedronGeometry(3);
      case "icosahedron":
        return new THREE.IcosahedronGeometry(3);
    }
  }

  private renderPanel(): void {
    const viewNav = ([
      ["construction", "Compass construction"],
      ["solids", "Platonic solids"],
    ] as const)
      .map(([id, label]) => `<button class="course-btn${this.view === id ? "" : " ghost"}" type="button" data-sacred-view="${id}" aria-pressed="${this.view === id}">${label}</button>`)
      .join("");

    this.setInfo(`
      <h2>Sacred Geometry</h2>
      <p>Build a pattern from one compass width, then inspect the only five convex solids whose faces and vertex arrangements are all regular. The names are historical; the lesson focuses on the geometry.</p>
      <div class="course-chapters">${viewNav}</div>
      ${this.view === "construction" ? this.constructionPanel() : this.solidsPanel()}
    `);
  }

  private constructionPanel(): string {
    const current = CONSTRUCTIONS.find((item) => item.id === this.construction) ?? CONSTRUCTIONS[0];
    const steps = CONSTRUCTIONS
      .map((item) => `<button class="course-btn${item.id === current.id ? "" : " ghost"}" type="button" data-sacred-step="${item.id}" aria-pressed="${item.id === current.id}">${item.label}</button>`)
      .join("");

    return `
      <div class="course">
        <h3>Build the circle lattice</h3>
        <div class="course-chapters">${steps}</div>
        <p>${current.copy}</p>
        <div class="readout">
          <div><span>Circles drawn</span><b data-sacred-circle-count>${current.circleCount}</b></div>
          <div><span>Compass width</span><b>constant</b></div>
          <div><span>Centres</span><b>triangular lattice</b></div>
        </div>
        <button class="course-btn ghost" type="button" data-sacred-replay>Replay construction</button>
        <p class="course-hint">The animation traces one circle at a time. A new centre always sits one radius away from a neighbouring centre, creating equilateral triangles and six-fold symmetry.</p>
      </div>
      <details class="course">
        <summary>What the pattern does and does not show</summary>
        <p>Equal circles overlap into lens shapes called vesicae piscis. Repeating the construction creates a hexagonal packing pattern, useful in tiling, crystal structures and close-packed circles. It is a visual construction, not evidence for scientific or supernatural claims.</p>
      </details>`;
  }

  private solidsPanel(): string {
    const current = PLATONIC_SOLIDS.find((solid) => solid.id === this.solidId) ?? PLATONIC_SOLIDS[0];
    const choices = PLATONIC_SOLIDS
      .map((solid) => `<button class="course-btn${solid.id === current.id ? "" : " ghost"}" type="button" data-sacred-solid="${solid.id}" aria-pressed="${solid.id === current.id}">${solid.name}</button>`)
      .join("");
    const dual = PLATONIC_SOLIDS.find((solid) => solid.id === current.dual)!;

    return `
      <div class="course">
        <h3>Choose a regular solid</h3>
        <div class="course-chapters">${choices}</div>
        <p>The ${current.name} rotates automatically; drag the view to inspect it. Its Schläfli symbol <code>${current.schlafli}</code> says each face is a regular ${current.faceSides}-gon and ${current.vertexDegree} faces meet at a vertex.</p>
        <div class="readout">
          <div><span>Vertices V</span><b data-sacred-vertices>${current.vertices}</b></div>
          <div><span>Edges E</span><b data-sacred-edges>${current.edges}</b></div>
          <div><span>Faces F</span><b data-sacred-faces>${current.faces}</b></div>
          <div><span>Euler check</span><b data-sacred-euler>${current.vertices} − ${current.edges} + ${current.faces} = 2</b></div>
          <div><span>Dual</span><b>${dual.name}</b></div>
          <div><span>Dihedral angle</span><b>${current.dihedralDegrees}°</b></div>
        </div>
      </div>
      <details class="course">
        <summary>Why only five?</summary>
        <p>At least three faces must meet at each vertex, and their interior angles must leave room to fold around it. That restriction permits exactly five convex regular polyhedra. Pair each face centre to form the dual: cube and octahedron exchange, dodecahedron and icosahedron exchange, and the tetrahedron is its own dual.</p>
      </details>`;
  }

  private disposeChildren(group: THREE.Group): void {
    group.traverse((object) => {
      const renderable = object as THREE.Object3D & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      renderable.geometry?.dispose();
      if (Array.isArray(renderable.material)) {
        renderable.material.forEach((material) => this.disposeMaterial(material));
      } else if (renderable.material) {
        this.disposeMaterial(renderable.material);
      }
    });
    group.clear();
  }

  private disposeMaterial(material: THREE.Material): void {
    (material as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    material.dispose();
  }
}
