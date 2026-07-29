import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip } from "./helpers";

type Tier = "B" | "O" | "DM" | "AS";

interface Tok {
  t: "num" | "op" | "lp" | "rp";
  v?: number;
  op?: string;
}

interface Frame {
  tokens: Tok[];
  hi: [number, number] | null;
  note: string;
  tier: Tier | null;
  kind: "plain" | "before" | "after";
}

const TIER_META: Record<Tier, { label: string; sub: string; hex: string }> = {
  B: { label: "Brackets", sub: "( ) — innermost first", hex: "#ffa657" },
  O: { label: "Orders", sub: "powers & roots", hex: "#d2a8ff" },
  DM: { label: "Divide & Multiply", sub: "left → right, equal rank", hex: "#58a6ff" },
  AS: { label: "Add & Subtract", sub: "left → right, equal rank", hex: "#7ee787" },
};

const PRESETS = [
  "2 + 3 × 4",
  "(2 + 3) × 4",
  "20 − 4 × 3 + 2",
  "6 + 12 ÷ 2 × 3",
  "2 + 3 × 4 ^ 2",
  "2 × (3 + 4 × 2) − 5",
  "10 − 2 ^ 3 ÷ 4",
];

/**
 * Lesson 2 — Order of Operations (BODMAS / PEMDAS).
 *
 * The habit "what do I do first?" made visible: an expression is reduced one operation
 * at a time, always picking the highest-rung, left-most operation allowed by BODMAS.
 * The active operation lights up, collapses to its result, and a ladder shows which rung
 * (Brackets, Orders, Divide/Multiply, Add/Subtract) is being used and why. A running
 * "left-to-right blindly" answer is shown alongside so the learner sees exactly where the
 * classic mistake creeps in. Step through it, auto-play it, or type your own sum.
 */
export class OrderOfOperationsLesson implements Lesson {
  readonly id = "order-of-operations";
  readonly title = "2 · Order of Operations";
  readonly blurb = "BODMAS, one step at a time";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["arithmetic-operations"] as const;

  private setInfo!: (html: string) => void;
  private stopTick?: () => void;

  private group = new THREE.Group();
  private dynamic = new THREE.Group();

  private frames: Frame[] = [];
  private idx = 0;
  private source = PRESETS[0];
  private playing = false;
  private acc = 0;

