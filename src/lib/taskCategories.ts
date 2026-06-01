import type { CategoryConfig, Task, TaskPriority } from "@/types";
import { useSettingsStore } from "../stores/settingsStore";

export type { CategoryConfig } from "@/types";

/** @deprecated Use useSettingsStore subscription instead of event listeners */
export const CATEGORY_CONFIG_STORAGE_KEY = "risebyday-category-configs";
/** @deprecated Use useSettingsStore subscription instead of event listeners */
export const CATEGORY_CONFIGS_CHANGED = "risebyday:category-configs-changed";

type CategoryVisual = {
  /** Full saturated category color — fills the whole task card. */
  color: string;
  /** Readable text/icon color on top of `color` (white or near-black). */
  onColor: string;
  /** Deeper shade of `color` for the circular icon badge. */
  iconBg: string;
  /** Translucent fill for compact badges (calendar, chips). */
  bg: string;
  /** Text color for compact badges. */
  text: string;
  /** Border color for compact badges. */
  border: string;
  /** Raw accent color (same as `color`). */
  accent: string;
  icon?: string;
};

const DEFAULT_CATEGORY_COLOR = "#8b5cf6";

function normalizeCategoryName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
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
  const icon = normalizeIcon(item.icon);
  return {
    name,
    color,
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

/** Mix a hex color toward black by `amount` (0–1) and return a hex string. */
function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const k = 1 - Math.max(0, Math.min(1, amount));
  const toHex = (n: number) =>
    Math.round(n * k)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Pick white or near-black for legible text on top of `hex`. */
function readableTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#1c1917" : "#ffffff";
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
  const color =
    cfg?.color ??
    (normalized ? suggestCategoryColor(normalized) : DEFAULT_CATEGORY_COLOR);
  return {
    color,
    onColor: readableTextColor(color),
    iconBg: shade(color, 0.22),
    bg: rgba(color, 0.18),
    text: color,
    border: rgba(color, 0.44),
    accent: color,
    ...(cfg?.icon ? { icon: cfg.icon } : {}),
  };
}

const CRITICAL_COLOR = "#dc2626";
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#64748b",
};
const NO_PRIORITY_COLOR = "#64748b";

export type TaskCardVisual = {
  /** Solid fill for the whole card — always present. */
  color: string;
  /** Readable text/icon color on top of `color`. */
  onColor: string;
  /** Deeper shade of `color` for the circular icon badge. */
  iconBg: string;
  /** Category icon id, if the task has a category with an icon. */
  icon?: string;
  /** True when the fill comes from a category (vs. critical/priority). */
  hasCategory: boolean;
};

/**
 * Resolves the solid card color for calendar surfaces.
 * Precedence: critical → category → priority → neutral slate.
 */
export function resolveTaskCardVisual(task: Task): TaskCardVisual {
  const hasCategory = Boolean(normalizeCategoryName(task.category));
  const categoryVisual = resolveCategoryVisual(task.category);
  const color = task.critical
    ? CRITICAL_COLOR
    : hasCategory
      ? categoryVisual.color
      : task.priority
        ? PRIORITY_COLORS[task.priority]
        : NO_PRIORITY_COLOR;
  return {
    color,
    onColor: readableTextColor(color),
    iconBg: shade(color, 0.22),
    hasCategory,
    ...(hasCategory && categoryVisual.icon
      ? { icon: categoryVisual.icon }
      : {}),
  };
}
