import { derivationButton } from "../core/FormulaDerivations";

export type PrimeVisual = "Sieve" | "Ulam spiral" | "Prime gaps" | "Integer energy";

export interface PrimeChapter {
  title: string;
  objective: string;
  visual: PrimeVisual;
  limit: number;
  selected: number;
  content: string;
}

export const PRIME_CHAPTERS: readonly PrimeChapter[] = [
  {
    title: "What primes are",
    objective: "Build the definition carefully and remove the most common misconceptions.",
    visual: "Sieve",
    limit: 100,
    selected: 29,
    content: `
      <p>A <b>prime number</b> is a positive integer greater than 1 with exactly two positive
      divisors: <code>1</code> and itself. A number greater than 1 that is not prime is
      <b>composite</b>.</p>
      <ul>
        <li><code>2</code> is the smallest prime and the only even prime.</li>
        <li><code>1</code> is a <b>unit</b>, not a prime. Excluding it makes factorisation unique.</li>
        <li>Zero and negative integers are not called prime in the ordinary integer definition.
        In abstract algebra, associates such as <code>p</code> and <code>−p</code> represent the
        same prime behaviour up to multiplication by a unit.</li>
        <li>Every prime greater than 3 is of the form <code>6k ± 1</code>, but most numbers of
        that form are still composite.</li>
      </ul>
      <div class="formula" data-derivation-exempt="Definition of primality, not a derived formula"><div class="formula-label">Definition</div>
        <div class="formula-body">p is prime ⇔ p &gt; 1 and d | p implies d = 1 or d = p</div>
      </div>
      <p class="example"><b>Counterexample habit:</b> <code>25 = 6·4 + 1</code>, so looking like
      <code>6k ± 1</code> is necessary for primes above 3, not sufficient.</p>`,
  },
  {
    title: "The atoms of arithmetic",
    objective: "Understand unique factorisation, divisibility, gcd, lcm and prime exponents.",
    visual: "Sieve",
    limit: 144,
    selected: 360,
    content: `
      <p>The <b>fundamental theorem of arithmetic</b> says every integer greater than 1 is either
      prime or can be written as a product of primes in exactly one way, apart from order.</p>
      <div class="formula"><div class="formula-label">Canonical factorisation</div>
        <div class="formula-body">n = p₁ᵃ¹ p₂ᵃ² ··· pᵣᵃʳ</div>
      </div>
      <ul>
        <li><b>Euclid's lemma:</b> if prime <code>p | ab</code>, then <code>p | a</code> or
        <code>p | b</code>. This is the engine behind uniqueness.</li>
        <li>The exponent <code>vₚ(n)</code> records how many copies of <code>p</code> divide
        <code>n</code>. Products add valuations: <code>vₚ(ab)=vₚ(a)+vₚ(b)</code>.</li>
        <li><code>gcd</code> takes the smaller exponent of each prime; <code>lcm</code> takes the
        larger. Therefore <code>gcd(a,b)·lcm(a,b)=|ab|</code>.</li>
        <li>The divisor count is <code>τ(n)=∏(aᵢ+1)</code>; the divisor sum is
        <code>σ(n)=∏(pᵢᵃⁱ⁺¹−1)/(pᵢ−1)</code>.</li>
      </ul>
      ${derivationButton("prime-divisor-functions")}
      <p>Unique factorisation holds in the integers, but not in every number system. Its failure
      in rings such as <code>ℤ[√−5]</code> led to ideals and modern algebraic number theory.</p>`,
  },
  {
    title: "Finding and proving primes",
    objective: "Separate sieving, primality testing, primality proving and factorisation.",
    visual: "Sieve",
    limit: 400,
    selected: 397,
    content: `
      <p>To test a small <code>n</code>, trial division only needs possible factors up to
      <code>√n</code>: if <code>n=ab</code>, at least one of <code>a,b</code> is no larger than
      <code>√n</code>.</p>
      ${derivationButton("prime-trial-bound")}
      <ul>
        <li><b>Sieve of Eratosthenes:</b> list all primes through <code>N</code> in
        <code>O(N log log N)</code> time. Start crossing out at <code>p²</code>.</li>
        <li><b>Segmented and wheel sieves:</b> save memory and skip obvious residue classes.</li>
        <li><b>Miller–Rabin:</b> a failed round proves composite; passed random rounds make a
        strong probable prime, with error at most <code>4⁻ᵏ</code> after <code>k</code>
        independent rounds. Fixed bases are deterministic only over stated finite ranges.</li>
        <li><b>AKS:</b> unconditional deterministic polynomial time, historically proving
        <i>PRIMES is in P</i>, though not normally the fastest practical choice.</li>
        <li><b>ECPP</b> and related methods produce checkable primality certificates.
        Lucas–Lehmer is exceptionally efficient for Mersenne candidates.</li>
      </ul>
      <p><b>Primality testing is not factorisation.</b> It may be easy to prove that a 2,000-digit
      number is composite while still being extremely hard to find its factors.</p>`,
  },
  {
    title: "Why primes never end",
    objective: "Follow Euclid's proof and see stronger infinitude theorems.",
    visual: "Ulam spiral",
    limit: 625,
    selected: 31,
    content: `
      <p>Euclid proved there are infinitely many primes. Suppose the complete list were
      <code>p₁,…,pₖ</code>. Form <code>N=p₁p₂···pₖ+1</code>. No listed prime divides
      <code>N</code>, so <code>N</code> itself or one of its prime factors is missing from the
      list: a contradiction.</p>
      <p>The number <code>N</code> need not itself be prime:
      <code>2·3·5·7·11·13+1 = 30031 = 59·509</code>. The proof only needs a new prime factor.</p>
      ${derivationButton("prime-euclid")}
      <ul>
        <li>There are infinitely many primes in every reduced arithmetic progression
        <code>a, a+q, a+2q,…</code> with <code>gcd(a,q)=1</code> (Dirichlet).</li>
        <li>Euler gave an analytic proof because <code>∑1/p</code> diverges, although very slowly.</li>
        <li>There are infinitely many primes, but the fraction of integers that are prime tends
        to zero.</li>
      </ul>
      <p>The spiral shows diagonal patterns, but these do not supply a simple prime-generating
      formula. Polynomial diagonals can be prime-rich while still producing composites.</p>`,
  },
  {
    title: "How primes are distributed",
    objective: "Move from local irregularity to the global laws governing prime density.",
    visual: "Prime gaps",
    limit: 1200,
    selected: 997,
    content: `
      <p>Let <code>π(x)</code> count primes at most <code>x</code>. The
      <b>prime number theorem</b> states:</p>
      <div class="formula"><div class="formula-label">Prime number theorem</div>
        <div class="formula-body">π(x) ~ x / log x</div>
        <div class="formula-note">Equivalently, a number near x has roughly probability 1/log x
        of being prime. The logarithmic integral li(x) is usually a better approximation.</div>
      </div>
      <ul>
        <li>The <code>n</code>th prime satisfies <code>pₙ ~ n log n</code>, more accurately
        <code>n(log n + log log n − 1 + ···)</code>.</li>
        <li><b>Bertrand's postulate:</b> for every <code>n&gt;1</code>, some prime lies between
        <code>n</code> and <code>2n</code>.</li>
        <li>Prime gaps are unbounded: <code>n!+2,…,n!+n</code> are all composite.</li>
        <li>Yet infinitely many consecutive prime pairs are at most <code>246</code> apart
        (current published unconditional bound). This does not prove twin primes.</li>
        <li>Average gaps near <code>x</code> are about <code>log x</code>; individual gaps vary
        dramatically. Cramér's random model predicts maximal gaps of order <code>(log x)²</code>,
        but this is not proved.</li>
      </ul>`,
  },
  {
    title: "Primes modulo n",
    objective: "See how primes control congruences, inverses and quadratic residues.",
    visual: "Sieve",
    limit: 210,
    selected: 101,
    content: `
      <p>Modulo a prime <code>p</code>, every non-zero residue has a multiplicative inverse.
      That makes <code>ℤ/pℤ</code> a field and prevents zero divisors.</p>
      <ul>
        <li><b>Fermat's little theorem:</b> if <code>p∤a</code>, then
        <code>aᵖ⁻¹ ≡ 1 (mod p)</code>; equivalently <code>aᵖ ≡ a (mod p)</code>.</li>
        <li><b>Euler's theorem:</b> if <code>gcd(a,n)=1</code>, then
        <code>aᵠ⁽ⁿ⁾ ≡ 1 (mod n)</code>.</li>
        <li>The non-zero residues modulo <code>p</code> form a cyclic group of order
        <code>p−1</code>; its generators are primitive roots.</li>
        <li>The Chinese remainder theorem reconstructs a residue modulo a product of coprime
        moduli from its residues modulo each factor.</li>
        <li>Quadratic residues ask when <code>x²≡a (mod p)</code>. The Legendre symbol and
        quadratic reciprocity give a remarkable law relating solvability modulo different
        odd primes.</li>
      </ul>
      <p>Carmichael numbers pass Fermat's test for every coprime base despite being composite.
      They explain why stronger probable-prime tests are necessary.</p>`,
  },
  {
    title: "The zeta connection",
    objective: "Connect primes to analysis, complex zeros and the Riemann hypothesis.",
    visual: "Prime gaps",
    limit: 1600,
    selected: 1009,
    content: `
      <p>Euler connected every prime at once to the Riemann zeta function:</p>
      <div class="formula" data-derivation="prime-euler-product"><div class="formula-label">Euler product, Re(s) &gt; 1</div>
        <div class="formula-body">ζ(s) = ∑ n⁻ˢ = ∏ₚ (1 − p⁻ˢ)⁻¹</div>
      </div>
      <p>The equality is unique factorisation written as analysis. Zeta's poles and zeros encode
      fluctuations in the distribution of primes through explicit formulas.</p>
      <ul>
        <li>The “trivial” zeros are at negative even integers.</li>
        <li>All nontrivial zeros lie in <code>0&lt;Re(s)&lt;1</code>, the critical strip.</li>
        <li>The <b>Riemann hypothesis</b> says every nontrivial zero has
        <code>Re(s)=1/2</code>. It remains open.</li>
        <li>RH would sharply control the error in prime-counting estimates; it would not make
        primes periodic or reveal a simple closed formula for the next prime.</li>
        <li>Dirichlet <code>L</code>-functions generalise the Euler product to arithmetic
        progressions. Their conjectured zero behaviour is the generalized RH.</li>
      </ul>`,
  },
  {
    title: "Families and prime patterns",
    objective: "Survey named prime families without confusing examples with proved infinitude.",
    visual: "Ulam spiral",
    limit: 1024,
    selected: 127,
    content: `
      <ul>
        <li><b>Mersenne:</b> <code>2ᵖ−1</code>; primality requires prime <code>p</code>, but that
        is not sufficient. Even perfect numbers are exactly
        <code>2ᵖ⁻¹(2ᵖ−1)</code> when the Mersenne factor is prime.</li>
        <li><b>Fermat:</b> <code>2²ⁿ+1</code>. The first five are prime; all tested examples from
        <code>n=5</code> through enormous ranges are composite. Infinitely many Fermat primes
        are not known.</li>
        <li><b>Twin, cousin, sexy:</b> prime pairs differing by 2, 4 and 6.
        <b>Sophie Germain</b> primes have <code>2p+1</code> prime; that partner is a safe prime.</li>
        <li><b>Primorial, factorial, repunit, palindromic, emirp, balanced, isolated</b> and many
        other labels describe form or neighbourhood, not a new definition of primality.</li>
        <li><b>Green–Tao:</b> primes contain finite arithmetic progressions of every length.
        It does not say there is an infinite all-prime progression.</li>
      </ul>
      <p>Hardy–Littlewood's prime <code>k</code>-tuples conjecture predicts the frequency of every
      admissible finite pattern. “Admissible” means no prime modulus blocks every translated
      copy of the pattern.</p>`,
  },
  {
    title: "Primes beyond the integers",
    objective: "Understand that primality depends on the ring in which factorisation occurs.",
    visual: "Ulam spiral",
    limit: 729,
    selected: 13,
    content: `
      <p>In a general integral domain, an element is <b>irreducible</b> if it cannot be split
      into non-units, while it is <b>prime</b> if dividing a product forces it to divide one
      factor. In the integers these coincide; in arbitrary rings they may not.</p>
      <ul>
        <li>In the Gaussian integers <code>ℤ[i]</code>, the ordinary prime
        <code>5=(2+i)(2−i)</code> is no longer prime, while <code>3</code> remains Gaussian prime.</li>
        <li>Rational primes <code>p≡1 (mod 4)</code> split in <code>ℤ[i]</code>;
        <code>p≡3 (mod 4)</code> remain prime; <code>2</code> ramifies.</li>
        <li>Algebraic number fields replace prime numbers by <b>prime ideals</b>, which may split,
        remain inert or ramify. Dedekind restored unique factorisation at the ideal level.</li>
        <li><code>p</code>-adic numbers measure closeness by divisibility by a chosen prime.
        They provide a local view used throughout modern number theory.</li>
      </ul>
      <p>This local-to-global language powers reciprocity laws, class field theory, arithmetic
      geometry and much of the modern study of Diophantine equations.</p>`,
  },
  {
    title: "Primes in computation",
    objective: "Learn where large primes are useful and what security actually relies on.",
    visual: "Sieve",
    limit: 512,
    selected: 257,
    content: `
      <ul>
        <li><b>RSA:</b> multiplies two large secret primes. Public operations are easy; recovering
        the factors of a well-generated modulus is believed hard for classical computers.</li>
        <li><b>Diffie–Hellman and DSA:</b> use groups whose order has a large prime factor.
        Elliptic-curve systems often work over finite fields of prime order or characteristic.</li>
        <li>Prime moduli support modular inverses, finite-field arithmetic, error-correcting
        codes, hashing schemes, pseudorandom generators and fast transforms.</li>
        <li>Real key generation samples odd candidates, rejects small factors, runs strong
        probable-prime tests and, where required, generates a certificate. Randomness and
        side-channel resistance matter as much as the mathematics.</li>
        <li>Shor's quantum algorithm factors integers in polynomial time on a sufficiently large
        fault-tolerant quantum computer, threatening RSA and finite-field cryptography.
        Post-quantum cryptography uses different hard problems.</li>
      </ul>
      <p>“Uses primes” does not mean “secure.” Parameter sizes, protocols, padding, randomness,
      implementation and threat model determine security.</p>`,
  },
  {
    title: "What has been proved",
    objective: "Place landmark results on a reliable proved-results map.",
    visual: "Prime gaps",
    limit: 2000,
    selected: 2017,
    content: `
      <table class="cmp-table">
        <thead><tr><th>Result</th><th>What it establishes</th></tr></thead>
        <tbody>
          <tr><td>Euclid</td><td>Infinitely many primes</td></tr>
          <tr><td>Dirichlet</td><td>Infinitely many primes in every reduced arithmetic progression</td></tr>
          <tr><td>Prime number theorem</td><td><code>π(x) ~ x/log x</code></td></tr>
          <tr><td>Green–Tao</td><td>Arbitrarily long finite prime arithmetic progressions</td></tr>
          <tr><td>Helfgott</td><td>Every odd integer &gt; 5 is the sum of three primes</td></tr>
          <tr><td>Zhang / Maynard–Tao / Polymath</td><td>Infinitely many consecutive prime gaps ≤ 246</td></tr>
          <tr><td>AKS</td><td>Deterministic unconditional primality testing is in polynomial time</td></tr>
        </tbody>
      </table>
      <p>Other deep achievements include Vinogradov's work on sums of primes, Bombieri–Vinogradov
      average distribution in progressions, Chen's theorem that every sufficiently large even
      number is a prime plus a number with at most two prime factors, and major progress on
      primes represented by polynomials and forms.</p>
      <p>Proof and computation complement each other, but checking a huge finite range never
      proves a statement about all integers.</p>`,
  },
  {
    title: "The open frontier",
    objective: "Know exactly which famous prime claims remain conjectures.",
    visual: "Prime gaps",
    limit: 2400,
    selected: 2203,
    content: `
      <ul>
        <li><b>Riemann hypothesis:</b> all nontrivial zeta zeros lie on the critical line.</li>
        <li><b>Twin-prime conjecture:</b> infinitely many pairs <code>p,p+2</code>.</li>
        <li><b>Strong Goldbach:</b> every even integer greater than 2 is a sum of two primes.
        Weak Goldbach—the three-prime statement—is proved.</li>
        <li><b>Legendre:</b> a prime lies between every pair <code>n²,(n+1)²</code>.</li>
        <li><b>Bunyakovsky / Schinzel H / Bateman–Horn:</b> broad predictions for prime values of
        polynomials and their frequencies.</li>
        <li><b>Polignac:</b> every positive even number occurs infinitely often as a consecutive
        prime gap; twin primes are the gap-2 case.</li>
        <li>Unknown: infinitely many Mersenne, Fermat, Sophie Germain or safe primes; whether any
        odd perfect number exists; whether infinitely many primes occur between consecutive cubes.</li>
      </ul>
      <p><b>Record, not endpoint:</b> as of 12 July 2026 the largest known prime is the 52nd known
      Mersenne prime, <code>2¹³⁶²⁷⁹⁸⁴¹−1</code>, with 41,024,320 decimal digits. It was found by
      Luke Durant through GIMPS and confirmed in October 2024. There cannot be a largest prime.</p>
      <p class="example"><b>Scientific wording:</b> say “largest known,” distinguish probable
      primes from certified primes, and never turn extensive computation into a universal proof.</p>`,
  },
  {
    title: "Integer Energy Lab",
    objective: "Test the idea that an integer earns “survival energy” by passing small-prime divisibility checks, with primes as the numbers that survive through √n.",
    visual: "Integer energy",
    limit: 120,
    selected: 97,
    content: `
      <p>Trial division is a gauntlet. For each prime <code>p ≤ √n</code>, either <code>p</code>
      divides <code>n</code> and <code>n</code> is composite, or <code>n</code> <b>survives</b>
      that test. The lab treats each survival as one unit of modular
      <b>energy</b> — a bookkeeping score, not a physical quantity.</p>
      <div class="formula" data-derivation-exempt="Pedagogical scoring model, not a classical formula">
        <div class="formula-label">Survival energy</div>
        <div class="formula-body">E(n) = #{ p prime : p ≤ √n and p ∤ n }, stopping at the first dividing p</div>
        <div class="formula-note">The full budget F(n) counts every prime p ≤ √n. E(n) = F(n) if and
        only if n is prime (for n ≥ 2).</div>
      </div>
      <ul>
        <li>Plot any integer-valued expression of <code>n</code> over a bounded range.</li>
        <li>Presets include <code>n % 6</code>, <code>isprime(n)</code>, <code>phi(n)/n</code>,
        <code>mu(n)</code>, <code>omega(n)</code>, <code>gcd(n, 30)</code>, and
        <code>energy(n)</code>.</li>
        <li>Raise the <b>threshold</b> to turn a score into a primality <i>candidate</i> rule.
        The readout reports candidate count, prime hits, precision and recall so the hypothesis
        is testable, not just decorative.</li>
        <li>Custom expressions use a strict allowlisted language (arithmetic, comparisons as
        0/1, safe math, and the number-theory helpers above) — not arbitrary JavaScript.</li>
      </ul>
      <p class="example"><b>Try it:</b> load <code>survival energy</code>, set the threshold to
      match full budgets near the right edge of the range, and check that precision climbs toward
      1. Then switch to <code>n % 6</code> and watch precision collapse — residue classes alone
      do not certify primes.</p>`,
  },
] as const;

export const PRIME_REFERENCES = `
  <details class="course">
    <summary>Sources and further study</summary>
    <ul>
      <li><a href="https://www.mersenne.org/primes/?press=M136279841" target="_blank" rel="noreferrer">GIMPS: M136279841 discovery</a></li>
      <li><a href="https://annals.math.princeton.edu/2004/160-2/p12" target="_blank" rel="noreferrer">Agrawal–Kayal–Saxena: PRIMES is in P</a></li>
      <li><a href="https://annals.math.princeton.edu/2008/167-2/p03" target="_blank" rel="noreferrer">Green–Tao: arithmetic progressions in the primes</a></li>
      <li><a href="https://arxiv.org/abs/1407.4897" target="_blank" rel="noreferrer">Polymath8b: bounded prime gaps</a></li>
      <li><a href="https://www.claymath.org/millennium/riemann-hypothesis/" target="_blank" rel="noreferrer">Clay Mathematics Institute: Riemann hypothesis</a></li>
      <li><a href="https://t5k.org/" target="_blank" rel="noreferrer">The PrimePages reference collection</a></li>
    </ul>
  </details>`;
