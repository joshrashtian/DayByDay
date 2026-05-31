import {
  getHomeThemeLabel,
  listHomeThemes,
} from "@/themes/registry";

export type ClockStyleOption = {
  id: string;
  label: string;
  description: string;
};

export function listClockStyleOptions(): ClockStyleOption[] {
  return listHomeThemes().map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}

export function getClockStyleLabel(themeId: string): string {
  return getHomeThemeLabel(themeId);
}

/** Static snapshot of bundled themes at module load. Prefer `useHomeThemeList()` for custom themes. */
export const CLOCK_STYLE_OPTIONS: ClockStyleOption[] = listClockStyleOptions();

export const CLOCK_STYLE_LABELS: Record<string, string> = Object.fromEntries(
  CLOCK_STYLE_OPTIONS.map((option) => [option.id, option.label]),
);
