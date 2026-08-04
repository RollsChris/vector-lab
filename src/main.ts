import "./style.css";
import { Viewport } from "./core/Viewport";
import { LessonManager } from "./core/LessonManager";
import { MobileShell } from "./core/MobileShell";
import { VectorFieldLesson } from "./lessons/VectorFieldLesson";
import { DifferentiationLesson } from "./lessons/DifferentiationLesson";
import { IntegrationLesson } from "./lessons/IntegrationLesson";
import { OptimizationLesson } from "./lessons/OptimizationLesson";
import { TaylorSeriesLesson } from "./lessons/TaylorSeriesLesson";
import { LogarithmsLesson } from "./lessons/LogarithmsLesson";
import { ElectricalCircuitsLesson } from "./lessons/ElectricalCircuitsLesson";
import { FoundationsLesson } from "./lessons/FoundationsLesson";
import { ProbabilityLesson } from "./lessons/ProbabilityLesson";
import { MarkovChainsLesson } from "./lessons/MarkovChainsLesson";
import { StochasticProcessesLesson } from "./lessons/StochasticProcessesLesson";
import { PascalTriangleLesson } from "./lessons/PascalTriangleLesson";
import { PowersLesson } from "./lessons/PowersLesson";
import { MersennePrimesLesson } from "./lessons/MersennePrimesLesson";
import { PrimeNumbersLesson } from "./lessons/PrimeNumbersLesson";
import { ComplexNumbersLesson } from "./lessons/ComplexNumbersLesson";
import { WaveformsLesson } from "./lessons/WaveformsLesson";
import { FourierSeriesLesson } from "./lessons/FourierSeriesLesson";
import { PhysicalWavesLesson } from "./lessons/PhysicalWavesLesson";
import { NewtonsLawsLesson } from "./lessons/NewtonsLawsLesson";
import { KinematicsLesson } from "./lessons/KinematicsLesson";
import { ProjectileMotionLesson } from "./lessons/ProjectileMotionLesson";
import { MomentumImpulseLesson } from "./lessons/MomentumImpulseLesson";
import { MomentsLesson } from "./lessons/MomentsLesson";
import { CollisionsLesson } from "./lessons/CollisionsLesson";
import { UniversalGravitationLesson } from "./lessons/UniversalGravitationLesson";
import { ShadowsEarthSizeLesson } from "./lessons/ShadowsEarthSizeLesson";
import { StressStrainLesson } from "./lessons/StressStrainLesson";
import { PulleysLesson } from "./lessons/PulleysLesson";
import { AtwoodMachineLesson } from "./lessons/AtwoodMachineLesson";
import { LoadPathLesson } from "./lessons/LoadPathLesson";
import { MiterSawCutsLesson } from "./lessons/MiterSawCutsLesson";
import { PendulumLesson } from "./lessons/PendulumLesson";
import { ShaderPlaygroundLesson } from "./lessons/ShaderPlaygroundLesson";
import { GeometryLesson } from "./lessons/GeometryLesson";
import { UnitConversionsLesson } from "./lessons/UnitConversionsLesson";
import { TrigonometricFunctionsLesson } from "./lessons/TrigonometricFunctionsLesson";
import { RearrangingEquationsLesson } from "./lessons/RearrangingEquationsLesson";
import { OrderOfOperationsLesson } from "./lessons/OrderOfOperationsLesson";
import { MultiplicationDivisionLesson } from "./lessons/MultiplicationDivisionLesson";
import { TimesTablesLesson } from "./lessons/TimesTablesLesson";
import { AlgebraicLawsLesson } from "./lessons/AlgebraicLawsLesson";
import { VectorsLesson } from "./lessons/VectorsLesson";
import { TriangleTheoremsLesson } from "./lessons/TriangleTheoremsLesson";
import { TriangleTransformationsLesson } from "./lessons/TriangleTransformationsLesson";
import { CircleGlossaryLesson } from "./lessons/CircleGlossaryLesson";
import { CircleTheoremsLesson } from "./lessons/CircleTheoremsLesson";
import { CircleCalculationsLesson } from "./lessons/CircleCalculationsLesson";
import { VolumeLesson } from "./lessons/VolumeLesson";
import { ConicSectionsLesson } from "./lessons/ConicSectionsLesson";
import { QuadrilateralsLesson } from "./lessons/QuadrilateralsLesson";
import { RadiansLesson } from "./lessons/RadiansLesson";
import { BinomialsLesson } from "./lessons/BinomialsLesson";
import { NumberSenseFractionsLesson } from "./lessons/NumberSenseFractionsLesson";
import { ArithmeticOperationsLesson } from "./lessons/ArithmeticOperationsLesson";

