import { useEffect } from "react";
import { usePomodoroStore } from "../../stores/pomodoroStore";

const DAY_CHECK_INTERVAL_MS = 60 * 1000;

/** Keeps the global pomodoro interval alive for the whole app session. */
export function PomodoroTicker() {
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const tick = usePomodoroStore((s) => s.tick);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  // Resets the daily session count at midnight even while the timer is idle.
  useEffect(() => {
    const checkDayReset = usePomodoroStore.getState().checkDayReset;
    checkDayReset();
    const id = window.setInterval(checkDayReset, DAY_CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
