import "./style.css";
import { Viewport } from "./core/Viewport";
import { LessonManager } from "./core/LessonManager";
import { MobileShell } from "./core/MobileShell";
import { TopicWorkspace } from "./core/TopicWorkspace";
import {
  InvestigationApp,
  isInvestigationHash,
} from "./investigations/InvestigationApp";
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
import { FibonacciGoldenRatioLesson } from "./lessons/FibonacciGoldenRatioLesson";
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
import { AstronomyLesson } from "./lessons/AstronomyLesson";
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
import { TrigonometryLabLesson } from "./lessons/TrigonometryLabLesson";
import { RearrangingEquationsLesson } from "./lessons/RearrangingEquationsLesson";
import { OrderOfOperationsLesson } from "./lessons/OrderOfOperationsLesson";
import { MultiplicationDivisionLesson } from "./lessons/MultiplicationDivisionLesson";
import { TimesTablesLesson } from "./lessons/TimesTablesLesson";
import { AlgebraicLawsLesson } from "./lessons/AlgebraicLawsLesson";
import { VectorsLesson } from "./lessons/VectorsLesson";
import { AnglesLesson } from "./lessons/AnglesLesson";
import { ParallelLinesLesson } from "./lessons/ParallelLinesLesson";
import { TriangleTheoremsLesson } from "./lessons/TriangleTheoremsLesson";
import { PythagorasLesson } from "./lessons/PythagorasLesson";
import { SimilarTrianglesLesson } from "./lessons/SimilarTrianglesLesson";
import { TriangleTransformationsLesson } from "./lessons/TriangleTransformationsLesson";
import { CircleGlossaryLesson } from "./lessons/CircleGlossaryLesson";
import { CircleTheoremsLesson } from "./lessons/CircleTheoremsLesson";
import { CircleCalculationsLesson } from "./lessons/CircleCalculationsLesson";
import { VolumeLesson } from "./lessons/VolumeLesson";
import { ConicSectionsLesson } from "./lessons/ConicSectionsLesson";
import { EllipseLesson } from "./lessons/EllipseLesson";
import { QuadrilateralsLesson } from "./lessons/QuadrilateralsLesson";
import { RadiansLesson } from "./lessons/RadiansLesson";
import { BinomialsLesson } from "./lessons/BinomialsLesson";
import { NumberSenseFractionsLesson } from "./lessons/NumberSenseFractionsLesson";
import { ArithmeticOperationsLesson } from "./lessons/ArithmeticOperationsLesson";
import { SacredGeometryLesson } from "./lessons/SacredGeometryLesson";
import { CoordinatesAndLinesLesson } from "./lessons/CoordinatesAndLinesLesson";
import { FunctionsAndGraphsLesson } from "./lessons/FunctionsAndGraphsLesson";
import { SimultaneousEquationsLesson } from "./lessons/SimultaneousEquationsLesson";
import { QuadraticsLesson } from "./lessons/QuadraticsLesson";
import { InequalitiesLesson } from "./lessons/InequalitiesLesson";
import { GraphTransformationsLesson } from "./lessons/GraphTransformationsLesson";
import { ExponentialLogGraphsLesson } from "./lessons/ExponentialLogGraphsLesson";
import { SequencesAndSeriesLesson } from "./lessons/SequencesAndSeriesLesson";
import { LimitsAndContinuityLesson } from "./lessons/LimitsAndContinuityLesson";
import { MatricesAsMapsLesson } from "./lessons/MatricesAsMapsLesson";

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
const lessonsChrome = document.getElementById("lessons-chrome")!;
const lessonsPanel = document.getElementById("lessons-panel")!;
const investigationsChrome = document.getElementById("investigations-chrome")!;
const investigationsStage = document.getElementById("investigations-stage")!;
const investigationsPanel = document.getElementById("investigations-panel")!;
const sectionSwitcher = document.getElementById("section-switcher")!;
const prevLessonBtn = document.getElementById("prev-lesson") as HTMLButtonElement;
const nextLessonBtn = document.getElementById("next-lesson") as HTMLButtonElement;

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
    new CoordinatesAndLinesLesson(),
    new FunctionsAndGraphsLesson(),
    new SimultaneousEquationsLesson(),
    new QuadraticsLesson(),
    new InequalitiesLesson(),
    new GraphTransformationsLesson(),
    new ExponentialLogGraphsLesson(),
    new SequencesAndSeriesLesson(),
    new LimitsAndContinuityLesson(),
    new MatricesAsMapsLesson(),
    new ProbabilityLesson(),
    new MarkovChainsLesson(),
    new StochasticProcessesLesson(),
    new VectorsLesson(),
    new ComplexNumbersLesson(),
    new FibonacciGoldenRatioLesson(),
    new PrimeNumbersLesson(),
    new MersennePrimesLesson(),
    new GeometryLesson(),
    new AnglesLesson(),
    new ParallelLinesLesson(),
    new TriangleTheoremsLesson(),
    new PythagorasLesson(),
    new SimilarTrianglesLesson(),
    new TriangleTransformationsLesson(),
    new QuadrilateralsLesson(),
    new CircleGlossaryLesson(),
    new CircleTheoremsLesson(),
    new CircleCalculationsLesson(),
    new VolumeLesson(),
    new ConicSectionsLesson(),
    new EllipseLesson(),
    new SacredGeometryLesson(),
    new RadiansLesson(),
    new TrigonometricFunctionsLesson(),
    new TrigonometryLabLesson(),
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
    new AstronomyLesson(),
    new ShaderPlaygroundLesson(),
  ],
  { nav, info, guiHost, search, count, meta, brief, practice, pathProgress },
);

