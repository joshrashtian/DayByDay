import { create } from "zustand";
import { isAxiosError } from "axios";
import { api } from "@/api";
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
/** Set when syncNow() is called mid-sync, so changes made during it (a new
 * task, say) go out right after instead of waiting for the next interval. */
let rerunRequested = false;
/** Epoch ms watermark for locally-dirty tasks; module-scoped (not persisted) — a
 * restart re-pushes unchanged tasks once, which is harmless since upserts are
 * idempotent. */
let lastPushedAt = 0;

/** The create endpoint lives on the RiseByDay API; builds without
 * VITE_API_URL fall back to upserting new tasks straight into Supabase. */
const hasApi = Boolean(import.meta.env.VITE_API_URL);

/** A retry after a lost response hits the primary key — the row exists. */
function isAlreadyCreated(err: unknown) {
  if (!isAxiosError(err) || err.response?.status !== 400) return false;
  const detail = (err.response.data as { detail?: unknown } | undefined)?.detail;
  return typeof detail === "string" && detail.includes("duplicate key");
}

/** POSTs each pending create; returns the ids that still aren't on the server. */
async function pushPendingCreates(
  userId: string,
  parents: Map<string, string>,
): Promise<Set<string>> {
  const { tasks, pendingCreateIds } = useTasksStore.getState();
  const failed = new Set<string>();
  const done: string[] = [];

  for (const id of pendingCreateIds) {
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      done.push(id);
      continue;
    }
    try {
      await api.post(
        "/tasksapi/tasks/create",
        taskToRow(task, userId, parents.get(id) ?? null),
      );
      done.push(id);
    } catch (err) {
      if (isAlreadyCreated(err)) {
        done.push(id);
      } else {
        console.error(`Task create failed for ${id}`, err);
        failed.add(id);
      }
    }
  }

  useTasksStore.getState().clearPendingCreateIds(done);
  return failed;
}

/** Returns true when every pending create reached the API. */
async function pushLocalChanges(userId: string): Promise<boolean> {
  const state = useTasksStore.getState();
  const pushTime = Date.now();
  // parent_id is derived from every task's children_tasks, so the index has
  // to be built from the full set even though only dirty rows get pushed.
  const parents = buildParentIndex(state.tasks);

  // New tasks go through the API; a create that failed stays pending and is
  // kept out of the upsert so it's retried as a create next sync.
  const pendingCreates = hasApi ? new Set(state.pendingCreateIds) : new Set<string>();
  const failedCreates = hasApi
    ? await pushPendingCreates(userId, parents)
    : new Set<string>();

  const dirty = state.tasks.filter(
    (t) =>
      t.updatedAt.getTime() > lastPushedAt &&
      !pendingCreates.has(t.id) &&
      !failedCreates.has(t.id),
  );

  if (dirty.length > 0) {
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
  if (!hasApi) {
    useTasksStore.getState().clearPendingCreateIds(state.pendingCreateIds);
  }

  lastPushedAt = pushTime;
  return failedCreates.size === 0;
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
  if (!userId) return;
  if (isSyncing) {
    rerunRequested = true;
    return;
  }

  isSyncing = true;
  setStatus("syncing");
  try {
    const createsPushed = await pushLocalChanges(userId);
    await pullRemoteChanges(userId);
    setStatus(createsPushed ? "synced" : "error");
  } catch (err) {
    console.error("Task sync failed", err);
    setStatus("error");
  } finally {
    isSyncing = false;
  }
  if (rerunRequested) {
    rerunRequested = false;
    void syncNow();
  }
}
