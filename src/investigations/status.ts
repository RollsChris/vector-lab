import type { ClaimStatus } from "./types";

export const CLAIM_STATUSES: readonly ClaimStatus[] = [
  "theorem",
  "equivalent-criterion",
  "conjecture",
  "heuristic",
  "numerical-evidence",
] as const;

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  theorem: "Theorem",
  "equivalent-criterion": "Equivalent criterion",
  conjecture: "Conjecture",
  heuristic: "Heuristic",
  "numerical-evidence": "Numerical evidence",
};

export const CLAIM_STATUS_BLURB: Record<ClaimStatus, string> = {
  theorem: "Proved mathematics under stated hypotheses.",
  "equivalent-criterion": "Proved equivalent to RH (or a named variant) under stated hypotheses.",
  conjecture: "Open statement; not established as a theorem.",
  heuristic: "Useful guiding picture; not a proof.",
  "numerical-evidence": "Finite computation or observation; never a proof.",
};

/** Permanent on-screen caveat for any RH-adjacent numerical work. */
export const RH_EVIDENCE_CAVEAT =
  "RH is unsolved; a finite computation is evidence, never a proof.";

const PROOF_CLAIM_PHRASES = [
  "proves the riemann hypothesis",
  "proves rh",
  "solves the riemann hypothesis",
  "solves rh",
  "rh is proved",
  "proof of the riemann hypothesis",
  "we prove rh",
  "app proves rh",
] as const;

export function isClaimStatus(value: string): value is ClaimStatus {
  return (CLAIM_STATUSES as readonly string[]).includes(value);
}

/** True when text asserts that RH is proved/solved (disallowed in this app). */
export function containsProofClaimPhrase(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  return PROOF_CLAIM_PHRASES.some((phrase) => normalized.includes(phrase));
}
