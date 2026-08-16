/**
 * A reusable teaching loop for scenes where learners need to discover a rule rather than
 * be told it first. Lessons own the scene-specific effects; this module owns the sequence.
 */
export type InteractionPhase = "predict" | "manipulate" | "reveal" | "break" | "articulate" | "complete";

export interface InteractionLoopState {
  phase: InteractionPhase;
  prediction?: string;
  articulation?: string;
  articulationCorrect?: boolean;
}

export interface InteractionChoice {
  value: string;
  label: string;
}

export interface InteractionLoopConfig {
  title: string;
  predictionPrompt: string;
  predictions: readonly InteractionChoice[];
  manipulatePrompt: string;
  manipulateAction: string;
  revealPrompt: string;
  revealAction: string;
  breakPrompt: string;
  breakAction: string;
  articulatePrompt: string;
  articulations: readonly InteractionChoice[];
  correctArticulation: string;
  completeMessage: string;
}

export type InteractionLoopAction =
  | { type: "predict"; value: string }
  | { type: "manipulated" }
  | { type: "revealed" }
  | { type: "condition-broken" }
  | { type: "articulate"; value: string; correct: boolean }
  | { type: "reset" };

export function initialInteractionLoopState(): InteractionLoopState {
  return { phase: "predict" };
}

/** Pure state transition so every lesson can use the same pedagogic sequence. */
export function reduceInteractionLoop(
  state: InteractionLoopState,
  action: InteractionLoopAction,
): InteractionLoopState {
  if (action.type === "reset") return initialInteractionLoopState();
  if (action.type === "predict" && state.phase === "predict") {
    return { phase: "manipulate", prediction: action.value };
  }
  if (action.type === "manipulated" && state.phase === "manipulate") {
    return { ...state, phase: "reveal" };
  }
  if (action.type === "revealed" && state.phase === "reveal") {
    return { ...state, phase: "break" };
  }
  if (action.type === "condition-broken" && state.phase === "break") {
    return { ...state, phase: "articulate" };
  }
  if (action.type === "articulate" && state.phase === "articulate") {
    return {
      ...state,
      articulation: action.value,
      articulationCorrect: action.correct,
      phase: action.correct ? "complete" : "articulate",
    };
  }
  return state;
}

export function renderInteractionLoop(
  state: InteractionLoopState,
  config: InteractionLoopConfig,
  actionAttribute: string,
): string {
  const steps: readonly { id: InteractionPhase; label: string }[] = [
    { id: "predict", label: "Predict" },
    { id: "manipulate", label: "Change it" },
    { id: "reveal", label: "See why" },
    { id: "break", label: "Break it" },
    { id: "articulate", label: "Say the rule" },
  ];
  const current = state.phase === "complete" ? "articulate" : state.phase;
  const currentIndex = steps.findIndex((step) => step.id === current);
  const progress = state.phase === "complete" ? steps.length : currentIndex;
  const action = (value: string) => `${actionAttribute}="insight:${value}"`;

  let body = "";
  if (state.phase === "predict") {
    body = `
      <fieldset class="insight-loop-choices">
        <legend>${escapeHtml(config.predictionPrompt)}</legend>
        ${config.predictions.map((choice) => `
          <button type="button" class="course-btn ghost" ${action(`predict:${choice.value}`)}
            aria-pressed="false">${escapeHtml(choice.label)}</button>`).join("")}
      </fieldset>`;
  } else if (state.phase === "manipulate") {
    body = actionCard(config.manipulatePrompt, config.manipulateAction, "manipulate", actionAttribute);
  } else if (state.phase === "reveal") {
    body = actionCard(config.revealPrompt, config.revealAction, "reveal", actionAttribute);
  } else if (state.phase === "break") {
    body = actionCard(config.breakPrompt, config.breakAction, "break", actionAttribute);
  } else if (state.phase === "articulate") {
    const feedback = state.articulationCorrect === false
      ? `<p class="insight-loop-feedback is-wrong">Not quite. Test the condition again, then choose the statement that names it.</p>`
      : "";
    body = `
      <fieldset class="insight-loop-choices">
        <legend>${escapeHtml(config.articulatePrompt)}</legend>
        ${config.articulations.map((choice) => `
          <button type="button" class="course-btn ghost" ${action(`articulate:${choice.value}`)}
            aria-pressed="${String(state.articulation === choice.value)}">${escapeHtml(choice.label)}</button>`).join("")}
      </fieldset>
      ${feedback}`;
  } else {
    body = `<p class="insight-loop-feedback is-correct">${escapeHtml(config.completeMessage)}</p>`;
  }

  return `
    <section class="insight-loop" aria-labelledby="insight-loop-title">
      <div class="insight-loop-heading">
        <h3 id="insight-loop-title">${escapeHtml(config.title)}</h3>
        <span class="insight-loop-progress">${progress} of ${steps.length} discoveries</span>
      </div>
      <ol class="insight-loop-steps">
        ${steps.map((step, index) => {
          const complete = state.phase === "complete" || index < currentIndex;
          const active = step.id === current;
          return `<li class="${complete ? "is-complete" : ""}${active ? " is-active" : ""}">
            <span aria-hidden="true">${complete ? "✓" : index + 1}</span>${step.label}
          </li>`;
        }).join("")}
      </ol>
      <div class="insight-loop-body">${body}</div>
    </section>`;
}

function actionCard(
  prompt: string,
  label: string,
  action: string,
  actionAttribute: string,
): string {
  return `
    <p class="insight-loop-prompt">${escapeHtml(prompt)}</p>
    <button type="button" class="course-btn" ${actionAttribute}="insight:${escapeHtml(action)}">${escapeHtml(label)}</button>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}
