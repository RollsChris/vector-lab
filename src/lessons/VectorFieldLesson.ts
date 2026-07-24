import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton } from "../core/FormulaDerivations";
import { tryCompile4, type Fn4 } from "../math/expr";
import { heat, marker, tip } from "./helpers";
import "./formulaDerivations/calculus";

/**
 * Lesson 14 — Vector fields.
 *
 * The field is an *interactive equation*. By default it's a flat 2D field built from four
 * coefficient sliders, F(x, y) = ( a·x + b·y , c·x + d·y ), and the arrows + flow particles
 * update live as you drag them. A collapsed "Add 3D depth" folder extends it to the full
 * R-component and a z input. Example buttons snap to famous fields (rotation, shear, saddle,
 * source, sink, spirals…), plus nonlinear/time-varying ones (waves, ripples).
 */
export class VectorFieldLesson implements Lesson {
  readonly id = "vector-field";
  readonly title = "14 · Vector Fields";
  readonly blurb = "An arrow at every point: F = (P, Q)";
  readonly category = "Calculus" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["differentiation", "integration"] as const;

  private group = new THREE.Group();
  private arrows: THREE.ArrowHelper[] = [];
  private probeMarker?: THREE.Mesh;
  private probeArrow?: THREE.ArrowHelper;
  private particles?: THREE.Points;
  private particleAge?: Float32Array;
  private particleLife?: Float32Array;
  private fieldMaxMag = 1;
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private linearMode = true;
  private timeVarying = false;
  private time = 0;
  private arrowRefreshAcc = 0;
  private errP = "";
  private errQ = "";
  private errR = "";

  private P: Fn4 = () => 0;
  private Q: Fn4 = () => 0;
  private R: Fn4 = () => 0;

