import type { LessonGuide } from "../types";

/**
 * Teaching guides for the applied mathematics, physics, and maths-as-code lessons.
 */
export const APPLIED_GUIDES: readonly LessonGuide[] = [
  {
    id: "kinematics",
    plainEnglish:
      "A journey can be described by where something is, how fast it is moving, and how its speed is changing. Three pictures show how those descriptions change together.",
    objectives: [
      "calculate position and velocity after a chosen time when acceleration is constant",
      "draw matching position, velocity, and acceleration graphs",
      "predict how negative acceleration changes the shape and slope of the graphs",
      "explain why the slope of one motion graph gives the next motion quantity",
    ],
    whyItMatters:
      "Vehicle braking, lift control, sports tracking, and robot motion planning all depend on predicting where a moving object will be and how fast it will arrive.",
    keyIdea:
      "Read the three graphs as a ladder: the slope of position is velocity, and the slope of velocity is acceleration.",
    workedExample: {
      prompt:
        "A trolley starts at position 3 m with velocity 4 m/s and constant acceleration −2 m/s². Find its position and velocity after 3 s.",
      steps: [
        "v = v₀ + at = 4 m/s + (−2 m/s² × 3 s), because constant acceleration changes velocity evenly with time.",
        "v = 4 m/s − 6 m/s = −2 m/s, so the trolley is moving back towards lower positions.",
        "x = x₀ + v₀t + ½at² = 3 m + (4 m/s × 3 s) + ½(−2 m/s²)(3 s)², using the constant-acceleration position rule.",
        "x = 3 m + 12 m − 9 m = 6 m.",
      ],
      answer: "After 3 s, the trolley is at 6 m and has velocity −2 m/s.",
    },
    pitfalls: [
      "Treating velocity and speed as identical → velocity includes direction, so a negative value means motion in the opposite direction",
      "Using x = x₀ + vt when velocity is changing → include the ½at² term for constant acceleration",
      "Reading graph height as slope → height gives the quantity plotted; slope gives its rate of change",
    ],
    checks: [
      {
        question: "What does a horizontal velocity graph mean?",
        answer:
          "Its slope is zero, so acceleration is zero and the velocity stays constant.",
      },
      {
        question:
          "An object starts at 1 m with velocity 2 m/s and zero acceleration. Where is it after 4 s?",
        answer:
          "x = x₀ + v₀t = 1 m + 2 m/s × 4 s = 9 m; there is no acceleration term because a = 0.",
      },
      {
        question:
          "If acceleration is −3 m/s², by how much does velocity change in 2 s?",
        answer:
          "Δv = at = −3 m/s² × 2 s = −6 m/s, so the velocity decreases by 6 m/s.",
      },
    ],
    tryThis:
      "Set Initial velocity v₀ to 4, Acceleration a to −2, and drag Time t from 0 to 4. Toggle Velocity graph and Acceleration graph off and on, then press Play time to connect the shared cursor across all three plots.",
  },
  {
    id: "newtons-laws",
    plainEnglish:
      "Things keep doing what they are already doing unless an unbalanced push or pull changes them. Heavier things need a bigger unbalanced push to change their movement by the same amount.",
    objectives: [
      "draw a force diagram for the cart and name which object supplies each force",
      "resolve an angled applied force into horizontal and vertical parts",
      "calculate normal force, friction, net force, and acceleration",
      "predict how changing force or mass changes acceleration",
      "explain why equal and opposite interaction forces do not cancel on one object",
    ],
    whyItMatters:
      "Braking systems, seat-belt loads, vehicle traction, crane motion, and almost every mechanical design begin by adding the forces on each object correctly.",
    keyIdea:
      "Choose one object, add only the forces acting on that object, and let the resulting net force tell you how its velocity changes.",
    workedExample: {
      prompt:
        "A 5 kg crate is pulled along a level floor by 30 N at 30° above horizontal. The coefficient of friction is 0.20. Find its horizontal acceleration using g = 9.81 m/s².",
      steps: [
        "Fₓ = 30 N × cos 30° = 25.98 N and Fᵧ = 30 N × sin 30° = 15.00 N, because the angled pull must be resolved.",
        "W = mg = 5 kg × 9.81 m/s² = 49.05 N downward.",
        "N = W − Fᵧ = 49.05 N − 15.00 N = 34.05 N, because the upward part of the pull reduces the floor's push.",
        "f = μN = 0.20 × 34.05 N = 6.81 N opposite the motion.",
        "ΣFₓ = 25.98 N − 6.81 N = 19.17 N, so a = ΣFₓ ÷ m = 19.17 N ÷ 5 kg = 3.83 m/s².",
      ],
      answer: "The crate accelerates horizontally at 3.83 m/s².",
    },
    pitfalls: [
      "Adding a third-law reaction to the cart's forces → the reaction acts on the other object, not on the cart",
      "Assuming normal force always equals weight → an angled pull or push changes the normal force",
      "Using the applied force instead of the net force in F = ma → add friction and every other force first",
      "Using sine for the horizontal part when θ is measured from horizontal → Fₓ = F cos θ and Fᵧ = F sin θ",
    ],
    checks: [
      {
        question: "A cart moves right with zero net force. What happens next?",
        answer:
          "Its acceleration is zero, so it continues with constant rightward velocity rather than stopping by itself.",
      },
      {
        question: "What acceleration does a net force of 18 N give a 6 kg mass?",
        answer:
          "a = Fnet ÷ m = 18 N ÷ 6 kg = 3 m/s².",
      },
      {
        question:
          "Why can an upward-angled pull reduce friction on a level floor?",
        answer:
          "Its upward component reduces the normal force N; since the friction limit is μN, the available friction also decreases.",
      },
    ],
    tryThis:
      "Choose the chapter Net force and friction, set Force F to 8 N, Angle θ to 30°, and Friction μ to 0.20. Change Mass, press Reset cart, and use Run while watching the horizontal and vertical component arrows and the live force sum.",
  },
  {
    id: "projectile-motion",
    plainEnglish:
      "A thrown object moves sideways while falling at the same time. Treating those two motions separately makes the curved path predictable.",
    objectives: [
      "resolve launch speed into horizontal and vertical velocity components",
      "calculate flight time, maximum height, and horizontal range",
      "predict the velocity direction at launch, at the highest point, and during descent",
      "explain why mass does not change the ideal path",
      "compare trajectories under different gravitational fields",
    ],
    whyItMatters:
      "Ballistics, sports analysis, water-jet design, game physics, and spacecraft manoeuvres all require accurate predictions of flight paths.",
    keyIdea:
      "One shared clock runs two independent stories: steady sideways motion and downward-accelerated vertical motion.",
    workedExample: {
      prompt:
        "A ball is launched from level ground at 20 m/s and 30° above horizontal. Ignoring air resistance, find its flight time, range, and maximum height using g = 9.81 m/s².",
      steps: [
        "vₓ = 20 m/s × cos 30° = 17.32 m/s and vᵧ = 20 m/s × sin 30° = 10.00 m/s, resolving the launch velocity.",
        "tup = vᵧ ÷ g = 10.00 m/s ÷ 9.81 m/s² = 1.019 s, because vertical velocity is zero at the apex.",
        "tflight = 2tup = 2.039 s, because launch and landing are at the same height.",
        "Range = vₓtflight = 17.32 m/s × 2.039 s = 35.31 m.",
        "Maximum height = vᵧ² ÷ (2g) = (10.00 m/s)² ÷ (2 × 9.81 m/s²) = 5.10 m.",
      ],
      answer:
        "The ball is airborne for 2.039 s, travels 35.31 m horizontally, and rises 5.10 m.",
    },
    pitfalls: [
      "Setting the whole velocity to zero at the apex → only vertical velocity is zero; horizontal velocity remains",
      "Applying gravity to horizontal velocity → without air resistance, gravity changes only the vertical component",
      "Using the 45° maximum-range rule for every launch → it requires equal launch and landing heights and no air resistance",
      "Changing mass to change the ideal path → mass cancels from the gravitational acceleration",
    ],
    checks: [
      {
        question: "What is the horizontal acceleration after release in this model?",
        answer:
          "It is 0 m/s² because no horizontal force acts after release, so horizontal velocity stays constant.",
      },
      {
        question:
          "At the highest point, why is the projectile still moving?",
        answer:
          "Gravity has reduced vᵧ to zero only momentarily, while vₓ is still non-zero and carries the projectile sideways.",
      },
      {
        question:
          "At equal speed on level ground, why do 30° and 60° give the same range?",
        answer:
          "Range depends on sin 2θ; sin 60° and sin 120° are equal, so the two complementary launch angles have equal range.",
      },
    ],
    tryThis:
      "Set Speed to 15 m/s, Angle to 45°, Height to 0, and World to Earth. Turn on Launch components, Velocity vector, Gravity arrow, and Ghost positions, then drag Time from launch to landing and compare Earth with Moon.",
  },
  {
    id: "momentum-impulse",
    plainEnglish:
      "A moving heavy thing is harder to stop than a light or slow one. The same change can come from a hard short push or a gentler longer push.",
    objectives: [
      "calculate momentum from mass and velocity",
      "compute impulse from force and duration",
      "predict final momentum and velocity after a force pulse",
      "interpret signed area on a force-time graph",
      "explain why increasing stopping time reduces average force",
    ],
    whyItMatters:
      "Airbags, helmets, crash barriers, sports follow-through, and rocket thrust are designed by controlling how force accumulates over time.",
    keyIdea:
      "Impulse is the signed area under a force-time graph, and that area is exactly the change in momentum.",
    workedExample: {
      prompt:
        "A 1200 kg car travelling at 15 m/s is brought to rest in 0.75 s. Find the impulse and average net force.",
      steps: [
        "pinitial = mv = 1200 kg × 15 m/s = 18,000 kg·m/s.",
        "pfinal = 1200 kg × 0 m/s = 0 kg·m/s.",
        "J = Δp = pfinal − pinitial = 0 − 18,000 = −18,000 N·s, because impulse equals momentum change.",
        "F̄ = J ÷ Δt = −18,000 N·s ÷ 0.75 s = −24,000 N.",
      ],
      answer:
        "The stopping impulse is −18,000 N·s and the average net force is −24,000 N, opposite the original motion.",
    },
    pitfalls: [
      "Using speed without a direction sign → momentum and impulse are vectors, so direction determines the sign",
      "Reading force-time height as impulse → impulse is the area, force × time for a rectangular pulse",
      "Writing momentum in newtons → momentum uses kg·m/s, while force uses N",
      "Assuming the largest force always gives the largest impulse → duration matters equally through J = FΔt",
    ],
    checks: [
      {
        question: "What is the momentum of a 4 kg cart moving at 3 m/s?",
        answer:
          "p = mv = 4 kg × 3 m/s = 12 kg·m/s in the cart's direction.",
      },
      {
        question: "What impulse does 6 N acting for 2 s deliver?",
        answer:
          "J = FΔt = 6 N × 2 s = 12 N·s, so momentum changes by 12 kg·m/s.",
      },
      {
        question:
          "For the same stopping impulse, what happens if stopping time triples?",
        answer:
          "F̄ = Δp ÷ Δt, so tripling the time reduces the average force to one third.",
      },
    ],
    tryThis:
      "Open Stopping safely, then compare Force F = −16 N for Duration Δt = 1 s with Force F = −8 N for Duration Δt = 2 s. Drag Time through each pulse or press Play and compare the shaded force-time areas.",
  },
  {
    id: "collisions",
    plainEnglish:
      "When things hit, their movement is shared between them rather than disappearing. Some impacts bounce well, while others produce more heat, sound, and damage.",
    objectives: [
      "calculate total momentum before and after a one-dimensional collision",
      "predict the shared speed after a perfectly inelastic collision",
      "compute kinetic energy lost during an inelastic impact",
      "compare elastic, partly elastic, and sticking collisions",
    ],
    whyItMatters:
      "Crash reconstruction, vehicle safety, sports equipment, packaging, and spacecraft docking all depend on predicting collision outcomes.",
    keyIdea:
      "An isolated collision preserves total momentum, while elasticity decides how much kinetic energy remains as motion.",
    workedExample: {
      prompt:
        "A 1200 kg car moving at 20 m/s hits a stationary 800 kg car and they lock together. Find their common speed and the kinetic energy lost.",
      steps: [
        "pbefore = (1200 kg × 20 m/s) + (800 kg × 0 m/s) = 24,000 kg·m/s.",
        "The cars stick, so pafter = (1200 kg + 800 kg)vf = 2000 kg × vf.",
        "vf = 24,000 kg·m/s ÷ 2000 kg = 12.0 m/s, from momentum conservation.",
        "KEbefore = ½ × 1200 kg × (20 m/s)² = 240,000 J.",
        "KEafter = ½ × 2000 kg × (12 m/s)² = 144,000 J, so 96,000 J is transferred from kinetic energy.",
      ],
      answer:
        "The joined cars move at 12.0 m/s, and 96,000 J of kinetic energy is lost from their motion.",
    },
    pitfalls: [
      "Conserving each object's momentum separately → only the total momentum of the isolated system is conserved",
      "Assuming kinetic energy is always conserved → it is conserved only for a perfectly elastic collision",
      "Dropping velocity signs → leftward and rightward momenta must carry opposite signs",
      "Setting elasticity to zero but giving the blocks different final speeds → a perfectly inelastic collision means they stick and share one speed",
    ],
    checks: [
      {
        question: "What does Elasticity e = 0 mean?",
        answer:
          "The collision is perfectly inelastic, so the blocks stick together and leave with the same velocity.",
      },
      {
        question:
          "Two equal masses collide elastically; one approaches at 4 m/s and the other is stationary. What happens?",
        answer:
          "They exchange velocities: the first stops and the second leaves at 4 m/s, preserving both momentum and kinetic energy.",
      },
      {
        question:
          "Can total momentum stay constant while kinetic energy decreases?",
        answer:
          "Yes. In an inelastic collision, momentum is conserved but some kinetic energy becomes heat, sound, or deformation.",
      },
    ],
    tryThis:
      "Set Mass m₁ and Mass m₂ to 2, Velocity v₁ to 3, Velocity v₂ to 0, and Elasticity e to 1. Press Play, then repeat with Elasticity e at 0 and compare the momentum and kinetic-energy readouts.",
  },
  {
    id: "moments",
    plainEnglish:
      "A push turns something more strongly when it is bigger or farther from the turning point. Balance happens when the turning effects in opposite directions cancel.",
    objectives: [
      "calculate a moment from force and perpendicular distance",
      "assign clockwise and anticlockwise signs consistently",
      "solve for a mass or distance that balances a beam",
      "predict how moving the pivot changes the beam's rotation",
    ],
    whyItMatters:
      "Crane outriggers, spanners, seesaws, door handles, shelf brackets, and bridge supports are designed by balancing turning effects.",
    keyIdea:
      "Imagine each force trying to turn the beam about the pivot: force multiplied by its shortest distance from the pivot measures that attempt.",
    workedExample: {
      prompt:
        "A 20 kg load hangs 1.5 m left of a pivot. Where must a 12 kg load hang on the right to balance it? Use g = 9.81 m/s².",
      steps: [
        "W₁ = 20 kg × 9.81 m/s² = 196.2 N.",
        "τ₁ = W₁d₁ = 196.2 N × 1.5 m = 294.3 N·m anticlockwise.",
        "For balance, the clockwise moment must also be 294.3 N·m.",
        "d₂ = τ₂ ÷ W₂ = 294.3 N·m ÷ (12 kg × 9.81 m/s²) = 2.50 m.",
      ],
      answer: "The 12 kg load must hang 2.50 m to the right of the pivot.",
    },
    pitfalls: [
      "Using distance from the end of the beam → measure perpendicular distance from the pivot to the force's line of action",
      "Adding clockwise and anticlockwise moments as both positive → choose opposite signs so balance gives Στ = 0",
      "Comparing masses alone → both weight and distance determine the turning effect",
    ],
    checks: [
      {
        question: "What is the moment of a 10 N force acting 0.4 m from a pivot?",
        answer:
          "τ = Fd = 10 N × 0.4 m = 4 N·m, with direction set by whether it turns clockwise or anticlockwise.",
      },
      {
        question:
          "What must be true of the total moment when the beam is balanced?",
        answer:
          "Clockwise and anticlockwise moments cancel, so the signed total is Στ = 0 N·m.",
      },
      {
        question:
          "If a balancing force is halved, how must its distance change?",
        answer:
          "Because τ = Fd must stay constant, halving the force requires doubling its perpendicular distance.",
      },
    ],
    tryThis:
      "Set Mass m₁ to 2 at Position x₁ = −2 and Mass m₂ to 1 at Position x₂ = 4. Drag either weight in the viewport, then move Pivot position and watch the signed moments and beam tilt update.",
  },
  {
    id: "universal-gravitation",
    plainEnglish:
      "Everything pulls on everything else, even across empty space. Bigger things pull more strongly, while moving farther apart weakens the pull very quickly.",
    objectives: [
      "calculate gravitational force between two masses",
      "predict how doubling mass or distance changes gravitational force",
      "compute gravitational acceleration at a chosen distance from a planet",
      "explain why an orbit is continuous falling around a world",
      "compare surface gravity with gravity at the Moon's distance",
    ],
    whyItMatters:
      "Satellite orbits, planetary missions, tides, astronomy, and GPS all rely on the same inverse-square gravitational rule.",
    keyIdea:
      "Gravity spreads out with distance: twice as far means the same pull is diluted to one quarter.",
    workedExample: {
      prompt:
        "Find the gravitational force on a 1000 kg satellite whose centre-to-centre distance from Earth is twice Earth's radius. Use G = 6.6743 × 10⁻¹¹ N·m²/kg², Earth mass 5.972 × 10²⁴ kg, and Earth radius 6.371 × 10⁶ m.",
      steps: [
        "r = 2 × 6.371 × 10⁶ m = 1.2742 × 10⁷ m.",
        "F = Gm₁m₂ ÷ r², because gravitational force grows with both masses and falls with distance squared.",
        "F = (6.6743 × 10⁻¹¹ × 5.972 × 10²⁴ × 1000) ÷ (1.2742 × 10⁷)² N.",
        "F = 2455 N, directed towards Earth's centre.",
        "a = F ÷ m = 2455 N ÷ 1000 kg = 2.455 m/s², about one quarter of surface gravity.",
      ],
      answer:
        "Earth pulls the satellite with about 2455 N, giving it an acceleration of 2.455 m/s² towards Earth.",
    },
    pitfalls: [
      "Measuring altitude instead of centre-to-centre distance → r in the formula runs between the masses' centres",
      "Doubling distance and halving force → the inverse-square rule makes force one quarter",
      "Thinking the larger mass feels a larger force → the two bodies exert equal-magnitude opposite forces, but accelerate differently",
      "Treating orbit as no gravity → orbit is gravity continually bending sideways motion into a curved path",
    ],
    checks: [
      {
        question: "What happens to gravitational force if one mass doubles?",
        answer:
          "F is directly proportional to each mass, so doubling one mass doubles the force.",
      },
      {
        question: "What happens to force if distance triples?",
        answer:
          "The denominator becomes 3² = 9 times larger, so force becomes one ninth as large.",
      },
      {
        question:
          "Why does the Moon not fly away in a straight line?",
        answer:
          "Its sideways velocity would carry it straight, but Earth's gravity continually accelerates it inward and bends the path into an orbit.",
      },
    ],
    tryThis:
      "Choose the Try the knobs Step, set Distance to 4 Earth radii, note the force, then set it to 8. Turn on Show distance² readout and Show orbit idea, and finally double Big mass to confirm the force doubles.",
  },
  {
    id: "load-paths",
    plainEnglish:
      "A hanging weight is carried through ropes and posts until the ground holds it up. The flatter the ropes are, the harder they must pull.",
    objectives: [
      "resolve each cable tension into horizontal and vertical components",
      "calculate cable tensions that keep a knot in equilibrium",
      "predict how cable sag and load position change the tensions",
      "trace vertical load and sideways thrust through columns into the ground",
    ],
    whyItMatters:
      "Roof hangers, suspension bridges, cranes, tents, clotheslines, and guyed masts fail or succeed according to their load paths and anchor forces.",
    keyIdea:
      "Follow every force from the load to the ground, checking that horizontal parts cancel and vertical parts add back to the weight.",
    workedExample: {
      prompt:
        "A 200 N load hangs centrally from two identical cables. Each anchor is 3.4 m horizontally from the knot and 2.2 m above it. Find each cable's angle, tension, vertical support, and horizontal thrust.",
      steps: [
        "θ = atan(2.2 m ÷ 3.4 m) = 32.91°, using the cable's rise and horizontal run.",
        "The two vertical components share the load, so each supplies 200 N ÷ 2 = 100 N upward.",
        "T sin θ = 100 N, so T = 100 N ÷ sin 32.91° = 184.08 N.",
        "Horizontal thrust = T cos θ = 184.08 N × cos 32.91° = 154.55 N on each side.",
        "The horizontal components cancel at the knot, while 100 N + 100 N = 200 N balances the weight.",
      ],
      answer:
        "Each cable is at 32.91°, carries 184.08 N, supplies 100 N vertically, and creates 154.55 N of horizontal thrust.",
    },
    pitfalls: [
      "Assuming each cable tension is half the weight → only each vertical component is half the weight",
      "Ignoring horizontal components because the load does not move sideways → they cancel at the knot but still load the anchors and foundations",
      "Expecting flatter cables to reduce tension → a smaller angle gives less vertical support per newton, so tension rises sharply",
      "Stopping the force trace at the cable → continue through the columns and ground reactions",
    ],
    checks: [
      {
        question:
          "For a centred load, what must the two vertical cable components add to?",
        answer:
          "They must add to the full weight W because vertical equilibrium requires ΣFy = 0.",
      },
      {
        question:
          "Why are the two cable tensions equal when the load is centred?",
        answer:
          "The geometry is symmetric, so equal angles require equal tensions for the horizontal parts to cancel.",
      },
      {
        question:
          "What happens to cable tension as Cable sag approaches zero?",
        answer:
          "The cables become nearly horizontal, sin θ approaches zero, and T = W ÷ (2 sin θ) grows extremely large.",
      },
    ],
    tryThis:
      "Set Weight W to 200 N, Weight position to 0, Cable sag to 2.2, and turn on Show H/V components. Slide Weight position towards one column, then reduce Cable sag and watch cable tension rise while the two vertical ground reactions still sum to W.",
  },
  {
    id: "miter-saw-cuts",
    plainEnglish:
      "A saw blade can turn across a board and tilt through it. Those two movements decide both the outline of the cut on the wood and the shape of the new end.",
    objectives: [
      "distinguish a saw miter setting from the angle drawn across the board",
      "calculate a top-face cut length and end offset from stock width and miter setting",
      "predict when a cut face stays rectangular or becomes a parallelogram",
      "set a saw for square, four-sided, and six-sided flat-frame joints",
    ],
    whyItMatters:
      "Picture frames, trim, boxes, furniture, and compound moulding cuts all depend on turning a desired joint shape into the correct saw setting before material is removed.",
    keyIdea:
      "Think of the blade as a flat plane through a rectangular board: rotating it changes the plan view, while tilting it changes the face left by the cut.",
    workedExample: {
      prompt:
        "A 140 mm wide, 18 mm thick board needs a square frame corner. Find the saw setting, the cut-line angle on the board, and the length of the cut across the top face.",
      steps: [
        "A square frame has a 90 degree inside corner, so its two matching cuts share the turn equally.",
        "Set the saw miter to 45 degrees from square, because two matching 45 degree cuts form 180 minus 2 times 45 degrees.",
        "The cut line makes 90 minus 45 = 45 degrees with the board's long edge.",
        "Top-face cut length = 140 mm divided by cos 45 degrees = 197.99 mm.",
        "With bevel at zero, the cut face remains rectangular and its thickness edge stays 18 mm.",
      ],
      answer:
        "Use a 45 degree miter and zero bevel; the line is 45 degrees to the long edge and the top-face cut is about 198.0 mm long.",
    },
    pitfalls: [
      "Reading the saw scale as the angle between the cut and the board edge → the scale starts at square, so that board angle is 90 degrees minus the miter setting",
      "Using a bevelled pair as though it were a flat picture-frame joint → bevel changes the cut into a three-dimensional joint and the flat corner rule no longer applies",
      "Cutting two final-length pieces without allowing for kerf → the blade removes material, so plan the reference edge and cut order first",
      "Standing stock on edge without reconsidering the setup → the physical roles of miter and bevel can swap when the board orientation changes",
    ],
    checks: [
      {
        question: "What saw miter setting makes two pieces meet at a 120 degree flat-frame corner?",
        answer:
          "Each matching cut removes half the turn from a straight 180 degree line, so the setting is 90 minus half of 120, which is 30 degrees.",
      },
      {
        question: "A saw is set to zero miter. What angle does its cut line make with the board's long edge?",
        answer:
          "It is a square crosscut, so the cut line makes 90 degrees with the long edge even though the saw scale reads zero.",
      },
      {
        question: "What changes when bevel moves from zero while miter stays fixed?",
        answer:
          "The top plan remains the same because miter has not changed, but the blade tilts through the thickness and turns the cut face into a parallelogram.",
      },
    ],
    tryThis:
      "Start with Frame 45 degrees and inspect the equal cut line and frame corner. Then choose Compound 45 degrees / 30 degrees and compare the unchanged top plan with the skewed cut face below it.",
  },
  {
    id: "pulleys",
    plainEnglish:
      "Several pieces of rope can share a heavy weight, so your hand does not have to pull as hard. The trade is that you must pull much more rope.",
    objectives: [
      "count the rope strands that directly support a moving load",
      "calculate ideal mechanical advantage and effort force",
      "compute rope-pull distance and work for a chosen lift",
      "predict how friction changes effort and energy efficiency",
      "explain why pulleys save force but not energy",
    ],
    whyItMatters:
      "Cranes, rescue hoists, theatre rigging, sailing gear, and workshop lifting systems use pulley advantage to move heavy loads safely.",
    keyIdea:
      "Supporting strands divide the force, but each strand must shorten, so the saved force is paid back as extra rope distance.",
    workedExample: {
      prompt:
        "A pulley lifts a 600 N load by 1.5 m using four supporting strands at 80% efficiency. Find the ideal strand tension, actual effort, rope pulled, useful work, and input work.",
      steps: [
        "Ideal tension = W ÷ n = 600 N ÷ 4 = 150 N per supporting strand.",
        "Actual effort = W ÷ (nη) = 600 N ÷ (4 × 0.80) = 187.5 N, because friction lowers efficiency.",
        "Rope pulled = nh = 4 × 1.5 m = 6.0 m.",
        "Useful work = Wh = 600 N × 1.5 m = 900 J.",
        "Input work = effort × pull = 187.5 N × 6.0 m = 1125 J, and 900 J ÷ 1125 J = 0.80.",
      ],
      answer:
        "The ideal tension is 150 N, actual effort is 187.5 N, rope pull is 6.0 m, useful work is 900 J, and input work is 1125 J.",
    },
    pitfalls: [
      "Counting every visible rope section → count only strands that directly support the moving block",
      "Claiming a fixed pulley halves the force → one supporting strand gives no force saving; it only changes direction",
      "Using F = W ÷ n for a lossy system → include efficiency: F = W ÷ (nη)",
      "Thinking the pulley creates energy → lower force is exactly traded for greater pull distance, plus friction losses",
    ],
    checks: [
      {
        question: "What is the ideal effort for a 400 N load on four supporting strands?",
        answer:
          "F = W ÷ n = 400 N ÷ 4 = 100 N.",
      },
      {
        question:
          "How much rope must be pulled to raise that four-strand load by 0.5 m?",
        answer:
          "pull = nh = 4 × 0.5 m = 2.0 m, because every supporting strand must shorten by 0.5 m.",
      },
      {
        question:
          "Why does lowering Efficiency η increase the required effort?",
        answer:
          "Some input work becomes heat through friction, so F = W ÷ (nη) rises when η falls.",
      },
    ],
    tryThis:
      "Set Load weight W to 400 N and Supporting strands n to 1, then raise n to 4 and compare the effort arrow. Drag Lift the load, note that rope pull is four times the rise, then lower Efficiency η to 0.60 and use Auto-lift.",
  },
  {
    id: "atwood-machine",
    plainEnglish:
      "Two hanging weights pull against each other through one rope. The difference between them starts the movement, while both together make that movement harder to change.",
    objectives: [
      "draw weight and tension forces on both hanging masses",
      "calculate the machine's acceleration from the two masses",
      "compute the common rope tension",
      "predict the direction of motion before releasing the masses",
      "explain why scaling both masses equally leaves acceleration unchanged",
    ],
    whyItMatters:
      "Counterweighted lifts, mine hoists, stage rigging, and laboratory measurements use the same balance between driving weight and total inertia.",
    keyIdea:
      "Subtract the weights to find the driving force, but add the masses to find what that force must accelerate.",
    workedExample: {
      prompt:
        "An ideal Atwood machine has mass A = 2 kg and mass B = 5 kg. Find the acceleration and rope tension using g = 9.81 m/s².",
      steps: [
        "Driving force = (mB − mA)g = (5 kg − 2 kg) × 9.81 m/s² = 29.43 N.",
        "Total accelerated mass = mA + mB = 2 kg + 5 kg = 7 kg.",
        "a = 29.43 N ÷ 7 kg = 4.204 m/s², with B moving downward.",
        "For A, T − mAg = mAa, so T = mA(g + a) = 2 kg × (9.81 + 4.204) m/s².",
        "T = 28.03 N; the same value follows from T = 2mAmBg ÷ (mA + mB).",
      ],
      answer:
        "Mass B accelerates downward at 4.204 m/s², and the rope tension is 28.03 N.",
    },
    pitfalls: [
      "Using the heavier weight alone as the net force → subtract the lighter weight because it opposes the motion",
      "Dividing by only the heavier mass → the rope accelerates both masses, so divide by mA + mB",
      "Assuming tension equals either weight while accelerating → tension lies between the two weights for unequal masses",
      "Giving the two masses different acceleration magnitudes → an inextensible rope makes their magnitudes equal",
    ],
    checks: [
      {
        question: "What happens when Mass A equals Mass B?",
        answer:
          "The weight difference is zero, so acceleration is zero and tension equals either mass's weight.",
      },
      {
        question:
          "Which way does the machine move when Mass B is larger?",
        answer:
          "B moves down and A moves up because B's weight is the larger opposing pull.",
      },
      {
        question:
          "Why does doubling both masses leave acceleration unchanged?",
        answer:
          "Both the driving weight difference and total inertia double, so their ratio in a = (mB − mA)g ÷ (mA + mB) stays the same.",
      },
    ],
    tryThis:
      "Set Mass A and Mass B both to 3 kg and press Release masses to see balance. Press Reset, change Mass B to 3.1 kg, release again, then compare with Mass B at 6 kg while watching the weight and tension arrows.",
  },
  {
    id: "stress-strain",
    plainEnglish:
      "Pulling a bar spreads the pull across its thickness and makes it stretch. Thin, soft, or long bars change shape more, and too much pulling can leave permanent damage.",
    objectives: [
      "calculate stress from axial force and cross-sectional area",
      "compute elastic strain and elongation from material stiffness",
      "calculate a safety factor against yielding",
      "predict how force, area, length, and material change the response",
      "interpret the operating point on a stress-strain graph",
    ],
    whyItMatters:
      "Bolts, aircraft frames, bridges, pressure vessels, prosthetics, and machine parts must stay below material limits while carrying real loads.",
    keyIdea:
      "Stress measures how concentrated the force is; stiffness turns that stress into fractional stretch.",
    workedExample: {
      prompt:
        "A steel bar has area 150 mm², original length 2000 mm, and carries a 30 kN tensile force. For steel, E = 200 GPa and yield strength = 250 MPa. Find stress, strain, elongation, and safety factor.",
      steps: [
        "σ = F ÷ A = 30,000 N ÷ 150 mm² = 200 N/mm² = 200 MPa.",
        "E = 200 GPa = 200,000 MPa, so ε = σ ÷ E = 200 ÷ 200,000 = 0.001.",
        "ε = 0.001 = 0.100%, expressing the fractional stretch as a percentage.",
        "ΔL = εL₀ = 0.001 × 2000 mm = 2.00 mm.",
        "Safety factor = yield strength ÷ stress = 250 MPa ÷ 200 MPa = 1.25.",
      ],
      answer:
        "The stress is 200 MPa, strain is 0.001 or 0.100%, elongation is 2.00 mm, and safety factor is 1.25.",
    },
    pitfalls: [
      "Using force alone to judge danger → stress also depends on cross-sectional area through σ = F ÷ A",
      "Mixing GPa and MPa → convert 1 GPa to 1000 MPa before using ε = σ ÷ E",
      "Treating strain as a length → strain is a unitless ratio; elongation ΔL has length units",
      "Applying Hooke's law beyond yield → the linear elastic rule no longer predicts permanent deformation correctly",
    ],
    checks: [
      {
        question:
          "What happens to stress if the same force acts on twice the area?",
        answer:
          "σ = F ÷ A, so doubling area halves the stress.",
      },
      {
        question:
          "A strain of 0.002 acts over a 500 mm bar. What is the elongation?",
        answer:
          "ΔL = εL₀ = 0.002 × 500 mm = 1.0 mm.",
      },
      {
        question:
          "What does a safety factor below 1 mean?",
        answer:
          "The working stress exceeds the listed yield strength, so the material is expected to yield rather than fully spring back.",
      },
    ],
    tryThis:
      "Choose Steel, set Force F to 20 kN, Area A to 100 mm², and Length L₀ to 1000 mm. Switch Material to Rubber, then return to Steel and shrink Area A until the operating point and bar turn red beyond yield.",
  },
  {
    id: "pendulum",
    plainEnglish:
      "A hanging weight swings because the downward pull keeps bringing it back towards the middle. A longer string or a weaker downward pull makes each complete swing take more time.",
    objectives: [
      "calculate the small-angle period from length and gravity",
      "predict how length, gravity, mass, and release angle affect swing time",
      "compare the ideal small-angle motion with the real large-angle motion",
      "compute the predicted time for several full swings",
      "explain how damping changes amplitude and energy",
    ],
    whyItMatters:
      "Pendulum clocks, playground swings, seismic sensors, metronomes, and gravity measurements all use oscillation timing.",
    keyIdea:
      "For small swings, the bob repeats like a clock whose period is set by string length and gravity, not by bob mass.",
    workedExample: {
      prompt:
        "A pendulum has length 1.50 m and swings through a small angle on Earth. Find its period and the time for 10 full swings using g = 9.81 m/s².",
      steps: [
        "T₀ = 2π√(L ÷ g), the small-angle period rule.",
        "L ÷ g = 1.50 m ÷ 9.81 m/s² = 0.15291 s².",
        "T₀ = 2π√0.15291 s² = 2.457 s per full swing.",
        "Time for 10 swings = 10 × 2.457 s = 24.57 s.",
      ],
      answer:
        "The period is 2.457 s, so 10 full swings take about 24.57 s.",
    },
    pitfalls: [
      "Counting one side-to-side pass as a full period → one full swing returns to the same side and direction",
      "Including bob mass in the ideal period → mass cancels from the equation",
      "Using degrees inside sin θ ≈ θ calculations → the small-angle comparison requires radians",
      "Applying T₀ exactly at very large release angles → the real nonlinear period is longer",
    ],
    checks: [
      {
        question: "Does doubling bob mass change the ideal period?",
        answer:
          "No. Mass cancels from the pendulum equation, so equal-length bobs swing with the same ideal period.",
      },
      {
        question: "What happens to period if length is quadrupled?",
        answer:
          "T is proportional to √L, so √4 = 2 and the period doubles.",
      },
      {
        question:
          "Why does a 160° release run slower than the small-angle ghost?",
        answer:
          "At large angles sin θ is much smaller than θ, so the real restoring acceleration is weaker than the linear model predicts and the return takes longer.",
      },
    ],
    tryThis:
      "Set Length L to 1 m, World to Earth, Release angle θ₀ to 10°, Air damping b to 0, and Show ideal ghost on. Press Release ⟲, then repeat at 160° and use ⏱ Stop after N swings to compare measured and predicted times.",
  },
  {
    id: "physical-waves",
    plainEnglish:
      "A travelling shape can move along a rope even though each piece of rope only moves around its usual place. A returning shape can meet it and make some places stay still.",
    objectives: [
      "calculate wavelength, period, and temporal frequency from string length and wave speed",
      "predict how amplitude and wave speed change the displayed motion",
      "draw incident and reflected waves at fixed and free ends",
      "identify nodes and antinodes in a standing wave",
      "explain why a fixed-end reflection is inverted",
    ],
    whyItMatters:
      "Musical instruments, ultrasound, earthquake waves, radio transmission, noise control, and structural vibration all depend on wave travel and interference.",
    keyIdea:
      "A standing wave is two equal waves travelling in opposite directions and repeatedly adding or cancelling at fixed places.",
    workedExample: {
      prompt:
        "A 10 m string contains 2.5 complete wavelengths, and waves travel at 5.0 m/s. Find the wavelength, period, and frequency in hertz.",
      steps: [
        "λ = string length ÷ number of waves = 10 m ÷ 2.5 = 4.0 m.",
        "c = λ ÷ T, so T = λ ÷ c = 4.0 m ÷ 5.0 m/s = 0.80 s.",
        "f = 1 ÷ T = 1 ÷ 0.80 s = 1.25 Hz.",
        "Check: fλ = 1.25 Hz × 4.0 m = 5.0 m/s, matching the given wave speed.",
      ],
      answer:
        "The wavelength is 4.0 m, the period is 0.80 s, and the temporal frequency is 1.25 Hz.",
    },
    pitfalls: [
      "Thinking the string travels along with the crest → points on the string move across the axis while the disturbance travels along it",
      "Treating amplitude as wave speed → amplitude sets maximum displacement, not propagation speed",
      "Reflecting from a fixed end without inversion → a fixed boundary returns the wave with opposite displacement",
      "Calling every unmoving snapshot a standing wave → true nodes remain fixed through the animation",
    ],
    checks: [
      {
        question: "What does amplitude measure?",
        answer:
          "It is the maximum displacement of the string from its resting line.",
      },
      {
        question: "A wave has λ = 2 m and c = 6 m/s. What is its period?",
        answer:
          "T = λ ÷ c = 2 m ÷ 6 m/s = 0.333 s.",
      },
      {
        question:
          "Why does a node stay still in a standing wave?",
        answer:
          "The incident and reflected waves always have equal and opposite displacements there, so their sum remains zero.",
      },
    ],
    tryThis:
      "Set Far end to fixed, turn on Show reflected wave and Superpose reflection, and press Play. Adjust Frequency until clear stationary nodes appear, then switch Far end to free and compare the reflected wave's orientation.",
  },
  {
    id: "electrical-circuits",
    plainEnglish:
      "Electricity can build up and drain away rather than changing all at once. A harder path or a larger store makes the change take longer.",
    objectives: [
      "calculate the time constant from resistance and capacitance",
      "compute capacitor voltage and circuit current during charging or discharging",
      "predict how changing resistance or capacitance stretches the response time",
      "read one, two, and three time constants from an exponential graph",
      "explain why charging current falls as capacitor voltage rises",
    ],
    whyItMatters:
      "Camera flashes, sensor filters, power-up delays, timing circuits, audio electronics, and digital reset circuits all use resistor-capacitor timing.",
    keyIdea:
      "One time constant is the circuit's natural clock: each interval closes the same fraction of the remaining gap.",
    workedExample: {
      prompt:
        "A 12 V battery charges a 500 μF capacitor through a 2.0 kΩ resistor. Find the time constant, capacitor voltage, and current after one time constant.",
      steps: [
        "R = 2.0 kΩ = 2000 Ω and C = 500 μF = 0.000500 F.",
        "τ = RC = 2000 Ω × 0.000500 F = 1.00 s.",
        "VC = V(1 − e⁻¹) = 12 V × (1 − 0.3679) = 7.59 V after one τ.",
        "I = (V ÷ R)e⁻¹ = (12 V ÷ 2000 Ω) × 0.3679 = 0.00221 A.",
        "0.00221 A = 2.21 mA, and the current has fallen because the capacitor now opposes more of the battery voltage.",
      ],
      answer:
        "The time constant is 1.00 s; after that time the capacitor is at 7.59 V and the charging current is 2.21 mA.",
    },
    pitfalls: [
      "Adding R and C to find τ → multiply them: τ = RC",
      "Leaving capacitance in μF when multiplying by ohms → convert μF to farads first",
      "Expecting a capacitor to reach full charge at one τ → it reaches about 63%, not 100%",
      "Using positive current for both switch states → the lesson shows discharge current with the opposite sign",
    ],
    checks: [
      {
        question: "What fraction of the final voltage is reached after one τ while charging?",
        answer:
          "VC = V(1 − e⁻¹) ≈ 0.632V, so the capacitor reaches about 63% of the final voltage.",
      },
      {
        question: "What is τ for R = 1000 Ω and C = 0.002 F?",
        answer:
          "τ = RC = 1000 Ω × 0.002 F = 2.0 s.",
      },
      {
        question:
          "What happens to τ if both R and C double?",
        answer:
          "τ = RC becomes 2R × 2C = 4RC, so the response takes four times as long.",
      },
    ],
    tryThis:
      "Set Battery V to 10, Resistance R to 1000 Ω, Capacitance C to 0.001 F, and Switch to charge. Turn on Show τ markers and drag Time (τ) from 0 to 5, then double Resistance R and compare the displayed τ in seconds.",
  },
  {
    id: "shadows-earth-size",
    plainEnglish:
      "A stick and its shadow reveal the Sun's direction. Comparing that direction at two places turns a small ground measurement into an estimate of the whole Earth's size.",
    objectives: [
      "calculate the Sun angle from stick height and shadow length",
      "explain why the measured shadow angle equals the angle at Earth's centre",
      "compute Earth's circumference from city distance and central angle",
      "calculate Earth's radius from the estimated circumference",
      "predict how changing the shadow measurement changes the estimate",
    ],
    whyItMatters:
      "Surveying, navigation, solar positioning, map-making, and Eratosthenes' historic Earth measurement all use geometry to infer inaccessible distances.",
    keyIdea:
      "Parallel sunlight copies the small angle at the stick into the centre of the circular Earth, where it becomes a scale factor.",
    workedExample: {
      prompt:
        "A 1.000 m vertical stick casts a 0.126 m shadow while a city 800 km away has the Sun directly overhead. Estimate Earth's circumference and radius.",
      steps: [
        "θ = atan(s ÷ h) = atan(0.126 m ÷ 1.000 m) = 7.181°.",
        "The parallel Sun rays make this equal to the central angle between the two cities.",
        "The city arc is 7.181° ÷ 360° of a full circle, so circumference = 800 km × 360° ÷ 7.181°.",
        "Circumference = 40,103 km.",
        "Radius = circumference ÷ 2π = 40,103 km ÷ 2π = 6383 km.",
      ],
      answer:
        "The estimated Earth circumference is about 40,103 km and the radius is about 6383 km.",
    },
    pitfalls: [
      "Using shadow length alone as the angle → calculate θ from the ratio s ÷ h",
      "Treating the matching angles as vertical opposites → they are corresponding angles created by parallel Sun rays",
      "Using straight-line city separation when the method requires surface distance → use the arc distance along Earth",
      "Multiplying by θ ÷ 360 instead of 360 ÷ θ → the known city distance is only a fraction of the full circumference",
    ],
    checks: [
      {
        question: "What happens to the measured angle when the shadow gets longer but stick height stays fixed?",
        answer:
          "The ratio s ÷ h increases, so atan(s ÷ h) and therefore the measured angle increase.",
      },
      {
        question:
          "If two cities are 900 km apart and span 9°, what circumference is estimated?",
        answer:
          "The arc is 9° ÷ 360° = one fortieth of a circle, so circumference = 900 km × 40 = 36,000 km.",
      },
      {
        question:
          "Why can the stick angle be used at Earth's centre?",
        answer:
          "Sun rays are effectively parallel, and the local verticals are Earth radii, so corresponding angles make the two angles equal.",
      },
    ],
    tryThis:
      "Use Step to move through Measure the Sun angle, Why the angle transfers, and Scale up to Earth. Set Stick height h to 1 m, Shadow length s to 0.126 m, and City distance to 800 km, then inspect the angle, circumference, and radius readouts.",
  },
  {
    id: "shaders",
    plainEnglish:
      "A tiny set of instructions chooses the colour of every dot on the screen. Changing the instructions changes the picture immediately, so you can turn number patterns into moving art.",
    objectives: [
      "write and compile a fragment shader that sets a pixel colour",
      "map surface coordinates into centred coordinates",
      "draw shapes using distance calculations and smooth edges",
      "animate patterns with time and respond to pointer position",
      "diagnose a compile error and correct the source code",
    ],
    whyItMatters:
      "GPU rendering powers games, films, scientific visualisation, user interfaces, image effects, and real-time simulation.",
    keyIdea:
      "Every pixel runs the same small program with different coordinates, so pictures emerge from applying one mathematical rule everywhere in parallel.",
    workedExample: {
      prompt:
        "An 800 × 600 pixel canvas reports a pointer 200 px from the left and 150 px from the top. Find u_mouse, then find its distance from a shader pixel with vUv = (0.40, 0.60).",
      steps: [
        "u_mouse.x = 200 px ÷ 800 px = 0.25, converting the horizontal position to the 0-to-1 surface range.",
        "u_mouse.y = 1 − (150 px ÷ 600 px) = 0.75, because the lesson flips browser y so shader y increases upward.",
        "Δ = vUv − u_mouse = (0.40 − 0.25, 0.60 − 0.75) = (0.15, −0.15) UV units.",
        "distance = √(0.15² + (−0.15)²) = √0.045 = 0.212 UV units.",
      ],
      answer:
        "The pointer uniform is u_mouse = (0.25, 0.75), and the pixel is 0.212 UV units from it.",
    },
    pitfalls: [
      "Using pixel coordinates directly with vUv → normalise positions to the 0-to-1 coordinate range",
      "Forgetting that browser y points down → the lesson sends u_mouse.y as 1 − y ÷ height",
      "Editing code without recompiling → press Compile shader or Ctrl/Cmd+Enter to update the material",
      "Deleting a semicolon and blaming a black screen → read the displayed compiler error and fix the reported line",
    ],
    checks: [
      {
        question: "What does vUv tell the fragment shader?",
        answer:
          "It gives the current pixel's position across the surface, from 0 to 1 in x and y.",
      },
      {
        question: "Why does adding u_time to a sine expression create motion?",
        answer:
          "u_time changes every frame, so the sine's phase shifts and the same pattern appears at new positions.",
      },
      {
        question:
          "What must main write to choose the final pixel colour?",
        answer:
          "It must assign gl_FragColor a vec4 containing red, green, blue, and alpha values.",
      },
    ],
    tryThis:
      "Click 1 · Hello, pixel, change one colour number in the code editor, and press ▶ Compile shader. Then load the Mouse gallery example, move the pointer over the viewport, change Time speed, and deliberately remove a semicolon to inspect the compiler error before fixing it.",
  },
];
