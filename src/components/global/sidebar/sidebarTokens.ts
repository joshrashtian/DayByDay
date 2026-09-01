/**
 * The sidebar's class tokens. Previously this was a registry of five
 * selectable styles; the sidebar now has one look, expressed entirely in
 * semantic color tokens so it follows light/dark automatically.
 */
export const sidebarTokens = {
  surface: "bg-surface",
  navItemActive: "bg-accent-soft text-accent",
  navItemIdle: "text-muted hover:bg-sunken hover:text-ink",
  navAccent: "bg-accent",
  divider: "border-line",
  utilityButton: "text-faint hover:bg-sunken hover:text-ink",
  primaryText: "text-ink",
  mutedText: "text-muted",
  softChip: "bg-sunken text-muted",
  focusedItem: "bg-accent-soft ring-1 ring-inset ring-accent/30",
  rowHover: "hover:bg-sunken",
  addButton:
    "border-line-strong text-muted hover:border-accent hover:text-accent",
} as const;

export type SidebarTokens = typeof sidebarTokens;
