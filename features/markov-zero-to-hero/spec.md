# Specification: Markov Chains Zero to Hero

**Feature:** `markov-zero-to-hero`
**Status:** Draft — clarification required
**Date:** 2026-07-24
**Source:** `features/markov-zero-to-hero/brainstorm.md`

---

## Problem Statement

### Current State

Vector Lab has an interactive introductory Markov Chains lesson and a follow-on Stochastic Processes lesson. The introduction demonstrates state diagrams, transition matrices, multi-step forecasts, stationary distributions, and several presets, but learners do not yet have a paced route from probability fundamentals to estimating, validating, and limiting a production-line prediction model.

### Desired State

Vector Lab provides a six-lesson, zero-to-hero Markov Chains learning path. Learners move from a visual explanation of chance and state changes to formal matrix operations, estimation from events, and a synthetic production-line prediction capstone. Each lesson explicitly connects intuitive diagrams, formal mathematics, historical context, practical applications, and learner-controlled experiments.

### Impact

The course gives learners the mathematical literacy to understand why state-transition predictions are probabilities rather than guarantees. It provides a safe, shareable educational analogue of the LineView stop-risk concept without accessing, exposing, or depending on customer production data.

---

## Goals

1. Teach finite, discrete-time Markov chains from foundations through formal matrix methods.
2. Make every major derivation diagram-first and interactive before symbolic notation is introduced.
3. Use one synthetic production-line scenario to show how mathematical ideas become an operational prediction.
4. Teach model limitations as part of the learning journey, including state design, sparse evidence, calibration, duration dependence, and hidden state.
5. Preserve Vector Lab's interactive, accessible, prerequisite-linked learning experience.

## Non-Goals

- Build or validate a real LineView stop-risk model.
- Use customer, anonymised customer, or production data.
- Build a production model registry, training workflow, alerting service, or Navigator interface.
- Provide learner accounts, saved progress, certification, leaderboards, or formal grading.
- Teach neural-network implementation; neural sequence models are discussed only as a comparison point.

---

## User Personas

### Beginner learner

- **Context:** Has basic arithmetic and probability familiarity but has not studied stochastic processes or matrix methods.
- **Goal:** Understand what a Markov chain represents and confidently interpret a state diagram and transition probability.
- **Need:** Plain language, visible probability flow, low-stakes short checks, and explanations of notation when it first appears.

### Technical learner

- **Context:** Wants formal mathematical understanding, including transition matrices, matrix powers, stationary distributions, and model assumptions.
- **Goal:** Derive and verify forecasts rather than memorise formulas.
- **Need:** Step-by-step derivations paired with diagrams and learner-adjustable examples.

### Operations-minded learner

- **Context:** Understands a production line or LineView-style operational problem but may not be a data scientist.
- **Goal:** Connect current machine states to a probabilistic future-stop forecast and know when not to trust it.
- **Need:** An explainable synthetic line simulator, clear uncertainty language, and a capstone grounded in practical decisions.

---

## Course Definition

The course consists of six prerequisite-linked lessons. The application thread is a single configurable synthetic production line. It must never load or request customer data.

| ID | Lesson | Learner outcome |
|---|---|---|
| `markov-foundations` | Chance, states, and Markov's idea | Define states, transitions, paths, and probabilities; distinguish an observed path from all possible paths. |
| `markov-property` | The memoryless model | State and test the Markov property; identify assumptions and counterexamples. |
| `markov-forecasts` | Transition matrices and forecasts | Construct a row-stochastic matrix and calculate one- and multi-step state distributions. |
| `markov-long-run` | Long-run behaviour | Explain recurrence, periodicity, absorbing states, and stationary distributions. |
| `markov-from-events` | Learning from events | Estimate transition probabilities from synthetic event histories and evaluate uncertainty, smoothing, holdout results, and calibration. |
| `markov-line-capstone` | Production-line prediction | Build and critique a synthetic multi-horizon line-stop forecast and source-machine ranking. |

---

## Functional Requirements

### Learning path

- **FR-1:** The application must show the six lessons as an ordered, prerequisite-linked course beginning after the existing Probability & Distributions lesson.
- **FR-2:** Each course lesson must state its learning objective, required prior knowledge, and next learning outcome in learner-facing language.
- **FR-3:** Each course lesson must have a historical origin/development section that explains why the concept emerged, distinguishes historical fact from modern application, and gives the learner a concrete connection to the lesson's mathematics.
- **FR-4:** Each course lesson must include at least one production-line application and at least one non-production analogy where that improves the foundational explanation.

