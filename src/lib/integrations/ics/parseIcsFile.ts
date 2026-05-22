import { DateTime } from "luxon";

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  dueDate: Date;
  endDate?: Date;
  location?: string;
  category?: string;
};

export type ParseIcsResult = {
  events: ParsedIcsEvent[];
  skipped: number;
};

function unfoldIcsLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const raw = normalized.split("\n");
  const lines: string[] = [];

  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
      continue;
    }
    lines.push(line);
  }

  return lines;
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\N/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsProperty(line: string): { key: string; value: string } | null {
  const colon = line.indexOf(":");
  if (colon <= 0) return null;
  const rawKey = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const key = rawKey.split(";")[0]?.toUpperCase();
  if (!key) return null;
  return { key, value };
}

function parseIcsDateValue(raw: string): Date | undefined {
  const value = raw.trim();
  if (!value) return undefined;

  const dateTimeMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i);
  if (dateTimeMatch) {
    const [, y, mo, d, h, mi, s, z] = dateTimeMatch;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? "Z" : ""}`;
    const dt = DateTime.fromISO(iso, z ? { setZone: true } : { zone: "local" });
    return dt.isValid ? dt.toJSDate() : undefined;
  }

  const dateOnlyMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, mo, d] = dateOnlyMatch;
    const dt = DateTime.fromISO(`${y}-${mo}-${d}`, { zone: "local" }).endOf("day");
    return dt.isValid ? dt.toJSDate() : undefined;
  }

  const colonIdx = value.lastIndexOf(":");
  if (colonIdx !== -1) {
    return parseIcsDateValue(value.slice(colonIdx + 1));
  }

  return undefined;
}

function parseVeventBlock(lines: string[]): ParsedIcsEvent | null {
  const fields = new Map<string, string>();

  for (const line of lines) {
    const prop = parseIcsProperty(line);
    if (!prop) continue;
    fields.set(prop.key, unescapeIcsText(prop.value));
  }

  const uid = fields.get("UID")?.trim();
  const title = fields.get("SUMMARY")?.trim();
  const dueDate = parseIcsDateValue(fields.get("DTSTART") ?? "");
  if (!uid || !title || !dueDate) return null;

  const endDateRaw = fields.get("DTEND");
  const endDate = endDateRaw ? parseIcsDateValue(endDateRaw) : undefined;
  const location = fields.get("LOCATION")?.trim() || undefined;
  const category = fields.get("CATEGORIES")?.trim() || undefined;

  return {
    uid,
    title,
    dueDate,
    ...(endDate && endDate > dueDate ? { endDate } : {}),
    ...(location ? { location } : {}),
    ...(category ? { category } : {}),
  };
}

export function parseIcsFile(text: string): ParseIcsResult {
  const lines = unfoldIcsLines(text);
  const events: ParsedIcsEvent[] = [];
  let skipped = 0;
  let current: string[] = [];
  let inEvent = false;

  const flush = () => {
    if (!inEvent || current.length === 0) return;
    const parsed = parseVeventBlock(current);
    if (parsed) events.push(parsed);
    else skipped += 1;
    current = [];
    inEvent = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      flush();
      inEvent = true;
      continue;
    }
    if (trimmed === "END:VEVENT") {
      flush();
      continue;
    }
    if (inEvent) current.push(line);
  }

  flush();
  return { events, skipped };
}
