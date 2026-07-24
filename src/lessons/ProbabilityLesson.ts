import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  bayesPosterior,
  binomialProbability,
  conditionalProbability,
  expectedValue,
  normalDensity,
  variance,
} from "../math/probability";
import { textSprite, tip } from "./helpers";
import { PROBABILITY_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("probability", PROBABILITY_DERIVATIONS);

type ChapterId =
  | "foundations"
  | "rules"
  | "conditional"
  | "random-variables"
  | "binomial"
  | "continuous"
  | "sampling"
  | "bayes";

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
    id: "foundations",
    code: "P.1",
    title: "Chance and sample spaces",
    objective: "Turn uncertain experiments into outcomes, events, and probabilities from 0 to 1.",
  },
  {
    id: "rules",
    code: "P.2",
    title: "Combining events",
    objective: "Use complements, addition, and multiplication without double-counting outcomes.",
  },
  {
    id: "conditional",
    code: "P.3",
    title: "Conditional probability",
    objective: "Update the sample space when information arrives and distinguish dependence from independence.",
  },
  {
    id: "random-variables",
    code: "P.4",
    title: "Expectation and spread",
    objective: "Convert outcomes into numerical variables and summarise their centre and uncertainty.",
  },
  {
    id: "binomial",
    code: "P.5",
    title: "Discrete distributions",
    objective: "Build Bernoulli and binomial models from repeated success-or-failure trials.",
  },
  {
    id: "continuous",
    code: "P.6",
    title: "Continuous distributions",
    objective: "Read probability as area under a density curve and interpret the normal distribution.",
  },
  {
    id: "sampling",
    code: "P.7",
    title: "Samples and the CLT",
    objective: "See why frequencies stabilise and why sums and averages often become bell-shaped.",
  },
  {
    id: "bayes",
    code: "P.8",
    title: "Bayes and decisions",
    objective: "Combine prior knowledge with evidence and recognise when a richer model is required.",
  },
] as const;

const QUICK_CHECKS: Record<ChapterId, QuickCheck> = {
  foundations: {
    question: "A fair die is rolled. What is the probability of an even result?",
    options: ["1/6", "2/6", "3/6", "6/6"],
    correct: 2,
    explanation: "The favourable outcomes are 2, 4, and 6, so P(even) = 3/6 = 1/2.",
  },
  rules: {
    question: "Two fair coins are flipped. What is P(at least one head)?",
    options: ["1/4", "1/2", "3/4", "1"],
    correct: 2,
    explanation: "Use the complement: only TT has no heads, so 1 - 1/4 = 3/4.",
  },
  conditional: {
    question: "Given that a card is a face card, what is P(king)?",
    options: ["1/13", "1/4", "1/3", "4/13"],
    correct: 2,
    explanation: "The condition leaves 12 face cards, and 4 of those are kings: 4/12 = 1/3.",
  },
  "random-variables": {
    question: "What is the expected value of a fair six-sided die?",
    options: ["3", "3.5", "4", "6"],
    correct: 1,
    explanation: "(1 + 2 + 3 + 4 + 5 + 6) / 6 = 3.5. Expectation need not be a possible outcome.",
  },
  binomial: {
    question: "What is P(exactly 2 heads in 4 fair flips)?",
    options: ["4/16", "6/16", "8/16", "12/16"],
    correct: 1,
    explanation: "There are C(4,2) = 6 placements of two heads among 16 equally likely sequences.",
  },
  continuous: {
    question: "For a continuous random variable, what is P(X equals one exact value)?",
    options: ["0", "The curve height", "1/2", "1"],
    correct: 0,
    explanation: "Probability is area over an interval. A single point has zero width and therefore zero area.",
  },
  sampling: {
    question: "What does the law of large numbers predict as sample size grows?",
    options: [
      "Every observation approaches the mean",
      "The sample average tends to the expected value",
      "Randomness disappears",
      "Every histogram becomes normal",
    ],
    correct: 1,
    explanation: "Individual outcomes stay random, but their average becomes increasingly stable around the expectation.",
  },
  bayes: {
    question: "Why can false positives outnumber true positives for a rare condition?",
    options: [
      "The test must be broken",
      "Specificity is irrelevant",
      "The healthy population is much larger",
      "Bayes' rule only works for coins",
    ],
    correct: 2,
    explanation: "Even a small false-positive rate applied to a very large healthy group can exceed true positives from a tiny affected group.",
  },
};

