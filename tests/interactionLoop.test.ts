import { describe, expect, it } from "vitest";
import {
  initialInteractionLoopState,
  reduceInteractionLoop,
} from "../src/core/InteractionLoop";

describe("interaction loop", () => {
  it("moves through prediction, discovery, a counterexample, and articulation", () => {
    let state = initialInteractionLoopState();
    state = reduceInteractionLoop(state, { type: "predict", value: "holds" });
    expect(state).toEqual({ phase: "manipulate", prediction: "holds" });

    state = reduceInteractionLoop(state, { type: "manipulated" });
    state = reduceInteractionLoop(state, { type: "revealed" });
    state = reduceInteractionLoop(state, { type: "condition-broken" });
    expect(state.phase).toBe("articulate");

    const incorrect = reduceInteractionLoop(state, {
      type: "articulate",
      value: "always",
      correct: false,
    });
    expect(incorrect.phase).toBe("articulate");
    expect(incorrect.articulationCorrect).toBe(false);

    state = reduceInteractionLoop(state, {
      type: "articulate",
      value: "right-angle",
      correct: true,
    });
    expect(state.phase).toBe("complete");
  });

  it("does not skip a discovery phase and resets cleanly", () => {
    const start = initialInteractionLoopState();
    expect(reduceInteractionLoop(start, { type: "revealed" })).toEqual(start);
    expect(reduceInteractionLoop(
      { phase: "complete", prediction: "holds", articulation: "right-angle", articulationCorrect: true },
      { type: "reset" },
    )).toEqual(start);
  });
});
