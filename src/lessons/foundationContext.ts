import type { Lesson } from "../core/Lesson";

interface LearningContext {
  basics: string;
  advanced: string;
  discovery: string;
  source: { label: string; url: string };
  applications: string;
}

const CONTEXTS: Record<string, LearningContext> = {
  foundations: {
    basics: "numbers, arithmetic rules, and the idea that symbols can represent quantities",
    advanced: "calculus: rates of change and accumulated change",
    discovery: "Counting came before writing. Recorded numeral systems appeared in Egypt and Mesopotamia thousands of years ago; the Hindu-Arabic decimal system later made place-value arithmetic practical across the world.",
    source: { label: "Britannica: Hindu-Arabic numerals", url: "https://www.britannica.com/topic/Hindu-Arabic-numerals" },
    applications: "Engineers use this chain whenever measurements become models: calculate a quantity, express its relationship, graph it, then predict how it changes.",
  },
  "number-sense-fractions": {
    basics: "whole numbers, equal sharing, fractions as division, and locating quantities on a number line",
    advanced: "ratios, percentages, algebraic fractions, probability, rational numbers, and exact calculation",
    discovery: "Ancient Egyptian scribes recorded unit-fraction calculations in the Rhind Mathematical Papyrus around 1650 BCE. Later Indian and Arabic mathematics developed the decimal place-value methods that make fraction and decimal calculation systematic.",
    source: { label: "MacTutor: Egyptian fractions", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Egyptian_fractions/" },
    applications: "Fractions model fair sharing, recipes, discounts, measurements, probabilities, map scales, rates, and the exact quantities used throughout algebra and science.",
  },
  "arithmetic-operations": {
    basics: "whole-number addition and subtraction as movement, multiplication as equal groups, division as sharing, and zero and one identities",
    advanced: "inverse-operation checks, algebraic laws, factorial counting, order of operations, written algorithms, and symbolic algebra",
    discovery: "Arithmetic methods developed across many cultures. Babylonian tablets used place-value calculation and multiplication tables, the Rhind Papyrus recorded Egyptian multiplication and division, and Indian mathematicians established systematic arithmetic with zero and decimal place value.",
    source: { label: "MacTutor: Indian numerals", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Indian_numerals/" },
    applications: "Arithmetic operations calculate totals, changes, batches, rates, sharing, costs, measurements, computer instructions, and factorial arrangement counts used in probability.",
  },
  "order-of-operations": {
    basics: "one operation at a time and why an expression needs an agreed reading order",
    advanced: "nested brackets, powers, and left-to-right decisions within equal-precedence operations",
    discovery: "BODMAS and PEMDAS are conventions, not discoveries by one person. They grew with symbolic algebra from the 1500s so that written expressions could be read consistently.",
    source: { label: "MacTutor: mathematical operation notation", url: "https://mathshistory.st-andrews.ac.uk/Miller/mathsym/operation/" },
    applications: "Spreadsheets, calculators, code, and engineering formulas all depend on precedence rules. Parentheses make an intended calculation unambiguous to both people and machines.",
  },
  "multiplication-division": {
    basics: "equal groups, place value, and multiplication as repeated addition",
    advanced: "written algorithms, remainders, estimates, and inverse-operation checks",
    discovery: "The Rhind Papyrus, copied around 1650 BCE, records Egyptian multiplication and division by repeated doubling and addition. Modern long-method layouts developed gradually rather than being invented by one person.",
    source: { label: "Open University: Egyptian mathematics", url: "https://www.open.edu/openlearn/science-maths-technology/mathematics-statistics/egyptian-mathematics/content-section-1.1.2/" },
    applications: "Use multiplication for quantities such as area, batches, and pricing; use division to share materials, calculate a rate, or check how many full groups fit.",
  },
  "times-tables": {
    basics: "equal groups, repeated addition, and a small set of multiplication facts",
    advanced: "decomposition, commutativity, distributive reasoning, estimation, and division checks",
    discovery: "Multiplication tables have been used for thousands of years: Babylonian clay tablets included reciprocal and multiplication tables, while the familiar decimal tables spread with Hindu-Arabic arithmetic and printed textbooks.",
    source: { label: "MacTutor: Babylonian mathematics", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Babylonian_mathematics/" },
    applications: "Times-table fluency supports mental arithmetic, pricing, area, scaling recipes, unit conversion, division, algebraic expansion, and efficient estimation in everyday work.",
  },
  "algebraic-laws": {
    basics: "terms and factors, and the difference between adding like terms and multiplying repeated factors",
    advanced: "factoring, polynomial expansion, index laws, symbolic manipulation, and proof by algebraic equivalence",
    discovery: "Al-Khwarizmi's early ninth-century algebra organized methods for balancing and reducing equations. Viète and Descartes later made symbolic letters and exponent notation central, allowing general laws to be written compactly.",
    source: { label: "MacTutor: algebra history", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Algebra_history/" },
    applications: "Algebraic laws let spreadsheets, compilers, calculators, and engineers simplify expressions without changing what they mean. They also prevent common mistakes when expanding brackets or working with powers.",
  },
  binomials: {
    basics: "a two-term expression and distribution as every term multiplying every other term",
    advanced: "Pascal coefficients, general powers, combinations, and binomial probability",
    discovery: "Integer binomial expansions were known in medieval Islamic and Chinese mathematics. Newton's major extension, around 1665, was a generalized binomial series that also works for non-integer exponents.",
    source: { label: "Britannica: binomial theorem", url: "https://www.britannica.com/science/binomial-theorem" },
    applications: "Binomial coefficients count arrangements: coin outcomes, reliability cases, team choices, and terms in algebraic approximations.",
  },
  "unit-conversions": {
    basics: "a quantity has both a number and a unit, and a unit fraction equal to one changes only its label",
    advanced: "chained factors, SI prefixes, affine temperature scales, and dimensional checks",
    discovery: "Dimensional reasoning is older than its modern name, but Edgar Buckingham gave it a systematic framework in 1914. The factor-label method preserves a quantity while units cancel.",
    source: { label: "NIST: Buckingham Pi theorem", url: "https://www.nist.gov/blogs/taking-measure/life-buckingham-pi" },
    applications: "Scientists and engineers convert sensor readings, recipe and medication quantities, travel speeds, and design dimensions while checking that equations have compatible units.",
  },
  "rearranging-equations": {
    basics: "an equals sign means two expressions have the same value, so every legal move affects both sides",
    advanced: "collecting variables, fractions, rearranging formulas, and recognising no or infinitely many solutions",
    discovery: "Babylonian mathematicians used procedures equivalent to solving quadratics around 1800 BCE. François Viète's 1591 work later made systematic symbolic treatment of known and unknown quantities possible.",
    source: { label: "MacTutor: history of equation solving", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Quadratic_etc_equations/" },
    applications: "Rearrange formulas to calculate a required speed, resistance, density, concentration, or loan variable from the measurements you already know.",
  },
  vectors: {
    basics: "a vector has magnitude and direction, represented by an arrow and its components",
    advanced: "addition, subtraction, projections via the dot product, and oriented area via the cross product",
    discovery: "Directed quantities existed before vector algebra. Hamilton's quaternions (1843) and Grassmann's extension theory (1844) were major steps toward the modern formalism; dot and cross notation came later.",
    source: { label: "MacTutor: vector calculus history", url: "https://mathshistory.st-andrews.ac.uk/Extras/Vector_calculus_problems/" },
    applications: "Vectors model displacement and force, aim a game or robot, project sunlight onto a panel, and calculate work from a force acting along a path.",
  },
  "complex-numbers": {
    basics: "the real number line and the new number i, whose square is -1",
    advanced: "the Argand plane, polar form, multiplication as rotation, powers, and roots of unity",
    discovery: "Square roots of negative numbers appeared while Renaissance mathematicians solved cubic equations. Cardano published them in 1545, and Bombelli gave the first systematic calculation rules in 1572.",
    source: { label: "MacTutor: Rafael Bombelli", url: "https://mathshistory.st-andrews.ac.uk/Biographies/Bombelli/" },
    applications: "Complex numbers make AC power, radio and GPS signal phase, 2D rotations, and control systems easier to calculate without losing direction information.",
  },
  probability: {
    basics: "sample spaces, events, equally likely outcomes, relative frequency, and probabilities from zero to one",
    advanced: "conditional probability, expectation, discrete and continuous distributions, Bayes' rule, sampling error, and the central limit theorem",
    discovery: "Pascal and Fermat's 1654 correspondence about an unfinished gambling game helped launch mathematical probability. Huygens published its first textbook, Bayes and Laplace developed inverse probability, and Kolmogorov supplied modern axioms in 1933.",
    source: { label: "MacTutor: history of probability", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Probability/" },
    applications: "Probability supports quality control, reliability, forecasts, medical diagnosis, insurance, polling, experiments, machine learning, and decisions made with incomplete evidence.",
  },
  "markov-chains": {
    basics: "states, conditional probability, and transitions whose outgoing probabilities sum to one",
    advanced: "matrix powers, stationary distributions, absorbing states, hidden states, and testing the memoryless assumption",
    discovery: "Andrey Markov introduced chains of dependent events in 1906. His famous early example counted vowel and consonant patterns in Pushkin's Eugene Onegin to show that probability theory could analyse dependent sequences.",
    source: { label: "MacTutor: Andrey Markov", url: "https://mathshistory.st-andrews.ac.uk/Biographies/Markov/" },
    applications: "Markov chains model weather, equipment condition, queues, customer movement, genetics, language, web navigation, and any system that changes probabilistically between named states.",
  },
  "stochastic-processes": {
    basics: "a random variable indexed by time, the distinction between a process and one realised sample path, and discrete versus continuous time and state spaces",
    advanced: "ensemble means, covariance, stationarity, ergodicity, random walks, Poisson arrivals, Brownian motion, martingales, and stochastic differential equations",
    discovery: "Stochastic-process theory grew from several problems: Poisson counts in 1837, Bachelier's 1900 price model, Pearson's 1905 random walk, Einstein and Smoluchowski's 1905 diffusion theory, Wiener's 1923 Brownian construction, and Kolmogorov's 1930s foundations.",
    source: { label: "MacTutor: Norbert Wiener", url: "https://mathshistory.st-andrews.ac.uk/Biographies/Wiener_Norbert/" },
    applications: "Stochastic processes model queues, reliability, machine states, inventory, demand, signals, weather, populations, networks, diffusion, finance, and any uncertain system whose behaviour evolves.",
  },
  "pascal-triangle": {
    basics: "build each row by adding the two entries above it",
    advanced: "binomial coefficients, combinations, probability, Fibonacci diagonals, and fractal patterns",
    discovery: "Pascal's Triangle is much older than Pascal. Jia Xian used it in 11th-century China, Yang Hui popularized it in the 13th century, and related forms appeared in medieval Persia.",
    source: { label: "Britannica: Pascal's triangle", url: "https://www.britannica.com/science/Pascals-triangle" },
    applications: "The entries count routes, combinations, card hands, and exact outcomes in repeated yes/no experiments such as coin flips.",
  },
  powers: {
    basics: "a power is repeated multiplication and each extra exponent multiplies by the base",
    advanced: "exponential models, powers of ten, binary state spaces, and logarithms as inverse powers",
    discovery: "Superscript exponent notation was popularized by Descartes in 1637. Bernoulli met the number later called e through continuous compounding in 1683, and Euler developed its modern notation and theory.",
    source: { label: "MacTutor: history of e", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/e/" },
    applications: "Powers describe binary storage, compound interest, scientific notation, population growth, radioactive decay, and the rapidly growing search spaces used in computing.",
  },
  "prime-numbers": {
    basics: "a prime has exactly two positive factors, and every whole number can be factorised into primes",
    advanced: "sieves, patterns and gaps, cryptography, proofs, algorithms, and open questions",
    discovery: "Prime numbers were studied in ancient Greece rather than discovered by one person. Around 300 BCE, Euclid gave the first known proof that there are infinitely many primes.",
    source: { label: "Euclid, Elements IX.20", url: "https://mathcs.clarku.edu/~djoyce/elements/bookIX/propIX20.html" },
    applications: "Prime factorisation supports cryptography, error checking, hashing, and the algorithms that secure online communication.",
  },
  "mersenne-primes": {
    basics: "powers of two, binary place value, and the difference between a necessary condition and a proof",
    advanced: "the Lucas-Lehmer recurrence, the Euclid-Euler perfect-number theorem, distributed searches, and open questions",
    discovery: "Euclid linked primes of the form 2ᵖ - 1 to even perfect numbers around 300 BCE. Marin Mersenne's influential 1644 list gave the family its name, while Lucas and Lehmer later developed its specialised primality test.",
    source: { label: "Britannica: Mersenne prime", url: "https://www.britannica.com/science/Mersenne-prime" },
    applications: "Mersenne primes let researchers benchmark high-precision arithmetic and distributed computing. Their one-to-one connection with even perfect numbers also turns each successful primality test into a result about another rare number family.",
  },
  logarithms: {
    basics: "a logarithm asks which exponent produces a given value",
    advanced: "log rules, natural logarithms, continuous growth, inverse functions, and logarithmic scales",
    discovery: "John Napier published logarithms in 1614 to replace difficult multiplication with addition. Bürgi published a related table in 1620; their modern interpretation as exponents developed later.",
    source: { label: "Britannica: logarithm", url: "https://www.britannica.com/science/logarithm" },
    applications: "Logs compress enormous ranges for pH, decibels, earthquake magnitude, compound interest, half-life, algorithms, and solving exponential equations.",
  },
};

const CHAPTER_CONTEXTS: Record<string, LearningContext> = {
  arithmetic: CONTEXTS.foundations,
  algebra: CONTEXTS["rearranging-equations"],
  expressions: CONTEXTS["rearranging-equations"],
  graphs: {
    basics: "a coordinate pair, axes, and plotting a value",
    advanced: "functions, intercepts, gradients, roots, and turning points",
    discovery: "Fermat and Descartes independently developed analytic geometry in the 1630s, systematically linking equations with geometric loci. Today's perpendicular x-y axes are a later convention.",
    source: { label: "Britannica: analytic geometry", url: "https://www.britannica.com/science/mathematics/Analytic-geometry" },
    applications: "Graphs turn data and equations into visible trends, supporting motion tracking, calibration charts, financial analysis, and engineering design.",
  },
  linear: {
    basics: "a first-power equation and the idea of balancing two expressions",
    advanced: "slope-intercept form, simultaneous equations, substitution, and elimination",
    discovery: "Linear-equation methods have no single discoverer. China's Nine Chapters used coefficient arrays, elimination, and back-substitution centuries before Gauss; 'Gaussian elimination' is a later name.",
    source: { label: "MacTutor: Nine Chapters", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Nine_chapters/" },
    applications: "Linear models describe fixed-rate costs, calibration lines, mixture problems, and the crossing point of two competing plans.",
  },
  polynomial: {
    basics: "terms, powers, and degree",
    advanced: "quadratic roots, factor theorem, discriminants, and higher-degree equations",
    discovery: "Babylonian procedures solved problems equivalent to quadratics; al-Khwarizmi later gave systematic quadratic rules. Renaissance Italian mathematicians then developed methods for cubics and quartics.",
    source: { label: "MacTutor: polynomial equations", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Quadratic_etc_equations/" },
    applications: "Polynomial models approximate trajectories, curved structures, signals, and the local behaviour of more complicated functions.",
  },
  binomials: CONTEXTS.binomials,
  "partial-fractions": {
    basics: "a rational expression and factorising its denominator",
    advanced: "decomposition patterns, repeated factors, improper fractions, integration, and transforms",
    discovery: "Partial fractions is an algebraic technique rather than a discovered law. Leibniz pursued decomposition for rational-function integration, and Johann Bernoulli published a systematic algorithm in 1703.",
    source: { label: "Bronstein: Symbolic Integration I", url: "https://www.gbv.de/dms/goettingen/216009359.pdf" },
    applications: "Partial fractions make rational expressions easier to integrate, transform, and use in circuit and control-system models.",
  },
  trigonometry: {
    basics: "right triangles, side ratios, and the meaning of an angle",
    advanced: "the unit circle, sine and cosine rules, identities, and waves",
    discovery: "Trigonometry grew from astronomical calculation. Hipparchus made the first known chord table around 140 BCE, and Aryabhata's later half-chord table was effectively the first sine table.",
    source: { label: "Britannica: trigonometry", url: "https://www.britannica.com/science/trigonometry" },
    applications: "Trigonometry measures inaccessible heights and distances and models navigation, surveying, rotations, waves, and alternating current.",
  },
  functions: {
    basics: "an input-output rule with one output for every allowed input",
    advanced: "domain and range, composition, inverses, and graphical transformations",
    discovery: "The function concept evolved from geometry into a general mathematical idea. Euler introduced f(x) in 1734 and made functions central to analysis, though his definition was narrower than today's abstract mapping.",
    source: { label: "MacTutor: function concept", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Functions/" },
    applications: "Functions model a thermostat's response, a tax calculation, a sensor calibration, and a program that turns inputs into predictable outputs.",
  },
  "trig-exp": {
    basics: "repeating change and repeated multiplication",
    advanced: "amplitude, frequency, phase, exponential growth and decay, and Euler's formula",
    discovery: "Euler did not invent these functions, but his 1748 formula e^(iθ) = cos θ + i sin θ revealed their celebrated connection through complex numbers.",
    source: { label: "MacTutor: trigonometric functions", url: "https://mathshistory.st-andrews.ac.uk/HistTopics/Trigonometric_functions/" },
    applications: "Trigonometric functions model sound and signals; exponentials model charging circuits, cooling, population change, and radioactive decay.",
  },
  differentiation: {
    basics: "average change, secant slopes, and the question of instantaneous change",
    advanced: "limits, derivative rules, optimisation, and velocity and acceleration",
    discovery: "Tangent and extremum techniques came before calculus. Newton and Leibniz independently organized them into general differentiation algorithms; Leibniz published first in 1684.",
    source: { label: "Britannica: Newton and Leibniz", url: "https://www.britannica.com/science/mathematics/Newton-and-Leibniz" },
    applications: "Differentiate to find speed from position, optimise a design, estimate sensitivity, and control a system that changes over time.",
  },
  integration: {
    basics: "accumulating small pieces of area or quantity",
    advanced: "definite integrals, antiderivatives, the fundamental theorem, and numerical approximation",
    discovery: "Area and volume techniques reach back to Eudoxus and Archimedes. Modern integration emerged from the fundamental theorem linking area and rate of change; Leibniz's ∫ is a long-s notation for a sum.",
    source: { label: "Britannica: discovery of the theorem", url: "https://www.britannica.com/science/analysis-mathematics/Discovery-of-the-theorem" },
    applications: "Integrate to recover distance from velocity, total charge from current, energy from power, and accumulated quantities from a measured rate.",
  },
};

function contextCard(context: LearningContext, className: string): string {
  return `
    <section class="${className}" aria-label="Learning context">
      <h3>Learning journey</h3>
      <ol>
        <li><b>Start with:</b> ${context.basics}.</li>
        <li><b>Build toward:</b> ${context.advanced}.</li>
      </ol>
      <details>
        <summary>Discovery and history</summary>
        <p>${context.discovery} <a href="${context.source.url}" target="_blank" rel="noreferrer">${context.source.label}</a></p>
      </details>
      <p class="foundation-application"><b>Where this matters:</b> ${context.applications}</p>
    </section>`;
}

export function withFoundationContext(lesson: Lesson, html: string): string {
  const context = lesson.category === "Foundations" ? CONTEXTS[lesson.id] : undefined;
  return context ? `${contextCard(context, "foundation-context")}${html}` : html;
}

export function foundationChapterContext(chapterId: string): string {
  const context = CHAPTER_CONTEXTS[chapterId];
  return context ? contextCard(context, "foundation-chapter-context") : "";
}
