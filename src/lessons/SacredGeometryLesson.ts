import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  flowerLatticeTriangles,
  flowerOfLife,
  interiorAngleDegrees,
  PLATONIC_SOLIDS,
  platonicCircumradius,
  platonicFacePlan,
  platonicFaces,
  polygonCircumradius,
  regularPolygon,
  seedOfLife,
  type PlatonicSolid,
  type PlatonicSolidId,
  type SacredPoint,
} from "../math/sacredGeometry";

type View = "construction" | "solids";
type ConstructionStep = "first-circle" | "vesica" | "seed" | "flower";
type SolidPhase = "lattice" | "face" | "plan" | "assembly" | "solid";

interface Construction {
  readonly id: ConstructionStep;
  readonly label: string;
  readonly circleCount: number;
  readonly copy: string;
}

interface PhaseStep {
  readonly id: SolidPhase;
  readonly label: string;
  readonly name: string;
}

interface AssemblyFace {
  readonly pivot: THREE.Group;
  readonly flatPosition: THREE.Vector3;
  readonly flatQuaternion: THREE.Quaternion;
  readonly solidPosition: THREE.Vector3;
  readonly solidQuaternion: THREE.Quaternion;
  readonly delay: number;
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
/** Display size of each solid, matching the geometry the finished-solid phase renders. */
const SOLID_CIRCUMRADII: Record<PlatonicSolidId, number> = {
  tetrahedron: 2.8,
  cube: (4.2 * Math.sqrt(3)) / 2,
  octahedron: 3,
  dodecahedron: 3,
  icosahedron: 3,
};
const ASSEMBLY_DURATION = 0.9;
const ASSEMBLY_STAGGER = 0.11;

/** Why the two non-triangular faces cannot come from the Flower's triangular lattice. */
const NON_LATTICE_NOTE: Partial<Record<PlatonicSolidId, string>> = {
  cube: "a triangular lattice holds no squares at all: turning one lattice step through 90° never lands on another lattice point.",
  dodecahedron:
    "no repeating lattice of any kind holds a regular pentagon, because five-fold symmetry cannot tile the plane periodically.",
};

const PHASES: readonly PhaseStep[] = [
  { id: "lattice", label: "1 · Lattice", name: "Flower lattice" },
  { id: "face", label: "2 · One face", name: "One regular face" },
  { id: "plan", label: "3 · Face plan", name: "Flat face plan" },
  { id: "assembly", label: "4 · Assemble", name: "Assembly animation" },
  { id: "solid", label: "5 · Solid", name: "Finished solid" },
];

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
  private solidPhase: SolidPhase = "lattice";
  private constructionLines: THREE.Line[] = [];
  private rotatingSolid?: THREE.Group;
  private assemblyFaces: AssemblyFace[] = [];
  private assemblyProgress = 0;
  private reportedAssemblyPercent = -1;
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

    const phaseButton = target.closest<HTMLButtonElement>("[data-sacred-phase]");
    if (phaseButton) {
      const phase = phaseButton.dataset.sacredPhase as SolidPhase;
      if (PHASES.some((item) => item.id === phase)) {
        this.solidPhase = phase;
        this.rebuild();
      }
      return;
    }

    if (target.closest<HTMLButtonElement>("[data-sacred-replay]")) {
      this.animationStarted = 0;
      this.assemblyProgress = 0;
      this.reportedAssemblyPercent = -1;
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
    this.assemblyFaces = [];
    this.assemblyProgress = 0;
    this.reportedAssemblyPercent = -1;
    this.rotatingSolid = undefined;
    this.viewport = undefined;
  }

  private rebuild(): void {
    this.disposeChildren(this.group);
    this.constructionLines = [];
    this.assemblyFaces = [];
    this.rotatingSolid = undefined;
    this.assemblyProgress = 0;
    this.reportedAssemblyPercent = -1;
    this.animationStarted = 0;
    if (this.view === "construction") this.drawConstruction();
    else this.drawSolidPhase();
    this.configureCamera();
    this.renderPanel();
  }

