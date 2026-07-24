import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { segment, setSpriteText, textSprite, tip } from "./helpers";
import "./formulaDerivations/physics";

const BIG_G = 6.6743e-11; // N·m²/kg²
const EARTH_MASS = 5.972e24; // kg
const EARTH_RADIUS = 6.371e6; // m
const MOON_MASS = 7.348e22; // kg
const MOON_DISTANCE_EARTH_RADII = 60.3;
const MOON_ORBIT_SECONDS = 27.3 * 24 * 60 * 60;
const MOON_CURVE_ACCELERATION =
  (4 * Math.PI * Math.PI * MOON_DISTANCE_EARTH_RADII * EARTH_RADIUS) /
  (MOON_ORBIT_SECONDS * MOON_ORBIT_SECONDS);

interface GravityChapter {
  title: string;
  massEarths: number;
  objectMassPower: number;
  distanceEarthRadii: number;
  animateOrbit: boolean;
  objectLabel: string;
  lesson: string;
}

const CHAPTERS: GravityChapter[] = [
  {
    title: "The apple clue",
    massEarths: 1,
    objectMassPower: 0,
    distanceEarthRadii: 1,
    animateOrbit: false,
    objectLabel: "apple",
    lesson: `
      <p><b>Story:</b> Newton probably did not get hit on the head by an apple. The useful idea was
      simpler: if Earth pulls an apple down, could that same pull reach all the way to the Moon?</p>
      <p><b>Example:</b> a 1 kg apple at Earth's surface feels about <code>9.8 N</code> of weight.
      That is gravity written as a force.</p>`,
  },
  {
    title: "The Moon clue",
    massEarths: 1,
    objectMassPower: Math.log10(MOON_MASS),
    distanceEarthRadii: MOON_DISTANCE_EARTH_RADII,
    animateOrbit: true,
    objectLabel: "Moon",
    lesson: `
      <p><b>Newton's leap:</b> the Moon is falling too. If there were no gravity, it would fly in a
      straight tangent line. Instead, Earth keeps bending that straight path inward. That inward bend
      is the Moon's <b>curved path</b>.</p>
      <p><b>How you test the strength:</b> use the Moon's distance and orbit time to calculate how much
      inward acceleration is needed to curve its path. That acceleration is about <code>0.0027 m/s²</code>,
      far weaker than surface gravity but not zero.</p>`,
  },
  {
    title: "Distance squared",
    massEarths: 1,
    objectMassPower: 0,
    distanceEarthRadii: 2,
    animateOrbit: false,
    objectLabel: "test mass",
    lesson: `
      <p><b>The comparison:</b> surface gravity is about <code>9.8 m/s²</code>. The Moon is about
      <code>60</code> Earth radii from Earth's centre, and the inward acceleration needed to bend its
      orbit is about <code>9.8 / 60² ≈ 0.0027 m/s²</code>. That match is the key clue.</p>
      <p><b>Why distance²?</b> as distance grows, the same central pull is spread over a spherical
      shell. A sphere's area grows as <code>4πr²</code>, so the strength per bit of area falls as
      <code>1/r²</code>. Kepler's planet data pointed to the same rule.</p>
      <p><b>Example:</b> double the centre-to-centre distance and gravity becomes
      <code>1 / 2² = 1/4</code> as strong. Triple it and it becomes <code>1 / 9</code>.</p>`,
  },
  {
    title: "Universal formula",
    massEarths: 1,
    objectMassPower: Math.log10(MOON_MASS),
    distanceEarthRadii: MOON_DISTANCE_EARTH_RADII,
    animateOrbit: false,
    objectLabel: "Moon",
    lesson: `
      <p><b>The law:</b> every mass attracts every other mass:
      <code>F = G·m₁·m₂ / r²</code>.</p>
      <p><b>History note:</b> Newton published this in <i>Principia</i> in 1687, using ideas from
      Galileo's falling bodies, Kepler's planet rules, and the Moon/apple comparison. Newton did not
      know the exact value of <code>G</code>; Cavendish measured it later.</p>`,
  },
  {
    title: "Try the knobs",
    massEarths: 1,
    objectMassPower: 3,
    distanceEarthRadii: 4,
    animateOrbit: false,
    objectLabel: "1000 kg probe",
    lesson: `
      <p><b>Your turn:</b> change the masses and distance. Bigger masses make a bigger force, but
      distance wins fast because it is squared.</p>
      <p><b>Example:</b> set distance from <code>4</code> to <code>8</code> Earth radii. The force
      should fall to one quarter.</p>`,
  },
];

