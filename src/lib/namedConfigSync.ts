import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { supabase } from "@/utils/supabase";

/** Config writes go through the RiseByDay API; builds without VITE_API_URL
 * write to Supabase directly. Reads always go to Supabase. */
const hasApi = Boolean(import.meta.env.VITE_API_URL);

type NamedConfig = { name: string };
type NamedRow = { id: string; name: string; sort_order: number };

export type NamedConfigSyncSpec<C extends NamedConfig, R extends NamedRow> = {
  table: "user_categories" | "user_blocks";
  /** e.g. "/categoriesapi/categories" — create, update/{id}, delete/{id}. */
  apiBase: string;
  /** localStorage key for the last-synced snapshot. */
  storageKey: string;
  getLocal: () => C[];
  setLocal: (configs: C[]) => void;
  rowToConfig: (row: R) => C;
  /** The row's own columns for a config, minus id, user_id and sort_order. */
  configToFields: (config: C) => Record<string, unknown>;
};

/** True while remote changes are written into settingsStore, so the store
 * subscription in TasksSyncEngine doesn't treat them as local edits. */
let applyingRemote = false;

export function isApplyingRemoteConfigs() {
  return applyingRemote;
}

const key = (name: string) => name.trim().toLowerCase();

/**
 * Builds a sync for a settings list keyed by name (categories, blocks).
 *
 * Local configs have no ids, so a missing name is ambiguous: deleted here, or
 * created on another device? A snapshot of what both sides agreed on last time
 * answers that — the standard three-way merge. A side that changed since the
 * last sync wins; when both changed, the local edit wins. The snapshot is per
 * user, so signing into another account starts from a pure union.
 */
export function createNamedConfigSync<C extends NamedConfig, R extends NamedRow>(
  spec: NamedConfigSyncSpec<C, R>,
) {
  type Synced = C & { id: string; sortOrder: number };
  type Baseline = { userId: string | null; synced: Synced[] };

  const useBaselineStore = create<Baseline>()(
    persist((): Baseline => ({ userId: null, synced: [] }), {
      name: spec.storageKey,
    }),
  );

  const fieldsOf = (config: C, sortOrder: number) => ({
    ...spec.configToFields(config),
    sort_order: sortOrder,
  });

  const same = (a: C & { sortOrder: number }, b: C & { sortOrder: number }) =>
    JSON.stringify(fieldsOf(a, a.sortOrder)) === JSON.stringify(fieldsOf(b, b.sortOrder));

  const toSynced = (row: R): Synced => ({
    ...spec.rowToConfig(row),
    id: row.id,
    sortOrder: row.sort_order,
  });

  async function createRemote(config: C, sortOrder: number, userId: string) {
    const body = { id: crypto.randomUUID(), ...fieldsOf(config, sortOrder) };
    if (hasApi) {
      try {
        const res = await api.post<R>(`${spec.apiBase}/create`, body);
        return res.data;
      } catch (err) {
        // Created on another device since our fetch; the next pull adopts it.
        if (isAxiosError(err) && err.response?.status === 409) return null;
        throw err;
      }
    }
    const { data, error } = await supabase
      .from(spec.table)
      .insert({ ...body, user_id: userId } as never)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") return null;
      throw error;
    }
    return data as unknown as R;
  }

  async function updateRemote(id: string, config: C, sortOrder: number) {
    const changes = fieldsOf(config, sortOrder);
    if (hasApi) {
      await api.patch(`${spec.apiBase}/update/${id}`, changes);
      return;
    }
    const { error } = await supabase
      .from(spec.table)
      .update(changes as never)
      .eq("id", id);
    if (error) throw error;
  }

  async function deleteRemote(id: string) {
    if (hasApi) {
      try {
        await api.delete(`${spec.apiBase}/delete/${id}`);
      } catch (err) {
        // Already gone (deleted on another device too).
        if (!(isAxiosError(err) && err.response?.status === 404)) throw err;
      }
      return;
    }
    const { error } = await supabase.from(spec.table).delete().eq("id", id);
    if (error) throw error;
  }

  async function fetchRemote(userId: string): Promise<R[]> {
    // A handful of rows per user, so fetch whole rather than by delta — there
    // is no deleted_at, so a delta couldn't see deletes anyway.
    const { data, error } = await supabase
      .from(spec.table)
      .select("*")
      .eq("user_id", userId)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as R[];
  }

  return async function sync(userId: string) {
    const baselineState = useBaselineStore.getState();
    const baseline = new Map(
      (baselineState.userId === userId ? baselineState.synced : []).map(
        (c) => [key(c.name), c] as const,
      ),
    );
    const local = new Map(
      spec.getLocal().map((c, i) => [key(c.name), { ...c, sortOrder: i }] as const),
    );
    const remote = new Map(
      (await fetchRemote(userId)).map((r) => [key(r.name), toSynced(r)] as const),
    );

    const merged: Synced[] = [];
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
        if (base && same(loc, base)) {
          // Deleted on another device, untouched here.
          localChanged = true;
          continue;
        }
        const created = await createRemote(loc, loc.sortOrder, userId);
        merged.push(created ? toSynced(created) : { ...loc, id: "" });
        continue;
      }

      const localEdited = !base || !same(loc, base);
      if (same(loc, rem)) {
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
        spec.setLocal(
          merged.map(({ id: _id, sortOrder: _sortOrder, ...config }) => config as unknown as C),
        );
      } finally {
        applyingRemote = false;
      }
    }

    // Rows that lost a create race have no id yet; leave them out of the
    // baseline so the next sync matches them against the server's copy.
    useBaselineStore.setState({ userId, synced: merged.filter((c) => c.id) });
  };
}
