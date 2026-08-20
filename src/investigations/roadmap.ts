import { R } from "./readings";
import type { InvestigationLesson, InvestigationStage } from "./types";

function L(lesson: InvestigationLesson): InvestigationLesson {
  return lesson;
}

/**
 * Riemann Hypothesis mastery roadmap — 100 ordered investigation items in 8 stages.
 * Study materials are item-specific. This is a personal learning path, not a claim that the app proves RH.
 */
export const INVESTIGATION_STAGES: readonly InvestigationStage[] = [
  {
    id: "inv-foundations",
    title: "Foundations",
    goal: "Build the language, analysis, algebra and numerics needed for later stages.",
    fromId: 1,
    toId: 12,
    orientation: "Stage 1 builds proof hygiene, analysis, algebra, probability, and numerical honesty. Nothing here mentions the critical line yet — that is intentional. Weak foundations make every later contour shift look like magic.",
    readings: [R.babyRudin, R.steinShakarchiReal, R.sergeLangAlgebra, R.numericalRecipesCaveat],
    lessons: [
  L({
    id: 1,
    title: "Logic, quantifiers, induction, contradiction, and mathematical writing",
    outcome: "Write quantified statements and proofs by induction or contradiction cleanly.",
    claims: [
        { text: "A correctly quantified statement has a definite truth value in a fixed universe of discourse.", status: "theorem" }
    ],
    concept: "Quantifiers and proof patterns",
    explanation: "Mathematics is written with explicit quantifiers. Direct proof, induction, and contradiction turn informal ideas into checkable arguments.",
    whyItMatters: "RH is itself a universally quantified claim about nontrivial zeros. Later error-term and equivalence statements stand or fall with their quantifiers.",
    task: { prompt: "Rewrite three informal sentences about primes as fully quantified statements; prove one by induction and one by contradiction.", hint: "Fix the universe of discourse before quantifying.", answer: "“Infinitely many primes” becomes ∀N∈ℕ ∃p (p prime ∧ p>N). Induction needs an explicit predicate P(n)." },
    prerequisites: [],
    readings: [R.babyRudin],
  }),
  L({
    id: 2,
    title: "Sets, functions, countability, equivalence relations",
    outcome: "Classify sets as finite, countable or uncountable and work with quotients by equivalence relations.",
    claims: [
        { text: "The rationals are countable; the reals are not.", status: "theorem" }
    ],
    concept: "Sets, maps, and countability",
    explanation: "Injections, surjections, and equivalence relations organise objects; countability separates ℤ,ℚ from ℝ.",
    whyItMatters: "Prime sums are discrete; contour integrals are continuous. Moving fluently between these worlds is permanent infrastructure.",
    task: { prompt: "Prove ℚ is countable and (0,1) is uncountable; identify ℝ/ℤ with a circle.", hint: "Enumerate ℚ by height; use Cantor diagonalisation on (0,1).", answer: "Any listed sequence in (0,1) misses a digit-flipped real; ℚ is a countable union of finite sets of fixed height." },
    prerequisites: [1],
    readings: [R.babyRudin],
  }),
  L({
    id: 3,
    title: "Linear algebra: vector spaces, duality, eigenvalues, inner products",
    outcome: "Compute dual bases, eigenvalues and orthonormal expansions in finite dimensions.",
    claims: [
        { text: "A self-adjoint operator on a finite-dimensional inner-product space is unitarily diagonalisable.", status: "theorem" }
    ],
    concept: "Finite-dimensional spectra",
    explanation: "Self-adjoint matrices have real eigenvalues and orthonormal eigenbases — the model spectral theorem.",
    whyItMatters: "Hilbert–Pólya dreams and GUE analogies are spectral narratives. Finite-dimensional clarity prevents category errors later.",
    task: { prompt: "Orthogonally diagonalise a real symmetric 3×3 matrix and check eigenvector orthogonality.", hint: "Characteristic polynomial plus Gram–Schmidt on eigenspaces.", answer: "Distinct eigenvalues of a symmetric matrix have orthogonal eigenvectors; complete to an orthonormal basis." },
    prerequisites: [1, 2],
    readings: [R.babyRudin],
  }),
  L({
    id: 4,
    title: "Single- and multivariable calculus",
    outcome: "Differentiate under the integral sign in routine cases and apply the chain and inverse-function rules.",
    claims: [
        { text: "On an open set in R^n, continuous partials imply differentiability.", status: "theorem" }
    ],
    concept: "Calculus operations",
    explanation: "Chain rule, inverse functions, and differentiation under the integral sign are the everyday engine of analysis.",
    whyItMatters: "Perron integrals and parameter derivatives of Dirichlet series are calculus. Weak justifications cascade into false contour shifts.",
    task: { prompt: "Evaluate d/dα ∫_a^b e^{−αx} dx two ways for α>0.", hint: "Uniform bound of |x e^{−αx}| on [a,b] for α in a compact set of (0,∞).", answer: "Closed form (e^{−αa}−e^{−αb})/α; derivative matches ∫ −x e^{−αx} dx." },
    prerequisites: [1, 2],
    readings: [R.babyRudin],
  }),
  L({
    id: 5,
    title: "Sequences and series: absolute, conditional, and uniform convergence",
    outcome: "Distinguish absolute, conditional and uniform convergence and justify termwise limits.",
    claims: [
        { text: "Absolute convergence implies convergence; the converse fails in general.", status: "theorem" }
    ],
    concept: "Modes of convergence",
    explanation: "Absolute/conditional and pointwise/uniform convergence control rearrangements and termwise limits.",
    whyItMatters: "The Euler product for ζ is an absolute-convergence story on Re(s)>1. Wrong half-planes produce nonsense identities.",
    task: { prompt: "Exhibit a conditionally convergent series and a pointwise-but-not-uniform limit on (0,1).", hint: "Alternating harmonic; f_n(x)=x^n.", answer: "Σ (−1)^{n+1}/n converges conditionally. x^n→0 on [0,1) not uniformly on [0,1)." },
    prerequisites: [4],
    readings: [R.babyRudin],
  }),
  L({
    id: 6,
    title: "Real analysis: limits, continuity, differentiation, compactness",
    outcome: "Use compactness and completeness to extract convergent subsequences and extrema.",
    claims: [
        { text: "A continuous real function on a compact set attains its bounds.", status: "theorem" }
    ],
    concept: "Compactness in analysis",
    explanation: "Compact sets yield convergent subsequences and attained extrema; they underwrite extreme-value and covering arguments.",
    whyItMatters: "Argument-principle contours are compact; maximum-modulus is a compactness theorem in holomorphic disguise.",
    task: { prompt: "Prove continuous functions on [a,b] are uniformly continuous and attain maxima.", hint: "Bolzano–Weierstrass on a maximising sequence.", answer: "Convergent subsequence + continuity ⇒ maximum attained; uniform continuity via Lebesgue number or sequential argument." },
    prerequisites: [4, 5],
    readings: [R.babyRudin],
  }),
  L({
    id: 7,
    title: "Metric spaces and completeness",
    outcome: "Recognise complete metric spaces and apply the contraction-mapping theorem.",
    claims: [
        { text: "Every contraction on a complete metric space has a unique fixed point.", status: "theorem" }
    ],
    concept: "Completeness and contractions",
    explanation: "Complete metric spaces support limit constructions; contractions give unique fixed points by Picard iteration.",
    whyItMatters: "Function spaces for Dirichlet polynomials and L² criteria are complete. Fixed-point language reappears in iterative numerical methods.",
    task: { prompt: "Prove the contraction-mapping theorem; apply it to T(x)=cos(x)/2 on ℝ.", hint: "Estimate d(T^n x, T^n y) ≤ k^n d(x,y).", answer: "Iterates are Cauchy; completeness produces a unique fixed point." },
    prerequisites: [6],
    readings: [R.babyRudin],
  }),
  L({
    id: 8,
    title: "Measure theory and Lebesgue integration",
    outcome: "Construct the Lebesgue integral and compare it with the Riemann integral on standard examples.",
    claims: [
        { text: "Bounded Riemann-integrable functions on [a,b] are Lebesgue integrable with the same integral.", status: "theorem" }
    ],
    concept: "Lebesgue integration",
    explanation: "Lebesgue’s integral handles discontinuous functions and supports powerful limit theorems beyond Riemann theory.",
    whyItMatters: "Mean-square theory of ζ and L² forms of RH criteria require Lebesgue spaces.",
    task: { prompt: "Show 1_ℚ on [0,1] is Lebesgue integrable with integral 0 but not Riemann integrable.", hint: "Countable sets have measure zero.", answer: "Upper/lower Riemann sums disagree on 1_ℚ; Lebesgue integral sees a null set." },
    prerequisites: [6, 7],
    readings: [R.steinShakarchiReal],
  }),
  L({
    id: 9,
    title: "Lp spaces; dominated and monotone convergence; Fubini-Tonelli",
    outcome: "Apply MCT, DCT and Fubini–Tonelli to justify exchanges of limits and integrals.",
    claims: [
        { text: "For non-negative measurable functions, Fubini–Tonelli permits free rearrangement of iterated integrals.", status: "theorem" }
    ],
    concept: "Integral limit theorems",
    explanation: "MCT, DCT, and Fubini–Tonelli legally swap limits, sums, and iterated integrals.",
    whyItMatters: "Every serious contour-shift remainder estimate eventually cites one of these theorems.",
    task: { prompt: "Give a DCT application and a counterexample when no integrable dominant exists.", hint: "Spikes of height n and width 1/n².", answer: "Pointwise limit 0 with integrals → 0 under DCT; without domination integrals may stay positive." },
    prerequisites: [8],
    readings: [R.steinShakarchiReal],
  }),
  L({
    id: 10,
    title: "Abstract algebra: groups, rings, fields, quotient structures",
    outcome: "Work with homomorphisms, kernels and quotient groups/rings used later for characters and fields.",
    claims: [
        { text: "The first isomorphism theorem identifies the image of a homomorphism with the domain modulo the kernel.", status: "theorem" }
    ],
    concept: "Algebraic quotients",
    explanation: "Groups, rings, and quotients encode modular arithmetic and symmetry.",
    whyItMatters: "Dirichlet characters are group homomorphisms on units mod q. Algebra here is not optional culture — it is the definition.",
    task: { prompt: "Prove the first isomorphism theorem; identify (ℤ/8ℤ)^×.", hint: "Kernels of group homs are normal.", answer: "(ℤ/8ℤ)^× ≅ C₂×C₂; G/ker φ ≅ im φ." },
    prerequisites: [2],
    readings: [R.sergeLangAlgebra],
  }),
  L({
    id: 11,
    title: "Elementary probability and statistics",
    outcome: "Compute expectations and variances and state the weak law for i.i.d. samples.",
    claims: [
        { text: "For i.i.d. finite-variance random variables, sample means concentrate about the expectation.", status: "theorem" }
    ],
    concept: "Expectation and variance",
    explanation: "Expectation, variance, and concentration describe typical behaviour of random models.",
    whyItMatters: "Random-matrix comparisons for zeros are models, not theorems. Probability literacy keeps the epistemic status honest.",
    task: { prompt: "Compute E and Var for Bernoulli(p); state the weak law.", hint: "Use indicators for events.", answer: "E=p, Var=p(1−p); sample means converge in probability to p." },
    prerequisites: [5, 8],
    readings: [R.babyRudin],
  }),
  L({
    id: 12,
    title: "Numerical analysis: conditioning, rounding and truncation error, interval arithmetic",
    outcome: "Bound forward error from conditioning and use interval arithmetic for rigorous enclosures.",
    claims: [
        { text: "Interval arithmetic yields rigorous enclosures when operations and outward rounding are implemented correctly.", status: "theorem" }
    ],
    concept: "Numerical error and enclosures",
    explanation: "Conditioning, rounding, truncation, and interval arithmetic separate pictures from certificates.",
    whyItMatters: "Published zero verifications matter only with rigorous error control. Numerics never prove RH.",
    task: { prompt: "Enclose a partial harmonic sum with outward rounding; explain forward vs backward error for Horner evaluation.", hint: "Each operation expands intervals outward.", answer: "A correct enclosure contains the true value; width reflects accumulated uncertainty — still finite evidence only." },
    prerequisites: [5, 6],
    readings: [R.numericalRecipesCaveat],
  })
    ],
  },
  {
    id: "inv-complex-harmonic",
    title: "Complex and harmonic analysis",
    goal: "Master complex integration, entire/meromorphic function theory and Fourier\u2013Mellin tools.",
    fromId: 13,
    toId: 26,
    orientation: "Stage 2 is the analytic engine: Cauchy theory, continuation, Γ, Fourier/Mellin, and Poisson summation. Riemann’s functional equation lives here long before prime-number applications.",
    readings: [R.babyAhlfors, R.steinShakarchiComplex, R.steinShakarchiFourier, R.dlmfGamma, R.dlmfZeta, R.edwards],
    lessons: [
  L({
    id: 13,
    title: "Complex differentiation, Cauchy-Riemann equations, conformal maps",
    outcome: "Check holomorphicity via Cauchy–Riemann and recognise basic conformal maps.",
    claims: [
        { text: "Complex differentiability on an open set is equivalent to the Cauchy–Riemann system with continuous partials (or to holomorphicity).", status: "theorem" }
    ],
    concept: "Holomorphic functions",
    explanation: "Complex differentiability is rigid: Cauchy–Riemann, conformality, and power series come as a package on open sets.",
    whyItMatters: "ζ is a meromorphic function on ℂ. Holomorphicity constraints shape every identity you will use.",
    task: { prompt: "Verify CR for z² and e^z; show u(x,y)=x is not holomorphic.", hint: "Write f=u+iv and check the CR system.", answer: "z² and e^z satisfy CR globally; u=x with v=0 fails CR." },
    prerequisites: [4, 6],
    readings: [R.babyAhlfors, R.steinShakarchiComplex],
  }),
  L({
    id: 14,
    title: "Cauchy's theorem and integral formula",
    outcome: "Evaluate contour integrals with Cauchy's theorem and recover values from the integral formula.",
    claims: [
        { text: "If f is holomorphic inside and on a simple positively oriented contour, ∮ f = 0.", status: "theorem" }
    ],
    concept: "Cauchy integral theorem",
    explanation: "Holomorphic contour integrals vanish; Cauchy's formula recovers values and derivatives from boundary data.",
    whyItMatters: "Zero counting, residues, and almost all ζ contour moves rest on Cauchy theory.",
    task: { prompt: "Compute ∮_{|z|=1} z^n dz for n∈ℤ and recover e^0 from Cauchy's formula.", hint: "Parametrise z=e^{iθ}.", answer: "∫ z^n dz = 2πi δ_{n,−1}; f(a)=(1/2πi)∮ f(z)/(z−a) dz." },
    prerequisites: [13],
    readings: [R.babyAhlfors, R.steinShakarchiComplex],
  }),
  L({
    id: 15,
    title: "Power and Laurent series; isolated singularities",
    outcome: "Classify isolated singularities and extract principal parts.",
    claims: [
        { text: "Every holomorphic function on an annulus has a unique Laurent expansion there.", status: "theorem" }
    ],
    concept: "Laurent series",
    explanation: "Isolated singularities are removable, poles, or essential according to the Laurent principal part.",
    whyItMatters: "ζ has one simple pole at s=1. Classifying singularities is basic literacy for meromorphic continuation.",
    task: { prompt: "Classify 0 for 1/z, e^{1/z}, and sin(z)/z; extract the principal part of 1/z²(z−1) at 0.", hint: "Study lim z^k f(z) as z→0.", answer: "1/z simple pole; e^{1/z} essential; sin(z)/z removable." },
    prerequisites: [14],
    readings: [R.babyAhlfors],
  }),
  L({
    id: 16,
    title: "Residue theorem and contour deformation",
    outcome: "Compute residues and deform contours past poles under dominated growth hypotheses.",
    claims: [
        { text: "The integral of a meromorphic form is 2πi times the sum of enclosed residues.", status: "theorem" }
    ],
    concept: "Residues",
    explanation: "Residues evaluate integrals; deformation is legal when growth on escaping arcs vanishes.",
    whyItMatters: "Explicit formulae and Perron integrals are residue calculus on ζ′/ζ and x^s/s.",
    task: { prompt: "Evaluate ∫_{−∞}^{∞} dx/(1+x²) by residues with a justified semicircle.", hint: "Residue at z=i equals 1/(2i).", answer: "Closing upper half-plane yields π." },
    prerequisites: [15],
    readings: [R.babyAhlfors, R.steinShakarchiComplex],
  }),
  L({
    id: 17,
    title: "Argument principle and Rouche's theorem",
    outcome: "Count zeros and poles by change in argument and compare zero counts with Rouché.",
    claims: [
        { text: "The change in arg f along a contour equals 2π(N − P) for zeros and poles inside.", status: "theorem" }
    ],
    concept: "Argument principle",
    explanation: "Δ arg f counts zeros minus poles; Rouché compares zero counts of nearby holomorphic functions.",
    whyItMatters: "Riemann–von Mangoldt N(T) and machine certification of zeros are organised argument-principle counts.",
    task: { prompt: "Use Rouché to locate zeros of a monic polynomial inside a disc; compute winding of z² on |z|=1.", hint: "On a large circle the leading term dominates.", answer: "Winding number of z² about 0 along |z|=1 is 2." },
    prerequisites: [16],
    readings: [R.babyAhlfors, R.titchmarsh],
  }),
  L({
    id: 18,
    title: "Uniform convergence of holomorphic functions; Hurwitz's theorem",
    outcome: "Pass holomorphicity and zero limits through locally uniform limits.",
    claims: [
        { text: "A locally uniform limit of holomorphic functions is holomorphic (Weierstrass).", status: "theorem" }
    ],
    concept: "Holomorphic limits",
    explanation: "Locally uniform limits preserve holomorphicity; Hurwitz controls zeros of the limit.",
    whyItMatters: "Approximations to ζ by partial sums or smoothed Dirichlet polynomials need limit theorems before zero claims.",
    task: { prompt: "Prove a locally uniform limit of holomorphic functions on a disc is holomorphic.", hint: "Pass Cauchy integrals through the limit.", answer: "Morera or Cauchy formula under uniform convergence on compact circles." },
    prerequisites: [14, 15],
    readings: [R.steinShakarchiComplex],
  }),
  L({
    id: 19,
    title: "Gamma and beta functions; Stirling asymptotics",
    outcome: "Use Γ functional equations and Stirling to estimate factorials and Gamma on vertical lines.",
    claims: [
        { text: "Γ(z+1) = z Γ(z) for z outside the non-positive integers.", status: "theorem" }
    ],
    concept: "Gamma function",
    explanation: "Γ extends factorials; Stirling describes vertical growth essential for convexity bounds.",
    whyItMatters: "Completed zeta multiplies ζ by π^{−s/2}Γ(s/2). Γ-growth is part of the functional equation’s architecture.",
    task: { prompt: "Derive Γ(z+1)=zΓ(z) for Re z>0 from the Euler integral; record Stirling’s leading log asymptotic.", hint: "Integrate by parts.", answer: "Poles of Γ sit at non-positive integers; Stirling gives log Γ(σ+it) ∼ (it+σ−1/2)log(it) − it on vertical lines." },
    prerequisites: [14, 16],
    readings: [R.dlmfGamma, R.steinShakarchiComplex],
  }),
  L({
    id: 20,
    title: "Analytic continuation and meromorphic functions",
    outcome: "Continue functions along chains of discs and identify meromorphic continuations.",
    claims: [
        { text: "Analytic continuation along a curve, when possible, is unique.", status: "theorem" }
    ],
    concept: "Analytic continuation",
    explanation: "Germs continue along overlapping discs; monodromy may appear when loops encircle singularities.",
    whyItMatters: "ζ is first defined for Re(s)>1 and continued meromorphically to ℂ — a theorem, not a slogan.",
    task: { prompt: "Continue log along the unit circle and describe monodromy; contrast a single-valued branch on a cut plane.", hint: "Track argument along the path.", answer: "log gains 2πi around 0; continuation along a fixed curve is unique." },
    prerequisites: [15, 18],
    readings: [R.babyAhlfors, R.edwards],
  }),
  L({
    id: 21,
    title: "Entire functions, order, Jensen's formula, Hadamard products",
    outcome: "Read genus/order from zero asymptotics and write Hadamard factorisations in model cases.",
    claims: [
        { text: "An entire function of finite order admits a Hadamard product over its zeros.", status: "theorem" }
    ],
    concept: "Hadamard factorisation",
    explanation: "Order and genus organise entire functions; Hadamard products factor them over zeros.",
    whyItMatters: "ξ is entire of order 1. Its product over zeros is the structural source of explicit formulae.",
    task: { prompt: "Show sin(πz) has order 1 and match its infinite product to the Hadamard form.", hint: "Use M(r) growth of |sin| on |z|=r.", answer: "sin(πz)=πz ∏_{n=1}^∞ (1−z²/n²)." },
    prerequisites: [19, 20],
    readings: [R.steinShakarchiComplex, R.titchmarsh],
  }),
  L({
    id: 22,
    title: "Maximum-modulus, three-lines, and Phragmen-Lindelof principles",
    outcome: "Bound holomorphic functions on strips and angles via Phragmén–Lindelöf.",
    claims: [
        { text: "A holomorphic function on a bounded domain attains its maximum modulus on the boundary.", status: "theorem" }
    ],
    concept: "Phragmén–Lindelöf",
    explanation: "Boundary modulus bounds extend into strips when growth at infinity is controlled.",
    whyItMatters: "Classical convexity bounds for ζ on the critical line are Phragmén–Lindelöf on a strip.",
    task: { prompt: "State the three-lines theorem and apply it to a bounded holomorphic function on a strip.", hint: "Log-convexity of vertical sup-norms.", answer: "Intermediate vertical lines obey a geometric mean bound between the edges." },
    prerequisites: [18, 19],
    readings: [R.steinShakarchiComplex, R.titchmarsh],
  }),
  L({
    id: 23,
    title: "Fourier series and Fourier transform",
    outcome: "Compute Fourier transforms of Schwartz-class examples and invert them.",
    claims: [
        { text: "The Fourier transform is an automorphism of the Schwartz class with continuous inverse.", status: "theorem" }
    ],
    concept: "Fourier transform",
    explanation: "Fourier analysis exchanges decay and smoothness; inversion recovers Schwartz functions.",
    whyItMatters: "The functional equation of ζ is a Fourier/Mellin identity at heart (theta ↔ dual theta).",
    task: { prompt: "Compute the Fourier transform of e^{−πx²} and verify the eigenfunction property.", hint: "Complete the square or use f′=−2πx f.", answer: "Under standard normalisation the Gaussian is fixed by the Fourier transform." },
    prerequisites: [9, 14],
    readings: [R.steinShakarchiFourier],
  }),
  L({
    id: 24,
    title: "Schwartz functions, convolution, Plancherel, distributions",
    outcome: "Use Plancherel and distributional derivatives on tempered distributions.",
    claims: [
        { text: "Plancherel identifies L2 Fourier transform as a unitary operator.", status: "theorem" }
    ],
    concept: "Plancherel theory",
    explanation: "Plancherel unitarity and tempered distributions extend Fourier analysis beyond Schwartz functions.",
    whyItMatters: "Explicit formulae are often distributional pairings of test functions against zeros and primes.",
    task: { prompt: "Prove Plancherel on the Schwartz class; identify the distributional derivative of the Heaviside function.", hint: "Polarisation from L² norms of Fourier transforms.", answer: "H′=δ_0 as tempered distributions." },
    prerequisites: [23],
    readings: [R.steinShakarchiFourier, R.steinShakarchiReal],
  }),
  L({
    id: 25,
    title: "Poisson summation and the Jacobi theta function",
    outcome: "Apply Poisson summation to theta and recognise the modular transformation.",
    claims: [
        { text: "Poisson summation equates the sum of a Schwartz function over Z with the sum of its Fourier transform over Z.", status: "theorem" }
    ],
    concept: "Poisson summation",
    explanation: "Lattice sums equal dual lattice sums; Jacobi theta transforms with a modular factor √t.",
    whyItMatters: "Riemann’s theta route to the functional equation is the classical path to ξ(s)=ξ(1−s).",
    task: { prompt: "Derive θ(1/t)=√t θ(t) for θ(t)=Σ_{n∈ℤ} e^{−π n² t}.", hint: "Poisson-sum the Gaussian with variance tied to t.", answer: "Fourier transform contributes t^{−1/2}; summing over ℤ yields the modular identity." },
    prerequisites: [23, 24],
    readings: [R.steinShakarchiFourier, R.edwards, R.dlmfZeta],
  }),
  L({
    id: 26,
    title: "Mellin transform and Mellin inversion",
    outcome: "Move between Dirichlet series / arithmetic sums and Mellin integrals.",
    claims: [
        { text: "Under standard integrability hypotheses, Mellin inversion recovers a function from its Mellin transform.", status: "theorem" }
    ],
    concept: "Mellin transform",
    explanation: "Mellin is Fourier analysis on the multiplicative group; it links arithmetic sums to vertical integrals.",
    whyItMatters: "Perron’s formula and θ↦ξ are Mellin inversions — the bridge from primes to complex analysis.",
    task: { prompt: "Show the Mellin transform of e^{−x} is Γ(s) for Re s>0; state inversion on a vertical line.", hint: "∫_0^∞ x^{s−1} e^{−x} dx.", answer: "Inversion reconstructs f(x) from (1/2πi)∫ F(s) x^{−s} ds in the fundamental strip." },
    prerequisites: [19, 23, 25],
    readings: [R.apostolAnt, R.titchmarsh],
  })
    ],
  },
  {
    id: "inv-multiplicative",
    title: "Multiplicative number theory",
    goal: "Control arithmetic functions, Euler products and elementary prime distribution.",
    fromId: 27,
    toId: 36,
    orientation: "Stage 3 is the arithmetic side: congruences, multiplicative functions, elementary prime counting, and Dirichlet characters. Euler products become legitimate theorems on Re(s)>1.",
    readings: [R.apostolAnt, R.montgomeryVaughan, R.irelandRosen, R.ingham, R.davenport],
    lessons: [
  L({
    id: 27,
    title: "Divisibility, congruences, Chinese remainder theorem",
    outcome: "Solve simultaneous congruences and factor modular arithmetic via CRT.",
    claims: [
        { text: "If moduli are pairwise coprime, the Chinese remainder theorem gives a ring isomorphism to the product of Z/nZ.", status: "theorem" }
    ],
    concept: "Congruences and CRT",
    explanation: "Modular arithmetic and the Chinese remainder theorem decompose problems along prime-power moduli.",
    whyItMatters: "Characters, conductors, and Euler products are organised by prime powers. CRT is the glue.",
    task: { prompt: "Solve x≡2 (mod 3), x≡3 (mod 5), x≡2 (mod 7); identify ℤ/15ℤ with ℤ/3ℤ×ℤ/5ℤ.", hint: "Build x via weighted idempotents m_i y_i a_i.", answer: "Unique class mod 105; ring iso when moduli are coprime." },
    prerequisites: [10],
    readings: [R.irelandRosen, R.apostolAnt],
  }),
  L({
    id: 28,
    title: "Quadratic reciprocity and finite-field basics",
    outcome: "Evaluate Legendre symbols with quadratic reciprocity.",
    claims: [
        { text: "Quadratic reciprocity relates (p/q) and (q/p) for distinct odd primes.", status: "theorem" }
    ],
    concept: "Quadratic reciprocity",
    explanation: "Legendre symbols detect squares mod p; quadratic reciprocity swaps the primes.",
    whyItMatters: "Dirichlet L-functions for quadratic characters are the first family beyond ζ. Reciprocity makes them computable.",
    task: { prompt: "Evaluate (19/23) using quadratic reciprocity; count squares in F_11.", hint: "Reduce via (p/q)(q/p)=(-1)^{(p-1)(q-1)/4}.", answer: "Work the sign carefully; list 0²..5² mod 11 for squares." },
    prerequisites: [27],
    readings: [R.irelandRosen],
  }),
  L({
    id: 29,
    title: "Arithmetic functions and Dirichlet convolution",
    outcome: "Manipulate arithmetic functions under Dirichlet convolution.",
    claims: [
        { text: "Dirichlet convolution makes arithmetic functions into a ring with identity ε.", status: "theorem" }
    ],
    concept: "Dirichlet convolution",
    explanation: "Arithmetic functions form a ring under Dirichlet convolution (f∗g)(n)=Σ_{ab=n} f(a)g(b).",
    whyItMatters: "Möbius inversion, Euler products, and Dirichlet series multiplication are convolution in different clothes.",
    task: { prompt: "Show ε∗f=f; compute μ∗1 and verify it is ε.", hint: "Check on prime powers first for multiplicative functions.", answer: "(μ∗1)(n)=Σ_{d|n} μ(d)=1_{n=1}." },
    prerequisites: [27],
    readings: [R.apostolAnt, R.montgomeryVaughan],
  }),
  L({
    id: 30,
    title: "Mobius inversion",
    outcome: "Invert multiplicative relations with Möbius inversion.",
    claims: [
        { text: "Möbius inversion recovers f from g when g = f ∗ 1, via f = g ∗ μ.", status: "theorem" }
    ],
    concept: "Möbius inversion",
    explanation: "If g=f∗1 then f=g∗μ. This is the discrete inclusion-exclusion engine of multiplicative number theory.",
    whyItMatters: "Relations among ψ, θ, and prime indicators repeatedly invert via μ. Explicit formulae need this fluency.",
    task: { prompt: "From Σ_{d|n} f(d)=n recover f; invert g(n)=Σ_{d|n} φ(d).", hint: "Apply f=g∗μ.", answer: "f=φ when g(n)=n; conversely Σ_{d|n} φ(d)=n." },
    prerequisites: [29],
    readings: [R.apostolAnt],
  }),
  L({
    id: 31,
    title: "The functions mu(n), Lambda(n), d(n), phi(n), sigma(n)",
    outcome: "Compute the classical arithmetic functions and their Dirichlet series on Re(s) > 1.",
    claims: [
        { text: "Σ_{d|n} μ(d) = 1 if n = 1 and 0 otherwise.", status: "theorem" }
    ],
    concept: "Classical arithmetic functions",
    explanation: "μ, Λ, d, φ, σ are the standard multiplicative toolkit; each has a Dirichlet series built from ζ on Re(s)>1.",
    whyItMatters: "Prime-detecting Λ and Möbius μ are the arithmetic side of explicit formulae pairing with zeros.",
    task: { prompt: "Tabulate μ,Λ,φ for n≤20; write Dirichlet series for 1, μ, and Λ in terms of ζ for Re(s)>1.", hint: "Multiplicative ⇒ determine on prime powers.", answer: "Σ μ(n)n^{−s}=1/ζ(s); Σ Λ(n)n^{−s}=−ζ′/ζ(s) for Re(s)>1." },
    prerequisites: [29, 30],
    readings: [R.apostolAnt, R.dlmfZeta],
  }),
  L({
    id: 32,
    title: "Multiplicative functions and Euler products",
    outcome: "Recognise when a Dirichlet series factors as an Euler product.",
    claims: [
        { text: "A multiplicative f yields an Euler product for its Dirichlet series in the absolute-convergence half-plane.", status: "theorem" }
    ],
    concept: "Euler products",
    explanation: "Completely multiplicative structure turns Dirichlet series into products over primes.",
    whyItMatters: "ζ(s)=∏ (1−p^{−s})^{−1} on Re(s)>1 is the model Euler product. All later L-functions begin here.",
    task: { prompt: "Prove that a multiplicative f gives an Euler product for Σ f(n)n^{−s} in the absolute half-plane.", hint: "Expand the product of geometric series over primes.", answer: "Unique factorisation matches expanded Euler factors to n-sums." },
    prerequisites: [31, 5],
    readings: [R.apostolAnt, R.montgomeryVaughan],
  }),
  L({
    id: 33,
    title: "Partial and Abel summation",
    outcome: "Convert sums over primes or integers into integrals against counting functions.",
    claims: [
        { text: "Abel summation is the discrete analogue of integration by parts.", status: "theorem" }
    ],
    concept: "Abel summation",
    explanation: "Partial summation converts Σ_{n≤x} a_n f(n) into integrals against A(x)=Σ_{n≤x} a_n.",
    whyItMatters: "Passing between π(x), θ(x), ψ(x) and Dirichlet series coefficients is almost always Abel summation.",
    task: { prompt: "Derive Σ_{n≤x} 1/n = log x + γ + o(1) outline via Abel summation from the floor function.", hint: "Write A(x)=⌊x⌋ and integrate f=1/t.", answer: "∫_1^x (⌊t⌋/t²) dt produces log x plus a convergent error encoding γ." },
    prerequisites: [4, 31],
    readings: [R.apostolAnt, R.ingham],
  }),
  L({
    id: 34,
    title: "Prime-counting functions pi(x), theta(x), and psi(x)",
    outcome: "Relate π, θ and ψ and state their elementary comparison inequalities.",
    claims: [
        { text: "θ(x) and ψ(x) are within O(x^{1/2} log x) of each other under elementary estimates.", status: "theorem" }
    ],
    concept: "Prime counting functions",
    explanation: "π counts primes; θ sums log p; ψ sums Λ. They are elementary equivalents up to lower-order comparisons.",
    whyItMatters: "PNT is cleanest as ψ(x)∼x. RH-quality errors are often stated for ψ first.",
    task: { prompt: "Prove elementary inequalities relating π, θ, and ψ (e.g. θ(x) ≤ ψ(x) and comparisons with π log).", hint: "Compare prime and prime-power contributions in ψ−θ.", answer: "ψ−θ = Σ_{k≥2} θ(x^{1/k}) is O(√x log x) elementarily." },
    prerequisites: [33, 31],
    readings: [R.apostolAnt, R.ingham, R.davenport],
  }),
  L({
    id: 35,
    title: "Chebyshev estimates and elementary prime-distribution arguments",
    outcome: "Prove Chebyshev bounds c1 x ≤ θ(x) ≤ c2 x with explicit elementary methods.",
    claims: [
        { text: "Chebyshev's estimates give explicit constants with θ(x) ≍ x.", status: "theorem" }
    ],
    concept: "Chebyshev bounds",
    explanation: "Elementary binomial-coefficient arguments already give θ(x) ≍ x without complex analysis.",
    whyItMatters: "Chebyshev’s bounds show the PNT scale is correct long before complex zeros enter. They calibrate what RH would refine.",
    task: { prompt: "Outline Chebyshev’s upper and lower bounds for θ(x) via central binomial coefficients.", hint: "Study the prime factors of (2n choose n).", answer: "2^{2n}/(2n+1) ≤ (2n choose n) ≤ 2^{2n} yields log-scale constraints on θ(2n)−θ(n)." },
    prerequisites: [34],
    readings: [R.apostolAnt, R.ingham],
  }),
  L({
    id: 36,
    title: "Dirichlet characters and primes in arithmetic progressions",
    outcome: "Define characters mod q and state Dirichlet's theorem on primes in progressions.",
    claims: [
        { text: "Dirichlet's theorem: each reduced residue class mod q contains infinitely many primes.", status: "theorem" }
    ],
    concept: "Dirichlet characters",
    explanation: "Characters mod q are homs (ℤ/qℤ)^×→ℂ^×; L-series package primes in progressions.",
    whyItMatters: "GRH is RH for these L-functions. Dirichlet’s theorem is the first great arithmetic payoff of L-functions.",
    task: { prompt: "List characters mod 5; sketch why L(1,χ)≠0 for nontrivial χ implies infinitely many primes in progressions.", hint: "Euler product for L(s,χ) at s→1⁺.", answer: "Non-vanishing at s=1 prevents a zero from cancelling the pole of ζ in the indicator of a residue class." },
    prerequisites: [10, 32, 34],
    readings: [R.davenport, R.irelandRosen, R.montgomeryVaughan],
  })
    ],
  },
  {
    id: "inv-core-ant",
    title: "Core analytic number theory",
    goal: "Develop zeta, explicit formulae, zero-free regions and classical critical-line technology.",
    fromId: 37,
    toId: 55,
    orientation: "Stage 4 is the classical ζ core: continuation, ξ, PNT, explicit formulae, zero-free regions, Hardy Z, and density theorems. RH is stated here as an open conjecture among many proved neighbours.",
    readings: [R.titchmarsh, R.edwards, R.davenport, R.ingham, R.dlmfZeta, R.conreyAms, R.clayRh, R.iwaniecKowalski],
    lessons: [
  L({
    id: 37,
    title: "Dirichlet series: convergence abscissae and coefficient recovery",
    outcome: "Locate abscissae of convergence and recover coefficients by Perron-type integrals.",
    claims: [
        { text: "A Dirichlet series has a half-plane of absolute convergence bounded by a vertical abscissa.", status: "theorem" }
    ],
    concept: "Dirichlet series abscissae",
    explanation: "Each Dirichlet series has abscissae of simple and absolute convergence; coefficients recover from integrals.",
    whyItMatters: "ζ and L-functions are Dirichlet series before they are special functions. Abscissae mark where formal identities are theorems.",
    task: { prompt: "For Σ n^{−s}, identify absolute convergence on Re s>1; outline coefficient recovery by a truncated Perron integral.", hint: "Integrate x^s/s against the series on a vertical line.", answer: "Absolute convergence for Re s>1; Perron recovers partial sums from a vertical integral of D(s)x^s/s." },
    prerequisites: [26, 32],
    readings: [R.apostolAnt, R.titchmarsh],
  }),
  L({
    id: 38,
    title: "Euler products and their legitimate convergence domain",
    outcome: "Justify Euler products inside the absolute-convergence region only.",
    claims: [
        { text: "For ζ, the Euler product equals the series for Re(s) > 1.", status: "theorem" }
    ],
    concept: "Euler product domain",
    explanation: "Euler products equal Dirichlet series only where absolute convergence justifies expanding geometric factors.",
    whyItMatters: "Writing ∏ (1−p^{−s})^{−1} for Re(s)≤1 without continuation is a common false step in RH crackpottery.",
    task: { prompt: "Prove ζ(s)=∏ (1−p^{−s})^{−1} for Re s>1; explain why the identity needs separate justification elsewhere.", hint: "Take finite Euler products and limit with absolute convergence.", answer: "On Re s>1 the tail of primes is small in ℓ¹; meromorphic continuation extends ζ, not the naive product equality." },
    prerequisites: [37, 32],
    readings: [R.apostolAnt, R.edwards],
  }),
  L({
    id: 39,
    title: "Perron's formula, Mellin inversion, contour shifts",
    outcome: "Move contours past poles and collect residues to express arithmetic sums.",
    claims: [
        { text: "Perron's formula recovers partial sums of coefficients from a Dirichlet series integral.", status: "theorem" }
    ],
    concept: "Perron’s formula",
    explanation: "Perron expresses partial sums as vertical integrals of D(s)x^s/s; shifts pick up residues.",
    whyItMatters: "This is the master key from zeros of ζ to prime-counting errors.",
    task: { prompt: "Write a truncated Perron formula for Σ_{n≤x} 1 and identify the residue at s=1 after a contour shift for ζ(s)x^s/s.", hint: "Pole of ζ at s=1 gives residue x.", answer: "Main term x from res_{s=1}; remaining integral encodes error and depends on zero-free information." },
    prerequisites: [37, 26, 16],
    readings: [R.ingham, R.titchmarsh, R.davenport],
  }),
  L({
    id: 40,
    title: "Zeta for Re(s) > 1: series and Euler product",
    outcome: "Derive ζ(s) = Σ n^{-s} = Π (1 − p^{-s})^{-1} for Re(s) > 1.",
    claims: [
        { text: "The Euler product for ζ is valid throughout Re(s) > 1.", status: "theorem" }
    ],
    concept: "Zeta on Re(s)>1",
    explanation: "On Re(s)>1, ζ is both a series and an Euler product, holomorphic and non-vanishing there.",
    whyItMatters: "Everything about primes via ζ starts from this half-plane, then continues.",
    task: { prompt: "Prove non-vanishing of ζ on Re s>1 from the Euler product; deduce Σ μ(n)n^{−s}=1/ζ(s).", hint: "Each factor (1−p^{−s})≠0.", answer: "Product of non-zero holomorphics is non-zero; Möbius series is the reciprocal Euler product." },
    prerequisites: [38, 31],
    readings: [R.dlmfZeta, R.apostolAnt, R.clayRh],
  }),
  L({
    id: 41,
    title: "Analytic continuation by eta series, Euler-Maclaurin, theta methods",
    outcome: "Continue ζ beyond Re(s) > 1 by at least one classical method.",
    claims: [
        { text: "ζ admits a meromorphic continuation to C with a single simple pole at s = 1.", status: "theorem" }
    ],
    concept: "Continuation of zeta",
    explanation: "η(s)=(1−2^{1−s})ζ(s) continues past Re s>0; theta/Mellin and Euler–Maclaurin give full continuation.",
    whyItMatters: "Without continuation there is no critical strip and no RH to state.",
    task: { prompt: "Continue ζ to Re s>0 via the alternating η series and locate the pole at s=1.", hint: "η converges (conditionally) for Re s>0.", answer: "ζ=η/(1−2^{1−s}) meromorphic; simple pole where denominator vanishes at s=1 while η(1)=log 2≠0." },
    prerequisites: [40, 20, 25],
    readings: [R.edwards, R.titchmarsh, R.dlmfZeta],
  }),
  L({
    id: 42,
    title: "The pole at s = 1, residue 1, special values",
    outcome: "Compute res_{s=1} ζ(s) = 1 and evaluate selected special values.",
    claims: [
        { text: "ζ has a simple pole at s = 1 with residue 1.", status: "theorem" }
    ],
    concept: "Pole and special values",
    explanation: "res_{s=1} ζ=1; values at negative integers and even positives are classical.",
    whyItMatters: "The pole’s residue is the main term in prime-sum asymptotics. Special values connect to Bernoulli numbers, not to RH.",
    task: { prompt: "Prove the residue is 1 from the Laurent expansion or from η; compute ζ(2)=π²/6 as a named theorem.", hint: "Compare ζ(s)∼1/(s−1).", answer: "Harmonic numbers H_n ∼ log n + γ bridge to the residue; Basel problem gives ζ(2)." },
    prerequisites: [41],
    readings: [R.dlmfZeta, R.edwards, R.apostolAnt],
  }),
  L({
    id: 43,
    title: "Completed zeta xi(s) and xi(s) = xi(1-s)",
    outcome: "Define ξ and prove the functional equation ξ(s) = ξ(1 − s).",
    claims: [
        { text: "The completed zeta function satisfies ξ(s) = ξ(1 − s).", status: "theorem" }
    ],
    concept: "Completed zeta ξ",
    explanation: "ξ(s)=½s(s−1)π^{−s/2}Γ(s/2)ζ(s) is entire and satisfies ξ(s)=ξ(1−s).",
    whyItMatters: "Symmetry about Re s=1/2 is proved; RH asserts zeros lie on the symmetry line, not merely symmetrically.",
    task: { prompt: "Define ξ and outline the theta-function proof of ξ(s)=ξ(1−s).", hint: "Mellin-transform θ(t)−1 and use θ(1/t)=√t θ(t).", answer: "Functional equation follows from the modular transformation of θ; polynomial prefactors clear poles." },
    prerequisites: [41, 25, 19],
    readings: [R.edwards, R.titchmarsh, R.dlmfZeta, R.conreyAms],
  }),
  L({
    id: 44,
    title: "Trivial zeros and nontrivial-zero symmetry",
    outcome: "Locate trivial zeros and deduce symmetry of nontrivial zeros under s ↔ 1 − s.",
    claims: [
        { text: "Zeta has trivial zeros at the negative even integers.", status: "theorem" }
    ],
    concept: "Trivial zeros",
    explanation: "Γ-factors force trivial zeros at negative even integers; nontrivial zeros are symmetric under s↔1−s and conjugation.",
    whyItMatters: "RH concerns only nontrivial zeros. Confusing trivial zeros with the critical strip is a basic error.",
    task: { prompt: "Explain why ζ(−2k)=0; deduce that ρ nontrivial ⇒ 1−ρ and ρ̄ are zeros.", hint: "Poles of Γ(s/2) at s=−2k cancelled unless ζ clears them.", answer: "Functional equation plus real coefficients of the Dirichlet series give the symmetries." },
    prerequisites: [43, 19],
    readings: [R.dlmfZeta, R.edwards, R.titchmarsh],
  }),
  L({
    id: 45,
    title: "Critical strip and critical line",
    outcome: "State the critical strip 0 < Re(s) < 1 and the critical line Re(s) = 1/2.",
    claims: [
        { text: "The Riemann hypothesis asserts that every nontrivial zero has real part 1/2.", status: "conjecture" }
    ],
    concept: "Critical strip and RH",
    explanation: "Nontrivial zeros lie in 0<Re s<1; RH conjectures they all satisfy Re s=1/2.",
    whyItMatters: "This is the Clay problem. The app studies it; it does not prove it.",
    task: { prompt: "Draw the strip, mark trivial zeros, and write RH as a fully quantified statement with no extra claims.", hint: "Exclude poles and trivial zeros explicitly.", answer: "∀ρ (ζ(ρ)=0 ∧ 0<Re ρ<1 ⇒ Re ρ=1/2). Still open." },
    prerequisites: [44, 43],
    readings: [R.clayRh, R.conreyAms, R.aimathRh, R.dlmfZeta],
  }),
  L({
    id: 46,
    title: "Hadamard product and zeta'/zeta",
    outcome: "Write the Hadamard product for ξ and the logarithmic derivative ζ′/ζ.",
    claims: [
        { text: "ξ admits a Hadamard product over its zeros.", status: "theorem" }
    ],
    concept: "Hadamard product for ξ",
    explanation: "ξ(s)=ξ(0)∏_ρ (1−s/ρ) in Hadamard form (order 1); ζ′/ζ is a sum over zeros plus archimedean terms.",
    whyItMatters: "Explicit formulae begin from ζ′/ζ as a sum over ρ. This is the analytic side of the prime–zero dictionary.",
    task: { prompt: "Write ζ′/ζ(s) for Re s>1 as −Σ Λ(n)n^{−s}; equate with a sum over zeros via logarithmic differentiation of ξ.", hint: "Differentiate log ξ.", answer: "Arithmetic Dirichlet series for −ζ′/ζ matches a meromorphic expression with poles at zeros and at 0,1." },
    prerequisites: [43, 21, 31],
    readings: [R.titchmarsh, R.edwards, R.iwaniecKowalski],
  }),
  L({
    id: 47,
    title: "Zero-free line Re(s) = 1 and the prime number theorem",
    outcome: "Deduce the prime number theorem from ζ(1 + it) ≠ 0.",
    claims: [
        { text: "ζ(1 + it) ≠ 0 for real t, and this implies the prime number theorem.", status: "theorem" }
    ],
    concept: "PNT via zero-free line",
    explanation: "ζ≠0 on Re s=1, with a classical 3-4-1 non-vanishing argument, yields ψ(x)∼x.",
    whyItMatters: "PNT is proved; RH-quality error terms are not. Keep the statuses separate forever.",
    task: { prompt: "Outline why a zero at 1+it would force a zero of a related combination contradicting positivity of Dirichlet coefficients.", hint: "Study ζ(σ)³|ζ(σ+it)|⁴|ζ(σ+2it)| as σ→1⁺.", answer: "Non-vanishing on the line plus a contour-shift/Tauberian step yields PNT." },
    prerequisites: [46, 39, 40],
    readings: [R.davenport, R.ingham, R.conreyAms],
  }),
  L({
    id: 48,
    title: "Argument-principle zero counting and Riemann-von Mangoldt",
    outcome: "Apply the Riemann–von Mangoldt formula for N(T).",
    claims: [
        { text: "N(T) = (T/2π) log(T/2π) − T/2π + O(log T).", status: "theorem" }
    ],
    concept: "Zero counting N(T)",
    explanation: "N(T) counts nontrivial zeros with 0<Im ρ≤T; Riemann–von Mangoldt gives the main term from Δ arg ξ.",
    whyItMatters: "Density of zeros sets the scale of explicit-formula oscillations and of computational bookkeeping.",
    task: { prompt: "Sketch the argument-principle derivation of the main term of N(T) on a standard contour.", hint: "Track arg Γ and arg of the completed factor on horizontal/vertical sides.", answer: "Stirling’s change in arg Γ(s/2) produces (T/2π)log(T/2π)−T/2π." },
    prerequisites: [17, 43, 19],
    readings: [R.titchmarsh, R.edwards, R.iwaniecKowalski],
  }),
  L({
    id: 49,
    title: "Explicit formulas connecting primes and zeros",
    outcome: "State a classical explicit formula linking ψ(x) to zeros of ζ.",
    claims: [
        { text: "Explicit formulae express prime-power sums as sums over zeta zeros plus archimedean terms.", status: "theorem" }
    ],
    concept: "Explicit formulae",
    explanation: "ψ(x) equals x minus a sum over zeros x^ρ/ρ plus lower terms (in suitable forms).",
    whyItMatters: "This is the precise primes↔zeros dictionary. RH would optimise the size of x^ρ.",
    task: { prompt: "State a classical explicit formula for ψ(x) and identify the contribution of a single zero ρ.", hint: "Residue of −ζ′/ζ(s) x^s/s at s=ρ is −x^ρ/ρ.", answer: "Each zero contributes an oscillatory term x^ρ/ρ; real part of ρ controls growth." },
    prerequisites: [46, 39, 48],
    readings: [R.ingham, R.davenport, R.titchmarsh, R.conreyAms],
  }),
  L({
    id: 50,
    title: "Classical zero-free regions and PNT error terms",
    outcome: "Quote a classical zero-free region and the PNT error it implies.",
    claims: [
        { text: "A classical zero-free region of de la Vallée Poussin type yields ψ(x) = x + O(x exp(−c √log x)).", status: "theorem" }
    ],
    concept: "Zero-free regions",
    explanation: "Classical zero-free regions keep zeros a little left of Re s=1, giving sublinear PNT errors short of RH.",
    whyItMatters: "Even the best classical regions are far from the critical line. RH would replace exp(−c√log x) errors by roughly √x powers.",
    task: { prompt: "State a de la Vallée Poussin-type zero-free region and derive the shape of the resulting ψ-error.", hint: "Shift Perron contour to the edge of the region.", answer: "Width 1/log(|t|+2) classical regions produce exp(−c√log x) errors after optimisation." },
    prerequisites: [47, 49, 48],
    readings: [R.davenport, R.ingham, R.iwaniecKowalski],
  }),
  L({
    id: 51,
    title: "Dirichlet polynomials and approximate functional equations",
    outcome: "Use an approximate functional equation to evaluate zeta in the strip.",
    claims: [
        { text: "Approximate functional equations express zeta by two finite Dirichlet polynomials plus a remainder.", status: "theorem" }
    ],
    concept: "Approximate functional equations",
    explanation: "Inside the strip, ζ is approximately a Dirichlet polynomial plus a reflected dual polynomial.",
    whyItMatters: "Practical and theoretical evaluation of ζ(½+it) uses AFEs — including Riemann–Siegel.",
    task: { prompt: "Write the shape of an AFE for ζ(s) with two sums of lengths tied to |t|.", hint: "Lengths X and |t|/(2πX) balance the two sides.", answer: "Main terms Σ_{n≤X} n^{−s} and a reflected sum with χ(s) factor; remainder depends on smoothing." },
    prerequisites: [43, 22, 37],
    readings: [R.titchmarsh, R.iwaniecKowalski],
  }),
  L({
    id: 52,
    title: "Mean-value estimates and convexity bounds",
    outcome: "State convexity bounds for zeta on vertical lines in the strip.",
    claims: [
        { text: "The Phragmén–Lindelöf convexity principle yields the classical convexity bound for ζ on the critical line.", status: "theorem" }
    ],
    concept: "Convexity bounds",
    explanation: "Convexity interpolates growth between Re s>1 and the dual line via Phragmén–Lindelöf.",
    whyItMatters: "Lindelöf is stronger than convexity and follows from RH in related forms; convexity is unconditional.",
    task: { prompt: "Derive the convexity exponent for ζ(½+it) from bounds on Re s=1+δ and the dual line.", hint: "Apply three-lines to a suitably normalised ξ-factor times ζ.", answer: "Classical convexity gives ζ(½+it) ≪ |t|^{1/4+ε} (up to standard refinements of ε-language)." },
    prerequisites: [22, 43, 51],
    readings: [R.titchmarsh, R.iwaniecKowalski],
  }),
  L({
    id: 53,
    title: "Hardy Z-function and infinitely many critical-line zeros",
    outcome: "Define Z(t) and outline Hardy's theorem on infinitely many critical-line zeros.",
    claims: [
        { text: "There are infinitely many zeros of ζ on the critical line (Hardy).", status: "theorem" }
    ],
    concept: "Hardy Z-function",
    explanation: "Z(t) is real-valued on the critical line and vanishes exactly where ζ(½+it) does (away from poles of the phase factor).",
    whyItMatters: "Sign changes of Z prove infinitely many critical-line zeros — a theorem, far short of RH. The Experiments bench plots an approximate Z.",
    task: { prompt: "Define Z(t)=e^{iθ(t)} ζ(½+it) and outline why mean values force infinitely many sign changes.", hint: "Hardy’s original argument uses moments on the critical line.", answer: "If only finitely many zeros, certain integrals of Z would contradict asymptotic main terms." },
    prerequisites: [45, 51, 52],
    readings: [R.titchmarsh, R.edwards, R.dlmfZeta],
    opensExperiments: true,
  }),
  L({
    id: 54,
    title: "Riemann-Siegel formula and Turing-style zero accounting",
    outcome: "Describe Riemann–Siegel evaluation and Turing's method for certifying zero counts.",
    claims: [
        { text: "Turing's method can certify that all zeros up to height T lie on the critical line when paired with rigorous computation.", status: "theorem" }
    ],
    concept: "Riemann–Siegel and Turing",
    explanation: "Riemann–Siegel evaluates Z(t) efficiently; Turing’s method certifies that N(T) matches a count of sign changes on the line.",
    whyItMatters: "Finite-height verifications combine analysis (Turing) with numerics. They remain numerical evidence for RH, not a proof.",
    task: { prompt: "Explain the bookkeeping identity comparing N(T) to detected critical-line zeros up to height T.", hint: "If S(T)=π^{−1} arg ζ(½+iT) is controlled, missing off-line zeros would mismatch counts.", answer: "A full certificate needs rigorous enclosures of Z and of the argument change — finite by nature." },
    prerequisites: [53, 48, 51, 12],
    readings: [R.titchmarsh, R.turingZeros, R.odlyzko],
    opensExperiments: true,
  }),
  L({
    id: 55,
    title: "Zero-density estimates, mollifiers, partial results",
    outcome: "State what zero-density and mollifier methods achieve toward RH-scale bounds.",
    claims: [
        { text: "Zero-density estimates bound the number of zeros off the critical line in rectangles; they fall short of RH.", status: "theorem" }
    ],
    concept: "Zero-density and mollifiers",
    explanation: "Zero-density theorems bound how many zeros can lie in σ≥α strips; mollifiers improve critical-line proportions.",
    whyItMatters: "These are the best classical partial substitutes for RH in many applications — still not RH.",
    task: { prompt: "State a model zero-density bound N(σ,T) ≪ T^{c(1−σ)} log^{O(1)} T and what it yields for primes in short intervals at a high level.", hint: "Larger σ means stronger decay in T.", answer: "Density theorems limit off-line zeros enough for some hybrid prime results without proving σ=1/2 universally." },
    prerequisites: [50, 52, 48],
    readings: [R.iwaniecKowalski, R.titchmarsh, R.conreyAms],
  })
    ],
  },
  {
    id: "inv-spectral",
    title: "Functional, Fourier, and spectral methods",
    goal: "Connect operator spectra, trace formulae and random-matrix heuristics to zeta zeros.",
    fromId: 56,
    toId: 66,
    orientation: "Stage 5 adds spectral language and honest heuristics: operators, trace-formula analogies, GUE pair correlation, and Hilbert–Pólya as a programme — not a construction.",
    readings: [R.functionalAnalysis, R.iwaniecSpectral, R.conreyAms, R.odlyzko, R.aimathRh],
    lessons: [
  L({
    id: 56,
    title: "Banach and Hilbert spaces; orthogonal projection and duality",
    outcome: "Use orthonormal bases and orthogonal projections in Hilbert space.",
    claims: [
        { text: "Every nonempty closed convex set in a Hilbert space has a unique nearest point.", status: "theorem" }
    ],
    concept: "Hilbert space geometry",
    explanation: "Hilbert spaces support orthonormal bases and orthogonal projections; closed convex sets have unique nearest points.",
    whyItMatters: "L² formulations of RH criteria and spectral programs live in Hilbert space, not finite dimensions alone.",
    task: { prompt: "Prove the nearest-point property for a closed subspace; expand a vector in an orthonormal basis.", hint: "Use parallelogram law.", answer: "Projection residual is orthogonal to the subspace; coefficients are inner products ⟨v,e_n⟩." },
    prerequisites: [3, 7, 9],
    readings: [R.functionalAnalysis, R.steinShakarchiReal],
  }),
  L({
    id: 57,
    title: "Bounded operators, compact operators, adjoints",
    outcome: "Identify compact operators and compute adjoints in standard examples.",
    claims: [
        { text: "The spectrum of a compact operator on infinite-dimensional Hilbert space contains 0.", status: "theorem" }
    ],
    concept: "Bounded and compact operators",
    explanation: "Bounded operators have adjoints; compact operators are limits of finite-rank maps and have discrete nonzero spectra.",
    whyItMatters: "Trace formulae and spectral determinants need operator classes before any zeta-operator fantasy is well-posed.",
    task: { prompt: "Show the adjoint of a multiplication operator on L² is multiplication by the conjugate; give a compact integral operator example.", hint: "⟨Tf,g⟩=⟨f,T*g⟩ defines T*.", answer: "Hilbert–Schmidt kernels define compact operators on L² of finite measure spaces under standard hypotheses." },
    prerequisites: [56],
    readings: [R.functionalAnalysis],
  }),
  L({
    id: 58,
    title: "Unbounded operators and domains",
    outcome: "Track domains carefully for differential operators and their adjoints.",
    claims: [
        { text: "An unbounded operator is specified only together with its domain.", status: "theorem" }
    ],
    concept: "Unbounded operators",
    explanation: "Differential operators are unbounded; the domain is part of the definition and determines the adjoint.",
    whyItMatters: "Any Hilbert–Pólya operator candidate would be unbounded. Domain confusion is a common source of fake proofs.",
    task: { prompt: "Compare −Δ on C_c^∞(0,1) versus on H²∩H₀¹; explain why domains matter for self-adjointness.", hint: "Symmetric ≠ self-adjoint without domain match.", answer: "Deficiency indices detect whether a symmetric operator has self-adjoint extensions." },
    prerequisites: [57],
    readings: [R.functionalAnalysis],
  }),
  L({
    id: 59,
    title: "Self-adjointness, resolvents, spectral theorem",
    outcome: "Apply the spectral theorem for unbounded self-adjoint operators at a working level.",
    claims: [
        { text: "A self-adjoint operator has real spectrum and a projection-valued spectral measure.", status: "theorem" }
    ],
    concept: "Spectral theorem",
    explanation: "Self-adjoint operators have real spectra and projection-valued measures; resolvents encode the spectrum.",
    whyItMatters: "Hilbert–Pólya asks for a self-adjoint operator whose spectrum matches nontrivial zeros (shifted). No such accepted operator is known.",
    task: { prompt: "State the spectral theorem for unbounded self-adjoint operators; compute the resolvent of multiplication by x on L²(ℝ).", hint: "Spectrum is the essential range of the multiplier.", answer: "Resolvent (M_x−z)^{−1} multiplies by 1/(x−z) for z∉ℝ." },
    prerequisites: [58, 3],
    readings: [R.functionalAnalysis],
  }),
  L({
    id: 60,
    title: "Sturm-Liouville theory and Laplace-type operators",
    outcome: "Relate eigenvalues of Sturm–Liouville problems to oscillatory counting functions.",
    claims: [
        { text: "Regular Sturm–Liouville operators are self-adjoint with discrete real spectra under standard boundary conditions.", status: "theorem" }
    ],
    concept: "Sturm–Liouville spectra",
    explanation: "Regular SL problems have discrete real eigenvalues with oscillatory eigenfunctions and Weyl-type counting laws.",
    whyItMatters: "Spectral counting N(λ) is the model for N(T) analogies. Analogies are not identities with ζ.",
    task: { prompt: "Solve −y″=λy on [0,π] with Dirichlet boundaries; count eigenvalues up to Λ.", hint: "Eigenfunctions sin(nx).", answer: "λ_n=n²; N(Λ)∼√Λ." },
    prerequisites: [59, 17],
    readings: [R.functionalAnalysis],
  }),
  L({
    id: 61,
    title: "Sobolev spaces and distributions",
    outcome: "Use H^s spaces to host weak solutions of elliptic problems.",
    claims: [
        { text: "Sobolev embedding relates H^s regularity to classical continuity in fixed dimension.", status: "theorem" }
    ],
    concept: "Sobolev spaces",
    explanation: "Sobolev spaces measure weak derivatives in L²; embeddings recover classical regularity.",
    whyItMatters: "Modern analytic number theory sometimes uses soft analysis language; Sobolev literacy prevents cargo-cult operator talk.",
    task: { prompt: "State the H¹(0,1) inner product; explain why H¹ embeds into continuous functions on an interval.", hint: "Fundamental theorem of calculus for absolutely continuous representatives.", answer: "In 1D, H¹ functions are absolutely continuous; higher D needs s>d/2." },
    prerequisites: [56, 24],
    readings: [R.steinShakarchiReal, R.functionalAnalysis],
  }),
  L({
    id: 62,
    title: "Mellin transform as Fourier transform in logarithmic coordinates",
    outcome: "Translate Mellin identities into Fourier language on the multiplicative group.",
    claims: [
        { text: "The Mellin transform is the Fourier transform after the change of variables x = e^u.", status: "theorem" }
    ],
    concept: "Mellin as Fourier",
    explanation: "x=e^u converts multiplicative structure to additive Fourier analysis on ℝ.",
    whyItMatters: "This dictionary clarifies why explicit formulae look like Fourier dualities between primes and zeros.",
    task: { prompt: "Rewrite the Mellin transform of f as a Fourier transform of f(e^u)e^{u/2} (or a standard normalisation).", hint: "Substitute x=e^u, dx/x=du.", answer: "Vertical lines Re s=σ become Fourier frequency lines after the substitution." },
    prerequisites: [26, 23],
    readings: [R.steinShakarchiFourier, R.titchmarsh],
  }),
  L({
    id: 63,
    title: "Trace formulas and the prime/periodic-orbit analogy",
    outcome: "Compare explicit formulae with geometric trace formulae at the analogy level.",
    claims: [
        { text: "Explicit formulae mirror Gutzwill-type trace formulae with primes as periodic orbits — an analogy, not an identification.", status: "heuristic" }
    ],
    concept: "Trace formula analogy",
    explanation: "Geometric trace formulae equate spectra with periodic orbits; explicit formulae equate zeros with primes.",
    whyItMatters: "The analogy is productive heuristics and research inspiration — not a proof of RH and not a literal identity of systems.",
    task: { prompt: "Write a side-by-side dictionary: zeros↔eigenvalues, primes↔closed geodesics, explicit formula↔Selberg trace formula — and list two mismatches.", hint: "Archimedean factors and the lack of a known RH operator are mismatches.", answer: "Keep status=heuristic: useful picture, not a theorem identifying ζ with a Laplacian." },
    prerequisites: [49, 59, 60],
    readings: [R.iwaniecSpectral, R.conreyAms],
  }),
  L({
    id: 64,
    title: "Spectral determinants and regularization",
    outcome: "Define regularised determinants for suitable operators.",
    claims: [
        { text: "Zeta-regularised determinants assign finite values to divergent product spectra under growth hypotheses.", status: "theorem" }
    ],
    concept: "Regularised determinants",
    explanation: "Spectral zeta functions can regularise divergent determinant products for suitable operators.",
    whyItMatters: "Completed L-functions resemble spectral determinants in form. Resemblance is not construction of a Hilbert–Pólya operator.",
    task: { prompt: "Define the spectral zeta of a positive operator with eigenvalues λ_n∼n^α; explain ζ_op(s)=Σ λ_n^{−s} and det=exp(−ζ_op′(0)).", hint: "Need a holomorphic continuation of ζ_op to s=0.", answer: "For the circle Laplacian modes, this recovers familiar π-related determinants in model cases." },
    prerequisites: [59, 21],
    readings: [R.functionalAnalysis],
  }),
  L({
    id: 65,
    title: "Random matrices, pair correlation, quantum chaos",
    outcome: "State the Montgomery–Odlyzko pair-correlation picture for high zeros.",
    claims: [
        { text: "Pair correlation of high zeta zeros statistically matches GUE eigenvalues in the Montgomery–Odlyzko law.", status: "heuristic" }
    ],
    concept: "Pair correlation heuristic",
    explanation: "Montgomery’s pair correlation conjecture and Odlyzko’s computations compare high zeros to GUE spacings.",
    whyItMatters: "Striking numerical and partial theoretical agreement — still a heuristic/conjectural statistical model, not a proof of RH.",
    task: { prompt: "State the GUE pair correlation form and what Odlyzko-style computations check at finite height.", hint: "Normalise mean spacing to 1 before comparing.", answer: "Finite-height histograms are numerical evidence for the model; they do not prove RH or the full pair correlation conjecture." },
    prerequisites: [53, 11, 48],
    readings: [R.conreyAms, R.odlyzko, R.aimathRh],
  }),
  L({
    id: 66,
    title: "Hilbert-Polya programme",
    outcome: "Explain the Hilbert–Pólya idea: zeros as eigenvalues of a self-adjoint operator.",
    claims: [
        { text: "Hilbert–Pólya proposes a self-adjoint operator whose spectrum realises the nontrivial zeros — still a programme, not a construction.", status: "conjecture" }
    ],
    concept: "Hilbert–Pólya idea",
    explanation: "If nontrivial zeros were eigenvalues of a self-adjoint operator, they would be real after the usual ½+iE normalisation.",
    whyItMatters: "A guiding programme without an accepted operator. Treat claimed operators with extreme suspicion until fully specified and verified.",
    task: { prompt: "Write the precise spectral hope (zeros = ½+i eigenvalues) and list three properties any candidate operator must have.", hint: "Self-adjointness, correct spectral counting asymptotic, functional equation compatibility.", answer: "No complete accepted construction is known; the programme remains open." },
    prerequisites: [59, 65, 45],
    readings: [R.conreyAms, R.aimathRh, R.clayRh],
  })
    ],
  },
  {
    id: "inv-l-functions",
    title: "L-functions and modern analytic number theory",
    goal: "Place RH among L-functions, automorphic forms and the proved function-field analogue.",
    fromId: 67,
    toId: 78,
    orientation: "Stage 6 widens the world: Dirichlet and automorphic L-functions, families, subconvexity, and Weil’s proved RH for curves over finite fields. The number-field RH remains open.",
    readings: [R.iwaniecKowalski, R.davenport, R.lmfdb, R.diamondShurman, R.weilFoundations, R.katzSarnak],
    lessons: [
  L({
    id: 67,
    title: "Dirichlet L-functions and the Generalized RH",
    outcome: "Define L(s, χ) and state GRH for Dirichlet L-functions.",
    claims: [
        { text: "The Generalized Riemann hypothesis for Dirichlet L-functions remains open.", status: "conjecture" }
    ],
    concept: "Dirichlet L-functions and GRH",
    explanation: "L(s,χ)=Σ χ(n)n^{−s} continues to an entire (or meromorphic in the principal case) function; GRH places nontrivial zeros on Re s=1/2.",
    whyItMatters: "GRH is the natural extension of RH to progressions and is still open. Many “almost RH” applications assume GRH.",
    task: { prompt: "Define L(s,χ) for a non-principal χ mod q and state GRH as a quantified sentence.", hint: "Exclude any possible pole only for principal χ (which reduces to ζ).", answer: "GRH: nontrivial zeros of all Dirichlet L-functions have real part 1/2 — conjectural." },
    prerequisites: [36, 45, 43],
    readings: [R.davenport, R.montgomeryVaughan, R.clayRh, R.lmfdb],
  }),
  L({
    id: 68,
    title: "Conductors, gamma factors, root numbers, functional equations",
    outcome: "Read the analytic conductor and root number from a completed L-function.",
    claims: [
        { text: "Standard L-functions satisfy a functional equation relating s to 1 − s with gamma factors and a root number.", status: "theorem" }
    ],
    concept: "Analytic conductors",
    explanation: "Completed Λ(s) packages L with Gamma factors; conductor and root number appear in the functional equation.",
    whyItMatters: "Modern RH-scale statements are often uniform in conductors. You must read Λ-data before comparing families.",
    task: { prompt: "For a quadratic Dirichlet L-function, identify the Gamma factor and the conductor in the completed Λ.", hint: "Functional equation Λ(s)=ε Λ(1−s) with |ε|=1.", answer: "Conductor q for χ_d scales the archimedean/Gamma normalisation; root number ε is a normalised Gauss sum quotient." },
    prerequisites: [67, 19, 43],
    readings: [R.iwaniecKowalski, R.lmfdb],
  }),
  L({
    id: 69,
    title: "Dedekind zeta functions",
    outcome: "Define ζ_K and relate its pole to the residue class number formula ingredients.",
    claims: [
        { text: "The Dedekind zeta function of a number field has a simple pole at s = 1.", status: "theorem" }
    ],
    concept: "Dedekind zeta",
    explanation: "ζ_K(s)=Σ_{a} N(a)^{−s} over ideals; it has a simple pole at s=1 with residue given by the class number formula.",
    whyItMatters: "RH for Dedekind zeta is another open generalisation. Function-field analogues are proved (later items).",
    task: { prompt: "Write ζ_ℚ=ζ; state the residue ingredients (class number, regulator, discriminant, roots of unity).", hint: "Pole from the ideal counting asymptotic.", answer: "res_{s=1} ζ_K involves 2^{r1}(2π)^{r2} h R /(w √|Δ|)." },
    prerequisites: [40, 42, 10],
    readings: [R.iwasawa, R.lmfdb],
  }),
  L({
    id: 70,
    title: "Modular forms and Hecke operators",
    outcome: "Compute Hecke actions on model modular forms and state the Euler product for eigenforms.",
    claims: [
        { text: "Normalised Hecke eigenforms have Euler products for their L-functions.", status: "theorem" }
    ],
    concept: "Modular forms and Hecke L-functions",
    explanation: "Hecke eigenforms have multiplicative coefficients and L-functions with Euler products and functional equations.",
    whyItMatters: "The broader RH landscape includes L-functions of modular forms. Deligne’s theorem proves the Ramanujan conjecture — a different triumph than RH.",
    task: { prompt: "For Δ=q∏(1−q^n)^{24}, state that it is a Hecke eigenform and write the shape of L(s,Δ).", hint: "Coefficients are multiplicative; Ramanujan τ appears.", answer: "L(s,Δ)=Σ τ(n)n^{−s} has an Euler product and analytic continuation via modularity." },
    prerequisites: [32, 43, 23],
    readings: [R.diamondShurman, R.lmfdb],
  }),
  L({
    id: 71,
    title: "Automorphic forms and representations",
    outcome: "Connect classical modular forms to automorphic representations at a survey level.",
    claims: [
        { text: "Cuspidal automorphic representations attach L-functions with analytic continuation and functional equations in the established cases.", status: "theorem" }
    ],
    concept: "Automorphic L-functions",
    explanation: "Automorphic representations generalise modular forms; their L-functions organise the Langlands side of modern ANT.",
    whyItMatters: "RH-type questions extend to automorphic L-functions. This item is orientation, not a crash course in Langlands.",
    task: { prompt: "Write a short map: holomorphic cusp form → automorphic representation on GL₂ → standard L-function, listing what is theorem vs programme.", hint: "Analytic continuation for GL₂ over ℚ is theorem via modularity/Hecke theory classical path.", answer: "Keep claims at textbook survey strength; do not claim the full Langlands correspondence." },
    prerequisites: [70, 68],
    readings: [R.bump, R.iwaniecKowalski],
  }),
  L({
    id: 72,
    title: "Selberg zeta functions and the Selberg trace formula",
    outcome: "State the Selberg trace formula's spectral-versus-geometric shape.",
    claims: [
        { text: "The Selberg trace formula equates spectral data of the hyperbolic Laplacian with geometric lengths of closed geodesics.", status: "theorem" }
    ],
    concept: "Selberg trace formula",
    explanation: "Selberg’s trace formula pairs Laplacian eigenvalues on a hyperbolic surface with closed geodesic lengths; Selberg zeta encodes lengths.",
    whyItMatters: "This is a proved spectral↔geometric dictionary — the model people analogise to primes↔zeros, with care.",
    task: { prompt: "State the two sides of the Selberg trace formula at slogan precision and define the Selberg zeta as a product over prime geodesics.", hint: "Spectral side sums test functions of eigenvalues; geometric side sums orbital integrals over conjugacy classes.", answer: "Selberg zeta vanishes at points linked to Laplacian eigenvalues — a theorem in this geometric setting." },
    prerequisites: [63, 59, 60],
    readings: [R.iwaniecSpectral],
  }),
  L({
    id: 73,
    title: "Families of L-functions and symmetry types",
    outcome: "Identify unitary/orthogonal/symplectic symmetry types in L-function families.",
    claims: [
        { text: "Katz–Sarnak heuristics predict symmetry types of low-lying zeros in L-function families.", status: "heuristic" }
    ],
    concept: "Katz–Sarnak symmetry",
    explanation: "Families of L-functions show low-lying zero statistics matching classical compact groups (U/O/Sp).",
    whyItMatters: "Heuristic statistical mechanics of zeros beyond a single ζ. Evidence is deep in function fields; number-field cases mix theorems and conjectures.",
    task: { prompt: "Name the three main symmetry types and give one family expected for each (at survey level).", hint: "Quadratic Dirichlet family ↔ symplectic type in Katz–Sarnak heuristics.", answer: "Status remains largely heuristic in the number-field setting for full statistical laws." },
    prerequisites: [65, 67, 11],
    readings: [R.katzSarnak, R.conreyAms, R.lmfdb],
  }),
  L({
    id: 74,
    title: "Large sieve, exponential sums, character sums",
    outcome: "Apply large-sieve inequalities to bound character and exponential sums.",
    claims: [
        { text: "The large sieve limits how often many Dirichlet polynomials can be large simultaneously.", status: "theorem" }
    ],
    concept: "Large sieve",
    explanation: "The large sieve bounds simultaneous large values of many character or exponential sums.",
    whyItMatters: "Workhorse inequality for zero-density, Bombieri–Vinogradov, and hybrid large-modulus prime results short of GRH.",
    task: { prompt: "State a large-sieve inequality for Dirichlet characters up to Q and explain what “average GRH” results use it for.", hint: "ℓ² norms of partial sums over moduli.", answer: "Bombieri–Vinogradov-type theorems give GRH-on-average distribution of primes in APs without proving GRH." },
    prerequisites: [36, 52, 55],
    readings: [R.iwaniecKowalski, R.montgomeryVaughan],
  }),
  L({
    id: 75,
    title: "Moments, subconvexity, zero-density methods, mollification",
    outcome: "State what subconvexity improves over the convexity bound.",
    claims: [
        { text: "Subconvexity bounds improve on convexity but stop short of the Lindelöf hypothesis.", status: "theorem" }
    ],
    concept: "Subconvexity",
    explanation: "Subconvexity beats the Phragmén–Lindelöf convexity exponent on vertical lines; Lindelöf is still stronger.",
    whyItMatters: "Progress toward Lindelöf is parallel to, not identical with, progress toward RH. Keep the targets distinct.",
    task: { prompt: "State convexity vs a model subconvex bound for ζ(½+it) or a Dirichlet L-function at the centre.", hint: "Any saving ε in the exponent is subconvexity.", answer: "Weyl-type or modern subconvex bounds improve 1/4 but do not reach the Lindelöf o(1) goal." },
    prerequisites: [52, 55, 67],
    readings: [R.iwaniecKowalski, R.titchmarsh],
  }),
  L({
    id: 76,
    title: "Explicit formulas for general L-functions",
    outcome: "Write an explicit formula relating coefficients to zeros for a standard L-function.",
    claims: [
        { text: "Explicit formulae for L-functions parallel the zeta case with zeros of L and arithmetic coefficients.", status: "theorem" }
    ],
    concept: "Explicit formulae beyond ζ",
    explanation: "The primes↔zeros dictionary extends to standard L-functions with coefficients a_n and zeros of L.",
    whyItMatters: "RH/GRH-quality zero locations again optimise error terms for arithmetic sums attached to L.",
    task: { prompt: "Write a schematic explicit formula summing a_n f(log n) against Σ_ρ f̂(ρ) for a test function f.", hint: "Same contour-shift of L′/L as in the ζ case.", answer: "Archimedean Gamma factors contribute explicit archimedean terms in the formula." },
    prerequisites: [49, 68, 46],
    readings: [R.iwaniecKowalski, R.montgomeryVaughan],
  }),
  L({
    id: 77,
    title: "Function-field zeta functions and the proved Weil RH analogy",
    outcome: "State Weil's theorem: RH holds for zeta functions of curves over finite fields.",
    claims: [
        { text: "The Riemann hypothesis for curves over finite fields is a theorem of Weil.", status: "theorem" }
    ],
    concept: "Weil’s RH for curves",
    explanation: "For zeta functions of smooth projective curves over finite fields, the analogue of RH is a theorem of Weil.",
    whyItMatters: "The only fully proved RH-style statement in a closely analogous setting. It is inspiration and a theorem — not a proof of the number-field RH.",
    task: { prompt: "State the zeta function of a curve over F_q as a rational function and the RH claim on its zeros.", hint: "Zeros lie on a circle of radius q^{−1/2} in the standard normalisation.", answer: "Weil proved the Riemann hypothesis for curves over finite fields; Deligne extended to higher-dimensional Weil conjectures." },
    prerequisites: [69, 45, 20],
    readings: [R.weilFoundations, R.conreyAms, R.clayRh],
  }),
  L({
    id: 78,
    title: "Algebraic geometry needed for the function-field proof",
    outcome: "Outline the role of the Frobenius endomorphism and cohomology in Weil's proof.",
    claims: [
        { text: "Weil's proof uses the action of Frobenius on the cohomology of the curve.", status: "theorem" }
    ],
    concept: "Frobenius and cohomology",
    explanation: "Weil’s proof studies Frobenius acting on cohomology; eigenvalues’ absolute values encode the RH analogue.",
    whyItMatters: "Shows why geometry supplies a self-adjoint/Frobenius mechanism absent so far for ζ over ℚ.",
    task: { prompt: "Write a short outline: curve → cohomology → Frobenius endomorphism → characteristic polynomial → absolute values of roots.", hint: "Compare to Hilbert–Pólya hoping for a spectral mechanism over number fields.", answer: "The geometric Frobenius supplies the spectral object; no equally successful object is known for number-field ζ." },
    prerequisites: [77, 66, 10],
    readings: [R.weilFoundations, R.hartshorne],
  })
    ],
  },
  {
    id: "inv-criteria",
    title: "Equivalent criteria and computation",
    goal: "Study RH-equivalent criteria and rigorous computational certification methods.",
    fromId: 79,
    toId: 91,
    orientation: "Stage 7 studies equivalent faces of RH (ψ-errors, M(x), Li, Weil positivity, Nyman–Beurling, Robin, Lagarias, Speiser) and the computational certification pipeline. Equivalence theorems are proved; RH is not.",
    readings: [R.lagariasSurvey, R.titchmarsh, R.robin, R.odlyzko, R.turingZeros, R.lmfdbZeta, R.numericalRecipesCaveat],
    lessons: [
  L({
    id: 79,
    title: "Prime-error criterion through psi(x) = x + O(x^(1/2) log^2 x)",
    outcome: "Prove the equivalence between RH and the classical ψ-error bound (up to log powers).",
    claims: [
        { text: "RH is equivalent to ψ(x) = x + O(x^{1/2} log^2 x).", status: "equivalent-criterion" }
    ],
    concept: "ψ-error equivalence",
    explanation: "RH ⇔ ψ(x)=x+O(x^{1/2} log² x) (classical form). Error exponents match zero real parts via explicit formulae.",
    whyItMatters: "Translates RH into a prime-counting error statement without mentioning zeros — fully equivalent, still unproved.",
    task: { prompt: "Sketch both directions: RH ⇒ ψ-error via explicit formula; ψ-error ⇒ no zero with Re ρ>1/2.", hint: "A zero with Re ρ=σ>1/2 produces an Ω term ≫ x^σ /|ρ|.", answer: "Equivalence is a theorem; RH remains a conjecture." },
    prerequisites: [49, 45, 50],
    readings: [R.ingham, R.titchmarsh, R.conreyAms, R.lagariasSurvey],
  }),
  L({
    id: 80,
    title: "Mertens-function x^(1/2 + epsilon)-type bounds",
    outcome: "Relate M(x) = Σ_{n≤x} μ(n) bounds to RH-scale estimates.",
    claims: [
        { text: "RH implies M(x) = O(x^{1/2+ε}) for every ε > 0; suitable M(x) bounds are equivalent to RH.", status: "equivalent-criterion" }
    ],
    concept: "Mertens function bounds",
    explanation: "M(x)=Σ_{n≤x} μ(n) is tied to 1/ζ; RH-scale bounds on M are equivalent (with care) to RH.",
    whyItMatters: "Another arithmetic face of the same conjecture. Elementary-looking, analytically deep.",
    task: { prompt: "Explain why Σ μ(n)n^{−s}=1/ζ(s) links zeros of ζ to the growth of M(x) via Perron.", hint: "Contour shift of x^s/(s ζ(s)).", answer: "Zeros with Re>½ obstruct M(x)≪ x^{1/2+ε}; suitable converse theorems restore equivalence." },
    prerequisites: [79, 46, 30],
    readings: [R.titchmarsh, R.lagariasSurvey, R.apostolAnt],
  }),
  L({
    id: 81,
    title: "Li's positivity criterion",
    outcome: "State Li's criterion in terms of non-negativity of certain coefficients.",
    claims: [
        { text: "Li's criterion: RH is equivalent to non-negativity of an explicit sequence of coefficients built from ξ.", status: "equivalent-criterion" }
    ],
    concept: "Li’s criterion",
    explanation: "Li’s coefficients λ_n derived from ξ are all non-negative iff RH holds.",
    whyItMatters: "A positivity packaging of RH used in some computational and theoretical studies — equivalent, not easier in principle.",
    task: { prompt: "Define λ_n via logarithmic derivatives of ξ at s=1 (or the standard generating definition) and state the equivalence.", hint: "λ_n = Σ_ρ [1−(1−1/ρ)^n].", answer: "Non-negativity of all λ_n ⇔ RH; finite checks are numerical evidence only." },
    prerequisites: [43, 46, 45],
    readings: [R.liCriterion, R.lagariasSurvey],
  }),
  L({
    id: 82,
    title: "Weil's positivity criterion and the explicit formula",
    outcome: "Connect Weil positivity of a certain quadratic form to RH.",
    claims: [
        { text: "Weil's positivity criterion is equivalent to RH.", status: "equivalent-criterion" }
    ],
    concept: "Weil positivity",
    explanation: "RH is equivalent to positivity of a quadratic form built from the explicit formula tested on a class of functions.",
    whyItMatters: "Bridges explicit formulae to a positivity principle — central in many modern approaches and still equivalent to RH.",
    task: { prompt: "State Weil’s positivity criterion at the level of “certain Weil distributions are positive definite iff RH”.", hint: "Test functions need suitable Fourier support hypotheses.", answer: "Equivalence is classical; verifying positivity for all admissible tests is as hard as RH." },
    prerequisites: [49, 79, 63],
    readings: [R.lagariasSurvey, R.conreyAms],
  }),
  L({
    id: 83,
    title: "Nyman-Beurling L2 closure criterion",
    outcome: "State the Nyman–Beurling criterion via closure in L2(0,1).",
    claims: [
        { text: "Nyman–Beurling: RH is equivalent to the density of a certain span of Beurling functions in L2(0,1).", status: "equivalent-criterion" }
    ],
    concept: "Nyman–Beurling criterion",
    explanation: "RH ⇔ natural Beurling functions ρ_α(x)={1/αx}−(1/α){1/x} span a dense subspace of L²(0,1) (with the constant function).",
    whyItMatters: "An elegant Hilbert-space face of RH. Density statements are not elementary to prove.",
    task: { prompt: "Define the Beurling functions and state the L²(0,1) density criterion equivalent to RH.", hint: "Work in L²(0,1) with Lebesgue measure.", answer: "Closure of the span equaling the subspace orthogonal to appropriate constraints is equivalent to RH." },
    prerequisites: [56, 45, 40],
    readings: [R.lagariasSurvey, R.baezDuarte],
  }),
  L({
    id: 84,
    title: "Baez-Duarte's discrete strengthening",
    outcome: "State Báez-Duarte's discrete reformulation of Nyman–Beurling.",
    claims: [
        { text: "Báez-Duarte's criterion is an equivalent discrete strengthening of Nyman–Beurling.", status: "equivalent-criterion" }
    ],
    concept: "Báez-Duarte criterion",
    explanation: "Báez-Duarte gives a discrete ℓ² formulation closely related to Nyman–Beurling, still equivalent to RH.",
    whyItMatters: "Often preferred for computational experiments on partial density — finite truncations remain evidence only.",
    task: { prompt: "State the discrete criterion in terms of distances from 1 to spans of certain sequences involving μ or fractional parts.", hint: "Finite-dimensional projections give numerical upper bounds on distance.", answer: "Distance → 0 along a sequence of approximations would be forced by RH; finite N is not a proof." },
    prerequisites: [83, 80],
    readings: [R.baezDuarte, R.lagariasSurvey],
  }),
  L({
    id: 85,
    title: "Robin's divisor-sum criterion",
    outcome: "State Robin's inequality for σ(n) and its equivalence to RH for n > 5040.",
    claims: [
        { text: "Robin's criterion equates RH with σ(n) < e^γ n log log n for all n > 5040.", status: "equivalent-criterion" }
    ],
    concept: "Robin’s criterion",
    explanation: "RH ⇔ σ(n) < e^γ n log log n for every integer n>5040 (Robin). The inequality can fail for small n.",
    whyItMatters: "A purely arithmetic inequality equivalent to RH past an explicit threshold. Checking finitely many n never proves the universal quantifier.",
    task: { prompt: "State Robin’s inequality carefully with n>5040 (strict); explain why small-n failures do not refute RH.", hint: "Threshold 5040 is part of the theorem’s statement.", answer: "Equivalence uses highly composite / colossally abundant structure; still open whether all n>5040 obey the bound." },
    prerequisites: [79, 31, 45],
    readings: [R.robin, R.lagariasSurvey],
  }),
  L({
    id: 86,
    title: "Lagarias's harmonic-number criterion",
    outcome: "State Lagarias's inequality involving H_n and σ(n).",
    claims: [
        { text: "Lagarias's criterion is equivalent to RH.", status: "equivalent-criterion" }
    ],
    concept: "Lagarias criterion",
    explanation: "Lagarias proved RH ⇔ σ(n) ≤ H_n + e^{H_n} log H_n for all n≥1, with equality only at n=1.",
    whyItMatters: "A clean elementary-looking inequality form of RH using harmonic numbers.",
    task: { prompt: "State Lagarias’s inequality and its equivalence; verify n=1 equality case.", hint: "H_n=Σ_{k≤n} 1/k.", answer: "Equivalence is a theorem of Lagarias; the inequality for all n remains open in the RH direction." },
    prerequisites: [85, 42],
    readings: [R.lagariasSurvey],
  }),
  L({
    id: 87,
    title: "Speiser-type and logarithmic-derivative criteria",
    outcome: "Relate zero-free half-planes for ζ′ to RH-style statements.",
    claims: [
        { text: "Speiser's theorem relates RH to the absence of zeros of ζ′ in 0 < Re(s) < 1/2.", status: "equivalent-criterion" }
    ],
    concept: "Speiser’s theorem",
    explanation: "Speiser: RH ⇔ ζ′ has no zeros in 0<Re s<1/2 (with standard clarifications at known points).",
    whyItMatters: "Moves RH to a statement about ζ′. Useful conceptually; not a simplification of the core difficulty.",
    task: { prompt: "State Speiser’s theorem precisely and sketch why zeros of ζ′ off the line would force zeros of ζ off the line (or conversely).", hint: "Gauss–Lucas-type ideas are misleading over ℂ; use the argument principle on ζ′/ζ.", answer: "Standard references give the careful equivalence including possible multiple zeros on the line." },
    prerequisites: [46, 45, 17],
    readings: [R.titchmarsh, R.lagariasSurvey],
  }),
  L({
    id: 88,
    title: "Rigorous complex interval arithmetic",
    outcome: "Enclose holomorphic functions on rectangles with complex interval arithmetic.",
    claims: [
        { text: "Correctly implemented complex interval arithmetic produces rigorous value enclosures.", status: "theorem" }
    ],
    concept: "Complex interval arithmetic",
    explanation: "Rectangle/ball arithmetic encloses ranges of holomorphic functions with outward rounding.",
    whyItMatters: "Foundation for rigorous zero isolation. Enclosures certify finite claims only.",
    task: { prompt: "Enclose z² on the square [1,2]+i[0,1]; explain wrapping effect and a mitigation (e.g. centred forms).", hint: "Independent real/imag interval evaluation is conservative.", answer: "Result is a rectangle guaranteed to contain the image — width may grow with operations." },
    prerequisites: [12, 13],
    readings: [R.numericalRecipesCaveat],
  }),
  L({
    id: 89,
    title: "Euler-Maclaurin and Riemann-Siegel implementations",
    outcome: "Implement a documented evaluation method with explicit truncation bounds.",
    claims: [
        { text: "Riemann–Siegel and Euler–Maclaurin yield effective approximations with controllable remainders.", status: "theorem" }
    ],
    concept: "Effective evaluation of ζ",
    explanation: "Euler–Maclaurin and Riemann–Siegel provide effective approximations to ζ or Z with remainders you must bound.",
    whyItMatters: "The Experiments bench uses a pedagogical approximate Z, not a certificate. Real verifications need documented remainders.",
    task: { prompt: "Write a remainder-aware plan to evaluate Z(t) at a modest t by Riemann–Siegel or Euler–Maclaurin.", hint: "Separate main sum, correction terms, and explicit remainder.", answer: "Without a remainder bound the output is a plot, not a theorem." },
    prerequisites: [54, 51, 12],
    readings: [R.titchmarsh, R.edwards, R.dlmfZeta],
    opensExperiments: true,
  }),
  L({
    id: 90,
    title: "Argument-principle and Turing-method certification",
    outcome: "Certify zero counts in a height range by argument change plus Turing's method.",
    claims: [
        { text: "Combined argument-principle and Turing bookkeeping can rigorously locate zeros up to finite height.", status: "theorem" }
    ],
    concept: "Zero certification methods",
    explanation: "Argument change on rectangles plus Turing’s method matches N(T) to certified critical-line zeros up to finite T.",
    whyItMatters: "This is how “first N zeros lie on the line” theorems are proved — always finite N.",
    task: { prompt: "Outline a certificate pipeline: enclose Z sign changes; bound S(T); conclude no missing off-line zeros up to T.", hint: "Each step needs rigorous analysis/numerics.", answer: "Success up to large T is strong numerical evidence and a finite theorem — not RH." },
    prerequisites: [54, 48, 88],
    readings: [R.turingZeros, R.odlyzko, R.titchmarsh],
    opensExperiments: true,
  }),
  L({
    id: 91,
    title: "Reproduction of a published finite-height verification",
    outcome: "Reproduce a published finite-height zero verification with cited data and methods.",
    claims: [
        { text: "Published finite-height verifications are strong numerical evidence, not a proof of RH.", status: "numerical-evidence" }
    ],
    concept: "Published zero verifications",
    explanation: "Odlyzko and others publish zeros and describe verification methods to large heights.",
    whyItMatters: "Reproducing a published range trains honest computational RH work. It never finishes RH.",
    task: { prompt: "Choose a published initial segment of zeros, cite the source, and describe what would be needed to re-certify the first handful rigorously.", hint: "Use LMFDB/Odlyzko tables as data pointers, not as proofs.", answer: "Matching published t-values is necessary but not sufficient without error proofs." },
    prerequisites: [90, 53, 12],
    readings: [R.odlyzko, R.lmfdbZeta, R.aimathRh],
    opensExperiments: true,
  })
    ],
  },
  {
    id: "inv-research",
    title: "Research apprenticeship",
    goal: "Practice reading, reproducing, surveying and carefully bounding new claims.",
    fromId: 92,
    toId: 100,
    orientation: "Stage 8 is apprenticeship craft: primary sources, personal write-ups, tiny rigorous computations, surveys, subproblems, claim hygiene, and a hostile checklist. The Clay problem stays open.",
    readings: [R.edwards, R.davenport, R.conreyAms, R.clayRh, R.aimathRh, R.arxivRhSurvey],
    lessons: [
  L({
    id: 92,
    title: "Read Riemann's paper and a modern reconstruction",
    outcome: "Compare Riemann's 1859 memoir with a modern write-up of the same arguments.",
    claims: [
        { text: "Riemann's memoir sketches the functional equation and states the hypothesis on nontrivial zeros.", status: "theorem" }
    ],
    concept: "Riemann’s 1859 memoir",
    explanation: "Riemann’s eight-page memoir introduces ζ analytically, sketches the functional equation, and states the famous hypothesis.",
    whyItMatters: "Primary source discipline: know what Riemann claimed, sketched, and left open.",
    task: { prompt: "Read Riemann’s memoir alongside Edwards or a modern reconstruction; list which steps are sketches vs complete proofs by modern standards.", hint: "Functional equation sketch vs Hadamard–de la Vallée Poussin completeness later.", answer: "RH is stated, not proved; several analytic details were completed by later authors." },
    prerequisites: [43, 45, 47],
    readings: [R.edwards, R.clayRh, R.conreyAms],
  }),
  L({
    id: 93,
    title: "Reprove the PNT and the standard explicit formula",
    outcome: "Write a complete personal proof of PNT via zero-free line and an explicit formula derivation.",
    claims: [
        { text: "The prime number theorem is a theorem; RH-quality error terms are not unconditional.", status: "theorem" }
    ],
    concept: "Personal PNT write-up",
    explanation: "A complete personal proof of PNT and a derivation of an explicit formula cement the subject’s core.",
    whyItMatters: "Separates what is known (PNT) from what is not (RH errors). Essential apprenticeship.",
    task: { prompt: "Write a self-contained proof that ζ(1+it)≠0 implies ψ(x)∼x, and derive a classical explicit formula form.", hint: "Follow Davenport or Ingham’s outline without skipping contour estimates.", answer: "Final write-up should name every non-vanishing and growth input." },
    prerequisites: [47, 49, 50],
    readings: [R.davenport, R.ingham, R.titchmarsh],
  }),
  L({
    id: 94,
    title: "Reproduce one classical zero-density or mean-value result",
    outcome: "Rebuild a classical zero-density or mean-value estimate from a standard reference.",
    claims: [
        { text: "Classical zero-density theorems are proved but quantitatively weaker than RH.", status: "theorem" }
    ],
    concept: "Reproduce a density theorem",
    explanation: "Rebuilding one classical density or mean-value theorem teaches real technique beyond slogans.",
    whyItMatters: "These theorems power applications that RH would strengthen but that already have unconditional proofs at weaker strength.",
    task: { prompt: "Pick one theorem (e.g. a classical N(σ,T) bound or a mean value of |ζ(½+it)|²) and rewrite a complete proof from a standard text.", hint: "Iwaniec–Kowalski or Titchmarsh are suitable sources.", answer: "Success means a proof you can defend line-by-line, not a citation." },
    prerequisites: [55, 52, 74],
    readings: [R.iwaniecKowalski, R.titchmarsh],
  }),
  L({
    id: 95,
    title: "Reproduce a modest rigorous zero verification with interval arithmetic",
    outcome: "Certify a small initial segment of critical-line zeros with interval methods.",
    claims: [
        { text: "A finite rigorous zero verification is numerical evidence, never a proof of RH.", status: "numerical-evidence" }
    ],
    concept: "Tiny rigorous zero certificate",
    explanation: "Certifying even the first zero with enclosures trains the full pipeline at small height.",
    whyItMatters: "If you cannot certify a tiny range rigorously, large-T claims are theatre.",
    task: { prompt: "Rigorously enclose a sign change of Z near the first published zero and isolate a simple zero on the line in a small box.", hint: "Use interval evaluations and Rouche/argument on a small rectangle.", answer: "One isolated simple zero on the line is a finite theorem; RH quantifies over all zeros." },
    prerequisites: [90, 88, 53],
    readings: [R.numericalRecipesCaveat, R.odlyzko, R.dlmfZeta],
    opensExperiments: true,
  }),
  L({
    id: 96,
    title: "Attend analytic-number-theory seminars and write literature surveys",
    outcome: "Produce a survey note that separates theorems, conjectures and heuristics in a subtopic.",
    claims: [
        { text: "Seminar and survey practice improves claim hygiene; it does not by itself prove new theorems.", status: "heuristic" }
    ],
    concept: "Survey and seminars",
    explanation: "Survey writing forces status labels: theorem / conjecture / heuristic / numerical evidence.",
    whyItMatters: "RH-adjacent literature is full of subtle status slips. Hygiene is part of the craft.",
    task: { prompt: "Write a 3–5 page survey of one subtopic (e.g. pair correlation or Robin criteria) with explicit status tags on every major claim.", hint: "Use Conrey’s Notices article and AIM RH pages as starting pointers.", answer: "A good survey never upgrades a heuristic to a theorem in the telling." },
    prerequisites: [65, 85, 45],
    readings: [R.conreyAms, R.aimathRh, R.arxivRhSurvey],
  }),
  L({
    id: 97,
    title: "Select a tractable subproblem: bounds, moments, explicit constants, computation, or an L-function family",
    outcome: "Choose a subproblem with a clear success criterion short of proving RH.",
    claims: [
        { text: "Tractable subproblems advance understanding without claiming a full resolution of RH.", status: "heuristic" }
    ],
    concept: "Choosing a subproblem",
    explanation: "Progress usually means better bounds, moments, constants, computations, or family results — not a sudden RH proof.",
    whyItMatters: "Healthy research targets are falsifiable and short of solving the Clay problem in one swing.",
    task: { prompt: "Propose one subproblem with: precise statement, known baseline, success criterion, and why it does not claim to prove RH.", hint: "Examples: improve an explicit constant; certify zeros to a new modest height with a documented method; compute a moment.", answer: "If the success criterion is “prove RH”, restart the exercise." },
    prerequisites: [96, 75, 91],
    readings: [R.aimathRh, R.conreyAms, R.iwaniecKowalski],
  }),
  L({
    id: 98,
    title: "Formulate claims with explicit hypotheses and quantifiers",
    outcome: "Rewrite informal claims until every quantifier and hypothesis is explicit.",
    claims: [
        { text: "A mathematical claim is only as clear as its quantifiers and hypotheses.", status: "heuristic" }
    ],
    concept: "Claim hygiene",
    explanation: "Every serious claim needs explicit quantifiers, hypotheses, and status.",
    whyItMatters: "Fake RH proofs almost always smuggle unjustified swaps of limits or incomplete quantifiers.",
    task: { prompt: "Take five sentences from an online RH discussion and rewrite each with quantifiers, hypotheses, and a status label.", hint: "Reject any sentence that cannot be so rewritten.", answer: "Example statuses: theorem (cite), conjecture (RH), heuristic, numerical evidence (finite)." },
    prerequisites: [1, 45],
    readings: [R.clayRh, R.conreyAms],
  }),
  L({
    id: 99,
    title: "Seek peer review before treating an argument as new mathematics",
    outcome: "Subject any purported advance to external critical reading before asserting novelty.",
    claims: [
        { text: "Peer review is a social filter; correctness still rests on complete proofs.", status: "heuristic" }
    ],
    concept: "External criticism",
    explanation: "New claims need competent adversarial reading. Peer review is necessary social process, not magic validation.",
    whyItMatters: "The graveyard of RH proofs is full of unchecked manuscripts. Process matters.",
    task: { prompt: "Write a referee checklist for a claimed proof of an RH-equivalent inequality (hypotheses, quantifiers, contour shifts, error terms, literature).", hint: "Include a step that tries to falsify the argument on a known special case.", answer: "Correctness is mathematical, not sociological; review only increases detection odds." },
    prerequisites: [98, 96],
    readings: [R.clayRh, R.aimathRh],
  }),
  L({
    id: 100,
    title: "Treat any direct RH proof as incomplete until every analytic continuation, limit, boundary term, and zero count is independently checked",
    outcome: "Apply a hostile checklist to any claimed RH proof sketch.",
    claims: [
        { text: "No complete accepted proof of RH is known; unverified sketches remain incomplete.", status: "heuristic" }
    ],
    concept: "Hostile checklist for RH claims",
    explanation: "A claimed RH proof is incomplete until continuation, limits, boundary terms, growth estimates, and zero bookkeeping are all checked independently.",
    whyItMatters: "Final discipline item: the problem remains open. This app is a study tool, not an oracle.",
    task: { prompt: "Build a one-page hostile checklist and apply it to a historical failed approach (high-level, without ridicule of persons).", hint: "Check: contour shift justified? Dominants? Equality cases? Equivalent criteria used correctly? Finite numerics mispromoted?", answer: "RH stays a conjecture until a complete accepted proof exists. Finite computations stay numerical evidence." },
    prerequisites: [99, 98, 45, 90],
    readings: [R.clayRh, R.conreyAms, R.aimathRh, R.edwards],
  })
    ],
  },
];

export const INVESTIGATION_LESSONS: readonly InvestigationLesson[] =
  INVESTIGATION_STAGES.flatMap((stage) => stage.lessons);

export function investigationLessonById(id: number): InvestigationLesson | undefined {
  return INVESTIGATION_LESSONS.find((lesson) => lesson.id === id);
}

export function stageForInvestigationId(id: number): InvestigationStage | undefined {
  return INVESTIGATION_STAGES.find((stage) => id >= stage.fromId && id <= stage.toId);
}

/** Lessons that genuinely use the Hardy Z Experiments workbench. */
export function lessonOpensExperiments(lesson: InvestigationLesson): boolean {
  return lesson.opensExperiments === true;
}
