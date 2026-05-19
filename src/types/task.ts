export type {
  TaskPriority,
  TaskKind,
  RecurrenceFrequency,
  RecurrenceWeekday,
  TaskRecurrence,
  TaskMetadata,
  Task,
  AddTaskPayload,
  UpdateTaskPayload,
} from "./index";

import type { RecurrenceWeekday, TaskRecurrence, TaskKind } from "./index";

export function normalizeRecurrenceWeekdays(
  input: unknown,
): RecurrenceWeekday[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const seen = new Set<number>();
  const out: RecurrenceWeekday[] = [];
  for (const raw of input) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const value = Math.floor(raw);
    if (value < 1 || value > 7 || seen.has(value)) continue;
    seen.add(value);
    out.push(value as RecurrenceWeekday);
  }
  out.sort((a, b) => a - b);
  return out.length ? out : undefined;
}

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
  const weekdays = normalizeRecurrenceWeekdays(o.weekdays);
  return {
    frequency: f,
    interval,
    ...(f === "weekly" && weekdays ? { weekdays } : {}),
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
