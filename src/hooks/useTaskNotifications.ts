import { useEffect } from "react";
import { isTauri } from "@/lib/tauriEnv";
import { syncNotifications } from "@/lib/sendNotification";
import { buildTaskNotifications } from "@/lib/taskNotifications";
import { useTasksStore } from "@/stores/tasksStore";

/**
 * Keeps the Rust notification queue in step with the task list. The queue
 * lives in memory, so it starts empty on every launch: this rebuilds it on
 * mount, again whenever tasks change (debounced), and on an interval so tasks
 * entering the 24h horizon get picked up.
 */
const DEBOUNCE_MS = 1_000;
const RESYNC_INTERVAL_MS = 15 * 60_000;

export function useTaskNotifications(): void {
  const tasks = useTasksStore((s) => s.tasks);

  useEffect(() => {
    if (!isTauri()) return;

    const sync = () => {
      const items = buildTaskNotifications(useTasksStore.getState().tasks);
      syncNotifications(items).catch((err) =>
        console.error("Failed to sync notifications", err),
      );
    };

    const debounce = window.setTimeout(sync, DEBOUNCE_MS);
    const interval = window.setInterval(sync, RESYNC_INTERVAL_MS);
    return () => {
      window.clearTimeout(debounce);
      window.clearInterval(interval);
    };
  }, [tasks]);
}
