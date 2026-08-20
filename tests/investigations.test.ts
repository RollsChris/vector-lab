import { describe, expect, it } from "vitest";
import {
  INVESTIGATION_LESSONS,
  INVESTIGATION_STAGES,
  investigationLessonById,
  lessonOpensExperiments,
  stageForInvestigationId,
} from "../src/investigations/roadmap";
import { InvestigationProgress } from "../src/investigations/progress";
import {
  APPROVED_READING_HOSTS,
  isApprovedReadingUrl,
  readingHost,
} from "../src/investigations/readings";
import {
  CLAIM_STATUSES,
  containsProofClaimPhrase,
  isClaimStatus,
  RH_EVIDENCE_CAVEAT,
} from "../src/investigations/status";
import {
  computeExperimentSample,
  experimentControlsKey,
} from "../src/investigations/experiments/ExperimentsView";
import {
  hardyZ,
  sampleHardyZ,
  signChanges,
  zetaFromEta,
} from "../src/investigations/experiments/hardyZ";
import {
  FIRST_CRITICAL_LINE_ZEROS,
  ZERO_DATA_SOURCE,
} from "../src/investigations/experiments/zeros";

/** Mirrors InvestigationApp.resolveLesson selection order for unit coverage. */
function resolveInvestigationLesson(
  activeLessonId: number | null,
  lastVisited: number | undefined,
) {
  if (activeLessonId != null) {
    const selected = investigationLessonById(activeLessonId);
    if (selected) return selected;
  }
  return investigationLessonById(lastVisited ?? 1) ?? INVESTIGATION_LESSONS[0]!;
}

const OVERCLAIM =
  /proves the riemann hypothesis|proves rh|solves the riemann hypothesis|solves rh|rh is proved|proof of the riemann hypothesis|we prove rh|app proves rh|this (app|tool|page) proves/i;

function collectAuthoredStrings(): string[] {
  const out: string[] = [RH_EVIDENCE_CAVEAT];
  for (const stage of INVESTIGATION_STAGES) {
    out.push(stage.title, stage.goal, stage.orientation);
    for (const r of stage.readings) {
      out.push(r.label);
      if (r.locator) out.push(r.locator);
      if (r.url) out.push(r.url);
    }
  }
  for (const lesson of INVESTIGATION_LESSONS) {
    out.push(
      lesson.title,
      lesson.outcome,
      lesson.concept,
      lesson.explanation,
      lesson.whyItMatters,
      lesson.task.prompt,
    );
    if (lesson.task.hint) out.push(lesson.task.hint);
    if (lesson.task.answer) out.push(lesson.task.answer);
    for (const c of lesson.claims) out.push(c.text);
    for (const r of lesson.readings) {
      out.push(r.label);
      if (r.locator) out.push(r.locator);
      if (r.url) out.push(r.url);
    }
  }
  return out;
}

