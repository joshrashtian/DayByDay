export type TaskViewMode = "all" | "block" | "category";

export const TASK_VIEW_MODES: {
  id: TaskViewMode;
  label: string;
  description: string;
}[] = [
  {
    id: "all",
    label: "All tasks",
    description: "One flat list with no grouping",
  },
  {
    id: "block",
    label: "By block",
    description: "Group tasks by time block",
  },
  {
    id: "category",
    label: "By category",
    description: "Group tasks by category",
  },
];

/** Shared size for compact task control icons (side rail, rows). */
export const TASK_ICON_CLASS = "h-5 w-5 shrink-0";

/** Larger icons for front-page spotlight actions. */
export const TASK_ICON_LG_CLASS = "h-6 w-6 shrink-0 sm:h-7 sm:w-7";
