import { tasksStyleRegistry } from "@/themes/sectionStyles";
import type { TasksVisualStyle } from "@/types";

export type TasksStyleOption = {
  id: TasksVisualStyle;
  label: string;
};

export function listTasksStyleOptions(): TasksStyleOption[] {
  return tasksStyleRegistry.list();
}

export const TASKS_STYLE_OPTIONS: TasksStyleOption[] = listTasksStyleOptions();

export const TASKS_STYLE_LABELS: Record<TasksVisualStyle, string> =
  Object.fromEntries(
    TASKS_STYLE_OPTIONS.map((option) => [option.id, option.label]),
  ) as Record<TasksVisualStyle, string>;
