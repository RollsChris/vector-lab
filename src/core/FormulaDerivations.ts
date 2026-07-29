export interface DerivationStep {
  expression: string;
  reason: string;
}

export interface DerivationSymbol {
  /** The symbol exactly as it appears in the equation, e.g. "s₁, s₂". */
  symbol: string;
  /** What it stands for, in plain words. */
  meaning: string;
}

export interface DerivationDiagram {
  description: string;
  svg: string;
}

export interface FormulaDerivation {
  id: string;
  title: string;
  equation: string;
  startingPoint: string;
  steps: readonly DerivationStep[];
  result: string;
  /** What each letter in the equation stands for; rendered as a legend above the steps. */
  symbols?: readonly DerivationSymbol[];
  assumptions?: string;
  diagram?: DerivationDiagram;
}

export type LessonFormulaDerivations = Readonly<Record<string, readonly FormulaDerivation[]>>;

/**
 * Authored derivations are registered here by subject modules. A formula receives a control
 * only when its derivation is available; this prevents a generic, misleading explanation.
 */
const derivations: Record<string, readonly FormulaDerivation[]> = {};

export const FORMULA_DERIVATIONS: LessonFormulaDerivations = derivations;

export function registerFormulaDerivations(lessonId: string, entries: readonly FormulaDerivation[]): void {
  // Assignment keeps the current records intact when Vite replaces a lesson module.
  derivations[lessonId] = entries;
}

export function derivationButton(id: string): string {
  return `<button class="formula-derive" type="button" data-derivation="${id}" aria-haspopup="dialog">Show derivation</button>`;
}

export function derivationById(lessonId: string, id: string): FormulaDerivation | undefined {
  return FORMULA_DERIVATIONS[lessonId]?.find((derivation) => derivation.id === id);
}
