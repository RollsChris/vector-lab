import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const flatShapeSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A slanted shape rearranged inside a rectangle with base b and perpendicular height h">
    <polygon points="55,135 205,135 255,45 105,45" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <line x1="105" y1="45" x2="105" y2="135" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M105 125 h10 v10" fill="none" stroke="#ff7b72" stroke-width="2"/>
    <text x="127" y="156" fill="#7ee787" font-size="16">base b</text>
    <text x="78" y="94" fill="#ffd166" font-size="16">h</text>
  </svg>`;

const polygonSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Regular hexagon split into six congruent triangles with apothem a">
    <polygon points="160,20 225,57 225,132 160,168 95,132 95,57" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="3"/>
    <g stroke="#8b949e" stroke-width="2"><line x1="160" y1="94" x2="160" y2="20"/><line x1="160" y1="94" x2="225" y2="57"/><line x1="160" y1="94" x2="225" y2="132"/><line x1="160" y1="94" x2="160" y2="168"/><line x1="160" y1="94" x2="95" y2="132"/><line x1="160" y1="94" x2="95" y2="57"/></g>
    <line x1="160" y1="94" x2="225" y2="94" stroke="#ffd166" stroke-width="3"/>
    <text x="188" y="88" fill="#ffd166" font-size="16">a</text>
    <text x="188" y="151" fill="#7ee787" font-size="16">side s</text>
  </svg>`;

const prismSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A prism built by extending a base area through perpendicular height h">
    <polygon points="60,130 175,130 225,95 110,95" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <polygon points="60,65 175,65 225,30 110,30" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <g stroke="#8b949e" stroke-width="2"><line x1="60" y1="130" x2="60" y2="65"/><line x1="175" y1="130" x2="175" y2="65"/><line x1="225" y1="95" x2="225" y2="30"/><line x1="110" y1="95" x2="110" y2="30"/></g>
    <text x="108" y="119" fill="#58a6ff" font-size="16">base area B</text>
    <text x="235" y="66" fill="#ffd166" font-size="16">h</text>
  </svg>`;

const solidOfRevolutionSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A circular solid shown as a stack of thin disks">
    <ellipse cx="160" cy="35" rx="58" ry="17" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="2"/>
    <ellipse cx="160" cy="70" rx="72" ry="19" fill="#58a6ff22" stroke="#58a6ff" stroke-width="2"/>
    <ellipse cx="160" cy="105" rx="72" ry="19" fill="#58a6ff22" stroke="#58a6ff" stroke-width="2"/>
    <ellipse cx="160" cy="140" rx="58" ry="17" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="88" y1="70" x2="88" y2="105" stroke="#ffd166" stroke-width="3"/>
    <text x="62" y="92" fill="#ffd166" font-size="16">dh</text>
  </svg>`;

