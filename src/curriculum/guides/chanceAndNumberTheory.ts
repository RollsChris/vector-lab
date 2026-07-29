import type { LessonGuide } from "../types";

/**
 * Teaching guides for Stage 7 probability and randomness and Stage 8 number theory.
 */
export const CHANCE_AND_NUMBER_THEORY_GUIDES: readonly LessonGuide[] = [
  {
    id: "probability",
    plainEnglish:
      "Probability measures how likely an uncertain result is and helps us combine what we already believe with new evidence. This lesson builds that skill from simple games through repeated attempts, measurements, and test results.",
    objectives: [
      "calculate probabilities from equally likely outcomes and complements",
      "combine overlapping or independent events without double-counting outcomes",
      "compute conditional probabilities and update a base rate using Bayes' rule",
      "calculate expected value, variance, and standard deviation for a discrete random variable",
      "predict binomial probabilities and explain how larger samples stabilise averages",
    ],
    whyItMatters:
      "Medical diagnosis, fraud alerts, weather forecasts, insurance prices, quality control, and A/B tests all require probabilities that account for base rates, uncertainty, and sampling error.",
    keyIdea:
      "Probability is careful bookkeeping over every possible outcome: new information narrows the outcomes still in play, while repeated trials reveal stable long-run patterns.",
    workedExample: {
      prompt:
        "A condition affects 1% of 10,000 people. A test detects 90% of affected people and correctly clears 95% of healthy people. What is the probability that a person who tests positive has the condition?",
      steps: [
        "10,000 × 0.01 = 100 affected people, using the 1% base rate.",
        "100 × 0.90 = 90 true positives, because the test detects 90% of affected people.",
        "9,900 × 0.05 = 495 false positives, because 5% of healthy people test positive.",
        "90 + 495 = 585 positive results in total, combining true and false positives.",
        "P(condition | positive) = 90 ÷ 585 = 2 ÷ 13 ≈ 0.1538, so divide the relevant positives by all positives.",
      ],
      answer:
        "The probability that a person with a positive result has the condition is about 15.38%.",
    },
    pitfalls: [
      "Adding probabilities of events that can happen together → use P(A or B) = P(A) + P(B) − P(A and B)",
      "Multiplying probabilities just because two events occur together → multiply directly only when the events are independent, or use P(A and B) = P(A | B)P(B)",
      "Treating an expected value as a guaranteed single result → interpret it as the long-run average over many repetitions",
      "Reading test sensitivity as P(condition | positive) → include the condition's base rate and the test's false-positive rate with Bayes' rule",
    ],
    checks: [
      {
        question: "What is the probability of rolling an even number on a fair six-sided die?",
        answer:
          "The even outcomes are 2, 4, and 6, so 3 of the 6 equally likely outcomes work: 3 ÷ 6 = 1 ÷ 2.",
      },
      {
        question: "What is the probability of getting at least one head in two fair coin flips?",
        answer:
          "The only result with no heads is TT, with probability 1 ÷ 4. Taking the complement gives 1 − 1 ÷ 4 = 3 ÷ 4.",
      },
      {
        question: "What is the probability of exactly two heads in four fair coin flips?",
        answer:
          "There are C(4,2) = 6 positions for the two heads, and each four-flip sequence has probability 1 ÷ 16. Therefore P(exactly two heads) = 6 ÷ 16 = 3 ÷ 8.",
      },
    ],
    tryThis:
      "Open P.5 Discrete distributions, set Trials / dice to 8, and move Success chance p from 0.20 to 0.50 and then 0.80; watch the most likely number of successes move across the bars.",
  },
  {
    id: "markov-chains",
    plainEnglish:
      "Some systems move between a small set of conditions, with the next move depending only on where the system is now. This lesson shows how to forecast all possible moves instead of guessing one future.",
    objectives: [
      "list the states and verify that every state's outgoing probabilities total one",
      "compute one-step and multi-step forecasts from a transition matrix",
      "predict the long-run balance of a well-mixing chain",
      "identify an absorbing state and explain why it cannot be left",
      "distinguish one random sample path from the full probability forecast",
    ],
    whyItMatters:
      "Markov chains power web-page ranking, customer-retention forecasts, machine-maintenance planning, queueing models, genetics, and speech recognition.",
    keyIdea:
      "Picture probability flowing along every arrow at once: matrix multiplication gathers all routes into the next forecast.",
    workedExample: {
      prompt:
        "In the lesson's weather model, today is certainly Sunny. What are the probabilities of Sunny, Cloudy, and Rainy weather after two days?",
      steps: [
        "p₀ = [1, 0, 0], because today is certainly Sunny.",
        "p₁ = [1, 0, 0]P = [0.70, 0.20, 0.10], using the Sunny row for tomorrow.",
        "P(Sunny after 2 days) = 0.70 × 0.70 + 0.20 × 0.30 + 0.10 × 0.20 = 0.57, summing every route into Sunny.",
        "P(Cloudy after 2 days) = 0.70 × 0.20 + 0.20 × 0.40 + 0.10 × 0.30 = 0.25, summing every route into Cloudy.",
        "P(Rainy after 2 days) = 0.70 × 0.10 + 0.20 × 0.30 + 0.10 × 0.50 = 0.18, and 0.57 + 0.25 + 0.18 = 1 confirms a complete forecast.",
      ],
      answer:
        "After two days the forecast is 57% Sunny, 25% Cloudy, and 18% Rainy.",
    },
    pitfalls: [
      "Reading a matrix column as the probabilities leaving a state → in this lesson, each row is the source state and each column is the destination",
      "Following only the most likely arrow → include every possible route by multiplying the probability distribution by the transition matrix",
      "Accepting an outgoing row that does not total one → correct the probabilities because exactly one next state must occur",
      "Treating one displayed sample path as the forecast → use the node percentages for the distribution; the path is only one possible history",
    ],
    checks: [
      {
        question: "If today is Sunny, what is the probability of Rainy weather tomorrow in the weather model?",
        answer:
          "Read the Sunny row and Rainy column of the transition matrix. That entry is 0.10, so the probability is 10%.",
      },
      {
        question: "Why is the Churned state absorbing in the customer-retention model?",
        answer:
          "Its outgoing row is [0, 0, 1]. Once the chain enters Churned, the next state is Churned with probability 1 and every other move has probability 0.",
      },
      {
        question: "Why can two sample paths differ even when their forecast distribution is identical?",
        answer:
          "The distribution assigns probabilities to all possible transitions, while each sample path makes one random choice at every step. Different choices can occur under the same rules.",
      },
    ],
    tryThis:
      "Set Application to Weather, Starting state to 1, and Forecast steps to 1, then raise Forecast steps to 20; change Random seed while keeping the other controls fixed to see sample paths change while the probability forecast does not.",
  },
  {
    id: "stochastic-processes",
    plainEnglish:
      "A quantity that changes over time can be partly predictable and partly random. This lesson compares several ways to describe its many possible histories, from event counts to wandering paths.",
    objectives: [
      "classify a process by whether its time and possible values are discrete or continuous",
      "compute the expected position and variance of a biased random walk",
      "calculate expected event counts and waiting times for a Poisson process",
      "predict how an AR(1) shock decays when the persistence has magnitude below one",
      "calculate the mean and spread of Brownian motion from its drift and volatility",
    ],
    whyItMatters:
      "Call-centre staffing uses Poisson arrivals, inventory and forecast errors use random walks, signal processing uses mean-reverting models, and particle diffusion and finance use Brownian motion.",
    keyIdea:
      "A stochastic process is not one wiggly line but a rule for producing every line that could happen over time.",
    workedExample: {
      prompt:
        "Calls arrive as a Poisson process at an average rate of 3 per hour. For a two-hour period, find the expected call count, count variance, count standard deviation, and mean waiting time.",
      steps: [
        "λt = 3 × 2 = 6, so the expected number of calls in two hours is 6.",
        "Var(N(t)) = λt = 6, because a Poisson count has variance equal to its mean.",
        "SD(N(t)) = √6 ≈ 2.45 calls, taking the square root of the variance.",
        "E[T] = 1 ÷ λ = 1 ÷ 3 hour = 20 minutes, using the exponential waiting-time mean.",
      ],
      answer:
        "The two-hour count has mean 6, variance 6, and standard deviation about 2.45 calls; the mean wait between calls is 20 minutes.",
    },
    pitfalls: [
      "Treating one simulated path as the model's average behaviour → compare many Sample paths or use the theoretical expectation",
      "Saying a fair random walk should finish at zero → zero is its expected position, while individual paths typically wander about √n steps from it",
      "Using a constant-rate Poisson process for clustered or time-varying arrivals → use a clustered or non-homogeneous process when the arrival mechanism changes",
      "Assuming a continuous Brownian path has a smooth velocity → Brownian paths are continuous but almost surely nowhere differentiable",
    ],
    checks: [
      {
        question: "What is the expected position after 50 steps of a fair random walk with equal chances of moving up or down?",
        answer:
          "Each step has mean 0 because +1 and −1 are equally likely. Adding 50 zero-mean increments gives E[X₅₀] = 50 × 0 = 0.",
      },
      {
        question: "Why is a Poisson counting process continuous in time but discrete in state?",
        answer:
          "An event may arrive at any instant, so time is continuous. The recorded value is a count such as 0, 1, or 2, so the state is discrete.",
      },
      {
        question: "In an AR(1) process with φ = 0.8, what fraction of a shock remains after three lags?",
        answer:
          "The lesson gives lag-k persistence as φᵏ. Therefore 0.8³ = 0.512, so 51.2% of the original shock remains after three lags.",
      },
      {
        question: "For standard Brownian motion, what are the variance and standard deviation of an increment lasting 0.25 time units?",
        answer:
          "A Brownian increment of length h has variance h, so the variance is 0.25. Its standard deviation is √0.25 = 0.5.",
      },
    ],
    tryThis:
      "Open S.4 Random walks, set Time steps to 100 and Sample paths to 10, then move Walk P(up) from 0.50 to 0.70; change Random seed to separate the stable upward expectation from the changing individual paths.",
  },
  {
    id: "prime-numbers",
    plainEnglish:
      "Some whole numbers can be split only into one times themselves; these are the basic pieces from which every larger whole number is built. This lesson explores how to find them, use them, and separate proved facts from unsolved claims.",
    objectives: [
      "list prime and composite numbers and explain why one is neither",
      "factorise an integer uniquely into prime powers",
      "test a small integer for primality by checking divisors only through its square root",
      "compute the divisor count, Euler totient, and Möbius value from a prime factorisation",
      "explain why large primes support RSA while primality testing and factorisation remain different tasks",
    ],
    whyItMatters:
      "RSA encryption relies on the difficulty of factoring a product of large primes, while prime moduli also support finite-field arithmetic, error-correcting codes, hashing, and pseudorandom generators.",
    keyIdea:
      "Prime numbers are arithmetic's atoms: every integer above one has one prime factorisation, apart from the order of its factors.",
    workedExample: {
      prompt:
        "For n = 360, find its prime factorisation, number of positive divisors, Euler totient φ(360), and Möbius value μ(360).",
      steps: [
        "360 ÷ 2 ÷ 2 ÷ 2 = 45, so 360 contains the factor 2³.",
        "45 = 3 × 15 = 3² × 5, splitting the remaining composite number into primes.",
        "Therefore 360 = 2³ × 3² × 5, its unique prime factorisation.",
        "τ(360) = (3 + 1)(2 + 1)(1 + 1) = 4 × 3 × 2 = 24, choosing each prime exponent independently.",
        "φ(360) = 360(1 − 1 ÷ 2)(1 − 1 ÷ 3)(1 − 1 ÷ 5) = 96, removing numbers divisible by each distinct prime factor.",
        "μ(360) = 0 because 2² and 3² divide 360, so its factorisation is not square-free.",
      ],
      answer:
        "360 = 2³ × 3² × 5; it has 24 positive divisors, φ(360) = 96, and μ(360) = 0.",
    },
    pitfalls: [
      "Calling 1 a prime because it has no other factors → 1 is neither prime nor composite; a prime has exactly two positive divisors",
      "Testing every divisor up to n to decide primality → test possible prime divisors only through √n",
      "Assuming every number of the form 6k ± 1 is prime → this form is necessary for primes above 3 but not sufficient, as 25 = 6 × 4 + 1",
      "Treating a quick proof of compositeness as a factorisation → proving that a number is composite can be much easier than finding its factors",
    ],
    checks: [
      {
        question: "Why is 29 prime?",
        answer:
          "√29 is about 5.39, so only prime divisors 2, 3, and 5 need checking. None divides 29, so 29 has no positive divisors other than 1 and 29.",
      },
      {
        question: "What is the prime factorisation of 84?",
        answer:
          "84 = 2 × 42 = 2 × 2 × 21 = 2² × 3 × 7. Every remaining factor is prime, so the factorisation is complete.",
      },
      {
        question: "What is φ(10), and why?",
        answer:
          "The positive integers through 10 that share no prime factor with 10 are 1, 3, 7, and 9. There are four of them, so φ(10) = 4.",
      },
      {
        question: "What is the prime gap from 23 to the next prime?",
        answer:
          "The next prime is 29 because 24 through 28 are composite. The gap is 29 − 23 = 6.",
      },
    ],
    tryThis:
      "Choose the chapter The atoms of arithmetic, set Inspect n to 360, and read its factorisation, factors, divisor count, φ(n), and μ(n); then toggle Factor colours and click squares in the Sieve visual to inspect other integers.",
  },
  {
    id: "mersenne-primes",
    plainEnglish:
      "Start with one and keep doubling, then subtract one. A few results can be divided evenly only by one and themselves, and those rare numbers connect the way computers write numbers, numbers whose smaller pieces add back to the whole, and record-breaking searches.",
    objectives: [
      "calculate a Mersenne number from its exponent and write its binary form",
      "explain why a composite exponent always produces a composite Mersenne number",
      "test a prime-exponent candidate with the Lucas–Lehmer recurrence",
      "give a counterexample showing that a prime exponent does not guarantee a Mersenne prime",
      "construct an even perfect number from a Mersenne prime",
    ],
    whyItMatters:
      "The Great Internet Mersenne Prime Search distributes Lucas–Lehmer tests across volunteer computers, producing record primes and stress-testing high-precision arithmetic.",
    keyIdea:
      "A Mersenne candidate is a row of p ones in binary, but it is prime only when a prime exponent also survives the Lucas–Lehmer test.",
    workedExample: {
      prompt:
        "Use the Lucas–Lehmer test to prove that M₅ is prime, then construct the corresponding even perfect number.",
      steps: [
        "M₅ = 2⁵ − 1 = 32 − 1 = 31, forming the Mersenne candidate.",
        "Start with s₀ = 4 and run p − 2 = 3 rounds because p = 5.",
        "s₁ = 4² − 2 = 14 mod 31, applying the Lucas–Lehmer recurrence.",
        "s₂ = 14² − 2 = 194 mod 31 = 8, because 194 = 6 × 31 + 8.",
        "s₃ = 8² − 2 = 62 mod 31 = 0, so M₅ is prime after the required three rounds.",
        "2⁴ × M₅ = 16 × 31 = 496, using Euclid's perfect-number construction for p = 5.",
      ],
      answer:
        "M₅ = 31 is prime, and its corresponding even perfect number is 496.",
    },
    pitfalls: [
      "Assuming a prime exponent guarantees a Mersenne prime → p = 11 is prime but 2¹¹ − 1 = 2047 = 23 × 89",
      "Running Lucas–Lehmer as stated for any exponent → first require an odd prime exponent; p = 2 is the special case M₂ = 3",
      "Writing 2ᵖ − 1 as one followed by p zeroes in binary → it is p consecutive ones in binary",
      "Using 2ᵖMₚ for the perfect number → use 2ᵖ⁻¹Mₚ when Mₚ is prime",
    ],
    checks: [
      {
        question: "What is M₄, and why can it not be prime?",
        answer:
          "M₄ = 2⁴ − 1 = 16 − 1 = 15 = 3 × 5. The composite exponent 4 guarantees that the Mersenne number factors.",
      },
      {
        question: "Is M₇ prime?",
        answer:
          "M₇ = 2⁷ − 1 = 127. Since √127 is about 11.27 and none of 2, 3, 5, 7, or 11 divides 127, it is prime.",
      },
      {
        question: "Which perfect number comes from M₃ = 7?",
        answer:
          "Use 2³⁻¹M₃ = 2² × 7 = 28. Its positive proper divisors are 1, 2, 4, 7, and 14, which sum to 28.",
      },
    ],
    tryThis:
      "Move Exponent p through 4, 5, 11, and 13; compare the binary blocks and Lucas–Lehmer result to see a composite exponent fail, a proven Mersenne prime, a prime exponent fail, and M₁₃ = 8191 succeed.",
  },
];
