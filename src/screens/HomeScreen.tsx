import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import {
  BLOCK_CONFIGS_CHANGED,
  BLOCK_CONFIG_STORAGE_KEY,
  formatMinutesAsTimeInput,
  getActiveBlockNameAt,
  getBlockConfigByName,
} from "../lib/taskBlocks";

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const [blockConfigVersion, setBlockConfigVersion] = useState(0);

  useEffect(() => {
    const update = () => setMinuteOfDay(nowMinuteOfDay());
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = () => setBlockConfigVersion((v) => v + 1);
    window.addEventListener(BLOCK_CONFIGS_CHANGED, refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOCK_CONFIG_STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BLOCK_CONFIGS_CHANGED, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const activeBlockName = useMemo(
    () => getActiveBlockNameAt(minuteOfDay),
    [minuteOfDay, blockConfigVersion],
  );

  const activeBlockConfig = useMemo(() => {
    if (!activeBlockName) return undefined;
    return getBlockConfigByName(activeBlockName);
  }, [activeBlockName, blockConfigVersion]);

  const normalized = activeBlockName?.toLowerCase() ?? "";
  const blockAccentClass =
    normalized === "early morning"
      ? "bg-sky-100 text-sky-900"
      : normalized === "afternoon"
        ? "bg-orange-100 text-orange-900"
        : normalized === "evening" || normalized === "late night"
          ? "bg-indigo-100 text-indigo-900"
          : "bg-white text-zinc-900";

  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
          <div className="flex min-w-0 flex-col items-stretch gap-5">
            <div
              className={`p-8 px-12 -rotate-3 font-bold text-left flex flex-row justify-start w-fit -skew-x-12 items-start gap-2 ${blockAccentClass}`}
            >
              <h1 className="skew-x-12 text-4xl font-quantify rotate-3">
                {activeBlockName ?? "Anytime"}
              </h1>
              {activeBlockConfig ? (
                <p className="skew-x-12 mt-1 text-sm font-medium opacity-70">
                  {formatMinutesAsTimeInput(activeBlockConfig.startMinutes)}-
                  {formatMinutesAsTimeInput(activeBlockConfig.endMinutes)}
                </p>
              ) : null}
            </div>
            <CriticalHeaderRibbon />
            <TasksFrontPage activeBlockName={activeBlockName} />
          </div>
          <aside className="flex justify-end lg:shrink-0 lg:justify-end">
            <DateCorner variant="p5" />
          </aside>
        </div>
      </main>
    </div>
  );
};