export class UniversalGravitationLesson implements Lesson {
  readonly id = "universal-gravitation";
  readonly title = "16 · Universal Gravitation";
  readonly blurb = "Newton's apple, Moon, and F = Gm₁m₂/r²";
  readonly category = "Physics" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["newtons-laws"] as const;

  private group = new THREE.Group();
  private earth!: THREE.Mesh;
  private object!: THREE.Mesh;
  private earthLabel!: THREE.Sprite;
  private objectLabel!: THREE.Sprite;
  private distanceLine!: THREE.Line;
  private orbitLine!: THREE.Line;
  private earthPull!: THREE.ArrowHelper;
  private objectPull!: THREE.ArrowHelper;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private stopTick?: () => void;
  private chapter = 0;
  private orbitAngle = 0;
  private currentObjectLabel = CHAPTERS[0].objectLabel;

  private readonly params = {
    chapter: CHAPTERS[0].title,
    massEarths: 1,
    objectMassPower: 0,
    distanceEarthRadii: 1,
    animateOrbit: false,
    showInverseSquare: true,
    reset: () => this.loadChapter(0),
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 5, 14),
      new THREE.Vector3(0, 0.5, 0),
    );

    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0x2f81f7, emissive: 0x0b2d57, roughness: 0.55 }),
    );
    this.group.add(this.earth);

    this.object = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x6b4d00, roughness: 0.5 }),
    );
    this.group.add(this.object);

    this.distanceLine = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0x6e7681);
    this.orbitLine = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0x30363d);
    this.group.add(this.distanceLine, this.orbitLine);

    this.earthPull = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      0xff7b72,
      0.28,
      0.18,
    );
    this.objectPull = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(),
      1,
      0xff7b72,
      0.28,
      0.18,
    );
    this.group.add(this.earthPull, this.objectPull);

    this.earthLabel = textSprite("Earth", 0x79c0ff, 0.55);
    this.objectLabel = textSprite("apple", 0xffd166, 0.5);
    this.group.add(this.earthLabel, this.objectLabel);

    this.buildControls();
    this.renderPanel();
    this.loadChapter(0);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "chapter", CHAPTERS.map((chapter) => chapter.title)).name("Step"),
      "Load one of Newton's discovery steps.",
    ).onChange((title: string) => {
      this.loadChapter(CHAPTERS.findIndex((chapter) => chapter.title === title));
    });
    tip(
      this.gui.add(this.params, "massEarths", 0.1, 5, 0.1).name("Big mass (Earths)").listen(),
      "Mass of the attracting body, measured in Earth masses.",
    ).onChange(() => this.update());
    tip(
      this.gui.add(this.params, "objectMassPower", 0, 24, 0.1).name("Small mass log₁₀ kg").listen(),
      "The other object's mass as log10(kg): 0 = 1 kg, 3 = 1000 kg, 22.9 = the Moon.",
    ).onChange(() => {
      this.currentObjectLabel = `${formatMass(this.objectMassKg())} object`;
      this.update();
    });
    tip(
      this.gui.add(this.params, "distanceEarthRadii", 1, 80, 0.1).name("Distance (Earth radii)").listen(),
      "Centre-to-centre distance. Surface is 1 Earth radius; the Moon is about 60.",
    ).onChange(() => this.update());
    tip(
      this.gui.add(this.params, "animateOrbit").name("Show orbit idea").listen(),
      "Give the object sideways motion so falling curves into orbit.",
    ).onChange(() => this.update());
    tip(
      this.gui.add(this.params, "showInverseSquare").name("Show distance² readout").listen(),
      "Display the inverse-square comparison in the reading panel.",
    ).onChange(() => this.refreshCourseUi());
    tip(this.gui.add(this.params, "reset").name("Back to step 1"), "Return to the apple clue.");
  }

  private loadChapter(index: number): void {
    const next = THREE.MathUtils.clamp(index, 0, CHAPTERS.length - 1);
    const chapter = CHAPTERS[next];
    this.chapter = next;
    this.params.chapter = chapter.title;
    this.params.massEarths = chapter.massEarths;
    this.params.objectMassPower = chapter.objectMassPower;
    this.params.distanceEarthRadii = chapter.distanceEarthRadii;
    this.params.animateOrbit = chapter.animateOrbit;
    this.currentObjectLabel = chapter.objectLabel;
    this.orbitAngle = chapter.animateOrbit ? 0.6 : 0;
    this.updateDisplays();
    this.update();
    this.refreshCourseUi();
  }

  private updateDisplays(): void {
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
  }

  private tick(dt: number): void {
    if (this.params.animateOrbit) {
      this.orbitAngle += dt * 0.35;
      this.update();
    }
  }

  compute() {
    const m1 = this.params.massEarths * EARTH_MASS;
    const m2 = this.objectMassKg();
    const distance = this.params.distanceEarthRadii;
    const r = distance * EARTH_RADIUS;
    const force = (BIG_G * m1 * m2) / (r * r);
    const objectAcceleration = force / m2;
    const bigMassAcceleration = force / m1;
    const surfaceAcceleration = (BIG_G * m1) / (EARTH_RADIUS * EARTH_RADIUS);
    return {
      m1,
      m2,
      distance,
      r,
      force,
      objectAcceleration,
      bigMassAcceleration,
      surfaceAcceleration,
      inverseSquareFactor: 1 / (distance * distance),
      moonCurveAcceleration: MOON_CURVE_ACCELERATION,
    };
  }

  private objectMassKg(): number {
    return 10 ** this.params.objectMassPower;
  }

  private update(): void {
    const c = this.compute();
    const earthScale = THREE.MathUtils.clamp(Math.cbrt(this.params.massEarths), 0.55, 1.8);
    const objectScale = THREE.MathUtils.clamp(0.16 + this.params.objectMassPower / 36, 0.16, 0.8);
    const sceneDistance = this.sceneDistance(c.distance);
    const objectPos = new THREE.Vector3(
      Math.cos(this.orbitAngle) * sceneDistance,
      0,
      Math.sin(this.orbitAngle) * sceneDistance,
    );
    const earthPos = new THREE.Vector3(0, 0, 0);
    const toObject = objectPos.clone().normalize();
    const toEarth = toObject.clone().multiplyScalar(-1);

    this.earth.scale.setScalar(earthScale);
    this.object.scale.setScalar(objectScale);
    this.object.position.copy(objectPos);
    this.earthLabel.position.set(0, earthScale + 0.75, 0);
    this.objectLabel.position.copy(objectPos).add(new THREE.Vector3(0, objectScale + 0.55, 0));
    setSpriteText(this.objectLabel, this.currentObjectLabel, 0xffd166);

    this.distanceLine.geometry.setFromPoints([earthPos, objectPos]);
    this.rebuildOrbitLine(sceneDistance);

    const arrowLength = THREE.MathUtils.clamp(1.05 + Math.log10(c.objectAcceleration + 1e-6), 0.65, 2.6);
    this.objectPull.position.copy(objectPos).add(toEarth.clone().multiplyScalar(objectScale * 1.1));
    this.objectPull.setDirection(toEarth);
    this.objectPull.setLength(arrowLength, 0.28, 0.18);
    this.earthPull.position.copy(toObject.clone().multiplyScalar(earthScale * 1.1));
    this.earthPull.setDirection(toObject);
    this.earthPull.setLength(arrowLength, 0.28, 0.18);

    this.refreshReadout(c);
  }

  private sceneDistance(distanceEarthRadii: number): number {
    return 1.35 + Math.log2(distanceEarthRadii) * 1.05;
  }

  private rebuildOrbitLine(radius: number): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    this.orbitLine.geometry.setFromPoints(points);
    this.orbitLine.visible = this.params.animateOrbit || this.params.distanceEarthRadii > 8;
  }

  private renderPanel(): void {
    const chips = CHAPTERS.map((chapter, i) => `<button class="course-chapter" data-gravity-ch="${i}">
        <span class="course-num">${i + 1}</span>${chapter.title}</button>`)
      .join("");

    this.setInfo(`
      <h2>Newton's Universal Gravitation</h2>
      <p>This lesson walks through how Newton connected an everyday falling object with the Moon's
      orbit, then turned that idea into one rule for every mass in the universe.</p>

      <div class="formula" data-derivation="universal-gravitation">
        <div class="formula-label">Universal gravitation</div>
        <div class="formula-body">F = G · m₁ · m₂ / r²</div>
        <div class="formula-note">Mass makes gravity stronger. Distance makes it weaker by the square.</div>
      </div>

      <div class="course">
        <h3>Newton's path, step by step</h3>
        <p class="course-hint">Use <b>Next</b> or the step buttons. Each step loads a matching scene and
        example numbers.</p>
        <div class="course-chapters">${chips}</div>
        <div id="gravity-lesson" class="course-lesson"></div>
        <div class="course-nav">
          <button id="gravity-prev" class="course-btn ghost">‹ Prev</button>
          <span id="gravity-progress" class="course-progress">—</span>
          <button id="gravity-next" class="course-btn">Next ›</button>
        </div>
      </div>

      <div class="readout" id="gravity-readout"></div>
      <div class="readout" id="gravity-square"></div>

      <p class="example"><b>Try:</b> go to “Try the knobs”, double the distance, and watch force fall
      to about one quarter. Then double the big mass and watch force double.</p>`);

    const root = document.getElementById("info");
    if (!root) return;
    root.querySelectorAll<HTMLButtonElement>("[data-gravity-ch]").forEach((button) => {
      button.addEventListener("click", () => this.loadChapter(Number(button.dataset.gravityCh)));
    });
    root.querySelector<HTMLButtonElement>("#gravity-prev")
      ?.addEventListener("click", () => this.loadChapter(this.chapter - 1));
    root.querySelector<HTMLButtonElement>("#gravity-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
  }

  private refreshCourseUi(): void {
    document.querySelectorAll<HTMLElement>("[data-gravity-ch]").forEach((button, i) => {
      button.classList.toggle("active", i === this.chapter);
    });
    const chapter = CHAPTERS[this.chapter];
    const lesson = document.getElementById("gravity-lesson");
    if (lesson) lesson.innerHTML = `<div class="course-lesson-title">${this.chapter + 1} · ${chapter.title}</div>${chapter.lesson}`;
    const progress = document.getElementById("gravity-progress");
    if (progress) progress.textContent = `${this.chapter + 1} / ${CHAPTERS.length}`;
    const prev = document.getElementById("gravity-prev") as HTMLButtonElement | null;
    const next = document.getElementById("gravity-next") as HTMLButtonElement | null;
    if (prev) prev.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === CHAPTERS.length - 1;
    const square = document.getElementById("gravity-square");
    if (square) square.style.display = this.params.showInverseSquare ? "block" : "none";
    this.refreshReadout(this.compute());
  }

  private refreshReadout(c = this.compute()): void {
    const readout = document.getElementById("gravity-readout");
    if (readout) {
      readout.innerHTML = `
        <div><span>Big mass m₁</span><b>${this.params.massEarths.toFixed(1)} Earth masses</b></div>
        <div><span>Other mass m₂</span><b>${formatMass(c.m2)}</b></div>
        <div><span>Distance r</span><b>${c.distance.toFixed(1)} Earth radii</b></div>
        <div><span>Gravity force F</span><b>${formatForce(c.force)}</b></div>
        <div><span>Acceleration of smaller object</span><b>${formatAcceleration(c.objectAcceleration)}</b></div>`;
    }

    const square = document.getElementById("gravity-square");
    if (square) {
      const moonLike = c.surfaceAcceleration / (MOON_DISTANCE_EARTH_RADII * MOON_DISTANCE_EARTH_RADII);
      square.innerHTML = `
        <div><span>Compared with surface gravity</span><b>1 / ${c.distance.toFixed(1)}² = ${formatRatio(c.inverseSquareFactor)}</b></div>
        <div><span>Surface acceleration</span><b>${formatAcceleration(c.surfaceAcceleration)}</b></div>
        <div><span>At Moon distance by inverse-square</span><b>${formatAcceleration(moonLike)}</b></div>
        <div><span>Moon curve from orbit timing</span><b>${formatAcceleration(c.moonCurveAcceleration)}</b></div>`;
    }
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }
}

function formatForce(value: number): string {
  if (value >= 0.01 && value < 100_000) return `${value.toFixed(value < 100 ? 2 : 0)} N`;
  return `${value.toExponential(2)} N`;
}

function formatAcceleration(value: number): string {
  if (value >= 0.01 && value < 1000) return `${value.toFixed(3)} m/s²`;
  return `${value.toExponential(2)} m/s²`;
}

function formatMass(value: number): string {
  if (value < 1000) return `${value.toFixed(1)} kg`;
  if (Math.abs(value - MOON_MASS) / MOON_MASS < 0.03) return `${value.toExponential(2)} kg (Moon)`;
  return `${value.toExponential(2)} kg`;
}

function formatRatio(value: number): string {
  if (value >= 0.001) return value.toFixed(4);
  return value.toExponential(2);
}
