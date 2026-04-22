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

export function normalizeTaskBlock(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
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
