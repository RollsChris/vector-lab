import { RH_EVIDENCE_CAVEAT } from "../status";
import { hardyZ, sampleHardyZ, signChanges } from "./hardyZ";
import {
  FIRST_CRITICAL_LINE_ZEROS,
  ZERO_DATA_SOURCE,
  zerosUpTo,
  type PublishedZero,
} from "./zeros";

export interface ExperimentsHandles {
  stage: HTMLElement;
  panel: HTMLElement;
}

export interface ExperimentControls {
  tMax: number;
  samples: number;
  terms: number;
  zeroCount: number;
}

/** Cached numerical sample used for readout + canvas; invalid when controls change. */
export interface ExperimentSample {
  key: string;
  path: readonly { t: number; z: number }[];
  changes: readonly { tLeft: number; tRight: number }[];
  published: readonly PublishedZero[];
  probe: PublishedZero;
  atProbe: { z: number; imagResidual: number };
}

const T_MAX_OPTIONS = [20, 30, 40, 50] as const;
const SAMPLE_OPTIONS = [120, 200, 320] as const;
const TERM_OPTIONS = [1500, 2500, 4000] as const;
const ZERO_OPTIONS = [3, 5, 8, 10] as const;

export function experimentControlsKey(controls: ExperimentControls): string {
  return `${controls.tMax}|${controls.samples}|${controls.terms}|${controls.zeroCount}`;
}

/** Pure numerical sample for the workbench — call only when math controls change. */
export function computeExperimentSample(controls: ExperimentControls): ExperimentSample {
  const { tMax, samples, terms, zeroCount } = controls;
  const path = sampleHardyZ(0, tMax, samples, terms);
  const changes = signChanges(path);
  const published = zerosUpTo(tMax, zeroCount);
  const probe = published[0] ?? FIRST_CRITICAL_LINE_ZEROS[0]!;
  const atProbe = hardyZ(probe.t, terms);
  return {
    key: experimentControlsKey(controls),
    path,
    changes,
    published,
    probe,
    atProbe: { z: atProbe.z, imagResidual: atProbe.imagResidual },
  };
}

/**
 * Bounded Hardy Z workbench: slider/dropdown controls only, published zero markers,
 * and a permanent RH evidence caveat.
 */
export class ExperimentsView {
  private readonly root = document.createElement("div");
  private readonly panelRoot = document.createElement("div");
  private readonly canvas = document.createElement("canvas");
  private readonly readout = document.createElement("div");
  private readonly zeroList = document.createElement("ol");
  private controls: ExperimentControls = { tMax: 40, samples: 200, terms: 2500, zeroCount: 5 };
  private sample: ExperimentSample | null = null;
  private ro: ResizeObserver | null = null;
  private mounted = false;

  constructor(private readonly hosts: ExperimentsHandles) {
    this.root.className = "inv-experiments-stage";
    this.canvas.className = "inv-experiments-canvas";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", "Approximate Hardy Z function with published zero markers");
    this.root.append(this.canvas);

    this.panelRoot.className = "inv-experiments-panel";
  }

