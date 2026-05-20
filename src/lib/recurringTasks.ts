import type { Task } from "@/types";
import {
  compareTasksForSort,
  DEFAULT_TASK_SORT,
  sortTasks,
  type TaskSortConfig,
} from "./taskSort";

/** Stable id for all occurrences in a recurring series. */
export function getRecurringSeriesId(task: Task): string | undefined {
  if (task.recurringSourceId) return task.recurringSourceId;
  if (task.recurrence) return task.id;
  return undefined;
}

export function isRecurringSeriesMember(task: Task): boolean {
  return getRecurringSeriesId(task) != null;
}

/** Prefer the active template, else nearest upcoming / most recent occurrence. */
export function pickRepresentativeTask(tasks: Task[]): Task {
  if (tasks.length === 0) {
    throw new Error("pickRepresentativeTask requires at least one task");
  }

  const withRecurrence = tasks.find((t) => !t.done && t.recurrence);
  if (withRecurrence) return withRecurrence;

  const notDone = tasks.filter((t) => !t.done);
  if (notDone.length > 0) {
    return [...notDone].sort(compareByDueAsc)[0];
  }

  return [...tasks].sort(compareByDueDesc)[0];
}

function compareByDueAsc(a: Task, b: Task): number {
  const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

function compareByDueDesc(a: Task, b: Task): number {
  const aTime = a.dueDate?.getTime() ?? 0;
  const bTime = b.dueDate?.getTime() ?? 0;
  return bTime - aTime;
}

export type TaskListEntry =
  | { kind: "single"; task: Task }
  | { kind: "stack"; seriesId: string; tasks: Task[]; representative: Task };

/** @deprecated Use sortTasks from taskSort.ts */
export function sortTasksForDisplay(
  tasks: Task[],
  config: TaskSortConfig = DEFAULT_TASK_SORT,
): Task[] {
  return sortTasks(tasks, config);
}

function sortTaskListEntries(
  entries: TaskListEntry[],
  config: TaskSortConfig,
): TaskListEntry[] {
  const taskForEntry = (entry: TaskListEntry): Task =>
    entry.kind === "stack" ? entry.representative : entry.task;

  return [...entries].sort((a, b) =>
    compareTasksForSort(taskForEntry(a), taskForEntry(b), config),
  );
}

export function buildTaskListEntries(
  tasks: Task[],
  taskSort: TaskSortConfig = DEFAULT_TASK_SORT,
): TaskListEntry[] {
  const sorted = sortTasks(tasks, taskSort);
  const bySeries = new Map<string, Task[]>();

  for (const task of sorted) {
    const seriesId = getRecurringSeriesId(task);
    if (!seriesId) continue;
    const bucket = bySeries.get(seriesId) ?? [];
    bucket.push(task);
    bySeries.set(seriesId, bucket);
  }

  const entries: TaskListEntry[] = [];
  const seenSeries = new Set<string>();

  for (const task of sorted) {
    const seriesId = getRecurringSeriesId(task);
    if (!seriesId) {
      entries.push({ kind: "single", task });
      continue;
    }
    if (seenSeries.has(seriesId)) continue;
    seenSeries.add(seriesId);

    const series = bySeries.get(seriesId)!;
    if (series.length === 1) {
      entries.push({ kind: "single", task: series[0] });
    } else {
      entries.push({
        kind: "stack",
        seriesId,
        tasks: series,
        representative: pickRepresentativeTask(series),
      });
    }
  }

  return sortTaskListEntries(entries, taskSort);
}

/** Logical row count (a stack = one row). */
export function countTaskListEntries(entries: TaskListEntry[]): number {
  return entries.length;
}
