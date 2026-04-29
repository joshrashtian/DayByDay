import type { Task } from "../types/task";

export const TIME_BLOCK_SUGGESTIONS = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Late Night",
] as const;

export const CONTEXT_BLOCK_SUGGESTIONS = [
  "Work",
  "School",
  "Home",
  "Fitness",
  "Errands",
] as const;

export const DEFAULT_BLOCK_SUGGESTIONS = [
  ...TIME_BLOCK_SUGGESTIONS,
  ...CONTEXT_BLOCK_SUGGESTIONS,
] as const;

export const BLOCK_CONFIG_STORAGE_KEY = "daybyday-block-configs";
export const BLOCK_CONFIGS_CHANGED = "daybyday:block-configs-changed";

export type BlockConfig = {
  name: string;
  startMinutes: number;
  endMinutes: number;
  customCss?: string;
};

const MINUTES_IN_DAY = 24 * 60;

export function normalizeTaskBlock(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeClockMinutes(raw: unknown): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  const floored = Math.floor(raw);
  if (floored < 0 || floored >= MINUTES_IN_DAY) return undefined;
  return floored;
}

function normalizeBlockConfig(raw: unknown): BlockConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const item = raw as Record<string, unknown>;
  const name = normalizeTaskBlock(item.name);
  const startMinutes = normalizeClockMinutes(item.startMinutes);
  const endMinutes = normalizeClockMinutes(item.endMinutes);
  if (!name || startMinutes == null || endMinutes == null) return undefined;
  const rawCustomCss = item.customCss;
  const customCss =
    typeof rawCustomCss === "string" && rawCustomCss.trim().length > 0
      ? rawCustomCss
      : undefined;
  return {
    name,
    startMinutes,
    endMinutes,
    ...(customCss ? { customCss } : {}),
  };
}

function dedupeByName(configs: BlockConfig[]): BlockConfig[] {
  const byLower = new Map<string, BlockConfig>();
  for (const cfg of configs) {
    const key = cfg.name.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, cfg);
  }
  return [...byLower.values()];
}

function sortBlocksByName(values: string[]): string[] {
  return [...values].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function fallbackConfigsFromSuggestions(): BlockConfig[] {
  return [];
}

export function formatMinutesAsTimeInput(minutes: number): string {
  const safe = Math.min(MINUTES_IN_DAY - 1, Math.max(0, Math.floor(minutes)));
  const hh = String(Math.floor(safe / 60)).padStart(2, "0");
  const mm = String(safe % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseTimeInputToMinutes(raw: string): number | undefined {
  const m = raw.match(/^(\d{2}):(\d{2})$/);
  if (!m) return undefined;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return undefined;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return undefined;
  return hh * 60 + mm;
}

function inBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getBlockConfigs(): BlockConfig[] {
  if (!inBrowser()) return fallbackConfigsFromSuggestions();
  try {
    const raw = window.localStorage.getItem(BLOCK_CONFIG_STORAGE_KEY);
    if (!raw) return fallbackConfigsFromSuggestions();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallbackConfigsFromSuggestions();
    const normalized = parsed
      .map((item) => normalizeBlockConfig(item))
      .filter((item): item is BlockConfig => item != null);
    if (normalized.length === 0) return fallbackConfigsFromSuggestions();
    return dedupeByName(normalized);
  } catch {
    return fallbackConfigsFromSuggestions();
  }
}

export function setBlockConfigs(configs: BlockConfig[]): void {
  if (!inBrowser()) return;
  const cleaned = dedupeByName(
    configs
      .map((cfg) => normalizeBlockConfig(cfg))
      .filter((cfg): cfg is BlockConfig => cfg != null),
  );
  window.localStorage.setItem(BLOCK_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
  window.dispatchEvent(new CustomEvent(BLOCK_CONFIGS_CHANGED));
}

export function setOrUpdateBlockConfig(config: BlockConfig): void {
  const normalized = normalizeBlockConfig(config);
  if (!normalized) return;
  const current = getBlockConfigs();
  const key = normalized.name.toLowerCase();
  const next = current.filter((item) => item.name.toLowerCase() !== key);
  next.push(normalized);
  setBlockConfigs(next);
}

export function removeBlockConfigByName(name: string): void {
  const normalized = normalizeTaskBlock(name);
  if (!normalized) return;
  const key = normalized.toLowerCase();
  const next = getBlockConfigs().filter((cfg) => cfg.name.toLowerCase() !== key);
  setBlockConfigs(next);
}

export function getBlockConfigByName(name: string): BlockConfig | undefined {
  const normalized = normalizeTaskBlock(name);
  if (!normalized) return undefined;
  const key = normalized.toLowerCase();
  return getBlockConfigs().find((cfg) => cfg.name.toLowerCase() === key);
}

export function collectAvailableBlocks(tasks: Task[]): string[] {
  const fromTasks = collectTaskBlocks(tasks);
  const fromConfigs = getBlockConfigs().map((cfg) => cfg.name);
  const byLower = new Map<string, string>();
  for (const name of [...fromConfigs, ...fromTasks]) {
    const normalized = normalizeTaskBlock(name);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, normalized);
  }
  return sortBlocksByName([...byLower.values()]);
}

export function isMinuteInBlockWindow(
  minuteOfDay: number,
  config: Pick<BlockConfig, "startMinutes" | "endMinutes">,
): boolean {
  const minute = Math.max(0, Math.min(MINUTES_IN_DAY - 1, Math.floor(minuteOfDay)));
  if (config.startMinutes === config.endMinutes) return true;
  if (config.startMinutes < config.endMinutes) {
    return minute >= config.startMinutes && minute < config.endMinutes;
  }
  return minute >= config.startMinutes || minute < config.endMinutes;
}

export function getActiveBlockNameAt(minuteOfDay: number): string | undefined {
  const configs = getBlockConfigs();
  for (const cfg of configs) {
    if (isMinuteInBlockWindow(minuteOfDay, cfg)) return cfg.name;
  }
  return undefined;
}

export function collectTaskBlocks(tasks: Task[]): string[] {
  const byLower = new Map<string, string>();
  for (const task of tasks) {
    const block = normalizeTaskBlock(task.block);
    if (!block) continue;
    const key = block.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, block);
  }
  return [...byLower.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
