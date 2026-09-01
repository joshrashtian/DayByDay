import { create } from "zustand";
import { supabase } from "@/utils/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTasksStore } from "@/stores/tasksStore";
import type {
  RecurrenceFrequency,
  RecurrenceWeekday,
  Task,
  TaskMetadata,
} from "@/types";

type TaskRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  done: boolean;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  end_date: string | null;
  priority: string | null;
  block: string | null;
  category: string | null;
  description: string | null;
  tags: string[] | null;
  notes: string | null;
  metadata: TaskMetadata | null;
  critical: boolean | null;
  recurrence: {
    frequency: RecurrenceFrequency;
    interval: number;
    weekdays?: RecurrenceWeekday[] | null;
    untilDate?: string | null;
  } | null;
  last_completed_at: string | null;
  recurring_source_id: string | null;
  ics_uid: string | null;
  deleted_at: string | null;
};

function taskToRow(task: Task, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    kind: task.kind,
    title: task.title,
    done: task.done,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    end_date: task.endDate ? task.endDate.toISOString() : null,
    priority: task.priority ?? null,
    block: task.block ?? null,
    category: task.category ?? null,
    description: task.description ?? null,
    tags: task.tags ?? null,
    notes: task.notes ?? null,
    metadata: task.metadata ?? null,
    critical: task.critical ?? null,
    recurrence: task.recurrence
      ? {
          frequency: task.recurrence.frequency,
          interval: task.recurrence.interval,
          weekdays: task.recurrence.weekdays ?? null,
          untilDate: task.recurrence.untilDate
            ? task.recurrence.untilDate.toISOString()
            : null,
        }
      : null,
    last_completed_at: task.lastCompletedAt
      ? task.lastCompletedAt.toISOString()
      : null,
    recurring_source_id: task.recurringSourceId ?? null,
    ics_uid: task.icsUid ?? null,
    deleted_at: null,
  };
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    kind: row.kind as Task["kind"],
    title: row.title,
    done: row.done,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ...(row.due_date ? { dueDate: new Date(row.due_date) } : {}),
    ...(row.end_date ? { endDate: new Date(row.end_date) } : {}),
    ...(row.priority ? { priority: row.priority as Task["priority"] } : {}),
    ...(row.block ? { block: row.block } : {}),
    ...(row.category ? { category: row.category } : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(row.tags?.length ? { tags: row.tags } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.metadata ? { metadata: row.metadata } : {}),
    ...(row.critical ? { critical: true } : {}),
    ...(row.recurrence
      ? {
          recurrence: {
            frequency: row.recurrence.frequency,
            interval: row.recurrence.interval,
            ...(row.recurrence.weekdays?.length
              ? { weekdays: row.recurrence.weekdays }
              : {}),
            ...(row.recurrence.untilDate
              ? { untilDate: new Date(row.recurrence.untilDate) }
              : {}),
          },
        }
      : {}),
    ...(row.last_completed_at
      ? { lastCompletedAt: new Date(row.last_completed_at) }
      : {}),
    ...(row.recurring_source_id
      ? { recurringSourceId: row.recurring_source_id }
      : {}),
    ...(row.ics_uid ? { icsUid: row.ics_uid } : {}),
    children_tasks: [],
  };
}

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

const useSyncStatusStore = create<{ status: SyncStatus }>(() => ({
  status: "idle",
}));

export function useSyncStatus() {
  return useSyncStatusStore((s) => s.status);
}

function setStatus(status: SyncStatus) {
  useSyncStatusStore.setState({ status });
}

let isSyncing = false;
/** Epoch ms watermark for locally-dirty tasks; module-scoped (not persisted) — a
 * restart re-pushes unchanged tasks once, which is harmless since upserts are
 * idempotent. */
let lastPushedAt = 0;

async function pushLocalChanges(userId: string) {
  const state = useTasksStore.getState();
  const dirty = state.tasks.filter(
    (t) => t.updatedAt.getTime() > lastPushedAt,
  );
  const pushTime = Date.now();

  if (dirty.length > 0) {
    const { error } = await supabase
      .from("tasks")
      .upsert(dirty.map((t) => taskToRow(t, userId)));
    if (error) throw error;
  }

  const pendingDeletedIds = state.pendingDeletedIds;
  if (pendingDeletedIds.length > 0) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("tasks").upsert(
      pendingDeletedIds.map((id) => ({
        id,
        user_id: userId,
        title: "",
        created_at: now,
        updated_at: now,
        deleted_at: now,
      })),
    );
    if (error) throw error;
    useTasksStore.getState().clearPendingDeletedIds(pendingDeletedIds);
  }

  lastPushedAt = pushTime;
}

async function pullRemoteChanges(userId: string) {
  const since = useTasksStore.getState().lastPulledAt ?? new Date(0).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .gt("updated_at", since);
  if (error) throw error;

  const pullTime = new Date().toISOString();
  const localTasks = useTasksStore.getState().tasks;

  for (const row of (data ?? []) as TaskRow[]) {
    if (row.deleted_at) {
      useTasksStore.getState().removeFromRemote(row.id);
      continue;
    }
    const local = localTasks.find((t) => t.id === row.id);
    const remoteTask = rowToTask(row);
    if (!local || remoteTask.updatedAt.getTime() > local.updatedAt.getTime()) {
      useTasksStore.getState().upsertFromRemote(remoteTask);
    }
  }

  useTasksStore.getState().setLastPulledAt(pullTime);
}

/** Pushes local task changes to Supabase, then pulls remote changes down.
 * No-ops when signed out or offline; only one sync runs at a time. */
export async function syncNow() {
  if (useAuthStore.getState().status !== "signedIn") return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return;
  }
  const userId = useAuthStore.getState().user?.id;
  if (!userId || isSyncing) return;

  isSyncing = true;
  setStatus("syncing");
  try {
    await pushLocalChanges(userId);
    await pullRemoteChanges(userId);
    setStatus("synced");
  } catch (err) {
    console.error("Task sync failed", err);
    setStatus("error");
  } finally {
    isSyncing = false;
  }
}
