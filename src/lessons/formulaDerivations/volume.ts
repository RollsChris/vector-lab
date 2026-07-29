import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const prismSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Equal cross-sectional slices stacked through perpendicular height h">
    <polygon points="55,140 175,140 225,108 105,108" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <polygon points="55,70 175,70 225,38 105,38" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <g stroke="#8b949e" stroke-width="2"><line x1="55" y1="140" x2="55" y2="70"/><line x1="175" y1="140" x2="175" y2="70"/><line x1="225" y1="108" x2="225" y2="38"/><line x1="105" y1="108" x2="105" y2="38"/></g>
    <polygon points="55,105 175,105 225,73 105,73" fill="#d2a8ff55" stroke="#d2a8ff" stroke-width="2"/>
    <text x="112" y="130" fill="#58a6ff" font-size="16">base area B</text>
    <text x="238" y="91" fill="#7ee787" font-size="16">h</text>
  </svg>`;

const pyramidSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A pyramid with base area B, perpendicular height h and shrinking parallel slices">
    <polygon points="55,145 215,145 265,112 105,112" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <g stroke="#8b949e" stroke-width="2"><line x1="160" y1="25" x2="55" y2="145"/><line x1="160" y1="25" x2="215" y2="145"/><line x1="160" y1="25" x2="265" y2="112"/><line x1="160" y1="25" x2="105" y2="112"/></g>
    <polygon points="115,90 187,90 210,75 138,75" fill="#d2a8ff55" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="160" y1="25" x2="160" y2="132" stroke="#7ee787" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="169" y="82" fill="#7ee787" font-size="16">h</text>
    <text x="120" y="136" fill="#58a6ff" font-size="16">B</text>
  </svg>`;

const roundSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A rounded solid represented as a stack of thin circular slices">
    <ellipse cx="160" cy="32" rx="42" ry="12" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="2"/>
    <ellipse cx="160" cy="62" rx="68" ry="17" fill="#58a6ff22" stroke="#58a6ff" stroke-width="2"/>
    <ellipse cx="160" cy="92" rx="78" ry="19" fill="#7ee78722" stroke="#7ee787" stroke-width="2"/>
    <ellipse cx="160" cy="122" rx="68" ry="17" fill="#58a6ff22" stroke="#58a6ff" stroke-width="2"/>
    <ellipse cx="160" cy="150" rx="42" ry="12" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="2"/>
    <text x="244" y="96" fill="#7ee787" font-size="16">A(z)</text>
  </svg>`;

const frustumSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A frustum with parallel end areas A1 and A2 and the missing tip shown dashed">
    <polygon points="65,145 225,145 260,120 100,120" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <polygon points="112,75 190,75 208,63 130,63" fill="#7ee78733" stroke="#7ee787" stroke-width="3"/>
    <g stroke="#8b949e" stroke-width="2"><line x1="65" y1="145" x2="112" y2="75"/><line x1="225" y1="145" x2="190" y2="75"/><line x1="260" y1="120" x2="208" y2="63"/><line x1="100" y1="120" x2="130" y2="63"/></g>
    <g stroke="#8b949e" stroke-width="2" stroke-dasharray="5 5"><line x1="112" y1="75" x2="160" y2="20"/><line x1="190" y1="75" x2="160" y2="20"/><line x1="208" y1="63" x2="160" y2="20"/><line x1="130" y1="63" x2="160" y2="20"/></g>
    <text x="130" y="137" fill="#58a6ff" font-size="16">A₁</text>
    <text x="140" y="58" fill="#7ee787" font-size="16">A₂</text>
  </svg>`;

const compositeSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A composite solid split into pieces and a hollow solid shown as outer volume minus inner volume">
    <rect x="45" y="75" width="100" height="72" rx="5" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <path d="M45 75 A50 50 0 0 1 145 75" fill="#d2a8ff33" stroke="#d2a8ff" stroke-width="3"/>
    <ellipse cx="235" cy="55" rx="46" ry="16" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <ellipse cx="235" cy="55" rx="22" ry="8" fill="#0d1117" stroke="#ffa657" stroke-width="3"/>
    <path d="M189 55v75c0 9 21 16 46 16s46-7 46-16V55" fill="#7ee78712" stroke="#7ee787" stroke-width="3"/>
    <path d="M213 55v75c0 4 10 8 22 8s22-4 22-8V55" fill="#0d1117" stroke="#ffa657" stroke-width="3"/>
    <text x="56" y="165" fill="#58a6ff" font-size="15">add pieces</text>
    <text x="197" y="165" fill="#ffa657" font-size="15">subtract hole</text>
  </svg>`;

const scaleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A unit cube and a cube doubled in every direction, containing eight unit cubes">
    <rect x="35" y="75" width="55" height="55" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <rect x="155" y="35" width="110" height="110" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <line x1="210" y1="35" x2="210" y2="145" stroke="#8b949e" stroke-width="2"/>
    <line x1="155" y1="90" x2="265" y2="90" stroke="#8b949e" stroke-width="2"/>
    <text x="44" y="153" fill="#58a6ff" font-size="15">1 × 1 × 1</text>
    <text x="166" y="166" fill="#7ee787" font-size="15">2 × 2 × 2 = 8</text>
  </svg>`;

