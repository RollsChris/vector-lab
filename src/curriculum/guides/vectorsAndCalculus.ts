import type { LessonGuide } from "../types";

/** Teaching guides for Stage 5 vectors and complex numbers, and Stage 6 calculus. */
export const VECTOR_AND_CALCULUS_GUIDES: readonly LessonGuide[] = [
  {
    id: "vectors",
    plainEnglish:
      "This is about using arrows to record both how far something goes and which way it goes. You will see how two arrows can be combined and compared.",
    objectives: [
      "compute a vector's length and direction from its components",
      "add and subtract vectors component by component",
      "compute a dot product and interpret its sign and projection",
      "compute a two-dimensional cross product and relate its size to area",
    ],
    whyItMatters:
      "Vectors describe aircraft headings, forces on a bridge, velocities in a game and every position or direction in a three-dimensional scene.",
    keyIdea:
      "Picture every vector as an arrow: its components tell you how to reach the tip from the tail.",
    workedExample: {
      prompt:
        "For A = (2, 1) and B = (−1, 3), find A + B, A · B and the two-dimensional cross product A × B.",
      steps: [
        "A + B = (2 + (−1), 1 + 3) = (1, 4), because vector addition combines matching components.",
        "A · B = 2 × (−1) + 1 × 3 = −2 + 3 = 1, because the dot product multiplies matching components and adds them.",
        "A × B = 2 × 3 − 1 × (−1) = 6 + 1 = 7, because the two-dimensional cross product is AₓBᵧ − AᵧBₓ.",
        "|A × B| = 7, so the parallelogram spanned by A and B has area 7; the positive sign means the turn from A to B is anticlockwise.",
      ],
      answer:
        "The sum is (1, 4), the dot product is 1, and the cross product is 7 in the positive perpendicular direction.",
    },
    pitfalls: [
      "Adding lengths instead of components → add the horizontal parts together and the vertical parts together",
      "Treating the dot product as another vector → A · B is a single number",
      "Reversing the cross-product order → B × A has the same size as A × B but the opposite sign",
      "Using the drawn arrow length as the true magnitude → display scale can change, so calculate √(x² + y²)",
    ],
    checks: [
      {
        question: "What is the magnitude of (3, 4)?",
        answer:
          "It is √(3² + 4²) = √25 = 5, because the components form the two shorter sides of a right-angled triangle.",
      },
      {
        question: "What is (1, 2) + (3, −1)?",
        answer:
          "It is (1 + 3, 2 + (−1)) = (4, 1), because matching components are added separately.",
      },
      {
        question:
          "For A = (1, 2) and B = (3, −1), what is A · B, and what does its sign suggest?",
        answer:
          "A · B = 1 × 3 + 2 × (−1) = 1. The positive result means the vectors point broadly in the same direction rather than more than a right angle apart.",
      },
      {
        question:
          "For A = (2, 0) and B = (0, 3), what area and turn direction does A × B represent?",
        answer:
          "A × B = 2 × 3 − 0 × 0 = 6. Its magnitude gives area 6, and its positive sign shows an anticlockwise turn from A to B.",
      },
    ],
    tryThis:
      "Set Vector A to (2, 0) and Vector B to (0, 3), then switch Operation through A + B, A · B and A × B. Turn on 3D cross product for A × B, then drag either white handle and watch the sum, projection and signed area change.",
  },
  {
    id: "complex-numbers",
    plainEnglish:
      "Some numbers are best pictured as points on a flat map rather than marks on a single line. In this lesson, multiplying those numbers can turn and stretch an arrow.",
    objectives: [
      "plot a complex number from its real and imaginary parts",
      "convert between rectangular form and a length with an angle",
      "add and multiply complex numbers",
      "compute powers using repeated scaling and rotation",
      "find and sketch all complex roots of a number",
    ],
    whyItMatters:
      "Complex numbers let engineers track the strength and timing of alternating current and radio signals, and let programmers rotate objects in two-dimensional graphics.",
    keyIdea:
      "A complex number is an arrow on a plane, and multiplication multiplies arrow lengths while adding their angles.",
    workedExample: {
      prompt: "Multiply z = 2 + i by w = 1 − 3i.",
      steps: [
        "(2 + i)(1 − 3i) = 2 − 6i + i − 3i², by multiplying every term in the first bracket by every term in the second.",
        "2 − 6i + i − 3i² = 2 − 5i − 3i², because the imaginary terms combine.",
        "2 − 5i − 3i² = 2 − 5i + 3, because i² = −1.",
        "2 − 5i + 3 = 5 − 5i, after combining the real terms.",
      ],
      answer: "The product is 5 − 5i.",
    },
    pitfalls: [
      "Replacing i² with 1 → i² = −1",
      "Multiplying only matching parts → expand both brackets so every term is multiplied",
      "Multiplying angles in polar form → multiply the lengths but add the angles",
      "Giving only one n-th root → a non-zero complex number has n equally spaced n-th roots",
    ],
    checks: [
      {
        question: "Where is 3 + 2i plotted?",
        answer:
          "It is plotted at (3, 2), because the real part gives the horizontal coordinate and the coefficient of i gives the vertical coordinate.",
      },
      {
        question: "What is i³?",
        answer:
          "i³ = i² × i = −1 × i = −i. Geometrically, three quarter-turns from 1 point downwards.",
      },
      {
        question: "What is (2 + i)i?",
        answer:
          "(2 + i)i = 2i + i² = 2i − 1 = −1 + 2i. Multiplication by i rotates the point (2, 1) to (−1, 2).",
      },
      {
        question: "Where are the four fourth roots of 1?",
        answer:
          "They are 1, i, −1 and −i. Each has length 1, and four roots must be spaced by 360° ÷ 4 = 90° around the unit circle.",
      },
    ],
    tryThis:
      "Choose chapter 4, Multiply by i, keep w at real 0 and imaginary 1, and drag z with its white handle. Then choose chapter 8, Roots, set z to 1 + 0i and n to 6, and use Show unit circle to check that the six roots form a regular hexagon.",
  },
  {
    id: "differentiation",
    plainEnglish:
      "This is about measuring exactly how fast something is changing at one precise instant, rather than on average over a stretch of time. It also reveals where a curve is flat, rising or falling.",
    objectives: [
      "calculate an average slope between two points",
      "differentiate powers, constants and sums",
      "find the slope and tangent line at a chosen point",
      "sketch a derivative curve from the changing slopes of the original curve",
      "use first and second derivatives to find and classify stationary points",
    ],
    whyItMatters:
      "Differentiation gives a car's speed from its position, predicts acceleration, locates peaks and valleys, and drives optimisation in engineering and economics.",
    keyIdea:
      "Move a second point ever closer to the first: the line through them settles into the tangent, whose slope is the derivative.",
    workedExample: {
      prompt:
        "For f(x) = 3x² − 4x + 2, find the derivative and the tangent line at x = 2.",
      steps: [
        "f′(x) = 6x − 4, because the power rule sends 3x² to 6x, −4x to −4 and the constant 2 to 0.",
        "f(2) = 3 × 2² − 4 × 2 + 2 = 12 − 8 + 2 = 6, so the tangent touches the curve at (2, 6).",
        "f′(2) = 6 × 2 − 4 = 8, so the tangent's slope is 8.",
        "y − 6 = 8(x − 2), using the point-slope form through (2, 6).",
        "y = 8x − 10, after expanding and rearranging.",
      ],
      answer: "The derivative is f′(x) = 6x − 4, and the tangent at x = 2 is y = 8x − 10.",
    },
    pitfalls: [
      "Dividing by zero in the derivative limit → let the gap approach zero; do not set it equal to zero",
      "Leaving the exponent unchanged → bring the power down and reduce the exponent by one",
      "Differentiating a constant to itself → a constant has derivative 0",
      "Solving f(x) = 0 to find peaks → stationary points satisfy f′(x) = 0",
    ],
    checks: [
      {
        question: "What is the average slope of f(x) = x² from x = 1 to x = 3?",
        answer:
          "The rise is f(3) − f(1) = 9 − 1 = 8 and the run is 3 − 1 = 2, so the average slope is 8 ÷ 2 = 4.",
      },
      {
        question: "Differentiate f(x) = x³ − 5x + 4.",
        answer:
          "The power rule gives 3x² from x³, −5 from −5x and 0 from the constant, so f′(x) = 3x² − 5.",
      },
      {
        question: "What is the slope of f(x) = x³ − 5x + 4 at x = 2?",
        answer:
          "Use f′(x) = 3x² − 5, then f′(2) = 3 × 2² − 5 = 12 − 5 = 7. The curve is rising with slope 7 there.",
      },
      {
        question:
          "Classify the stationary points of f(x) = x³ − 3x.",
        answer:
          "f′(x) = 3x² − 3 = 0 gives x = −1 and x = 1. Since f″(x) = 6x, f″(−1) is negative so x = −1 is a local maximum, while f″(1) is positive so x = 1 is a local minimum.",
      },
    ],
    tryThis:
      "Open numbered chapter 4, Shrink the gap, and drag secant gap h towards zero while both Secant (gold) and Tangent (green) are visible. Then turn on f′(x) (orange) and f″(x) (purple), move x (point), and compare the tangent slope with the orange curve's height.",
  },
  {
    id: "integration",
    plainEnglish:
      "This is about finding how much lies beneath a changing line by chopping the region into thin pieces and adding them. Making the pieces thinner gives a more accurate total.",
    objectives: [
      "approximate signed area with left, right, midpoint and trapezoid rules",
      "compute a definite integral over a stated interval",
      "explain why regions below the horizontal axis contribute negative area",
      "compare an approximation with a more accurate reference value",
      "relate an accumulation curve's slope to the original function",
    ],
    whyItMatters:
      "Integration totals changing quantities, such as distance from speed, water volume from flow rate, energy from power and probability from a density curve.",
    keyIdea:
      "An integral is the total of countless thin signed strips, with strips below the axis counted negatively.",
    workedExample: {
      prompt:
        "Use two midpoint rectangles to approximate ∫₀²(x + 1) dx, then compare with the exact value.",
      steps: [
        "Δx = (2 − 0) ÷ 2 = 1, because two equal slices divide an interval of width 2.",
        "The midpoints are 0.5 and 1.5, so the sampled heights are f(0.5) = 1.5 and f(1.5) = 2.5.",
        "Midpoint sum = 1 × 1.5 + 1 × 2.5 = 4, because each rectangle contributes width × sampled height.",
        "∫₀²(x + 1) dx = [x² ÷ 2 + x]₀² = (2 + 2) − 0 = 4, using an antiderivative.",
      ],
      answer: "The two-rectangle midpoint estimate is 4, which equals the exact integral 4.",
    },
    pitfalls: [
      "Counting area below the axis as positive → a definite integral uses signed area",
      "Forgetting each rectangle's width → every sampled height must be multiplied by Δx",
      "Assuming more slices fix the wrong interval → check the left and right edges before increasing n",
      "Treating the accumulated area as the original curve → its slope, not its height, equals the original function",
    ],
    checks: [
      {
        question:
          "Using one left-end rectangle, what is the estimate for ∫₀²x² dx?",
        answer:
          "The width is 2 and the left-end height is f(0) = 0, so the estimate is 2 × 0 = 0. It is poor because x² rises across the interval.",
      },
      {
        question: "What is ∫₀²(−3) dx?",
        answer:
          "The region is a rectangle of width 2 and signed height −3, so the integral is 2 × (−3) = −6. It is negative because the graph lies below the axis.",
      },
      {
        question:
          "Why does increasing the Slices n control usually reduce the Riemann-sum error?",
        answer:
          "Each slice becomes narrower, so its flat or slanted top follows the changing curve more closely. The sum therefore approaches the exact signed area.",
      },
      {
        question: "If F(x) = ∫₁ˣ2t dt, what is F′(x)?",
        answer:
          "F′(x) = 2x. Adding a tiny extra width at x adds approximately height 2x times that width, so the accumulation curve's slope is the current integrand.",
      },
    ],
    tryThis:
      "Enter x + 1 for f(x), set a to 0, b to 2 and Slices n to 2, then compare left, right, midpoint and trapezoid in Bar rule. Raise n to 100, turn on Show accumulation F(x), and compare the green curve's steepness with the blue curve's height.",
  },
  {
    id: "optimization",
    plainEnglish:
      "This is about choosing the best possible option when changing one choice affects the result. Peaks and valleys reveal the promising choices.",
    objectives: [
      "model an optimisation problem with a function and a feasible interval",
      "find stationary candidates by solving f′(x) = 0",
      "classify candidates with the second derivative",
      "compare stationary points with interval endpoints",
      "compute the input and output that give the optimum",
    ],
    whyItMatters:
      "Optimisation can minimise material in packaging, maximise a factory's output, choose the shortest route or tune a design for the best performance.",
    keyIdea:
      "At a smooth interior best point the graph is momentarily flat, so search where f′ is zero and then test each candidate.",
    workedExample: {
      prompt:
        "Squares of side x are cut from each corner of a 10 × 10 sheet and the sides are folded up. Find the cut size that maximises the open box's volume.",
      steps: [
        "V(x) = x(10 − 2x)² with 0 ≤ x ≤ 5, because the box has height x and base sides 10 − 2x.",
        "V(x) = 100x − 40x² + 4x³, so V′(x) = 100 − 80x + 12x² by the power rule.",
        "100 − 80x + 12x² = 0 gives 3x² − 20x + 25 = 0, hence x = 5 ÷ 3 or x = 5.",
        "V″(x) = −80 + 24x, and V″(5 ÷ 3) = −40 is negative, so x = 5 ÷ 3 is a local maximum; the endpoints x = 0 and x = 5 both give zero volume.",
        "V(5 ÷ 3) = (5 ÷ 3)(20 ÷ 3)² = 2000 ÷ 27 ≈ 74.07.",
      ],
      answer:
        "Cut out squares of side 5 ÷ 3, about 1.67 units; the maximum volume is 2000 ÷ 27, about 74.07 cubic units.",
    },
    pitfalls: [
      "Setting f(x) = 0 instead of f′(x) = 0 → optima are sought among stationary points and boundaries",
      "Assuming every stationary point is a maximum → use f″ or compare nearby values to classify it",
      "Ignoring the feasible interval → reject impossible inputs and test both endpoints",
      "Reporting only the best input → state both the chosen input and the resulting optimum value",
    ],
    checks: [
      {
        question: "Where is the stationary point of f(x) = x² − 6x + 5?",
        answer:
          "f′(x) = 2x − 6. Setting it to zero gives 2x − 6 = 0, so x = 3.",
      },
      {
        question: "Is the stationary point of f(x) = x² − 6x + 5 a maximum or minimum?",
        answer:
          "f″(x) = 2, which is positive, so the graph bends upwards and x = 3 is a minimum.",
      },
      {
        question:
          "Find and classify the stationary points of f(x) = x³ − 3x.",
        answer:
          "f′(x) = 3x² − 3 gives x = −1 and x = 1. Since f″(x) = 6x, x = −1 is a local maximum and x = 1 is a local minimum.",
      },
      {
        question:
          "Why must endpoints be checked when optimising on a closed interval?",
        answer:
          "The best feasible value can occur at an edge where the derivative is not zero. Comparing stationary candidates and both endpoints prevents that value from being missed.",
      },
    ],
    tryThis:
      "Choose the Box volume preset, leave Show f′(x) on, and locate where the orange derivative crosses zero near x = 1.67. Change Left edge and Right edge to inspect the feasible interval, then switch to Cubic explore and compare its marked maximum and minimum.",
  },
  {
    id: "taylor-series",
    plainEnglish:
      "A complicated curve can be copied near one chosen point by building a simpler curve that matches more and more of its shape. The copy is strongest near the chosen point and may worsen farther away.",
    objectives: [
      "construct a Taylor polynomial from derivatives at a centre",
      "compute Taylor coefficients including the factorial denominators",
      "approximate a function value with a finite Taylor polynomial",
      "compare the approximation near and far from its centre",
      "explain how changing the degree changes the local fit",
    ],
    whyItMatters:
      "Calculators, physics simulations and control systems approximate functions such as sine and exponential growth with polynomials that computers can evaluate quickly.",
    keyIdea:
      "The Taylor polynomial is forced to share the function's value, slope, bend and higher changes at one centre point.",
    workedExample: {
      prompt:
        "Use the degree-five Taylor polynomial for sin(x) about 0 to approximate sin(0.5).",
      steps: [
        "T₅(x) = x − x³ ÷ 3! + x⁵ ÷ 5!, because the even derivatives of sin(x) are zero at 0 and the odd signs alternate.",
        "T₅(0.5) = 0.5 − 0.5³ ÷ 6 + 0.5⁵ ÷ 120, after substituting x = 0.5.",
        "T₅(0.5) = 0.5 − 0.125 ÷ 6 + 0.03125 ÷ 120.",
        "T₅(0.5) = 0.479427083… ≈ 0.479427, while sin(0.5) ≈ 0.479426.",
      ],
      answer:
        "The degree-five approximation is sin(0.5) ≈ 0.479427, only about 0.0000015 above the true value.",
    },
    pitfalls: [
      "Forgetting k! in a coefficient → divide the k-th derivative by k factorial",
      "Using powers of x when the centre is not zero → use powers of (x − a)",
      "Assuming the fit is equally good everywhere → Taylor matching is local to the chosen centre",
      "Assuming a higher degree always behaves better far away → check the function's domain and convergence",
    ],
    checks: [
      {
        question: "What is the degree-one Taylor polynomial for sin(x) about 0?",
        answer:
          "It is T₁(x) = x, because sin(0) = 0 and the first derivative cos(0) = 1.",
      },
      {
        question: "What is the degree-two Taylor polynomial for exp(x) about 0?",
        answer:
          "Every derivative of exp(x) equals exp(x), so each derivative at 0 is 1. Therefore T₂(x) = 1 + x + x² ÷ 2.",
      },
      {
        question:
          "Use T₂(x) = 1 + x + x² ÷ 2 to approximate exp(0.2).",
        answer:
          "T₂(0.2) = 1 + 0.2 + 0.2² ÷ 2 = 1.2 + 0.02 = 1.22. The true value is about 1.2214, so the short polynomial is already close.",
      },
      {
        question:
          "Why does moving Centre a change where the orange curve best matches the blue curve?",
        answer:
          "All coefficients are built from the function and its derivatives at a. The polynomial therefore matches the value and successive rates of change exactly at that new centre.",
      },
    ],
    tryThis:
      "Choose the sin(x) Preset, set Centre a to 0 and move Degree n through 1, 3 and 5. Narrow Left edge and Right edge around zero to inspect the fit, then move Centre a to 2 and watch the exact matching point move with it.",
  },
  {
    id: "fourier-series",
    plainEnglish:
      "A repeating shape can be rebuilt by adding simple waves of different speeds and strengths. Each added wave supplies finer detail.",
    objectives: [
      "identify the harmonics used to reconstruct a repeating signal",
      "compute sine-series coefficients for the displayed standard waveforms",
      "evaluate a finite Fourier sum at a chosen point",
      "compare coefficient decay for square, sawtooth and triangle waves",
      "explain the Gibbs overshoot near a jump",
    ],
    whyItMatters:
      "Fourier methods power audio compression, radio and Wi-Fi, medical imaging, vibration diagnosis and the filtering tools used in images and sound.",
    keyIdea:
      "A repeating signal is a recipe whose ingredients are pure waves, and each Fourier coefficient says how much of one ingredient to add.",
    workedExample: {
      prompt:
        "Use the first three non-zero terms of the square-wave series to estimate the value at x = π ÷ 2.",
      steps: [
        "S(x) = 4 ÷ π × (sin x + sin 3x ÷ 3 + sin 5x ÷ 5), using harmonics 1, 3 and 5.",
        "At x = π ÷ 2, sin x = 1, sin 3x = −1 and sin 5x = 1.",
        "S(π ÷ 2) = 4 ÷ π × (1 − 1 ÷ 3 + 1 ÷ 5) = 4 ÷ π × 13 ÷ 15.",
        "S(π ÷ 2) = 52 ÷ (15π) ≈ 1.1035.",
      ],
      answer:
        "The three-term estimate is about 1.1035; the target level is 1, so this partial sum overshoots slightly.",
    },
    pitfalls: [
      "Including even sine harmonics in the centred square wave → symmetry makes their coefficients zero",
      "Treating Harmonics as a frequency slider → it sets how many numbered terms are included in the sum",
      "Expecting a finite sum to make a perfectly sharp corner → smooth waves leave error near jumps",
      "Expecting Gibbs overshoot to vanish in height → more harmonics narrow the ripple but its peak remains about nine per cent of the jump",
    ],
    checks: [
      {
        question:
          "Which harmonics are active when a centred square wave includes terms 1 through 5?",
        answer:
          "Harmonics 1, 3 and 5 are active. The even coefficients are zero because the square wave's symmetry cancels those sine components.",
      },
      {
        question: "What is the coefficient of sin(3x) in the square-wave series?",
        answer:
          "It is 4 ÷ (3π), because the odd square-wave coefficient is 4 ÷ (nπ) and n = 3.",
      },
      {
        question:
          "Why does the triangle wave usually look smooth with fewer harmonics than the square wave?",
        answer:
          "Its coefficients shrink like 1 ÷ n² rather than 1 ÷ n, so high-frequency ingredients become small much faster and fewer are needed for a close reconstruction.",
      },
      {
        question: "What value does a Fourier series approach exactly at a jump?",
        answer:
          "It approaches the midpoint of the values immediately to the left and right. The smooth partial sums cannot choose either side of an instantaneous jump.",
      },
    ],
    tryThis:
      "Set Target shape to Square wave, turn off Show sine components, turn on Show approximation gap and move Harmonics from 1 to 15. Compare the narrowing red error near each jump, then choose Triangle wave and use the numbered Learn it deeply chapters to compare its faster coefficient decay.",
  },
  {
    id: "vector-field",
    plainEnglish:
      "Imagine a map covered with tiny arrows, each telling you which way you would be pushed from that spot. Moving to a new spot can change both the direction and strength of the push.",
    objectives: [
      "evaluate a vector field at a specified point",
      "sketch the local direction and magnitude from field components",
      "distinguish rotation, source, sink and saddle fields",
      "compute divergence and curl for a linear two-dimensional field",
      "trace how particles move through two-dimensional and three-dimensional fields",
    ],
    whyItMatters:
      "Vector fields model wind, ocean currents, heat flow, gravity and electric or magnetic forces, and they underpin fluid simulation and weather prediction.",
    keyIdea:
      "A vector field is a machine that takes your position and returns the arrow attached to that position.",
    workedExample: {
      prompt:
        "For the rotation field F(x, y) = (−y, x), find the arrow, its magnitude, divergence and curl at (2, 1).",
      steps: [
        "F(2, 1) = (−1, 2), because P = −y = −1 and Q = x = 2 at that point.",
        "|F(2, 1)| = √((−1)² + 2²) = √5 ≈ 2.24, so the arrow points left and up with that strength.",
        "div F = Pₓ + Qᵧ = 0 + 0 = 0, because neither component changes in its matching direction.",
        "curl F = Qₓ − Pᵧ = 1 − (−1) = 2, so the field has positive anticlockwise rotation.",
      ],
      answer:
        "At (2, 1) the field gives (−1, 2), with magnitude √5, zero divergence and curl 2.",
    },
    pitfalls: [
      "Reading the point as the arrow → substitute the point into the field recipe to obtain the arrow",
      "Swapping P and Q → P is the rightward component and Q is the upward component",
      "Treating longer display arrows as different positions → arrow length shows field strength, while the arrow's base shows position",
      "Calling every circular-looking path a source → divergence measures outward flow, while curl measures spin",
    ],
    checks: [
      {
        question: "For F(x, y) = (x, y), what arrow appears at (−2, 3)?",
        answer:
          "Substituting the coordinates gives F(−2, 3) = (−2, 3). It points left and up, directly away from the origin.",
      },
      {
        question: "Why is F(x, y) = (x, y) called a source?",
        answer:
          "At every non-zero point the arrow points away from the origin, so nearby particles spread outwards. Its divergence is 1 + 1 = 2, which is positive.",
      },
      {
        question: "What does F(x, y) = (−x, −y) do to flow particles?",
        answer:
          "Each arrow points back towards the origin, so particles collapse inward. The field is a sink and has negative divergence.",
      },
      {
        question:
          "How does the saddle field F(x, y) = (x, −y) behave along the two axes?",
        answer:
          "On the horizontal axis it points away from the origin because the first component is x. On the vertical axis it points towards the origin because the second component is −y, producing outward flow one way and inward flow the other.",
      },
    ],
    tryThis:
      "Open Examples — try these and click Rotation, then move your x position and your y position in Pick a point — watch the maths. Leave Flow particles on, compare Source, Sink and Saddle, then choose Swirl + lift and orbit the camera to see the constant depth push carry particles out of the flat plane.",
  },
];
