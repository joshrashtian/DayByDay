import { DateTime } from "luxon";

export function parseDueLocalInput(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const dt = DateTime.fromISO(trimmed);
  return dt.isValid ? dt.toJSDate() : undefined;
}

export function formatTaskDue(d: Date): string {
  return DateTime.fromJSDate(d).toLocaleString(DateTime.DATETIME_MED);
}

export function taskDueToIso(d: Date): string {
  return DateTime.fromJSDate(d).toISO() ?? "";
}
