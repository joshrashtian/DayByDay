const CATEGORY_QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['"', '"'],
  ["'", "'"],
  ["\u201c", "\u201d"],
  ["\u2018", "\u2019"],
];

export type ParsedLeadingCategory =
  | { kind: "complete"; value: string; consumed: number; remaining: string }
  | { kind: "partial"; fragment: string };

export function parseCategoryPartialLabel(label: string): string {
  const m = label.match(/^Category:\s*(.*)\.\.\.$/);
  if (!m) return "";
  return m[1]?.trim() ?? "";
}

export function sanitizeCategoryValue(value: string): string {
  return value
    .trim()
    .replace(/^["'"'`\u201c\u201d\u2018\u2019]+|["'"'`\u201c\u201d\u2018\u2019]+$/g, "")
    .replace(/\s+/g, " ");
}

export function formatCategoryToken(value: string): string {
  const cleaned = sanitizeCategoryValue(value);
  if (!cleaned) return "";
  if (/\s/.test(cleaned)) {
    return `@@"${cleaned.replace(/"/g, "")}"`;
  }
  return `@@${cleaned}`;
}

/** Parse a leading @@ category token from the start of `work`. */
export function parseLeadingCategoryToken(
  work: string,
): ParsedLeadingCategory | null {
  if (!work.startsWith("@@")) return null;

  const rest = work.slice(2).replace(/^\s+/, "");
  const prefixLen = work.length - rest.length;

  for (const [open, close] of CATEGORY_QUOTE_PAIRS) {
    if (!rest.startsWith(open)) continue;

    const closeIdx = rest.indexOf(close, open.length);
    if (closeIdx < 0) {
      return { kind: "partial", fragment: rest.slice(open.length) };
    }

    const value = rest.slice(open.length, closeIdx).trim();
    const afterQuote = rest.slice(closeIdx + close.length);
    const trailingSpace = afterQuote.match(/^\s+/)?.[0] ?? "";

    if (!value) {
      return { kind: "partial", fragment: rest.slice(open.length, closeIdx) };
    }

    if (afterQuote.length === 0 || trailingSpace.length > 0) {
      const remaining = afterQuote.slice(trailingSpace.length);
      return {
        kind: "complete",
        value,
        consumed: prefixLen + (rest.length - remaining.length),
        remaining,
      };
    }

    return { kind: "partial", fragment: value };
  }

  const unquoted = rest.match(/^([\w.-]+)(\s|$)/);
  if (unquoted?.[1]) {
    const value = unquoted[1];
    const after = rest.slice(unquoted[0].length);
    const trailingSpace = after.match(/^\s+/)?.[0] ?? "";
    if (unquoted[2] === " " || trailingSpace.length > 0) {
      const remaining = after.slice(trailingSpace.length);
      return {
        kind: "complete",
        value,
        consumed: prefixLen + (rest.length - remaining.length),
        remaining,
      };
    }
    return { kind: "partial", fragment: value };
  }

  if (!rest) return { kind: "partial", fragment: "" };
  return { kind: "partial", fragment: rest };
}

/** Tail @@ fragment used for autocomplete (excludes title text after a closed quote). */
export function extractInlineCategoryQuery(raw: string): string | null {
  if (!raw || /\s$/.test(raw)) return null;

  const idx = raw.lastIndexOf("@@");
  if (idx < 0) return null;

  const tail = raw.slice(idx);
  const parsed = parseLeadingCategoryToken(tail);
  if (!parsed) return null;

  if (parsed.kind === "complete") {
    if (parsed.remaining.trim().length > 0) return null;
    return sanitizeCategoryValue(parsed.value);
  }

  return sanitizeCategoryValue(parsed.fragment);
}

/** Regex matching the trailing @@ token for replace-on-apply. */
export const CATEGORY_TOKEN_TAIL_RE =
  /@@(?:"[^"]*"|'[^']*'|\u201c[^\u201d]*\u201d|\u2018[^\u2019]*\u2019|[^\s]*)$/;