  private readonly params = {
    // Interactive equation coefficients:
    //   P = a·x + b·y + g·z,  Q = c·x + d·y + h·z,  R = e·x + f·y + i·z
    a: 0,
    b: -1,
    c: 1,
    d: 0,
    e: 0,
    f: 0,
    g: 0,
    h: 0,
    i: 0,
    zPush: 0,
    density: 13,
    scale: 0.5,
    animate: true,
    // The "point inspector" probe location (where you are standing).
    px: 2,
    py: 1,
    pz: 0,
    // Compiled formula source (kept in sync for the maths engine + the formula readout).
    P: "-y",
    Q: "x",
    R: "0",
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;

    ctx.viewport.world.add(this.group);
    ctx.viewport.frameCamera(
      new THREE.Vector3(3, 2.5, 11),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildFromCoeffs(); // sets P/Q/R, builds arrows + formula readout
    this.initParticles();
    this.buildProbe();
    this.updateProbe();

    const g = ctx.gui;

    // --- ① The field equation (2D by default) ------------------------------------
    const eq = g.addFolder("① The field:  F = ( P , Q )");
    const onCoeff = () => this.buildFromCoeffs();
    tip(eq.add(this.params, "a", -2, 2, 0.1).name("→ right-push from x   (a)").onChange(onCoeff),
      "P, the rightward (red) push, changes by a for every step you stand to the right (x).");
    tip(eq.add(this.params, "b", -2, 2, 0.1).name("→ right-push from y   (b)").onChange(onCoeff),
      "P, the rightward (red) push, changes by b for every step you stand up (y). This cross-link is what bends a flat field into a swirl.");
    tip(eq.add(this.params, "c", -2, 2, 0.1).name("↑ up-push from x   (c)").onChange(onCoeff),
      "Q, the upward (green) push, changes by c for every step you stand to the right (x).");
    tip(eq.add(this.params, "d", -2, 2, 0.1).name("↑ up-push from y   (d)").onChange(onCoeff),
      "Q, the upward (green) push, changes by d for every step you stand up (y). d = +1 = outward, d = −1 = inward.");
    eq.open();

    // --- Inspect one point: the explainer ----------------------------------------
    const probe = g.addFolder("🔍 Pick a point — watch the maths");
    const onProbe = () => this.updateProbe();
    tip(probe.add(this.params, "px", -4, 4, 0.5).name("your x position").onChange(onProbe),
      "Move the yellow dot left/right and watch its x feed the pushes in the panel.");
    tip(probe.add(this.params, "py", -4, 4, 0.5).name("your y position").onChange(onProbe),
      "Move the yellow dot up/down and watch its y feed the pushes in the panel.");
    probe.open();

    // --- ② Optional: add the third dimension (z) ---------------------------------
    const z3d = g.addFolder("② Add 3D depth (the z axis) — optional");
    tip(z3d.add(this.params, "g", -2, 2, 0.1).name("→ right-push from z   (g)").onChange(onCoeff),
      "How your height z feeds the rightward (red) push. The genuinely-3D ingredient.");
    tip(z3d.add(this.params, "h", -2, 2, 0.1).name("↑ up-push from z   (h)").onChange(onCoeff),
      "How your height z feeds the upward (green) push.");
    tip(z3d.add(this.params, "e", -2, 2, 0.1).name("⊙ depth-push from x   (e)").onChange(onCoeff),
      "R, the toward-you (blue) push, from your x position — tilts the field out of the flat plane.");
    tip(z3d.add(this.params, "f", -2, 2, 0.1).name("⊙ depth-push from y   (f)").onChange(onCoeff),
      "R, the toward-you (blue) push, from your y position.");
    tip(z3d.add(this.params, "i", -2, 2, 0.1).name("⊙ depth-push from z   (i)").onChange(onCoeff),
      "R, the toward-you (blue) push, from your own height z. i = 1 makes things fly apart in z too.");
    tip(z3d.add(this.params, "zPush", -1.5, 1.5, 0.05).name("⊙ constant depth-push").onChange(() => {
      this.rebuild();
      this.renderInfo();
    }), "Add the SAME toward-you (z) push everywhere — drag it and watch particles lift out of the plane.");
    tip(z3d.add(this.params, "pz", -4, 4, 0.5).name("your z position (height)").onChange(onProbe),
      "Move the yellow dot in depth. Only matters once a slider above is non-zero.");
    z3d.close();

    // --- Example buttons ("cool" fields) -----------------------------------------
    const ex = g.addFolder("Examples — try these");
    const buttons: Record<string, () => void> = {
      "🌀 Rotation": () => this.applyLinear([0, -1, 1, 0, 0, 0]),
      "↗ Shear": () => this.applyLinear([0, 1, 0, 0, 0, 0]),
      "⤬ Saddle": () => this.applyLinear([1, 0, 0, -1, 0, 0]),
      "💥 Source (explode)": () => this.applyLinear([1, 0, 0, 1, 0, 0]),
      "🕳 Sink (collapse)": () => this.applyLinear([-1, 0, 0, -1, 0, 0]),
      "🌪 Spiral out": () => this.applyLinear([1, -1, 1, 1, 0, 0]),
      "🌊 Spiral in": () => this.applyLinear([-1, -1, 1, -1, 0, 0]),
      "🚁 Swirl + lift": () => this.applyLinear([0, -1, 1, 0, 0, 0], 0.6),
      "🎲 Random": () => {
        const r = () => Math.round((Math.random() * 4 - 2) * 10) / 10;
        this.applyLinear([r(), r(), r(), r(), 0, 0]);
      },
      "🪜 3D · Lean by height (P = z)": () => this.applyLinear([0, 0, 0, 0, 0, 0, 1, 0, 0]),
      "🌐 3D · Source (explode in x,y,z)": () => this.applyLinear([1, 0, 0, 1, 0, 0, 0, 0, 1]),
      "🕳 3D · Sink (collapse in x,y,z)": () => this.applyLinear([-1, 0, 0, -1, 0, 0, 0, 0, -1]),
      "🧭 3D · Tilted-axis rotation": () => this.applyLinear([0, -1, 1, 0, -1, 1, 1, -1, 0]),
      "〰 Waves (nonlinear)": () => this.applyFormula("sin(y)", "cos(x)", "0"),
      "💧 Ripples (nonlinear)": () => this.applyFormula("-y", "x", "sin(x*2)*0.6"),
      "🌽 3D · Twisting tower (turns with height)": () => this.applyFormula("cos(z)", "sin(z)", "0.5"),
      "🧬 3D · Helix flow (rise + swirl)": () => this.applyFormula("-y + cos(z)*0.6", "x + sin(z)*0.6", "0.6"),
      "⏱ Pulsing waves (time)": () => this.applyFormula("sin(y + t)", "cos(x - t)", "0"),
      "🌊 Travelling ripples (time)": () => this.applyFormula("-y", "x", "sin(x*2 - t*3)*0.6"),
      "🫁 Breathing source (time)": () => this.applyFormula("x*sin(t)", "y*sin(t)", "0"),
    };
    for (const [label, fn] of Object.entries(buttons)) {
      tip(ex.add({ [label]: fn }, label), "Click to load this field into the equation above.");
    }
    ex.close();

    // --- Appearance (does not change the field) ----------------------------------
    const disp = g.addFolder("Display");
    tip(disp.add(this.params, "density", 5, 21, 1).name("Arrow density").onChange(() => this.rebuild()),
      "How many arrows are drawn (appearance only).");
    tip(disp.add(this.params, "scale", 0.1, 1.5, 0.05).name("Arrow length").onChange(() => this.rebuild()),
      "How long the arrows are drawn (appearance only).");
    tip(disp.add(this.params, "animate").name("Flow particles"),
      "Dots that ride the field; faster where arrows are red (strong).");
    disp.close();

    this.stopTick = ctx.viewport.onTick((dt, elapsed) => this.tick(dt, elapsed));
  }

  private updateDisplays(): void {
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  /** Apply a linear example: set the six (or nine) coefficients (+ optional Z push) and rebuild. */
  private applyLinear(co: number[], push = 0): void {
    const c = [...co];
    while (c.length < 9) c.push(0);
    [this.params.a, this.params.b, this.params.c, this.params.d, this.params.e, this.params.f,
      this.params.g, this.params.h, this.params.i] = c;
    this.params.zPush = push;
    this.buildFromCoeffs();
    this.updateDisplays();
  }

  /** Apply a nonlinear example by setting the P/Q/R formulas directly. */
  private applyFormula(p: string, q: string, r: string, push = 0): void {
    this.params.P = p;
    this.params.Q = q;
    this.params.R = r;
    this.params.zPush = push;
    this.linearMode = false;
    this.timeVarying = /\bt\b/.test(`${p} ${q} ${r}`);
    this.recompile();
    this.rebuild();
    this.renderInfo();
    this.updateDisplays();
  }

  /** Build the field directly from the coefficient sliders (cheap, no recompiling). */
  private buildFromCoeffs(): void {
    const { a, b, c, d, e, f, g, h, i } = this.params;
    this.P = (x: number, y: number, z: number) => a * x + b * y + g * z;
    this.Q = (x: number, y: number, z: number) => c * x + d * y + h * z;
    this.R = (x: number, y: number, z: number) => e * x + f * y + i * z;
    this.params.P = `(${a})*x + (${b})*y + (${g})*z`;
    this.params.Q = `(${c})*x + (${d})*y + (${h})*z`;
    this.params.R = `(${e})*x + (${f})*y + (${i})*z`;
    this.errP = this.errQ = this.errR = "";
    this.linearMode = true;
    this.timeVarying = false;
    this.rebuild();
    this.renderInfo();
  }

  private recompile(): void {
    const p = tryCompile4(this.params.P);
    const q = tryCompile4(this.params.Q);
    const r = tryCompile4(this.params.R);
    this.errP = p.error;
    this.errQ = q.error;
    this.errR = r.error;
    if (p.fn) this.P = p.fn;
    if (q.fn) this.Q = q.fn;
    if (r.fn) this.R = r.fn;
  }

  /** Format a linear combination like "1.5·x − y" (hides zero terms, tidies signs). */
  private fmtLinear(parts: Array<[number, string]>, constant = 0): string {
    const round = (n: number) => {
      const r = Math.round(n * 10) / 10;
      return (Object.is(r, -0) ? 0 : r).toString();
    };
    const tokens: string[] = [];
    for (const [coef, v] of parts) {
      if (Math.abs(coef) < 1e-9) continue;
      const mag = Math.abs(coef);
      const coefStr = Math.abs(mag - 1) < 1e-9 ? "" : `${round(mag)}·`;
      const sign = coef < 0 ? "−" : tokens.length ? "+" : "";
      tokens.push(`${sign}${sign ? " " : ""}${coefStr}${v}`.trim());
    }
    if (Math.abs(constant) > 1e-9) {
      const sign = constant < 0 ? "−" : tokens.length ? "+" : "";
      tokens.push(`${sign}${sign ? " " : ""}${round(Math.abs(constant))}`.trim());
    }
    return tokens.length ? tokens.join(" ") : "0";
  }

  /** The z-component formula as displayed, folding in the constant Z push. */
  private effectiveZ(): string {
    const r = this.params.R.trim();
    const push = this.params.zPush;
    if (push === 0) return r || "0";
    if (r === "" || r === "0") return `${push}`;
    return push > 0 ? `${r} + ${push}` : `${r} - ${Math.abs(push)}`;
  }

  /** True when the field has any z (depth) action — drives 2D-vs-3D display choices. */
  private hasZ(): boolean {
    if (!this.linearMode) {
      const r = this.params.R.trim();
      return (
        this.params.zPush !== 0 ||
        (r !== "" && r !== "0") ||
        /\bz\b/.test(`${this.params.P} ${this.params.Q} ${this.params.R}`)
      );
    }
    const p = this.params;
    return !!(p.e || p.f || p.g || p.h || p.i || p.zPush);
  }

  /** Re-render the info panel, leading with the live, colour-coded field formula. */
  private renderInfo(): void {
    const bad = (msg: string) => (msg ? ` <span class="err">⚠</span>` : "");
    const threeD = this.hasZ();
    let pStr: string;
    let qStr: string;
    let rStr: string;
    if (this.linearMode) {
      pStr = this.fmtLinear([[this.params.a, "x"], [this.params.b, "y"], [this.params.g, "z"]]);
      qStr = this.fmtLinear([[this.params.c, "x"], [this.params.d, "y"], [this.params.h, "z"]]);
      rStr = this.fmtLinear([[this.params.e, "x"], [this.params.f, "y"], [this.params.i, "z"]], this.params.zPush);
    } else {
      pStr = this.params.P || "0";
      qStr = this.params.Q || "0";
      rStr = this.effectiveZ();
    }
    const px = `<span style="color:#ff7b72">${pStr}</span>${bad(this.errP)}`;
    const qy = `<span style="color:#7ee787">${qStr}</span>${bad(this.errQ)}`;
    const rz = `<span style="color:#79c0ff">${rStr}</span>${bad(this.errR)}`;
    const anyErr = this.errP || this.errQ || this.errR;

    const head = threeD ? "F(x,&thinsp;y,&thinsp;z)" : "F(x,&thinsp;y)";
    const body = threeD
      ? `${head} = ( ${px} ,&nbsp; ${qy} ,&nbsp; ${rz} )`
      : `${head} = ( ${px} ,&nbsp; ${qy} )`;

    this.setInfo(`
      <h2>Vector Fields (3D)</h2>

      <p><b>A vector field puts an arrow at every point.</b> You tell it where you are
      <code>(x, y)</code>; it tells you which way you'd be pushed and how hard — like wind on
      a map. Length &amp; colour show strength
      (<span style="color:#79c0ff">blue</span> = gentle →
      <span style="color:#ff7b72">red</span> = strong); the dots just drift along it.</p>

      <div class="formula" data-derivation="field-components">
        <div class="formula-label">Your field right now</div>
        <div class="formula-body">${body}</div>
        <div class="formula-note">${
          anyErr
            ? '<span class="err">A formula is invalid — the last valid field is still shown.</span>'
            : this.linearMode
              ? "Drag <b>a, b, c, d</b> to reshape it, or hit an example button below."
              : "A nonlinear example — drag any slider to return to the simple equation."
        }</div>
      </div>

      <div class="formula" id="vf-probe" data-derivation="field-evaluation">${this.probeHtml()}</div>

      <h3>The arrow is just two pushes</h3>
      <p>Every arrow is made of two numbers:</p>
      <ul>
        <li><b style="color:#ff7b72">P</b> = the <b>right-push</b> (sideways,
          <span style="color:#ff7b72">x</span>)</li>
        <li><b style="color:#7ee787">Q</b> = the <b>up-push</b> (vertical,
          <span style="color:#7ee787">y</span>)</li>
      </ul>
      <p>Each push can depend on <b>where you are</b> — your x <i>and</i> your y — so each is a
      tiny recipe, which is why there are <b>four</b> sliders, not two:</p>
      <div class="formula" data-derivation="linear-field-map" style="margin:8px 0">
        <div class="formula-body" style="font-size:14px">
          <span style="color:#ff7b72">P = a·x + b·y</span><br>
          <span style="color:#7ee787">Q = c·x + d·y</span>
        </div>
        <div class="formula-note">e.g. the slider “<b>right-push from y (b)</b>” is just the
        <b>b</b> in the top line — how much your <i>y</i> feeds the sideways push.</div>
      </div>
      <p class="example"><b>Worked example.</b> Set <b>a = 1</b>, the rest 0, and stand at
      <code>(x = 2, y = 0)</code>: P = 1·2 + 0 = <b>2</b>, Q = 0 → an arrow of length 2 pointing
      right. Now add <b>b = 1</b> and step up to <code>y = 1</code>: the sideways push grows even
      though you didn't move right — that cross-link is what makes a field <b>swirl</b>.</p>

      <h3>Four shapes to know (a, b, c, d)</h3>
      <ul>
        <li><b>b = −1, c = 1</b> (rest 0) → <b>rotation</b> 🌀</li>
        <li><b>a = 1, d = 1</b> → <b>source</b>, everything flies outward 💥</li>
        <li><b>a = −1, d = −1</b> → <b>sink</b>, everything falls inward 🕳</li>
        <li><b>a = 1, d = −1</b> → <b>saddle</b>, in one way, out the other ⤬</li>
      </ul>
      <p>These two behaviours have names you'll meet again in physics and engineering.
      <b>Divergence</b> measures the <i>net outward push</i> at a point: it is positive at a
      <b>source</b>, negative at a <b>sink</b>, and zero for pure rotation. <b>Curl</b> measures
      how much the field <i>spins</i> a tiny paddle wheel: large for <b>rotation</b>, zero for a
      pure source or sink. Divergence describes how much flows out; curl describes how much it
      whirls. Fluids, heat, electric and magnetic fields are all read this way.</p>

      <h3>Want depth? Open “② Add 3D”</h3>
      <p>That folder adds a third push <b style="color:#79c0ff">R</b> (toward/away from you, the
      <span style="color:#79c0ff">z</span> axis) and lets your <b>height z</b> feed the pushes
      too. Leave it closed and the field stays flat. The <b>Examples</b> folder has ready-made
      2D and 3D fields (including time-varying waves) — orbit the camera to see the 3D ones.</p>

      <p class="example"><b>Have a play:</b> hit <b>🎲 Random</b>, then nudge one slider at a time
      and watch how that single number bends the whole flow.</p>`);
  }

  /** Field vector at a point, including time and the constant Z push on z. */
  private fieldAt(x: number, y: number, z: number): [number, number, number] {
    const t = this.time;
    return [this.P(x, y, z, t), this.Q(x, y, z, t), this.R(x, y, z, t) + this.params.zPush];
  }

  /** Create the inspector's marker + its own highlighted arrow (once). */
  private buildProbe(): void {
    this.probeMarker = marker(0xffd23f, 0.16);
    this.group.add(this.probeMarker);
    this.probeArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffd23f, 0.3, 0.2,
    );
    this.group.add(this.probeArrow);
  }

  /** Reposition the marker/arrow for the current probe point and refresh the arithmetic. */
  private updateProbe(): void {
    const { px, py, pz } = this.params;
    const [vx, vy, vz] = this.fieldAt(px, py, pz);
    const mag = Math.hypot(vx, vy, vz);
    if (this.probeMarker) this.probeMarker.position.set(px, py, pz);
    if (this.probeArrow) {
      this.probeArrow.position.set(px, py, pz);
      if (mag > 1e-6) {
        this.probeArrow.visible = true;
        this.probeArrow.setDirection(new THREE.Vector3(vx, vy, vz).normalize());
        const len = Math.min(Math.max(mag * 0.6, 0.3), 3.2);
        this.probeArrow.setLength(len, len * 0.32, len * 0.2);
      } else {
        this.probeArrow.visible = false;
      }
    }
    const el = document.getElementById("vf-probe");
    if (el) {
      el.innerHTML = this.probeHtml();
      el.insertAdjacentHTML("beforeend", derivationButton("field-evaluation"));
    }
  }

  /** Build the live arithmetic block that shows ONE input flowing into the pushes. */
  private probeHtml(): string {
    const n = (v: number) => {
      const r = Math.round(v * 100) / 100;
      return (Object.is(r, -0) ? 0 : r).toString();
    };
    const xv = `<span class="vf-x">${n(this.params.px)}</span>`;
    const yv = `<span class="vf-y">${n(this.params.py)}</span>`;
    const zv = `<span class="vf-z">${n(this.params.pz)}</span>`;
    const [vx, vy, vz] = this.fieldAt(this.params.px, this.params.py, this.params.pz);
    const mag = Math.hypot(vx, vy, vz);
    const threeD = this.hasZ();

    let rows: string;
    if (this.linearMode) {
      const { a, b, c, d, e, f, g, h, i } = this.params;
      const { px, py, pz } = this.params;
      const row = (label: string, col: string, k1: number, k2: number, k3: number, out: number) => {
        const zTerm = threeD ? ` + ${n(k3)}·${zv}` : "";
        const zNum = threeD ? ` + ${n(k3 * pz)}` : "";
        return (
          `<div><span style="color:${col}">${label}</span> = ` +
          `${n(k1)}·${xv} + ${n(k2)}·${yv}${zTerm} = ` +
          `${n(k1 * px)} + ${n(k2 * py)}${zNum} = <b>${n(out)}</b></div>`
        );
      };
      rows =
        row("P (→ right)", "#ff7b72", a, b, g, vx) +
        row("Q (↑ up)", "#7ee787", c, d, h, vy) +
        (threeD ? row("R (⊙ depth)", "#79c0ff", e, f, i, vz) : "");
    } else {
      const row = (label: string, col: string, formula: string, out: number) =>
        `<div><span style="color:${col}">${label}</span> = ` +
        `${formula.replace(/\bx\b/g, xv).replace(/\by\b/g, yv).replace(/\bz\b/g, zv)} = <b>${n(out)}</b></div>`;
      rows =
        row("P (→ right)", "#ff7b72", this.params.P || "0", vx) +
        row("Q (↑ up)", "#7ee787", this.params.Q || "0", vy) +
        (threeD
          ? row("R (⊙ depth)", "#79c0ff", this.params.R || "0", vz)
          : "");
    }

    const here = threeD
      ? `( x = ${xv}, y = ${yv}, z = ${zv} )`
      : `( x = ${xv}, y = ${yv} )`;
    const arrowOut = threeD
      ? `( <b>${n(vx)}</b>, <b>${n(vy)}</b>, <b>${n(vz)}</b> )`
      : `( <b>${n(vx)}</b>, <b>${n(vy)}</b> )`;
    const note = threeD
      ? `See how your <span class="vf-x">x</span>, <span class="vf-y">y</span> and
         <span class="vf-z">z</span> are each fed into every row? Same position, different
         push-directions — the sliders set how much of each.`
      : `See how the <span class="vf-x">same x</span> and <span class="vf-y">same y</span> feed
         <b>both</b> pushes? That's the whole idea. Drag <b>your x / y position</b> and watch the
         numbers and the yellow arrow change.`;

    return `
      <div class="formula-label">🔍 Watch one point</div>
      <p style="margin:4px 0 8px">You're standing on the <b style="color:#ffd23f">yellow dot</b> at
      ${here}. Here's how the field turns that into <i>your</i> arrow:</p>
      <div class="vf-calc">${rows}</div>
      <div class="vf-calc" style="margin-top:6px">→ your arrow = ${arrowOut},&nbsp; length
        <b>${n(mag)}</b></div>
      <div class="formula-note">${note}</div>`;
  }

  /** True when the field actually reads the z input (so arrows should fill a 3D volume). */
  private fieldUsesZ(): boolean {
    if (this.linearMode) {
      return this.params.g !== 0 || this.params.h !== 0 || this.params.i !== 0;
    }
    return /\bz\b/.test(`${this.params.P} ${this.params.Q} ${this.params.R}`);
  }

  private rebuild(): void {
    for (const a of this.arrows) {
      this.group.remove(a);
      a.dispose();
    }
    this.arrows = [];

    const n = Math.round(this.params.density);
    const span = 8;
    const step = span / (n - 1);
    // When the field depends on z, stack a few horizontal layers so the 3D structure shows;
    // otherwise keep the single z = 0 slice (flat fields look the same as before).
    const zLayers = this.fieldUsesZ() ? Math.min(5, n) : 1;
    const zSpan = 6;
    const zStep = zLayers > 1 ? zSpan / (zLayers - 1) : 0;
    let maxMag = 1e-6;
    const raw: Array<{ pos: THREE.Vector3; vec: THREE.Vector3; mag: number }> = [];

    // Sample the field on a grid (n x n in the plane, zLayers stacked in height).
    for (let k = 0; k < zLayers; k++) {
      const z = zLayers > 1 ? -zSpan / 2 + k * zStep : 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const x = -span / 2 + i * step;
          const y = -span / 2 + j * step;
          const [vx, vy, vz] = this.fieldAt(x, y, z);
          const mag = Math.hypot(vx, vy, vz) || 0;
          maxMag = Math.max(maxMag, mag);
          raw.push({
            pos: new THREE.Vector3(x, y, z),
            vec: new THREE.Vector3(vx, vy, vz),
            mag,
          });
        }
      }
    }
    this.fieldMaxMag = maxMag;

