import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { tip } from "./helpers";
import { CHAPTERS } from "./shaderCourse";
import "./formulaDerivations/shaders";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A friendly default fragment shader the user can edit. Uses vUv (0..1) + u_time.
const DEFAULT_FRAG = `// GLSL ES fragment shader — edit me, then press "Compile" (or Ctrl/Cmd+Enter)
// Available: vUv (0..1 across the quad), u_time (seconds), u_resolution, u_mouse
uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;
varying vec2  vUv;

void main() {
  // Centre the coordinates so (0,0) is the middle.
  vec2 p = vUv - 0.5;
  float r = length(p);

  // Animated colour: rings that breathe with time.
  float rings = 0.5 + 0.5 * sin(r * 40.0 - u_time * 3.0);

  vec3 col = vec3(rings) * vec3(0.3 + 0.7 * vUv.x, 0.4, 0.9 - 0.6 * vUv.y);
  gl_FragColor = vec4(col, 1.0);
}`;

const EXAMPLES: Record<string, string> = {
  Rings: DEFAULT_FRAG,
  Plasma: `uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 8.0;
  float v = sin(p.x + u_time)
          + sin(p.y + u_time * 1.3)
          + sin(p.x + p.y + u_time * 0.7)
          + sin(length(p - 4.0) - u_time * 2.0);
  v *= 0.25;
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (v + vec3(0.0, 0.33, 0.67)));
  gl_FragColor = vec4(col, 1.0);
}`,
  Checker: `uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 g = floor((vUv + vec2(u_time * 0.05, 0.0)) * 10.0);
  float c = mod(g.x + g.y, 2.0);
  vec3 col = mix(vec3(0.08, 0.1, 0.14), vec3(0.2, 0.8, 0.7), c);
  gl_FragColor = vec4(col, 1.0);
}`,
  Swirl: `uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float a = atan(p.y, p.x);
  float r = length(p);
  float swirl = sin(a * 5.0 + r * 20.0 - u_time * 2.0);
  vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + swirl + u_time);
  gl_FragColor = vec4(col, 1.0);
}`,
  Mouse: `uniform float u_time;
uniform vec2  u_mouse;
varying vec2  vUv;
void main() {
  float d = distance(vUv, u_mouse);
  float glow = 0.02 / (d + 0.02);
  vec3 col = glow * vec3(0.9, 0.5, 0.2) + 0.1 * vec3(vUv, 0.5 + 0.5 * sin(u_time));
  gl_FragColor = vec4(col, 1.0);
}`,
  Mandelbrot: `uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 3.0 - vec2(0.5, 0.0);
  vec2 z = vec2(0.0);
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    if (dot(z, z) > 4.0) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    iter++;
  }
  vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 0.5, 1.0) + log(iter + 1.0) * 1.5 + u_time * 0.3);
  gl_FragColor = vec4(col, 1.0);
}`,
  "Julia set": `uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 z = (vUv - 0.5) * 2.5;
  vec2 c = vec2(-0.8 + 0.1 * cos(u_time), 0.156 + 0.1 * sin(u_time));
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    if (dot(z, z) > 4.0) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    iter++;
  }
  vec3 col = 0.5 + 0.5 * cos(vec3(0.3, 0.6, 0.9) + log(iter + 1.0) * 2.0);
  gl_FragColor = vec4(col, 1.0);
}`,
  "Raymarched sphere": `uniform float u_time;
uniform vec2 u_resolution;
varying vec2 vUv;
float sdSphere(vec3 p, float r) { return length(p) - r; }
void main() {
  vec2 uv = (vUv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));
  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    float d = sdSphere(p - vec3(0.0, sin(u_time) * 0.2, 0.0), 1.0);
    if (d < 0.001 || t > 20.0) break;
    t += d;
  }
  vec3 col = vec3(0.05);
  if (t < 20.0) {
    vec3 p = ro + rd * t;
    vec3 n = normalize(p - vec3(0.0, sin(u_time) * 0.2, 0.0));
    vec3 light = normalize(vec3(1.0, 1.0, 2.0));
    float diff = max(dot(n, light), 0.0);
    col = vec3(0.2, 0.6, 0.9) * (0.2 + 0.8 * diff);
  }
  gl_FragColor = vec4(col, 1.0);
}`,
};

/**
 * Lesson 22 — Shader Playground.
 *
 * A live GLSL ES fragment-shader editor (Shadertoy-style). The user's code is the *entire*
 * fragment shader of a ShaderMaterial painted on a quad. We feed it u_time, u_resolution and
 * u_mouse uniforms; recompile on demand; and surface GLSL compile errors via the renderer's
 * onShaderError hook so mistakes are explained instead of failing silently.
 *
 * Browsers run WebGL, whose shading language is GLSL ES — not HLSL (DirectX) or WGSL (WebGPU).
 */
export class ShaderPlaygroundLesson implements Lesson {
  readonly id = "shaders";
  readonly title = "22 · Shader Playground";
  readonly blurb = "Live GLSL fragment shaders";
  readonly category = "Programming" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = [] as const;

