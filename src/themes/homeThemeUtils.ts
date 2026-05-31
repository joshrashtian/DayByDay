import type { TasksVisualStyle } from "@/types";
import type { HomePageThemeTokens } from "./types";
import { THEME_AWARE_TASKS_STYLES } from "./types";

export type { HomePageThemeTokens } from "./types";
export { THEME_AWARE_TASKS_STYLES } from "./types";

export function getThemeBlockAccent(
  theme: HomePageThemeTokens,
  blockName?: string,
): string {
  const normalized = blockName?.toLowerCase() ?? "";
  if (normalized === "early morning") return theme.blockAccent.earlyMorning;
  if (normalized === "afternoon") return theme.blockAccent.afternoon;
  if (normalized === "evening" || normalized === "late night") {
    return theme.blockAccent.evening;
  }
  return theme.blockAccent.default;
}

export function shouldApplyThemeTasksOverlay(
  tasksStyle: TasksVisualStyle,
): boolean {
  return THEME_AWARE_TASKS_STYLES.includes(tasksStyle);
}

export function mergeRibbonClass(
  ribbonStyleClass: string,
  themeOverlay: string,
): string {
  if (!themeOverlay) return ribbonStyleClass;
  return `${ribbonStyleClass} ${themeOverlay}`;
}
