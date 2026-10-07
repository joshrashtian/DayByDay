import type { Task, TaskKind } from "@/types";
import { categoriesMatch } from "./taskCategories";

export type CalendarFilter = {
  /** Category names to show; empty means every category (and uncategorized). */
  categories: string[];
  /** Task kinds to show; empty means every kind. */
  kinds: TaskKind[];
  hideCompleted: boolean;
};

export const EMPTY_CALENDAR_FILTER: CalendarFilter = {
  categories: [],
  kinds: [],
  hideCompleted: false,
};

export function countActiveCalendarFilters(filter: CalendarFilter): number {
  return (
    filter.categories.length +
    filter.kinds.length +
    (filter.hideCompleted ? 1 : 0)
  );
}

export function applyCalendarFilter(
  tasks: Task[],
  filter: CalendarFilter,
): Task[] {
  if (countActiveCalendarFilters(filter) === 0) return tasks;
  return tasks.filter((task) => {
    if (filter.hideCompleted && task.done) return false;
    if (filter.kinds.length > 0 && !filter.kinds.includes(task.kind)) {
      return false;
    }
    if (
      filter.categories.length > 0 &&
      !filter.categories.some((name) => categoriesMatch(task.category, name))
    ) {
      return false;
    }
    return true;
  });
}