  get isMounted(): boolean {
    return this.mounted;
  }

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    this.hosts.stage.replaceChildren(this.root);
    this.hosts.panel.replaceChildren(this.panelRoot);
    this.renderPanel();
    this.refreshMath();
    this.ro = new ResizeObserver(() => this.redrawFromCache());
    this.ro.observe(this.root);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.ro?.disconnect();
    this.ro = null;
    this.sample = null;
    this.hosts.stage.replaceChildren();
    this.hosts.panel.replaceChildren();
  }

  private renderPanel(): void {
    this.panelRoot.replaceChildren();

    const caveat = document.createElement("p");
    caveat.className = "inv-caveat";
    caveat.dataset.testid = "rh-evidence-caveat";
    caveat.textContent = RH_EVIDENCE_CAVEAT;
    this.panelRoot.append(caveat);

    const heading = document.createElement("h2");
    heading.textContent = "Experiments · Hardy Z(t)";
    this.panelRoot.append(heading);

    const intro = document.createElement("p");
    intro.innerHTML =
      "Plot a <b>truncated</b> Hardy <span class=\"math\">Z(t)</span> on a bounded window and compare " +
      "sign changes with <b>published</b> critical-line zeros. Controls are sliders and dropdowns only — " +
      "no free-form formulas. Every number here is finite numerical evidence.";
    this.panelRoot.append(intro);

    const controls = document.createElement("div");
    controls.className = "inv-exp-controls";
    controls.append(
      this.selectControl("Window t ∈ [0, T]", "tMax", T_MAX_OPTIONS, this.controls.tMax, (v) => {
        this.controls.tMax = v;
      }),
      this.selectControl("Samples", "samples", SAMPLE_OPTIONS, this.controls.samples, (v) => {
        this.controls.samples = v;
      }),
      this.selectControl("η-series terms", "terms", TERM_OPTIONS, this.controls.terms, (v) => {
        this.controls.terms = v;
      }),
      this.selectControl("Published zeros shown", "zeroCount", ZERO_OPTIONS, this.controls.zeroCount, (v) => {
        this.controls.zeroCount = v;
      }),
    );
    this.panelRoot.append(controls);

    this.readout.className = "readout inv-exp-readout";
    this.panelRoot.append(this.readout);

    const source = document.createElement("section");
    source.className = "inv-exp-source";
    source.innerHTML =
      `<h3>Zero data source</h3>` +
      `<p>${ZERO_DATA_SOURCE.label}</p>` +
      `<ul>${ZERO_DATA_SOURCE.references.map((r) => `<li>${r}</li>`).join("")}</ul>` +
      `<p class="inv-exp-note">Zeros are loaded as published constants — this app does not invent zero values.</p>`;
    this.panelRoot.append(source);

    const zerosHeading = document.createElement("h3");
    zerosHeading.textContent = "Published zeros in window";
    this.panelRoot.append(zerosHeading);
    this.zeroList.className = "inv-exp-zero-list";
    this.panelRoot.append(this.zeroList);

    const method = document.createElement("section");
    method.innerHTML =
      `<h3>Method (bounded)</h3>` +
      `<ul>` +
      `<li><b>Z(t)</b> ≈ e<sup>iθ(t)</sup> ζ(½ + it)</li>` +
      `<li>ζ via truncated Dirichlet η series (Re s &gt; 0)</li>` +
      `<li>θ via Stirling log-Γ with upward recurrence</li>` +
      `<li>Sign changes are numerical; residual Im(e<sup>iθ</sup>ζ) is shown as a health check</li>` +
      `</ul>`;
    this.panelRoot.append(method);
  }

  private selectControl(
    label: string,
    name: string,
    options: readonly number[],
    value: number,
    apply: (v: number) => void,
  ): HTMLElement {
    const wrap = document.createElement("label");
    wrap.className = "inv-exp-control";
    wrap.htmlFor = `inv-exp-${name}`;
    const title = document.createElement("span");
    title.textContent = label;
    const select = document.createElement("select");
    select.id = `inv-exp-${name}`;
    select.name = name;
    for (const opt of options) {
      const option = document.createElement("option");
      option.value = String(opt);
      option.textContent = String(opt);
      if (opt === value) option.selected = true;
      select.append(option);
    }
    select.addEventListener("change", () => {
      apply(Number(select.value));
      this.refreshMath();
    });
    wrap.append(title, select);
    return wrap;
  }

  /** Recompute numerical sample when math controls change, then paint. */
  private refreshMath(): void {
    if (!this.mounted) return;
    this.sample = computeExperimentSample(this.controls);
    this.applySampleToDom(this.sample);
    this.drawCanvas(this.sample.path, this.sample.published);
  }

  /** Resize path: redraw canvas from cached sample; do not recompute Hardy Z. */
  private redrawFromCache(): void {
    if (!this.mounted) return;
    const sample = this.sample ?? computeExperimentSample(this.controls);
    if (!this.sample) this.sample = sample;
    this.drawCanvas(sample.path, sample.published);
  }

  private applySampleToDom(sample: ExperimentSample): void {
    const { path, changes, published, probe, atProbe } = sample;
    this.readout.innerHTML =
      `<div><span>Approx Z samples</span><b>${path.length}</b></div>` +
      `<div><span>Sign changes detected</span><b>${changes.length}</b></div>` +
      `<div><span>Published zeros in window</span><b>${published.length}</b></div>` +
      `<div><span>Ẑ(${probe.t.toFixed(3)}) residual Im</span><b>${atProbe.imagResidual.toExponential(2)}</b></div>` +
      `<div><span>Label</span><b>finite numerical evidence</b></div>`;

    this.zeroList.replaceChildren();
    for (const z of published) {
      const li = document.createElement("li");
      const nearest = changes.find((c) => z.t >= c.tLeft && z.t <= c.tRight);
      li.innerHTML =
        `<b>#${z.index}</b> t = ${z.t.toFixed(6)}` +
        (nearest
          ? ` · sign change bracket [${nearest.tLeft.toFixed(3)}, ${nearest.tRight.toFixed(3)}]`
          : ` · no sample bracket at this resolution`);
      this.zeroList.append(li);
    }
  }

  private drawCanvas(
    path: readonly { t: number; z: number }[],
    zeros: readonly { index: number; t: number }[],
  ): void {
    const rect = this.root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const ctx = this.canvas.getContext("2d");
    if (!ctx || path.length === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    const padL = 48;
    const padR = 16;
    const padT = 28;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let zMin = Infinity;
    let zMax = -Infinity;
    for (const p of path) {
      zMin = Math.min(zMin, p.z);
      zMax = Math.max(zMax, p.z);
    }
    if (!(zMax > zMin)) {
      zMin = -1;
      zMax = 1;
    }
    const zPad = 0.08 * (zMax - zMin);
    zMin -= zPad;
    zMax += zPad;

    const tMin = path[0]!.t;
    const tMax = path[path.length - 1]!.t;
    const xOf = (t: number) => padL + ((t - tMin) / (tMax - tMin || 1)) * plotW;
    const yOf = (z: number) => padT + ((zMax - z) / (zMax - zMin || 1)) * plotH;

    // Grid
    ctx.strokeStyle = "#21262d";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // Zero axis
    ctx.strokeStyle = "#30363d";
    ctx.beginPath();
    ctx.moveTo(padL, yOf(0));
    ctx.lineTo(padL + plotW, yOf(0));
    ctx.stroke();

    // Published zero markers
    for (const z of zeros) {
      const x = xOf(z.t);
      ctx.strokeStyle = "#f2cc6088";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#f2cc60";
      ctx.font = "11px system-ui,sans-serif";
      ctx.fillText(`ρ${z.index}`, x + 3, padT + 12);
    }

    // Z path
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    path.forEach((p, i) => {
      const x = xOf(p.t);
      const y = yOf(p.z);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#8b949e";
    ctx.font = "12px system-ui,sans-serif";
    ctx.fillText("t", padL + plotW - 10, padT + plotH + 28);
    ctx.fillText("Ẑ(t)", 8, padT + 10);
    ctx.fillText("0", 8, yOf(0) + 4);
    ctx.fillText(tMin.toFixed(0), padL, padT + plotH + 28);
    ctx.fillText(tMax.toFixed(0), padL + plotW - 12, padT + plotH + 28);

    ctx.fillStyle = "#8b949e";
    ctx.font = "11px system-ui,sans-serif";
    ctx.fillText("Approximate Hardy Z · published zeros marked · numerical evidence only", padL, 16);
  }
}