### Visual and mathematical learning

- **FR-5:** The foundations lesson must let a learner create or select a finite set of states, observe directed transitions, and distinguish a realised sample path from a probability distribution.
- **FR-6:** The memoryless-model lesson must let a learner compare two histories that share a current state and evaluate when assigning the same next-state probabilities is reasonable or misleading.
- **FR-7:** The forecast lesson must let a learner construct or modify a row-stochastic transition matrix, visibly validate that every row totals one, and see one-step and multi-step probability flow corresponding to \(p_{t+n}=p_tP^n\).
- **FR-8:** The long-run lesson must let a learner explore at least one irreducible chain and one absorbing chain, compare forecasts from different starting states, and verify the stationary-distribution condition \(\pi P=\pi\) where it exists.
- **FR-9:** The event-learning lesson must generate reproducible synthetic transition histories, derive estimated counts and probabilities from those histories, and show how low counts affect uncertainty. It must let the learner compare an unsmoothed estimate with a smoothed estimate.
- **FR-10:** The event-learning lesson must evaluate a synthetic holdout period separately from the event history used for estimation, and must explain probability calibration using an observable expected-versus-observed comparison.

### Shared synthetic production-line simulator

- **FR-11:** The course must use a shared synthetic production-line scenario with named machines, a fixed illustrated topology, and an explicit state vocabulary that includes operating, constrained, and stopped/unavailable conditions.
- **FR-12:** The simulator must show the learner which observations form current state, which outcomes are future labels, and which information must not be used by a prediction made at the present time.
- **FR-13:** The simulator must support forecast horizons of 5, 15, and 30 simulated minutes and display a line-level stop-risk probability for each selected horizon.
- **FR-14:** The capstone must rank at least three candidate source machines and clearly distinguish “most likely source of the next line stop” from “machine most likely to stop.”
- **FR-15:** The capstone must explain a forecast through current states, relevant transition probabilities, possible paths, probability calibration, forecast horizon, and data sufficiency. It must not present any outcome as certain.
- **FR-16:** The capstone must let the learner vary a material condition, such as the current state, elapsed state duration, line topology, or transition evidence, and observe the impact on risk and source ranking.

### Guidance, checks, and limitations

- **FR-17:** Every lesson must provide at least one guided experiment with a visible instruction, observable result, and explanation of the result.
- **FR-18:** Every lesson must provide a short formative check with immediate feedback explaining why the answer is correct or incorrect.
- **FR-19:** The capstone must teach that a first-order Markov model is a benchmark, not a universal truth. It must explain when duration dependence suggests a semi-Markov or survival model, when unobserved condition suggests a hidden Markov model, and when a sequence neural network may be evaluated against the same target.
- **FR-20:** The course must use synthetic data and scenarios only, with no service calls, credentials, customer identifiers, telemetry, or LineView production data.

---

## Non-Functional Requirements

### Accessibility

- **NFR-1:** All course navigation, guided-experiment controls, and formative checks must be operable by keyboard.
- **NFR-2:** Diagrams must have text alternatives that communicate state, direction, and probability; colour must not be the sole carrier of meaning.
- **NFR-3:** Mathematical notation must be explained in nearby learner-facing text before it is relied on in a check or challenge.
- **NFR-4:** Learner feedback must be specific, respectful, and available without relying only on animation or hover state.

### Performance and reliability

- **NFR-5:** A lesson must mount, render its initial scene, and expose its learning controls without browser-console errors under the existing Vector Lab supported-browser test environment.
- **NFR-6:** Changing a simulator control must update the associated visual and readouts within 250 ms for the defined synthetic scenario sizes.
- **NFR-7:** Synthetic scenario results must be deterministic when a learner selects the same seed and controls.
- **NFR-8:** Leaving a lesson must release its scene objects and animation subscriptions so that selecting all lessons in sequence remains error-free.

### Content quality and safety

- **NFR-9:** Historical claims must be sourced from credible material and reviewed for factual accuracy before release.
- **NFR-10:** The course must clearly label all numbers, line layouts, events, and outcomes as synthetic.
- **NFR-11:** The course must state its modelling assumptions and limitations at the point where learners could otherwise overgeneralise a result.

### Maintainability

