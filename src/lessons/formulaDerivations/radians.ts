import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const radianSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Circle sector with radius R, central angle theta, and arc length s">
    <path d="M145 105 L245 105 A100 100 0 0 0 195 18 Z" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <line x1="145" y1="105" x2="245" y2="105" stroke="#79c0ff" stroke-width="3"/>
    <line x1="145" y1="105" x2="195" y2="18" stroke="#79c0ff" stroke-width="3"/>
    <path d="M178 105 A33 33 0 0 0 162 76" fill="none" stroke="#ffd166" stroke-width="2"/>
    <text x="180" y="91" fill="#ffd166" font-size="17">θ</text><text x="194" y="121" fill="#79c0ff" font-size="16">R</text>
    <text x="218" y="58" fill="#7ee787" font-size="16">arc s</text>
  </svg>`;

registerFormulaDerivations("radians", [
  {
    id: "radian-conversion",
    title: "Why 360° equals 2π radians",
    equation: "θrad = θ°·π/180",
    startingPoint: "One full turn is 360°, while its arc is the full circumference 2πR.",
    steps: [
      { expression: "full-turn radians = arc/radius = 2πR/R = 2π", reason: "Radians measure angle as arc length divided by radius." },
      { expression: "360° = 2π rad", reason: "Both expressions describe the same full turn." },
      { expression: "1° = 2π/360 rad = π/180 rad", reason: "Divide both units of the full turn by 360." },
      { expression: "θrad = θ°·π/180", reason: "Scale the one-degree conversion by θ." },
    ],
    result: "Reverse the conversion to get θ° = θrad·180/π.",
    assumptions: "Angles are measured about the same orientation; radians are dimensionless arc/radius ratios.",
    diagram: { description: "A full circumference contains 2π radius-lengths of arc.", svg: radianSvg },
  },
  {
    id: "arc-length",
    title: "Why arc length is s = Rθ",
    equation: "s = Rθ",
    startingPoint: "The radian measure of a central angle is defined as θ = s/R.",
    steps: [
      { expression: "θ = s/R", reason: "Count how many radius-lengths fit along the intercepted arc." },
      { expression: "Rθ = s", reason: "Multiply both sides by the positive radius R." },
      { expression: "s = Rθ", reason: "Write the isolated arc length in conventional order." },
    ],
    result: "Radians make arc length a direct radius-times-angle calculation.",
    assumptions: "θ is in radians and R ≥ 0.",
    diagram: { description: "The angle θ counts arc length s in units of radius R.", svg: radianSvg },
  },
  {
    id: "tangential-speed",
    title: "Why tangential speed is v = Rω",
    equation: "v = Rω",
    startingPoint: "For motion around a fixed circle, arc displacement is s = Rθ.",
    steps: [
      { expression: "Δs = RΔθ", reason: "The radius is constant, so changes in arc length scale with changes in angle." },
      { expression: "Δs/Δt = R(Δθ/Δt)", reason: "Divide by the elapsed time." },
      { expression: "v = Rω", reason: "Take the instantaneous limit and use v = ds/dt and ω = dθ/dt." },
    ],
    result: "At the same angular speed, points farther from the axis move faster along their circles.",
    assumptions: "θ is in radians and R is constant.",
    diagram: { description: "A changing central angle sweeps a proportional arc displacement.", svg: radianSvg },
  },
  {
    id: "sine-derivative",
    title: "Why the derivative of sine is cosine in radians",
    equation: "d(sin x)/dx = cos x",
    startingPoint: "Use the angle-addition identity and the radian limits lim(h→0) sin h/h = 1 and lim(h→0)(cos h−1)/h = 0.",
    steps: [
      { expression: "[sin(x+h)−sin x]/h", reason: "Start from the definition of the derivative." },
      { expression: "sin x[(cos h−1)/h] + cos x[sin h/h]", reason: "Expand sin(x+h) = sin x cos h + cos x sin h and collect terms." },
      { expression: "sin x·0 + cos x·1", reason: "Apply the two small-angle limits, which take these simple values only when h is in radians." },
      { expression: "d(sin x)/dx = cos x", reason: "Simplify the limiting expression." },
    ],
    result: "Radians remove the extra π/180 scale factor that appears when differentiating degree-based sine.",
    assumptions: "x and h are in radians; the standard small-angle limits have been established.",
    diagram: { description: "Radian measure links tiny angle changes directly to tiny arc lengths.", svg: radianSvg },
  },
]);
