import type { Task } from "@/types";

export function isIcsTask(task: Pick<Task, "kind">): boolean {
  return task.kind === "ics";
}
