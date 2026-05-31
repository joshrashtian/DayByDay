import type {
  ClockStylePrototype,
  ClockStylePrototypeInput,
  ClockStyleSource,
  ClockTemplate,
  TasksVisualStyle,
} from "@/types";

export type HomeThemeId = string;

export type HomePageThemeTokens = {
  unifiedBlockAccent: boolean;
  blockAccent: {
    default: string;
    earlyMorning: string;
    afternoon: string;
    evening: string;
  };
  focusToggle: {
    track: string;
    active: string;
    inactive: string;
  };
  styleButton: string;
  ribbonOverlay: string;
  tasksOverlay: string;
  tasksInner: string;
  tasksDropZone: string;
  tasksDropZoneActive: string;
};

export type HomeThemePageTokens = {
  className: string;
  contentClassName?: string;
};

/** Metadata + home surface tokens + optional clock overrides for one page theme. */
export type HomeThemeDefinition = {
  id: HomeThemeId;
  label: string;
  description: string;
  source: ClockStyleSource;
  /** Which clock layout/renderer to use (minimal, terminal, orbit, …). */
  template: ClockTemplate;
  /** Tailwind gradient classes for theme picker swatches. */
  swatch: string;
  page: HomeThemePageTokens;
  home: HomePageThemeTokens;
  clockOverrides?: ClockStylePrototypeInput;
};

export type HomeThemeDefinitionInput = Omit<
  HomeThemeDefinition,
  "id" | "source"
> & {
  id: HomeThemeId;
  source?: ClockStyleSource;
};

export type HomeThemeListItem = Pick<
  HomeThemeDefinition,
  "id" | "label" | "description" | "swatch" | "source" | "template"
>;

/** Extensible style picker entry for block banner, ribbon, tasks, etc. */
export type SectionStyleOption<T extends string = string> = {
  id: T;
  label: string;
  description?: string;
};

export type SectionStyleResolver<T extends string = string> = (
  styleId: T,
  ...args: never[]
) => string;

export const THEME_AWARE_TASKS_STYLES: TasksVisualStyle[] = [
  "default",
  "card",
  "minimal",
];

export type ResolvedHomeTheme = HomeThemeDefinition & {
  clock: ClockStylePrototype;
};