- **NFR-12:** Shared synthetic line definitions, transition data, deterministic simulation functions, and probability utilities must have one source of truth rather than duplicated lesson-local variants.
- **NFR-13:** Pure mathematical and simulation behaviour must be covered by automated unit tests; lesson registration, prerequisites, key interactions, and no-error rendering must be covered by the existing end-to-end approach.

---

## Constraints

### Product and content

- The course remains inside the existing Vector Lab browser application.
- It must use synthetic data only.
- It must retain the app's visual, interactive, educational character rather than becoming a static reference document.
- It must begin with foundations and advance toward formal mathematics; diagrams are required wherever they materially clarify a derivation.

### Technical

- The course must coexist with the existing `MarkovChainsLesson` and `StochasticProcessesLesson` until the scope of those lessons is resolved.
- It must retain compatibility with the app's existing lesson navigation, prerequisite metadata, formula-derivation dialog, TypeScript build, Vitest suite, and Playwright suite.
- It must not add a backend, database, authentication, external API dependency, or customer-data path.

---

## Acceptance Criteria

### Must Have

- [ ] Six lessons appear in the application as one ordered learning path with accurate prerequisites.
- [ ] A beginner can complete Lesson 1 and explain states, transitions, a path, and a probability distribution using the visual interaction.
- [ ] Each lesson contains a historical origin/development section, a diagram-first explanation, a guided experiment, a short formative check, and a synthetic production-line application.
- [ ] Lessons 3 and 4 let the learner verify \(p_{t+n}=p_tP^n\) and \(\pi P=\pi\) through both visible flow and numerical readouts.
- [ ] Lesson 5 estimates a transition matrix from deterministic synthetic events, compares smoothing choices, and keeps holdout evidence separate.
- [ ] The capstone produces 5-, 15-, and 30-minute risk views, a source-machine ranking, forecast explanation, and model-limit guidance.
- [ ] The capstone visibly distinguishes source-machine likelihood from the probability of a machine itself stopping.
- [ ] No customer or real LineView data is embedded, requested, or transmitted.
- [ ] Unit tests cover transition estimation, smoothing, multi-step forecasts, risk aggregation, reproducibility, and capstone state changes.
- [ ] End-to-end tests prove the six lessons mount, course navigation works, key checks give feedback, and the browser has no application errors.

### Should Have

- [ ] Learners can reset a lesson and reproduce the same scenario using a visible seed.
- [ ] Learners can view compact derivation dialogs for key formulas without leaving their current experiment.
- [ ] The simulator includes at least one non-production comparison scenario for transfer of learning.

### Will Not Have in This Release

- [ ] User accounts or saved course progress.
- [ ] A scored certification or formal assessment.
- [ ] Real-time connection to LineView, Databricks, or a customer line.
- [ ] A production-quality semi-Markov, hidden Markov, or neural model implementation.

---

## Clarifications Required

### Existing lesson migration

[NEEDS CLARIFICATION: Should the existing `MarkovChainsLesson` be replaced by the six-lesson path, converted into the first path lesson, or retained as a compact reference alongside the path?]

### Semi-Markov interaction

[NEEDS CLARIFICATION: Should the capstone provide an interactive duration-aware semi-Markov comparison, or should duration dependence be explained visually without a separate interactive model?]

### Course completion state

[NEEDS CLARIFICATION: Should the application display an in-session “completed” indication after a formative check is answered correctly, or is immediate feedback without completion tracking sufficient?]

---

## Success Measures

- Learners can correctly answer the lesson checks after completing the guided experiments.
- The capstone communicates that forecast outputs are calibrated probabilities and not deterministic predictions.
- A learner can identify at least one condition under which the basic Markov assumption is inappropriate.
- The course is fully usable without real operational data or prior specialist knowledge beyond the stated Probability & Distributions prerequisite.

---

## References

- Brainstorm: `features/markov-zero-to-hero/brainstorm.md`
- Existing Markov lesson: `src/lessons/MarkovChainsLesson.ts`
- Existing stochastic-processes lesson: `src/lessons/StochasticProcessesLesson.ts`
- Lesson contract and prerequisite metadata: `src/core/Lesson.ts`
- Lesson navigation and derivation dialog: `src/core/LessonManager.ts`
- Existing Markov math utilities/tests: `src/math/markov.ts`, `tests/markov.test.ts`
- Existing browser test convention: `tests/e2e/app.spec.ts`
