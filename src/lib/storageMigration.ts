export function migrateLocalStorageKey(from: string, to: string): void {
  if (typeof localStorage === "undefined") return;

  try {
    if (localStorage.getItem(to) != null) return;
    const value = localStorage.getItem(from);
    if (value == null) return;
    localStorage.setItem(to, value);
    localStorage.removeItem(from);
  } catch {}
}
