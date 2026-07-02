import { useEffect, useMemo, useState } from "react";
import { DateCorner } from "../components/dateCorner";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";
import { useDayTransition } from "../providers/DayTransitionProvider";
import { getBlockBannerClasses } from "../providers/homeBlockBannerStyles";
import {
  getCriticalRibbonClass,
  ribbonStyleIsThemeable,
} from "../providers/homeCriticalRibbonStyles";
import {
  getThemeBlockAccent,
  mergeRibbonClass,
  shouldApplyThemeTasksOverlay,
} from "../providers/homePageThemes";
import { getTasksPanelClass } from "../providers/homeTasksPanelStyles";
import { useStyle } from "../providers/StyleProvider";
import { normalizeHomeThemeId, resolveHomeTheme } from "../themes";
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

export const HomeScreen = () => {
  const [minuteOfDay, setMinuteOfDay] = useState(() => nowMinuteOfDay());
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const visualPrefs = useSettingsStore((s) => s.homeVisualPrefs);
  const { getClockStyle } = useStyle();
  const { focusMode, switchFocusMode } = useDayTransition();

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
    ribbonStyleIsThemeable(visualPrefs.ribbonStyle)
      ? homeTheme.ribbonOverlay
      : "",
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
              className="w-fit"
              style={{
                transform: `scale(${visualPrefs.ribbonScale})`,
                transformOrigin: "left top",
              }}
            >
              <CriticalHeaderRibbon
                style={visualPrefs.ribbonStyle}
                ribbonContainerClassName={ribbonStyleClass}
              />
            </div>
            <div
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
          <aside className="flex justify-start xl:shrink-0 xl:justify-end">
            <DateCorner variant={themeId} scale={visualPrefs.clockScale} />
          </aside>
        </div>
      </main>
    </div>
  );
};
