export type TaskPriority = "low" | "medium" | "high";
export type TaskKind = "task" | "event" | "reminder" | "habit" | "class";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type TaskRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
  untilDate?: Date;
};

export type TaskMetadata = {
  class?: {
    location?: string;
    grade?: string;
  };
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
  const rawUntilDate = o.untilDate;
  const untilDate =
    rawUntilDate != null && rawUntilDate !== ""
      ? new Date(String(rawUntilDate))
      : undefined;
  return {
    frequency: f,
    interval,
    ...(untilDate && Number.isFinite(untilDate.getTime()) ? { untilDate } : {}),
  };
}

export function parseTaskKind(raw: unknown): TaskKind | undefined {
  if (
    raw === "task" ||
    raw === "event" ||
    raw === "reminder" ||
    raw === "habit" ||
    raw === "class"
  )
    return raw;
  if (raw === "todo") return "task";
  return undefined;
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
  kind: TaskKind;
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  block?: string;
  category?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  metadata?: TaskMetadata;
  // Legacy fields kept for backwards compatibility.
  classLocation?: string;
  classGrade?: string;
  critical?: boolean;
  recurrence?: TaskRecurrence;
  lastCompletedAt?: Date;
  recurringSourceId?: string;
};

export type AddTaskPayload = {
  kind?: TaskKind;
  title: string;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  block?: string;
  context?: string;
  category?: string;
  description?: string;
  notes?: string;
  metadata?: TaskMetadata;
  // Legacy fields kept for backwards compatibility.
  classLocation?: string;
  classGrade?: string;
  tags?: string[];
  recurrence?: TaskRecurrence;
};

export type UpdateTaskPayload = {
  kind?: TaskKind;
  title: string;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  block?: string;
  category?: string;
  description?: string;
  notes?: string;
  metadata?: TaskMetadata;
  // Legacy fields kept for backwards compatibility.
  classLocation?: string;
  classGrade?: string;
  tags?: string[];
  recurrence?: TaskRecurrence;
};
