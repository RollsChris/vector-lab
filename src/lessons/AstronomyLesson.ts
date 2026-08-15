import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { segment, textSprite, tip } from "./helpers";

type SceneMode = "sky" | "orbits" | "stars" | "cosmos";

interface AstronomyChapter {
  title: string;
  mode: SceneMode;
  skyHours: number;
  earthAngle: number;
  marsAngle: number;
  lesson: string;
}

const CHAPTERS: readonly AstronomyChapter[] = [
  {
    title: "Start with the sky",
    mode: "sky",
    skyHours: 20,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Astronomy begins with a useful illusion.</b> Earth rotates eastward once each day, so the
      distant sky appears to rise in the east and set in the west. The stars keep their shapes over a
      human lifetime; the Sun, Moon and planets move against them.</p>
      <p><b>Three nested clocks:</b> a day comes from Earth's rotation, a year from its orbit around the
      Sun, and the changing positions of planets come from several bodies orbiting at different speeds.
      Start by dragging <code>Sky time</code> and watch the sky turn around Earth.</p>`,
  },
  {
    title: "The first sky maps",
    mode: "sky",
    skyHours: 4,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Long before telescopes, people made precision sky records.</b> Babylonian observers built
      numerical tables for planets and eclipses. Egyptian observers used Sirius to anticipate the Nile
      flood. Chinese records preserve comets, eclipses and exploding stars. Polynesian navigators used
      rising and setting stars to cross the Pacific.</p>
      <p>Greek, Islamic and later European astronomers added geometry, instruments and catalogues.
      Their success came from repeatedly measuring angles and times, not from guessing what objects
      were made of.</p>`,
  },
  {
    title: "Give the sky addresses",
    mode: "sky",
    skyHours: 12,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>The celestial sphere</b> is a map-making model: imagine the stars painted on a huge sphere
      around Earth. Extend Earth's rotation axis to get the north and south celestial poles; project
      the equator outward to get the celestial equator.</p>
      <p><b>Right ascension and declination</b> give an object a durable address, much like longitude
      and latitude. Declination measures north or south of the celestial equator. Right ascension
      measures around it in 24 hours. The gold tilted ring is the ecliptic, the Sun's yearly path;
      planets stay near it because the Solar System formed as a flattened disk.</p>`,
  },
  {
    title: "Measure, do not guess",
    mode: "sky",
    skyHours: 8,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Position was measured as an angle.</b> A gnomon is a vertical stick whose shadow gives the
      Sun's altitude. Astrolabes, quadrants, sextants and meridian instruments made the same basic
      job more precise: compare the direction of a known reference with an object in the sky.</p>
      <p>Eratosthenes compared noon shadows at two Egyptian cities around 240 BCE. The difference in
      Sun angle was a fraction of a full circle, letting him estimate Earth's circumference. This is
      the same geometry behind modern positional astronomy.</p>`,
  },
  {
    title: "Why planets wander",
    mode: "orbits",
    skyHours: 0,
    earthAngle: 0.6,
    marsAngle: 2.8,
    lesson: `
      <p><b>Planets are the wanderers.</b> Unlike the fixed star patterns, Mercury, Venus, Mars,
      Jupiter and Saturn drift near the ecliptic. At intervals, an outer planet such as Mars seems to
      slow, stop, and move backwards against the stars. This is called retrograde motion.</p>
      <p>The red line traces Mars as seen from moving Earth. Change the orbital positions and watch
      how a line of sight from Earth can reverse direction even though both planets keep moving
      forward around the Sun. Retrograde motion is a perspective effect, not a planet turning around.</p>`,
  },
  {
    title: "Earth-centred to Sun-centred",
    mode: "orbits",
    skyHours: 0,
    earthAngle: 2.2,
    marsAngle: 3.6,
    lesson: `
      <p><b>Ptolemy's Earth-centred model predicted positions using circles upon circles called
      epicycles.</b> It was a serious, useful mathematical model, but retrograde motion required added
      machinery. Copernicus placed the Sun near the centre; Galileo then observed Venus's full set of
      phases and moons orbiting Jupiter, showing that not everything circles Earth.</p>
      <p>In this Sun-centred view, Mars looks retrograde when faster Earth overtakes it. The model does
      not merely redraw the picture: it explains why the reversals occur where they do.</p>`,
  },
  {
    title: "Kepler and Newton",
    mode: "orbits",
    skyHours: 0,
    earthAngle: 4.5,
    marsAngle: 5.1,
    lesson: `
      <p><b>Tycho Brahe's careful measurements exposed a mismatch.</b> Kepler found that planets move
      in ellipses, not perfect circles. A planet moves faster when it is nearer the Sun, and its
      orbital period grows predictably with orbit size.</p>
      <p><b>Newton supplied the cause:</b> gravity bends an otherwise straight motion into an orbit.
      The same inverse-square attraction explains a falling apple, the Moon's curved path and
      planetary motion. An orbit is continual free fall with enough sideways velocity to keep missing
      the body being orbited.</p>`,
  },
  {
    title: "Turn light into evidence",
    mode: "stars",
    skyHours: 0,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>A telescope gathers light; a spectrograph interrogates it.</b> When a prism spreads starlight
      into a spectrum, atoms leave distinctive line patterns. From those lines astronomers infer
      temperature, chemical composition, magnetic fields and motion.</p>
      <p><b>Distance changes everything.</b> Nearby stars shift slightly against the distant background
      as Earth orbits the Sun: parallax. For a parallax angle measured in arcseconds, distance in
      parsecs is one divided by that angle. Beyond parallax, astronomers build a calibrated distance
      ladder using stars and supernovae of known intrinsic brightness.</p>`,
  },
  {
    title: "Stars are evolving suns",
    mode: "stars",
    skyHours: 0,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Stars shine by fusion.</b> Gravity compresses a star's core until light nuclei can fuse,
      releasing energy. Mass sets the pace: small stars burn slowly, while massive stars live fast and
      end in supernovae, neutron stars or black holes.</p>
      <p>Colour is a temperature clue: blue-white stars are hotter, red stars cooler. A star's apparent
      brightness also depends on distance, so astronomers distinguish how bright it looks from Earth
      from its intrinsic luminosity. Many of the heavier elements in Earth and in us were made by
      earlier generations of stars.</p>`,
  },
  {
    title: "Galaxies and the expanding universe",
    mode: "cosmos",
    skyHours: 0,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Our Sun is one star in the Milky Way, a barred spiral galaxy.</b> Galaxies group into
      clusters and trace a cosmic web of filaments separated by enormous voids. Spectra show that
      distant galaxies are generally redshifted, with more distant ones receding faster: space is
      expanding.</p>
      <p>The hot, dense early universe is supported by this expansion, the cosmic microwave background,
      light-element abundances and the large-scale structure of galaxies. The Big Bang was not an
      explosion from one place into empty space; it was the early state of space everywhere.</p>`,
  },
  {
    title: "Observe for yourself",
    mode: "sky",
    skyHours: 21,
    earthAngle: 0,
    marsAngle: 0,
    lesson: `
      <p><b>Build skill with the naked eye first.</b> Learn directions, locate the celestial pole,
      track the Moon through a month, and watch a bright planet shift against background stars over
      weeks. A planisphere or app is useful when it confirms what you can identify yourself.</p>
      <p>Binoculars are an excellent first instrument: they reveal lunar craters, Jupiter's moons,
      star clusters and bright nebulae. Keep an observing log with the date, time, place, sky
      conditions and what you saw. Astronomy is still built from the same habit as its oldest form:
      careful, repeatable observation.</p>`,
  },
];

const STAR_POSITIONS = [
  [-0.91, 0.31, 0.28], [-0.73, 0.68, -0.1], [-0.63, -0.18, 0.69], [-0.45, 0.42, -0.65],
  [-0.31, -0.78, -0.29], [-0.12, 0.88, 0.18], [0.04, -0.34, 0.91], [0.18, 0.42, 0.79],
  [0.31, -0.71, 0.48], [0.47, 0.78, -0.24], [0.59, -0.11, -0.68], [0.77, 0.48, 0.22],
  [0.91, -0.32, -0.17], [0.16, 0.02, -0.99], [-0.72, -0.48, -0.34], [-0.05, 0.15, -0.99],
] as const;

export class AstronomyLesson implements Lesson {
  readonly id = "astronomy";
  readonly title = "22 · Astronomy: Zero to Hero";
  readonly blurb = "Map the sky, explain planets, read the universe";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["shadows-earth-size", "universal-gravitation"] as const;

  private group = new THREE.Group();
  private sky = new THREE.Group();
  private orbits = new THREE.Group();
  private stars = new THREE.Group();
  private cosmos = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private stopTick?: () => void;
  private chapter = 0;
  private trail!: THREE.Line;
  private earth!: THREE.Mesh;
  private mars!: THREE.Mesh;
  private skySun!: THREE.Mesh;
  private readonly params = {
    chapter: CHAPTERS[0].title,
    skyHours: CHAPTERS[0].skyHours,
    earthAngle: CHAPTERS[0].earthAngle,
    marsAngle: CHAPTERS[0].marsAngle,
    animate: true,
    reset: () => this.loadChapter(0),
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(10, 7, 12), new THREE.Vector3(0, 0, 0));
    this.buildScenes();
    this.buildControls();
    this.renderPanel();
    this.loadChapter(0);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  private buildScenes(): void {
    this.group.add(this.sky, this.orbits, this.stars, this.cosmos);
    this.buildSkyScene();
    this.buildOrbitScene();
    this.buildStarScene();
    this.buildCosmosScene();
  }

  private buildSkyScene(): void {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(6.8, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x1f6feb, wireframe: true, transparent: true, opacity: 0.18 }),
    );
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0x2f81f7, emissive: 0x0b2d57, roughness: 0.5 }),
    );
    const equator = ring(6.82, 0x58a6ff);
    const ecliptic = ring(6.86, 0xffd166);
    ecliptic.rotation.x = THREE.MathUtils.degToRad(23.4);
    const axis = segment(new THREE.Vector3(0, -7.5, 0), new THREE.Vector3(0, 7.5, 0), 0x7ee787);
    const pole = textSprite("celestial pole", 0x7ee787, 0.42);
    pole.position.set(0, 7.7, 0);
    const eclipticLabel = textSprite("ecliptic", 0xffd166, 0.38);
    eclipticLabel.position.set(4.8, 2.8, 4.1);
    this.skySun = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    const sunLabel = textSprite("Sun", 0xffd166, 0.38);
    sunLabel.position.set(0, 0.48, 0);
    this.skySun.add(sunLabel);

    this.sky.add(sphere, earth, equator, ecliptic, axis, pole, eclipticLabel, this.skySun);
    this.addStars(this.sky, 6.72, 0.065);
  }

  private buildOrbitScene(): void {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xa15f00, emissiveIntensity: 0.7 }),
    );
    const sunLabel = textSprite("Sun", 0xffd166, 0.45);
    sunLabel.position.y = 1.1;
    sun.add(sunLabel);
    this.earth = planet(0x58a6ff, 0.28);
    this.mars = planet(0xff7b72, 0.23);
    const earthLabel = textSprite("Earth", 0x79c0ff, 0.36);
    earthLabel.position.y = 0.55;
    this.earth.add(earthLabel);
    const marsLabel = textSprite("Mars", 0xff7b72, 0.36);
    marsLabel.position.y = 0.5;
    this.mars.add(marsLabel);
    const earthOrbit = ellipse(3.2, 3.0, 0x315a9a);
    const marsOrbit = ellipse(5.15, 4.65, 0x733c3c);
    const lineOfSight = segment(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0x8b949e);
    lineOfSight.name = "earth-mars-line";
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute("position", new THREE.Float32BufferAttribute(65 * 3, 3));
    this.trail = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({ color: 0xd2a8ff }),
    );
    this.trail.name = "retrograde-trail";
    const trailLabel = textSprite("Mars against distant stars", 0xd2a8ff, 0.34);
    trailLabel.position.set(-4.6, 3.4, 0);
    this.trail.add(trailLabel);
    this.orbits.add(sun, earthOrbit, marsOrbit, this.earth, this.mars, lineOfSight, this.trail);
    this.addStars(this.orbits, 7.2, 0.04);
  }

  private buildStarScene(): void {
    const nearby = [
      { x: -3.4, y: 1.8, color: 0x79c0ff, label: "hot blue star" },
      { x: -0.7, y: -0.8, color: 0xffd166, label: "Sun-like star" },
      { x: 2.7, y: 1.1, color: 0xff7b72, label: "cool red star" },
    ];
    for (const star of nearby) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 24, 16),
        new THREE.MeshStandardMaterial({ color: star.color, emissive: star.color, emissiveIntensity: 0.8 }),
      );
      mesh.position.set(star.x, star.y, 0);
      const label = textSprite(star.label, star.color, 0.36);
      label.position.y = 0.65;
      mesh.add(label);
      this.stars.add(mesh);
    }
    const spectrum = [
      [0x7ee7ff, -3], [0x79c0ff, -2], [0xd2a8ff, -1], [0xffd166, 0], [0xffa657, 1], [0xff7b72, 2],
    ];
    for (const [color, x] of spectrum) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.28, 0.1),
        new THREE.MeshBasicMaterial({ color: color as number }),
      );
      bar.position.set(x as number, -3.2, 0);
      this.stars.add(bar);
    }
    const label = textSprite("spectrum: colour and lines reveal physics", 0xc9d1d9, 0.42);
    label.position.set(0, -3.85, 0);
    this.stars.add(label);
    this.addStars(this.stars, 7.5, 0.035);
  }

  private buildCosmosScene(): void {
    const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.9 });
    const positions: number[] = [];
    const colors: number[] = [];
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 110; i++) {
        const radius = 0.25 + (i / 110) * 5.3;
        const angle = arm * (Math.PI * 2 / 3) + radius * 1.35 + (i % 7) * 0.06;
        positions.push(Math.cos(angle) * radius, (i % 5 - 2) * 0.035, Math.sin(angle) * radius);
        const warm = 0.55 + (i % 8) * 0.05;
        colors.push(0.35 + warm * 0.35, 0.55 + warm * 0.25, 0.95);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const galaxy = new THREE.Points(geometry, material);
    galaxy.rotation.x = THREE.MathUtils.degToRad(62);
    const label = textSprite("a galaxy of stars", 0x79c0ff, 0.42);
    label.position.set(0, 4.4, 0);
    this.cosmos.add(galaxy, label);
  }

  private addStars(parent: THREE.Group, radius: number, size: number): void {
    const points: number[] = [];
    for (const [x, y, z] of STAR_POSITIONS) points.push(x * radius, y * radius, z * radius);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    parent.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xe6edf3, size })));
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "chapter", CHAPTERS.map((chapter) => chapter.title)).name("Chapter"),
      "Load a chapter and its matching astronomical model.",
    ).onChange((title: string) => this.loadChapter(CHAPTERS.findIndex((chapter) => chapter.title === title)));
    tip(
      this.gui.add(this.params, "skyHours", 0, 24, 0.1).name("Sky time (hours)").listen(),
      "Rotate the celestial sphere around Earth; this is the apparent daily motion caused by Earth's rotation.",
    ).onChange(() => this.updateScene());
    tip(
      this.gui.add(this.params, "earthAngle", 0, 360, 1).name("Earth orbit (degrees)").listen(),
      "Move Earth around the Sun to compare its line of sight with Mars.",
    ).onChange(() => this.updateScene());
    tip(
      this.gui.add(this.params, "marsAngle", 0, 360, 1).name("Mars orbit (degrees)").listen(),
      "Move Mars around the Sun; its slower orbit makes the retrograde viewing geometry possible.",
    ).onChange(() => this.updateScene());
    tip(this.gui.add(this.params, "animate").name("Animate model"), "Advance the active sky or orbit model.");
    tip(this.gui.add(this.params, "reset").name("Back to chapter 1"), "Return to the first chapter.");
  }

  private loadChapter(index: number): void {
    this.chapter = THREE.MathUtils.clamp(index, 0, CHAPTERS.length - 1);
    const chapter = CHAPTERS[this.chapter];
    this.params.chapter = chapter.title;
    this.params.skyHours = chapter.skyHours;
    this.params.earthAngle = THREE.MathUtils.radToDeg(chapter.earthAngle);
    this.params.marsAngle = THREE.MathUtils.radToDeg(chapter.marsAngle);
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.updateScene();
    this.refreshCourseUi();
  }

  private tick(dt: number): void {
    if (!this.params.animate) return;
    const mode = CHAPTERS[this.chapter].mode;
    if (mode === "sky") this.params.skyHours = (this.params.skyHours + dt * 0.5) % 24;
    if (mode === "orbits") {
      this.params.earthAngle = (this.params.earthAngle + dt * 8) % 360;
      this.params.marsAngle = (this.params.marsAngle + dt * 4.2) % 360;
    }
    if (mode === "cosmos") this.cosmos.rotation.y += dt * 0.15;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.updateScene();
  }

  private updateScene(): void {
    const mode = CHAPTERS[this.chapter].mode;
    this.sky.visible = mode === "sky";
    this.orbits.visible = mode === "orbits";
    this.stars.visible = mode === "stars";
    this.cosmos.visible = mode === "cosmos";

    const skyAngle = (this.params.skyHours / 24) * Math.PI * 2;
    this.sky.rotation.y = skyAngle;
    this.skySun.position.set(Math.cos(skyAngle) * 6.85, Math.sin(skyAngle) * 2.5, Math.sin(skyAngle) * 5.7);

    if (mode === "orbits") {
      const earthAngle = THREE.MathUtils.degToRad(this.params.earthAngle);
      const marsAngle = THREE.MathUtils.degToRad(this.params.marsAngle);
      this.earth.position.set(Math.cos(earthAngle) * 3.2, 0, Math.sin(earthAngle) * 3);
      this.mars.position.set(Math.cos(marsAngle) * 5.15, 0, Math.sin(marsAngle) * 4.65);
      const lineOfSight = this.orbits.getObjectByName("earth-mars-line") as THREE.Line;
      lineOfSight.geometry.setFromPoints([this.earth.position, this.mars.position]);
      this.updateRetrogradeTrail();
    }
    this.refreshReadout();
  }

  private updateRetrogradeTrail(): void {
    const points: THREE.Vector3[] = [];
    const earthNow = THREE.MathUtils.degToRad(this.params.earthAngle);
    const marsNow = THREE.MathUtils.degToRad(this.params.marsAngle);
    for (let i = -32; i <= 32; i++) {
      const earthA = earthNow + i * 0.035;
      const marsA = marsNow + i * 0.0185;
      const earth = new THREE.Vector3(Math.cos(earthA) * 3.2, 0, Math.sin(earthA) * 3);
      const mars = new THREE.Vector3(Math.cos(marsA) * 5.15, 0, Math.sin(marsA) * 4.65);
      const direction = mars.sub(earth).normalize();
      points.push(new THREE.Vector3(direction.x * 4.2, direction.z * 4.2 + 0.1, direction.y));
    }
    this.trail.geometry.setFromPoints(points);
  }

  private renderPanel(): void {
    const chapters = CHAPTERS.map((chapter, i) =>
      `<button class="course-chapter" data-astro-chapter="${i}"><span class="course-num">${i + 1}</span>${chapter.title}</button>`,
    ).join("");
    this.setInfo(`
      <h2>Astronomy: Zero to Hero</h2>
      <p>Travel from the observer's sky to the expanding universe. Each chapter pairs the historical
      question with the measurement or physical idea that answered it.</p>
      <div class="course">
        <h3>From skywatcher to cosmologist</h3>
        <p class="course-hint">Select a chapter or use Next. The viewport changes with the story; its controls let you test the geometry.</p>
        <div class="course-chapters">${chapters}</div>
        <div id="astronomy-lesson" class="course-lesson"></div>
        <div class="course-nav">
          <button id="astronomy-prev" class="course-btn ghost">‹ Prev</button>
          <span id="astronomy-progress" class="course-progress">—</span>
          <button id="astronomy-next" class="course-btn">Next ›</button>
        </div>
      </div>
      <div class="readout" id="astronomy-readout"></div>
      <p class="example"><b>Suggested route:</b> rotate the first sky model through a full day, then
      stop at Why planets wander and compare the Earth-to-Mars line of sight before moving on to
      spectra, stars and galaxies.</p>`);

    const root = document.getElementById("info");
    root?.querySelectorAll<HTMLButtonElement>("[data-astro-chapter]").forEach((button) => {
      button.addEventListener("click", () => this.loadChapter(Number(button.dataset.astroChapter)));
    });
    root?.querySelector<HTMLButtonElement>("#astronomy-prev")
      ?.addEventListener("click", () => this.loadChapter(this.chapter - 1));
    root?.querySelector<HTMLButtonElement>("#astronomy-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
  }

  private refreshCourseUi(): void {
    document.querySelectorAll<HTMLElement>("[data-astro-chapter]").forEach((button, i) => {
      button.classList.toggle("active", i === this.chapter);
    });
    const chapter = CHAPTERS[this.chapter];
    const lesson = document.getElementById("astronomy-lesson");
    if (lesson) lesson.innerHTML = `<div class="course-lesson-title">${this.chapter + 1} · ${chapter.title}</div>${chapter.lesson}`;
    const progress = document.getElementById("astronomy-progress");
    if (progress) progress.textContent = `${this.chapter + 1} / ${CHAPTERS.length}`;
    const prev = document.getElementById("astronomy-prev") as HTMLButtonElement | null;
    const next = document.getElementById("astronomy-next") as HTMLButtonElement | null;
    if (prev) prev.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === CHAPTERS.length - 1;
    this.refreshReadout();
  }

  private refreshReadout(): void {
    const readout = document.getElementById("astronomy-readout");
    if (!readout) return;
    const mode = CHAPTERS[this.chapter].mode;
    if (mode === "sky") {
      readout.innerHTML = `<div><span>Sky time</span><b>${this.params.skyHours.toFixed(1)} hours</b></div>
        <div><span>What changes the view</span><b>Earth's rotation</b></div>
        <div><span>Stable map coordinates</span><b>right ascension + declination</b></div>`;
      return;
    }
    if (mode === "orbits") {
      const distance = this.earth.position.distanceTo(this.mars.position);
      readout.innerHTML = `<div><span>Earth orbital position</span><b>${this.params.earthAngle.toFixed(0)}°</b></div>
        <div><span>Mars orbital position</span><b>${this.params.marsAngle.toFixed(0)}°</b></div>
        <div><span>Earth–Mars distance in model</span><b>${distance.toFixed(2)} units</b></div>
        <div><span>Perspective effect to watch</span><b>retrograde motion</b></div>`;
      return;
    }
    if (mode === "stars") {
      readout.innerHTML = `<div><span>Distance unit</span><b>1 parsec = 3.26 light-years</b></div>
        <div><span>Parallax relation</span><b>distance = 1 ÷ parallax</b></div>
        <div><span>Light tells us</span><b>temperature, chemistry, motion</b></div>`;
      return;
    }
    readout.innerHTML = `<div><span>Our home galaxy</span><b>the Milky Way</b></div>
      <div><span>Evidence for expansion</span><b>galaxy redshift</b></div>
      <div><span>Age of the universe</span><b>about 13.8 billion years</b></div>`;
  }

  exit(): void {
    this.stopTick?.();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.sky = new THREE.Group();
    this.orbits = new THREE.Group();
    this.stars = new THREE.Group();
    this.cosmos = new THREE.Group();
  }
}

function planet(color: number, radius: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.6 }),
  );
}

function ring(radius: number, color: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
  );
}

function ellipse(radiusX: number, radiusZ: number, color: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
  );
}
