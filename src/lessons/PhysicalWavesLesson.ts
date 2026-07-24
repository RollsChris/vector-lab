import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip } from "./helpers";
import "./formulaDerivations/waves";

const COLORS = {
  string: 0x79c0ff,
  ghost: 0xffa657,
  axis: 0x8b949e,
};

/**
 * Lesson: Physical Waves.
 *
 * A vibrating string driven by a sinusoidal travelling wave. The user can adjust
 * amplitude, frequency and speed, fix or free the far end, and superpose a second
 * wave to build a standing wave.
 */
export class PhysicalWavesLesson implements Lesson {
  readonly id = "physical-waves";
  readonly title = "Physical Waves";
  readonly blurb = "Travelling, reflecting and standing waves";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["waveforms", "trig-functions"] as const;

  private group = new THREE.Group();
  private string!: THREE.Line;
  private ghostString!: THREE.Line;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private stopTick?: () => void;

  private params = {
    amplitude: 0.5,
    frequency: 1,
    speed: 2,
    end: "fixed" as "fixed" | "free",
    superpose: false,
    showGhost: true,
    play: true,
    timeScale: 1,
  };

  private t = 0;
  private readonly n = 200;
  private readonly length = 10;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(5, 1, 8),
      new THREE.Vector3(5, 0, 0),
    );

    this.buildScene();
    this.buildControls();
    this.update(0);

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (this.params.play) {
        this.t += dt * this.params.timeScale;
        this.update(this.t);
      }
    });
  }

  exit(): void {
    this.stopTick?.();
    this.group.clear();
  }

  private buildScene(): void {
    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(this.length, 0, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.axis }),
    );
    this.group.add(axis);

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array((this.n + 1) * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.string = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COLORS.string, linewidth: 2 }));
    this.group.add(this.string);

    const ghostGeo = new THREE.BufferGeometry();
    const ghostPositions = new Float32Array((this.n + 1) * 3);
    ghostGeo.setAttribute("position", new THREE.BufferAttribute(ghostPositions, 3));
    this.ghostString = new THREE.Line(ghostGeo, new THREE.LineBasicMaterial({ color: COLORS.ghost, transparent: true, opacity: 0.5 }));
    this.group.add(this.ghostString);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "amplitude", 0.1, 1.5, 0.05).name("Amplitude"), "Maximum displacement of the wave").onChange(() => this.update(this.t));
    tip(g.add(this.params, "frequency", 0.2, 4, 0.1).name("Frequency"), "How many complete waves fit along the string").onChange(() => this.update(this.t));
    tip(g.add(this.params, "speed", 0.5, 5, 0.1).name("Wave speed"), "How fast the wave travels").onChange(() => this.update(this.t));
    tip(g.add(this.params, "end", ["fixed", "free"]).name("Far end"), "Fixed end inverts the reflection; free end reflects without inversion").onChange(() => this.update(this.t));
    tip(g.add(this.params, "superpose").name("Superpose reflection"), "Add the reflected wave to form a standing wave").onChange(() => this.update(this.t));
    tip(g.add(this.params, "showGhost").name("Show reflected wave"), "Draw the reflected wave separately").onChange(() => this.update(this.t));
    tip(g.add(this.params, "play").name("Play"), "Animate the wave").onChange(() => this.update(this.t));
    tip(g.add(this.params, "timeScale", 0.1, 3, 0.1).name("Time scale"), "Slow down or speed up the animation").onChange(() => this.update(this.t));
  }

  private update(t: number): void {
    const { amplitude, frequency, speed, end, superpose, showGhost } = this.params;
    const k = (frequency * 2 * Math.PI) / this.length;
    const omega = k * speed;

    const incident = (x: number, time: number): number => amplitude * Math.sin(k * x - omega * time);
    const reflected = (x: number, time: number): number => {
      const sign = end === "fixed" ? -1 : 1;
      return sign * amplitude * Math.sin(k * x + omega * time);
    };

    const pos = this.string.geometry.attributes.position.array as Float32Array;
    const ghostPos = this.ghostString.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i <= this.n; i++) {
      const x = (this.length * i) / this.n;
      const inc = incident(x, t);
      const ref = reflected(x, t);
      const y = superpose ? inc + ref : inc;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = 0;

      ghostPos[i * 3] = x;
      ghostPos[i * 3 + 1] = showGhost ? ref : 0;
      ghostPos[i * 3 + 2] = 0;
    }

    this.string.geometry.attributes.position.needsUpdate = true;
    this.ghostString.geometry.attributes.position.needsUpdate = true;
    this.ghostString.visible = showGhost || superpose;

    const standingInfo = superpose
      ? `<p>With a reflected wave added, the two travelling waves form an <b>interference pattern</b>. At fixed ends the reflected wave is inverted, so the sum is zero at the boundary and nodes appear at half-wavelength spacing.</p>`
      : `<p>A single wave travels along the string. The disturbance moves, but the string itself does not travel with it.</p>`;

    this.setInfo(`
      <h2>Physical Waves</h2>
      <p>A wave on a string is described by <b>y(x,t) = A sin(kx − ωt)</b>. The wave number k sets the wavelength; ω/k is the wave speed.</p>
      <div class="formula" data-derivation="travelling-wave">
        <div class="formula-label">Travelling wave</div>
        <div class="formula-body">y(x,t) = A sin(kx − ωt)</div>
        <div class="formula-note">Keeping kx − ωt constant follows a crest moving at speed c = ω/k.</div>
      </div>
      <div class="formula" data-derivation="wave-relations">
        <div class="formula-label">Wave relationships</div>
        <div class="formula-body">k = 2π/λ, &nbsp; ω = 2π/T, &nbsp; c = ω/k = λ/T</div>
        <div class="formula-note">One wavelength passes a point during one period.</div>
      </div>
      <div class="formula" data-derivation="wave-reflection">
        <div class="formula-label">Incident plus reflected wave</div>
        <div class="formula-body">y = A sin(kx − ωt) ± A sin(kx + ωt)</div>
        <div class="formula-note">The sign encodes the boundary: a fixed end inverts the reflection; a free end does not.</div>
      </div>
      <div class="readout">
        <div>Wavelength λ = ${(this.length / frequency).toFixed(2)} m</div>
        <div>Wave speed c = ${speed.toFixed(2)} m/s</div>
        <div>Period T = ${((this.length / frequency) / speed).toFixed(2)} s</div>
      </div>
      ${standingInfo}
      <p class="example"><b>Try it:</b> set the far end to <b>fixed</b> and turn on <b>Superpose reflection</b>. Adjust the frequency until you see a clean standing wave with nodes that do not move.</p>
    `);
  }
}