  private readonly params = { stepSeconds: 1.1 };

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-bodmas]");
    if (!btn) return;
    this.onAction(btn.dataset.bodmas as string);
  };

  private inputHandler = (event: Event): void => {
    const raw = (event.target as HTMLInputElement).value;
    this.load(raw, true);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 2.4, 18), new THREE.Vector3(0, 0.6, 0));

    tip(
      ctx.gui.add(this.params, "stepSeconds", 0.35, 2.2, 0.05).name("Auto step (s)"),
      "How long each step is held when auto-playing.",
    );

    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);

    this.load(this.source, false);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    const info = document.getElementById("info");
    info?.removeEventListener("click", this.infoClickHandler);
    info?.querySelector("#bodmas-input")?.removeEventListener("change", this.inputHandler);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.frames = [];
  }

  // ---- actions -----------------------------------------------------------

  private onAction(action: string): void {
    if (action.startsWith("preset:")) {
      this.load(PRESETS[Number(action.slice(7))], false);
      return;
    }
    switch (action) {
      case "next":
        this.playing = false;
        this.goto(this.idx + 1);
        break;
      case "prev":
        this.playing = false;
        this.goto(this.idx - 1);
        break;
      case "restart":
        this.playing = false;
        this.goto(0);
        break;
      case "toggleplay":
        if (this.idx >= this.frames.length - 1) this.goto(0);
        this.playing = !this.playing;
        this.acc = 0;
        this.updatePanel();
        break;
    }
  }

  private load(src: string, keepInput: boolean): void {
    const tokens = tokenize(src);
    const errEl = document.getElementById("bodmas-error");
    if (!tokens || !validate(tokens)) {
      if (errEl) errEl.textContent = "That expression isn't valid — use numbers, + − × ÷ ^ and ( ).";
      return;
    }
    this.source = src;
    this.frames = generateFrames(tokens);
    this.idx = 0;
    this.playing = false;
    this.acc = 0;
    if (keepInput) {
      this.updateAll();
      if (errEl) errEl.textContent = "";
    } else {
      this.renderPanel();
      this.rebuild3D();
    }
  }

  private goto(i: number): void {
    this.idx = Math.max(0, Math.min(i, this.frames.length - 1));
    this.updateAll();
  }

  private updateAll(): void {
    this.rebuild3D();
    this.updatePanel();
  }

  // ---- auto-play ---------------------------------------------------------

  private tick(dt: number): void {
    if (!this.playing) return;
    this.acc += dt;
    if (this.acc >= this.params.stepSeconds) {
      this.acc = 0;
      if (this.idx >= this.frames.length - 1) {
        this.playing = false;
        this.updatePanel();
        return;
      }
      this.goto(this.idx + 1);
    }
  }

  // ---- 3D ----------------------------------------------------------------

  private rebuild3D(): void {
    this.disposeChildren(this.dynamic);
    const f = this.frames[this.idx];
    if (!f) return;

    const isDone = this.idx === this.frames.length - 1;

    // Top: current tier badge, or the green answer banner when finished.
    if (isDone && f.tokens.length === 1) {
      const banner = this.label(`= ${fmt(f.tokens[0].v ?? NaN)}`, 0x7ee787, 0.85);
      banner.position.set(0, 3.1, 0);
      this.dynamic.add(banner);
    } else if (f.tier) {
      const meta = TIER_META[f.tier];
      const badge = this.label(`${f.tier} · ${meta.label}`, hexNum(meta.hex), 0.5);
      badge.position.set(0, 3.1, 0);
      this.dynamic.add(badge);
    }

    this.layoutStrip(f);

    // Bottom: the running arithmetic note.
    if (f.kind !== "plain" || isDone) {
      const note = this.label(f.note, 0xc9d1d9, 0.42);
      note.position.set(0, -1.6, 0);
      this.dynamic.add(note);
    }
  }

  /** Lay the current expression out as up to 3 coloured chunks: before | highlight | after. */
  private layoutStrip(f: Frame): void {
    const worldH = 0.62;
    const gap = 0.22;

    const seg = (a: number, b: number): string =>
      f.tokens.slice(a, b + 1).map(tokenStr).join(" ");

    const parts: { str: string; color: number; isHi: boolean }[] = [];
    const len = f.tokens.length;
    if (!f.hi) {
      parts.push({ str: seg(0, len - 1), color: 0xd0d7de, isHi: false });
    } else {
      const [h0, h1] = f.hi;
      if (h0 > 0) parts.push({ str: seg(0, h0 - 1), color: 0x6e7681, isHi: false });
      const hiColor = f.kind === "after" ? 0x7ee787 : 0xffd166;
      parts.push({ str: seg(h0, h1), color: hiColor, isHi: true });
      if (h1 < len - 1) parts.push({ str: seg(h1 + 1, len - 1), color: 0x6e7681, isHi: false });
    }

    const sprites = parts.map((p) => ({ p, s: this.label(p.str, p.color, worldH) }));
    let total = sprites.reduce((sum, x) => sum + x.s.scale.x, 0) + gap * (sprites.length - 1);

    // Shrink very long strips so they stay on screen.
    const maxW = 16;
    let f2 = 1;
    if (total > maxW) {
      f2 = maxW / total;
      for (const { s } of sprites) s.scale.set(s.scale.x * f2, s.scale.y * f2, 1);
      total *= f2;
    }

    let x = -total / 2;
    let hiLeft = 0;
    let hiRight = 0;
    let hiScaleY = worldH * f2;
    for (const { p, s } of sprites) {
      const w = s.scale.x;
      s.position.set(x + w / 2, 1.1, 0);
      if (p.isHi) {
        hiLeft = x;
        hiRight = x + w;
        hiScaleY = s.scale.y;
      }
      this.dynamic.add(s);
      x += w + gap;
    }

    // Underline the operation about to be done.
    if (f.kind === "before" && hiRight > hiLeft) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(hiRight - hiLeft, 0.05, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      );
      bar.position.set((hiLeft + hiRight) / 2, 1.1 - hiScaleY * 0.7, 0);
      this.dynamic.add(bar);
    }
  }

  /** A tight, consistently-sized text sprite (no min-width floor, unlike the shared helper). */
  private label(text: string, color: number, worldH: number): THREE.Sprite {
    const h = 64;
    const font = "bold 44px system-ui, sans-serif";
    const ctx = getMeasureCtx();
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 18;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#" + color.toString(16).padStart(6, "0");
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, w / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
    );
    sprite.scale.set(worldH * (w / h), worldH, 1);
    return sprite;
  }

  // ---- info panel --------------------------------------------------------

  private renderPanel(): void {
    const presetBtns = PRESETS.map(
      (p, i) =>
        `<button class="course-btn ghost" data-bodmas="preset:${i}"${p === this.source ? ' style="border:1px solid #58a6ff"' : ""}>${p}</button>`,
    ).join(" ");

    const ladder = (Object.keys(TIER_META) as Tier[])
      .map((t) => {
        const m = TIER_META[t];
        return `<div class="bodmas-rung" id="rung-${t}" style="display:flex;gap:10px;align-items:baseline;padding:5px 8px;border-left:3px solid ${m.hex};margin:3px 0;border-radius:4px">
          <b style="color:${m.hex};min-width:26px">${t}</b>
          <span><b>${m.label}</b> <span style="color:var(--muted);font-size:12px">— ${m.sub}</span></span>
        </div>`;
      })
      .join("");

    this.setInfo(`
      <h2>Order of Operations</h2>
      <p>When a sum mixes <code>+ − × ÷</code> and powers, the answer depends on
      <b>what you do first</b>. Everyone agrees a fixed order — <b>BODMAS</b> — so every
      calculator and person gets the same result. Work <i>down</i> the ladder, and within a
      rung go <b>left to right</b>.</p>

      <div class="course">
        <h3>The ladder (top first)</h3>
        ${ladder}
        <p class="course-hint" style="margin-top:8px">The lit rung below shows which rule
        the current step is using. Note ÷ and × share a rung (do the left-most first); so do
        + and −.</p>
      </div>

      <div class="course">
        <h3>Walk through it</h3>
        <div class="readout" id="bodmas-note">—</div>
        <div class="course-progress" id="bodmas-progress" style="margin:8px 0">—</div>
        <div class="readout" id="bodmas-trap" style="margin-bottom:8px">—</div>
        <div class="course-chapters">
          <button class="course-btn ghost" data-bodmas="prev">◀ Back</button>
          <button class="course-btn" data-bodmas="toggleplay" id="bodmas-play">▶ Auto</button>
          <button class="course-btn ghost" data-bodmas="next">Next ▶</button>
          <button class="course-btn ghost" data-bodmas="restart">⟲ Restart</button>
        </div>
      </div>

      <div class="course">
        <h3>Try an expression</h3>
        <input id="bodmas-input" type="text" value="${this.source}"
          style="width:100%;padding:8px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:15px"
          spellcheck="false" />
        <div id="bodmas-error" style="color:#ff7b72;font-size:12px;min-height:14px;margin-top:4px"></div>
        <p class="course-hint">Type digits and <code>+ − × ÷ ^ ( )</code> (also accepts * and /). Press Enter.</p>
        <div class="course-chapters" style="margin-top:6px">${presetBtns}</div>
      </div>`);

    document
      .getElementById("bodmas-input")
      ?.addEventListener("change", this.inputHandler);

    this.updatePanel();
  }

  private updatePanel(): void {
    const f = this.frames[this.idx];
    if (!f) return;

    const noteEl = document.getElementById("bodmas-note");
    if (noteEl) {
      const reason = f.tier ? ` <span style="color:${TIER_META[f.tier].hex}">(${TIER_META[f.tier].label})</span>` : "";
      noteEl.innerHTML = `<b>${f.note}</b>${f.kind === "before" ? reason : ""}`;
    }
    const progEl = document.getElementById("bodmas-progress");
    if (progEl) progEl.textContent = `Step ${this.idx} / ${this.frames.length - 1}`;

    for (const t of Object.keys(TIER_META) as Tier[]) {
      const rung = document.getElementById(`rung-${t}`);
      if (rung) {
        const on = f.tier === t;
        rung.style.opacity = on ? "1" : "0.4";
        rung.style.background = on ? "#161b22" : "transparent";
      }
    }

    const playBtn = document.getElementById("bodmas-play");
    if (playBtn) playBtn.textContent = this.playing ? "⏸ Pause" : "▶ Auto";

    const trapEl = document.getElementById("bodmas-trap");
    if (trapEl) {
      const correct = this.frames[this.frames.length - 1].tokens[0]?.v ?? NaN;
      const naive = naiveLeftToRight(this.frames[0].tokens);
      if (Number.isFinite(naive) && Math.abs(naive - correct) > 1e-9) {
        trapEl.innerHTML = `⚠️ Going blindly left → right gives <b style="color:#ff7b72">${fmt(naive)}</b>, but BODMAS gives <b style="color:#7ee787">${fmt(correct)}</b>. Order matters!`;
      } else {
        trapEl.innerHTML = `Here left → right happens to match BODMAS — but don't rely on it.`;
      }
    }
  }

  // ---- disposal ----------------------------------------------------------

  private disposeChildren(g: THREE.Group): void {
    [...g.children].forEach((c) => this.disposeObject(c));
    g.clear();
  }

  private disposeGroup(g: THREE.Group): void {
    this.disposeChildren(g);
    g.parent?.remove(g);
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => this.disposeMaterial(m));
      else if (mat) this.disposeMaterial(mat);
    });
    obj.parent?.remove(obj);
  }

  private disposeMaterial(m: THREE.Material): void {
    (m as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    m.dispose();
  }
}

