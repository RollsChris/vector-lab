import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  autocorrelation,
  ensembleMean,
  poissonCountPath,
  simulateAr1,
  simulateBrownianMotion,
  simulateRandomWalk,
} from "../math/stochastic";
import { textSprite, tip } from "./helpers";
import { STOCHASTIC_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("stochastic-processes", STOCHASTIC_DERIVATIONS);

type ChapterId =
  | "process"
  | "classification"
  | "paths"
  | "random-walk"
  | "poisson"
  | "stationarity"
  | "brownian"
  | "toolkit";

interface Chapter {
  id: ChapterId;
  code: string;
  title: string;
  objective: string;
}

interface QuickCheck {
  question: string;
  options: readonly string[];
  correct: number;
  explanation: string;
}

const CHAPTERS: readonly Chapter[] = [
  {
    id: "process",
    code: "S.1",
    title: "Randomness through time",
    objective: "Recognise a stochastic process as a whole family of related random variables.",
  },
  {
    id: "classification",
    code: "S.2",
    title: "Time and state spaces",
    objective: "Classify processes by whether time and possible states are discrete or continuous.",
  },
  {
    id: "paths",
    code: "S.3",
    title: "Paths and ensembles",
    objective: "Separate one realised history from the distribution of all histories the model could produce.",
  },
  {
    id: "random-walk",
    code: "S.4",
    title: "Random walks",
    objective: "Build a process from independent increments and connect drift, variance, Markov behaviour, and martingales.",
  },
  {
    id: "poisson",
    code: "S.5",
    title: "Poisson processes",
    objective: "Model random event arrivals in continuous time using rates, counts, and waiting times.",
  },
  {
    id: "stationarity",
    code: "S.6",
    title: "Dependence and stationarity",
    objective: "Measure serial dependence and understand mean reversion through a stationary AR(1) process.",
  },
  {
    id: "brownian",
    code: "S.7",
    title: "Brownian motion",
    objective: "Move from discrete random walks to continuous paths, diffusion, and stochastic differential equations.",
  },
  {
    id: "toolkit",
    code: "S.8",
    title: "Modelling toolkit",
    objective: "Choose processes by mechanism, assumptions, time scale, observability, and the decision being supported.",
  },
] as const;

const QUICK_CHECKS: Record<ChapterId, QuickCheck> = {
  process: {
    question: "What makes {Xₜ} a stochastic process rather than one random variable?",
    options: [
      "It has a larger variance",
      "It contains a random variable for each time or index",
      "It must be continuous",
      "It always has independent values",
    ],
    correct: 1,
    explanation: "A process is an indexed family of random variables, so it describes how uncertainty develops across time, space, or another index.",
  },
  classification: {
    question: "How is a standard Poisson counting process classified?",
    options: [
      "Discrete time, discrete state",
      "Discrete time, continuous state",
      "Continuous time, discrete state",
      "Continuous time, continuous state",
    ],
    correct: 2,
    explanation: "Events may arrive at any continuous time, while the count remains 0, 1, 2, and so on.",
  },
  paths: {
    question: "What is an ensemble mean at time t?",
    options: [
      "The average over many possible paths at the same time",
      "The average of one path over all time",
      "The largest observed path",
      "The probability of one exact path",
    ],
    correct: 0,
    explanation: "An ensemble mean averages across repeated possible realisations at a fixed time.",
  },
  "random-walk": {
    question: "What is the expected position of a fair ±1 random walk after n steps?",
    options: ["-n", "0", "√n", "n"],
    correct: 1,
    explanation: "Each increment has mean zero, so linearity of expectation gives E[Xₙ] = 0.",
  },
  poisson: {
    question: "A Poisson process has rate λ=3 per hour. What is E[N(2 hours)]?",
    options: ["1.5", "3", "5", "6"],
    correct: 3,
    explanation: "The expected count is rate × time: λt = 3 × 2 = 6.",
  },
  stationarity: {
    question: "When is the AR(1) process Xₜ=μ+φ(Xₜ₋₁-μ)+εₜ mean-reverting and stationary?",
    options: ["φ=1", "|φ|<1", "φ>1", "Only when εₜ=0"],
    correct: 1,
    explanation: "When |φ|<1, shocks decay geometrically instead of persisting or exploding.",
  },
  brownian: {
    question: "For standard Brownian motion, what is Var(Wₜ₊ₕ-Wₜ)?",
    options: ["0", "t", "h", "h²"],
    correct: 2,
    explanation: "A Brownian increment over length h is normal with mean 0 and variance h.",
  },
  toolkit: {
    question: "Which basic process is the natural first model for independent arrivals at a stable average rate?",
    options: ["Poisson process", "Brownian motion", "Deterministic trend", "Fourier series"],
    correct: 0,
    explanation: "The Poisson process starts from independent increments and a constant event rate; real data should then be checked for clustering or changing rates.",
  },
};

const COLORS = [
  0x79c0ff,
  0xffa657,
  0x7ee787,
  0xd2a8ff,
  0xff7b72,
  0x39c5cf,
  0xffd166,
  0xa5d6ff,
  0xf778ba,
  0x8b949e,
] as const;

export class StochasticProcessesLesson implements Lesson {
  readonly id = "stochastic-processes";
  readonly title = "Stochastic Processes";
  readonly blurb = "Random paths, arrivals, memory, diffusion and model choice";
  readonly category = "Foundations" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["markov-chains"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private chapterId: ChapterId = "process";
  private params = {
    steps: 80,
    paths: 6,
    upProbability: 0.5,
    eventRate: 1.2,
    persistence: 0.8,
    drift: 0,
    volatility: 0.7,
    seed: 11,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.6, 11.5), new THREE.Vector3(0, 0.6, 0));
    this.buildControls();
    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private get chapter(): Chapter {
    return CHAPTERS.find((chapter) => chapter.id === this.chapterId) ?? CHAPTERS[0];
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "steps", 20, 160, 10).name("Time steps"),
      "Resolution and horizon for the simulated paths.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "paths", 1, 10, 1).name("Sample paths"),
      "The number of independent possible histories drawn together.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "upProbability", 0.1, 0.9, 0.05).name("Walk P(up)"),
      "Controls the direction bias of the random walk.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "eventRate", 0.2, 3, 0.1).name("Poisson rate λ"),
      "Expected event arrivals per unit time.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "persistence", -0.9, 0.95, 0.05).name("AR persistence φ"),
      "How strongly the next value remembers the previous deviation from the mean.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "drift", -1, 1, 0.1).name("Brownian drift"),
      "The deterministic trend per unit time added to Brownian motion.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "volatility", 0, 2, 0.1).name("Noise / volatility"),
      "The scale of random shocks in AR(1) and Brownian motion.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "seed", 1, 100, 1).name("Random seed"),
      "Change the paths while keeping each ensemble reproducible.",
    ).onChange(() => this.refresh());
  }

  private refresh(): void {
    this.params.steps = Math.round(this.params.steps);
    this.params.paths = Math.round(this.params.paths);
    this.params.seed = Math.round(this.params.seed);
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.rebuildScene();
    this.renderPanel();
  }

  private rebuildScene(): void {
    this.disposeGroup();
    switch (this.chapterId) {
      case "process":
        this.drawPathChart(this.randomWalks(), "One model, many possible futures");
        break;
      case "classification":
        this.drawClassificationMap();
        break;
      case "paths":
        this.drawPathChart(this.randomWalks(), "Sample paths and their ensemble mean");
        break;
      case "random-walk":
        this.drawPathChart(this.randomWalks(), `Random walk with P(up)=${this.params.upProbability.toFixed(2)}`);
        break;
      case "poisson":
        this.drawPathChart(this.poissonPaths(), `Poisson counts with rate λ=${this.params.eventRate.toFixed(1)}`);
        break;
      case "stationarity":
        this.drawPathChart(this.ar1Paths(), `Mean-reverting AR(1) with φ=${this.params.persistence.toFixed(2)}`);
        break;
      case "brownian":
        this.drawPathChart(this.brownianPaths(), "Brownian motion with drift and volatility");
        break;
      case "toolkit":
        this.drawProcessGallery();
        break;
    }
  }

  private renderPanel(): void {
    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    const progress = ((chapterIndex + 1) / CHAPTERS.length) * 100;
    this.setInfo(`
      <h2>Stochastic Processes</h2>
      <p>A stochastic process is probability stretched across time or space. Instead of asking
      for one uncertain value, it models an entire evolving sequence, path, field, count, or state.</p>
      <div class="course">
        <div class="glsl-chips" id="stochastic-chapters">
          ${CHAPTERS.map((chapter) => `
            <button class="glsl-chip ${chapter.id === this.chapterId ? "active" : ""}"
              data-stochastic-chapter="${chapter.id}"
              aria-pressed="${chapter.id === this.chapterId}">
              ${chapter.code} ${chapter.title}
            </button>`).join("")}
        </div>
      </div>
      <div class="foundation-progress" aria-label="Stochastic-process course progress">
        <div><b>${this.chapter.code} · ${this.chapter.title}</b><span>Chapter ${chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="foundation-progress-track"><i style="width:${progress}%"></i></div>
        <p>${this.chapter.objective}</p>
      </div>
      <div id="stochastic-body">${this.chapterBody()}${this.quickCheck()}</div>
      <div class="course-nav">
        <button class="course-btn ghost" data-stochastic-nav="previous" ${chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-stochastic-nav="next" ${chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `);
    this.bindPanel();
  }

  private bindPanel(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-stochastic-chapter]").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectChapter((button.dataset.stochasticChapter ?? "process") as ChapterId);
      });
    });

    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    document.querySelectorAll<HTMLButtonElement>("[data-stochastic-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.stochasticNav === "previous" ? -1 : 1;
        const target = CHAPTERS[chapterIndex + delta];
        if (target) this.selectChapter(target.id);
      });
    });

    const check = QUICK_CHECKS[this.chapterId];
    document.querySelectorAll<HTMLButtonElement>("[data-stochastic-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.stochasticAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-stochastic-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("stochastic-check-feedback");
        if (feedback) {
          feedback.className = `foundation-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(id: ChapterId): void {
    this.chapterId = CHAPTERS.some((chapter) => chapter.id === id) ? id : "process";
    this.rebuildScene();
    this.renderPanel();
    document.querySelector(".foundation-progress")?.scrollIntoView({ block: "nearest" });
  }

  private quickCheck(): string {
    const check = QUICK_CHECKS[this.chapterId];
    return `
      <div class="course foundation-check">
        <h3>Quick check</h3>
        <p>${check.question}</p>
        <div class="foundation-check-options">
          ${check.options.map((option, index) => `
            <button class="glsl-chip" data-stochastic-answer="${index}" aria-pressed="false">${option}</button>
          `).join("")}
        </div>
        <div id="stochastic-check-feedback" class="foundation-check-feedback" aria-live="polite">
          Choose an answer, then use the explanation to check your reasoning.
        </div>
      </div>`;
  }

  private chapterBody(): string {
    switch (this.chapterId) {
      case "process":
        return this.processBody();
      case "classification":
        return this.classificationBody();
      case "paths":
        return this.pathsBody();
      case "random-walk":
        return this.randomWalkBody();
      case "poisson":
        return this.poissonBody();
      case "stationarity":
        return this.stationarityBody();
      case "brownian":
        return this.brownianBody();
      case "toolkit":
        return this.toolkitBody();
    }
  }

  private processBody(): string {
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">From one random variable to an evolving system</div>
        <p>A random variable <code>X</code> gives one uncertain numerical result. A
        <b>stochastic process</b> <code>{Xₜ : t ∈ T}</code> gives a random variable for every
        index <code>t</code>. The index is often time, but it can also be distance, position,
        wavelength, or another ordered dimension.</p>
        <div class="formula" data-derivation-exempt="Notation defining a stochastic process and sample path">
          <div class="formula-label">Process notation</div>
          <div class="formula-body">outcome ω → sample path x(t,ω) · fixed t → random variable Xₜ</div>
          <div class="formula-note">One realised path is data. The process is the probability model for all paths that could have occurred.</div>
        </div>
        <table class="cmp-table">
          <thead><tr><th>Object</th><th>Question</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td>Random variable</td><td>What value occurs?</td><td>Tomorrow's demand</td></tr>
            <tr><td>Stochastic process</td><td>How does uncertainty evolve?</td><td>Demand every hour</td></tr>
            <tr><td>Sample path</td><td>What actually happened once?</td><td>One recorded demand trace</td></tr>
          </tbody>
        </table>
        <p class="example"><b>Applications:</b> equipment condition, queue length, stock level,
        rainfall, population, network traffic, sound, temperature, and asset prices are processes
        because their values evolve and remain uncertain.</p>
      </div>`;
  }

  private classificationBody(): string {
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Two axes organise the subject</div>
        <p>The <b>index set</b> says when the process is observed. The <b>state space</b> says
        which values it may take. Discrete means countable; continuous means values fill an interval.</p>
        <table class="cmp-table">
          <thead><tr><th>Time</th><th>State</th><th>Example</th><th>Typical use</th></tr></thead>
          <tbody>
            <tr><td>Discrete</td><td>Discrete</td><td>Markov chain</td><td>Machine modes each minute</td></tr>
            <tr><td>Discrete</td><td>Continuous</td><td>AR(1), random walk</td><td>Daily demand or signal samples</td></tr>
            <tr><td>Continuous</td><td>Discrete</td><td>Poisson count</td><td>Arrivals and failures</td></tr>
            <tr><td>Continuous</td><td>Continuous</td><td>Brownian motion</td><td>Diffusion and noisy trajectories</td></tr>
          </tbody>
        </table>
        <p>Classification narrows the mathematics, but mechanism matters more than labels.
        Event clustering breaks a constant-rate Poisson model; changing volatility breaks a basic
        Brownian model; duration dependence breaks a memoryless Markov model.</p>
        <p class="example"><b>Applied example:</b> count calls continuously with a Poisson process,
        but model the measured call duration itself with a continuous-state process.</p>
      </div>`;
  }

  private pathsBody(): string {
    const paths = this.randomWalks();
    const finalValues = paths.map((path) => path[path.length - 1]);
    const finalMean = finalValues.reduce((sum, value) => sum + value, 0) / finalValues.length;
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">One history is not the distribution</div>
        <p>Each coloured line is one <b>sample path</b>. Together they form an <b>ensemble</b>.
        At a fixed time, the paths create a probability distribution. Across time, the process
        has a mean function and a covariance structure.</p>
        <div class="formula">
          <div class="formula-label">First two process summaries</div>
          <div class="formula-body">m(t)=E[Xₜ] · C(s,t)=E[(Xₛ-m(s))(Xₜ-m(t))]</div>
          <div class="formula-note">Variance is C(t,t). Covariance across different times records memory and shared movement.</div>
        </div>
        <div class="readout">
          <div><span>Paths displayed</span><b>${paths.length}</b></div>
          <div><span>Mean final position</span><b>${finalMean.toFixed(2)}</b></div>
          <div><span>Theoretical final mean</span><b>${((2 * this.params.upProbability - 1) * this.params.steps).toFixed(2)}</b></div>
        </div>
        <p>A time average follows one path for a long period; an ensemble average compares many
        paths at one time. They coincide only under additional conditions such as ergodicity.</p>
        <p class="example"><b>Applied example:</b> one production line gives a time series; many
        comparable lines or simulations provide an ensemble for uncertainty bands.</p>
      </div>`;
  }

  private randomWalkBody(): string {
    const meanIncrement = 2 * this.params.upProbability - 1;
    const varianceIncrement = 1 - meanIncrement ** 2;
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Build complexity by adding simple shocks</div>
        <p>A simple random walk starts at zero and adds independent increments
        <code>ξₜ ∈ {-1,+1}</code>. It remembers its current position but does not need the whole
        route, so it is Markov. With equal up/down probabilities it is also a martingale:
        tomorrow's conditional expectation equals today's value.</p>
        <div class="formula" data-derivation="stochastic-random-walk">
          <div class="formula-label">Biased random walk</div>
          <div class="formula-body">Xₙ=Σξᵢ · E[Xₙ]=n(2p-1) · Var(Xₙ)=4np(1-p)</div>
          <div class="formula-note">Drift grows like n, while typical random spread grows like √n.</div>
        </div>
        <div class="readout">
          <div><span>P(up)</span><b>${this.params.upProbability.toFixed(2)}</b></div>
          <div><span>Mean increment</span><b>${meanIncrement.toFixed(2)}</b></div>
          <div><span>Increment variance</span><b>${varianceIncrement.toFixed(3)}</b></div>
          <div><span>Expected position after ${this.params.steps}</span><b>${(this.params.steps * meanIncrement).toFixed(2)}</b></div>
        </div>
        <h3>Discovery</h3>
        <p>Karl Pearson coined “random walk” in 1905 while asking about a direction-changing
        traveller. Related ideas already appeared in gambling and diffusion, and the limiting
        theory later connected random walks to Brownian motion.</p>
        <p class="example"><b>Applications:</b> inventory changes, gambler's ruin, allele
        frequencies, search paths, cumulative forecast error, and diffusion on networks.</p>
      </div>`;
  }

  private poissonBody(): string {
    const duration = 10;
    const paths = this.poissonPaths();
    const finalMean = paths.reduce((sum, path) => sum + path[path.length - 1], 0) / paths.length;
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Count random arrivals</div>
        <p>A homogeneous <b>Poisson process</b> <code>N(t)</code> counts events that arrive
        independently at a constant average rate <code>λ</code>. Counts never decrease, start at
        zero, and increments over disjoint time intervals are independent.</p>
        <div class="formula" data-derivation="stochastic-poisson">
          <div class="formula-label">Counts and waiting times</div>
          <div class="formula-body">N(t) ~ Poisson(λt) · E[N(t)]=Var(N(t))=λt · T ~ Exponential(λ)</div>
          <div class="formula-note">The mean waiting time to the next event is 1/λ. Exponential waiting is memoryless.</div>
        </div>
        <div class="readout">
          <div><span>Rate λ</span><b>${this.params.eventRate.toFixed(1)} per unit time</b></div>
          <div><span>Expected count by t=${duration}</span><b>${(this.params.eventRate * duration).toFixed(1)}</b></div>
          <div><span>Displayed ensemble mean</span><b>${finalMean.toFixed(2)}</b></div>
          <div><span>Expected waiting time</span><b>${(1 / this.params.eventRate).toFixed(2)}</b></div>
        </div>
        <p>Siméon Denis Poisson published the count distribution in 1837. Later process theory
        connected the distribution to arrivals through time.</p>
        <p class="example"><b>Applications:</b> calls, orders, particle detections, faults, claims,
        packet arrivals, and radioactive decays. Use non-homogeneous or clustered processes when
        the rate changes or events trigger more events.</p>
      </div>`;
  }

  private stationarityBody(): string {
    const path = this.ar1Paths()[0];
    const lagOne = autocorrelation(path, 1);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Describe memory without tracking every past value</div>
        <p>A process is <b>strictly stationary</b> when shifting every time index leaves all joint
        distributions unchanged. Weak stationarity requires a constant mean and covariance that
        depends only on lag. Stationarity makes historical patterns reusable, but many real systems
        contain trends, seasonality, interventions, or regime changes.</p>
        <div class="formula" data-derivation="stochastic-ar1-correlation">
          <div class="formula-label">Mean-reverting AR(1)</div>
          <div class="formula-body">Xₜ=μ+φ(Xₜ₋₁-μ)+εₜ · Corr(Xₜ,Xₜ₋ₖ)=φᵏ</div>
          <div class="formula-note">For |φ|<1, a shock decays toward μ. Negative φ alternates around the mean.</div>
        </div>
        <div class="readout">
          <div><span>Persistence φ</span><b>${this.params.persistence.toFixed(2)}</b></div>
          <div><span>Theoretical lag-1 correlation</span><b>${this.params.persistence.toFixed(2)}</b></div>
          <div><span>Displayed path lag-1 estimate</span><b>${lagOne.toFixed(3)}</b></div>
          <div><span>Long-run mean μ</span><b>0</b></div>
        </div>
        <p><b>Ergodicity</b> is stronger than stationarity: it allows long-run averages from one
        sufficiently long path to estimate ensemble quantities. A stationary but non-ergodic
        process can still hide path-specific permanent differences.</p>
        <p class="example"><b>Applications:</b> demand deviations, process-control residuals,
        temperature anomalies, interest-rate spreads, and signals after trend/seasonality removal.</p>
      </div>`;
  }

  private brownianBody(): string {
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">The continuous limit of many tiny random shocks</div>
        <p>Standard <b>Brownian motion</b> <code>W(t)</code> starts at zero, has continuous paths,
        independent increments, and <code>W(t+h)-W(t) ~ N(0,h)</code>. Its paths are continuous
        but almost surely nowhere differentiable: zooming in reveals fresh roughness.</p>
        <div class="formula">
          <div class="formula-label">Brownian model with drift</div>
          <div class="formula-body">X(t)=μt+σW(t) · dX=μdt+σdW</div>
          <div class="formula-note">The stochastic differential equation separates deterministic drift from random diffusion.</div>
        </div>
        <div class="readout">
          <div><span>Drift μ</span><b>${this.params.drift.toFixed(1)}</b></div>
          <div><span>Volatility σ</span><b>${this.params.volatility.toFixed(1)}</b></div>
          <div><span>E[X(1)]</span><b>${this.params.drift.toFixed(1)}</b></div>
          <div><span>SD[X(1)]</span><b>${this.params.volatility.toFixed(1)}</b></div>
        </div>
        <h3>Discovery and development</h3>
        <p>Robert Brown documented the irregular motion of particles in 1827. Louis Bachelier used
        a Brownian-style model for prices in 1900. In 1905, Einstein and Smoluchowski explained the
        physical diffusion mechanism and linked displacement to molecular motion. Norbert Wiener
        gave the process a rigorous mathematical construction in 1923.</p>
        <p class="example"><b>Applications:</b> particle diffusion, noisy control systems,
        continuous-time finance, filtering, heat flow, and stochastic differential equations.
        Basic Brownian motion misses jumps, changing volatility, bounds, and mean reversion.</p>
      </div>`;
  }

  private toolkitBody(): string {
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Choose a mechanism, not merely a familiar formula</div>
        <table class="cmp-table">
          <thead><tr><th>Observed mechanism</th><th>Starting model</th><th>Escalate when...</th></tr></thead>
          <tbody>
            <tr><td>Named state changes</td><td>Markov chain</td><td>Duration or hidden state matters</td></tr>
            <tr><td>Independent arrivals</td><td>Poisson process</td><td>Rate changes or events cluster</td></tr>
            <tr><td>Persistent continuous signal</td><td>AR/state-space model</td><td>Regimes or nonlinear response appear</td></tr>
            <tr><td>Accumulated tiny shocks</td><td>Brownian/SDE model</td><td>Jumps, bounds, or heavy tails matter</td></tr>
            <tr><td>Unknown smooth function</td><td>Gaussian process</td><td>Scale or non-Gaussian outcomes dominate</td></tr>
          </tbody>
        </table>
        <h3>Advanced ideas</h3>
        <ul>
          <li><b>Martingale:</b> no predictable gain remains after conditioning on current information.</li>
          <li><b>Stopping time:</b> a random decision time defined without looking into the future.</li>
          <li><b>Renewal and semi-Markov process:</b> waiting-time distributions retain duration information.</li>
          <li><b>Hidden Markov/state-space model:</b> infer an unobserved process from noisy measurements.</li>
          <li><b>Gaussian process:</b> define a distribution over functions through a mean and covariance kernel.</li>
        </ul>
        <h3>Historical synthesis</h3>
        <p>Random walks, Poisson counts, Brownian motion, and Markov chains developed from gambling,
        astronomy, physics, statistics, and finance rather than one single invention. Kolmogorov's
        1930s axioms and forward/backward equations helped unify them into modern stochastic-process
        theory.</p>
        <p class="example"><b>Modelling workflow:</b> define the state and clock, inspect paths and
        waiting times, estimate dependence, fit a simple baseline, test calibration on held-out time,
        and only then add hidden states, changing rates, jumps, or nonlinear dynamics.</p>
      </div>`;
  }

  private randomWalks(): number[][] {
    return Array.from({ length: this.params.paths }, (_, index) =>
      simulateRandomWalk(
        this.params.steps,
        this.params.upProbability,
        1,
        this.params.seed + index * 17,
      ));
  }

  private poissonPaths(): number[][] {
    return Array.from({ length: this.params.paths }, (_, index) =>
      poissonCountPath(
        this.params.steps,
        10,
        this.params.eventRate,
        this.params.seed + index * 17,
      ));
  }

  private ar1Paths(): number[][] {
    return Array.from({ length: this.params.paths }, (_, index) =>
      simulateAr1(
        this.params.steps,
        0,
        this.params.persistence,
        this.params.volatility,
        this.params.seed + index * 17,
      ));
  }

  private brownianPaths(): number[][] {
    return Array.from({ length: this.params.paths }, (_, index) =>
      simulateBrownianMotion(
        this.params.steps,
        1,
        this.params.drift,
        this.params.volatility,
        this.params.seed + index * 17,
      ));
  }

  private drawPathChart(paths: readonly (readonly number[])[], title: string): void {
    const mean = ensembleMean(paths);
    const allValues = paths.flat();
    let minimum = Math.min(...allValues, ...mean);
    let maximum = Math.max(...allValues, ...mean);
    if (minimum === maximum) {
      minimum -= 1;
      maximum += 1;
    }
    const padding = (maximum - minimum) * 0.08;
    minimum -= padding;
    maximum += padding;

    this.drawAxes(minimum, maximum);
    paths.forEach((path, index) => {
      this.group.add(this.lineForPath(path, minimum, maximum, COLORS[index % COLORS.length], 0.62));
    });
    if (paths.length > 1) {
      this.group.add(this.lineForPath(mean, minimum, maximum, 0x7ee787, 1));
    }

    const heading = textSprite(title, 0x7ee787, 0.42);
    heading.position.set(0, 4.55, 0.1);
    this.group.add(heading);
    const legend = textSprite(
      paths.length > 1 ? "coloured = sample paths · green = ensemble mean" : "one realised sample path",
      0xc9d1d9,
      0.29,
    );
    legend.position.set(0, -3.25, 0.1);
    this.group.add(legend);
  }

  private drawAxes(minimum: number, maximum: number): void {
    this.group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.8, -2.8, 0),
        new THREE.Vector3(4.8, -2.8, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x6e7681 }),
    ));
    this.group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.8, -2.8, 0),
        new THREE.Vector3(-4.8, 3.8, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x6e7681 }),
    ));

    if (minimum < 0 && maximum > 0) {
      const zeroY = this.mapY(0, minimum, maximum);
      this.group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-4.8, zeroY, -0.05),
          new THREE.Vector3(4.8, zeroY, -0.05),
        ]),
        new THREE.LineDashedMaterial({ color: 0x30363d, dashSize: 0.16, gapSize: 0.10 }),
      ));
      (this.group.children[this.group.children.length - 1] as THREE.Line).computeLineDistances();
    }

    const maxLabel = textSprite(maximum.toFixed(1), 0x8b949e, 0.25);
    maxLabel.position.set(-5.25, 3.8, 0.1);
    this.group.add(maxLabel);
    const minLabel = textSprite(minimum.toFixed(1), 0x8b949e, 0.25);
    minLabel.position.set(-5.25, -2.8, 0.1);
    this.group.add(minLabel);
    const timeLabel = textSprite("time →", 0x8b949e, 0.27);
    timeLabel.position.set(4.35, -3.0, 0.1);
    this.group.add(timeLabel);
  }

  private lineForPath(
    path: readonly number[],
    minimum: number,
    maximum: number,
    colour: number,
    opacity: number,
  ): THREE.Line {
    const points = path.map((value, index) => new THREE.Vector3(
      -4.8 + 9.6 * index / Math.max(path.length - 1, 1),
      this.mapY(value, minimum, maximum),
      0,
    ));
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: colour, transparent: opacity < 1, opacity }),
    );
  }

  private mapY(value: number, minimum: number, maximum: number): number {
    return -2.8 + (value - minimum) / (maximum - minimum) * 6.6;
  }

  private drawClassificationMap(): void {
    const cells = [
      { x: -2.55, y: 2.1, title: "Discrete time · Discrete state", model: "Markov chain", colour: COLORS[0] },
      { x: 2.55, y: 2.1, title: "Discrete time · Continuous state", model: "AR(1) / random walk", colour: COLORS[1] },
      { x: -2.55, y: -0.7, title: "Continuous time · Discrete state", model: "Poisson count", colour: COLORS[2] },
      { x: 2.55, y: -0.7, title: "Continuous time · Continuous state", model: "Brownian motion", colour: COLORS[3] },
    ];
    cells.forEach((cell) => {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(4.35, 1.75, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x18233a, emissive: 0x0b1322, roughness: 0.75 }),
      );
      card.position.set(cell.x, cell.y, 0);
      this.group.add(card);
      const title = textSprite(cell.title, cell.colour, 0.31);
      title.position.set(cell.x, cell.y + 0.28, 0.15);
      this.group.add(title);
      const model = textSprite(cell.model, 0xffffff, 0.36);
      model.position.set(cell.x, cell.y - 0.28, 0.15);
      this.group.add(model);
    });
    const heading = textSprite("Classify the clock and the possible values", 0x7ee787, 0.42);
    heading.position.set(0, 4.45, 0.1);
    this.group.add(heading);
  }

  private drawProcessGallery(): void {
    const rows = [
      { label: "Random walk", path: simulateRandomWalk(50, this.params.upProbability, 1, this.params.seed), colour: COLORS[0] },
      { label: "Poisson count", path: poissonCountPath(50, 10, this.params.eventRate, this.params.seed + 1), colour: COLORS[1] },
      { label: "AR(1)", path: simulateAr1(50, 0, this.params.persistence, this.params.volatility, this.params.seed + 2), colour: COLORS[2] },
      { label: "Brownian", path: simulateBrownianMotion(50, 1, this.params.drift, this.params.volatility, this.params.seed + 3), colour: COLORS[3] },
    ];
    rows.forEach((row, rowIndex) => {
      const minimum = Math.min(...row.path);
      const maximum = Math.max(...row.path);
      const range = maximum - minimum || 1;
      const centreY = 2.75 - rowIndex * 1.75;
      const points = row.path.map((value, index) => new THREE.Vector3(
        -3.9 + 8.2 * index / (row.path.length - 1),
        centreY - 0.55 + (value - minimum) / range * 1.1,
        0,
      ));
      this.group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: row.colour }),
      ));
      const label = textSprite(row.label, row.colour, 0.31);
      label.position.set(-4.75, centreY, 0.1);
      this.group.add(label);
    });
    const heading = textSprite("Different mechanisms produce different path signatures", 0x7ee787, 0.40);
    heading.position.set(0, 4.55, 0.1);
    this.group.add(heading);
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
