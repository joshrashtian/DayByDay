import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import { useDayTransition } from "../providers/DayTransitionProvider";
import {
  formatMinutesAsTimeInput,
  getActiveBlockNameAt,
  getBlockConfigByName,
} from "../lib/taskBlocks";
import { useSettingsStore } from "../stores/settingsStore";

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const focusToggleBase =
  "rounded-full px-3 py-1.5 font-medium tracking-wide transition-colors";

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const { focusMode, switchFocusMode } = useDayTransition();

  useEffect(() => {
    const update = () => setMinuteOfDay(nowMinuteOfDay());
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBlockName = useMemo(
    () => getActiveBlockNameAt(minuteOfDay),
    [minuteOfDay, blockConfigs],
  );

  const activeBlockConfig = useMemo(() => {
    if (!activeBlockName) return undefined;
    return getBlockConfigByName(activeBlockName);
  }, [activeBlockName, blockConfigs]);

  const isAllDayMode = focusMode === "all-day";
  const displayedBlockName = isAllDayMode ? undefined : activeBlockName;

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="home-content mx-auto max-w-6xl px-3 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-10">
          <div className="flex min-w-0 flex-col items-stretch gap-5">
            <div className="flex w-fit max-w-full items-baseline gap-3 rounded-2xl bg-sunken p-4 px-5 text-left sm:p-6 sm:px-10">
              <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
                {isAllDayMode ? "All Day" : (activeBlockName ?? "Anytime")}
              </h1>
              {!isAllDayMode && activeBlockConfig ? (
                <p className="font-eudoxus text-sm text-muted">
                  {formatMinutesAsTimeInput(activeBlockConfig.startMinutes)}-
                  {formatMinutesAsTimeInput(activeBlockConfig.endMinutes)}
                </p>
              ) : null}
            </div>

            <div className="inline-flex w-fit items-center gap-0.5 rounded-full bg-sunken p-0.5 font-eudoxus text-xs">
              <button
                type="button"
                onClick={() =>
                  switchFocusMode("current-block", {
                    from: "All Day",
                    to: activeBlockName ?? "Current Block",
                  })
                }
                className={`${focusToggleBase} ${
                  !isAllDayMode
                    ? "bg-surface text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={!isAllDayMode}
              >
                Current Block
              </button>
              <button
                type="button"
                onClick={() =>
                  switchFocusMode("all-day", {
                    from: activeBlockName ?? "Current Block",
                    to: "All Day",
                  })
                }
                className={`${focusToggleBase} ${
                  isAllDayMode
                    ? "bg-surface text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={isAllDayMode}
              >
                All Day
              </button>
            </div>

            <div className="w-fit">
              <CriticalHeaderRibbon />
            </div>

            <TasksFrontPage activeBlockName={displayedBlockName} />
          </div>
          <aside className="flex justify-start xl:shrink-0 xl:justify-end">
            <DateCorner />
          </aside>
        </div>
      </main>
    </div>
  );
};