// ---- pure expression logic (verified separately) -------------------------

const PREC: Record<string, number> = { "^": 3, "*": 2, "/": 2, "+": 1, "-": 1 };

function prec(op: string): number {
  return PREC[op] ?? 0;
}

function tierOf(op: string): Tier {
  if (op === "^") return "O";
  if (op === "*" || op === "/") return "DM";
  return "AS";
}

function sym(op: string): string {
  return ({ "*": "×", "/": "÷", "-": "−" } as Record<string, string>)[op] ?? op;
}

function compute(a: number, op: string, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return a / b;
    case "^": return Math.pow(a, b);
    default: return NaN;
  }
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (Number.isInteger(n)) return String(n).replace("-", "−");
  return String(Math.round(n * 1000) / 1000).replace("-", "−");
}

function tokenStr(tok: Tok): string {
  if (tok.t === "num") return fmt(tok.v ?? NaN);
  if (tok.t === "op") return sym(tok.op ?? "");
  return tok.t === "lp" ? "(" : ")";
}

function tokenize(src: string): Tok[] | null {
  const out: Tok[] = [];
  const norm: Record<string, string> = { "×": "*", "÷": "/", "−": "-" };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === "(") { out.push({ t: "lp" }); i++; continue; }
    if (c === ")") { out.push({ t: "rp" }); i++; continue; }
    const o = norm[c] ?? c;
    if ("+-*/^".includes(o)) { out.push({ t: "op", op: o }); i++; continue; }
    return null;
  }
  return out;
}

