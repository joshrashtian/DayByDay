export type { HomePageThemeTokens } from "@/themes/types";
export {
  getThemeBlockAccent,
  shouldApplyThemeTasksOverlay,
  mergeRibbonClass,
  THEME_AWARE_TASKS_STYLES,
} from "@/themes/homeThemeUtils";
export { getHomeTheme, normalizeHomeThemeId } from "@/themes/registry";

import { getHomeTheme, normalizeHomeThemeId } from "@/themes/registry";

/** @deprecated Prefer `resolveHomeTheme(id).home` from `@/themes`. */
export function getHomePageTheme(themeId: string) {
  return getHomeTheme(normalizeHomeThemeId(themeId)).home;
}