registerFormulaDerivations("geometry", [
  {
    id: "circle",
    title: "Why the circle formulas use π",
    equation: "d = 2r, C = 2πr, A = πr²",
    startingPoint: "A diameter is two radii, π is defined by C/d, and a circle can be rearranged into an increasingly rectangle-like strip of sectors.",
    steps: [
      { expression: "d = r + r = 2r", reason: "A diameter runs through the centre from one side of the circle to the other." },
      { expression: "C/d = π ⇒ C = πd = 2πr", reason: "Multiply the defining ratio of π by d, then substitute d = 2r." },
      { expression: "base → C/2 = πr; height → r", reason: "Alternating many thin sectors makes a shape whose two long edges are half the circumference." },
      { expression: "A = base × height → πr × r = πr²", reason: "In the limit the gaps vanish and the rearranged sectors have the circle's original area." },
    ],
    result: "Radius determines the diameter, distance around the circle, and enclosed area.",
    assumptions: "Euclidean circle; r ≥ 0. The sector rearrangement is a limiting argument.",
    diagram: { description: "Thin sectors can be alternated to approach a rectangle of base πr and height r.", svg: solidOfRevolutionSvg },
  },
  {
    id: "parallelogram",
    title: "Why parallelogram area and perimeter have these forms",
    equation: "A = bh, P = 2(b + s)",
    startingPoint: "Cut the triangular overhang from one side of a parallelogram and move it to the other side.",
    steps: [
      { expression: "Aparallelogram = Arectangle", reason: "The cut-and-move rearrangement preserves area and makes a rectangle." },
      { expression: "A = b × h", reason: "The rectangle has the same base b and perpendicular height h." },
      { expression: "P = b + s + b + s", reason: "Opposite sides of a parallelogram have equal lengths." },
      { expression: "P = 2(b + s)", reason: "Collect the two copies of each side length." },
    ],
    result: "Use perpendicular height for area and the two distinct side lengths for perimeter.",
    assumptions: "b, h and s are non-negative lengths; h is perpendicular to the base.",
    diagram: { description: "The dashed perpendicular shows the height used by the area formula.", svg: flatShapeSvg },
  },
  {
    id: "regular-polygon",
    title: "How regular-polygon formulas follow from centre triangles",
    equation: "P = ns, a = s/[2tan(π/n)], A = Pa/2",
    startingPoint: "Joining the centre to all n vertices divides a regular polygon into n congruent isosceles triangles.",
    steps: [
      { expression: "P = ns", reason: "The boundary contains n equal sides, each of length s." },
      { expression: "tan(π/n) = (s/2)/a", reason: "Bisect one centre triangle; its half-angle is π/n and its opposite leg is s/2." },
      { expression: "a = s/[2tan(π/n)]", reason: "Rearrange the right-triangle tangent ratio." },
      { expression: "A = n(½sa) = ½(ns)a = Pa/2", reason: "Add the areas of the n centre triangles and substitute P = ns." },
      { expression: "interior = (n−2)180°/n; exterior = 360°/n", reason: "Triangulation gives total interior angle (n−2)180°, while one full turn is shared equally among n exterior angles." },
    ],
    result: "Side count and side length determine every displayed regular-polygon measurement.",
    assumptions: "n is an integer with n ≥ 3 and the polygon is regular and convex.",
    diagram: { description: "The apothem is the perpendicular height of each congruent centre triangle.", svg: polygonSvg },
  },
  {
    id: "triangle-area",
    title: "Why triangle area is half base times height",
    equation: "A = ½bh",
    startingPoint: "A congruent copy of a triangle can be rotated to complete a parallelogram.",
    steps: [
      { expression: "2Atriangle = Aparallelogram", reason: "The completed parallelogram consists of exactly two congruent triangles." },
      { expression: "Aparallelogram = bh", reason: "Its base and perpendicular height match those of the original triangle." },
      { expression: "Atriangle = bh/2", reason: "Divide the doubled area by two." },
    ],
    result: "Any side may be the base provided h is measured perpendicular to that side.",
    assumptions: "b and h are non-negative lengths.",
    diagram: { description: "Two congruent triangles make a parallelogram with area bh.", svg: flatShapeSvg },
  },
  {
    id: "rectangle-area",
    title: "Why rectangle area and perimeter use products and paired sums",
    equation: "A = lw, P = 2(l + w)",
    startingPoint: "A rectangle can be tiled by unit squares in l rows/columns by w rows/columns.",
    steps: [
      { expression: "A = l × w", reason: "Each of the l unit-length strips contains w unit squares, extended continuously to non-integer lengths." },
      { expression: "P = l + w + l + w", reason: "Opposite sides of a rectangle are equal." },
      { expression: "P = 2(l + w)", reason: "Collect the two lengths and two widths." },
    ],
    result: "The product measures the interior; the paired sum measures the boundary.",
    assumptions: "l,w ≥ 0 and adjacent sides are perpendicular.",
    diagram: { description: "A rectangle is measured along two perpendicular dimensions.", svg: flatShapeSvg },
  },
  {
    id: "trapezium-area",
    title: "Why trapezium area uses the average parallel side",
    equation: "A = ½(a + b)h",
    startingPoint: "Two congruent copies of a trapezium fit together to make a parallelogram.",
    steps: [
      { expression: "base of combined parallelogram = a + b", reason: "The two unequal parallel edges meet end to end." },
      { expression: "2Atrapezium = (a + b)h", reason: "The parallelogram has height h and contains two congruent copies." },
      { expression: "Atrapezium = ½(a + b)h", reason: "Divide by two." },
    ],
    result: "Area equals height times the arithmetic mean of the parallel side lengths.",
    assumptions: "a and b are the parallel sides and h is their perpendicular separation.",
    diagram: { description: "A second copy completes a parallelogram whose base is a + b.", svg: flatShapeSvg },
  },
  {
    id: "cuboid-volume",
    title: "How cuboid volume and surface area are counted",
    equation: "V = lwh, SA = 2(lw + lh + wh)",
    startingPoint: "A cuboid is a stack of congruent l-by-w rectangular layers.",
    steps: [
      { expression: "base area = lw", reason: "Each layer is a rectangle." },
      { expression: "V = (lw)h = lwh", reason: "Stacking through perpendicular height h multiplies base area by height." },
      { expression: "SA = 2lw + 2lh + 2wh", reason: "There are two faces of each of the three rectangular types." },
      { expression: "SA = 2(lw + lh + wh)", reason: "Factor out the common 2." },
    ],
    result: "Volume counts filled unit cubes; surface area counts all six exterior faces.",
    assumptions: "l,w,h ≥ 0 and all adjacent faces meet at right angles.",
    diagram: { description: "A prism extends a constant base area through height h.", svg: prismSvg },
  },
  {
    id: "cylinder-volume",
    title: "How cylinder volume and surface area come from a circle",
    equation: "V = πr²h, SA = 2πr(r + h)",
    startingPoint: "A cylinder is a constant circular cross-section extruded through height h.",
    steps: [
      { expression: "base area = πr²", reason: "Each perpendicular slice is a circle of radius r." },
      { expression: "V = base area × height = πr²h", reason: "A prism-like solid with constant cross-section has volume Bh." },
      { expression: "lateral area = circumference × height = 2πrh", reason: "Unrolling the curved surface makes a rectangle 2πr by h." },
      { expression: "SA = 2πr² + 2πrh = 2πr(r + h)", reason: "Add the two circular ends and factor." },
    ],
    result: "The same circle formula supplies both the cylinder's base volume and its end areas.",
    assumptions: "Right circular cylinder with r,h ≥ 0.",
    diagram: { description: "A cylinder is a stack of equal circular disks.", svg: prismSvg },
  },
  {
    id: "cone-volume",
    title: "Why a cone has one third of the matching cylinder's volume",
    equation: "V = ⅓πr²h, l = √(r²+h²), SA = πr(r+l)",
    startingPoint: "At distance x from the tip, similarity makes a cone's cross-section radius rx/h.",
    steps: [
      { expression: "A(x) = π(rx/h)²", reason: "Each perpendicular slice is a circle and similar triangles scale its radius linearly." },
      { expression: "V = ∫₀ʰ A(x)dx = πr²/h² · [x³/3]₀ʰ = ⅓πr²h", reason: "Sum the thin circular slices through the cone." },
      { expression: "l² = r² + h² ⇒ l = √(r²+h²)", reason: "A radius, height and slant height form a right triangle." },
      { expression: "lateral area = πrl; SA = πr² + πrl = πr(r+l)", reason: "The unrolled curved surface is a sector whose area is πrl; then add the base." },
    ],
    result: "The taper contributes the factor 1/3; the slant height controls the curved surface.",
    assumptions: "Right circular cone with r,h ≥ 0; l is the straight slant height.",
    diagram: { description: "Thin circular slices shrink linearly toward the cone's tip.", svg: solidOfRevolutionSvg },
  },
  {
    id: "sphere-volume",
    title: "How sphere volume and surface area arise from slices",
    equation: "V = ⁴⁄₃πr³, SA = 4πr²",
    startingPoint: "At height z from the centre, Pythagoras gives the sphere's disk radius squared as r² − z².",
    steps: [
      { expression: "A(z) = π(r² − z²)", reason: "The disk radius ρ satisfies ρ² + z² = r²." },
      { expression: "V = ∫₋ᵣʳ π(r²−z²)dz", reason: "Sum all infinitesimal circular disks from the bottom to the top." },
      { expression: "V = π[r²z − z³/3]₋ᵣʳ = ⁴⁄₃πr³", reason: "Evaluate the definite integral." },
      { expression: "SA = dV/dr = d(⁴⁄₃πr³)/dr = 4πr²", reason: "Increasing the radius by dr adds a thin shell whose leading-order volume is SA·dr." },
    ],
    result: "A sphere encloses 4πr³/3 and has four times the area of its great-circle disk.",
    assumptions: "Euclidean sphere with r ≥ 0; the derivation uses infinitesimal slicing.",
    diagram: { description: "The sphere is summed from circular disks whose radii vary with height.", svg: solidOfRevolutionSvg },
  },
]);
