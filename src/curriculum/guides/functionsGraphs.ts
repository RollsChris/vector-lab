import type { LessonGuide } from "../types";

/** Teaching guides for the Functions & Graphs stage plus the two lessons that slot into
 *  the vectors and calculus stages (matrices-as-maps and limits-and-continuity). */
export const FUNCTIONS_GRAPHS_GUIDES: readonly LessonGuide[] = [
  {
    id: "coordinates-and-lines",
    plainEnglish:
      "Every spot on a flat grid has an address made of two numbers. Join two spots and you get a straight line, and simple counting tells you how steep it is.",
    objectives: [
      "plot a point from its pair of coordinates",
      "calculate the gradient of a line as rise divided by run",
      "write the equation of a line in the form y equals m x plus c",
      "calculate the midpoint of two points by averaging their coordinates",
      "calculate the distance between two points using the rise and run",
    ],
    whyItMatters:
      "Coordinates and straight lines underpin maps, screen graphics, and any spreadsheet trend line, and the gradient idea returns as the heart of calculus.",
    keyIdea:
      "The gradient is a single number that says how many units the line climbs for every one unit it moves to the right.",
    workedExample: {
      prompt: "Find the gradient, equation, midpoint and length of the line through the points at coordinates 1 and 2, then 4 and 8.",
      steps: [
        "Rise is the change in height: 8 minus 2 gives 6.",
        "Run is the change across: 4 minus 1 gives 3.",
        "Gradient is rise divided by run: 6 divided by 3 gives 2.",
        "Use the first point to find the intercept: 2 equals 2 times 1 plus c, so c is 0, giving y equals 2 x.",
        "Midpoint averages each coordinate: halfway across is 2.5 and halfway up is 5.",
        "Length uses the rise and run as sides: the square root of 3 squared plus 6 squared is about 6.7.",
      ],
      answer: "The gradient is 2, the equation is y equals 2 x, the midpoint is at 2.5 and 5, and the length is about 6.7.",
    },
    pitfalls: [
      "Reading coordinates upside down by giving the height first instead of the across value first",
      "Dividing run by rise for the gradient instead of rise by the run, which turns the number upside down",
      "Forgetting that a straight up-and-down line has no gradient because its run is zero",
      "Adding the coordinates for a midpoint but forgetting to halve them afterwards",
    ],
    checks: [
      {
        question: "What is the gradient of the line joining the points at 0 and 1, then 2 and 7?",
        answer:
          "The rise is 7 minus 1 which is 6, and the run is 2 minus 0 which is 2. Dividing the rise by the run gives a gradient of 3.",
      },
      {
        question: "Where is the midpoint of the points at minus 2 and 4, then 6 and 10?",
        answer:
          "Average each coordinate separately. Across, minus 2 and 6 average to 2, and up, 4 and 10 average to 7, so the midpoint is at 2 and 7.",
      },
      {
        question: "Why does a vertical line have no ordinary gradient?",
        answer:
          "A vertical line has the same across value at every height, so its run is zero. Dividing the rise by zero has no answer, so the gradient is left undefined.",
      },
    ],
    tryThis:
      "Drag the red and blue handles so the green rise and orange run form a right angle, then move one handle straight above the other and watch the gradient readout become undefined.",
  },
  {
    id: "functions-and-graphs",
    plainEnglish:
      "A function is like a machine: feed it a number and it hands back exactly one number. Drawing every input with its output traces the picture we call a graph.",
    objectives: [
      "calculate the output of a function for a chosen input",
      "read an output off a graph by tracing up then across",
      "apply the vertical line test to decide whether a picture is a function",
      "state the set of inputs for which a function is defined",
      "sketch the graph of a simple function from a table of values",
    ],
    whyItMatters:
      "Functions describe how one quantity depends on another, such as cost from quantity or distance from time, and every later graph topic builds on them.",
    keyIdea:
      "A picture is a function only when each input has a single output, which is exactly what the vertical line test checks.",
    workedExample: {
      prompt: "For the function that squares its input and subtracts one, find the output at input two and check whether the graph passes the vertical line test.",
      steps: [
        "Square the input: two squared is four.",
        "Subtract one from the result: four minus one is three.",
        "So the point with across value two sits at height three on the graph.",
        "Slide an imaginary vertical line across the parabola and count crossings.",
        "The vertical line meets the parabola once at every position, so each input has one output.",
        "The picture passes the test, so it really is a function.",
      ],
      answer: "The output at input two is three, and the parabola is a valid function because every vertical line meets it once.",
    },
    pitfalls: [
      "Thinking any curve at all is a function, when a sideways parabola gives two outputs for one input",
      "Squaring a negative input and keeping the minus sign instead of getting a positive result",
      "Ignoring the domain and reading off outputs where the function is actually undefined",
      "Confusing the input axis across the bottom with the output axis up the side",
    ],
    checks: [
      {
        question: "A function doubles its input then adds three. What is the output for input five?",
        answer:
          "Double the input to get ten, then add three to reach thirteen. So the output paired with input five is thirteen.",
      },
      {
        question: "A picture is a sideways U shape opening to the right. Is it a function?",
        answer:
          "No. A vertical line drawn through the middle crosses the curve twice, so one input would need two outputs, which a function is not allowed to do.",
      },
      {
        question: "Why is the square root function only defined for inputs that are zero or more?",
        answer:
          "There is no ordinary number that multiplies by itself to give a negative result. So the square root has no output for negative inputs, and its domain starts at zero.",
      },
    ],
    tryThis:
      "Slide the input handle and watch the orange line rise to the curve and the green line read off the output, then switch on the vertical line test and drag it across to see the curve pass.",
  },
  {
    id: "simultaneous-equations",
    plainEnglish:
      "Sometimes two facts must be true at the same time. Drawing each fact as a line, the single crossing point is the pair of numbers that satisfies both at once.",
    objectives: [
      "plot a line written in the form a x plus b y equals c",
      "identify the intersection of two lines as the shared solution",
      "classify a pair of lines as crossing, parallel, or the same line",
      "solve a two-by-two system and check the result in both equations",
      "explain why parallel lines give no solution",
    ],
    whyItMatters:
      "Solving several conditions together answers real questions such as mixing two prices to a budget or balancing supply against demand.",
    keyIdea:
      "The solution of two equations is the one point that lies on both lines, so it is exactly where the lines cross.",
    workedExample: {
      prompt: "Solve the pair of equations where x plus y makes three and x minus y makes one.",
      steps: [
        "Add the two equations so the y terms cancel: two x makes four.",
        "Divide both sides by two to get x equal to two.",
        "Put x equal to two back into x plus y makes three.",
        "That leaves y equal to one.",
        "Check in the second equation: two minus one really does make one.",
      ],
      answer: "The lines cross at the point where x is two and y is one.",
    },
    pitfalls: [
      "Reading off a rough crossing point from a sketch instead of solving for the exact values",
      "Declaring no solution when the two equations actually describe the very same line",
      "Adding the equations when the matching terms have the same sign and so fail to cancel",
      "Solving for one unknown and forgetting to find the other before stopping",
    ],
    checks: [
      {
        question: "Two lines have the same gradient but cross the up axis at different heights. How many solutions are there?",
        answer:
          "None. Equal gradients mean the lines are parallel, so they never meet, and without a crossing point there is no pair of numbers that fits both.",
      },
      {
        question: "Solve the pair where x plus y makes ten and x minus y makes two.",
        answer:
          "Adding the equations gives two x equal to twelve, so x is six. Substituting back gives y equal to four. The solution is six and four.",
      },
      {
        question: "One equation is x plus y makes four and the other is two x plus two y makes eight. What happens?",
        answer:
          "The second equation is just the first one doubled, so both describe the same line. Every point on that line works, giving infinitely many solutions.",
      },
    ],
    tryThis:
      "Move the sliders for the blue line until it lies exactly on top of the red line and see the intersection marker disappear as the panel reports infinitely many solutions.",
  },
  {
    id: "quadratics",
    plainEnglish:
      "When a formula includes a squared term the graph bends into a smooth U shape. This lesson shows how three numbers control that shape and where it crosses the bottom axis.",
    objectives: [
      "sketch a parabola from the sign and size of its leading number",
      "calculate the roots where a quadratic crosses the horizontal axis",
      "calculate the turning point of a parabola",
      "use the discriminant to count how many real roots a quadratic has",
      "rewrite a quadratic in factorised or completed-square form",
    ],
    whyItMatters:
      "Quadratics model thrown balls, profit curves, and satellite dishes, and reading their roots and turning point answers when and how high something happens.",
    keyIdea:
      "The discriminant, the part under the square root in the formula, decides whether the U shape cuts the axis twice, touches it once, or misses it entirely.",
    workedExample: {
      prompt: "For the quadratic that is one times x squared, minus five x, plus six, find its roots, turning point and discriminant.",
      steps: [
        "The discriminant is five squared minus four times one times six, which is twenty five minus twenty four, giving one.",
        "A positive discriminant means two separate roots.",
        "The formula gives roots at five plus or minus the square root of one, all over two, so two and three.",
        "The turning point sits halfway between the roots, across value two point five.",
        "Putting two point five back in gives a height of minus nought point two five.",
        "So the lowest point of the U is at two point five and minus nought point two five.",
      ],
      answer: "The roots are two and three, the turning point is at two point five and minus nought point two five, and the discriminant is one.",
    },
    pitfalls: [
      "Dropping the plus or minus in the formula and finding only one of the two roots",
      "Believing every parabola crosses the axis, when a negative discriminant means it never does",
      "Getting the turning point sideways position wrong by forgetting the minus sign in front of b",
      "Reading the leading number as only affecting width and ignoring that its sign flips the U upside down",
    ],
    checks: [
      {
        question: "What does a discriminant of zero tell you about a parabola?",
        answer:
          "It means the square root part is zero, so the two roots merge into one. The parabola just touches the horizontal axis at a single point rather than crossing it.",
      },
      {
        question: "Which way does the parabola open when the squared term has a negative number in front?",
        answer:
          "It opens downward like a hill rather than a valley. The negative leading number flips the whole U shape upside down so it has a highest point instead of a lowest.",
      },
      {
        question: "A quadratic is x squared minus four. Where are its roots?",
        answer:
          "Setting the expression to zero gives x squared equal to four, so x is plus or minus two. The parabola crosses the axis at minus two and at two.",
      },
    ],
    tryThis:
      "Drag the c slider up and down and watch the discriminant readout change sign as the two red roots appear, merge into one, and then vanish when the curve lifts clear of the axis.",
  },
  {
    id: "inequalities",
    plainEnglish:
      "Instead of asking which single number fits, an inequality asks which whole range of numbers fits. The answer is a stretch of the number line, not one point.",
    objectives: [
      "solve a linear inequality and draw its solution as a ray",
      "explain why multiplying by a negative number reverses the direction",
      "represent a solution range on a number line",
      "solve a quadratic inequality by finding the roots first",
      "identify whether the solution lies between or outside two roots",
    ],
    whyItMatters:
      "Inequalities express limits and tolerances, such as staying under a budget, above a pass mark, or within a safe temperature band.",
    keyIdea:
      "Solve an inequality just like an equation, with one extra rule: dividing or multiplying by a negative number flips the direction of the sign.",
    workedExample: {
      prompt: "Solve the inequality that says four minus two x is greater than zero.",
      steps: [
        "Move the number across: subtract four from both sides to get minus two x greater than minus four.",
        "Now divide both sides by minus two to isolate x.",
        "Dividing by a negative flips the sign from greater than to less than.",
        "That leaves x less than two.",
        "Check with a test value: x equal to zero gives four, which is indeed greater than zero.",
      ],
      answer: "The solution is every x less than two, drawn as a ray running left from two.",
    },
    pitfalls: [
      "Forgetting to flip the sign after dividing both sides by a negative number",
      "Filling in a solid dot at the boundary when the sign is strict and should be hollow",
      "Solving a quadratic inequality by roots but then picking the wrong side of them",
      "Treating an inequality answer as a single number rather than a whole range",
    ],
    checks: [
      {
        question: "Solve the inequality three x minus six is less than zero.",
        answer:
          "Add six to both sides to get three x less than six, then divide by the positive three. Since three is positive the sign stays, giving x less than two.",
      },
      {
        question: "Why does dividing by a negative number reverse an inequality?",
        answer:
          "Negating both sides of a comparison swaps which number is larger. For example five is bigger than three, but minus five is smaller than minus three, so the direction must flip.",
      },
      {
        question: "An upward parabola is below the axis between its roots at one and four. What is the solution of the expression being less than zero?",
        answer:
          "The curve dips below zero only between the crossing points, so the solution is every x greater than one and less than four, the stretch between the two roots.",
      },
    ],
    tryThis:
      "Make the a slider negative in linear mode and watch the green ray jump to the opposite side of the boundary as the sign flips, then switch to quadratic mode and shade between the roots.",
  },
  {
    id: "graph-transformations",
    plainEnglish:
      "Once you can draw one curve you can make a whole family from it by sliding it around, stretching it, and flipping it, without ever recalculating from scratch.",
    objectives: [
      "shift a graph up, down, left, or right by changing its formula",
      "stretch a graph vertically or horizontally by a chosen factor",
      "reflect a graph in the horizontal or vertical axis",
      "predict the new formula after a described transformation",
      "explain why changes inside the brackets behave in the opposite way",
    ],
    whyItMatters:
      "Recognising transformations lets you read and adjust curves quickly in graphics, signal processing, and modelling without heavy computation.",
    keyIdea:
      "Changes on the outside of the function affect the output and act as expected, while changes on the inside affect the input and act in reverse.",
    workedExample: {
      prompt: "Describe how the graph that squares its input changes when it becomes two times the square of the quantity input minus three, plus one.",
      steps: [
        "The bracket has input minus three inside, an inside change affecting the input.",
        "Inside changes act in reverse, so this slides the curve three to the right.",
        "The two out front multiplies the output, stretching the curve twice as tall.",
        "The plus one at the end is an outside change added to the output.",
        "That lifts the whole curve one unit upward.",
        "So the vertex moves from the origin to across three and up one, and the U is twice as steep.",
      ],
      answer: "The parabola is stretched to twice its height, shifted three right and one up, with its turning point now at three and one.",
    },
    pitfalls: [
      "Reading input minus three as a shift to the left when it actually moves the curve right",
      "Mixing up a vertical stretch, which changes height, with a horizontal one, which changes width",
      "Applying an outside reflection as if it flipped the curve left to right instead of top to bottom",
      "Doing the shift before the stretch and landing the curve in the wrong place",
    ],
    checks: [
      {
        question: "How does adding four on the outside of a function move its graph?",
        answer:
          "Adding to the output raises every point by four, so the whole graph slides four units straight up without changing its shape or width.",
      },
      {
        question: "The formula changes from f of x to f of the quantity x plus two. Which way does the graph move?",
        answer:
          "The plus two is an inside change acting on the input, and inside changes reverse. So rather than moving right, the graph slides two units to the left.",
      },
      {
        question: "What does multiplying the whole output by minus one do to a graph?",
        answer:
          "It flips every output to the opposite sign, reflecting the graph in the horizontal axis so peaks become troughs and the curve turns upside down.",
      },
    ],
    tryThis:
      "Set the base curve to the sine wave, then raise the horizontal stretch slider and watch the waves bunch closer together as the inside factor squeezes the input.",
  },
  {
    id: "exponential-log-graphs",
    plainEnglish:
      "Repeated multiplying makes a curve that shoots upward faster and faster. The log curve is its mirror twin that undoes it, found by reflecting across a diagonal line.",
    objectives: [
      "sketch the graph of a base raised to the power x",
      "sketch the graph of a logarithm and mark the point it passes through",
      "explain why the two curves are reflections in the diagonal line",
      "identify the axis each curve approaches but never touches",
      "describe how changing the base reshapes both curves",
    ],
    whyItMatters:
      "Exponential and log curves describe growth, decay, and compression, appearing in interest, populations, sound levels, and the pH scale.",
    keyIdea:
      "An exponential and its logarithm are inverse machines, so reflecting one across the line where output equals input produces the other.",
    workedExample: {
      prompt: "Compare the graph of two raised to the power x with the graph of the logarithm base two, listing a shared feature.",
      steps: [
        "The exponential passes through the point where input zero gives output one.",
        "Reflecting that point across the diagonal swaps the coordinates to input one gives output zero.",
        "So the logarithm passes through input one giving output zero.",
        "The exponential passes through input one giving output two.",
        "Reflected, the logarithm passes through input two giving output one.",
        "Each curve hugs one axis: the exponential nears the flat axis, the log nears the upright axis.",
      ],
      answer: "The two curves are mirror images across the diagonal, so the point one and two on one matches two and one on the other.",
    },
    pitfalls: [
      "Thinking the exponential curve eventually touches the flat axis when it only ever approaches it",
      "Trying to take a logarithm of zero or a negative number, which has no output",
      "Swapping the points the two curves pass through instead of reflecting the coordinates",
      "Believing a bigger base makes the log rise faster when it actually rises more slowly",
    ],
    checks: [
      {
        question: "Through which point does every logarithm curve pass, whatever its base?",
        answer:
          "Every logarithm passes through the point where the input is one and the output is zero, because any base raised to the power zero equals one.",
      },
      {
        question: "Why can you never take the logarithm of a negative number?",
        answer:
          "A logarithm asks what power of a positive base gives the input. No power of a positive base ever produces a negative result, so there is simply no output.",
      },
      {
        question: "What line acts as the mirror between an exponential and its logarithm?",
        answer:
          "The diagonal line where the output equals the input. Reflecting either curve across that line, swapping each pair of coordinates, produces the other curve exactly.",
      },
    ],
    tryThis:
      "Snap the base to the special number e and see the natural exponential and its logarithm settle as mirror images across the dashed diagonal.",
  },
  {
    id: "sequences-and-series",
    plainEnglish:
      "A sequence is a list of numbers made by a repeating rule. Adding those numbers up gives a series, and a running total can be tracked as the list grows.",
    objectives: [
      "calculate a term of an arithmetic sequence from its position",
      "calculate a term of a geometric sequence from its position",
      "calculate the sum of the first several terms of a sequence",
      "distinguish an arithmetic rule from a geometric rule",
      "decide when an endless geometric series adds to a finite total",
    ],
    whyItMatters:
      "Sequences and series model repayments, savings that compound, and repeated measurements, and they preview the sums that calculus later makes exact.",
    keyIdea:
      "An arithmetic list grows by adding a fixed step, while a geometric list grows by multiplying by a fixed ratio, and each has its own tidy sum formula.",
    workedExample: {
      prompt: "For the arithmetic sequence starting at three and going up by two, find the fifth term and the sum of the first five terms.",
      steps: [
        "The first term is three.",
        "Each step adds two, so the terms are three, five, seven, nine, eleven.",
        "The fifth term is eleven, which matches three plus four steps of two.",
        "To sum five terms, pair the first and last: three plus eleven is fourteen.",
        "The sum formula takes half the number of terms times that pair total: two point five times fourteen.",
        "That gives thirty five.",
      ],
      answer: "The fifth term is eleven and the sum of the first five terms is thirty five.",
    },
    pitfalls: [
      "Counting positions from zero and so landing one term short of the wanted value",
      "Using the arithmetic sum formula on a geometric list that multiplies rather than adds",
      "Claiming an endless series always adds to a finite total, when it only does so if the ratio is small",
      "Adding the step twice for the first term instead of starting the count from the first term itself",
    ],
    checks: [
      {
        question: "A geometric sequence starts at two and multiplies by three each time. What is its fourth term?",
        answer:
          "The terms are two, six, eighteen, fifty four. Each is the previous one times three, so the fourth term is fifty four.",
      },
      {
        question: "When does an endless geometric series add up to a finite number?",
        answer:
          "Only when the common ratio lies strictly between minus one and one. Then each term shrinks fast enough that the running total settles on the first term divided by one minus the ratio.",
      },
      {
        question: "What is the difference between an arithmetic and a geometric sequence?",
        answer:
          "An arithmetic sequence changes by adding the same fixed amount each step, so its terms sit on a straight line. A geometric sequence changes by multiplying by the same fixed factor, so its terms curve.",
      },
    ],
    tryThis:
      "Switch to geometric and set the ratio to nought point five, then watch the green running-total bar climb and stop just short of twice the first term as the sum to infinity is reached.",
  },
  {
    id: "limits-and-continuity",
    plainEnglish:
      "A limit asks what height a curve is heading for as you slide toward a chosen spot, even if the curve has a gap or a step there. It is about the approach, not the spot itself.",
    objectives: [
      "estimate a limit by sampling values from the left and the right",
      "decide whether a two-sided limit exists by comparing the sides",
      "identify a removable gap where the limit exists but the value is missing",
      "identify a jump where the two sides disagree",
      "explain the three conditions that make a function continuous at a point",
    ],
    whyItMatters:
      "Limits are the foundation of calculus, defining instant speed and smoothness, and they explain why some graphs can be drawn without lifting the pen.",
    keyIdea:
      "A limit exists only when the approach from the left and the approach from the right head for the same height.",
    workedExample: {
      prompt: "Estimate the limit as the input nears one of the curve that has a removable gap but otherwise follows half the input plus one.",
      steps: [
        "Approach from the left with inputs nought point nine then nought point nine nine.",
        "Their outputs are one point four five then one point four nine five, climbing toward one point five.",
        "Approach from the right with inputs one point one then one point zero one.",
        "Their outputs are one point five five then one point five zero five, falling toward one point five.",
        "Both sides head for the same height, one point five.",
        "So the limit is one point five even though the curve has a hole exactly at the input one.",
      ],
      answer: "The limit as the input nears one is one point five, despite the function itself being undefined at that spot.",
    },
    pitfalls: [
      "Assuming the limit equals the value at the point, when a gap or jump can make them differ",
      "Declaring a limit from only one side without checking the other side agrees",
      "Thinking a removable hole means the limit fails, when both sides still head to the same height",
      "Treating a jump as continuous because each side is smooth, ignoring that the sides disagree",
    ],
    checks: [
      {
        question: "The left approach heads to two and the right approach heads to five. Does the limit exist?",
        answer:
          "No. A two-sided limit exists only when both sides head for the same height. Here they disagree, so there is a jump and no single limit at that point.",
      },
      {
        question: "A curve follows a smooth line everywhere but is undefined at one input. Can a limit exist there?",
        answer:
          "Yes. The limit depends on the approach from either side, not the missing point. Since both sides head for the same height, the limit exists even though the value is absent.",
      },
      {
        question: "What three things must hold for a function to be continuous at a point?",
        answer:
          "The function must have a value there, the limit must exist as both sides agree, and that limit must equal the value. When all three line up there is no hole or jump.",
      },
    ],
    tryThis:
      "Choose the removable hole preset and shrink the approach gap slider, watching the green sample dots squeeze in toward the limit even though the curve is punctured at the target.",
  },
  {
    id: "matrices-as-maps",
    plainEnglish:
      "A small grid of four numbers can act as a machine that moves every point of a flat sheet. All it records is where the two starter arrows land, and everything else follows.",
    objectives: [
      "calculate where a matrix sends a given point",
      "identify the landing spots of the two basis arrows from the columns",
      "describe how the unit square deforms into a parallelogram",
      "calculate the determinant as the area scale factor",
      "explain what a negative determinant says about orientation",
    ],
    whyItMatters:
      "Matrices as maps drive computer graphics, robotics, and data transforms, turning rotations, stretches, and reflections into a single compact operation.",
    keyIdea:
      "The two columns of a matrix are simply the new homes of the two basis arrows, and the area of the deformed unit square equals the determinant.",
    workedExample: {
      prompt: "For the matrix whose columns send the first arrow to two and zero and the second arrow to zero and three, find the image of a point and the determinant.",
      steps: [
        "The first column shows the sideways arrow lands at two and zero.",
        "The second column shows the upright arrow lands at zero and three.",
        "A point built from one of each arrow lands at their sum, two and three.",
        "The unit square stretches into a rectangle two wide and three tall.",
        "Its area is two times three, which is six.",
        "The determinant equals that area, six, and it is positive so orientation is kept.",
      ],
      answer: "The point lands at two and three, and the determinant is six, meaning areas grow six times with no flip.",
    },
    pitfalls: [
      "Reading the matrix rows as the arrow destinations instead of the columns",
      "Ignoring the sign of the determinant and missing that the plane has been flipped",
      "Thinking a zero determinant is harmless, when it squashes the whole plane onto a line",
      "Applying the area scale factor to the square only, forgetting it stretches every shape equally",
    ],
    checks: [
      {
        question: "Where do the two basis arrows land for a matrix with columns three and zero, then zero and one?",
        answer:
          "The columns give the destinations directly. The sideways arrow lands at three and zero, and the upright arrow lands at zero and one, so the map stretches the width by three.",
      },
      {
        question: "What does a determinant of zero mean for the map?",
        answer:
          "It means the deformed unit square has no area because it has been flattened onto a single line. The map collapses the whole plane, so different points can be squashed together.",
      },
      {
        question: "What does a negative determinant tell you?",
        answer:
          "It tells you the map has flipped the plane over, like a mirror reflection, swapping its orientation. The size of the number still gives the area scale factor, but the sheet has been turned inside out.",
      },
    ],
    tryThis:
      "Set the entries so the two columns swap the arrows, sending the sideways one up and the upright one across, and watch the square turn red as the determinant reads minus one for a reflection.",
  },
];
