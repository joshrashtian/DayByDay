import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddTaskPayload, ImportIcsTaskPayload, Task, UpdateTaskPayload } from "@/types";
import {
  normalizeTaskTags,
  parseTaskKind,
  parseTaskRecurrence,
} from "../types/task";
import { normalizeTaskBlock } from "../lib/taskBlocks";
import { advanceRecurrenceDate } from "../lib/taskDates";
import { isIcsTask } from "../lib/icsTasks";
import { playTaskClickSound } from "../lib/taskClickSounds";

import { migrateLocalStorageKey } from "@/lib/storageMigration";

const STORAGE_KEY = "risebyday-tasks";
migrateLocalStorageKey("daybyday-tasks", STORAGE_KEY);

type LegacyCategory = { id: string; name: string };

type TasksState = {
  tasks: Task[];
  addTask: (payload: AddTaskPayload) => void;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => void;
  setTaskSchedule: (taskId: string, dueDate: Date, endDate?: Date) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setTaskCategory: (taskId: string, category: string | undefined) => void;
  removeCategoryFromAllTasks: (categoryName: string) => void;
  setTaskBlock: (taskId: string, block: string | undefined) => void;
  setTaskTags: (taskId: string, tags: string[] | undefined) => void;
  importIcsTasks: (
    payloads: ImportIcsTaskPayload[],
  ) => { imported: number; skipped: number };
  removeAllIcsTasks: () => number;
};