const COLORS = {
  blue: 0x79c0ff,
  orange: 0xffa657,
  green: 0x7ee787,
  red: 0xff7b72,
  purple: 0xd2a8ff,
  muted: 0x6e7681,
};

export class ProbabilityLesson implements Lesson {
  readonly id = "probability";
  readonly title = "Probability & Distributions";
  readonly blurb = "From first chances to Bayes and the central limit theorem";
  readonly category = "Foundations" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["pascal-triangle"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private chapterId: ChapterId = "foundations";
  private params = {
    sampleSize: 500,
    successProbability: 0.5,
    trials: 5,
    mean: 0,
    standardDeviation: 1,
    seed: 7,
  };
  private randomState = 7;

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 1.2, 11), new THREE.Vector3(0, 1.2, 0));
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
      this.gui.add(this.params, "sampleSize", 50, 5000, 50).name("Sample size"),
      "How many reproducible observations the current experiment draws.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "successProbability", 0.05, 0.95, 0.05).name("Success chance p"),
      "The success probability used by the Bernoulli and binomial chapters.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "trials", 1, 8, 1).name("Trials / dice"),
      "Repeated Bernoulli trials in P.5 or dice added together in P.7.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "mean", -3, 3, 0.1).name("Normal mean μ"),
      "The centre of the normal distribution in P.6.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "standardDeviation", 0.2, 3, 0.1).name("Normal spread σ"),
      "The standard deviation of the normal distribution in P.6.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "seed", 1, 100, 1).name("Random seed"),
      "Change the sample while keeping every experiment reproducible.",
    ).onChange(() => this.refresh());
  }

  private refresh(): void {
    this.params.sampleSize = Math.round(this.params.sampleSize);
    this.params.trials = Math.round(this.params.trials);
    this.params.seed = Math.round(this.params.seed);
    this.randomState = this.params.seed;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.rebuildScene();
    this.renderPanel();
  }

  private rebuildScene(): void {
    this.disposeGroup();
    switch (this.chapterId) {
      case "foundations":
        this.drawDieExperiment();
        break;
      case "rules":
        this.drawCoinRules();
        break;
      case "conditional":
        this.drawConditionalCards();
        break;
      case "random-variables":
        this.drawExpectation();
        break;
      case "binomial":
        this.drawBinomial();
        break;
      case "continuous":
        this.drawNormal();
        break;
      case "sampling":
        this.drawDiceSums();
        break;
      case "bayes":
        this.drawBayes();
        break;
    }
  }

  private renderPanel(): void {
    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    const progress = ((chapterIndex + 1) / CHAPTERS.length) * 100;
    this.setInfo(`
      <h2>Probability & Distributions</h2>
      <p>A zero-to-hero course in reasoning under uncertainty. Start by counting outcomes,
      then build toward conditional probability, random variables, distributions, inference,
      Bayes' rule, and the central limit theorem.</p>
      <div class="course">
        <div class="glsl-chips" id="probability-chapters">
          ${CHAPTERS.map((chapter) => `
            <button class="glsl-chip ${chapter.id === this.chapterId ? "active" : ""}"
              data-probability-chapter="${chapter.id}"
              aria-pressed="${chapter.id === this.chapterId}">
              ${chapter.code} ${chapter.title}
            </button>`).join("")}
        </div>
      </div>
      <div class="foundation-progress" aria-label="Probability course progress">
        <div><b>${this.chapter.code} · ${this.chapter.title}</b><span>Chapter ${chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="foundation-progress-track"><i style="width:${progress}%"></i></div>
        <p>${this.chapter.objective}</p>
      </div>
      <div id="probability-body">${this.chapterBody()}${this.quickCheck()}</div>
      <div class="course-nav">
        <button class="course-btn ghost" data-probability-nav="previous" ${chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-probability-nav="next" ${chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `);
    this.bindPanel();
  }

  private bindPanel(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-probability-chapter]").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectChapter((button.dataset.probabilityChapter ?? "foundations") as ChapterId);
      });
    });

    const chapterIndex = CHAPTERS.indexOf(this.chapter);
    document.querySelectorAll<HTMLButtonElement>("[data-probability-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.probabilityNav === "previous" ? -1 : 1;
        const target = CHAPTERS[chapterIndex + delta];
        if (target) this.selectChapter(target.id);
      });
    });

    const check = QUICK_CHECKS[this.chapterId];
    document.querySelectorAll<HTMLButtonElement>("[data-probability-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.probabilityAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-probability-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("probability-check-feedback");
        if (feedback) {
          feedback.className = `foundation-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Correct." : "Not quite."}</b> ${check.explanation}`;
        }
      });
    });
  }

  private selectChapter(id: ChapterId): void {
    this.chapterId = CHAPTERS.some((chapter) => chapter.id === id) ? id : "foundations";
    this.randomState = this.params.seed;
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
            <button class="glsl-chip" data-probability-answer="${index}" aria-pressed="false">${option}</button>
          `).join("")}
        </div>
        <div id="probability-check-feedback" class="foundation-check-feedback" aria-live="polite">
          Choose an answer, then use the explanation to check your reasoning.
        </div>
      </div>`;
  }

  private chapterBody(): string {
    switch (this.chapterId) {
      case "foundations":
        return this.foundationsBody();
      case "rules":
        return this.rulesBody();
      case "conditional":
        return this.conditionalBody();
      case "random-variables":
        return this.randomVariablesBody();
      case "binomial":
        return this.binomialBody();
      case "continuous":
        return this.continuousBody();
      case "sampling":
        return this.samplingBody();
      case "bayes":
        return this.bayesBody();
    }
  }

  private foundationsBody(): string {
    const evenObserved = this.simulateDie().filter((value) => value % 2 === 0).length;
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Start with an experiment</div>
        <p>An <b>experiment</b> has an uncertain result. Its <b>sample space</b>,
        written <code>Ω</code>, lists every possible outcome. For a die,
        <code>Ω = {1,2,3,4,5,6}</code>. An <b>event</b> is any collection of outcomes,
        such as <code>E = {2,4,6}</code> for “roll an even number”.</p>
        <div class="formula" data-derivation="probability-equally-likely">
          <div class="formula-label">Equally likely outcomes</div>
          <div class="formula-body">P(A) = favourable outcomes / possible outcomes</div>
          <div class="formula-note">Probabilities run from 0 (impossible) to 1 (certain), or 0% to 100%.</div>
        </div>
        <div class="readout">
          <div><span>Exact P(even)</span><b>3 / 6 = 50%</b></div>
          <div><span>Observed even rolls</span><b>${evenObserved} / ${this.params.sampleSize} = ${this.percent(evenObserved / this.params.sampleSize)}</b></div>
        </div>
        <p><b>Important:</b> favourable/possible works only when outcomes are equally likely.
        Real probabilities often come from measured frequencies or a model instead.</p>
        <p class="example"><b>Applied example:</b> quality control treats each inspected item as
        pass/fail; weather forecasting assigns probabilities to possible future conditions.</p>
      </div>`;
  }

  private rulesBody(): string {
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Build events without double-counting</div>
        <p>The <b>complement</b> <code>Aᶜ</code> means “not A”. Mutually exclusive events cannot
        happen together. Independent events do not change each other's probabilities.</p>
        <div class="formula" data-derivation="probability-core-rules">
          <div class="formula-label">Core rules</div>
          <div class="formula-body">P(Aᶜ)=1-P(A) · P(A∪B)=P(A)+P(B)-P(A∩B)</div>
          <div class="formula-note">For independent events, P(A∩B)=P(A)P(B). Subtract the intersection in the addition rule because it was counted twice.</div>
        </div>
        <table class="cmp-table">
          <thead><tr><th>Question</th><th>Efficient route</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>At least one head in 2 flips</td><td>1 - P(TT)</td><td>1 - 1/4 = 3/4</td></tr>
            <tr><td>Two heads</td><td>P(H) × P(H)</td><td>1/2 × 1/2 = 1/4</td></tr>
            <tr><td>Heart or king</td><td>13/52 + 4/52 - 1/52</td><td>16/52</td></tr>
          </tbody>
        </table>
        <p class="example"><b>Applied example:</b> reliability engineers combine component
        failure probabilities; cybersecurity teams estimate the chance of at least one alert
        across several independent detectors.</p>
      </div>`;
  }

  private conditionalBody(): string {
    const result = conditionalProbability(4 / 52, 12 / 52);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Information changes the denominator</div>
        <p><b>Conditional probability</b> asks for the chance of A after learning B.
        The condition restricts the sample space to outcomes where B is true.</p>
        <div class="formula" data-derivation="probability-conditional">
          <div class="formula-label">Definition</div>
          <div class="formula-body">P(A | B) = P(A ∩ B) / P(B)</div>
          <div class="formula-note">Read the bar as “given”. A and B are independent exactly when P(A|B)=P(A).</div>
        </div>
        <div class="readout">
          <div><span>Face cards B</span><b>12 / 52</b></div>
          <div><span>Kings that are face cards A ∩ B</span><b>4 / 52</b></div>
          <div><span>P(king | face card)</span><b>4 / 12 = ${this.percent(result)}</b></div>
        </div>
        <p>Dependence is not the same as causation. Ice-cream sales and sunburns move together
        because hot weather influences both; one does not necessarily cause the other.</p>
        <p class="example"><b>Applied example:</b> medical diagnosis asks P(condition | positive
        test), while manufacturing asks P(defect | sensor alarm).</p>
      </div>`;
  }

  private randomVariablesBody(): string {
    const outcomes = [1, 2, 3, 4, 5, 6];
    const probabilities = new Array(6).fill(1 / 6);
    const mean = expectedValue(outcomes, probabilities);
    const spread = variance(outcomes, probabilities);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Turn outcomes into numbers</div>
        <p>A <b>random variable</b> assigns a numerical value to each outcome.
        Its <b>expected value</b> is a probability-weighted average, not a promise about one trial.
        Variance measures squared distance from the mean; standard deviation returns that spread
        to the original units.</p>
        <div class="formula">
          <div class="formula-label">Centre and spread</div>
          <div class="formula-body">E[X]=ΣxP(X=x) · Var(X)=Σ(x-μ)²P(X=x) · σ=√Var(X)</div>
        </div>
        <div class="readout">
          <div><span>Fair-die expectation</span><b>μ = ${mean.toFixed(2)}</b></div>
          <div><span>Variance</span><b>σ² = ${spread.toFixed(3)}</b></div>
          <div><span>Standard deviation</span><b>σ = ${Math.sqrt(spread).toFixed(3)}</b></div>
        </div>
        <p>The expected die result is 3.5 even though no roll can equal 3.5. Over many rolls,
        the average payout per roll approaches that value.</p>
        <p class="example"><b>Applied example:</b> insurers price expected claims but also need
        variance to understand risk; project managers compare expected duration and uncertainty.</p>
      </div>`;
  }

  private binomialBody(): string {
    const n = this.params.trials;
    const p = this.params.successProbability;
    const mostLikely = Math.floor((n + 1) * p);
    const probability = binomialProbability(n, mostLikely, p);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Model repeated success-or-failure trials</div>
        <p>A <b>Bernoulli trial</b> has two outcomes: success with probability <code>p</code>
        and failure with probability <code>1-p</code>. The <b>binomial distribution</b> counts
        successes in <code>n</code> independent trials with the same p.</p>
        <div class="formula" data-derivation="probability-binomial">
          <div class="formula-label">Binomial probability</div>
          <div class="formula-body">P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ</div>
          <div class="formula-note">C(n,k) counts where the k successes can appear; the powers give each sequence's probability.</div>
        </div>
        <div class="readout">
          <div><span>Current model</span><b>n=${n}, p=${p.toFixed(2)}</b></div>
          <div><span>Expected successes np</span><b>${(n * p).toFixed(2)}</b></div>
          <div><span>P(X=${mostLikely})</span><b>${this.percent(probability)}</b></div>
          <div><span>Standard deviation √np(1-p)</span><b>${Math.sqrt(n * p * (1 - p)).toFixed(3)}</b></div>
        </div>
        <p class="example"><b>Applied example:</b> model conversions among visitors, defective
        items in a batch, successful transmissions, or heads in repeated coin flips. Independence
        and constant p must be plausible.</p>
      </div>`;
  }

  private continuousBody(): string {
    const { mean, standardDeviation } = this.params;
    const withinOne = 0.6827;
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Probability becomes area</div>
        <p>A continuous variable can take any value in an interval. A <b>probability density</b>
        is not itself a probability: probability is the <b>area under the curve</b> between two
        values. The total area is 1.</p>
        <div class="formula" data-derivation="probability-z-score">
          <div class="formula-label">Normal distribution</div>
          <div class="formula-body">z=(x-μ)/σ · X ~ N(μ,σ²)</div>
          <div class="formula-note">The z-score says how many standard deviations x lies above or below the mean.</div>
        </div>
        <div class="readout">
          <div><span>Current normal model</span><b>μ=${mean.toFixed(1)}, σ=${standardDeviation.toFixed(1)}</b></div>
          <div><span>Within μ ± σ</span><b>≈ ${this.percent(withinOne)}</b></div>
          <div><span>Within μ ± 2σ</span><b>≈ 95.4%</b></div>
          <div><span>P(X exactly equals μ)</span><b>0</b></div>
        </div>
        <p>The normal curve is useful when many small influences add together, but real data can
        be skewed, bounded, heavy-tailed, or multimodal. Plot the data before assuming normality.</p>
        <p class="example"><b>Applied example:</b> measurement error, manufactured dimensions,
        test-score models, and process-control limits often use normal approximations.</p>
      </div>`;
  }

  private samplingBody(): string {
    const samples = this.simulateDiceSums();
    const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const theoreticalMean = this.params.trials * 3.5;
    const standardError = Math.sqrt(this.params.trials * 35 / 12) / Math.sqrt(this.params.sampleSize);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Learn from samples without confusing them with populations</div>
        <p>A <b>population</b> is the full process of interest; a <b>sample</b> is the observed
        subset. The law of large numbers says a sample average tends toward the expected value.
        The central limit theorem says sums or averages of many independent contributions often
        approach a normal shape after suitable scaling.</p>
        <div class="formula" data-derivation="probability-standard-error">
          <div class="formula-label">Sampling uncertainty</div>
          <div class="formula-body">SE(sample mean) = σ / √n</div>
          <div class="formula-note">Four times as much data roughly halves the standard error; it does not automatically remove bias.</div>
        </div>
        <div class="readout">
          <div><span>Dice added per observation</span><b>${this.params.trials}</b></div>
          <div><span>Theoretical mean</span><b>${theoreticalMean.toFixed(2)}</b></div>
          <div><span>Observed sample mean</span><b>${sampleMean.toFixed(3)}</b></div>
          <div><span>Standard error of this mean</span><b>≈ ${standardError.toFixed(3)}</b></div>
        </div>
        <p>The CLT concerns the distribution of sums or sample means, not a claim that every
        original population is normal. Dependence, extreme heavy tails, and biased sampling can
        invalidate simple textbook conclusions.</p>
        <p class="example"><b>Applied example:</b> polling, A/B tests, sensor averaging, quality
        sampling, and confidence intervals all depend on sampling design and standard error.</p>
      </div>`;
  }

  private bayesBody(): string {
    const prior = 0.01;
    const sensitivity = 0.90;
    const specificity = 0.95;
    const posterior = bayesPosterior(prior, sensitivity, specificity);
    return `
      <div class="course course-lesson">
        <div class="course-lesson-title">Update beliefs with evidence</div>
        <p><b>Bayes' rule</b> reverses a conditional probability. A test usually gives
        <code>P(positive | condition)</code>, but the decision-maker wants
        <code>P(condition | positive)</code>. The prior or base rate matters.</p>
        <div class="formula" data-derivation="probability-bayes">
          <div class="formula-label">Bayes' theorem</div>
          <div class="formula-body">P(A|B)=P(B|A)P(A) / P(B)</div>
          <div class="formula-note">Posterior ∝ likelihood × prior. New evidence updates rather than erases prior information.</div>
        </div>
        <div class="readout">
          <div><span>Prior prevalence</span><b>1%</b></div>
          <div><span>Sensitivity / specificity</span><b>90% / 95%</b></div>
          <div><span>Per 1,000: true / false positives</span><b>9 / 49.5</b></div>
          <div><span>P(condition | positive)</span><b>${this.percent(posterior)}</b></div>
        </div>
        <p>A positive result raises the probability from 1% to about ${this.percent(posterior)},
        but it is not 90%. The false-positive rate acts on the much larger healthy population.</p>

        <h3>How probability grew</h3>
        <p>Games of chance motivated early counting, but the subject became mathematical through
        Pascal and Fermat's 1654 correspondence about dividing stakes in an unfinished game.
        Huygens published the first probability textbook in 1657. Bayes' posthumous 1763 essay
        and Laplace's later work developed inverse probability. Kolmogorov supplied the modern
        axiomatic foundation in 1933.</p>

        <h3>Hero-level judgement</h3>
        <ul>
          <li>Check assumptions: independence, stable probabilities, representative sampling, and model fit.</li>
          <li>Separate uncertainty from variability, measurement error, and missing information.</li>
          <li>Report calibration and consequences, not just one probability or p-value.</li>
          <li>Use simulation, Markov chains, survival models, or Bayesian hierarchical models when simple formulas are inadequate.</li>
        </ul>
        <p class="example"><b>Applied example:</b> diagnosis, fraud alerts, predictive maintenance,
        spam filters, legal evidence, forecasting, and scientific inference all combine base rates,
        evidence quality, and decision costs.</p>
      </div>`;
  }

  private drawDieExperiment(): void {
    const samples = this.simulateDie();
    const frequencies = this.frequency(samples, [1, 2, 3, 4, 5, 6]);
    this.drawBars(
      ["1", "2", "3", "4", "5", "6"],
      frequencies,
      "Observed die frequencies — even outcomes are highlighted",
      [COLORS.blue, COLORS.green, COLORS.blue, COLORS.green, COLORS.blue, COLORS.green],
    );
  }

  private drawCoinRules(): void {
    this.drawBars(
      ["HH", "HT", "TH", "TT"],
      [0.25, 0.25, 0.25, 0.25],
      "Two flips: four equally likely sequences",
      [COLORS.green, COLORS.green, COLORS.green, COLORS.red],
    );
  }

  private drawConditionalCards(): void {
    const values = new Array(12).fill(1 / 12);
    const labels = ["K♠", "K♥", "K♦", "K♣", "Q♠", "Q♥", "Q♦", "Q♣", "J♠", "J♥", "J♦", "J♣"];
    this.drawBars(
      labels,
      values,
      "Given face card: the sample space shrinks from 52 cards to 12",
      labels.map((label) => label.startsWith("K") ? COLORS.green : COLORS.blue),
    );
  }

  private drawExpectation(): void {
    const outcomes = [1, 2, 3, 4, 5, 6];
    const contributions = outcomes.map((outcome) => outcome / 6);
    this.drawBars(
      outcomes.map(String),
      contributions,
      "Each bar is x × P(X=x); together they sum to E[X] = 3.5",
      new Array(6).fill(COLORS.purple),
      "weighted contribution",
    );
  }

  private drawBinomial(): void {
    const probabilities = Array.from(
      { length: this.params.trials + 1 },
      (_, successes) => binomialProbability(
        this.params.trials,
        successes,
        this.params.successProbability,
      ),
    );
    this.drawBars(
      probabilities.map((_, successes) => String(successes)),
      probabilities,
      `Binomial distribution: n=${this.params.trials}, p=${this.params.successProbability.toFixed(2)}`,
      probabilities.map(() => COLORS.blue),
    );
  }

  private drawNormal(): void {
    const samples = Array.from({ length: this.params.sampleSize }, () => {
      const first = Math.max(this.random(), 1e-12);
      const second = this.random();
      const standard = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
      return this.params.mean + this.params.standardDeviation * standard;
    });
    this.drawContinuousHistogram(samples, this.params.mean, this.params.standardDeviation);
  }

  private drawDiceSums(): void {
    const samples = this.simulateDiceSums();
    const minimum = this.params.trials;
    const maximum = this.params.trials * 6;
    const outcomes = Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
    this.drawBars(
      outcomes.map(String),
      this.frequency(samples, outcomes),
      `Sum of ${this.params.trials} dice — repeated contributions create a bell shape`,
      outcomes.map(() => COLORS.orange),
    );
  }

  private drawBayes(): void {
    const truePositive = 0.01 * 0.90;
    const falsePositive = 0.99 * 0.05;
    const positiveTotal = truePositive + falsePositive;
    this.drawBars(
      ["True +", "False +"],
      [truePositive / positiveTotal, falsePositive / positiveTotal],
      "Among positive results: posterior probability comes from both groups",
      [COLORS.green, COLORS.red],
    );
  }

  private drawBars(
    labels: readonly string[],
    values: readonly number[],
    title: string,
    colours: readonly number[],
    valueLabel = "probability",
  ): void {
    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-5.2, 0, 0),
        new THREE.Vector3(5.2, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: COLORS.muted }),
    );
    this.group.add(axis);

    const maximum = Math.max(...values, 1e-9);
    const spacing = 9.6 / labels.length;
    const width = Math.min(0.75, spacing * 0.72);
    labels.forEach((label, index) => {
      const height = values[index] / maximum * 3.8;
      const x = -4.8 + spacing * (index + 0.5);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(width, Math.max(height, 0.025), 0.22),
        new THREE.MeshStandardMaterial({ color: colours[index], roughness: 0.6 }),
      );
      bar.position.set(x, Math.max(height, 0.025) / 2, 0);
      this.group.add(bar);

      const outcomeLabel = textSprite(label, 0xc9d1d9, Math.min(0.28, spacing * 0.3));
      outcomeLabel.position.set(x, -0.36, 0.15);
      this.group.add(outcomeLabel);

      if (labels.length <= 13) {
        const probabilityLabel = textSprite(
          valueLabel === "probability" ? this.percent(values[index]) : values[index].toFixed(2),
          colours[index],
          Math.min(0.24, spacing * 0.25),
        );
        probabilityLabel.position.set(x, height + 0.28, 0.15);
        this.group.add(probabilityLabel);
      }
    });

    const heading = textSprite(title, COLORS.green, 0.38);
    heading.position.set(0, 4.75, 0.1);
    this.group.add(heading);
  }

  private drawContinuousHistogram(
    samples: readonly number[],
    mean: number,
    standardDeviation: number,
  ): void {
    const bins = 22;
    const minimum = mean - 4 * standardDeviation;
    const maximum = mean + 4 * standardDeviation;
    const width = (maximum - minimum) / bins;
    const counts = new Array(bins).fill(0);
    samples.forEach((sample) => {
      const index = Math.floor((sample - minimum) / width);
      if (index >= 0 && index < bins) counts[index]++;
    });
    const maxCount = Math.max(...counts, 1);

    counts.forEach((count, index) => {
      const height = count / maxCount * 3.8;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(9.5 / bins * 0.92, height, 0.20),
        new THREE.MeshStandardMaterial({ color: COLORS.blue, roughness: 0.65 }),
      );
      bar.position.set(-4.75 + (index + 0.5) * (9.5 / bins), height / 2, 0);
      this.group.add(bar);
    });

    const densityAtMean = normalDensity(mean, mean, standardDeviation);
    const curvePoints: THREE.Vector3[] = [];
    for (let index = 0; index <= 120; index++) {
      const value = minimum + (maximum - minimum) * index / 120;
      const x = -4.75 + 9.5 * index / 120;
      const y = normalDensity(value, mean, standardDeviation) / densityAtMean * 4.1;
      curvePoints.push(new THREE.Vector3(x, y, 0.18));
    }
    this.group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curvePoints),
      new THREE.LineBasicMaterial({ color: COLORS.orange }),
    ));

    const meanLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0.2),
        new THREE.Vector3(0, 4.35, 0.2),
      ]),
      new THREE.LineBasicMaterial({ color: COLORS.green }),
    );
    this.group.add(meanLine);

    const heading = textSprite(
      `Normal samples: μ=${mean.toFixed(1)}, σ=${standardDeviation.toFixed(1)}`,
      COLORS.green,
      0.40,
    );
    heading.position.set(0, 4.75, 0.1);
    this.group.add(heading);
  }

  private simulateDie(): number[] {
    const state = this.randomState;
    const samples = Array.from(
      { length: this.params.sampleSize },
      () => Math.floor(this.random() * 6) + 1,
    );
    this.randomState = state;
    return samples;
  }

  private simulateDiceSums(): number[] {
    const state = this.randomState;
    const samples = Array.from({ length: this.params.sampleSize }, () => {
      let total = 0;
      for (let die = 0; die < this.params.trials; die++) {
        total += Math.floor(this.random() * 6) + 1;
      }
      return total;
    });
    this.randomState = state;
    return samples;
  }

  private frequency(samples: readonly number[], outcomes: readonly number[]): number[] {
    return outcomes.map(
      (outcome) => samples.filter((sample) => sample === outcome).length / samples.length,
    );
  }

  private random(): number {
    this.randomState = (this.randomState * 9301 + 49297) % 233280;
    return this.randomState / 233280;
  }

  private percent(value: number): string {
    return `${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 1)}%`;
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
