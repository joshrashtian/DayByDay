import { DateTime } from "luxon";

export function parseCalendarDayArg(
  raw: string,
  fallback: DateTime,
): DateTime | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "today") return DateTime.local().startOf("day");
  if (v === "tomorrow")
    return DateTime.local().plus({ days: 1 }).startOf("day");
  if (v === "yesterday")
    return DateTime.local().minus({ days: 1 }).startOf("day");

  const iso = DateTime.fromISO(v, { zone: "local" }).startOf("day");
  if (iso.isValid) return iso;

  const md = DateTime.fromFormat(v, "M/d", { zone: "local" });
  if (md.isValid) {
    let withYear = md.set({ year: fallback.year }).startOf("day");
    if (withYear < fallback.startOf("day"))
      withYear = withYear.plus({ years: 1 });
    return withYear;
  }

  return undefined;
}

export function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}
