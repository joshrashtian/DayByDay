import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTasksStore } from "@/stores/tasksStore";
import { syncNow } from "@/lib/tasksSync";

const SYNC_INTERVAL_MS = 30_000;

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
