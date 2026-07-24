import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const pixelPipelineSvg = `
  <svg viewBox="0 0 380 190" role="img" aria-label="Pixel coordinates flowing through mathematical stages into an output colour">
    <rect x="14" y="62" width="82" height="56" rx="8" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <rect x="145" y="62" width="90" height="56" rx="8" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="3"/>
    <rect x="284" y="62" width="82" height="56" rx="8" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <text x="28" y="86" fill="#58a6ff" font-size="15">pixel input</text><text x="35" y="105" fill="#58a6ff" font-size="15">vUv, time</text>
    <text x="163" y="86" fill="#d2a8ff" font-size="15">formula</text><text x="158" y="105" fill="#d2a8ff" font-size="15">scalar / vector</text>
    <text x="299" y="86" fill="#7ee787" font-size="15">colour</text><text x="300" y="105" fill="#7ee787" font-size="15">vec4</text>
    <line x1="96" y1="90" x2="145" y2="90" stroke="#ffd166" stroke-width="3"/><path d="M145 90 l-10 -6 v12 z" fill="#ffd166"/>
    <line x1="235" y1="90" x2="284" y2="90" stroke="#ffd166" stroke-width="3"/><path d="M284 90 l-10 -6 v12 z" fill="#ffd166"/>
    <text x="55" y="150" fill="#f0f6fc" font-size="15">The same pipeline runs independently for every pixel.</text>
  </svg>`;

const tilingSvg = `
  <svg viewBox="0 0 380 190" role="img" aria-label="Continuous coordinates folded into repeated zero-to-one cells">
    <rect x="22" y="30" width="140" height="130" fill="#58a6ff11" stroke="#58a6ff" stroke-width="3"/>
    <line x1="68" y1="30" x2="68" y2="160" stroke="#8b949e"/><line x1="115" y1="30" x2="115" y2="160" stroke="#8b949e"/>
    <line x1="22" y1="73" x2="162" y2="73" stroke="#8b949e"/><line x1="22" y1="117" x2="162" y2="117" stroke="#8b949e"/>
    <circle cx="45" cy="52" r="8" fill="#7ee787"/><circle cx="92" cy="52" r="8" fill="#7ee787"/><circle cx="139" cy="52" r="8" fill="#7ee787"/>
    <circle cx="45" cy="95" r="8" fill="#7ee787"/><circle cx="92" cy="95" r="8" fill="#7ee787"/><circle cx="139" cy="95" r="8" fill="#7ee787"/>
    <circle cx="45" cy="139" r="8" fill="#7ee787"/><circle cx="92" cy="139" r="8" fill="#7ee787"/><circle cx="139" cy="139" r="8" fill="#7ee787"/>
    <path d="M180 95 h55" stroke="#ffd166" stroke-width="3"/><path d="M235 95 l-10 -6 v12 z" fill="#ffd166"/>
    <rect x="252" y="52" width="105" height="86" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="3"/>
    <circle cx="304" cy="95" r="18" fill="#7ee787"/>
    <text x="174" y="80" fill="#ffd166" font-size="14">fract</text>
    <text x="259" y="158" fill="#d2a8ff" font-size="14">one local cell</text>
  </svg>`;

const raymarchSvg = `
  <svg viewBox="0 0 380 200" role="img" aria-label="A camera ray advancing in safe signed-distance steps toward a sphere">
    <circle cx="42" cy="104" r="9" fill="#ffd166"/>
    <path d="M52 104 L350 70" stroke="#8b949e" stroke-width="2" stroke-dasharray="6 5"/>
    <circle cx="303" cy="75" r="52" fill="#58a6ff16" stroke="#58a6ff" stroke-width="3"/>
    <circle cx="96" cy="98" r="5" fill="#7ee787"/><circle cx="176" cy="89" r="5" fill="#7ee787"/>
    <circle cx="244" cy="82" r="5" fill="#7ee787"/><circle cx="267" cy="79" r="5" fill="#7ee787"/>
    <line x1="96" y1="98" x2="176" y2="89" stroke="#7ee787" stroke-width="4"/>
    <line x1="176" y1="89" x2="244" y2="82" stroke="#7ee787" stroke-width="4"/>
    <line x1="244" y1="82" x2="267" y2="79" stroke="#7ee787" stroke-width="4"/>
    <text x="18" y="132" fill="#ffd166" font-size="14">ray origin</text>
    <text x="121" y="77" fill="#7ee787" font-size="14">safe SDF steps</text>
    <text x="287" y="137" fill="#58a6ff" font-size="14">surface</text>
  </svg>`;

