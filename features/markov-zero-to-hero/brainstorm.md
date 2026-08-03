# Brainstorm: Markov Chains Zero to Hero

**Date:** 2026-07-24
**Status:** Ready for Specify
**Participants:** Chris Rollings, Copilot

---

## Context

Vector Lab already provides an interactive Markov Chains lesson with weather, factory-condition, and customer-retention presets, plus a Stochastic Processes lesson that follows it. The existing lesson is a useful introduction but is not a complete, structured route from probability fundamentals to the mathematical and operational decisions behind real predictive models.

The new course should teach Markov chains from first principles through formal matrix methods and a production-line prediction capstone. It should help a learner understand both the mathematics and why an operational prediction is a probability rather than a guarantee.

---

## What We're Building

### Problem Statement

Learners need a visual, interactive path to understand Markov chains without skipping from intuitive state diagrams to unexplained matrix notation or black-box machine-learning claims. The course must connect each concept to a realistic production-line prediction scenario.

### Desired Outcome

By the final capstone, a learner can define states, construct and validate a transition matrix, calculate multi-step forecasts and long-run behaviour, estimate a chain from synthetic events, and explain how a LineView-style stop-risk forecast is produced and limited.

### Scope

**In Scope:**
- Six prerequisite-linked Vector Lab lessons from beginner to advanced.
- A shared synthetic production-line simulator, used progressively across the course.
- Guided visual experiments, short formative checks, and a final capstone.
- A historical origin/discovery element and applied examples in every lesson.
- Formal mathematics derived visually from first principles, including matrices and long-run distributions.
- Explicit discussion of model limits: sparse data, duration dependence, state design, calibration, and when to use semi-Markov, hidden-state, or neural models.

**Out of Scope:**
- Real, customer, or anonymised LineView data.
- A production prediction service, model-training pipeline, or Navigator integration.
- Scored accounts, persistence, leaderboards, or formal accreditation.
- Teaching neural-network implementation beyond a conceptual comparison.

---

## Why This Approach

### Approaches Considered

#### Approach A: Expand the existing single Markov lesson

**Description:** Add chapters, controls, and examples to the current `MarkovChainsLesson`.

**Pros:**
- Minimal navigation and file changes.
- Reuses the established Three.js state diagram.

**Cons:**
- A single lesson becomes too dense for a zero-to-hero journey.
- Prerequisites, challenges, and advanced concepts become difficult to pace and test independently.

#### Approach B: Six-lesson learning path with a shared production-line simulator

**Description:** Create six focused lessons that build in sequence while revisiting the same synthetic line and progressively increasing the learner's control and mathematical toolkit.

**Pros:**
- Matches Vector Lab's prerequisite-linked learning path.
- Separates intuition, algebra, estimation, and operational modelling into manageable stages.
- Makes repeated applied practice coherent without using customer data.

**Cons:**
- Requires shared models, scenarios, and visual language across multiple lesson files.
- Needs careful continuity so the simulator does not obscure fundamentals.

#### Approach C: Foundations lesson plus a separate advanced application module

**Description:** Keep introductory Markov content compact and place all production modelling in a later standalone application lesson.

**Pros:**
- Keeps the early learning experience short.
- Allows an advanced learner to jump directly to application.

**Cons:**
- Weakens the applied thread that motivates each mathematical step.
- Makes the capstone feel disconnected from the foundations.

### Selected Approach

**Decision:** Approach B — six prerequisite-linked lessons with one shared synthetic production-line simulator.

**Rationale:**
- It supports a genuine zero-to-hero progression without compressing advanced mathematics into one screen.
- It makes production-line prediction an understandable application rather than a black-box finale.
- It fits the app's existing lesson manager, prerequisite navigation, interactive Three.js scenes, formula derivations, and Vitest/Playwright test structure.

---

## Course Outline

| Lesson | Core outcome | Production-line thread |
|---|---|---|
| 1. Chance, states, and Markov's idea | Distinguish state, transition, path, and probability; learn the 1906 origin of Markov's sequence work. | Represent a line as Running, Blocked, Starved, or Unavailable. |
| 2. The memoryless model | Test the Markov property and model assumptions using transition diagrams. | Decide whether the current machine state is enough to forecast its next state. |
| 3. Transition matrices and forecasts | Build row-stochastic matrices and derive one- and multi-step distributions visually. | Forecast condition several minutes ahead from the current line state. |
| 4. Long-run behaviour | Explore recurrence, absorbing states, periodicity, and stationary distributions. | Compare recovery, persistent fault, and eventual-stop operating regimes. |
| 5. Learning from events | Estimate transition probabilities from synthetic histories; use smoothing, holdout testing, and calibration. | Turn event counts into cautious, evidence-based stop-risk estimates. |
| 6. Production-line prediction capstone | Build, inspect, and challenge an end-to-end state-transition forecast. | Predict 5-, 15-, and 30-minute stop risk, rank likely source machines, and identify when a basic Markov model is inadequate. |

Each lesson will include:

- A historical discovery/origin element.
- A diagram-first explanation before symbolic derivation.
- Guided experiments and a short check for understanding.
- At least one applied scenario, centred on the shared synthetic production line.
- Clear links to prerequisite concepts and the next lesson.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product location | Vector Lab | Existing interactive maths platform and established Markov lesson provide the strongest base. |
| Course shape | Six lessons | Provides enough pacing for foundations, formal maths, estimation, and capstone work. |
| Applied thread | Production-line prediction | Directly connects mathematics to the LineView use case while remaining broadly educational. |
| Mathematical depth | Formal, first-principles derivations | Learner wants the full mathematical route, with diagrams making each step understandable. |
| Data | Synthetic only | Keeps the course shareable and avoids customer-data governance concerns. |
| Mastery model | Guided experiments, checks, capstone | Balances exploratory learning with evidence that concepts are understood. |
| Historical content | Present in every lesson | Explains why each concept was discovered and how it developed. |

---

## Open Questions

| Question | Impact | Owner |
|----------|--------|-------|
| Should the existing `MarkovChainsLesson` become Lesson 1 or remain as a compact prerequisite/reference? | Medium | Chris |
| Should the capstone expose a simplified semi-Markov duration comparison, or explain it without an interactive implementation? | Medium | Chris |
| What visual style should distinguish probability, uncertainty, and observed history consistently across all six lessons? | Medium | Implementation design |

---

## User Stories (Draft)

1. **As a beginner**, I want to move state tokens through an interactive diagram so that I understand a Markov chain before seeing matrix notation.
2. **As a learner**, I want every matrix operation linked to a visible probability flow so that formal calculations remain intuitive.
3. **As an operations-minded learner**, I want to build a synthetic line-stop forecast and inspect its assumptions so that I can judge when a prediction is useful or misleading.

---

## Next Steps

- [ ] Resolve the capstone's semi-Markov scope.
- [ ] Run `workflows:specify` to create the formal course specification.
- [ ] Define lesson-level acceptance criteria, visual interactions, shared domain model, and test coverage.

---

## References

- Existing introductory lesson: `src/lessons/MarkovChainsLesson.ts`
- Follow-on lesson: `src/lessons/StochasticProcessesLesson.ts`
- Markov utilities and tests: `src/math/markov.ts`, `tests/markov.test.ts`
- Lesson registration and prerequisites: `src/main.ts`
