import type { Task } from "@/types";

/** True for a task nested under another task. */
export function isSubtask(task: Task): boolean {
  return Boolean(task.parentId);
}

/** Drops subtasks so list views only show top-level tasks; subtasks render
 * nested under their parent instead. */
export function withoutSubtasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.parentId);
}

/** Direct children of `parentId`, oldest first (creation order). */
export function getSubtasks(tasks: Task[], parentId: string): Task[] {
  return tasks
    .filter((task) => task.parentId === parentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Every task nested under `rootId`, at any depth. Excludes the root. */
export function collectDescendantIds(tasks: Task[], rootId: string): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const task of tasks) {
    if (!task.parentId) continue;
    const siblings = childrenByParent.get(task.parentId);
    if (siblings) siblings.push(task.id);
    else childrenByParent.set(task.parentId, [task.id]);
  }

  const result: string[] = [];
  const seen = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const childId of childrenByParent.get(id) ?? []) {
      // Guards against a parent cycle that slipped in through sync.
      if (seen.has(childId)) continue;
      seen.add(childId);
      result.push(childId);
      queue.push(childId);
    }
  }
  return result;
}

export type SubtaskProgress = { done: number; total: number };

export function subtaskProgress(subtasks: Task[]): SubtaskProgress {
  return {
    done: subtasks.filter((task) => task.done).length,
    total: subtasks.length,
  };
}
