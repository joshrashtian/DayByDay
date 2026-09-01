import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { syncNow } from "@/lib/tasksSync";

const SYNC_INTERVAL_MS = 30_000;

/**
 * Background task sync — no UI. Runs syncNow() on sign-in, on an interval,
 * on window focus, and when the browser comes back online. Mirrors the
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

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [authStatus]);

  return null;
}
