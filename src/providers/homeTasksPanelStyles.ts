export type TasksVisualStyle = "default" | "card" | "minimal";

const tasksPanelStyles: Record<TasksVisualStyle, string> = {
  default: "",
  card: "rounded-2xl border border-zinc-200/90 bg-white/75 p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50",
  minimal: "border-l-2 border-zinc-300/80 pl-4 dark:border-zinc-700",
};

export function getTasksPanelClass(style: TasksVisualStyle): string {
  return tasksPanelStyles[style];
}
