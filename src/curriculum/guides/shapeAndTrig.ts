import type { LessonGuide } from "../types";

/** Teaching guides for Stage 3 Shape & space and Stage 4 Trigonometry & waves. */
export const SHAPE_AND_TRIG_GUIDES: readonly LessonGuide[] = [
  {
    id: "geometry",
    plainEnglish:
      "This lesson is a toolbox for finding how far it is around a shape, how much flat space it covers, or how much it can hold. Choose a shape and enter its measurements.",
    objectives: [
      "calculate the perimeter and area of common flat shapes",
      "calculate the volume and surface area of common solid shapes",
      "select the measurements needed by a shape formula",
      "explain why area uses square units and volume uses cubic units",
    ],
    whyItMatters:
      "Builders estimate flooring, paint and concrete from area and volume, while product designers use the same calculations to size boxes, pipes and tanks.",
    keyIdea:
      "Match the shape to a formula, then keep track of whether the result measures a boundary, a surface or a filled space.",
    workedExample: {
      prompt:
        "A circle has radius 3 units. Calculate its diameter, circumference and area.",
      steps: [
        "d = 2r = 2 × 3 = 6 units, because the diameter is two radii.",
        "C = 2πr = 2 × π × 3 = 6π units, because circumference measures the boundary.",
        "6π ≈ 18.85, so the circumference is about 18.85 units.",
        "A = πr² = π × 3² = 9π ≈ 28.27 units², because area measures the inside surface.",
      ],
      answer:
        "The diameter is 6 units, the circumference is about 18.85 units, and the area is about 28.27 units².",
    },
    pitfalls: [
      "Using the slanted side as a parallelogram's height → use the perpendicular height.",
      "Writing square units for a volume → volume uses cubic units because three lengths are multiplied.",
      "Using diameter in a formula that asks for radius → divide the diameter by two first.",
      "Adding side lengths when the question asks for area → perimeter measures around; area measures inside.",
    ],
    checks: [
      {
        question: "What is the area of a triangle with base 10 units and height 6 units?",
        answer:
          "A = ½ × 10 × 6 = 30 units². The factor of one half is used because the triangle is half of a matching parallelogram.",
      },
      {
        question: "What is the volume of a cuboid measuring 5 by 3 by 2 units?",
        answer:
          "V = 5 × 3 × 2 = 30 units³. Multiplying the three perpendicular dimensions counts the filled space.",
      },
      {
        question:
          "A trapezium has parallel sides 8 and 5 units and height 4 units. What is its area?",
        answer:
          "A = ½ × (8 + 5) × 4 = ½ × 13 × 4 = 26 units². The formula uses the average of the parallel sides multiplied by the height.",
      },
    ],
    tryThis:
      "Choose Volume in the Section control and Cuboid / box in the Shape control. Change Length, Width and Height one at a time and compare how the preview, Volume and Surface area respond.",
  },
  {
    id: "triangle-theorems",
    plainEnglish:
      "Three joined corners make a shape whose parts always obey the same dependable rules. Move the corners and watch those rules keep working.",
    objectives: [
      "calculate a missing angle using the triangle angle sum",
      "calculate missing sides or angles with the sine rule and cosine rule",
      "calculate a triangle's area from suitable measurements",
      "construct the centroid, circumcentre, incentre, orthocentre and nine-point circle",
      "explain why the medial triangle has parallel half-length sides",
    ],
    whyItMatters:
      "Surveyors use triangles to measure an inaccessible river crossing, engineers analyse roof trusses, and graphics software builds curved models from triangular meshes.",
    keyIdea:
      "A triangle is rigid enough that a few measured parts determine all the others.",
    workedExample: {
      prompt:
        "Two sides of a triangle are 7 units and 9 units, and the angle between them is 60°. Calculate the opposite side c.",
      steps: [
        "c² = 7² + 9² − 2 × 7 × 9 × cos 60°, using the cosine rule because two sides and their included angle are known.",
        "c² = 49 + 81 − 126 × 0.5, because cos 60° = 0.5.",
        "c² = 130 − 63 = 67, after completing the arithmetic.",
        "c = √67 ≈ 8.19 units, taking the positive square root because a length is positive.",
      ],
      answer: "The opposite side is √67 units, or approximately 8.19 units.",
    },
    pitfalls: [
      "Using the sine rule when two sides and the angle between them are known → that case needs the cosine rule.",
      "Matching a side with the wrong angle in the sine rule → each side pairs with the angle directly opposite it.",
      "Using a sloping side as the height in ½bh → the height must meet the base at 90°.",
      "Assuming every triangle centre lies inside → the circumcentre and orthocentre can lie outside an obtuse triangle.",
    ],
    checks: [
      {
        question: "A triangle has angles 48° and 67°. What is its third angle?",
        answer:
          "The angles total 180°, so the third angle is 180° − 48° − 67° = 65°.",
      },
      {
        question: "Which triangle centre is the balance point, and how is it constructed?",
        answer:
          "The centroid is the balance point. Draw each median from a vertex to the midpoint of the opposite side; the three medians meet at the centroid.",
      },
      {
        question:
          "Which nine points lie on the nine-point circle, and what is its radius?",
        answer:
          "The three side midpoints, the three feet of the altitudes and the three Euler points, which are the midpoints from each vertex to the orthocentre. Its radius is half the circumradius, and its centre is the midpoint of the circumcentre and the orthocentre.",
      },
      {
        question:
          "Side a is 10 units opposite 30°, and side b is opposite 45°. Find b.",
        answer:
          "By the sine rule, b/sin 45° = 10/sin 30°, so b = 10 × sin 45° ÷ sin 30° = 10 × 0.7071 ÷ 0.5 ≈ 14.14 units.",
      },
    ],
    tryThis:
      "Press Right, then drag vertices A, B and C while watching the angle sum and cosine-rule readouts. Click Animate beside each centre to watch its construction build one step at a time, then drag into an obtuse shape to see which centres move outside.",
  },
  {
    id: "triangle-transformations",
    plainEnglish:
      "A transformation changes where a shape sits or how large it is without losing track of which corner becomes which. Move the triangle and watch its coloured copy follow one clear rule.",
    objectives: [
      "translate, rotate, reflect and enlarge a triangle from a stated rule",
      "match each source vertex with its corresponding image vertex",
      "identify which transformations preserve lengths, angles and area",
      "calculate the length and area change from an enlargement scale factor",
    ],
    whyItMatters:
      "Design software moves parts around a drawing, game engines rotate and scale models, and engineers use reflected or enlarged views to communicate exact geometry.",
    keyIdea:
      "Every image point comes from the same rule applied to its matching source point. Rigid transformations keep the shape and size; enlargement keeps the shape but changes its scale.",
    workedExample: {
      prompt:
        "Triangle ABC is enlarged by scale factor 1.5 about O. Side AB is 8 units and the area is 12 square units. Find the new side and area.",
      steps: [
        "Multiply every length by 1.5 because the scale factor compares image lengths with source lengths.",
        "A′B′ = 8 × 1.5 = 12 units.",
        "Area uses two lengths, so it scales by 1.5 × 1.5 = 2.25.",
        "Image area = 12 × 2.25 = 27 square units.",
      ],
      answer:
        "The image side A′B′ is 12 units and its area is 27 square units. The angles stay equal throughout the enlargement.",
    },
    pitfalls: [
      "Using the scale factor once for area → multiply area by the square of the scale factor.",
      "Matching A with a nearest image corner → match names and the transformation rule, not screen position.",
      "Saying reflection changes side lengths → reflection reverses orientation but preserves every length and angle.",
      "Moving every vertex by a different translation → one translation uses the same horizontal and vertical shift for every point.",
    ],
    checks: [
      {
        question: "Which transformations preserve all side lengths and area?",
        answer:
          "Translation, rotation and reflection preserve every side length, angle and the area. They are rigid transformations, even though reflection reverses the vertex order.",
      },
      {
        question: "A shape is enlarged by scale factor 2. What happens to its area?",
        answer:
          "Its area becomes four times as large because area uses two dimensions. Each length doubles, so the area factor is 2 × 2 = 4.",
      },
      {
        question: "What is special about a point on a reflection mirror line?",
        answer:
          "It stays in the same place after reflection because its perpendicular distance from the mirror is zero. Every other point lands equally far away on the opposite side.",
      },
    ],
    tryThis:
      "Drag A, B and C, then choose Rotation and press Animate. Hide the image, predict where A′, B′ and C′ will appear, choose the invariant statement, then reveal the green triangle and compare the dashed correspondence lines.",
  },
  {
    id: "quadrilaterals",
    plainEnglish:
      "Four joined corners can make many familiar shapes. Their names come from simple facts about equal sides, square corners and sides that run in the same direction.",
    objectives: [
      "classify squares, rectangles, parallelograms, rhombuses, trapeziums and kites",
      "calculate a missing interior angle using the quadrilateral angle sum",
      "compare diagonal lengths, bisection and crossing angles",
      "calculate the area of a quadrilateral from its coordinates",
      "explain why a square belongs to both the rectangle and rhombus families",
    ],
    whyItMatters:
      "Floor plans, window frames, road signs and computer graphics all rely on recognising four-sided shapes from their measurable properties.",
    keyIdea:
      "A quadrilateral's most specific name is determined by its side, angle, parallel-line and diagonal properties.",
    workedExample: {
      prompt:
        "A four-sided shape has opposite sides of 8 and 5 units, both pairs of opposite sides are parallel, and three angles are 90°. Classify it, find the fourth angle and calculate its area.",
      steps: [
        "A + B + C + D = 360°, because every simple quadrilateral splits into two triangles.",
        "D = 360° − 90° − 90° − 90° = 90°, so all four angles are right angles.",
        "Both pairs of opposite sides are parallel, so the shape is a parallelogram.",
        "A parallelogram with four right angles is a rectangle.",
        "Area = length × width = 8 × 5 = 40 units².",
      ],
      answer:
        "The shape is a rectangle, its fourth angle is 90°, and its area is 40 units².",
    },
    pitfalls: [
      "Calling every shape with four equal sides a square → it is a rhombus unless all four angles are also 90°.",
      "Assuming equal diagonals prove a square → rectangles also have equal diagonals.",
      "Treating crossed sides as an ordinary quadrilateral → drag a corner back until the boundary is simple.",
      "Saying a square is not a rectangle → a square satisfies every rectangle property and adds equal sides.",
    ],
    checks: [
      {
        question: "Three angles of a quadrilateral are 80°, 95° and 110°. What is the fourth?",
        answer:
          "The four angles total 360°, so the missing angle is 360° − 80° − 95° − 110° = 75°.",
      },
      {
        question:
          "Which diagonal property distinguishes a rhombus from a general parallelogram?",
        answer:
          "A rhombus has diagonals that cross at 90°. Both shapes have diagonals that bisect each other, so bisection alone does not distinguish them.",
      },
      {
        question: "Why is every square also a rectangle?",
        answer:
          "A rectangle is a parallelogram with four right angles. A square has both pairs of opposite sides parallel and four right angles, so it meets that definition.",
      },
    ],
    tryThis:
      "Click Square, Rectangle, Rhombus and Kite in turn with Diagonals switched on. Compare Equal length, Bisect each other and Cross at 90°, then drag one corner and watch the Classification change.",
  },
  {
    id: "circle-glossary",
    plainEnglish:
      "This lesson is a picture dictionary for circle words. Tap a term and the diagram shows only that idea, so names stop getting mixed up.",
    objectives: [
      "name the centre, radius, diameter, circumference, chord and arc on a diagram",
      "distinguish a sector from an area segment and state segment = sector − triangle",
      "distinguish an area segment from angles in the same segment",
      "identify a central angle, an inscribed angle, a tangent and a secant",
      "state the three power-of-a-point product rules in words",
    ],
    whyItMatters:
      "Every circle theorem and calculation reuses these names. Mixing segment (area) with same segment (angles), or chord with arc, is the usual reason a proof or formula feels wrong.",
    keyIdea:
      "One diagram per word. If two English phrases sound alike, they get separate entries with different pictures.",
    workedExample: {
      prompt:
        "A circle has centre O. Chord AB cuts off a curved cap. Point C sits on the major arc. Name the sector, the area segment, and which angles would be equal by the same-segment rule for chord AB.",
      steps: [
        "Sector OAB is the pizza slice bounded by radii OA, OB and arc AB.",
        "The area segment is the cap between chord AB and arc AB — sector OAB minus triangle OAB.",
        "Angles in the same segment standing on arc AB (for example ∠ACB with another point on the same major arc) are equal; that rule is about angles, not the area of the cap.",
        "So the curved cap is the area segment; equal rim angles on the same side of AB are the same-segment theorem.",
      ],
      answer:
        "Sector OAB is the slice; the area segment is the cap beyond chord AB; same-segment angles are equal inscribed angles standing on arc AB.",
    },
    pitfalls: [
      "Calling the area cap a sector → the sector includes the triangular part to the centre; the segment is only the cap.",
      "Treating “same segment” as the area formula → same segment is an angle theorem on a shared arc.",
      "Using chord length when the question asks for arc length → the chord is straight; the arc follows the rim and is longer.",
      "Calling every line through the circle a tangent → a tangent touches once; a secant cuts twice.",
    ],
    checks: [
      {
        question: "What is the difference between a chord and an arc joining the same two points?",
        answer:
          "The chord is the straight segment between the points. The arc is the curved path along the circle between them. The arc is longer except in the limit of a zero angle.",
      },
      {
        question: "How do you get the area of a minor segment from a sector?",
        answer:
          "segment = sector − triangle. The triangle uses the two radii and the chord; its area is ½r²sinθ.",
      },
      {
        question: "What does “angles in the same segment” claim?",
        answer:
          "Inscribed angles that stand on the same arc (vertices on the same side of the chord) are equal.",
      },
      {
        question: "State the intersecting-chords product rule.",
        answer:
          "If chords AB and CD meet at X inside the circle, then AX · XB = CX · XD.",
      },
    ],
    tryThis:
      "Open Segment (area), then Angles in the same segment, and say aloud what is shaded in each diagram. Drag B on Central angle and Sector to watch the same θ control both pictures.",
  },
  {
    id: "circle-theorems",
    plainEnglish:
      "Points and straight lines placed around a circle create angle patterns that never change. Move the points to see the same promises hold.",
    objectives: [
      "calculate edge angles from the related centre angle or same-segment rule",
      "prove semicircle and cyclic-quad angle facts, including the exterior case",
      "apply the alternate-segment theorem with a tangent and chord",
      "explain tangent ⟂ radius, equal tangents, and the power-of-a-point rules a·b = c·d and t² = a·b",
      "use the chord-bisector property",
    ],
    whyItMatters:
      "These rules are used to set out circular roads, check wheel and bearing geometry, and solve angle constraints in mechanical and architectural drawings.",
    keyIdea:
      "The same arc controls every angle that looks at it, and every line through a fixed point cuts a circle into segments whose products match (power of a point).",
    workedExample: {
      prompt:
        "Points A and B lie on a circle with centre O. The angle ∠AOB is 124°, and point P lies on the remaining arc. Find ∠APB.",
      steps: [
        "∠AOB = 2 × ∠APB, because the angle at the centre is twice the angle at the edge standing on the same arc.",
        "∠APB = 124° ÷ 2, rearranging the relationship to find the edge angle.",
        "∠APB = 62°, and 2 × 62° = 124° checks the result.",
      ],
      answer: "The angle ∠APB is 62°.",
    },
    pitfalls: [
      "Halving an angle at the edge to get the centre angle → the centre angle is twice the edge angle.",
      "Using same-segment or alternate-segment rules on the wrong side of the chord → both need the point in the stated segment.",
      "Assuming any chord makes a right angle at the edge → the chord must be a diameter.",
      "Drawing the radius to any point on a tangent → the 90° angle occurs at the point where the tangent touches the circle.",
    ],
    checks: [
      {
        question: "What angle does a diameter make at any point on its semicircle?",
        answer:
          "It makes 90°. The diameter subtends 180° at the centre, and the angle at the edge is half of 180°.",
      },
      {
        question:
          "One angle of a cyclic quadrilateral is 113°. What is the opposite angle?",
        answer:
          "Opposite angles in a cyclic quadrilateral sum to 180°, so the opposite angle is 180° − 113° = 67°.",
      },
      {
        question:
          "Two tangents leave the same external point. One has length 7.4 units. How long is the other?",
        answer:
          "The other tangent is also 7.4 units because tangents drawn from the same external point have equal lengths.",
      },
      {
        question:
          "Two chords cross inside a circle at X with AX = 3, XB = 8 and CX = 4. Find XD. Separately, a tangent from external P has PA = 4 and PB = 9 on a secant; find PT.",
        answer:
          "Intersecting chords: AX · XB = CX · XD ⇒ 3 × 8 = 4 × XD ⇒ XD = 6. Tangent–secant: PT² = PA · PB = 4 × 9 = 36 ⇒ PT = 6.",
      },
    ],
    tryThis:
      "Open Secants & power → Intersecting chords and confirm a·b = c·d while you drag A–D. Then open Two secants: PA·PB = PC·PD and drag P so both products stay equal. Finish on Tangent–secant and watch PT² track PA · PB.",
  },
  {
    id: "circle-calculations",
    plainEnglish:
      "A circle can be measured around its edge, across its inside, or along part of its curve. The lesson turns those measurements into lengths, areas and crossing points.",
    objectives: [
      "calculate diameter, circumference and area from a radius",
      "convert a central angle between degrees and radians",
      "calculate arc length, chord length and centre-to-chord distance",
      "calculate sector and segment areas",
      "classify line-circle and circle-circle intersections",
    ],
    whyItMatters:
      "Road designers calculate curved lengths, machinists locate tangent points, and GPS or radar systems find positions from intersecting circles.",
    keyIdea:
      "A central angle selects the same fraction of every circular quantity, while straight chords and intersections come from right triangles.",
    workedExample: {
      prompt:
        "A circle has radius 5 units and central angle 120°. Calculate the arc length, chord length and sector area.",
      steps: [
        "θ = 120° × π ÷ 180° = 2π/3 rad, converting to radians for the arc formula.",
        "Arc length s = rθ = 5 × 2π/3 = 10π/3 ≈ 10.47 units.",
        "Chord c = 2r sin(θ/2) = 10 × sin 60° = 10 × √3/2 = 5√3 ≈ 8.66 units.",
        "Sector area = 120°/360° × π × 5² = ⅓ × 25π = 25π/3 ≈ 26.18 units².",
      ],
      answer:
        "The arc length is about 10.47 units, the chord is about 8.66 units, and the sector area is about 26.18 units².",
    },
    pitfalls: [
      "Using degrees directly in s = rθ → convert θ to radians first.",
      "Treating an arc and its chord as the same length → the arc follows the curve and is longer except when the angle shrinks to zero.",
      "Forgetting the two radii in a sector perimeter → add both radii to the arc length.",
      "Taking a square root of a negative intersection value → a negative value means the line or circles do not meet.",
    ],
    checks: [
      {
        question: "A circle has radius 4 units. What are its diameter and circumference?",
        answer:
          "The diameter is 2 × 4 = 8 units. The circumference is 2π × 4 = 8π ≈ 25.13 units.",
      },
      {
        question:
          "For x² + y² = 25, how many intersections does the horizontal line y = 3 have?",
        answer:
          "Substitution gives x² + 9 = 25, so x² = 16 and x = ±4. There are two intersections: (4, 3) and (−4, 3).",
      },
      {
        question:
          "A point is 13 units from a circle's centre and the radius is 5 units. What is the tangent length?",
        answer:
          "PT² = 13² − 5² = 169 − 25 = 144, so PT = √144 = 12 units. The radius and tangent form a right angle.",
      },
    ],
    tryThis:
      "Open 4 · Chords, set Radius r to 5 and Central angle θ to 120, then drag endpoint A or B around the circle and watch the chord length stay fixed while its position changes. Compare the curved arc in 3 · Arcs with the straight chord. Then open 6 · Line intersections and drag the line through values below, equal to and above the radius.",
  },
  {
    id: "volume",
    plainEnglish:
      "Volume tells you how much three-dimensional space a solid contains. This lesson builds many solids from layers, tapered slices, added pieces and removed holes.",
    objectives: [
      "calculate volumes of prisms, cylinders, pyramids and cones from base area and perpendicular height",
      "calculate volumes of spheres, hemispheres, caps, ellipsoids, tori and capsules",
      "calculate cone and pyramid frustums from their two parallel ends",
      "add and subtract component volumes for silos, pipes and displaced liquid",
      "explain how volume and surface-area-to-volume ratio change when every length is scaled",
    ],
    whyItMatters:
      "Volume determines tank capacity, packaging, concrete quantities, excavation, engine displacement, medical measurements, material mass and the cost of 3D-printed parts.",
    keyIdea:
      "Imagine the solid as thin cross-sectional slices: constant slices give base area times height, tapering slices introduce one third, and composite solids add or subtract familiar pieces.",
    workedExample: {
      prompt:
        "A conical frustum has height 6 cm, lower radius 5 cm and upper radius 3 cm. Calculate its volume.",
      steps: [
        "Use V = ⅓πh(R² + Rr + r²), because the solid has two parallel circular ends.",
        "Substitute h = 6, R = 5 and r = 3: V = ⅓π × 6 × (5² + 5 × 3 + 3²).",
        "Evaluate the bracket: 25 + 15 + 9 = 49.",
        "V = 2π × 49 = 98π cm³.",
        "98π ≈ 307.88, so the frustum contains about 307.88 cm³.",
      ],
      answer:
        "The exact volume is 98π cm³ and the approximate volume is 307.88 cm³.",
    },
    pitfalls: [
      "Using a slant height in V = Bh or V = ⅓Bh → use the perpendicular height between the base and top.",
      "Writing square units for volume → volume is measured in cubic units because three length directions are combined.",
      "Using diameter where a formula asks for radius → divide the diameter by two before squaring or cubing.",
      "Adding a hollow region to the outer solid → subtract the inner void from the enclosing volume.",
    ],
    checks: [
      {
        question: "A triangular prism has triangle base 8 cm, triangle height 3 cm and prism length 10 cm. What is its volume?",
        answer:
          "The triangular base area is ½ × 8 × 3 = 12 cm². Multiply by prism length: V = 12 × 10 = 120 cm³.",
      },
      {
        question: "A sphere has radius 3 cm. What is its volume?",
        answer:
          "V = ⁴⁄₃πr³ = ⁴⁄₃π × 3³ = 36π cm³, which is approximately 113.10 cm³.",
      },
      {
        question: "Why does doubling every length multiply volume by eight?",
        answer:
          "Each of the three independent length directions doubles, so the volume scale factor is 2 × 2 × 2 = 2³ = 8.",
      },
      {
        question: "A pipe has outer radius 4 cm, inner radius 3 cm and length 20 cm. What material volume does it contain?",
        answer:
          "Subtract the bore from the outer cylinder: V = π × 20 × (4² − 3²) = 20π × 7 = 140π cm³, about 439.82 cm³.",
      },
    ],
    tryThis:
      "Open 2 · Prisms and drag the cylinder's yellow radius and green height handles while the moving slice sweeps through it. Then compare 3 · Pyramids & cones and 7 · Comparisons & scaling.",
  },
  {
    id: "conic-sections",
    plainEnglish:
      "Cutting a cone in different ways produces four families of curves. One number controls whether the curve is round, stretched, open or split in two.",
    objectives: [
      "classify a circle, ellipse, parabola or hyperbola from eccentricity",
      "calculate eccentricity from distances to a focus and directrix",
      "sketch how the conic changes as eccentricity increases",
      "explain why planets, projectiles and escaping comets follow different conics",
    ],
    whyItMatters:
      "Planetary orbits are ellipses, satellite dishes use parabolas to focus signals, and some comet escape paths are hyperbolas.",
    keyIdea:
      "Every point on a conic keeps one fixed ratio between its distance to a focus and its distance to a line.",
    workedExample: {
      prompt:
        "A point on a conic is 6 units from the focus and 4 units from the directrix. Calculate the eccentricity and classify the conic.",
      steps: [
        "Distance to focus = e × distance to directrix, using the focus-directrix rule.",
        "6 = e × 4, substituting the two measured distances.",
        "e = 6 ÷ 4 = 1.5, dividing both sides by 4.",
        "Since e > 1, the conic is a hyperbola.",
      ],
      answer: "The eccentricity is 1.5, so the conic is a hyperbola.",
    },
    pitfalls: [
      "Using directrix distance ÷ focus distance → eccentricity is focus distance ÷ directrix distance.",
      "Calling e = 1 an ellipse → e = 1 gives a parabola.",
      "Assuming every conic is a closed loop → parabolas are open and hyperbolas have two branches.",
      "Expecting the directrix to stay visible for e = 0 → the circle is the limiting case with its directrix infinitely far away.",
    ],
    checks: [
      {
        question: "What type of conic has eccentricity 0.6?",
        answer:
          "It is an ellipse because its eccentricity is greater than 0 but less than 1.",
      },
      {
        question: "What type of conic has eccentricity exactly 1?",
        answer:
          "It is a parabola because equality of the focus and directrix distances means e = 1.",
      },
      {
        question:
          "For e = 0.8, a point is 5 units from the directrix. How far is it from the focus?",
        answer:
          "The focus distance is e × directrix distance = 0.8 × 5 = 4 units.",
      },
    ],
    tryThis:
      "Turn on Show directrix and Show focus, then move Eccentricity e slowly from 0.5 through 1 to 1.5. Watch the Conic type change from ellipse to parabola to hyperbola.",
  },
  {
    id: "radians",
    plainEnglish:
      "An angle can be measured by asking how many copies of the circle's own reach fit along the swept edge. This makes turns and curved distances fit together naturally.",
    objectives: [
      "explain why one radian sweeps an arc equal to the radius",
      "convert angles between degrees and radians",
      "calculate arc length from radius and angle",
      "identify common fractions of a full turn in both units",
    ],
    whyItMatters:
      "Radians are used for wheel speed, rotating machinery, waves and calculus because they connect turning directly to distance travelled.",
    keyIdea:
      "The angle in radians is the number of radius-lengths that fit along its arc.",
    workedExample: {
      prompt:
        "Convert 150° to radians, then find the arc length on a circle of radius 4 units.",
      steps: [
        "θ = 150° × π ÷ 180°, using the degree-to-radian conversion.",
        "θ = 5π/6 rad ≈ 2.618 rad, simplifying the fraction.",
        "s = rθ, because radian measure links radius directly to arc length.",
        "s = 4 × 5π/6 = 10π/3 ≈ 10.47 units.",
      ],
      answer:
        "The angle is 5π/6 radians, and the arc length is about 10.47 units.",
    },
    pitfalls: [
      "Multiplying degrees by 180/π → degrees convert to radians by multiplying by π/180.",
      "Using degrees in s = rθ → θ must be in radians.",
      "Writing a full turn as π radians → a full turn is 2π radians; π radians is half a turn.",
      "Treating radians as a length → a radian measures an angle, while rθ gives the corresponding arc length.",
    ],
    checks: [
      {
        question: "Convert 180° to radians.",
        answer:
          "180° × π/180° = π rad, so a half turn is π radians.",
      },
      {
        question:
          "A circle has radius 7 units. What arc length is swept by an angle of 1 radian?",
        answer:
          "s = rθ = 7 × 1 = 7 units. This is the defining picture of one radian: the arc equals the radius.",
      },
      {
        question:
          "Find the arc length for a 90° angle in a circle of radius 6 units.",
        answer:
          "First 90° = π/2 rad. Then s = 6 × π/2 = 3π ≈ 9.42 units.",
      },
    ],
    tryThis:
      "Use Jump to and choose Exactly 1 radian (≈57.3°), then compare the green arc with the radius. Turn on Radius markers and choose Full turn (360° = 2π) to count just over six radius-lengths.",
  },
  {
    id: "trig-functions",
    plainEnglish:
      "A turning line makes a horizontal length and a vertical length. Comparing those lengths gives reliable numbers that describe the direction, whatever size the picture is.",
    objectives: [
      "calculate sine, cosine and tangent from a right triangle",
      "calculate secant, cosecant and cotangent as reciprocal ratios",
      "determine the signs of all six functions around a full turn",
      "prove the identity sin²φ + cos²φ = 1",
      "explain why changing the radius does not change the trigonometric ratios",
    ],
    whyItMatters:
      "Surveyors find heights from angles, game engines turn directions into screen movement, and engineers resolve forces into horizontal and vertical parts.",
    keyIdea:
      "Sine and cosine are the vertical and horizontal shares of one radius, while the other four functions compare or invert the same lengths.",
    workedExample: {
      prompt:
        "A right triangle has opposite side 6, adjacent side 8 and hypotenuse 10. Calculate sin φ, cos φ and tan φ, then verify sin²φ + cos²φ = 1.",
      steps: [
        "sin φ = opposite ÷ hypotenuse = 6 ÷ 10 = 0.6.",
        "cos φ = adjacent ÷ hypotenuse = 8 ÷ 10 = 0.8.",
        "tan φ = opposite ÷ adjacent = 6 ÷ 8 = 0.75.",
        "sin²φ + cos²φ = 0.6² + 0.8² = 0.36 + 0.64 = 1.",
        "The identity holds because 6² + 8² = 10² is Pythagoras divided by 10².",
      ],
      answer:
        "sin φ = 0.6, cos φ = 0.8, tan φ = 0.75, and the squared sine and cosine add to 1.",
    },
    pitfalls: [
      "Labelling opposite and adjacent without choosing an angle → those names are relative to the selected angle.",
      "Calculating tan as hypotenuse ÷ adjacent → tan is opposite ÷ adjacent.",
      "Assuming a larger radius changes sine or cosine → all sides scale together, so their ratios stay fixed.",
      "Ignoring directed signs outside the first quadrant → use the signs of the horizontal and vertical lengths.",
    ],
    checks: [
      {
        question:
          "For a 30° angle on a unit circle, what are sin 30° and cos 30°?",
        answer:
          "sin 30° = 1/2 = 0.5 and cos 30° = √3/2 ≈ 0.866. They are the vertical and horizontal shares of a radius of 1.",
      },
      {
        question:
          "If a triangle's radius and both legs are doubled, what happens to its sine and cosine?",
        answer:
          "They do not change. Each ratio has both numerator and denominator doubled, so the common factor cancels.",
      },
      {
        question:
          "In the second quadrant, what signs do sine, cosine and tangent have?",
        answer:
          "The vertical length is positive and the horizontal length is negative, so sine is positive, cosine is negative, and tangent is negative because positive ÷ negative is negative.",
      },
    ],
    tryThis:
      "Click sin, cos and tan in order, then use Quick angles to compare 30°, 45°, 60° and 120°. Change Radius R and watch the side lengths scale while the Live values stay unchanged; then click Why sin²φ + cos²φ = 1.",
  },
  {
    id: "waveforms",
    plainEnglish:
      "A repeating rise and fall can be described by its height, spacing and starting position. Adding several simple rises and falls can make a complicated signal.",
    objectives: [
      "sketch how amplitude, frequency and phase change a sine wave",
      "calculate the value of a sinusoidal component at a chosen position",
      "add component heights to construct a superposed wave",
      "explain why waves reinforce at some points and cancel at others",
      "construct a custom travelling wave from position and time",
    ],
    whyItMatters:
      "Music, radio, ocean motion, alternating electricity and medical scans all combine repeating signals whose components can reinforce or cancel.",
    keyIdea:
      "At every position, the combined wave is found by adding the signed heights of all enabled component waves.",
    workedExample: {
      prompt:
        "Two waves are y₁ = 1.5 sin x and y₂ = 0.6 sin 2x. Find their combined height at x = π/6.",
      steps: [
        "sin(π/6) = 0.5, using the special-angle value.",
        "y₁ = 1.5 × 0.5 = 0.75.",
        "2x = 2 × π/6 = π/3 and sin(π/3) = √3/2 ≈ 0.8660.",
        "y₂ = 0.6 × 0.8660 ≈ 0.5196.",
        "y = y₁ + y₂ = 0.75 + 0.5196 = 1.2696 ≈ 1.27.",
      ],
      answer: "The combined wave height is approximately 1.27.",
    },
    pitfalls: [
      "Adding only the amplitudes → add the signed wave heights at the chosen position.",
      "Changing frequency and expecting taller peaks → frequency changes spacing; amplitude changes height.",
      "Treating phase as a vertical shift → phase moves the wave sideways through its cycle.",
      "Assuming two enabled waves always reinforce → opposite signed heights partially or completely cancel.",
    ],
    checks: [
      {
        question: "What does changing amplitude from 1 to 2 do to a sine wave?",
        answer:
          "Every height doubles, so peaks rise from 1 to 2 and troughs fall from −1 to −2. The horizontal spacing is unchanged.",
      },
      {
        question:
          "At one position, two enabled waves have heights 1.2 and −0.7. What is the combined height?",
        answer:
          "The combined height is 1.2 + (−0.7) = 0.5. They partially cancel because their signs are opposite.",
      },
      {
        question:
          "What changes when frequency increases while amplitude and phase stay fixed?",
        answer:
          "More cycles fit into the same horizontal distance, so the wave becomes more tightly packed while its peak height stays the same.",
      },
    ],
    tryThis:
      "Turn off Animate (travel), leave Show components on, and toggle Wave 2 Enabled while watching the green sum. Change Wave 2 Amplitude, Frequency and Phase separately, then enable Wave 3 to see three signed heights combine.",
  },
];
