import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTasksStore } from "@/stores/tasksStore";
import { syncNow } from "@/lib/tasksSync";

const SYNC_INTERVAL_MS = 30_000;

/**
 * Background task sync — no UI. Runs syncNow() on sign-in, on an interval,
 * on window focus, when the browser comes back online, and as soon as a task
 * is created so it reaches the API without waiting for the interval. Mirrors the
 * always-on global pattern used by PomodoroTicker / PomodoroLinkedTaskSync.
 */
export function TasksSyncEngine() {
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (authStatus !== "signedIn") return;

    void syncNow();
    const interval = setInterval(() => void syncNow(), SYNC_INTERVAL_MS);
    const onFocus = () => void syncNow();
    const onOnline = () => void syncNow();

    const unsubscribe = useTasksStore.subscribe((state, prev) => {
      if (state.pendingCreateIds.length > prev.pendingCreateIds.length) {
        void syncNow();
      }
    });

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [authStatus]);

  return null;
}
