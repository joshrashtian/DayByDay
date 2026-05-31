import type {
  HomePageThemeTokens,
  HomeThemeDefinition,
  HomeThemeDefinitionInput,
} from "./types";

export const blockAccentByTimeOfDay = (colors: {
  default: string;
  earlyMorning: string;
  afternoon: string;
  evening: string;
}) => ({
  unifiedBlockAccent: false as const,
  blockAccent: colors,
});

export const unifiedBlockAccent = (accent: string) => ({
  unifiedBlockAccent: true as const,
  blockAccent: {
    default: accent,
    earlyMorning: accent,
    afternoon: accent,
    evening: accent,
  },
});

export const lightFocusToggle = (
  track = "bg-zinc-200/70 dark:bg-zinc-800/60",
) => ({
  track,
  active:
    "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100",
  inactive:
    "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
});

export const darkFocusToggle = (
  track: string,
  active: string,
  inactive: string,
) => ({
  track,
  active,
  inactive,
});

export const emptyHomeSurfaces = (): HomePageThemeTokens => ({
  unifiedBlockAccent: false,
  blockAccent: {
    default: "bg-zinc-200/70 text-zinc-900",
    earlyMorning: "bg-sky-200/80 text-sky-950",
    afternoon: "bg-amber-200/80 text-amber-950",
    evening: "bg-indigo-200/80 text-indigo-950",
  },
  focusToggle: lightFocusToggle(),
  styleButton:
    "border-zinc-200/80 bg-white/90 text-zinc-800 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-900",
  ribbonOverlay: "",
  tasksOverlay: "",
  tasksInner: "font-eudoxus",
  tasksDropZone: "rounded-2xl",
  tasksDropZoneActive:
    "border border-sky-400 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30",
});

/** Shorthand for authoring a core or custom home theme. */
export function defineHomeTheme(
  input: HomeThemeDefinitionInput,
): HomeThemeDefinition {
  return {
    source: "core",
    ...input,
  };
}
