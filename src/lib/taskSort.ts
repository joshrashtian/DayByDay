import type { Task, TaskPriority } from "@/types";

export type TaskSortField =
  | "dueDate"
  | "title"
  | "priority"
  | "createdAt"
  | "updatedAt"
  | "status"
  | "critical";

export type TaskSortDirection = "asc" | "desc";

export type TaskSortConfig = {
  field: TaskSortField;
  direction: TaskSortDirection;
};

export type GroupSortField = "default" | "label" | "taskCount" | "nearestDue";

export type GroupSortConfig = {
  field: GroupSortField;
  direction: TaskSortDirection;
};

export const DEFAULT_TASK_SORT: TaskSortConfig = {
  field: "dueDate",
  direction: "asc",
};

export const DEFAULT_GROUP_SORT: GroupSortConfig = {
  field: "default",
  direction: "asc",
};

export const TASK_SORT_OPTIONS: {
  field: TaskSortField;
  label: string;
  description: string;
}[] = [
  { field: "dueDate", label: "Due date", description: "Soonest or latest due first" },
  { field: "title", label: "Title", description: "Alphabetical by name" },
  { field: "priority", label: "Priority", description: "High → low or reverse" },
  { field: "critical", label: "Critical", description: "Critical tasks first" },
  { field: "status", label: "Status", description: "Open vs completed" },
  { field: "createdAt", label: "Created", description: "When the task was added" },
  { field: "updatedAt", label: "Updated", description: "Recently edited first" },
];

export const GROUP_SORT_OPTIONS: {
  field: GroupSortField;
  label: string;
}[] = [
  { field: "default", label: "Block / category order" },
  { field: "label", label: "Group name" },
  { field: "taskCount", label: "Task count" },
  { field: "nearestDue", label: "Nearest due in group" },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function priorityRank(task: Task): number {
  if (!task.priority) return 3;
  return PRIORITY_RANK[task.priority];
}

function compareTasks(a: Task, b: Task, config: TaskSortConfig): number {
  const dir = config.direction === "asc" ? 1 : -1;
  let cmp = 0;

  switch (config.field) {
    case "dueDate": {
      const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      cmp = aDue - bDue;
      break;
    }
    case "title":
      cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      break;
    case "priority":
      cmp = priorityRank(a) - priorityRank(b);
      break;
    case "createdAt":
      cmp = a.createdAt.getTime() - b.createdAt.getTime();
      break;
    case "updatedAt":
      cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
      break;
    case "status":
      cmp = Number(a.done) - Number(b.done);
      break;
    case "critical":
      cmp = Number(Boolean(b.critical)) - Number(Boolean(a.critical));
      break;
  }

  if (cmp === 0) {
    cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  }

  return cmp * dir;
}

export function compareTasksForSort(
  a: Task,
  b: Task,
  config: TaskSortConfig,
): number {
  const pinDoneLast = config.field !== "status";
  if (pinDoneLast && a.done !== b.done) return a.done ? 1 : -1;
  return compareTasks(a, b, config);
}

export function sortTasks(tasks: Task[], config: TaskSortConfig): Task[] {
  return [...tasks].sort((a, b) => compareTasksForSort(a, b, config));
}

function nearestDueInGroup(tasks: Task[]): number {
  let nearest = Number.MAX_SAFE_INTEGER;
  for (const task of tasks) {
    const t = task.dueDate?.getTime();
    if (t != null && t < nearest) nearest = t;
  }
  return nearest;
}

export function sortTaskGroups<
  T extends { label: string; tasks: Task[] },
>(
  groups: T[],
  config: GroupSortConfig,
  knownGroupOrder: string[],
): T[] {
  if (config.field === "default") {
    const orderByLower = new Map(
      knownGroupOrder.map((name, index) => [name.toLowerCase(), index]),
    );
    return [...groups].sort((a, b) => {
      const aUnassigned = a.label === "Unassigned";
      const bUnassigned = b.label === "Unassigned";
      if (aUnassigned && !bUnassigned) return 1;
      if (!aUnassigned && bUnassigned) return -1;
      const aOrder =
        orderByLower.get(a.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bOrder =
        orderByLower.get(b.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });
  }

  const dir = config.direction === "asc" ? 1 : -1;

  return [...groups].sort((a, b) => {
    let cmp = 0;
    switch (config.field) {
      case "label":
        cmp = a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        });
        break;
      case "taskCount":
        cmp = a.tasks.length - b.tasks.length;
        break;
      case "nearestDue":
        cmp = nearestDueInGroup(a.tasks) - nearestDueInGroup(b.tasks);
        break;
      default:
        cmp = 0;
    }
    if (cmp === 0) {
      cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    }
    return cmp * dir;
  });
}

export function sortLabel(config: TaskSortConfig): string {
  const option = TASK_SORT_OPTIONS.find((o) => o.field === config.field);
  const dir = config.direction === "asc" ? "↑" : "↓";
  return `${option?.label ?? config.field} ${dir}`;
}
