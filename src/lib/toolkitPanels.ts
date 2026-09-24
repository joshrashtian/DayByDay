import type { ToolkitPanel } from "@/types";
import { useSettingsStore } from "../stores/settingsStore";
import { SPOTIFY_ENABLED } from "./featureFlags";

export type { ToolkitPanel } from "@/types";

const ALL_TOOLKIT_PANELS: ToolkitPanel[] = [
  {
    id: "spotify",
    label: "Spotify",
    description: "Music controls and listening context in one place.",
    route: "/spotify",
  },
  {
    id: "classes",
    label: "Classes",
    description:
      "Dedicated place for class schedule, notes, and quick actions.",
    route: "/toolkit/classes",
  },
];

export const TOOLKIT_PANELS = ALL_TOOLKIT_PANELS.filter(
  (panel) => SPOTIFY_ENABLED || panel.id !== "spotify",
);

export function getToolkitPanelRoute(panelId: string): string {
  return `/toolkit/${panelId}`;
}

export function loadPinnedToolkitPanels(): string[] {
  const panelIds = useSettingsStore.getState().pinnedToolkitPanels;
  const allowed = new Set(TOOLKIT_PANELS.map((panel) => panel.id));
  return panelIds.filter((id) => allowed.has(id));
}

export function savePinnedToolkitPanels(panelIds: string[]): void {
  const allowed = new Set(TOOLKIT_PANELS.map((panel) => panel.id));
  const uniquePanelIds = [...new Set(panelIds)].filter((id) => allowed.has(id));
  useSettingsStore.getState().setPinnedToolkitPanels(uniquePanelIds);
}