const stage = document.getElementById("stage")!;
const nav = document.getElementById("nav")!;
const info = document.getElementById("info")!;
const guiHost = document.getElementById("gui")!;
const search = document.getElementById("lesson-search") as HTMLInputElement;
const count = document.getElementById("lesson-count")!;
const meta = document.getElementById("lesson-meta")!;
const brief = document.getElementById("lesson-brief")!;
const practice = document.getElementById("lesson-practice")!;
const pathProgress = document.getElementById("path-progress")!;
const sidebar = document.getElementById("sidebar")!;
const panel = document.getElementById("panel")!;

const viewport = new Viewport(stage);

const manager = new LessonManager(
  viewport,
  [
    new FoundationsLesson(),
    new NumberSenseFractionsLesson(),
    new ArithmeticOperationsLesson(),
    new OrderOfOperationsLesson(),
    new TimesTablesLesson(),
    new MultiplicationDivisionLesson(),
    new AlgebraicLawsLesson(),
    new UnitConversionsLesson(),
    new RearrangingEquationsLesson(),
    new PowersLesson(),
    new LogarithmsLesson(),
    new BinomialsLesson(),
    new PascalTriangleLesson(),
    new ProbabilityLesson(),
    new MarkovChainsLesson(),
    new StochasticProcessesLesson(),
    new VectorsLesson(),
    new ComplexNumbersLesson(),
    new PrimeNumbersLesson(),
    new MersennePrimesLesson(),
    new GeometryLesson(),
    new TriangleTheoremsLesson(),
    new TriangleTransformationsLesson(),
    new QuadrilateralsLesson(),
    new CircleGlossaryLesson(),
    new CircleTheoremsLesson(),
    new CircleCalculationsLesson(),
    new VolumeLesson(),
    new ConicSectionsLesson(),
    new RadiansLesson(),
    new TrigonometricFunctionsLesson(),
    new WaveformsLesson(),
    new FourierSeriesLesson(),
    new DifferentiationLesson(),
    new IntegrationLesson(),
    new OptimizationLesson(),
    new TaylorSeriesLesson(),
    new VectorFieldLesson(),
    new KinematicsLesson(),
    new ProjectileMotionLesson(),
    new NewtonsLawsLesson(),
    new MomentumImpulseLesson(),
    new UniversalGravitationLesson(),
    new MomentsLesson(),
    new LoadPathLesson(),
    new MiterSawCutsLesson(),
    new PulleysLesson(),
    new AtwoodMachineLesson(),
    new CollisionsLesson(),
    new StressStrainLesson(),
    new PendulumLesson(),
    new PhysicalWavesLesson(),
    new ElectricalCircuitsLesson(),
    new ShadowsEarthSizeLesson(),
    new ShaderPlaygroundLesson(),
  ],
  { nav, info, guiHost, search, count, meta, brief, practice, pathProgress },
);

const shell = new MobileShell(
  {
    navToggle: document.getElementById("nav-toggle") as HTMLButtonElement,
    panelToggle: document.getElementById("panel-toggle") as HTMLButtonElement,
    prevLesson: document.getElementById("prev-lesson") as HTMLButtonElement,
    nextLesson: document.getElementById("next-lesson") as HTMLButtonElement,
    backdrop: document.getElementById("sheet-backdrop")!,
    topbarLesson: document.getElementById("topbar-lesson")!,
    hint: stage.querySelector(".hint") as HTMLElement,
    sidebar,
    panel,
  },
  {
    previous: () => manager.previous(),
    next: () => manager.next(),
  },
);

manager.onSelect((lesson) => {
  shell.onLessonSelected(lesson.title.replace(/^\d+\s*·\s*/, ""));
});

manager.start(location.hash.slice(1) || undefined);

// Test/debug hook: expose internals so the automated browser tests can introspect
// runtime state (active lesson, viewport). Only attached during dev/test builds.
if (import.meta.env.DEV) {
  (window as unknown as { __lab: unknown }).__lab = { viewport, manager, shell };
}
