import { useEffect } from "react";
import { usePomodoroStore } from "../../stores/pomodoroStore";

/** Keeps the global pomodoro interval alive for the whole app session. */
export function PomodoroTicker() {
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const tick = usePomodoroStore((s) => s.tick);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  return null;
}