registerFormulaDerivations("shaders", [
  {
    id: "shader-mix",
    title: "How GLSL mix performs linear interpolation",
    equation: "mix(a,b,t) = a(1−t) + bt",
    startingPoint: "A blend should equal a at t=0 and b at t=1, changing at a constant rate between them.",
    steps: [
      { expression: "a(1−t)", reason: "Give a full weight at t=0 and reduce that weight linearly to zero." },
      { expression: "bt", reason: "Give b zero weight at t=0 and increase it linearly to full weight." },
      { expression: "a(1−t)+bt", reason: "The weights sum to one, so the result stays on the straight line between a and b." },
    ],
    result: "Using a pixel coordinate as t creates a gradient; using a time-varying t animates the blend.",
    assumptions: "Interpolation is between a and b only when 0≤t≤1. GLSL mix extrapolates for t outside that range.",
    diagram: { description: "Pixel inputs feed the interpolation formula, whose scalar or vector result becomes colour.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-distance-disc",
    title: "Why length(p) < r describes a disc",
    equation: "d = length(p) = √(pₓ²+pᵧ²); inside = d < r",
    startingPoint: "After centring the UV coordinates, p is the displacement from the image centre to the current pixel.",
    steps: [
      { expression: "p = vUv − 0.5", reason: "Translate the centre from UV coordinate (0.5,0.5) to local coordinate (0,0)." },
      { expression: "d = √(pₓ²+pᵧ²)", reason: "Use Pythagoras to measure radial distance from the centre." },
      { expression: "step(d,r)", reason: "Return one for pixels whose distance is no greater than the radius and zero outside." },
    ],
    result: "A geometric shape emerges from the set of pixels satisfying a distance inequality.",
    assumptions: "Equal x and y scales are required for a circle; correct for aspect ratio when coordinates are not square.",
    diagram: { description: "Each pixel's coordinate is converted to one scalar distance before colour is chosen.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-smoothstep",
    title: "How smoothstep creates a soft edge",
    equation: "smoothstep(a,b,x) = 3t²−2t³, where t = clamp((x−a)/(b−a),0,1)",
    startingPoint: "We need an edge value that is 0 before a, 1 after b, and has no abrupt slope at either boundary.",
    steps: [
      { expression: "t = clamp((x−a)/(b−a),0,1)", reason: "Normalize the transition interval to 0…1 and clamp values outside." },
      { expression: "s(t) = 3t²−2t³", reason: "Choose the lowest-degree polynomial satisfying s(0)=0, s(1)=1 and zero slope at both ends." },
      { expression: "1 − smoothstep(inner,outer,d)", reason: "Reverse the ramp so a distance field is solid inside and fades outward." },
    ],
    result: "A finite transition band anti-aliases shape boundaries and can also make controllable glows.",
    assumptions: "a and b must differ. Reversing their order is not portable across GLSL specifications; invert the result explicitly.",
    diagram: { description: "Distance and edge limits flow through a smooth polynomial before becoming pixel intensity.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-remap-sine",
    title: "Why 0.5 + 0.5 sin θ oscillates from 0 to 1",
    equation: "pulse = 0.5 + 0.5 sin θ",
    startingPoint: "sin θ naturally ranges from −1 to +1.",
    steps: [
      { expression: "0.5 sin θ", reason: "Scale the range to −0.5…+0.5." },
      { expression: "0.5 + 0.5 sin θ", reason: "Shift the midpoint upward by 0.5." },
      { expression: "θ = speed·u_time + phase", reason: "Let time advance the angle to repeat the pulse continuously." },
    ],
    result: "The remapped wave is safe as a colour, opacity or interpolation parameter.",
    assumptions: "The output is periodic and not monotonic; clamp only if later arithmetic can push it outside 0…1.",
    diagram: { description: "Time is transformed into a bounded scalar and then mapped into colour.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-travelling-wave",
    title: "How position and time make shader stripes travel",
    equation: "wave = 0.5 + 0.5 sin(kx − ωt)",
    startingPoint: "Putting pixel position into sine creates repeated bands because the phase changes across the image.",
    steps: [
      { expression: "kx", reason: "Scale position so k controls the number of phase cycles across the surface." },
      { expression: "kx − ωt", reason: "Subtract a growing time phase; equal-phase bands must move toward increasing x." },
      { expression: "0.5 + 0.5 sin(…)", reason: "Remap the signed sine output into a 0…1 intensity." },
    ],
    result: "Changing k alters stripe spacing, while ω controls animation speed and direction.",
    assumptions: "Coordinates and time are dimensionless shader inputs unless the application assigns physical units.",
    diagram: { description: "The pixel's coordinate and shared time uniform combine into one phase before colour is written.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-fract-tiling",
    title: "Why fract repeats one local pattern",
    equation: "cell = fract(scale·vUv + offset)",
    startingPoint: "fract(x) removes the integer part, leaving the same 0…1 ramp in every unit interval.",
    steps: [
      { expression: "scale·vUv", reason: "Expand the coordinate range so it crosses multiple integer cell boundaries." },
      { expression: "fract(scale·vUv)", reason: "Fold every integer-sized region back into the same local 0…1 coordinate." },
      { expression: "pattern(cell)", reason: "Evaluate one shape formula in local coordinates; every folded cell receives the same result." },
    ],
    result: "A single local shape tiles the screen without a loop over tiles.",
    assumptions: "fract has a discontinuity at cell boundaries; use smooth edge formulas when visible seams are undesirable.",
    diagram: { description: "Many world cells are folded onto the same local cell, so one dot formula repeats.", svg: tilingSvg },
  },
  {
    id: "shader-polar",
    title: "How Cartesian pixels become polar rings and rays",
    equation: "r = √(x²+y²); θ = atan(y,x)",
    startingPoint: "A centred pixel displacement can be described by distance and direction instead of horizontal and vertical components.",
    steps: [
      { expression: "r = length(p)", reason: "Pythagoras gives the distance from the centre." },
      { expression: "θ = atan(p.y,p.x)", reason: "The two-argument arctangent selects the correct angular quadrant." },
      { expression: "sin(nθ) or sin(kr)", reason: "Repeating a function of angle creates rays; repeating a function of radius creates rings." },
    ],
    result: "Multiplying or blending angular and radial patterns creates rotationally structured images.",
    assumptions: "The angle wraps at −π/π and is undefined exactly at the origin; most visual formulas tolerate that single pixel.",
    diagram: { description: "The coordinate-to-formula-to-colour pipeline can use radius and angle instead of x and y.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-palette",
    title: "How phase-shifted cosines make a colour palette",
    equation: "colour(t) = 0.5 + 0.5 cos(2π(t + offsetRGB))",
    startingPoint: "A cosine channel is smooth, periodic and bounded from −1 to 1.",
    steps: [
      { expression: "2πt", reason: "Make t advance through one full colour cycle per unit interval." },
      { expression: "2π(t + offsetRGB)", reason: "Give red, green and blue different phase offsets so their peaks occur at different t values." },
      { expression: "0.5 + 0.5 cos(…)", reason: "Remap every channel independently into the display range 0…1." },
    ],
    result: "One scalar field becomes a smooth looping RGB gradient with no texture lookup.",
    assumptions: "The output is linear RGB math; final appearance also depends on renderer colour-space and tone-mapping settings.",
    diagram: { description: "One scalar enters three phase-shifted channel formulas that combine into a colour.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-value-noise",
    title: "How value noise blends hashed grid corners",
    equation: "noise(p) = bilinearMix(hash(corners), smooth(fract(p)))",
    startingPoint: "A hash assigns repeatable pseudo-random values to integer lattice points, but raw cell values would make hard blocks.",
    steps: [
      { expression: "i = floor(p), f = fract(p)", reason: "Separate the current grid cell from the pixel's local position inside it." },
      { expression: "a,b,c,d = hash(the four corners)", reason: "Generate deterministic corner values shared by neighbouring cells." },
      { expression: "f = f²(3−2f)", reason: "Ease the interpolation coordinate so its slope is zero at cell borders." },
      { expression: "mix(mix(a,b,f.x), mix(c,d,f.x), f.y)", reason: "Interpolate horizontally on both rows, then vertically between those results." },
    ],
    result: "The output varies smoothly through space while remaining deterministic for a given coordinate.",
    assumptions: "This is value noise, not gradient noise, and the sine hash is convenient rather than statistically rigorous.",
    diagram: { description: "The local coordinate blends four repeatable corner values before producing pixel intensity.", svg: tilingSvg },
  },
  {
    id: "shader-fbm",
    title: "Why layered octaves create fractal detail",
    equation: "fbm(p) = Σₖ a₀gᵏ noise(f₀lᵏp)",
    startingPoint: "One smooth-noise layer contains detail around only one characteristic scale.",
    steps: [
      { expression: "noise(f₀p)", reason: "Start with the broad base pattern." },
      { expression: "p ← lp", reason: "Increase frequency by lacunarity l, commonly 2, to add finer detail each octave." },
      { expression: "amplitude ← g·amplitude", reason: "Reduce strength by gain g, commonly 0.5, so fine detail does not dominate." },
      { expression: "sum every octave", reason: "Combine broad structure with progressively finer variations." },
    ],
    result: "The multi-scale sum resembles natural clouds, smoke, terrain and marble more closely than one noise layer.",
    assumptions: "Octave count is finite in a shader. Gain, lacunarity and normalization control contrast and computational cost.",
    diagram: { description: "Repeated noise stages at finer scales accumulate before the final colour mapping.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-domain-warp",
    title: "How domain warping bends a noise field",
    equation: "warped(p) = fbm(p + strength·q(p))",
    startingPoint: "Ordinary noise samples along straight coordinate axes, which can leave recognizable grid-like structure.",
    steps: [
      { expression: "q(p) = (fbm₁(p), fbm₂(p))", reason: "Build a smooth vector displacement from one or more independent noise samples." },
      { expression: "p′ = p + strength·q(p)", reason: "Move the sampling coordinate differently at every point." },
      { expression: "fbm(p′)", reason: "Sample new noise through the bent coordinate domain." },
    ],
    result: "Straight features curl into liquid, marbled structures while staying spatially coherent.",
    assumptions: "Large warp strengths can fold the domain and produce extreme distortion; every added fbm call significantly increases GPU work.",
    diagram: { description: "Pixel coordinates first create a displacement, then the displaced coordinates feed the final noise and colour stages.", svg: pixelPipelineSvg },
  },
  {
    id: "shader-ray",
    title: "How a pixel constructs a camera ray",
    equation: "ray(t) = ro + t·rd",
    startingPoint: "A ray needs a fixed origin ro and a normalized direction rd that differs for each pixel.",
    steps: [
      { expression: "uv = centred, aspect-corrected pixel coordinate", reason: "Map the flat surface position into camera-screen offsets." },
      { expression: "rd = normalize(vec3(uv, focalDepth))", reason: "Point from the camera through that pixel's location on an imaginary image plane." },
      { expression: "p(t) = ro + t·rd", reason: "Advance t units from the ray origin along the unit direction." },
    ],
    result: "Every independently executed pixel shader explores a different line through the same virtual 3D scene.",
    assumptions: "This is a pinhole camera model; field of view depends on focalDepth and the coordinate scale.",
    diagram: { description: "The camera emits a line parameterized by distance t toward the scene.", svg: raymarchSvg },
  },
  {
    id: "shader-sdf-raymarch",
    title: "Why sphere tracing can step by the signed distance",
    equation: "d(p) = length(p−centre)−r; tₙ₊₁ = tₙ + d(pₙ)",
    startingPoint: "A signed distance field returns a lower bound on how far the current point is from the nearest surface.",
    steps: [
      { expression: "pₙ = ro + tₙrd", reason: "Evaluate the current point on the camera ray." },
      { expression: "dₙ = map(pₙ)", reason: "Ask the scene SDF for the nearest surface distance." },
      { expression: "tₙ₊₁ = tₙ + dₙ", reason: "Move by that distance; no surface can be crossed before the reported nearest distance." },
      { expression: "stop when dₙ < ε or t exceeds the far limit", reason: "Treat a sufficiently small distance as a hit and bounded travel as a miss." },
    ],
    result: "Large empty-space steps become small near a surface, efficiently converging without explicit triangle intersections.",
    assumptions: "The map must be a valid or conservative distance estimate. Step and iteration limits trade accuracy for performance.",
    diagram: { description: "Each green segment is the safe distance reported at the previous ray point.", svg: raymarchSvg },
  },
  {
    id: "shader-lighting",
    title: "How an SDF normal produces diffuse and specular light",
    equation: "n ≈ normalize(∇d); diffuse = max(n·l,0)",
    startingPoint: "The gradient of a signed distance field points in the direction of fastest distance increase, perpendicular to the surface.",
    steps: [
      { expression: "∂d/∂x ≈ d(p+εx̂)−d(p−εx̂)", reason: "Use centred finite differences to estimate the x gradient; repeat for y and z." },
      { expression: "n = normalize(∂d/∂x,∂d/∂y,∂d/∂z)", reason: "Convert the gradient into a unit surface normal." },
      { expression: "diffuse = max(dot(n,l),0)", reason: "The dot product is the cosine of the angle to the light, clamped so back faces receive no direct light." },
      { expression: "specular = max(dot(reflect(−l,n),view),0)^shininess", reason: "Raise reflected-light alignment to a power to make a concentrated highlight." },
    ],
    result: "The normal turns a hit mask into a shaded solid whose brightness reveals orientation.",
    assumptions: "ε must be large enough for numerical stability but small relative to scene detail; this is a local lighting model without shadows.",
    diagram: { description: "After raymarching finds the surface, normal and light calculations feed the final colour.", svg: raymarchSvg },
  },
  {
    id: "shader-smin-composition",
    title: "How smooth minimum blends two SDF shapes",
    equation: "smin(a,b,k) = mix(b,a,h) − kh(1−h), h = clamp(1/2 + (b−a)/(2k),0,1)",
    startingPoint: "The ordinary minimum min(a,b) forms the union of two SDF shapes but leaves a sharp crease where their distances are equal.",
    steps: [
      { expression: "h = clamp(1/2 + (b−a)/(2k),0,1)", reason: "Measure which distance is smaller and create a blend only within width k of the crossover." },
      { expression: "mix(b,a,h)", reason: "Interpolate between the two distance fields through that blend region." },
      { expression: "−kh(1−h)", reason: "Apply a bulging correction that rounds the union instead of merely averaging its boundary." },
    ],
    result: "The zero surface transitions smoothly between the sphere and torus, producing a metaball-like melt.",
    assumptions: "k must be positive. Smooth composition changes exact distances near the blend, so conservative raymarch settings remain important.",
    diagram: { description: "Two scene-distance branches merge before the raymarch and lighting pipeline consumes the result.", svg: pixelPipelineSvg },
  },
]);
