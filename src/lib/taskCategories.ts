import type { CategoryConfig, CategoryTone, Task } from "@/types";
import { useSettingsStore } from "../stores/settingsStore";

export type { CategoryConfig, CategoryTone } from "@/types";

/** @deprecated Use useSettingsStore subscription instead of event listeners */
export const CATEGORY_CONFIG_STORAGE_KEY = "daybyday-category-configs";
/** @deprecated Use useSettingsStore subscription instead of event listeners */
export const CATEGORY_CONFIGS_CHANGED = "daybyday:category-configs-changed";

type CategoryVisual = {
  bg: string;
  text: string;
  border: string;
  accent: string;
  icon?: string;
};

const DEFAULT_CATEGORY_COLOR = "#8b5cf6";

function normalizeCategoryName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTone(raw: unknown): CategoryTone | undefined {
  return raw === "solid" || raw === "soft" ? raw : undefined;
}

function normalizeHex(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(value)) return value.toLowerCase();
  return undefined;
}

function normalizeIcon(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 64);
}

function normalizeCategoryConfig(raw: unknown): CategoryConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const item = raw as Record<string, unknown>;
  const name = normalizeCategoryName(item.name);
  const color = normalizeHex(item.color);
  if (!name || !color) return undefined;
  const textColor = normalizeHex(item.textColor);
  const tone = normalizeTone(item.tone);
  const icon = normalizeIcon(item.icon);
  return {
    name,
    color,
    ...(textColor ? { textColor } : {}),
    ...(tone ? { tone } : {}),
    ...(icon ? { icon } : {}),
  };
}

function dedupeByName(configs: CategoryConfig[]): CategoryConfig[] {
  const byLower = new Map<string, CategoryConfig>();
  for (const cfg of configs) {
    const key = cfg.name.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, cfg);
  }
  return [...byLower.values()];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function suggestCategoryColor(name: string): string {
  const normalized = normalizeCategoryName(name) ?? "category";
  const hue = hashToHue(normalized.toLowerCase());
  return hslToHex(hue, 70, 52);
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getCategoryConfigs(): CategoryConfig[] {
  const stored = useSettingsStore.getState().categoryConfigs;
  if (!stored.length) return [];
  return dedupeByName(
    stored
      .map((item) => normalizeCategoryConfig(item))
      .filter((item): item is CategoryConfig => item != null),
  );
}

export function setCategoryConfigs(configs: CategoryConfig[]): void {
  const cleaned = dedupeByName(
    configs
      .map((cfg) => normalizeCategoryConfig(cfg))
      .filter((cfg): cfg is CategoryConfig => cfg != null),
  );
  useSettingsStore.getState().setCategoryConfigs(cleaned);
}

export function setOrUpdateCategoryConfig(config: CategoryConfig): void {
  const normalized = normalizeCategoryConfig(config);
  if (!normalized) return;
  const key = normalized.name.toLowerCase();
  const next = getCategoryConfigs().filter((cfg) => cfg.name.toLowerCase() !== key);
  next.push(normalized);
  setCategoryConfigs(next);
}

export function removeCategoryConfigByName(name: string): void {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return;
  const key = normalized.toLowerCase();
  setCategoryConfigs(
    getCategoryConfigs().filter((cfg) => cfg.name.toLowerCase() !== key),
  );
}

export function categoriesMatch(
  a: string | undefined,
  b: string | undefined,
): boolean {
  const left = normalizeCategoryName(a)?.toLowerCase();
  const right = normalizeCategoryName(b)?.toLowerCase();
  if (!left || !right) return false;
  return left === right;
}

export function countTasksInCategory(tasks: Task[], name: string): number {
  return tasks.filter((task) => categoriesMatch(task.category, name)).length;
}

export function categoryToSlug(name: string): string {
  return encodeURIComponent(name.trim());
}

export function slugToCategory(slug: string): string | undefined {
  try {
    const decoded = decodeURIComponent(slug).trim();
    return decoded.length > 0 ? decoded : undefined;
  } catch {
    return undefined;
  }
}

export function deleteCategoryEntirely(
  name: string,
  removeFromTasks: (categoryName: string) => void,
): void {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return;
  removeFromTasks(normalized);
  removeCategoryConfigByName(normalized);
}

export function getCategoryConfigByName(name: string): CategoryConfig | undefined {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return undefined;
  const key = normalized.toLowerCase();
  return getCategoryConfigs().find((cfg) => cfg.name.toLowerCase() === key);
}

export function collectAvailableCategories(tasks: Task[]): string[] {
  const fromTasks = tasks
    .map((task) => normalizeCategoryName(task.category))
    .filter((value): value is string => value != null);
  const fromConfigs = getCategoryConfigs().map((cfg) => cfg.name);
  const byLower = new Map<string, string>();
  for (const name of [...fromConfigs, ...fromTasks]) {
    const key = name.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, name);
  }
  return [...byLower.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function resolveCategoryVisual(name: string | undefined): CategoryVisual {
  const normalized = normalizeCategoryName(name);
  const cfg = normalized ? getCategoryConfigByName(normalized) : undefined;
  const color = cfg?.color ?? (normalized ? suggestCategoryColor(normalized) : DEFAULT_CATEGORY_COLOR);
  const tone = cfg?.tone ?? "soft";
  if (tone === "solid") {
    return {
      bg: color,
      text: cfg?.textColor ?? "#ffffff",
      border: rgba(color, 0.66),
      accent: color,
      ...(cfg?.icon ? { icon: cfg.icon } : {}),
    };
  }
  return {
    bg: rgba(color, 0.18),
    text: cfg?.textColor ?? color,
    border: rgba(color, 0.44),
    accent: color,
    ...(cfg?.icon ? { icon: cfg.icon } : {}),
  };
}
