export type TaskPriority = "low" | "medium" | "high";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type TaskRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
};

export function parseTaskRecurrence(raw: unknown): TaskRecurrence | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const f = o.frequency;
  if (f !== "daily" && f !== "weekly" && f !== "monthly") return undefined;
  const n = o.interval;
  const interval =
    typeof n === "number" && Number.isFinite(n) && n >= 1
      ? Math.min(Math.floor(n), 365)
      : 1;
  return { frequency: f, interval };
}

/** Trim, drop empties, dedupe case-insensitively (keeps first casing). */
export function normalizeTaskTags(input: unknown): string[] | undefined {
  if (input == null) return undefined;
  const raw = Array.isArray(input) ? input : [];
  const list = raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out.length ? out : undefined;
}

/** Comma-separated tags from a single form field. */
export function parseTagsInput(s: string): string[] | undefined {
  return normalizeTaskTags(s.split(/,/));
}

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  priority?: TaskPriority;
  category?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  critical?: boolean;
  recurrence?: TaskRecurrence;
};

export type AddTaskPayload = {
  title: string;
  dueDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  context?: "Early Morning" | "Morning" | "Afternoon" | "After School" | "Evening" | "Late Night";
  category?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  recurrence?: TaskRecurrence;
};