registerFormulaDerivations("volume", [
  {
    id: "cuboid-volume",
    title: "How cube and cuboid volume count unit-cube layers",
    equation: "V = lwh; cube: V = a³",
    startingPoint: "A cuboid consists of congruent rectangular layers, each with area lw.",
    steps: [
      { expression: "B = lw", reason: "One layer is an l-by-w rectangle." },
      { expression: "V = Bh = (lw)h = lwh", reason: "Stack the constant layer through perpendicular height h." },
      { expression: "l = w = h = a ⇒ V = a³", reason: "A cube is the special case in which all three dimensions are equal." },
      { expression: "SA = 2(lw + lh + wh)", reason: "There are two exterior faces of each rectangular type." },
    ],
    result: "Volume counts l × w × h unit cubes; a cube therefore contains a³ cubic units.",
    assumptions: "All dimensions are non-negative and mutually perpendicular.",
    diagram: { description: "The highlighted slice has the same area at every level of the cuboid.", svg: prismSvg },
  },
  {
    id: "volume-scaling",
    title: "Why volume scales with the cube of length",
    equation: "length × k ⇒ area × k² and volume × k³",
    startingPoint: "A three-dimensional solid has one scale factor in each of three independent directions.",
    steps: [
      { expression: "l → kl, w → kw, h → kh", reason: "Every linear dimension is multiplied by k." },
      { expression: "Vnew = (kl)(kw)(kh)", reason: "A cuboid makes the three-dimensional multiplication explicit." },
      { expression: "Vnew = k³lwh = k³Vold", reason: "Collect the three copies of k." },
      { expression: "k = 2 ⇒ Vnew = 8Vold", reason: "Doubling in three directions creates 2 × 2 × 2 = 8 copies." },
    ],
    result: "Similar solids scale in volume by the cube of their linear scale factor.",
    assumptions: "The new solid is geometrically similar to the original and all lengths use the same unit.",
    diagram: { description: "Doubling every edge allows eight copies of the original cube to fit.", svg: scaleSvg },
  },
  {
    id: "prism-volume",
    title: "Why every prism uses base area times height",
    equation: "V = Bh",
    startingPoint: "Every cross-section perpendicular to a prism's height has the same area B.",
    steps: [
      { expression: "thin slice volume ≈ B·Δh", reason: "A sufficiently thin slice is a short prism." },
      { expression: "V ≈ ΣB·Δh", reason: "Stack all non-overlapping slices through the solid." },
      { expression: "V = BΣΔh = Bh", reason: "B is constant and the slice thicknesses total h." },
    ],
    result: "Any right or oblique prism with constant perpendicular cross-section has volume Bh.",
    assumptions: "B is measured perpendicular to h and the cross-section is constant.",
    diagram: { description: "The purple slice can move anywhere through the prism without changing area.", svg: prismSvg },
  },
  {
    id: "regular-prism-volume",
    title: "How a regular polygon becomes a prism base",
    equation: "B = (n/4)s²cot(π/n); V = Bh",
    startingPoint: "Joining a regular n-gon's centre to its vertices creates n congruent isosceles triangles.",
    steps: [
      { expression: "apothem a = s/[2tan(π/n)]", reason: "Bisect one centre triangle and use the tangent ratio." },
      { expression: "B = n(½sa) = (n/4)s²cot(π/n)", reason: "Add the areas of the n centre triangles." },
      { expression: "V = Bh", reason: "The polygonal base is copied unchanged through height h." },
      { expression: "SA = 2B + nsh", reason: "Add both bases and n rectangular side faces." },
    ],
    result: "The polygon formula supplies B; the universal prism rule then supplies volume.",
    assumptions: "n is an integer at least 3; the polygon is regular and h is perpendicular.",
    diagram: { description: "A regular polygonal base is extended through a constant height.", svg: prismSvg },
  },
  {
    id: "cylinder-volume",
    title: "Why a cylinder is a circular prism",
    equation: "V = πr²h; SA = 2πr(r+h)",
    startingPoint: "Every perpendicular slice of a right circular cylinder is a circle of radius r.",
    steps: [
      { expression: "B = πr²", reason: "The constant base is a circle." },
      { expression: "V = Bh = πr²h", reason: "Apply the constant-cross-section prism rule." },
      { expression: "curved area = (2πr)h", reason: "Unrolling the side makes a rectangle whose width is the circumference." },
      { expression: "SA = 2πr² + 2πrh = 2πr(r+h)", reason: "Add the two circular ends." },
    ],
    result: "A cylinder stacks equal circular disks and uses exactly the same Bh principle as a prism.",
    assumptions: "Right circular cylinder with r,h ≥ 0.",
    diagram: { description: "The constant circular slice sweeps through the cylinder's height.", svg: prismSvg },
  },
  {
    id: "pyramid-volume",
    title: "Why every pyramid has one third of the matching prism",
    equation: "V = ⅓Bh",
    startingPoint: "Parallel slices of a pyramid are similar to its base and shrink linearly toward the apex.",
    steps: [
      { expression: "linear scale at distance x from apex = x/h", reason: "Corresponding lengths in similar cross-sections are proportional." },
      { expression: "slice area A(x) = B(x/h)²", reason: "Area scales as the square of linear scale." },
      { expression: "V = ∫₀ʰ Bx²/h² dx", reason: "Add the changing parallel slices." },
      { expression: "V = B/h² · [x³/3]₀ʰ = ⅓Bh", reason: "Evaluate the slice sum." },
    ],
    result: "The taper removes two thirds of the matching prism's volume, leaving one third.",
    assumptions: "A true pyramid or cone with apex vertically aligned for h; B is perpendicular to h.",
    diagram: { description: "The highlighted parallel slice shrinks quadratically toward the apex.", svg: pyramidSvg },
  },
  {
    id: "tetrahedron-volume",
    title: "How the regular tetrahedron formula follows from ⅓Bh",
    equation: "V = a³/(6√2); SA = √3a²",
    startingPoint: "A regular tetrahedron is a pyramid with an equilateral-triangle base.",
    steps: [
      { expression: "B = √3a²/4", reason: "This is the area of an equilateral triangle of side a." },
      { expression: "h = a√(2/3)", reason: "Pythagoras between the apex, base centre and a base vertex gives the perpendicular height." },
      { expression: "V = ⅓Bh = ⅓(√3a²/4)(a√(2/3))", reason: "Apply the pyramid-volume rule." },
      { expression: "V = a³/(6√2)", reason: "Simplify the radicals and constants." },
    ],
    result: "A regular tetrahedron's one side length determines its base, height, volume and four-face surface area.",
    assumptions: "All four faces are congruent equilateral triangles of side a.",
    diagram: { description: "The tetrahedron is treated as a triangular pyramid.", svg: pyramidSvg },
  },
  {
    id: "cone-volume",
    title: "Why a cone is one third of its matching cylinder",
    equation: "V = ⅓πr²h",
    startingPoint: "A cone is a circular pyramid whose disk radii shrink linearly toward the tip.",
    steps: [
      { expression: "slice radius at x = rx/h", reason: "Similar triangles relate the slice to the full cone." },
      { expression: "A(x) = πr²x²/h²", reason: "Square the slice radius in the circle-area formula." },
      { expression: "V = ∫₀ʰ A(x)dx = πr²/h² · [x³/3]₀ʰ", reason: "Add the disks from tip to base." },
      { expression: "V = ⅓πr²h", reason: "Evaluate at x = h." },
    ],
    result: "The cone contains exactly one third of the cylinder with the same base and height.",
    assumptions: "Right circular cone with r,h ≥ 0.",
    diagram: { description: "Circular slices grow from zero at the tip to πr² at the base.", svg: pyramidSvg },
  },
  {
    id: "sphere-volume",
    title: "How circular slices produce the sphere formula",
    equation: "V = ⁴⁄₃πr³; SA = 4πr²",
    startingPoint: "At vertical coordinate z, a sphere's circular slice has radius squared r² − z².",
    steps: [
      { expression: "ρ² + z² = r² ⇒ ρ² = r²−z²", reason: "A radius to the slice edge forms a right triangle." },
      { expression: "A(z) = π(r²−z²)", reason: "Use the circle-area formula on the slice." },
      { expression: "V = ∫₋ᵣʳ π(r²−z²)dz", reason: "Add every disk from bottom to top." },
      { expression: "V = ⁴⁄₃πr³", reason: "Evaluating the integral gives the sphere's volume." },
    ],
    result: "A sphere encloses 4πr³/3 and has surface area 4πr².",
    assumptions: "Euclidean sphere with r ≥ 0.",
    diagram: { description: "The sphere is assembled from disks whose areas change with height.", svg: roundSvg },
  },
  {
    id: "hemisphere-volume",
    title: "Why a hemisphere is half a sphere",
    equation: "V = ⅔πr³; curved SA = 2πr²",
    startingPoint: "A plane through a sphere's centre divides it into two congruent solids.",
    steps: [
      { expression: "Vhemisphere = ½Vsphere", reason: "The two halves match exactly by reflection." },
      { expression: "V = ½(⁴⁄₃πr³) = ⅔πr³", reason: "Halve the sphere-volume formula." },
      { expression: "curved SA = ½(4πr²) = 2πr²", reason: "The curved surface is also divided equally." },
      { expression: "total SA = 2πr² + πr² = 3πr²", reason: "Include the flat circular base when required." },
    ],
    result: "A hemisphere has half the sphere's volume and curved area, plus one circular base if closed.",
    assumptions: "The cutting plane passes through the sphere's centre.",
    diagram: { description: "The upper half of the disk stack is one hemisphere.", svg: roundSvg },
  },
  {
    id: "spherical-cap-volume",
    title: "How slicing a sphere gives a cap's volume",
    equation: "V = ⅓πh²(3r−h)",
    startingPoint: "A cap of height h occupies the top part of a sphere of radius r.",
    steps: [
      { expression: "disk area at level z = π(r²−z²)", reason: "Use the sphere equation as for the full sphere." },
      { expression: "Vcap = ∫ᵣ₋ₕʳ π(r²−z²)dz", reason: "Only add disks between the cutting plane and the top." },
      { expression: "Vcap = π[r²z−z³/3]ᵣ₋ₕʳ", reason: "Integrate the disk area." },
      { expression: "Vcap = ⅓πh²(3r−h)", reason: "Substitute the limits and simplify." },
    ],
    result: "Cap volume depends only on sphere radius r and cap height h.",
    assumptions: "0 ≤ h ≤ 2r; h is measured perpendicular to the cutting plane.",
    diagram: { description: "Only the top portion of the sphere's slice stack is added.", svg: roundSvg },
  },
  {
    id: "ellipsoid-volume",
    title: "Why an ellipsoid has volume ⁴⁄₃πabc",
    equation: "V = ⁴⁄₃πabc",
    startingPoint: "An ellipsoid is a unit sphere stretched by factors a, b and c along three perpendicular axes.",
    steps: [
      { expression: "Vunit sphere = ⁴⁄₃π", reason: "Set the sphere radius to 1." },
      { expression: "x stretch a ⇒ volume ×a", reason: "Every slice thickness in the x direction is multiplied by a." },
      { expression: "y and z stretches ⇒ volume ×b×c", reason: "Independent perpendicular stretches multiply." },
      { expression: "V = ⁴⁄₃πabc", reason: "Apply the total three-dimensional scale factor abc." },
    ],
    result: "The three semi-axes multiply the unit-sphere volume.",
    assumptions: "a,b,c ≥ 0 and the ellipsoid axes are mutually perpendicular.",
    diagram: { description: "Stretching a sphere changes each family of slices by the matching axis factor.", svg: roundSvg },
  },
  {
    id: "torus-volume",
    title: "How rotating a circle creates torus volume",
    equation: "V = 2π²Rr²; SA = 4π²Rr",
    startingPoint: "A circle of radius r is revolved around an external axis R units from its centre.",
    steps: [
      { expression: "generating area = πr²", reason: "The torus cross-section is a circle." },
      { expression: "centroid path = 2πR", reason: "The circle's centre travels one circumference around the axis." },
      { expression: "V = (πr²)(2πR) = 2π²Rr²", reason: "Pappus's centroid theorem multiplies area by centroid travel distance." },
      { expression: "SA = (2πr)(2πR) = 4π²Rr", reason: "Apply the companion theorem to the generating circumference." },
    ],
    result: "Torus volume is generating-circle area times the distance travelled by its centre.",
    assumptions: "R > r ≥ 0 so the generating circle does not cross the rotation axis.",
    diagram: { description: "The circular cross-section travels around the torus's major circle.", svg: roundSvg },
  },
  {
    id: "capsule-volume",
    title: "Why a capsule is a cylinder plus a sphere",
    equation: "V = πr²h + ⁴⁄₃πr³",
    startingPoint: "Cut at the two joins between the straight middle and rounded ends.",
    steps: [
      { expression: "Vmiddle = πr²h", reason: "The straight section is a cylinder." },
      { expression: "Vend caps = 2(⅔πr³)", reason: "Each rounded end is a hemisphere." },
      { expression: "Vend caps = ⁴⁄₃πr³", reason: "Two hemispheres make one complete sphere." },
      { expression: "Vtotal = πr²h + ⁴⁄₃πr³", reason: "Add the non-overlapping pieces." },
    ],
    result: "The cylindrical length h excludes the hemispherical ends.",
    assumptions: "Both end caps are hemispheres of the same radius as the cylinder.",
    diagram: { description: "A capsule separates into one cylinder and two hemispheres.", svg: compositeSvg },
  },
  {
    id: "frustum-volume",
    title: "How subtracting similar pyramids gives the general frustum formula",
    equation: "V = ⅓h(A₁+A₂+√(A₁A₂))",
    startingPoint: "Complete the frustum to a large pyramid, leaving a smaller similar pyramid above it.",
    steps: [
      { expression: "linear scale q = √(A₂/A₁)", reason: "Areas of similar cross-sections scale as the square of lengths." },
      { expression: "small height / large height = q", reason: "The two pyramids are similar." },
      { expression: "Vfrustum = ⅓A₁H − ⅓A₂(H−h)", reason: "Subtract the missing small pyramid from the complete large one." },
      { expression: "V = ⅓h(A₁+A₂+√(A₁A₂))", reason: "Use the similarity relation to eliminate H and simplify." },
    ],
    result: "The symmetric formula works for any pyramid or cone frustum with similar parallel ends.",
    assumptions: "The end sections are parallel and similar, with perpendicular separation h.",
    diagram: { description: "Dashed edges complete the removed tip used in the subtraction.", svg: frustumSvg },
  },
  {
    id: "cone-frustum-volume",
    title: "How the general frustum formula becomes the cone-frustum formula",
    equation: "V = ⅓πh(R²+Rr+r²)",
    startingPoint: "The two parallel end areas of a cone frustum are πR² and πr².",
    steps: [
      { expression: "A₁ = πR²; A₂ = πr²", reason: "Both ends are circles." },
      { expression: "√(A₁A₂) = √(π²R²r²) = πRr", reason: "R and r are non-negative radii." },
      { expression: "V = ⅓h(πR²+πr²+πRr)", reason: "Substitute into the general frustum formula." },
      { expression: "V = ⅓πh(R²+Rr+r²)", reason: "Factor out π." },
    ],
    result: "Both end radii and the mixed Rr term are required.",
    assumptions: "Right circular frustum with parallel circular ends and R,r,h ≥ 0.",
    diagram: { description: "The dashed tip shows the small cone removed from the large cone.", svg: frustumSvg },
  },
  {
    id: "pipe-volume",
    title: "Why pipe volume is outer cylinder minus inner cylinder",
    equation: "V = πh(R²−r²)",
    startingPoint: "A pipe fits inside a solid outer cylinder but has an empty coaxial cylindrical bore.",
    steps: [
      { expression: "Vouter = πR²h", reason: "Use the cylinder formula with outer radius R." },
      { expression: "Vvoid = πr²h", reason: "The missing bore is a cylinder of inner radius r." },
      { expression: "Vmaterial = Vouter−Vvoid", reason: "The bore contains no pipe material." },
      { expression: "Vmaterial = πh(R²−r²)", reason: "Factor out the common πh." },
    ],
    result: "Subtract the inner circular area before multiplying by length, or subtract the two cylinder volumes.",
    assumptions: "0 ≤ r < R and the two cylinders share the same axis and height.",
    diagram: { description: "The orange inner cylinder is removed from the green outer cylinder.", svg: compositeSvg },
  },
  {
    id: "silo-volume",
    title: "How to add a cylindrical silo and hemispherical roof",
    equation: "V = πr²h + ⅔πr³",
    startingPoint: "The spring line separates the silo into two non-overlapping familiar solids.",
    steps: [
      { expression: "Vcylinder = πr²h", reason: "The vertical wall encloses a right circular cylinder." },
      { expression: "Vdome = ½(⁴⁄₃πr³) = ⅔πr³", reason: "The roof is a hemisphere." },
      { expression: "Vtotal = Vcylinder + Vdome", reason: "Both pieces contribute storage space." },
      { expression: "V = πr²h + ⅔πr³", reason: "Substitute the two component formulas." },
    ],
    result: "Composite volume is the sum of the cylinder and hemispherical dome.",
    assumptions: "The dome is exactly a hemisphere of the same radius as the cylinder.",
    diagram: { description: "The silo is split into a cylindrical body and rounded roof.", svg: compositeSvg },
  },
  {
    id: "displacement-volume",
    title: "Why liquid rise measures an immersed object's volume",
    equation: "Vobject = Vfinal − Vinitial",
    startingPoint: "An immersed object occupies space that the liquid can no longer occupy.",
    steps: [
      { expression: "initial liquid volume = Vi", reason: "Record the graduated-container reading before immersion." },
      { expression: "final occupied reading = Vi + Vobject", reason: "A fully submerged object displaces an equal volume of liquid." },
      { expression: "Vf = Vi + Vobject", reason: "The graduated scale reports the combined occupied volume." },
      { expression: "Vobject = Vf−Vi", reason: "Rearrange to isolate the object's volume." },
    ],
    result: "One millilitre of displaced liquid corresponds to one cubic centimetre of object volume.",
    assumptions: "The object is fully submerged, does not dissolve or absorb liquid, and traps no air.",
    diagram: { description: "The object adds to the occupied volume measured by the container.", svg: compositeSvg },
  },
  {
    id: "archimedes-volume-ratio",
    title: "Why cone, hemisphere and cylinder volumes are in the ratio 1:2:3",
    equation: "for equal r and h = r: Vcone : Vhemisphere : Vcylinder = 1 : 2 : 3",
    startingPoint: "Give all three solids radius r and vertical height r.",
    steps: [
      { expression: "Vcone = ⅓πr²(r) = ⅓πr³", reason: "Use the cone formula with h = r." },
      { expression: "Vhemisphere = ⅔πr³", reason: "Take half the sphere volume." },
      { expression: "Vcylinder = πr²(r) = πr³", reason: "Use the cylinder formula with h = r." },
      { expression: "⅓ : ⅔ : 1 = 1 : 2 : 3", reason: "Multiply every part by 3." },
    ],
    result: "The hemisphere contains twice the cone volume and the cylinder contains three times the cone volume.",
    assumptions: "All solids share radius r and both cone and cylinder have height r.",
    diagram: { description: "Equal-radius, equal-height solids can be compared by their formula coefficients.", svg: roundSvg },
  },
  {
    id: "surface-volume-scaling",
    title: "Why surface-area-to-volume ratio falls as size grows",
    equation: "similar solids scaled by k: SA → k²SA, V → k³V, SA/V → (SA/V)/k",
    startingPoint: "Area uses two independent length directions, while volume uses three.",
    steps: [
      { expression: "SAnew = k²SAold", reason: "Every similar surface patch scales in two directions." },
      { expression: "Vnew = k³Vold", reason: "The solid scales in three directions." },
      { expression: "SAnew/Vnew = k²SAold/(k³Vold)", reason: "Form the new surface-area-to-volume ratio." },
      { expression: "SAnew/Vnew = (SAold/Vold)/k", reason: "Cancel k² from numerator and denominator." },
    ],
    result: "Doubling a similar solid halves its surface-area-to-volume ratio.",
    assumptions: "The compared solids are geometrically similar.",
    diagram: { description: "The larger similar cube gains volume faster than surface area.", svg: scaleSvg },
  },
]);
