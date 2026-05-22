import type { IconType } from "react-icons";
import {
  IoAlarmOutline,
  IoCalendarClearOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoRepeatOutline,
  IoSchoolOutline,
} from "react-icons/io5";
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
  Icon: IconType;
  badgeClass: string;
  subtleBadgeClass: string;
};

const TASK_KIND_VISUALS: Record<TaskKind, TaskKindStyle> = {
  task: {
    label: "Task",
    Icon: IoCheckmarkCircleOutline,
    badgeClass:
      "border-zinc-300/80 bg-zinc-500/10 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-200",
    subtleBadgeClass:
      "border-zinc-300/80 bg-zinc-100/80 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200",
  },
  event: {
    label: "Event",
    Icon: IoCalendarClearOutline,
    badgeClass:
      "border-sky-400/70 bg-sky-500/15 text-sky-800 dark:border-sky-500/60 dark:bg-sky-500/20 dark:text-sky-200",
    subtleBadgeClass:
      "border-sky-400/70 bg-sky-100/80 text-sky-800 dark:border-sky-500/60 dark:bg-sky-900/45 dark:text-sky-200",
  },
  class: {
    label: "Class",
    Icon: IoSchoolOutline,
    badgeClass:
      "border-indigo-400/70 bg-indigo-500/15 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-500/20 dark:text-indigo-200",
    subtleBadgeClass:
      "border-indigo-400/70 bg-indigo-100/80 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-900/45 dark:text-indigo-200",
  },
  reminder: {
    label: "Reminder",
    Icon: IoAlarmOutline,
    badgeClass:
      "border-amber-400/70 bg-amber-500/15 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200",
    subtleBadgeClass:
      "border-amber-400/70 bg-amber-100/80 text-amber-900 dark:border-amber-500/60 dark:bg-amber-900/45 dark:text-amber-200",
  },
  habit: {
    label: "Habit",
    Icon: IoRepeatOutline,
    badgeClass:
      "border-violet-400/70 bg-violet-500/15 text-violet-800 dark:border-violet-500/60 dark:bg-violet-500/20 dark:text-violet-200",
    subtleBadgeClass:
      "border-violet-400/70 bg-violet-100/80 text-violet-900 dark:border-violet-500/60 dark:bg-violet-900/45 dark:text-violet-200",
  },
  ics: {
    label: "ICS",
    Icon: IoDocumentTextOutline,
    badgeClass:
      "border-teal-400/70 bg-teal-500/15 text-teal-900 dark:border-teal-500/60 dark:bg-teal-500/20 dark:text-teal-100",
    subtleBadgeClass:
      "border-teal-400/70 bg-teal-100/80 text-teal-900 dark:border-teal-500/60 dark:bg-teal-900/45 dark:text-teal-100",
  },
};

export function getTaskKindVisual(kind: TaskKind | undefined): TaskKindStyle {
  return TASK_KIND_VISUALS[kind ?? "task"];
}