  private configureCamera(): void {
    if (!this.viewport) return;
    this.viewport.setHelpers(false);
    if (this.view === "construction") {
      this.viewport.controls.enableRotate = false;
      this.viewport.frameCamera(new THREE.Vector3(0, 0, 13), new THREE.Vector3(0, 0, 0));
      return;
    }

    if (this.solidPhase === "lattice" || this.solidPhase === "face" || this.solidPhase === "plan") {
      this.viewport.controls.enableRotate = false;
      this.frameRadius(this.contentRadius(), new THREE.Vector3(0, 0, 1));
      return;
    }

    this.viewport.controls.enableRotate = true;
    // The plan is much wider than the solid, so split the difference while faces travel.
    const radius =
      this.solidPhase === "assembly"
        ? (this.contentRadius() + SOLID_CIRCUMRADII[this.solidId]) / 2
        : this.contentRadius();
    this.frameRadius(radius, new THREE.Vector3(7, 5, 9));
  }

  /** Pull the camera back far enough for a sphere of `radius` to fit both screen axes. */
  private frameRadius(radius: number, direction: THREE.Vector3): void {
    if (!this.viewport) return;
    const camera = this.viewport.camera;
    const halfVertical = THREE.MathUtils.degToRad(camera.fov) / 2;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect);
    const distance = (radius * 1.15) / Math.sin(Math.max(0.05, Math.min(halfVertical, halfHorizontal)));
    this.viewport.frameCamera(
      direction.clone().normalize().multiplyScalar(distance),
      new THREE.Vector3(0, 0, 0),
    );
  }

  /** Radius of a sphere around whatever the current phase draws, used to frame the camera. */
  private contentRadius(): number {
    const box = new THREE.Box3().setFromObject(this.group);
    if (box.isEmpty()) return 6;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    return Math.max(4, sphere.radius);
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
    if (this.solidPhase === "assembly") {
      this.tickAssembly(elapsed);
      return;
    }
    if (this.rotatingSolid) this.rotatingSolid.rotation.y += dt * 0.45;
  }

  /** Move every face rigidly from its place in the flat plan to its place on the solid. */
  private tickAssembly(elapsed: number): void {
    if (this.assemblyFaces.length === 0) return;
    if (this.animationStarted === 0) this.animationStarted = elapsed;
    const time = elapsed - this.animationStarted;

    let total = 0;
    for (const face of this.assemblyFaces) {
      const raw = THREE.MathUtils.clamp((time - face.delay) / ASSEMBLY_DURATION, 0, 1);
      total += raw;
      const eased = raw * raw * (3 - 2 * raw);
      face.pivot.position.lerpVectors(face.flatPosition, face.solidPosition, eased);
      face.pivot.quaternion.slerpQuaternions(face.flatQuaternion, face.solidQuaternion, eased);
    }

    this.assemblyProgress = total / this.assemblyFaces.length;
    this.reportAssemblyProgress();
  }

  /** Mirror the animation into the panel so progress is readable (and testable) as text. */
  private reportAssemblyProgress(): void {
    const percent = Math.round(this.assemblyProgress * 100);
    if (percent === this.reportedAssemblyPercent) return;
    this.reportedAssemblyPercent = percent;
    const readout = document.querySelector<HTMLElement>("[data-sacred-assembly-progress]");
    if (readout) readout.textContent = `${percent}%`;
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

  private drawCircle(centre: SacredPoint, animated = true): void {
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
      new THREE.LineBasicMaterial({
        color: 0x79c0ff,
        transparent: true,
        opacity: animated ? 0.86 : 0.32,
      }),
    );
    if (animated) {
      line.geometry.setDrawRange(0, 0);
      this.constructionLines.push(line);
    }
    this.group.add(line);
  }

  private drawSolidPhase(): void {
    switch (this.solidPhase) {
      case "lattice":
        this.drawLatticeContext();
        return;
      case "face":
        this.drawSingleFace();
        return;
      case "plan":
        this.drawFacePlan();
        return;
      case "assembly":
        this.drawAssembly();
        return;
      case "solid":
        this.drawSolid();
    }
  }

  /**
   * Phase 1. The Flower of Life drawn as the triangular lattice it is. Triangle-faced
   * solids get a lattice cell highlighted, because that cell is their face. The cube and
   * the dodecahedron get their own polygon drawn over the lattice instead, because a
   * square and a regular pentagon are not cells of it.
   */
  private drawLatticeContext(): void {
    for (const centre of flowerOfLife(CIRCLE_RADIUS)) this.drawCircle(centre, false);

    const cells = flowerLatticeTriangles(CIRCLE_RADIUS);
    for (const cell of cells) this.addPolygonOutline(cell, 0x3fb950, 0.28, 0.01);

    const solid = this.currentSolid();
    if (solid.faceFromFlowerLattice) {
      const highlight = cells.reduce((best, cell) =>
        centroidDistance(cell) < centroidDistance(best) ? cell : best,
      );
      this.addPolygonFill(highlight, 0x3fb950, 0.42, 0.02);
      this.addPolygonOutline(highlight, 0x7ee787, 0.95, 0.03);
      for (const corner of highlight) this.addMarker(corner, 0xffd166, 0.07);
      return;
    }

    const needed = regularPolygon(
      solid.faceSides,
      polygonCircumradius(solid.faceSides, CIRCLE_RADIUS),
      // Stand the polygon on one lattice step, so its first two corners are lattice
      // points and the rest visibly miss.
      { x: CIRCLE_RADIUS / 2, y: CIRCLE_RADIUS / (2 * Math.tan(Math.PI / solid.faceSides)) },
      Math.atan2(-CIRCLE_RADIUS / (2 * Math.tan(Math.PI / solid.faceSides)), -CIRCLE_RADIUS / 2),
    );
    this.addPolygonFill(needed, 0xffa657, 0.34, 0.02);
    this.addPolygonOutline(needed, 0xffd166, 0.95, 0.03);
    needed.forEach((corner, index) =>
      this.addMarker(corner, index < 2 ? 0x7ee787 : 0xffd166, 0.08),
    );
  }

  /** Phase 2. One face at true size, with its corners marked. */
  private drawSingleFace(): void {
    const solid = this.currentSolid();
    // A square reads as a square when it sits on an edge, not on a corner.
    const points = regularPolygon(
      solid.faceSides,
      3,
      { x: 0, y: 0 },
      solid.faceSides === 4 ? Math.PI / 4 : Math.PI / 2,
    );
    this.addPolygonFill(points, 0x1f6feb, 0.4, 0);
    this.addPolygonOutline(points, 0xb6d8ff, 0.95, 0.01);
    for (const corner of points) this.addMarker(corner, 0xffd166, 0.09);
    this.addMarker({ x: 0, y: 0 }, 0x7ee787, 0.07);
    for (const corner of points) {
      const spoke = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0.01),
          new THREE.Vector3(corner.x, corner.y, 0.01),
        ]),
        new THREE.LineBasicMaterial({ color: 0x7ee787, transparent: true, opacity: 0.35 }),
      );
      this.group.add(spoke);
    }
  }

  /** Phase 3. Every face of the solid laid flat at true size. */
  private drawFacePlan(): void {
    const solid = this.currentSolid();
    const plan = platonicFacePlan(solid.id, this.edgeLength());
    plan.forEach((face, index) => {
      this.addPolygonFill(face.vertices, index === 0 ? 0x3fb950 : 0x1f6feb, 0.36, 0);
      this.addPolygonOutline(face.vertices, index === 0 ? 0x7ee787 : 0xb6d8ff, 0.9, 0.01);
    });
  }

  /**
   * Phase 4. Each face keeps its size and shape and travels from the flat plan to its
   * place on the solid: a rigid motion per face, not a hinged fold of a paper net.
   */
  private drawAssembly(): void {
    const solid = this.currentSolid();
    const edgeLength = this.edgeLength();
    const plan = platonicFacePlan(solid.id, edgeLength);
    const faces = platonicFaces(solid.id, edgeLength);
    const circumradius = polygonCircumradius(solid.faceSides, edgeLength);

    const assembly = new THREE.Group();
    assembly.rotation.x = 0.26;

    faces.forEach((face, index) => {
      const flat = plan[index];
      const pivot = new THREE.Group();
      const geometry = new THREE.CircleGeometry(circumradius, solid.faceSides);
      pivot.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: 0x1f6feb,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            roughness: 0.35,
            metalness: 0.15,
          }),
        ),
      );
      pivot.add(
        new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            regularPolygon(solid.faceSides, circumradius).map(
              (point) => new THREE.Vector3(point.x, point.y, 0.002),
            ),
          ),
          new THREE.LineBasicMaterial({ color: 0xb6d8ff, transparent: true, opacity: 0.95 }),
        ),
      );

      const normal = toVector3(face.normal);
      const centroid = toVector3(face.centroid);
      const u = toVector3(face.vertices[0]).sub(centroid).normalize();
      const w = new THREE.Vector3().crossVectors(normal, u);

      const entry: AssemblyFace = {
        pivot,
        flatPosition: new THREE.Vector3(flat.centre.x, flat.centre.y, 0),
        flatQuaternion: new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          flat.rotation,
        ),
        solidPosition: centroid,
        solidQuaternion: new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(u, w, normal),
        ),
        delay: index * ASSEMBLY_STAGGER,
      };
      pivot.position.copy(entry.flatPosition);
      pivot.quaternion.copy(entry.flatQuaternion);

      this.assemblyFaces.push(entry);
      assembly.add(pivot);
    });

    this.group.add(assembly);
  }

  private addPolygonFill(points: readonly SacredPoint[], color: number, opacity: number, z: number): void {
    const centre = new THREE.Vector3(
      points.reduce((sum, point) => sum + point.x, 0) / points.length,
      points.reduce((sum, point) => sum + point.y, 0) / points.length,
      z,
    );
    const fan: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      fan.push(
        centre.clone(),
        new THREE.Vector3(points[i].x, points[i].y, z),
        new THREE.Vector3(next.x, next.y, z),
      );
    }
    const mesh = new THREE.Mesh(
      new THREE.BufferGeometry().setFromPoints(fan),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }),
    );
    this.group.add(mesh);
  }

  private addPolygonOutline(points: readonly SacredPoint[], color: number, opacity: number, z: number): void {
    const loop = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        points.map((point) => new THREE.Vector3(point.x, point.y, z)),
      ),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    this.group.add(loop);
  }

  private addMarker(point: SacredPoint, color: number, radius: number): void {
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
    marker.position.set(point.x, point.y, 0.04);
    this.group.add(marker);
  }

  private currentSolid(): PlatonicSolid {
    return PLATONIC_SOLIDS.find((solid) => solid.id === this.solidId) ?? PLATONIC_SOLIDS[0];
  }

  /** Edge length that puts every face of this solid on the shared display size. */
  private edgeLength(): number {
    return SOLID_CIRCUMRADII[this.solidId] / platonicCircumradius(this.solidId, 1);
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
    const current = this.currentSolid();
    const choices = PLATONIC_SOLIDS
      .map((solid) => `<button class="course-btn${solid.id === current.id ? "" : " ghost"}" type="button" data-sacred-solid="${solid.id}" aria-pressed="${solid.id === current.id}">${solid.name}</button>`)
      .join("");
    const dual = PLATONIC_SOLIDS.find((solid) => solid.id === current.dual)!;
    const phase = PHASES.find((item) => item.id === this.solidPhase) ?? PHASES[0];
    const phaseButtons = PHASES
      .map((item) => `<button class="course-btn${item.id === phase.id ? "" : " ghost"}" type="button" data-sacred-phase="${item.id}" aria-pressed="${item.id === phase.id}">${item.label}</button>`)
      .join("");

    return `
      <div class="course">
        <h3>Choose a regular solid</h3>
        <div class="course-chapters">${choices}</div>
        <h3>Build the ${lowerName(current)} in five phases</h3>
        <div class="course-chapters" data-sacred-phases>${phaseButtons}</div>
        <p data-sacred-phase-copy>${this.phaseCopy(current)}</p>
        <div class="readout">
          <div><span>Phase</span><b data-sacred-phase-name>${phase.name}</b></div>
          <div><span>Face polygon</span><b data-sacred-face-shape>${current.faceName}</b></div>
          <div><span>Faces to place</span><b data-sacred-face-plan-count>${current.faces}</b></div>
          <div><span>Face from Flower lattice</span><b data-sacred-lattice-source>${current.faceFromFlowerLattice ? "yes" : "no"}</b></div>
        </div>
        ${this.phaseExtras(current)}
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
        <summary>What the Flower lattice does and does not supply</summary>
        <p>The Flower of Life is a triangular lattice, so its cells are equilateral triangles. That single polygon is the face of the tetrahedron, the octahedron and the icosahedron, so for those three the lattice supplies the face geometry directly. A cube needs squares and a dodecahedron needs regular pentagons; neither polygon is a cell of this lattice, so those two are constructed from their own polygon and the Flower is only context.</p>
      </details>
      <details class="course">
        <summary>Why only five?</summary>
        <p>At least three faces must meet at each vertex, and their interior angles must leave room to fold around it. That restriction permits exactly five convex regular polyhedra. Pair each face centre to form the dual: cube and octahedron exchange, dodecahedron and icosahedron exchange, and the tetrahedron is its own dual.</p>
      </details>`;
  }

  private phaseCopy(solid: PlatonicSolid): string {
    const interior = interiorAngleDegrees(solid.faceSides);
    switch (this.solidPhase) {
      case "lattice":
        return solid.faceFromFlowerLattice
          ? `Any three touching circle centres in the Flower of Life sit one compass width apart, so every lattice cell is an equilateral triangle. One cell is highlighted: that triangle is exactly the face the ${lowerName(solid)} needs, ${solid.faces} congruent copies of it.`
          : `The Flower of Life's lattice cells are equilateral triangles, drawn faintly here. The ${lowerName(solid)} needs ${solid.faceName}s, and ${NON_LATTICE_NOTE[solid.id] ?? ""} The orange ${solid.faceName} stands on one lattice step, so its first two corners (green) are lattice points while every other corner (orange) misses the lattice. It is constructed separately, by dividing a circle into ${solid.faceSides} equal parts. The Flower is context here, not the source.`;
      case "face":
        return `One face at true size: a ${solid.faceName} with ${solid.faceSides} equal sides, ${solid.faceSides} equal interior angles of ${interior}°, and every corner the same distance from its centre. All ${solid.faces} faces of the ${lowerName(solid)} are congruent copies of this one polygon.`;
      case "plan": {
        const layout = solid.id === "dodecahedron"
          ? "Two six-pentagon rosettes lay all 12 faces flat at true size."
          : `All ${solid.faces} faces lay flat at true size, edge to edge${solid.faceFromFlowerLattice ? " on the same triangular lattice the Flower draws" : ""}.`;
        return `${layout} Use the plan to count the faces and compare their size; it is a layout of the faces rather than a set of creases to fold.`;
      }
      case "assembly":
        return `Watch each face travel from its place in the flat plan to its place on the ${lowerName(solid)}. Every face keeps its size and shape exactly — the motion is a rotation plus a translation — but the faces move independently instead of hinging along shared edges, so this is an assembly animation rather than a physical fold. They finish meeting at the ${solid.dihedralDegrees}° dihedral angle.`;
      case "solid":
        return `The finished ${lowerName(solid)} rotates automatically; drag the view to inspect it. Its Schläfli symbol <code>${solid.schlafli}</code> says each face is a regular ${solid.faceSides}-gon and ${solid.vertexDegree} faces meet at every vertex.`;
    }
  }

  private phaseExtras(solid: PlatonicSolid): string {
    if (this.solidPhase === "assembly") {
      return `
        <div class="readout">
          <div><span>Assembly progress</span><b data-sacred-assembly-progress>0%</b></div>
          <div><span>Faces in flight</span><b>${solid.faces}</b></div>
          <div><span>Motion per face</span><b>rigid</b></div>
        </div>
        <button class="course-btn ghost" type="button" data-sacred-replay>Replay assembly</button>`;
    }
    if (this.solidPhase === "solid") {
      return `<p class="course-hint">Euler's check holds for every convex polyhedron: V − E + F = 2.</p>`;
    }
    return `<p class="course-hint">Phases run in order: lattice context, one face, the flat plan of all ${solid.faces} faces, the assembly animation, then the finished solid.</p>`;
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

/** Solid names read as common nouns inside a sentence. */
function lowerName(solid: PlatonicSolid): string {
  return solid.name.toLowerCase();
}

function toVector3(point: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y, point.z);
}

function centroidDistance(points: readonly SacredPoint[]): number {
  const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  return Math.hypot(x, y);
}
