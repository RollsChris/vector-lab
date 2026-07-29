import { CURRICULUM_ORDER, STAGES } from "../curriculum/stages";

const STORAGE_KEY = "vector-lab:progress:v1";

interface ProgressState {
  /** Lesson ids the learner has marked complete. */
  completed: string[];
  /** Last lesson opened, used to offer "continue where you left off". */
  last?: string;
}

/**
 * Persistent, local-only learner progress.
 *
 * Progress is deliberately manual: a lesson counts as done when the learner says it is,
 * after answering the self-check questions. Storage failures (private mode, disabled
 * storage, quota) degrade to an in-memory session rather than breaking the app.
 */
export class Progress {
  private state: ProgressState = { completed: [] };
  private readonly listeners = new Set<() => void>();
  private storageAvailable = true;

  constructor(private readonly storage: Storage | undefined = safeStorage()) {
    if (!this.storage) {
      this.storageAvailable = false;
      return;
    }
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProgressState>;
        const completed = Array.isArray(parsed.completed) ? parsed.completed.filter(isString) : [];
        this.state = { completed, last: isString(parsed.last) ? parsed.last : undefined };
      }
    } catch {
      // Corrupt payload: start clean rather than trapping the learner on a broken state.
      this.state = { completed: [] };
    }
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isComplete(lessonId: string): boolean {
    return this.state.completed.includes(lessonId);
  }

  setComplete(lessonId: string, complete: boolean): void {
    const already = this.isComplete(lessonId);
    if (already === complete) return;
    this.state.completed = complete
      ? [...this.state.completed, lessonId]
      : this.state.completed.filter((id) => id !== lessonId);
    this.persist();
  }

  toggleComplete(lessonId: string): boolean {
    const next = !this.isComplete(lessonId);
    this.setComplete(lessonId, next);
    return next;
  }

  recordVisit(lessonId: string): void {
    if (this.state.last === lessonId) return;
    this.state.last = lessonId;
    this.persist(false);
  }

  get lastVisited(): string | undefined {
    return this.state.last;
  }

  /** Completed count within one stage. */
  stageProgress(stageId: string): { done: number; total: number } {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) return { done: 0, total: 0 };
    const done = stage.lessons.filter((id) => this.isComplete(id)).length;
    return { done, total: stage.lessons.length };
  }

  /** Completed count across the whole curriculum. */
  overall(): { done: number; total: number; percent: number } {
    const total = CURRICULUM_ORDER.length;
    const done = CURRICULUM_ORDER.filter((id) => this.isComplete(id)).length;
    return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  /** First curriculum lesson not yet marked complete — the natural "resume here" target. */
  nextUnfinished(): string | undefined {
    return CURRICULUM_ORDER.find((id) => !this.isComplete(id));
  }

  /** True when storage is writable; used to warn that progress will not survive a reload. */
  get isPersistent(): boolean {
    return this.storageAvailable;
  }

  reset(): void {
    this.state = { completed: [] };
    this.persist();
  }

  private persist(notify = true): void {
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        this.storageAvailable = false;
      }
    }
    if (notify) for (const listener of this.listeners) listener();
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function safeStorage(): Storage | undefined {
  try {
    const probe = "__vector_lab_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return undefined;
  }
}
