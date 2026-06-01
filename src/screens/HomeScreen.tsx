import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { HomeStyleBottomSheet } from "../components/home/HomeStyleBottomSheet";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import { useContextMenu } from "../providers/ContextMenuProvider";
import { useDayTransition } from "../providers/DayTransitionProvider";
import { getBlockBannerClasses } from "../providers/homeBlockBannerStyles";
import { getCriticalRibbonClass } from "../providers/homeCriticalRibbonStyles";
import {
  getThemeBlockAccent,
  mergeRibbonClass,
  shouldApplyThemeTasksOverlay,
} from "../providers/homePageThemes";
import { getTasksPanelClass } from "../providers/homeTasksPanelStyles";
import { useStyle } from "../providers/StyleProvider";
import {
  blockStyleRegistry,
  normalizeHomeThemeId,
  isHomeThemeId,
  resolveHomeTheme,
  ribbonStyleRegistry,
  tasksStyleRegistry,
  useHomeThemeList,
} from "../themes";
import {
  formatMinutesAsTimeInput,
  getActiveBlockNameAt,
  getBlockConfigByName,
} from "../lib/taskBlocks";
import { useSettingsStore } from "../stores/settingsStore";
import { usePomodoroStore } from "../stores/pomodoroStore";
import { IoColorPaletteOutline } from "react-icons/io5";

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const [styleSheetOpen, setStyleSheetOpen] = useState(false);
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const visualPrefs = useSettingsStore((s) => s.homeVisualPrefs);
  const setVisualPrefs = useSettingsStore((s) => s.setHomeVisualPrefs);
  const { getClockStyle } = useStyle();
  const context = useContextMenu();
  const { focusMode, switchFocusMode } = useDayTransition();
  const themeList = useHomeThemeList();
  const pomodoroPanelOpen = usePomodoroStore((s) => s.panelOpen);
  const pomodoroDockExpanded = usePomodoroStore((s) => s.dockExpanded);

  const styleButtonBottomClass = useMemo(() => {
    if (pomodoroPanelOpen) return "bottom-32";
    if (pomodoroDockExpanded) return "bottom-54";
    return "bottom-16";
  }, [pomodoroPanelOpen, pomodoroDockExpanded]);

  const themeId = normalizeHomeThemeId(visualPrefs.clockStyle);
  const resolvedTheme = resolveHomeTheme(themeId);
  const pageTheme = getClockStyle(themeId);
  const homeTheme = resolvedTheme.home;

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

  const blockAccentClass = getThemeBlockAccent(homeTheme, displayedBlockName);

  const blockClasses = getBlockBannerClasses(
    visualPrefs.blockStyle,
    blockAccentClass,
  );
  const ribbonStyleClass = mergeRibbonClass(
    getCriticalRibbonClass(visualPrefs.ribbonStyle),
    homeTheme.ribbonOverlay,
  );
  const tasksThemeActive = shouldApplyThemeTasksOverlay(visualPrefs.tasksStyle);
  const tasksStyleClass = [
    getTasksPanelClass(visualPrefs.tasksStyle, {
      themeActive: tasksThemeActive,
    }),
    tasksThemeActive ? homeTheme.tasksOverlay : "",
  ]
    .filter(Boolean)
    .join(" ");

  const openStyleSheet = () => setStyleSheetOpen(true);

  const openBlockMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "block-header", type: "header", header: "Block Banner" },
      ...blockStyleRegistry.list().map((option) => ({
        id: `block-style-${option.id}`,
        type: "item" as const,
        label: `Style: ${option.label}`,
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, blockStyle: option.id })),
      })),
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
      { id: "block-sheet-break", type: "break" },
      {
        id: "block-open-sheet",
        type: "item",
        label: "Open style sheet…",
        onSelect: openStyleSheet,
      },
    ]);
  };

  const openRibbonMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "ribbon-header", type: "header", header: "Critical Ribbon" },
      ...ribbonStyleRegistry.list().map((option) => ({
        id: `ribbon-style-${option.id}`,
        type: "item" as const,
        label: `Style: ${option.label}`,
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, ribbonStyle: option.id })),
      })),
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
      { id: "ribbon-sheet-break", type: "break" },
      {
        id: "ribbon-open-sheet",
        type: "item",
        label: "Open style sheet…",
        onSelect: openStyleSheet,
      },
    ]);
  };

  const openTasksMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "tasks-header", type: "header", header: "Task Focus Panel" },
      ...tasksStyleRegistry.list().map((option) => ({
        id: `tasks-style-${option.id}`,
        type: "item" as const,
        label: `Style: ${option.label}`,
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, tasksStyle: option.id })),
      })),
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
      { id: "tasks-sheet-break", type: "break" },
      {
        id: "tasks-open-sheet",
        type: "item",
        label: "Open style sheet…",
        onSelect: openStyleSheet,
      },
    ]);
  };

  const openClockMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    context.openMenu(event, [
      { id: "clock-header", type: "header", header: "Page Theme" },
      ...themeList.map((option) => ({
        id: `clock-style-${option.id}`,
        type: "item" as const,
        label: `Style: ${option.label}`,
        onSelect: () =>
          setVisualPrefs((prev) => ({ ...prev, clockStyle: option.id })),
      })),
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
      { id: "clock-sheet-break", type: "break" },
      {
        id: "clock-open-sheet",
        type: "item",
        label: "Open style sheet…",
        onSelect: openStyleSheet,
      },
    ]);
  };

  return (
    <div
      className={`min-h-dvh transition-colors duration-500 ${pageTheme.pageClassName}`}
    >
      <main
        className={`home-content mx-auto max-w-6xl px-3 pb-10 pt-20 transition-colors duration-500 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8 ${pageTheme.pageContentClassName ?? ""}`}
      >
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-10">
          <div className="flex min-w-0 flex-col items-stretch gap-5">
            <div
              onContextMenu={openBlockMenu}
              className={`flex w-fit max-w-full items-start justify-start p-4 px-5 text-left font-bold transition-colors duration-500 sm:p-6 sm:px-10 ${blockClasses.containerClassName}`}
              style={{
                transform: `scale(${visualPrefs.blockScale})`,
                transformOrigin: "left top",
              }}
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
            <div
              className={`inline-flex w-fit items-center gap-0.5 rounded-full p-0.5 font-eudoxus text-xs transition-colors duration-500 ${homeTheme.focusToggle.track}`}
            >
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
                    ? homeTheme.focusToggle.active
                    : homeTheme.focusToggle.inactive
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
                    ? homeTheme.focusToggle.active
                    : homeTheme.focusToggle.inactive
                }`}
                aria-pressed={isAllDayMode}
              >
                All Day
              </button>
            </div>
            <div
              onContextMenu={openRibbonMenu}
              className="w-fit"
              style={{
                transform: `scale(${visualPrefs.ribbonScale})`,
                transformOrigin: "left top",
              }}
            >
              <CriticalHeaderRibbon
                ribbonContainerClassName={ribbonStyleClass}
              />
            </div>
            <div
              onContextMenu={openTasksMenu}
              className={tasksStyleClass}
              style={{
                transform: `scale(${visualPrefs.tasksScale})`,
                transformOrigin: "left top",
              }}
            >
              <TasksFrontPage
                activeBlockName={displayedBlockName}
                themeInnerClass={
                  tasksThemeActive ? homeTheme.tasksInner : "font-eudoxus"
                }
                themeDropZoneClass={
                  tasksThemeActive ? homeTheme.tasksDropZone : "rounded-2xl"
                }
                themeDropZoneActiveClass={
                  tasksThemeActive
                    ? homeTheme.tasksDropZoneActive
                    : "border border-sky-400 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30"
                }
                themeAware={tasksThemeActive}
                themePomodoroToggleClass={
                  tasksThemeActive ? homeTheme.focusToggle.track : undefined
                }
              />
            </div>
          </div>
          <aside
            onContextMenu={openClockMenu}
            className="flex justify-start xl:shrink-0 xl:justify-end"
          >
            <DateCorner
              variant={themeId}
              scale={visualPrefs.clockScale}
              onScaleChange={(nextScale) =>
                setVisualPrefs((prev) => ({ ...prev, clockScale: nextScale }))
              }
              onVariantChange={(nextStyle) =>
                setVisualPrefs((prev) => ({
                  ...prev,
                  clockStyle: isHomeThemeId(nextStyle)
                    ? nextStyle
                    : prev.clockStyle,
                }))
              }
              onOpenStyleSheet={openStyleSheet}
            />
          </aside>
        </div>
      </main>

      <button
        type="button"
        onClick={openStyleSheet}
        className={`fixed ${styleButtonBottomClass} right-4 z-20 inline-flex items-center gap-2 rounded-full border p-4 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] sm:right-6 ${homeTheme.styleButton}`}
        aria-label="Customize home style"
      >
        <IoColorPaletteOutline className="text-base" />
      </button>

      <HomeStyleBottomSheet
        open={styleSheetOpen}
        onClose={() => setStyleSheetOpen(false)}
        prefs={visualPrefs}
        onPrefsChange={setVisualPrefs}
      />
    </div>
  );
};