    for (const r of raw) {
      if (!Number.isFinite(r.mag) || r.mag < 1e-6) continue;
      const dir = r.vec.clone().normalize();
      const len = (r.mag / maxMag) * this.params.scale * step * 2.2;
      const color = heat(r.mag / maxMag);
      const arrow = new THREE.ArrowHelper(
        dir,
        r.pos,
        len,
        color.getHex(),
        len * 0.4,
        len * 0.25,
      );
      this.arrows.push(arrow);
      this.group.add(arrow);
    }
    this.updateProbe();
  }

  private seed(arr: Float32Array, i: number): void {
    arr[i * 3] = (Math.random() - 0.5) * 8;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
    // Seed close to the z = 0 plane so a z-force is obvious as particles lift away.
    arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }

  private initParticles(): void {
    const count = 500;
    const pos = new Float32Array(count * 3);
    this.particleAge = new Float32Array(count);
    this.particleLife = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.seed(pos, i);
      this.particleAge[i] = Math.random() * 4;
      this.particleLife[i] = 3 + Math.random() * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.09 }),
    );
    this.group.add(this.particles);
  }

  private respawn(arr: Float32Array, i: number): void {
    this.seed(arr, i);
    if (this.particleAge) this.particleAge[i] = 0;
    if (this.particleLife) this.particleLife[i] = 3 + Math.random() * 4;
  }

  private tick(dt: number, elapsed: number): void {
    this.time = elapsed;
    // For a time-varying field, refresh the arrow snapshot a few times a second so the
    // arrows visibly animate too (particles already advect with the live field).
    if (this.timeVarying && this.params.animate) {
      this.arrowRefreshAcc += dt;
      if (this.arrowRefreshAcc >= 0.06) {
        this.arrowRefreshAcc = 0;
        this.rebuild();
      }
    }
    if (!this.params.animate || !this.particles || !this.particleAge || !this.particleLife) return;
    // When the field is effectively zero everywhere, there is nothing to flow along:
    // freeze the particles (no movement, and no lifetime-respawn) so the scene is static.
    if (this.fieldMaxMag <= 1e-5) return;
    const attr = this.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const frameDt = Math.min(dt, 0.05);
    // Speed scales with field magnitude (normalised by the peak), so dots crawl where
    // arrows are blue/short and race where red/long. maxStep clamps per-frame travel.
    const gain = 3.5 / this.fieldMaxMag;
    const maxStep = 0.18;
    for (let p = 0; p < arr.length / 3; p++) {
      const i = p * 3;
      const x = arr[i];
      const y = arr[i + 1];
      const z = arr[i + 2];
      const [vx, vy, vz] = this.fieldAt(x, y, z);
      let sx = vx * gain * frameDt;
      let sy = vy * gain * frameDt;
      let sz = vz * gain * frameDt;
      const stepLen = Math.hypot(sx, sy, sz);
      if (stepLen > maxStep) {
        const k = maxStep / stepLen;
        sx *= k;
        sy *= k;
        sz *= k;
      }
      const nx = x + sx;
      const ny = y + sy;
      const nz = z + sz;

      this.particleAge[p] += frameDt;
      const offStage =
        Math.abs(nx) > 4.5 || Math.abs(ny) > 4.5 || Math.abs(nz) > 4.5 || !Number.isFinite(nx);
      if (offStage || this.particleAge[p] > this.particleLife[p]) {
        this.respawn(arr, p);
        continue;
      }
      arr[i] = nx;
      arr[i + 1] = ny;
      arr[i + 2] = nz;
    }
    attr.needsUpdate = true;
  }

  exit(): void {
    this.stopTick?.();
    for (const a of this.arrows) a.dispose();
    this.arrows = [];
    this.probeArrow?.dispose();
    this.probeMarker?.geometry.dispose();
    this.probeArrow = undefined;
    this.probeMarker = undefined;
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }
}