function reviveTask(raw: Record<string, unknown>): Task {
  const {
    categoryId: _legacyId,
    createdAt,
    updatedAt,
    dueDate,
    endDate,
    lastCompletedAt,
    block: rawBlock,
    context: rawLegacyContext,
    category,
    tags: rawTags,
    metadata: rawMetadata,
    classLocation: rawClassLocation,
    classGrade: rawClassGrade,
    ...rest
  } = raw as Record<string, unknown>;

  const recurrence = parseTaskRecurrence(
    (raw as Record<string, unknown>).recurrence,
  );
  const kind =
    parseTaskKind((raw as Record<string, unknown>).kind) ??
    parseTaskKind((raw as Record<string, unknown>).type) ??
    "task";

  const tags = normalizeTaskTags(rawTags);
  const block = normalizeTaskBlock(
    typeof rawBlock === "string" ? rawBlock : rawLegacyContext,
  );

  const metadataClassRaw =
    rawMetadata &&
    typeof rawMetadata === "object" &&
    (rawMetadata as Record<string, unknown>).class &&
    typeof (rawMetadata as Record<string, unknown>).class === "object"
      ? ((rawMetadata as Record<string, unknown>).class as Record<
          string,
          unknown
        >)
      : undefined;

  const classLocationFromMetadata =
    typeof metadataClassRaw?.location === "string"
      ? metadataClassRaw.location.trim()
      : "";
  const classGradeFromMetadata =
    typeof metadataClassRaw?.grade === "string"
      ? metadataClassRaw.grade.trim()
      : "";
  const classLocationLegacy =
    typeof rawClassLocation === "string" ? rawClassLocation.trim() : "";
  const classGradeLegacy =
    typeof rawClassGrade === "string" ? rawClassGrade.trim() : "";
  const classLocation = classLocationFromMetadata || classLocationLegacy;
  const classGrade = classGradeFromMetadata || classGradeLegacy;
  const icsUidRaw = (raw as Record<string, unknown>).icsUid;
  const icsUid =
    typeof icsUidRaw === "string" && icsUidRaw.trim()
      ? icsUidRaw.trim()
      : undefined;
  const metadata =
    classLocation || classGrade
      ? {
          class: {
            ...(classLocation ? { location: classLocation } : {}),
            ...(classGrade ? { grade: classGrade } : {}),
          },
        }
      : undefined;

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
      | "lastCompletedAt"
      | "kind"
    >),
    kind,
    createdAt: new Date(String(createdAt)),
    updatedAt: new Date(String(updatedAt)),
    ...(dueDate != null && dueDate !== ""
      ? { dueDate: new Date(String(dueDate)) }
      : {}),
    ...(endDate != null && endDate !== ""
      ? { endDate: new Date(String(endDate)) }
      : {}),
    ...(lastCompletedAt != null && lastCompletedAt !== ""
      ? { lastCompletedAt: new Date(String(lastCompletedAt)) }
      : {}),
    ...(typeof category === "string" && category.trim()
      ? { category: category.trim() }
      : {}),
    ...(metadata ? { metadata } : {}),
    ...(block ? { block } : {}),
    ...(tags ? { tags } : {}),
    ...(recurrence ? { recurrence } : {}),
    ...(icsUid ? { icsUid } : {}),
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
    (set, get) => ({
      tasks: [],

      setTaskCategory: (taskId, category) =>
        set((s) => {
          const existing = s.tasks.find((t) => t.id === taskId);
          if (existing && isIcsTask(existing)) return s;
          return {
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
        };
        }),

      removeCategoryFromAllTasks: (categoryName) =>
        set((s) => {
          const key = categoryName.trim().toLowerCase();
          if (!key) return s;
          return {
            tasks: s.tasks.map((t) => {
              const taskCategory = t.category?.trim().toLowerCase();
              if (!taskCategory || taskCategory !== key) return t;
              return { ...t, category: undefined, updatedAt: new Date() };
            }),
          };
        }),

      setTaskBlock: (taskId, block) =>
        set((s) => {
          const existing = s.tasks.find((t) => t.id === taskId);
          if (existing && isIcsTask(existing)) return s;
          return {
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  block: normalizeTaskBlock(block),
                  updatedAt: new Date(),
                }
              : t,
          ),
        };
        }),

      setTaskTags: (taskId, tags) =>
        set((s) => {
          const existing = s.tasks.find((t) => t.id === taskId);
          if (existing && isIcsTask(existing)) return s;
          return {
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  tags: normalizeTaskTags(tags ?? []),
                  updatedAt: new Date(),
                }
              : t,
          ),
        };
        }),

      addTask: (payload) => {
        const trimmed = payload.title.trim();
        if (!trimmed) return;
        const now = new Date();
        const cat = payload.category?.trim() || undefined;
        const classLocation =
          payload.metadata?.class?.location?.trim() ||
          payload.classLocation?.trim() ||
          undefined;
        const classGrade =
          payload.metadata?.class?.grade?.trim() ||
          payload.classGrade?.trim() ||
          undefined;
        const metadata =
          classLocation || classGrade
            ? {
                class: {
                  ...(classLocation ? { location: classLocation } : {}),
                  ...(classGrade ? { grade: classGrade } : {}),
                },
              }
            : undefined;
        const block = normalizeTaskBlock(payload.block ?? payload.context);
        const description = payload.description?.trim() || undefined;
        const notes = payload.notes?.trim() || undefined;
        const recurrence =
          payload.dueDate && payload.recurrence
            ? {
                frequency: payload.recurrence.frequency,
                interval: Math.max(1, payload.recurrence.interval ?? 1),
                ...(payload.recurrence.weekdays?.length
                  ? { weekdays: payload.recurrence.weekdays }
                  : {}),
                ...(payload.recurrence.untilDate
                  ? { untilDate: payload.recurrence.untilDate }
                  : {}),
              }
            : undefined;
        const tags = normalizeTaskTags(payload.tags ?? null);
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: crypto.randomUUID(),
              kind: payload.kind ?? "task",
              title: trimmed,
              done: false,
              createdAt: now,
              updatedAt: now,
              ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
              ...(payload.endDate ? { endDate: payload.endDate } : {}),
              ...(payload.priority ? { priority: payload.priority } : {}),
              ...(payload.critical ? { critical: true } : {}),
              ...(block ? { block } : {}),
              ...(cat ? { category: cat } : {}),
              ...(description ? { description } : {}),
              ...(notes ? { notes } : {}),
              ...(metadata ? { metadata } : {}),
              ...(classLocation ? { classLocation } : {}),
              ...(classGrade ? { classGrade } : {}),
              ...(tags ? { tags } : {}),
              ...(recurrence ? { recurrence } : {}),
            },
          ],
        }));
      },

      updateTask: (taskId, payload) =>
        set((s) => {
          const existing = s.tasks.find((t) => t.id === taskId);
          if (existing && isIcsTask(existing)) return s;
          const title = payload.title.trim();
          if (!title) return s;
          const block = normalizeTaskBlock(payload.block);
          const category = payload.category?.trim() || undefined;
          const description = payload.description?.trim() || undefined;
          const notes = payload.notes?.trim() || undefined;
          const classLocation =
            payload.metadata?.class?.location?.trim() ||
            payload.classLocation?.trim() ||
            undefined;
          const classGrade =
            payload.metadata?.class?.grade?.trim() ||
            payload.classGrade?.trim() ||
            undefined;
          const metadata =
            classLocation || classGrade
              ? {
                  class: {
                    ...(classLocation ? { location: classLocation } : {}),
                    ...(classGrade ? { grade: classGrade } : {}),
                  },
                }
              : undefined;
          const tags = normalizeTaskTags(payload.tags ?? []);
          const dueDate = payload.dueDate;
          const endDate =
            dueDate && payload.endDate && payload.endDate >= dueDate
              ? payload.endDate
              : undefined;
          const recurrence =
            dueDate && payload.recurrence
              ? {
                  frequency: payload.recurrence.frequency,
                  interval: Math.max(1, payload.recurrence.interval ?? 1),
                  ...(payload.recurrence.weekdays?.length
                    ? { weekdays: payload.recurrence.weekdays }
                    : {}),
                  ...(payload.recurrence.untilDate
                    ? { untilDate: payload.recurrence.untilDate }
                    : {}),
                }
              : undefined;

          return {
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    kind: payload.kind ?? t.kind ?? "task",
                    title,
                    dueDate,
                    endDate,
                    priority: payload.priority,
                    critical: payload.critical ? true : undefined,
                    block,
                    category,
                    description,
                    notes,
                    metadata,
                    classLocation,
                    classGrade,
                    tags,
                    recurrence,
                    updatedAt: new Date(),
                  }
                : t,
            ),
          };
        }),

      setTaskSchedule: (taskId, dueDate, endDate) =>
        set((s) => {
          const existing = s.tasks.find((t) => t.id === taskId);
          if (existing && isIcsTask(existing)) return s;
          return {
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  dueDate,
                  endDate,
                  updatedAt: new Date(),
                }
              : t,
          ),
        };
        }),

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task && !isIcsTask(task) && !task.done) {
          playTaskClickSound();
        }
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          if (isIcsTask(task)) return s;
          const now = new Date();
          if (!task.done && task.recurrence && task.dueDate) {
            const durationMs = task.endDate
              ? task.endDate.getTime() - task.dueDate.getTime()
              : undefined;
            const nextDue = advanceRecurrenceDate(task.dueDate, task.recurrence);
            const recursAgain =
              !task.recurrence.untilDate ||
              nextDue.getTime() <= task.recurrence.untilDate.getTime();
            if (!recursAgain) {
              return {
                tasks: s.tasks.map((t) =>
                  t.id === id
                    ? {
                        ...t,
                        done: true,
                        lastCompletedAt: now,
                        updatedAt: now,
                      }
                    : t,
                ),
              };
            }

            const sourceId = task.recurringSourceId ?? task.id;
            const completedOccurrence: Task = {
              ...task,
              id: crypto.randomUUID(),
              done: true,
              recurrence: undefined,
              recurringSourceId: sourceId,
              lastCompletedAt: now,
              updatedAt: now,
            };

            return {
              tasks: [
                ...s.tasks.map((t) =>
                  t.id === id
                    ? {
                        ...t,
                        done: false,
                        dueDate: nextDue,
                        ...(durationMs != null
                          ? { endDate: new Date(nextDue.getTime() + durationMs) }
                          : {}),
                        recurringSourceId: sourceId,
                        updatedAt: now,
                      }
                    : t,
                ),
                completedOccurrence,
              ],
            };
          }
          return {
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, done: !t.done, updatedAt: now } : t,
            ),
          };
        });
      },

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),

      importIcsTasks: (payloads) => {
        const s = get();
        const existingUids = new Set(
          s.tasks.flatMap((task) => (task.icsUid ? [task.icsUid] : [])),
        );
        const now = new Date();
        const additions: Task[] = [];
        let imported = 0;
        let skipped = 0;

        for (const payload of payloads) {
          const title = payload.title.trim();
          if (!title) {
            skipped += 1;
            continue;
          }
          if (existingUids.has(payload.icsUid)) {
            skipped += 1;
            continue;
          }

          existingUids.add(payload.icsUid);
          imported += 1;
          const classLocation = payload.classLocation?.trim() || undefined;
          const category = payload.category?.trim() || undefined;
          const description = payload.description?.trim() || undefined;

          additions.push({
            id: crypto.randomUUID(),
            kind: "ics",
            title,
            done: false,
            createdAt: now,
            updatedAt: now,
            dueDate: payload.dueDate,
            ...(payload.endDate ? { endDate: payload.endDate } : {}),
            ...(category ? { category } : {}),
            ...(description ? { description } : {}),
            ...(classLocation
              ? {
                  classLocation,
                  metadata: { class: { location: classLocation } },
                }
              : {}),
            icsUid: payload.icsUid,
          });
        }

        if (additions.length > 0) {
          set({ tasks: [...s.tasks, ...additions] });
        }

        return { imported, skipped };
      },

      removeAllIcsTasks: () => {
        const s = get();
        const remaining = s.tasks.filter((task) => !isIcsTask(task));
        const removed = s.tasks.length - remaining.length;
        if (removed > 0) set({ tasks: remaining });
        return removed;
      },
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
