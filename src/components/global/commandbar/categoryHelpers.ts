export function parseCategoryPartialLabel(label: string): string {
  const m = label.match(/^Category:\s*(.*)\.\.\.$/);
  if (!m) return "";
  return m[1]?.trim() ?? "";
}

export function sanitizeCategoryValue(value: string): string {
  return value
    .trim()
    .replace(/^["'"'`]+|["'"'`]+$/g, "")
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

export function extractInlineCategoryQuery(raw: string): string | null {
  if (!raw || /\s$/.test(raw)) return null;

  const m = raw.match(
    /(?:^|\s)@@(?:"([^"]*)"?|'([^']*)'?|\u201c([^"]*)\u201d?|\u2018([^']*)\u2019?|([^\s]*))$/,
  );
  if (!m) return null;

  const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? "";
  return sanitizeCategoryValue(value);
}
