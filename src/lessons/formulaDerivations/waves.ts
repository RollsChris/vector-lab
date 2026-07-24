import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const sinusoidSvg = `
  <svg viewBox="0 0 360 180" role="img" aria-label="Sine wave with amplitude, wavelength and phase shift marked">
    <line x1="24" y1="92" x2="338" y2="92" stroke="#8b949e" stroke-width="2"/>
    <path d="M24 92 C50 32 76 32 102 92 S154 152 180 92 S232 32 258 92 S310 152 338 92"
      fill="none" stroke="#58a6ff" stroke-width="4"/>
    <line x1="76" y1="92" x2="76" y2="32" stroke="#ffd166" stroke-width="2"/>
    <line x1="76" y1="32" x2="102" y2="32" stroke="#d2a8ff" stroke-width="2" stroke-dasharray="5 4"/>
    <line x1="76" y1="160" x2="232" y2="160" stroke="#7ee787" stroke-width="2"/>
    <text x="82" y="62" fill="#ffd166" font-size="16">A</text>
    <text x="145" y="176" fill="#7ee787" font-size="16">one wavelength λ</text>
    <text x="105" y="27" fill="#d2a8ff" font-size="15">phase shift</text>
  </svg>`;

const superpositionSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Two component waves added point by point to make a resultant wave">
    <path d="M20 45 C55 10 90 10 125 45 S195 80 230 45 S300 10 340 45"
      fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M20 92 C38 70 56 70 74 92 S110 114 128 92 S164 70 182 92 S218 114 236 92 S272 70 290 92 S326 114 340 92"
      fill="none" stroke="#ffa657" stroke-width="3"/>
    <text x="8" y="28" fill="#58a6ff" font-size="15">y₁</text>
    <text x="8" y="82" fill="#ffa657" font-size="15">y₂</text>
    <text x="165" y="126" fill="#8b949e" font-size="22">↓ add heights</text>
    <path d="M20 157 C38 106 62 104 86 145 S135 193 164 159 S208 112 238 144 S302 189 340 151"
      fill="none" stroke="#7ee787" stroke-width="4"/>
    <text x="8" y="180" fill="#7ee787" font-size="15">y₁ + y₂</text>
  </svg>`;

const travellingWaveSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Travelling wave shown at two times shifted to the right">
    <line x1="20" y1="92" x2="340" y2="92" stroke="#8b949e" stroke-width="2"/>
    <path d="M20 92 C45 35 70 35 95 92 S145 149 170 92 S220 35 245 92 S295 149 320 92"
      fill="none" stroke="#58a6ff" stroke-width="4"/>
    <path d="M55 92 C80 35 105 35 130 92 S180 149 205 92 S255 35 280 92 S330 149 350 105"
      fill="none" stroke="#ffa657" stroke-width="3" stroke-dasharray="7 5"/>
    <line x1="72" y1="28" x2="109" y2="28" stroke="#7ee787" stroke-width="3"/>
    <path d="M109 28 l-10 -6 v12 z" fill="#7ee787"/>
    <text x="126" y="34" fill="#7ee787" font-size="16">distance cΔt</text>
    <text x="20" y="170" fill="#58a6ff" font-size="15">time t</text>
    <text x="265" y="170" fill="#ffa657" font-size="15">time t + Δt</text>
  </svg>`;

const reflectionSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Incident and reflected waves meeting at a boundary to form nodes">
    <line x1="326" y1="20" x2="326" y2="168" stroke="#f0f6fc" stroke-width="5"/>
    <path d="M20 85 C55 25 90 25 125 85 S195 145 230 85 S290 25 326 85"
      fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M20 85 C55 145 90 145 125 85 S195 25 230 85 S290 145 326 85"
      fill="none" stroke="#ffa657" stroke-width="3"/>
    <circle cx="125" cy="85" r="5" fill="#7ee787"/><circle cx="230" cy="85" r="5" fill="#7ee787"/>
    <text x="28" y="30" fill="#58a6ff" font-size="15">incident</text>
    <text x="28" y="157" fill="#ffa657" font-size="15">reflected</text>
    <text x="111" y="105" fill="#7ee787" font-size="15">node</text>
    <text x="300" y="184" fill="#f0f6fc" font-size="15">fixed end</text>
  </svg>`;

const projectionSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="A signal projected onto one sine basis wave by multiplying and integrating">
    <path d="M18 42 C45 12 72 12 99 42 S153 72 180 42 S234 12 261 42 S315 72 342 42"
      fill="none" stroke="#58a6ff" stroke-width="3"/>
    <text x="15" y="23" fill="#58a6ff" font-size="14">signal f(x)</text>
    <text x="165" y="88" fill="#8b949e" font-size="22">×</text>
    <path d="M18 112 C32 86 46 86 60 112 S88 138 102 112 S130 86 144 112 S172 138 186 112 S214 86 228 112 S256 138 270 112 S298 86 312 112 S336 135 342 122"
      fill="none" stroke="#d2a8ff" stroke-width="3"/>
    <text x="15" y="151" fill="#d2a8ff" font-size="14">candidate sin(nx) or cos(nx)</text>
    <path d="M265 83 h48" stroke="#7ee787" stroke-width="3"/>
    <path d="M313 83 l-10 -6 v12 z" fill="#7ee787"/>
    <text x="256" y="72" fill="#7ee787" font-size="14">integrate</text>
    <text x="286" y="105" fill="#ffd166" font-size="15">weight</text>
  </svg>`;

registerFormulaDerivations("waveforms", [
  {
    id: "wave-sinusoid",
    title: "How amplitude, frequency and phase build a sinusoid",
    equation: "y(x) = A sin(fx + φ)",
    startingPoint: "Begin with sin θ, a unit wave whose output ranges from −1 to 1 as its angle θ advances.",
    steps: [
      { expression: "θ = fx + φ", reason: "Use fx to control how quickly the angle changes with x, then add φ to choose the starting phase." },
      { expression: "sin(fx + φ)", reason: "Taking sine turns the advancing angle into a repeating wave between −1 and 1." },
      { expression: "y = A sin(fx + φ)", reason: "Multiplying by A scales every height, so peaks become +A and troughs become −A." },
    ],
    result: "A controls vertical size, f controls horizontal repetition, and φ translates the pattern through its cycle.",
    assumptions: "Here f is angular spatial frequency in radians per x-unit. If f means cycles per unit, use sin(2πfx + φ).",
    diagram: { description: "Amplitude scales height, wavelength measures one repeat, and phase shifts the repeat sideways.", svg: sinusoidSvg },
  },
  {
    id: "wave-superposition",
    title: "Why waves add by superposition",
    equation: "y(x,t) = Σ yₖ(x,t)",
    startingPoint: "For a linear wave system, each disturbance produces a displacement independently of the others.",
    steps: [
      { expression: "y₁(x,t), y₂(x,t), …", reason: "Evaluate every component at the same position and time." },
      { expression: "y = y₁ + y₂ + ⋯", reason: "Linearity means the combined displacement is the algebraic sum of the separate responses." },
      { expression: "y = Σₖ Aₖ sin(fₖx + φₖ + t)", reason: "Substitute the sinusoidal form used by the lesson's enabled components." },
    ],
    result: "Positive heights reinforce, opposite heights cancel, and the resulting curve can be much richer than any component.",
    assumptions: "Superposition applies while the underlying system is linear; large-amplitude or nonlinear media can create interactions not captured by a simple sum.",
    diagram: { description: "The component heights are added point by point to produce the green resultant.", svg: superpositionSvg },
  },
  {
    id: "wave-sine-derivative",
    title: "Why differentiating sine produces cosine",
    equation: "d(sin x)/dx = cos x",
    startingPoint: "Use the derivative limit together with the angle-addition formula for sin(x+h).",
    steps: [
      { expression: "[sin(x+h)−sin x]/h", reason: "Write the difference quotient." },
      { expression: "sin x[(cos h−1)/h] + cos x[sin h/h]", reason: "Expand sin(x+h) and group the two small-angle factors." },
      { expression: "sin x·0 + cos x·1 = cos x", reason: "As h approaches zero in radians, (cos h−1)/h approaches 0 and sin h/h approaches 1." },
    ],
    result: "The slope wave is cosine, one quarter-cycle ahead of sine.",
    assumptions: "Angles must be measured in radians; degree measure introduces a π/180 scale factor.",
    diagram: { description: "Sine is steepest at zero crossings and flat at its peaks, matching cosine's values.", svg: sinusoidSvg },
  },
]);

