/** Claim epistemic status — honest labels for what a lesson asserts. */
export type ClaimStatus =
  | "theorem"
  | "equivalent-criterion"
  | "conjecture"
  | "heuristic"
  | "numerical-evidence";

export interface InvestigationClaim {
  /** Short statement the learner should treat carefully. */
  readonly text: string;
  readonly status: ClaimStatus;
}

/** Authoritative reading pointer. Prefer chapter/section locators; URLs only for approved hosts. */
export interface InvestigationReading {
  readonly label: string;
  /** Chapter, section, or paper locator — never invented page numbers. */
  readonly locator?: string;
  /** HTTPS URL on an approved host, or omitted. */
  readonly url?: string;
}

export interface InvestigationTask {
  /** Concrete study / proof / computation prompt shown in the stage. */
  readonly prompt: string;
  /** Optional hint revealed in a collapsed details block. */
  readonly hint?: string;
  /** Optional worked outline / answer revealed in a collapsed details block. */
  readonly answer?: string;
}

export interface InvestigationLesson {
  /** Contiguous curriculum id 1..100. */
  readonly id: number;
  readonly title: string;
  /** What the learner can do after working the item. */
  readonly outcome: string;
  readonly claims: readonly InvestigationClaim[];
  /** Plain-English concept name or one-liner. */
  readonly concept: string;
  /** Key idea / explanation for study. */
  readonly explanation: string;
  /** Why this item matters on a path toward understanding RH. */
  readonly whyItMatters: string;
  readonly task: InvestigationTask;
  /** Prerequisite lesson ids; each must exist and be strictly less than id. */
  readonly prerequisites: readonly number[];
  /** Item-specific readings; stage readings may supplement. */
  readonly readings: readonly InvestigationReading[];
  /**
   * When true, the detail panel offers Open Experiments (Hardy Z workbench).
   * Only for lessons genuinely tied to that experiment.
   */
  readonly opensExperiments?: boolean;
}

export interface InvestigationStage {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
  /** Inclusive contiguous id range covered by this stage. */
  readonly fromId: number;
  readonly toId: number;
  /** Short orientation for the stage reading surface. */
  readonly orientation: string;
  /** Canonical stage-level readings (shared across items in the stage). */
  readonly readings: readonly InvestigationReading[];
  readonly lessons: readonly InvestigationLesson[];
}

export type InvestigationRoute = "lessons" | "experiments";
