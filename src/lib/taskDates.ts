import { DateTime } from "luxon";

const TIME_PARSE_FORMATS = ["h:mma", "h:mm a", "ha", "h a", "HH:mm", "H:mm"] as const;

function parseTimeFragment(s: string): { hour: number; minute: number } | undefined {
  const lower = s.toLowerCase();
  for (const fmt of TIME_PARSE_FORMATS) {
    const dt = DateTime.fromFormat(s, fmt, { zone: "local" });
    if (dt.isValid) return { hour: dt.hour, minute: dt.minute };
    const dt2 = DateTime.fromFormat(lower, fmt, { zone: "local" });
    if (dt2.isValid) return { hour: dt2.hour, minute: dt2.minute };
  }
  return undefined;
}

/** e.g. 4/163:00pm → Apr 16 (local), 3:00 PM — month/day immediately followed by time, no space. */
function parseCompactMdLocalDateTime(trimmed: string): Date | undefined {
  const now = DateTime.now().setZone("local");
  const slashes = trimmed.match(/\//g)?.length ?? 0;

  if (slashes === 2) {
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.+)$/);
    if (!m) return undefined;
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    const timeStr = m[4];
    if (month < 1 || month > 12 || day < 1 || day > 31 || !timeStr) return undefined;
    const tm = parseTimeFragment(timeStr);
    if (!tm) return undefined;
    let dt = DateTime.fromObject(
      { year, month, day, hour: tm.hour, minute: tm.minute, second: 0, millisecond: 0 },
      { zone: "local" },
    );
    if (!dt.isValid) return undefined;
    return dt.toJSDate();
  }

  if (slashes !== 1) return undefined;

  const m = trimmed.match(/^(\d{1,2})\/(.+)$/);
  if (!m) return undefined;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return undefined;
  const after = m[2];
  if (!after) return undefined;

  for (const dayLen of [2, 1] as const) {
    if (after.length <= dayLen) continue;
    const dayStr = after.slice(0, dayLen);
    const timeStr = after.slice(dayLen);
    const day = Number(dayStr);
    if (day < 1 || day > 31) continue;
    const tm = parseTimeFragment(timeStr);
    if (!tm) continue;
    let dt = DateTime.fromObject(
      { year: now.year, month, day, hour: tm.hour, minute: tm.minute, second: 0, millisecond: 0 },
      { zone: "local" },
    );
    if (!dt.isValid) continue;
    if (dt.startOf("day") < now.startOf("day")) {
      dt = dt.plus({ years: 1 });
    }
    return dt.toJSDate();
  }

  return undefined;
}

export function parseDueLocalInput(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const dt = DateTime.fromISO(trimmed);
  if (dt.isValid) return dt.toJSDate();
  return parseCompactMdLocalDateTime(trimmed);
}

export function formatTaskDue(d: Date): string {
  return DateTime.fromJSDate(d).toLocaleString(DateTime.DATETIME_MED);
}

export function taskDueToIso(d: Date): string {
  return DateTime.fromJSDate(d).toISO() ?? "";
}


export function isTaskDueToday(d: Date | undefined): boolean {
  if (!d) return false;
  const due = DateTime.fromJSDate(d).startOf("day");
  const today = DateTime.now().startOf("day");
  return due.equals(today);
}