registerFormulaDerivations("physical-waves", [
  {
    id: "travelling-wave",
    title: "Why y = A sin(kx − ωt) travels",
    equation: "y(x,t) = A sin(kx − ωt)",
    startingPoint: "A sine wave keeps the same shape wherever its phase kx − ωt has the same value.",
    steps: [
      { expression: "kx − ωt = constant", reason: "Track one crest or any other fixed phase point." },
      { expression: "x = (ω/k)t + constant/k", reason: "Solve the fixed-phase equation for the crest position." },
      { expression: "dx/dt = ω/k = c", reason: "Differentiate the crest position: it moves at constant speed c." },
    ],
    result: "The minus sign makes the pattern move toward increasing x; replacing it with plus makes it travel toward decreasing x.",
    assumptions: "This is an ideal sinusoidal travelling wave with constant amplitude, wave number and angular frequency.",
    diagram: { description: "The dashed copy has the same shape later in time, shifted right by cΔt.", svg: travellingWaveSvg },
  },
  {
    id: "wave-relations",
    title: "How wavelength, period and speed are related",
    equation: "k = 2π/λ, ω = 2π/T, and c = ω/k = λ/T",
    startingPoint: "One complete cycle advances the phase by 2π radians.",
    steps: [
      { expression: "kλ = 2π", reason: "Moving one wavelength λ must advance the spatial phase kx by one full cycle." },
      { expression: "ωT = 2π", reason: "Waiting one period T must advance the temporal phase ωt by one full cycle." },
      { expression: "ω/k = (2π/T)/(2π/λ) = λ/T", reason: "Divide the angular frequency by the wave number and cancel 2π." },
    ],
    result: "A wave travels one wavelength during one period, so its speed is distance per cycle divided by time per cycle.",
    assumptions: "The medium is nondispersive in this lesson, so every frequency uses the same phase speed c.",
    diagram: { description: "The wave shape advances one wavelength λ during one period T.", svg: travellingWaveSvg },
  },
  {
    id: "wave-reflection",
    title: "How reflection creates a standing wave",
    equation: "y = A sin(kx − ωt) ± A sin(kx + ωt)",
    startingPoint: "A reflected wave travels in the opposite direction, so its temporal sign reverses relative to the incident wave.",
    steps: [
      { expression: "yᵢ = A sin(kx − ωt)", reason: "Write the incident wave travelling toward increasing x." },
      { expression: "yᵣ = ±A sin(kx + ωt)", reason: "Use +ωt for opposite travel; choose minus for an inverted fixed-end reflection and plus for a free end." },
      { expression: "R=−1: y = −2A cos(kx)sin(ωt); R=+1: y = 2A sin(kx)cos(ωt)", reason: "Apply the sine sum or difference identity to separate a stationary spatial pattern from the time oscillation." },
    ],
    result: "The separated spatial factor has permanent zeros: nodes stay fixed while the regions between them oscillate.",
    assumptions: "The incident and reflected waves have equal frequency and amplitude. The phase origin must be placed consistently with the actual boundary; losses or imperfect boundaries reduce the reflected amplitude.",
    diagram: { description: "Oppositely travelling waves meet at the fixed boundary; their sum has stationary nodes.", svg: reflectionSvg },
  },
]);