describe("investigations roadmap", () => {
  it("has exactly 100 contiguous lesson ids", () => {
    expect(INVESTIGATION_LESSONS).toHaveLength(100);
    expect(INVESTIGATION_LESSONS.map((l) => l.id)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 1),
    );
  });

  it("uses the eight named stages with contiguous ranges covering 1..100", () => {
    expect(INVESTIGATION_STAGES).toHaveLength(8);
    expect(INVESTIGATION_STAGES.map((s) => s.title)).toEqual([
      "Foundations",
      "Complex and harmonic analysis",
      "Multiplicative number theory",
      "Core analytic number theory",
      "Functional, Fourier, and spectral methods",
      "L-functions and modern analytic number theory",
      "Equivalent criteria and computation",
      "Research apprenticeship",
    ]);
    expect(INVESTIGATION_STAGES.map((s) => [s.fromId, s.toId])).toEqual([
      [1, 12],
      [13, 26],
      [27, 36],
      [37, 55],
      [56, 66],
      [67, 78],
      [79, 91],
      [92, 100],
    ]);

    let expected = 1;
    for (const stage of INVESTIGATION_STAGES) {
      expect(stage.lessons[0]?.id).toBe(stage.fromId);
      expect(stage.lessons[stage.lessons.length - 1]?.id).toBe(stage.toId);
      for (const lesson of stage.lessons) {
        expect(lesson.id).toBe(expected);
        expected += 1;
      }
    }
    expect(expected).toBe(101);
  });

  it("requires title, outcome and at least one valid status claim per lesson", () => {
    for (const lesson of INVESTIGATION_LESSONS) {
      expect(lesson.title.length).toBeGreaterThan(3);
      expect(lesson.outcome.length).toBeGreaterThan(10);
      expect(lesson.claims.length).toBeGreaterThan(0);
      for (const claim of lesson.claims) {
        expect(isClaimStatus(claim.status)).toBe(true);
        expect(claim.text.length).toBeGreaterThan(10);
      }
    }
    expect(CLAIM_STATUSES.length).toBe(5);
  });

  it("populates item-specific study fields and stage orientations/readings", () => {
    for (const stage of INVESTIGATION_STAGES) {
      expect(stage.orientation.length).toBeGreaterThan(40);
      expect(stage.readings.length).toBeGreaterThan(0);
    }
    const concepts = new Set<string>();
    const whys = new Set<string>();
    const tasks = new Set<string>();
    for (const lesson of INVESTIGATION_LESSONS) {
      expect(lesson.concept.length).toBeGreaterThan(5);
      expect(lesson.explanation.length).toBeGreaterThan(40);
      expect(lesson.whyItMatters.length).toBeGreaterThan(40);
      expect(lesson.task.prompt.length).toBeGreaterThan(20);
      expect(lesson.readings.length).toBeGreaterThan(0);
      concepts.add(lesson.concept);
      whys.add(lesson.whyItMatters);
      tasks.add(lesson.task.prompt);
      const stage = stageForInvestigationId(lesson.id);
      expect(stage).toBeTruthy();
      expect(stage!.lessons.some((l) => l.id === lesson.id)).toBe(true);
    }
    // Item-specific: not a single repeated template across the path.
    expect(concepts.size).toBeGreaterThan(80);
    expect(whys.size).toBeGreaterThan(80);
    expect(tasks.size).toBeGreaterThan(80);
  });

  it("requires every prerequisite id to exist and be strictly earlier", () => {
    const ids = new Set(INVESTIGATION_LESSONS.map((l) => l.id));
    for (const lesson of INVESTIGATION_LESSONS) {
      for (const pre of lesson.prerequisites) {
        expect(ids.has(pre)).toBe(true);
        expect(pre).toBeLessThan(lesson.id);
      }
    }
  });

  it("never asserts that the app proves or solves RH", () => {
    const corpus = collectAuthoredStrings().join("\n");
    expect(containsProofClaimPhrase(corpus)).toBe(false);
    expect(OVERCLAIM.test(corpus)).toBe(false);
    expect(RH_EVIDENCE_CAVEAT).toBe(
      "RH is unsolved; a finite computation is evidence, never a proof.",
    );
  });

  it("allows only HTTPS URLs on the approved reading host list (or omits URL)", () => {
    const urls: string[] = [];
    for (const stage of INVESTIGATION_STAGES) {
      for (const r of stage.readings) if (r.url) urls.push(r.url);
    }
    for (const lesson of INVESTIGATION_LESSONS) {
      for (const r of lesson.readings) if (r.url) urls.push(r.url);
    }
    expect(urls.length).toBeGreaterThan(10);
    for (const url of urls) {
      expect(url.startsWith("https://")).toBe(true);
      expect(isApprovedReadingUrl(url)).toBe(true);
      const host = readingHost(url);
      expect(host).toBeTruthy();
      expect(APPROVED_READING_HOSTS).toContain(host!);
    }
  });

  it("opens Experiments only for Hardy-Z related lessons", () => {
    const openIds = INVESTIGATION_LESSONS.filter(lessonOpensExperiments).map((l) => l.id);
    expect(openIds).toEqual([53, 54, 89, 90, 91, 95]);
  });
});

describe("investigation progress resume selection", () => {
  it("prefers in-session selection, else lastVisited, else item 1", () => {
    expect(resolveInvestigationLesson(null, undefined).id).toBe(1);
    expect(resolveInvestigationLesson(null, 7).id).toBe(7);
    expect(resolveInvestigationLesson(12, 7).id).toBe(12);
    // Invalid active falls through to lastVisited.
    expect(resolveInvestigationLesson(999, 7).id).toBe(7);
  });

  it("persists lastVisited across store instances without clobbering on re-read", () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
      clear: () => memory.clear(),
      key: () => null,
      length: 0,
    } satisfies Storage;

    const a = new InvestigationProgress(storage);
    a.recordVisit(7);
    expect(a.lastVisited).toBe(7);

    const b = new InvestigationProgress(storage);
    expect(b.lastVisited).toBe(7);
    // Re-recording the same id is a no-op (must not wipe storage).
    b.recordVisit(7);
    expect(JSON.parse(memory.get("vector-lab:investigations-progress:v1")!).last).toBe(7);
  });
});

