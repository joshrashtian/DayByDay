import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import { useContextMenu } from "../providers/ContextMenuProvider";
import { useDayTransition } from "../providers/DayTransitionProvider";
import { getBlockBannerClasses } from "../providers/homeBlockBannerStyles";
import { getCriticalRibbonClass } from "../providers/homeCriticalRibbonStyles";
import { getTasksPanelClass } from "../providers/homeTasksPanelStyles";
import {
  formatMinutesAsTimeInput,
  getActiveBlockNameAt,
  getBlockConfigByName,
} from "../lib/taskBlocks";
import { useSettingsStore } from "../stores/settingsStore";
import { IoSettings } from "react-icons/io5";

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const visualPrefs = useSettingsStore((s) => s.homeVisualPrefs);
  const setVisualPrefs = useSettingsStore((s) => s.setHomeVisualPrefs);
  const context = useContextMenu();
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

  const normalized = activeBlockName?.toLowerCase() ?? "";
  const blockAccentClass =
    normalized === "early morning"
      ? "bg-sky-200/80 text-sky-950"
      : normalized === "afternoon"
        ? "bg-amber-200/80 text-amber-950"
        : normalized === "evening" || normalized === "late night"
          ? "bg-indigo-200/80 text-indigo-950"
          : "bg-zinc-200/60 text-zinc-900";

  const blockClasses = getBlockBannerClasses(
    visualPrefs.blockStyle,
    blockAccentClass,
  );
  const ribbonStyleClass = getCriticalRibbonClass(visualPrefs.ribbonStyle);
  const tasksStyleClass = getTasksPanelClass(visualPrefs.tasksStyle);
  const isAllDayMode = focusMode === "all-day";
  const displayedBlockName = isAllDayMode ? undefined : activeBlockName;

  const openBlockMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "block-header", type: "header", header: "Block Banner" },
      {
        id: "block-style-punchy",
        type: "item",
        label: "Style: Punchy",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockStyle: "punchy" })),
      },
      {
        id: "block-style-clean",
        type: "item",
        label: "Style: Clean",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockStyle: "clean" })),
      },
      {
        id: "block-style-outline",
        type: "item",
        label: "Style: Outline",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockStyle: "outline" })),
      },
      { id: "block-break", type: "break" },
      {
        id: "block-size-small",
        type: "item",
        label: "Size: Small",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockScale: 0.9 })),
      },
      {
        id: "block-size-medium",
        type: "item",
        label: "Size: Medium",
        onSelect: () => setVisualPrefs((prev) => ({ ...prev, blockScale: 1 })),
      },
      {
        id: "block-size-large",
        type: "item",
        label: "Size: Large",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockScale: 1.15 })),
      },
    ]);
  };

  const openRibbonMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "ribbon-header", type: "header", header: "Critical Ribbon" },
      {
        id: "ribbon-style-default",
        type: "item",
        label: "Style: Default",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonStyle: "default" })),
      },
      {
        id: "ribbon-style-muted",
        type: "item",
        label: "Style: Muted",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonStyle: "muted" })),
      },
      {
        id: "ribbon-style-contrast",
        type: "item",
        label: "Style: High Contrast",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonStyle: "high-contrast" })),
      },
      { id: "ribbon-break", type: "break" },
      {
        id: "ribbon-size-small",
        type: "item",
        label: "Size: Small",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonScale: 0.92 })),
      },
      {
        id: "ribbon-size-medium",
        type: "item",
        label: "Size: Medium",
        onSelect: () => setVisualPrefs((prev) => ({ ...prev, ribbonScale: 1 })),
      },
      {
        id: "ribbon-size-large",
        type: "item",
        label: "Size: Large",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonScale: 1.12 })),
      },
    ]);
  };

  const openTasksMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "tasks-header", type: "header", header: "Task Focus Panel" },
      {
        id: "tasks-style-default",
        type: "item",
        label: "Style: Default",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksStyle: "default" })),
      },
      {
        id: "tasks-style-card",
        type: "item",
        label: "Style: Card",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksStyle: "card" })),
      },
      {
        id: "tasks-style-minimal",
        type: "item",
        label: "Style: Minimal",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksStyle: "minimal" })),
      },
      { id: "tasks-break", type: "break" },
      {
        id: "tasks-size-small",
        type: "item",
        label: "Size: Small",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksScale: 0.94 })),
      },
      {
        id: "tasks-size-medium",
        type: "item",
        label: "Size: Medium",
        onSelect: () => setVisualPrefs((prev) => ({ ...prev, tasksScale: 1 })),
      },
      {
        id: "tasks-size-large",
        type: "item",
        label: "Size: Large",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksScale: 1.1 })),
      },
    ]);
  };

  const openClockMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "clock-header", type: "header", header: "Clock" },
      {
        id: "clock-style-p5",
        type: "item",
        label: "Style: Persona 5",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockStyle: "p5" })),
      },
      {
        id: "clock-style-min",
        type: "item",
        label: "Style: Minimal",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockStyle: "minimal" })),
      },
      {
        id: "clock-style-basic",
        type: "item",
        label: "Style: Basic",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockStyle: "basic" })),
      },
      { id: "clock-break", type: "break" },
      {
        id: "clock-size-small",
        type: "item",
        label: "Size: Small",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockScale: 0.9 })),
      },
      {
        id: "clock-size-medium",
        type: "item",
        label: "Size: Medium",
        onSelect: () => setVisualPrefs((prev) => ({ ...prev, clockScale: 1 })),
      },
      {
        id: "clock-size-large",
        type: "item",
        label: "Size: Large",
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockScale: 1.2 })),
      },
    ]);
  };

  return (
    <div className="min-h-dvh bg-zinc-100/50 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-3 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-10">
          <div className="flex min-w-0 flex-col items-stretch gap-5">
            <div
              onContextMenu={openBlockMenu}
              className={`flex w-fit max-w-full flex-row flex-wrap items-start justify-start gap-1.5 p-4 px-5 text-left font-bold sm:gap-2 sm:p-6 sm:px-10 ${blockClasses.containerClassName}`}
              style={{ transform: `scale(${visualPrefs.blockScale})` }}
            >
              <h1 className={blockClasses.titleClassName}>
                {isAllDayMode ? "All Day" : (activeBlockName ?? "Anytime")}
              </h1>
              {!isAllDayMode && activeBlockConfig ? (
                <p className={blockClasses.timeClassName}>
                  {formatMinutesAsTimeInput(activeBlockConfig.startMinutes)}-
                  {formatMinutesAsTimeInput(activeBlockConfig.endMinutes)}
                </p>
              ) : null}
            </div>
            <div className="inline-flex w-fit items-center gap-0.5 rounded-full bg-zinc-200/60 p-0.5 font-eudoxus text-xs dark:bg-zinc-800/60">
              <button
                type="button"
                onClick={() =>
                  switchFocusMode("current-block", {
                    from: "All Day",
                    to: activeBlockName ?? "Current Block",
                  })
                }
                className={`rounded-full px-3 py-1.5 font-medium tracking-wide transition-all ${
                  !isAllDayMode
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                className={`rounded-full px-3 py-1.5 font-medium tracking-wide transition-all ${
                  isAllDayMode
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                aria-pressed={isAllDayMode}
              >
                All Day
              </button>
            </div>
            <div
              onContextMenu={openRibbonMenu}
              className={`w-fit ${ribbonStyleClass}`}
              style={{
                transform: `scale(${visualPrefs.ribbonScale})`,
                transformOrigin: "left top",
              }}
            >
              <CriticalHeaderRibbon />
            </div>
            <div
              onContextMenu={openTasksMenu}
              className={tasksStyleClass}
              style={{
                transform: `scale(${visualPrefs.tasksScale})`,
                transformOrigin: "left top",
              }}
            >
              <TasksFrontPage activeBlockName={displayedBlockName} />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("dbd:open-settings"))
            }
            className="absolute right-0 bottom-0"
          >
            <IoSettings className="text-2xl" />
          </button>
          <aside
            onContextMenu={openClockMenu}
            className="flex justify-start xl:shrink-0 xl:justify-end"
          >
            <DateCorner
              variant={visualPrefs.clockStyle}
              scale={visualPrefs.clockScale}
              onScaleChange={(nextScale) =>
                setVisualPrefs((prev) => ({ ...prev, clockScale: nextScale }))
              }
              onVariantChange={(nextStyle) =>
                setVisualPrefs((prev) => ({
                  ...prev,
                  clockStyle:
                    nextStyle === "minimal" ||
                    nextStyle === "p5" ||
                    nextStyle === "basic"
                      ? nextStyle
                      : prev.clockStyle,
                }))
              }
            />
          </aside>
        </div>
      </main>
    </div>
  );
};