  private group = new THREE.Group();
  private mesh?: THREE.Mesh;
  private material?: THREE.ShaderMaterial;
  private stopTick?: () => void;
  private viewport!: LessonContext["viewport"];
  private params = { timeScale: 1, paused: false };

  private readonly uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
  };

  private onPointerMove?: (e: PointerEvent) => void;
  private prevHelpers = true;
  private chapter = -1;
  private readonly chapters = CHAPTERS;

  enter(ctx: LessonContext): void {
    this.viewport = ctx.viewport;

    // A clean stage: hide the grid/axes, look straight at the quad.
    ctx.viewport.setHelpers(false);
    this.prevHelpers = true;
    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 7.5), new THREE.Vector3(0, 0, 0));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: DEFAULT_FRAG,
      uniforms: this.uniforms,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 6.2), this.material);
    this.group.add(this.mesh);

    // Capture GLSL compile errors and show them to the user instead of a silent black quad.
    this.viewport.renderer.debug.onShaderError = (gl, _program, glVertex, glFragment) => {
      const log = (s: WebGLShader, label: string) => {
        const info = gl.getShaderInfoLog(s) ?? "";
        return info.trim() ? `${label}:\n${info.trim()}` : "";
      };
      const msg = [log(glFragment, "FRAGMENT"), log(glVertex, "VERTEX")].filter(Boolean).join("\n\n");
      this.setError(msg || "Unknown shader compile error.");
    };

    // Track the mouse over the canvas → u_mouse in 0..1 (y flipped to match UV).
    this.onPointerMove = (e: PointerEvent) => {
      const rect = this.viewport.renderer.domElement.getBoundingClientRect();
      this.uniforms.u_mouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      );
    };
    this.viewport.renderer.domElement.addEventListener("pointermove", this.onPointerMove);

    this.renderEditor(ctx);

    const g = ctx.gui;
    tip(g.add(this.params, "timeScale", 0, 3, 0.05).name("Time speed"),
      "How fast u_time advances. 0 freezes the animation.");
    tip(g.add(this.params, "paused").name("Pause"), "Stop u_time entirely.");
    tip(g.add({ compile: () => this.compile() }, "compile").name("▶ Compile shader"),
      "Recompile the GLSL code from the editor (also Ctrl/Cmd+Enter).");

    this.stopTick = ctx.viewport.onTick((dt) => {
      if (!this.params.paused) this.uniforms.u_time.value += dt * this.params.timeScale;
      const c = this.viewport.renderer.domElement;
      this.uniforms.u_resolution.value.set(c.width, c.height);
    });
  }

  /** Render the code editor, the zero→hero course and the reference into the info panel. */
  private renderEditor(ctx: LessonContext): void {
    const exampleButtons = Object.keys(EXAMPLES)
      .map((k) => `<button class="glsl-chip" data-ex="${k}">${k}</button>`)
      .join("");

    const chapterButtons = this.chapters
      .map((c, i) => `<button class="glsl-chapter" data-ch="${i}">
        <span class="glsl-ch-num">${i + 1}</span>${c.title}</button>`)
      .join("");

    ctx.setInfo(`
      <h2>Shader Playground</h2>
      <p>A <b>shader</b> is a tiny program the GPU runs <i>for every pixel</i>, in parallel.
      This one is a <b>GLSL ES fragment shader</b> — the language WebGL (and Three.js) speaks.
      It's the same family as Shadertoy. (It is <i>not</i> HLSL, which is DirectX, nor WGSL,
      which is the newer WebGPU language.)</p>

      <p class="example"><b>Why is <code>vUv</code> 2D when the app is 3D?</b> The shader paints a
      flat quad, and <code>vUv</code> is the position <i>across that surface</i> (0→1 in x and y)
      — surface coordinates are always 2D, like the map printed on a 3D globe. The quad still
      lives in the 3D scene (its corners are <code>vec3</code> positions). To draw <i>genuine</i>
      3D <i>inside</i> a pixel shader you fire a ray per pixel — that's the bonus
      <b>raymarching</b> track (chapters 14–17).</p>

      <div class="glsl-course">
        <h3>Zero → Hero course</h3>
        <p class="glsl-course-hint">New to shaders? Work through these in order. Each one
        loads a short, fully-commented shader into the editor below — <b>read the comments,
        run it, then change a number</b> and Compile.</p>
        <div class="glsl-chapters">${chapterButtons}</div>
        <div id="glsl-chapter-info" class="glsl-chapter-info">
          <b>Tip:</b> click chapter <b>1 · Hello, pixel</b> to begin, or just edit the shader
          below.</div>
        <div class="glsl-course-nav">
          <button id="glsl-prev" class="glsl-btn ghost">‹ Prev</button>
          <span id="glsl-progress" class="glsl-progress">—</span>
          <button id="glsl-next" class="glsl-btn">Next ›</button>
        </div>
      </div>

      <h3>The code (edit me)</h3>
      <div class="glsl-editor">
        <textarea id="glsl-src" spellcheck="false">${DEFAULT_FRAG.replace(/</g, "&lt;")}</textarea>
        <div class="glsl-row">
          <button id="glsl-compile" class="glsl-btn">▶ Compile  (Ctrl/Cmd+Enter)</button>
          <button id="glsl-reset" class="glsl-btn ghost">Reset</button>
        </div>
        <pre id="glsl-err" class="glsl-err"></pre>
      </div>

      <h3>Quick gallery</h3>
      <div class="glsl-chips">${exampleButtons}</div>

      <h3>What you get to use</h3>
      <ul>
        <li><code>vUv</code> — this pixel's position, <b>0→1</b> across the quad (x = right, y = up).</li>
        <li><code>u_time</code> — seconds since you opened the lesson (drives animation).</li>
        <li><code>u_mouse</code> — pointer position over the canvas, 0→1. Try the <b>Mouse</b> example.</li>
        <li><code>u_resolution</code> — canvas size in pixels.</li>
        <li>You must end <code>main()</code> by writing <code>gl_FragColor = vec4(r, g, b, a);</code></li>
      </ul>
      <p class="example"><b>Golden rule:</b> a shader can't ask "what's around me?" — it only
      knows <i>this</i> pixel's position. Everything (shapes, motion, texture) is built from
      maths on <code>vUv</code> and <code>u_time</code>. Break a shader on purpose (delete a
      <code>;</code>) to see the error reporting.</p>`);

    const root = document.getElementById("info");
    if (!root) return;
    const ta = root.querySelector<HTMLTextAreaElement>("#glsl-src");
    root.querySelector<HTMLButtonElement>("#glsl-compile")?.addEventListener("click", () => this.compile());
    root.querySelector<HTMLButtonElement>("#glsl-reset")?.addEventListener("click", () => {
      if (ta) ta.value = DEFAULT_FRAG;
      this.chapter = -1;
      this.refreshCourseUi();
      this.compile();
    });
    ta?.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.compile();
      }
    });
    root.querySelectorAll<HTMLButtonElement>(".glsl-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.ex!;
        if (ta) ta.value = EXAMPLES[key];
        this.chapter = -1;
        this.refreshCourseUi();
        this.compile();
      });
    });
    root.querySelectorAll<HTMLButtonElement>(".glsl-chapter").forEach((btn) => {
      btn.addEventListener("click", () => this.loadChapter(Number(btn.dataset.ch)));
    });
    root.querySelector<HTMLButtonElement>("#glsl-prev")
      ?.addEventListener("click", () => this.loadChapter((this.chapter < 0 ? 0 : this.chapter) - 1));
    root.querySelector<HTMLButtonElement>("#glsl-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
    this.refreshCourseUi();
  }

  /** Load a course chapter's shader into the editor, compile it and update the course UI. */
  private loadChapter(index: number): void {
    const i = Math.max(0, Math.min(this.chapters.length - 1, index));
    this.chapter = i;
    const ta = document.getElementById("glsl-src") as HTMLTextAreaElement | null;
    if (ta) ta.value = this.chapters[i].code;
    this.refreshCourseUi();
    this.compile();
    document.getElementById("glsl-chapter-info")?.scrollIntoView({ block: "nearest" });
  }

  /** Sync the course panel (active chapter, blurb, progress, prev/next state) to `this.chapter`. */
  private refreshCourseUi(): void {
    const info = document.getElementById("glsl-chapter-info");
    const progress = document.getElementById("glsl-progress");
    const prev = document.getElementById("glsl-prev") as HTMLButtonElement | null;
    const next = document.getElementById("glsl-next") as HTMLButtonElement | null;
    document.querySelectorAll<HTMLElement>(".glsl-chapter").forEach((b, i) => {
      b.classList.toggle("active", i === this.chapter);
    });
    if (this.chapter < 0) {
      if (progress) progress.textContent = `${this.chapters.length} chapters`;
      if (prev) prev.disabled = true;
      if (next) next.disabled = false;
      return;
    }
    const c = this.chapters[this.chapter];
    if (info) {
      const derivation = c.derivationId ? ` ${derivationButton(c.derivationId)}` : "";
      info.innerHTML = `<b>${this.chapter + 1} · ${c.title}</b> — ${c.idea}${derivation}`;
    }
    if (progress) progress.textContent = `${this.chapter + 1} / ${this.chapters.length}`;
    if (prev) prev.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === this.chapters.length - 1;
  }

  private setError(msg: string): void {
    const el = document.getElementById("glsl-err");
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }

  /** Read the editor's source, swap it into the material and trigger a recompile. */
  private compile(): void {
    if (!this.material) return;
    const ta = document.getElementById("glsl-src") as HTMLTextAreaElement | null;
    if (!ta) return;
    this.setError("");
    this.material.fragmentShader = ta.value;
    this.material.needsUpdate = true;
    // Force a synchronous render so onShaderError fires now if the code is invalid.
    this.viewport.renderer.render(this.viewport.scene, this.viewport.camera);
  }

  exit(): void {
    this.stopTick?.();
    if (this.onPointerMove) {
      this.viewport.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    }
    this.viewport.renderer.debug.onShaderError = null;
    this.viewport.setHelpers(this.prevHelpers);
    this.mesh?.geometry.dispose();
    this.material?.dispose();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }
}