/** Structural check: balanced parens + proper operand/operator alternation. */
function validate(tokens: Tok[]): boolean {
  if (tokens.length === 0) return false;
  let depth = 0;
  let expect: "operand" | "operator" = "operand";
  let hasNum = false;
  for (const tok of tokens) {
    if (tok.t === "lp") {
      if (expect !== "operand") return false;
      depth++;
    } else if (tok.t === "num") {
      if (expect !== "operand") return false;
      hasNum = true;
      expect = "operator";
    } else if (tok.t === "rp") {
      if (expect !== "operator") return false;
      depth--;
      if (depth < 0) return false;
    } else {
      if (expect !== "operator") return false;
      expect = "operand";
    }
  }
  return depth === 0 && expect === "operator" && hasNum;
}

function findInnermostBracket(tk: Tok[]): [number, number] | null {
  let lp = -1;
  for (let i = 0; i < tk.length; i++) if (tk[i].t === "lp") lp = i;
  if (lp < 0) return null;
  for (let i = lp + 1; i < tk.length; i++) if (tk[i].t === "rp") return [lp, i];
  return null;
}

/** Index of the operator to reduce first within (loExcl, hiExcl): highest rank, left-most. */
function findOp(tk: Tok[], loExcl: number, hiExcl: number): number {
  let best = -1;
  let bestPrec = 0;
  for (let i = loExcl + 1; i < hiExcl; i++) {
    if (tk[i].t === "op") {
      const p = prec(tk[i].op ?? "");
      if (p > bestPrec) { bestPrec = p; best = i; }
    }
  }
  return best;
}

