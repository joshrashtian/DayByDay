import type { TaskKind } from "@/types";

export const TASK_KIND_OPTIONS: Array<{ value: TaskKind; label: string }> = [
  { value: "task", label: "Task" },
  { value: "event", label: "Event" },
  { value: "class", label: "Class" },
  { value: "reminder", label: "Reminder" },
  { value: "habit", label: "Habit" },
];

type TaskKindStyle = {
  label: string;
  badgeClass: string;
  subtleBadgeClass: string;
};

const TASK_KIND_VISUALS: Record<TaskKind, TaskKindStyle> = {
  task: {
    label: "Task",
    badgeClass:
      "border-zinc-300/80 bg-zinc-500/10 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-200",
    subtleBadgeClass:
      "border-zinc-300/80 bg-zinc-100/80 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200",
  },
  event: {
    label: "Event",
    badgeClass:
      "border-sky-400/70 bg-sky-500/15 text-sky-800 dark:border-sky-500/60 dark:bg-sky-500/20 dark:text-sky-200",
    subtleBadgeClass:
      "border-sky-400/70 bg-sky-100/80 text-sky-800 dark:border-sky-500/60 dark:bg-sky-900/45 dark:text-sky-200",
  },
  class: {
    label: "Class",
    badgeClass:
      "border-indigo-400/70 bg-indigo-500/15 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-500/20 dark:text-indigo-200",
    subtleBadgeClass:
      "border-indigo-400/70 bg-indigo-100/80 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-900/45 dark:text-indigo-200",
  },
  reminder: {
    label: "Reminder",
    badgeClass:
      "border-amber-400/70 bg-amber-500/15 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200",
    subtleBadgeClass:
      "border-amber-400/70 bg-amber-100/80 text-amber-900 dark:border-amber-500/60 dark:bg-amber-900/45 dark:text-amber-200",
  },
  habit: {
    label: "Habit",
    badgeClass:
      "border-violet-400/70 bg-violet-500/15 text-violet-800 dark:border-violet-500/60 dark:bg-violet-500/20 dark:text-violet-200",
    subtleBadgeClass:
      "border-violet-400/70 bg-violet-100/80 text-violet-900 dark:border-violet-500/60 dark:bg-violet-900/45 dark:text-violet-200",
  },
};

export function getTaskKindVisual(kind: TaskKind | undefined): TaskKindStyle {
  return TASK_KIND_VISUALS[kind ?? "task"];
}
