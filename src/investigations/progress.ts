const STORAGE_KEY = "vector-lab:investigations-progress:v1";

interface InvestigationProgressState {
  completed: number[];
  last?: number;
}

/**
 * Separate local-only progress for the Investigations roadmap.
 * Never shares keys or ids with the main 56-lesson Progress store.
 */
export class InvestigationProgress {
  private state: InvestigationProgressState = { completed: [] };
  private readonly listeners = new Set<() => void>();
  private storageAvailable = true;

  constructor(private readonly storage: Storage | undefined = safeStorage()) {
    if (!this.storage) {
      this.storageAvailable = false;
      return;
    }
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<InvestigationProgressState>;
      const completed = Array.isArray(parsed.completed)
        ? parsed.completed.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= 100)
        : [];
      const last =
        typeof parsed.last === "number" && Number.isInteger(parsed.last) && parsed.last >= 1 && parsed.last <= 100
          ? parsed.last
          : undefined;
      this.state = { completed, last };
    } catch {
      this.state = { completed: [] };
    }
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isComplete(id: number): boolean {
    return this.state.completed.includes(id);
  }

  setComplete(id: number, complete: boolean): void {
    if (id < 1 || id > 100) return;
    const already = this.isComplete(id);
    if (already === complete) return;
    this.state.completed = complete
      ? [...this.state.completed, id]
      : this.state.completed.filter((x) => x !== id);
    this.persist();
  }

  toggleComplete(id: number): boolean {
    const next = !this.isComplete(id);
    this.setComplete(id, next);
    return next;
  }

  recordVisit(id: number): void {
    if (id < 1 || id > 100 || this.state.last === id) return;
    this.state.last = id;
    this.persist(false);
  }

  get lastVisited(): number | undefined {
    return this.state.last;
  }

  overall(): { done: number; total: number; percent: number } {
    const total = 100;
    const done = this.state.completed.length;
    return { done, total, percent: Math.round((done / total) * 100) };
  }

  get isPersistent(): boolean {
    return this.storageAvailable;
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

function safeStorage(): Storage | undefined {
  try {
    const probe = "__vector_lab_inv_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return undefined;
  }
}
