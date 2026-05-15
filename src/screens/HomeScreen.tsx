import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import { useContextMenu } from "../providers/ContextMenuProvider";
import { useDayTransition } from "../providers/DayTransitionProvider";
import {
  getBlockBannerClasses,
  type BlockVisualStyle,
} from "../providers/homeBlockBannerStyles";
import {
  getCriticalRibbonClass,
  type RibbonVisualStyle,
} from "../providers/homeCriticalRibbonStyles";
import {
  getTasksPanelClass,
  type TasksVisualStyle,
} from "../providers/homeTasksPanelStyles";
import type { ClockTemplate } from "../providers/clockStyleDefaults";
import {
  BLOCK_CONFIGS_CHANGED,
  BLOCK_CONFIG_STORAGE_KEY,
  formatMinutesAsTimeInput,
  getActiveBlockNameAt,
  getBlockConfigByName,
} from "../lib/taskBlocks";

type ClockVisualStyle = ClockTemplate;

type HomeVisualPrefs = {
  blockStyle: BlockVisualStyle;
  blockScale: number;
  ribbonStyle: RibbonVisualStyle;
  ribbonScale: number;
  tasksStyle: TasksVisualStyle;
  tasksScale: number;
  clockStyle: ClockVisualStyle;
  clockScale: number;
};

const HOME_VISUAL_PREFS_KEY = "daybyday.home.visual-prefs.v1";

const defaultHomeVisualPrefs: HomeVisualPrefs = {
  blockStyle: "punchy",
  blockScale: 1,
  ribbonStyle: "default",
  ribbonScale: 1,
  tasksStyle: "default",
  tasksScale: 1,
  clockStyle: "p5",
  clockScale: 1,
};

const clampScale = (value: number) => Math.min(1.5, Math.max(0.8, value));

function loadHomeVisualPrefs(): HomeVisualPrefs {
  if (typeof window === "undefined") return defaultHomeVisualPrefs;
  const raw = window.localStorage.getItem(HOME_VISUAL_PREFS_KEY);
  if (!raw) return defaultHomeVisualPrefs;
  try {
    const parsed = JSON.parse(raw) as Partial<HomeVisualPrefs>;
    return {
      blockStyle:
        parsed.blockStyle === "clean" || parsed.blockStyle === "outline"
          ? parsed.blockStyle
          : "punchy",
      blockScale: clampScale(parsed.blockScale ?? 1),
      ribbonStyle:
        parsed.ribbonStyle === "muted" || parsed.ribbonStyle === "high-contrast"
          ? parsed.ribbonStyle
          : "default",
      ribbonScale: clampScale(parsed.ribbonScale ?? 1),
      tasksStyle:
        parsed.tasksStyle === "card" || parsed.tasksStyle === "minimal"
          ? parsed.tasksStyle
          : "default",
      tasksScale: clampScale(parsed.tasksScale ?? 1),
      clockStyle:
        parsed.clockStyle === "minimal" ||
        parsed.clockStyle === "basic" ||
        parsed.clockStyle === "p5"
          ? parsed.clockStyle
          : "p5",
      clockScale: clampScale(parsed.clockScale ?? 1),
    };
  } catch {
    return defaultHomeVisualPrefs;
  }
}

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const [blockConfigVersion, setBlockConfigVersion] = useState(0);
  const [visualPrefs, setVisualPrefs] = useState<HomeVisualPrefs>(() =>
    loadHomeVisualPrefs(),
  );
  const context = useContextMenu();
  const { focusMode, switchFocusMode } = useDayTransition();

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

  useEffect(() => {
    window.localStorage.setItem(
      HOME_VISUAL_PREFS_KEY,
      JSON.stringify(visualPrefs),
    );
  }, [visualPrefs]);

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
    <div className="min-h-dvh">
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
            <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() =>
                  switchFocusMode("current-block", {
                    from: "All Day",
                    to: activeBlockName ?? "Current Block",
                  })
                }
                className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                  !isAllDayMode
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                  isAllDayMode
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