function clone(tk: Tok[]): Tok[] {
  return tk.map((t) => ({ ...t }));
}

function generateFrames(t0: Tok[]): Frame[] {
  const frames: Frame[] = [
    { tokens: clone(t0), hi: null, note: "Read the whole expression first.", tier: null, kind: "plain" },
  ];
  let cur = clone(t0);
  let guard = 0;
  while (cur.length > 1 && guard++ < 300) {
    const br = findInnermostBracket(cur);
    let opIdx: number;
    let inBracket = false;
    if (br) {
      const [lp, rp] = br;
      inBracket = true;
      opIdx = findOp(cur, lp, rp);
      if (opIdx < 0) {
        // Bracket contains a single number now — drop it.
        const num = cur[lp + 1];
        frames.push({ tokens: clone(cur), hi: [lp, rp], note: `( ${fmt(num.v ?? NaN)} ) — brackets done, remove them.`, tier: "B", kind: "before" });
        cur = cur.slice(0, lp).concat([num]).concat(cur.slice(rp + 1));
        frames.push({ tokens: clone(cur), hi: [lp, lp], note: `Brackets gone → ${fmt(num.v ?? NaN)}.`, tier: "B", kind: "after" });
        continue;
      }
    } else {
      opIdx = findOp(cur, -1, cur.length);
    }
    const a = cur[opIdx - 1].v ?? NaN;
    const op = cur[opIdx].op ?? "";
    const b = cur[opIdx + 1].v ?? NaN;
    const r = compute(a, op, b);
    const tier = tierOf(op);
    const base = `${fmt(a)} ${sym(op)} ${fmt(b)} = ${fmt(r)}`;
    const note = inBracket ? `Inside ( ): ${base}` : base;
    frames.push({ tokens: clone(cur), hi: [opIdx - 1, opIdx + 1], note, tier, kind: "before" });
    cur = cur.slice(0, opIdx - 1).concat([{ t: "num", v: r }]).concat(cur.slice(opIdx + 2));
    frames.push({ tokens: clone(cur), hi: [opIdx - 1, opIdx - 1], note, tier, kind: "after" });
  }
  frames.push({ tokens: clone(cur), hi: [0, 0], note: `Done — the answer is ${fmt(cur[0]?.v ?? NaN)}.`, tier: null, kind: "plain" });
  return frames;
}

/** The common mistake: fold strictly left-to-right, ignoring precedence and brackets. */
function naiveLeftToRight(tokens: Tok[]): number {
  const flat = tokens.filter((t) => t.t === "num" || t.t === "op");
  if (flat.length === 0 || flat[0].t !== "num") return NaN;
  let acc = flat[0].v ?? NaN;
  for (let i = 1; i + 1 < flat.length; i += 2) {
    if (flat[i].t !== "op" || flat[i + 1].t !== "num") return NaN;
    acc = compute(acc, flat[i].op ?? "", flat[i + 1].v ?? NaN);
  }
  return acc;
}

function hexNum(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

let measureCtx: CanvasRenderingContext2D | undefined;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")!;
  return measureCtx;
}
