import type { TasksVisualStyle } from "@/types";

export type { TasksVisualStyle } from "@/types";

const tasksPanelStyles: Record<TasksVisualStyle, string> = {
  default:
    "font-eudoxus",
  card: "rounded-2xl border border-zinc-200/60 bg-white/70 p-4 font-ppneue shadow-[0_24px_48px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-950/50",
  minimal:
    "border-l-4 border-zinc-400/60 pl-5 font-baron dark:border-zinc-600",
};

export function getTasksPanelClass(style: TasksVisualStyle): string {
  return tasksPanelStyles[style];
}