const workspace = new TopicWorkspace({
  panelLesson: document.getElementById("panel-tab-lesson") as HTMLButtonElement,
  panelAnimate: document.getElementById("panel-tab-animate") as HTMLButtonElement,
  tabbarLesson: document.getElementById("tabbar-lesson") as HTMLButtonElement,
  tabbarAnimate: document.getElementById("tabbar-animate") as HTMLButtonElement,
  pageLearn: document.getElementById("page-learn") as HTMLButtonElement,
  pagePractice: document.getElementById("page-practice") as HTMLButtonElement,
  lessonPanel: document.getElementById("topic-lesson")!,
  animatePanel: document.getElementById("topic-animate")!,
  learnPage: document.getElementById("lesson-learn")!,
  practicePage: document.getElementById("lesson-practice-page")!,
  tabbar: document.getElementById("topic-tabbar")!,
  desktopTabs: document.getElementById("topic-tabs-desktop")!,
});

const shell = new MobileShell(
  {
    navToggle: document.getElementById("nav-toggle") as HTMLButtonElement,
    controlsClose: document.getElementById("controls-close") as HTMLButtonElement,
    prevLesson: prevLessonBtn,
    nextLesson: nextLessonBtn,
    backdrop: document.getElementById("sheet-backdrop")!,
    topbarLesson: document.getElementById("topbar-lesson")!,
    hint: stage.querySelector(".hint") as HTMLElement,
    sidebar,
    panel,
    panelHandle: document.getElementById("panel-handle")!,
    controlDock: document.getElementById("control-dock")!,
    controlDockContent: document.getElementById("control-dock-content")!,
    guiHost,
    animatePanel: document.getElementById("topic-animate")!,
    info,
    tabbarLesson: document.getElementById("tabbar-lesson") as HTMLButtonElement,
  },
  {
    previous: () => manager.previous(),
    next: () => manager.next(),
  },
  workspace,
);

const investigations = new InvestigationApp(
  {
    chrome: investigationsChrome,
    stage: investigationsStage,
    panel: investigationsPanel,
  },
  {
    setHash: (hash, replace = false) => {
      const url = `#${hash}`;
      if (location.hash === url) return;
      if (replace) history.replaceState(null, "", url);
      else history.pushState(null, "", url);
    },
    onTitle: (title) => {
      shell.onLessonSelected(title);
      document.title = `${title} — Vector Lab`;
    },
  },
);