registerFormulaDerivations("fourier-series", [
  {
    id: "fourier-coefficients",
    title: "Why Fourier coefficients are projection integrals",
    equation: "aₙ = (1/π)∫₋π^π f(x)cos(nx)dx; bₙ = (1/π)∫₋π^π f(x)sin(nx)dx",
    startingPoint: "Assume f is a weighted sum of sine and cosine harmonics over one full 2π period.",
    steps: [
      { expression: "f(x)cos(mx)", reason: "Multiply the whole series by the one cosine basis wave whose coefficient aₘ is wanted." },
      { expression: "∫₋π^π sin(nx)cos(mx)dx = 0", reason: "Sine and cosine are orthogonal, so all mixed terms cancel over a full period." },
      { expression: "∫₋π^π cos(nx)cos(mx)dx = π when n=m, otherwise 0", reason: "Different cosine frequencies cancel; only the matching harmonic retains nonzero area." },
      { expression: "aₘ = (1/π)∫₋π^π f(x)cos(mx)dx", reason: "Divide the surviving equation by the basis wave's squared norm π. The sine derivation is identical." },
    ],
    result: "Each integral isolates one harmonic's signed weight without contamination from the other harmonics.",
    assumptions: "Integrate over a complete period and use the matching normalization. Piecewise-smooth periodic signals satisfy the usual Fourier convergence conditions.",
    diagram: { description: "Multiplication by one candidate wave followed by integration measures the signal's projection onto that basis.", svg: projectionSvg },
  },
  {
    id: "fourier-real-series",
    title: "How the real Fourier series reconstructs a signal",
    equation: "f(x) = a₀/2 + Σₙ₌₁∞[aₙcos(nx) + bₙsin(nx)]",
    startingPoint: "The constant function, cosines and sines form an orthogonal basis for periodic functions on a full period.",
    steps: [
      { expression: "a₀/2", reason: "The zero-frequency basis captures the signal's mean or DC level." },
      { expression: "aₙcos(nx) + bₙsin(nx)", reason: "At frequency n, cosine and sine provide two independent phase directions." },
      { expression: "Σₙ₌₁∞", reason: "Add every harmonic projection to recover all frequency detail present in the signal." },
    ],
    result: "Truncating the sum gives the lesson's partial reconstruction; adding harmonics generally captures progressively finer structure.",
    assumptions: "At a jump the series converges to the midpoint of the one-sided limits, and finite partial sums exhibit Gibbs ringing.",
    diagram: { description: "Individual harmonic waves add point by point to approach the target signal.", svg: superpositionSvg },
  },
  {
    id: "fourier-complex-series",
    title: "How Euler's formula combines sine and cosine coefficients",
    equation: "f(x) = Σₙ₌₋∞∞ cₙeⁱⁿˣ",
    startingPoint: "Euler's identities express cosine and sine using counter-rotating complex exponentials.",
    steps: [
      { expression: "cos(nx) = (eⁱⁿˣ + e⁻ⁱⁿˣ)/2", reason: "Add Euler's formulas for positive and negative angles." },
      { expression: "sin(nx) = (eⁱⁿˣ − e⁻ⁱⁿˣ)/(2i)", reason: "Subtract the same two Euler formulas." },
      { expression: "aₙcos(nx) + bₙsin(nx) = cₙeⁱⁿˣ + c₋ₙe⁻ⁱⁿˣ", reason: "Collect the positive- and negative-frequency exponential terms." },
      { expression: "cₙ = (1/2π)∫₋π^π f(x)e⁻ⁱⁿˣdx", reason: "Project onto the complex basis exactly as for the real coefficients." },
    ],
    result: "One complex coefficient stores both amplitude and phase, which is the compact form used by DFT and FFT implementations.",
    assumptions: "For real-valued f, coefficients obey conjugate symmetry c₋ₙ = c̄ₙ. Complex arithmetic changes representation, not the reconstructed real signal.",
    diagram: { description: "The projection pipeline is unchanged; the candidate basis is now a rotating complex exponential.", svg: projectionSvg },
  },
  {
    id: "fourier-square-wave",
    title: "Deriving the square-wave sine series",
    equation: "square(x) = (4/π)Σₘ₌₀∞ sin((2m+1)x)/(2m+1)",
    startingPoint: "Use a 2π-periodic square wave equal to +1 on (0,π) and −1 on (−π,0).",
    steps: [
      { expression: "aₙ = 0", reason: "The square wave is odd while cosine is even, so their product is odd and integrates to zero." },
      { expression: "bₙ = (2/π)∫₀^π sin(nx)dx", reason: "Odd symmetry doubles the positive-half integral." },
      { expression: "bₙ = 2[1−(−1)ⁿ]/(πn)", reason: "Integrate sine and evaluate the endpoints." },
      { expression: "bₙ = 4/(πn) for odd n, 0 for even n", reason: "The endpoint factor vanishes for even n and equals two for odd n." },
    ],
    result: "Only odd harmonics remain, with amplitudes falling as 1/n.",
    assumptions: "At each jump the series converges to the midpoint 0 and finite sums show Gibbs overshoot.",
    diagram: { description: "Projection onto each sine basis selects the nonzero odd-harmonic weights.", svg: projectionSvg },
  },
  {
    id: "fourier-sawtooth-wave",
    title: "Deriving the sawtooth sine series",
    equation: "x/π = (2/π)Σₙ₌₁∞ (−1)ⁿ⁺¹ sin(nx)/n on (−π,π)",
    startingPoint: "The lesson's sawtooth target is f(x)=x/π over one period, extended periodically.",
    steps: [
      { expression: "aₙ = 0", reason: "f is odd, so every cosine projection vanishes." },
      { expression: "bₙ = (2/π²)∫₀^π x sin(nx)dx", reason: "Use odd symmetry in the sine-coefficient integral." },
      { expression: "∫ x sin(nx)dx = −x cos(nx)/n + sin(nx)/n²", reason: "Integrate by parts." },
      { expression: "bₙ = 2(−1)ⁿ⁺¹/(πn)", reason: "Evaluate at 0 and π, where sin(nπ)=0 and cos(nπ)=(−1)ⁿ." },
    ],
    result: "Every harmonic appears, alternating sign and decaying as 1/n.",
    assumptions: "The periodic extension jumps at ±π, where the series converges to the midpoint.",
    diagram: { description: "Each sine projection measures one alternating harmonic in the sloping periodic target.", svg: projectionSvg },
  },
  {
    id: "fourier-triangle-wave",
    title: "Why triangle-wave coefficients decay as 1/n²",
    equation: "triangle(x) = (8/π²)Σₘ₌₀∞ (−1)ᵐ sin((2m+1)x)/(2m+1)²",
    startingPoint: "The centred triangle wave is odd and piecewise linear, so only sine coefficients are needed.",
    steps: [
      { expression: "aₙ = 0 and even bₙ = 0", reason: "Odd symmetry removes cosines, while half-wave symmetry removes even sine harmonics." },
      { expression: "bₙ = (2/π)∫₀^π f(x)sin(nx)dx", reason: "Project the two linear half-segments onto sine." },
      { expression: "integrate each linear segment by parts", reason: "The boundary terms cancel and a remaining 1/n factor combines with the integration-by-parts 1/n." },
      { expression: "b₂ₘ₊₁ = (8/π²)(−1)ᵐ/(2m+1)²", reason: "Evaluate the alternating odd-harmonic endpoint signs." },
    ],
    result: "The extra 1/n decay relative to a jump waveform reflects the triangle wave's greater smoothness.",
    assumptions: "This formula matches the lesson's normalized odd triangle wave; shifts and amplitude changes alter phases and scale.",
    diagram: { description: "Projection leaves alternating odd harmonics whose weights shrink quadratically.", svg: projectionSvg },
  },
]);
