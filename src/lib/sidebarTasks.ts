import type { Task } from "@/types";
import { isIcsTask } from "./icsTasks";
import {
  isCompletedTaskFromPreviousDay,
  isTaskDueToday,
  isTaskOverdue,
} from "./taskDates";

function taskMatchesBlock(task: Task, blockName?: string): boolean {
  if (!blockName) return true;
  return task.block?.trim().toLowerCase() === blockName.toLowerCase();
}

function compareTasksByDue(a: Task, b: Task): number {
  const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (aDue !== bDue) return aDue - bDue;
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

/** Tasks shown in the sidebar when scoped to the current home block. */
export function getBlockScopedSidebarTasks(
  tasks: Task[],
  blockName?: string,
): Task[] {
  return tasks
    .filter((task) => !isIcsTask(task))
    .filter((task) => taskMatchesBlock(task, blockName))
    .filter((task) => {
      if (isCompletedTaskFromPreviousDay(task)) return false;
      if (!task.done) return true;
      return isTaskDueToday(task.dueDate);
    })
    .sort(compareTasksByDue);
}

/** Tasks shown in the sidebar on non-home routes (today-centric). */
export function getTodaySidebarTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => !isIcsTask(task))
    .filter((task) => {
      if (isCompletedTaskFromPreviousDay(task)) return false;
      if (task.done) return isTaskDueToday(task.dueDate);
      if (!task.dueDate) return true;
      return isTaskDueToday(task.dueDate) || isTaskOverdue(task.dueDate);
    })
    .sort(compareTasksByDue);
}
