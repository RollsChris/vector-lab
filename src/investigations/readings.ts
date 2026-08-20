import type { InvestigationReading } from "./types";

/**
 * Small allowed catalog of authoritative sources.
 * URLs are HTTPS on approved hosts only. Prefer chapter/section locators over fragile page numbers.
 */
export const R = {
  dlmfZeta: {
    label: "NIST DLMF",
    locator: "Chapter 25 (Zeta and Related Functions)",
    url: "https://dlmf.nist.gov/25",
  },
  dlmfGamma: {
    label: "NIST DLMF",
    locator: "Chapter 5 (Gamma Function)",
    url: "https://dlmf.nist.gov/5",
  },
  dlmfFourier: {
    label: "NIST DLMF",
    locator: "Chapter 1 (Algebraic and Analytic Methods) / Fourier material cross-refs",
    url: "https://dlmf.nist.gov/",
  },
  clayRh: {
    label: "Clay Mathematics Institute",
    locator: "Riemann Hypothesis official problem description",
    url: "https://www.claymath.org/millennium/riemann-hypothesis/",
  },
  conreyAms: {
    label: "J. B. Conrey",
    locator: "The Riemann Hypothesis, Notices of the AMS 50 (2003)",
    url: "https://www.ams.org/notices/200303/fea-conrey-web.pdf",
  },
  apostolAnt: {
    label: "T. M. Apostol",
    locator: "Introduction to Analytic Number Theory (chapters on arithmetic functions, Dirichlet series, and ζ)",
  },
  apostolAnalytic: {
    label: "T. M. Apostol",
    locator: "Modular Functions and Dirichlet Series in Number Theory (selected chapters)",
  },
  titchmarsh: {
    label: "E. C. Titchmarsh",
    locator: "The Theory of the Riemann Zeta-Function (revised by Heath-Brown)",
  },
  iwaniecKowalski: {
    label: "H. Iwaniec & E. Kowalski",
    locator: "Analytic Number Theory (AMS Colloquium), chapters on ζ, L-functions, and zero-density",
  },
  aimathRh: {
    label: "American Institute of Mathematics",
    locator: "Riemann Hypothesis pages and problem lists",
    url: "https://aimath.org/WWN/rh/",
  },
  lmfdb: {
    label: "LMFDB",
    locator: "L-functions and Modular Forms Database — zeta and L-function home",
    url: "https://www.lmfdb.org/",
  },
  lmfdbZeta: {
    label: "LMFDB",
    locator: "Riemann zeta function entry",
    url: "https://www.lmfdb.org/L/1/1/1/1/",
  },
  babyRudin: {
    label: "W. Rudin",
    locator: "Principles of Mathematical Analysis (undergraduate real analysis backbone)",
  },
  babyAhlfors: {
    label: "L. Ahlfors",
    locator: "Complex Analysis (Cauchy theory, residues, argument principle)",
  },
  steinShakarchiComplex: {
    label: "E. M. Stein & R. Shakarchi",
    locator: "Complex Analysis (Princeton Lectures in Analysis II)",
  },
  steinShakarchiFourier: {
    label: "E. M. Stein & R. Shakarchi",
    locator: "Fourier Analysis (Princeton Lectures in Analysis I)",
  },
  steinShakarchiReal: {
    label: "E. M. Stein & R. Shakarchi",
    locator: "Real Analysis (Princeton Lectures in Analysis III)",
  },
  functionalAnalysis: {
    label: "M. Reed & B. Simon",
    locator: "Methods of Modern Mathematical Physics I: Functional Analysis (spectral theorem chapters)",
  },
  sergeLangAlgebra: {
    label: "S. Lang",
    locator: "Algebra (groups, rings, fields used later for characters)",
  },
  irelandRosen: {
    label: "K. Ireland & M. Rosen",
    locator: "A Classical Introduction to Modern Number Theory (characters, reciprocity)",
  },
  montgomeryVaughan: {
    label: "H. L. Montgomery & R. C. Vaughan",
    locator: "Multiplicative Number Theory I. Classical Theory",
  },
  edwards: {
    label: "H. M. Edwards",
    locator: "Riemann's Zeta Function (Riemann's paper and classical developments)",
  },
  ingham: {
    label: "A. E. Ingham",
    locator: "The Distribution of Prime Numbers",
  },
  davenport: {
    label: "H. Davenport",
    locator: "Multiplicative Number Theory",
  },
  iwasawa: {
    label: "Standard references on Dedekind zeta / class number formula",
    locator: "e.g. Neukirch, Algebraic Number Theory — Dedekind zeta chapters",
  },
  diamondShurman: {
    label: "F. Diamond & J. Shurman",
    locator: "A First Course in Modular Forms",
  },
  bump: {
    label: "D. Bump",
    locator: "Automorphic Forms and Representations (survey-level chapters)",
  },
  iwaniecSpectral: {
    label: "H. Iwaniec",
    locator: "Spectral Methods of Automorphic Forms (Selberg trace formula chapters)",
  },
  katzSarnak: {
    label: "N. M. Katz & P. Sarnak",
    locator: "Random Matrices, Frobenius Eigenvalues, and Monodromy (symmetry types)",
  },
  weilFoundations: {
    label: "A. Weil",
    locator: "Basic Number Theory / writings on the RH for curves over finite fields",
  },
  hartshorne: {
    label: "R. Hartshorne",
    locator: "Algebraic Geometry (cohomology background for Weil's proof — selected chapters)",
  },
  lagariasSurvey: {
    label: "J. C. Lagarias",
    locator: "Survey material on equivalent criteria for RH (published survey articles)",
  },
  baezDuarte: {
    label: "L. Báez-Duarte",
    locator: "Published papers on the discrete Nyman–Beurling criterion",
  },
  robin: {
    label: "G. Robin",
    locator: "Grandes valeurs de la fonction somme des diviseurs et hypothèse de Riemann (1984)",
  },
  liCriterion: {
    label: "Xian-Jin Li",
    locator: "The positivity of a sequence of numbers and the Riemann hypothesis (1997)",
  },
  turingZeros: {
    label: "A. M. Turing",
    locator: "Some calculations of the Riemann zeta-function (1953) — zero accounting method",
  },
  odlyzko: {
    label: "A. M. Odlyzko",
    locator: "Published tables and papers on zeros of the zeta function",
  },
  arxivRhSurvey: {
    label: "arXiv",
    locator: "Search recent RH surveys and expositions; treat preprints as non-peer-reviewed until published",
    url: "https://arxiv.org/",
  },
  numericalRecipesCaveat: {
    label: "Interval / rigorous numerics references",
    locator: "e.g. Tucker, Validated Numerics — enclosures, not RH proofs",
  },
} as const satisfies Record<string, InvestigationReading>;

export const APPROVED_READING_HOSTS = [
  "dlmf.nist.gov",
  "www.claymath.org",
  "claymath.org",
  "www.ams.org",
  "ams.org",
  "aimath.org",
  "www.aimath.org",
  "www.lmfdb.org",
  "lmfdb.org",
  "arxiv.org",
  "www.arxiv.org",
] as const;

export function readingHost(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    return u.hostname;
  } catch {
    return null;
  }
}

export function isApprovedReadingUrl(url: string): boolean {
  const host = readingHost(url);
  if (!host) return false;
  return (APPROVED_READING_HOSTS as readonly string[]).includes(host);
}
