/**
 * Published nontrivial zeros of ζ(1/2 + it) on the critical line (imaginary parts).
 *
 * Values are the classical first zeros tabulated by Odlyzko and widely reproduced
 * (e.g. LMFDB, computational number-theory references). They are data, not a proof
 * that all zeros lie on the line.
 */
export interface PublishedZero {
  /** 1-based ordinal among zeros with t > 0. */
  readonly index: number;
  /** Imaginary part t of ρ = 1/2 + it. */
  readonly t: number;
}

export const ZERO_DATA_SOURCE = {
  label: "Odlyzko tables of zeta zeros (first positives), widely reproduced",
  references: [
    "A. M. Odlyzko, Tables of zeros of the Riemann zeta function",
    "LMFDB: zeros of zeta (critical line)",
  ],
} as const;

/** First ten positive critical-line zeros (imaginary parts). */
export const FIRST_CRITICAL_LINE_ZEROS: readonly PublishedZero[] = [
  { index: 1, t: 14.134725141734693790457251983562470270784257115699 },
  { index: 2, t: 21.022039638771554992628479593896902777334340524903 },
  { index: 3, t: 25.010857580145688763213790992562821818659549672558 },
  { index: 4, t: 30.424876125859513210311897530584091320181560023715 },
  { index: 5, t: 32.935061587739189690662368964074903488812715603517 },
  { index: 6, t: 37.586178158825671257217763480705332821405597350831 },
  { index: 7, t: 40.918719012147495187398126914633254395726165962777 },
  { index: 8, t: 43.327073280914999519496122165406805782645668252922 },
  { index: 9, t: 48.005150881167159727942472749427516041686844001144 },
  { index: 10, t: 49.773832477672302181916784678563724057723178299677 },
] as const;

export function zerosUpTo(tMax: number, limit = FIRST_CRITICAL_LINE_ZEROS.length): readonly PublishedZero[] {
  return FIRST_CRITICAL_LINE_ZEROS.filter((z) => z.index <= limit && z.t <= tMax);
}
