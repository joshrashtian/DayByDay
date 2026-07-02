import type { SidebarStyleDefinition, SidebarStyleTokens } from "@/types";

/** Shared text/row tokens for white-on-color (dark-toned) surfaces. */
const whiteOnSurface: Pick<
  SidebarStyleTokens,
  | "primaryText"
  | "mutedText"
  | "softChip"
  | "focusedItem"
  | "rowHover"
  | "addButton"
> = {
  primaryText: "text-white",
  mutedText: "text-white/60",
  softChip: "bg-white/20 text-white/80",
  focusedItem: "bg-white/25 ring-1 ring-inset ring-white/30",
  rowHover: "hover:bg-white/10",
  addButton:
    "border-white/30 bg-white/10 text-white/80 hover:border-white/50 hover:bg-white/20",
};

/**
 * Selectable sidebar styles — the sidebar analog of the home theme registry
 * (`src/themes/registry.ts`). Each style is a bundle of Tailwind class tokens
 * applied to the nav surface, items, divider, and utility bar.
 *
 * To add a style, append an entry here; the picker in settings and the
 * sidebar both read from `SIDEBAR_STYLES`.
 */
export const SIDEBAR_STYLES: SidebarStyleDefinition[] = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Blue-to-purple gradient, white type",
    swatch: "from-blue-700 to-purple-500",
    tokens: {
      surface: "bg-linear-to-tr from-blue-700 to-purple-500",
      navItemActive: "bg-white/25 rotate-3 text-white",
      navItemIdle: "text-white/70 hover:bg-white/15 hover:text-white",
      navAccent: "bg-white",
      divider: "border-white/20",
      utilityButton: "text-white/60 hover:bg-white/20 hover:text-white",
      ...whiteOnSurface,
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep slate, calm and focused",
    swatch: "from-zinc-900 to-zinc-800",
    tokens: {
      surface: "bg-linear-to-b from-zinc-900 to-zinc-950",
      navItemActive: "bg-white/15 -rotate-1 text-white",
      navItemIdle: "text-zinc-400 hover:bg-white/10 hover:text-white",
      navAccent: "bg-blue-400",
      divider: "border-white/10",
      utilityButton: "text-zinc-500 hover:bg-white/10 hover:text-white",
      ...whiteOnSurface,
      mutedText: "text-zinc-400",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Warm amber-to-rose glow",
    swatch: "from-orange-500 to-rose-500",
    tokens: {
      surface: "bg-linear-to-tr from-orange-500 via-rose-500 to-pink-600",
      navItemActive: "bg-white/25 text-white",
      navItemIdle: "text-white/75 hover:bg-white/15 hover:text-white",
      navAccent: "bg-white",
      divider: "border-white/25",
      utilityButton: "text-white/70 hover:bg-white/20 hover:text-white",
      ...whiteOnSurface,
      mutedText: "text-white/70",
    },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Cool emerald and teal tones",
    swatch: "from-emerald-700 to-teal-600",
    tokens: {
      surface: "bg-linear-to-b from-emerald-700 to-teal-800",
      navItemActive: "bg-white/20 text-white",
      navItemIdle: "text-emerald-50/75 hover:bg-white/12 hover:text-white",
      navAccent: "bg-emerald-200",
      divider: "border-white/20",
      utilityButton: "text-emerald-50/65 hover:bg-white/15 hover:text-white",
      ...whiteOnSurface,
      mutedText: "text-emerald-50/65",
    },
  },
  {
    id: "frost",
    label: "Frost",
    description: "Light glass, dark type",
    swatch: "from-zinc-100 to-zinc-300",
    tokens: {
      surface:
        "bg-linear-to-b from-white/90 to-zinc-100/90 ring-1 ring-zinc-200/70 dark:from-zinc-900/90 dark:to-zinc-950/90 dark:ring-zinc-800/70",
      navItemActive:
        "bg-zinc-900/10 text-zinc-900 dark:bg-white/15 shadow-xl -rotate-1 dark:text-white",
      navItemIdle:
        "text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
      navAccent: "bg-blue-500",
      divider: "border-zinc-200/80 dark:border-white/10",
      utilityButton:
        "text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white",
      primaryText: "text-zinc-900 dark:text-white",
      mutedText: "text-zinc-500 dark:text-zinc-400",
      softChip:
        "bg-zinc-900/5 text-zinc-600 dark:bg-white/15 dark:text-white/80",
      focusedItem:
        "bg-zinc-900/10 ring-1 ring-inset ring-zinc-900/15 dark:bg-white/20 dark:ring-white/30",
      rowHover: "hover:bg-zinc-900/5 dark:hover:bg-white/10",
      addButton:
        "border-zinc-300 bg-zinc-900/[0.03] text-zinc-600 hover:border-zinc-400 hover:bg-zinc-900/5 dark:border-white/30 dark:bg-white/10 dark:text-white/80 dark:hover:border-white/50 dark:hover:bg-white/20",
    },
  },
];

export const DEFAULT_SIDEBAR_STYLE_ID = SIDEBAR_STYLES[0].id;

const byId = new Map(SIDEBAR_STYLES.map((style) => [style.id, style]));

export function listSidebarStyles(): SidebarStyleDefinition[] {
  return SIDEBAR_STYLES;
}

export function getSidebarStyle(id?: string): SidebarStyleDefinition {
  return (id && byId.get(id)) || byId.get(DEFAULT_SIDEBAR_STYLE_ID)!;
}

export function isSidebarStyleId(value: string): boolean {
  return byId.has(value);
}

export function normalizeSidebarStyleId(value?: string): string {
  return value && byId.has(value) ? value : DEFAULT_SIDEBAR_STYLE_ID;
}
