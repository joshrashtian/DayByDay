export type {
  HomeThemeDefinition,
  HomeThemeDefinitionInput,
  HomeThemeId,
  HomeThemeListItem,
  HomePageThemeTokens,
  ResolvedHomeTheme,
  SectionStyleOption,
} from "./types";

export {
  blockAccentByTimeOfDay,
  darkFocusToggle,
  defineHomeTheme,
  emptyHomeSurfaces,
  lightFocusToggle,
  unifiedBlockAccent,
} from "./presets";

export { CORE_HOME_THEMES } from "./coreThemes";

export {
  homeThemeRegistry,
  registerHomeTheme,
  listHomeThemes,
  getHomeTheme,
  resolveHomeTheme,
  isHomeThemeId,
  normalizeHomeThemeId,
  getHomeThemeLabel,
} from "./registry";

export {
  blockStyleRegistry,
  ribbonStyleRegistry,
  tasksStyleRegistry,
  registerBlockStyleOption,
  registerRibbonStyleOption,
  registerTasksStyleOption,
} from "./sectionStyles";

export {
  ThemeRegistryProvider,
  useThemeRegistry,
  useHomeThemeList,
  useSectionStyleList,
} from "./ThemeRegistryProvider";

export {
  getThemeBlockAccent,
  shouldApplyThemeTasksOverlay,
  mergeRibbonClass,
  THEME_AWARE_TASKS_STYLES,
} from "./homeThemeUtils";

export { registerExampleCustomTheme } from "./exampleCustomTheme";