type AppSection = "lessons" | "investigations";
let section: AppSection = "lessons";

function setSectionTab(next: AppSection): void {
  for (const btn of sectionSwitcher.querySelectorAll<HTMLButtonElement>(".section-tab")) {
    const active = btn.dataset.section === next;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
  lessonsChrome.hidden = next !== "lessons";
  investigationsChrome.hidden = next !== "investigations";
}

/** Topbar lesson prev/next are lesson-only; disable them in Investigations. */
function setLessonStepControlsEnabled(enabled: boolean): void {
  prevLessonBtn.disabled = !enabled;
  nextLessonBtn.disabled = !enabled;
  prevLessonBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
  nextLessonBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
  shell.setControlsEnabled(enabled);
}

function showLessonsSection(hash: string | undefined, replaceHash = false): void {
  section = "lessons";
  setSectionTab("lessons");
  investigations.hide();
  lessonsPanel.hidden = false;
  stage.querySelector<HTMLElement>(".hint")!.hidden = false;
  viewport.renderer.domElement.hidden = false;
  viewport.resume();
  setLessonStepControlsEnabled(true);

  manager.setNavigationEnabled(true);
  const lessonHash = hash && !isInvestigationHash(hash) ? hash : undefined;
  if (manager.activeLesson) {
    if (lessonHash && manager.activeLesson.id !== lessonHash) {
      manager.selectById(lessonHash);
    }
  } else {
    manager.start(lessonHash);
  }

  if (replaceHash && manager.activeLesson && location.hash.slice(1) !== manager.activeLesson.id) {
    history.replaceState(null, "", `#${manager.activeLesson.id}`);
  }
}

function showInvestigationsSection(hash: string, replaceHash = false): void {
  section = "investigations";
  setSectionTab("investigations");
  manager.setNavigationEnabled(false);
  manager.suspend();
  setLessonStepControlsEnabled(false);
  viewport.pause();
  lessonsPanel.hidden = true;
  stage.querySelector<HTMLElement>(".hint")!.hidden = true;
  viewport.renderer.domElement.hidden = true;
  investigations.show(hash, replaceHash);
}

function routeFromHash(replaceHash = false): void {
  const hash = location.hash.slice(1);
  if (isInvestigationHash(hash)) {
    showInvestigationsSection(hash, replaceHash);
  } else {
    showLessonsSection(hash || undefined, replaceHash);
  }
}

for (const btn of sectionSwitcher.querySelectorAll<HTMLButtonElement>(".section-tab")) {
  btn.addEventListener("click", () => {
    const next = btn.dataset.section as AppSection;
    if (next === section) return;
    if (next === "investigations") {
      history.pushState(null, "", "#investigations");
      showInvestigationsSection("investigations", true);
    } else {
      const resume = manager.progressStore.lastVisited;
      const target = resume ?? "foundations";
      history.pushState(null, "", `#${target}`);
      showLessonsSection(target, true);
    }
  });
}

manager.onSelect((lesson) => {
  if (section !== "lessons") return;
  workspace.landOnLesson();
  shell.onLessonSelected(lesson.title.replace(/^\d+\s*·\s*/, ""));
});

// Investigations hashes must be claimed before LessonManager start, so a cold
// load of #investigations never mounts a normal lesson first.
routeFromHash(true);

window.addEventListener("hashchange", () => {
  routeFromHash(false);
});

// Test/debug hook: expose internals so the automated browser tests can introspect
// runtime state (active lesson, viewport). Only attached during dev/test builds.
if (import.meta.env.DEV) {
  (window as unknown as { __lab: unknown }).__lab = {
    viewport,
    manager,
    shell,
    workspace,
    investigations,
    section: () => section,
  };
}
