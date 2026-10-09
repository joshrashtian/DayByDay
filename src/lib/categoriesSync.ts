import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { supabase } from "@/utils/supabase";
import { useSettingsStore } from "@/stores/settingsStore";
import { categoryConfigToInsert, categoryRowToConfig } from "@/lib/cloud/mappers";
import type { UserCategoryRow } from "@/types/database";
import type { CategoryConfig } from "@/types";

/** Category writes go through the RiseByDay API; builds without VITE_API_URL
 * write to Supabase directly. Reads always go to Supabase. */
const hasApi = Boolean(import.meta.env.VITE_API_URL);

/** A category as of the last successful sync, plus its server id. */
type SyncedCategory = CategoryConfig & { id: string; sortOrder: number };

/**
 * Local categories have no ids, so a missing name is ambiguous: deleted here,
 * or created on another device? The snapshot of what both sides agreed on last
 * time answers that — the standard three-way merge. It is per user, so signing
 * into another account starts from an empty baseline (a pure union).
 */
type CategoriesBaseline = {
  userId: string | null;
  synced: SyncedCategory[];
};

const useCategoriesBaselineStore = create<CategoriesBaseline>()(
  persist((): CategoriesBaseline => ({ userId: null, synced: [] }), {
    name: "risebyday-categories-sync",
  }),
);

/** True while remote changes are written into settingsStore, so the store
 * subscription in TasksSyncEngine doesn't treat them as local edits. */
let applyingRemote = false;

export function isApplyingRemoteCategories() {
  return applyingRemote;
}

const key = (name: string) => name.trim().toLowerCase();

function sameConfig(
  a: CategoryConfig & { sortOrder: number },
  b: CategoryConfig & { sortOrder: number },
) {
  return (
    a.name === b.name &&
    a.color === b.color &&
    (a.icon ?? null) === (b.icon ?? null) &&
    a.sortOrder === b.sortOrder
  );
}

async function createRemote(config: CategoryConfig, sortOrder: number, userId: string) {
  const row = { id: crypto.randomUUID(), ...categoryConfigToInsert(config, userId, sortOrder) };
  if (hasApi) {
    const { user_id: _userId, ...body } = row;
    try {
      const res = await api.post<UserCategoryRow>("/categoriesapi/categories/create", body);
      return res.data;
    } catch (err) {
      // Created on another device since our fetch; the next pull adopts it.
      if (isAxiosError(err) && err.response?.status === 409) return null;
      throw err;
    }
  }
  const { data, error } = await supabase.from("user_categories").insert(row).select().single();
  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }
  return data as UserCategoryRow;
}

async function updateRemote(id: string, config: CategoryConfig, sortOrder: number) {
  const changes = {
    name: config.name,
    color: config.color,
    icon: config.icon ?? null,
    sort_order: sortOrder,
  };
  if (hasApi) {
    await api.patch(`/categoriesapi/categories/update/${id}`, changes);
    return;
  }
  const { error } = await supabase.from("user_categories").update(changes).eq("id", id);
  if (error) throw error;
}

async function deleteRemote(id: string) {
  if (hasApi) {
    try {
      await api.delete(`/categoriesapi/categories/delete/${id}`);
    } catch (err) {
      // Already gone (deleted on another device too).
      if (!(isAxiosError(err) && err.response?.status === 404)) throw err;
    }
    return;
  }
  const { error } = await supabase.from("user_categories").delete().eq("id", id);
  if (error) throw error;
}

function toSynced(row: UserCategoryRow): SyncedCategory {
  return { ...categoryRowToConfig(row), id: row.id, sortOrder: row.sort_order };
}

async function fetchRemote(userId: string): Promise<UserCategoryRow[]> {
  // The table is a handful of rows per user, so fetch it whole rather than by
  // delta — it has no deleted_at, so a delta couldn't see deletes anyway.
  const { data, error } = await supabase
    .from("user_categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as UserCategoryRow[];
}

/** Merges local categories with the server's. A side that changed since the
 * last sync wins; when both changed, the local edit wins. */
export async function syncCategories(userId: string) {
  const baselineState = useCategoriesBaselineStore.getState();
  const baseline = new Map(
    (baselineState.userId === userId ? baselineState.synced : []).map((c) => [key(c.name), c]),
  );
  const local = new Map(
    useSettingsStore
      .getState()
      .categoryConfigs.map((c, i) => [key(c.name), { ...c, sortOrder: i }] as const),
  );
  const remote = new Map((await fetchRemote(userId)).map((r) => [key(r.name), toSynced(r)]));

  const merged: SyncedCategory[] = [];
  let localChanged = false;

  for (const k of baseline.keys()) {
    const rem = remote.get(k);
    if (local.has(k) || !rem) continue;
    // Deleted here since the last sync.
    await deleteRemote(rem.id);
    remote.delete(k);
  }

  for (const [k, loc] of local) {
    const rem = remote.get(k);
    const base = baseline.get(k);

    if (!rem) {
      if (base && sameConfig(loc, base)) {
        // Deleted on another device, untouched here.
        localChanged = true;
        continue;
      }
      const created = await createRemote(loc, loc.sortOrder, userId);
      if (created) merged.push(toSynced(created));
      else merged.push({ ...loc, id: "", sortOrder: loc.sortOrder });
      continue;
    }

    const localEdited = !base || !sameConfig(loc, base);
    if (sameConfig(loc, rem)) {
      merged.push(rem);
    } else if (localEdited) {
      await updateRemote(rem.id, loc, loc.sortOrder);
      merged.push({ ...loc, id: rem.id });
    } else {
      merged.push(rem);
      localChanged = true;
    }
  }

  for (const [k, rem] of remote) {
    if (local.has(k) || baseline.has(k)) continue;
    // Created on another device.
    merged.push(rem);
    localChanged = true;
  }

  merged.sort((a, b) => a.sortOrder - b.sortOrder);

  if (localChanged) {
    applyingRemote = true;
    try {
      useSettingsStore
        .getState()
        .setCategoryConfigs(merged.map(({ id: _id, sortOrder: _sortOrder, ...config }) => config));
    } finally {
      applyingRemote = false;
    }
  }

  // Rows that lost a create race have no id yet; leave them out of the
  // baseline so the next sync matches them against the server's copy.
  useCategoriesBaselineStore.setState({
    userId,
    synced: merged.filter((c) => c.id),
  });
}
