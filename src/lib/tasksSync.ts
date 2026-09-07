import { create } from "zustand";
import { supabase } from "@/utils/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useTasksStore } from "@/stores/tasksStore";
import {
  buildParentIndex,
  rowToTask,
  taskToRow,
  taskTombstoneRow,
} from "@/lib/cloud/mappers";
import type { TaskRow } from "@/types/database";

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
    // parent_id is derived from every task's children_tasks, so the index has
    // to be built from the full set even though only dirty rows get pushed.
    const parents = buildParentIndex(state.tasks);
    const { error } = await supabase
      .from("tasks")
      .upsert(dirty.map((t) => taskToRow(t, userId, parents.get(t.id) ?? null)));
    if (error) throw error;
  }

  const pendingDeletedIds = state.pendingDeletedIds;
  if (pendingDeletedIds.length > 0) {
    const deletedAt = new Date();
    const { error } = await supabase
      .from("tasks")
      .upsert(pendingDeletedIds.map((id) => taskTombstoneRow(id, userId, deletedAt)));
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
    // Keep the local children list: a delta row can't reconstruct it alone.
    const remoteTask = rowToTask(row, local?.children_tasks ?? []);
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