describe("published zeros", () => {
  it("ships the first ten positive zeros with source metadata", () => {
    expect(FIRST_CRITICAL_LINE_ZEROS).toHaveLength(10);
    expect(FIRST_CRITICAL_LINE_ZEROS[0]?.t).toBeCloseTo(14.134725, 5);
    expect(FIRST_CRITICAL_LINE_ZEROS[1]?.t).toBeCloseTo(21.022039, 5);
    expect(ZERO_DATA_SOURCE.label.length).toBeGreaterThan(10);
    expect(ZERO_DATA_SOURCE.references.length).toBeGreaterThan(0);
    for (let i = 1; i < FIRST_CRITICAL_LINE_ZEROS.length; i++) {
      expect(FIRST_CRITICAL_LINE_ZEROS[i]!.t).toBeGreaterThan(FIRST_CRITICAL_LINE_ZEROS[i - 1]!.t);
      expect(FIRST_CRITICAL_LINE_ZEROS[i]!.index).toBe(i + 1);
    }
  });
});

describe("hardy Z numerics", () => {
  it("matches the known negative value of zeta(1/2) at t = 0", () => {
    const z = zetaFromEta(0.5, 0, 8000);
    expect(z.im).toBeCloseTo(0, 2);
    // ζ(1/2) ≈ -1.4603545
    expect(z.re).toBeCloseTo(-1.46035, 1);
  });

  it("is approximately real on the critical line for modest t", () => {
    const sample = hardyZ(14.0, 6000);
    expect(Math.abs(sample.imagResidual)).toBeLessThan(0.15);
  });

  it("detects a sign change near the first published zero", () => {
    const t0 = FIRST_CRITICAL_LINE_ZEROS[0]!.t;
    const path = sampleHardyZ(t0 - 0.4, t0 + 0.4, 40, 6000);
    const changes = signChanges(path);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.tLeft <= t0 && t0 <= c.tRight)).toBe(true);
  });
});

describe("experiment sample cache keys", () => {
  it("keys samples by math controls only (resize must reuse same key)", () => {
    const a = { tMax: 40, samples: 200, terms: 2500, zeroCount: 5 };
    const b = { tMax: 40, samples: 200, terms: 2500, zeroCount: 5 };
    const c = { tMax: 30, samples: 200, terms: 2500, zeroCount: 5 };
    expect(experimentControlsKey(a)).toBe(experimentControlsKey(b));
    expect(experimentControlsKey(a)).not.toBe(experimentControlsKey(c));
  });

  it("computeExperimentSample returns path/changes/published matching controls", () => {
    const controls = { tMax: 30, samples: 120, terms: 1500, zeroCount: 3 };
    const sample = computeExperimentSample(controls);
    expect(sample.key).toBe(experimentControlsKey(controls));
    expect(sample.path).toHaveLength(120);
    expect(sample.path[0]?.t).toBe(0);
    expect(sample.path[sample.path.length - 1]?.t).toBe(30);
    expect(sample.published.length).toBeGreaterThan(0);
    expect(sample.published.every((z) => z.t <= 30 && z.index <= 3)).toBe(true);
    expect(sample.changes.length).toBeGreaterThan(0);
    expect(Number.isFinite(sample.atProbe.imagResidual)).toBe(true);
  });

  it("identical controls yield identical cache keys so resize can redraw without recompute", () => {
    const controls = { tMax: 20, samples: 120, terms: 1500, zeroCount: 3 };
    const first = computeExperimentSample(controls);
    const second = computeExperimentSample(controls);
    expect(second.key).toBe(first.key);
    expect(second.path).toHaveLength(first.path.length);
    expect(second.published).toEqual(first.published);
  });
});

describe("Robin criterion wording", () => {
  it("states equivalence for n > 5040 (strict), not n ≥ 5040", () => {
    const robin = investigationLessonById(85);
    expect(robin).toBeTruthy();
    expect(robin!.outcome).toContain("n > 5040");
    expect(robin!.outcome).not.toMatch(/n\s*≥\s*5040|n\s*>=\s*5040/);
    const claim = robin!.claims[0]!;
    expect(claim.status).toBe("equivalent-criterion");
    expect(claim.text).toContain("n > 5040");
    expect(claim.text).not.toMatch(/n\s*≥\s*5040|n\s*>=\s*5040/);
  });
});

describe("claim status labels for methodological / factual statements", () => {
  it("labels lesson 98 claim hygiene as heuristic, not theorem", () => {
    const lesson = investigationLessonById(98);
    expect(lesson).toBeTruthy();
    expect(lesson!.claims[0]!.status).toBe("heuristic");
    expect(lesson!.claims[0]!.text).toMatch(/quantifiers and hypotheses/i);
  });

  it("labels lesson 100 no-accepted-RH-proof fact as heuristic, not conjecture", () => {
    const lesson = investigationLessonById(100);
    expect(lesson).toBeTruthy();
    expect(lesson!.claims[0]!.status).toBe("heuristic");
    expect(lesson!.claims[0]!.text).toMatch(/no complete accepted proof of RH/i);
  });
});
