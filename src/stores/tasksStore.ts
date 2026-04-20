import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  normalizeTaskTags,
  parseTaskRecurrence,
  type AddTaskPayload,
  type Task,
} from "../types/task";

const STORAGE_KEY = "daybyday-tasks";

type LegacyCategory = { id: string; name: string };

type TasksState = {
  tasks: Task[];
  addTask: (payload: AddTaskPayload) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setTaskCategory: (taskId: string, category: string | undefined) => void;
  setTaskTags: (taskId: string, tags: string[] | undefined) => void;
};

function reviveTask(raw: Record<string, unknown>): Task {
  const {
    categoryId: _legacyId,
    createdAt,
    updatedAt,
    dueDate,
    endDate,
    category,
    tags: rawTags,
    ...rest
  } = raw as Record<string, unknown>;

  const recurrence = parseTaskRecurrence(
    (raw as Record<string, unknown>).recurrence,
  );

  const tags = normalizeTaskTags(rawTags);

  const task: Task = {
    ...(rest as Omit<
      Task,
      | "createdAt"
      | "updatedAt"
      | "dueDate"
      | "endDate"
      | "category"
      | "recurrence"
      | "tags"
    >),
    createdAt: new Date(String(createdAt)),
    updatedAt: new Date(String(updatedAt)),
    ...(dueDate != null && dueDate !== ""
      ? { dueDate: new Date(String(dueDate)) }
      : {}),
    ...(endDate != null && endDate !== ""
      ? { endDate: new Date(String(endDate)) }
      : {}),
    ...(typeof category === "string" && category.trim()
      ? { category: category.trim() }
      : {}),
    ...(tags ? { tags } : {}),
    ...(recurrence ? { recurrence } : {}),
  };
  return task;
}

function mergePersistedTasks(
  rawTasks: unknown[],
  legacyCategories: LegacyCategory[] | undefined,
): Task[] {
  const idToName = new Map(
    (legacyCategories ?? []).map((c) => [c.id, c.name.trim()]),
  );
  return rawTasks.map((item) => {
    const raw = item as Record<string, unknown>;
    const task = reviveTask(raw);
    if (!task.category && raw.categoryId != null && raw.categoryId !== "") {
      const name = idToName.get(String(raw.categoryId));
      if (name) return { ...task, category: name };
    }
    return task;
  });
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      setTaskCategory: (taskId, category) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  category:
                    category == null || category === ""
                      ? undefined
                      : category,
                  updatedAt: new Date(),
                }
              : t,
          ),
        })),

      setTaskTags: (taskId, tags) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  tags: normalizeTaskTags(tags ?? []),
                  updatedAt: new Date(),
                }
              : t,
          ),
        })),

      addTask: (payload) => {
        const trimmed = payload.title.trim();
        if (!trimmed) return;
        const now = new Date();
        const cat = payload.category?.trim() || undefined;
        const description = payload.description?.trim() || undefined;
        const notes = payload.notes?.trim() || undefined;
        const recurrence =
          payload.dueDate && payload.recurrence
            ? {
                frequency: payload.recurrence.frequency,
                interval: Math.max(1, payload.recurrence.interval ?? 1),
              }
            : undefined;
        const tags = normalizeTaskTags(payload.tags ?? null);
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: crypto.randomUUID(),
              title: trimmed,
              done: false,
              createdAt: now,
              updatedAt: now,
              ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
              ...(payload.endDate ? { endDate: payload.endDate } : {}),
              ...(payload.priority ? { priority: payload.priority } : {}),
              ...(payload.critical ? { critical: true } : {}),
              ...(cat ? { category: cat } : {}),
              ...(description ? { description } : {}),
              ...(notes ? { notes } : {}),
              ...(tags ? { tags } : {}),
              ...(recurrence ? { recurrence } : {}),
            },
          ],
        }));
      },

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, updatedAt: new Date() } : t,
          ),
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ tasks: state.tasks }),
      merge: (persisted, current) => {
        const p = persisted as Partial<{
          tasks: unknown[];
          categories: LegacyCategory[];
        }>;
        const base = current as TasksState;
        const rawTasks = p?.tasks;
        const legacyCats = p?.categories;
        return {
          ...base,
          tasks: Array.isArray(rawTasks)
            ? mergePersistedTasks(rawTasks, legacyCats)
            : base.tasks,
        };
      },
    },
  ),
);

export const useTasks = useTasksStore;
