import { useEffect, useMemo, useState } from "react";
import { useDayTransition } from "../providers/DayTransitionProvider";
import { getActiveBlockNameAt } from "../lib/taskBlocks";
import { useSettingsStore } from "../stores/settingsStore";

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Active block for home/sidebar task scope; undefined when in all-day mode. */
export function useDisplayedBlockName(): string | undefined {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const { focusMode } = useDayTransition();

  useEffect(() => {
    const update = () => setMinuteOfDay(nowMinuteOfDay());
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBlockName = useMemo(
    () => getActiveBlockNameAt(minuteOfDay),
    [minuteOfDay, blockConfigs],
  );

  return focusMode === "all-day" ? undefined : activeBlockName;
}
