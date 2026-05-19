import type { ToolkitPanel } from "@/types";

export type { ToolkitPanel } from "@/types";

export const TOOLKIT_PANELS: ToolkitPanel[] = [
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

export function getToolkitPanelRoute(panelId: string): string {
  return `/toolkit/${panelId}`;
}

const TOOLKIT_PINNED_STORAGE_KEY = "dbd-toolkit-pinned-panels-v1";
export const TOOLKIT_PINNED_UPDATED_EVENT = "dbd:toolkit-pinned-updated";

export function loadPinnedToolkitPanels(): string[] {
  try {
    const raw = localStorage.getItem(TOOLKIT_PINNED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(TOOLKIT_PANELS.map((panel) => panel.id));
    return parsed.filter(
      (panelId): panelId is string =>
        typeof panelId === "string" && allowed.has(panelId),
    );
  } catch {
    return [];
  }
}

export function savePinnedToolkitPanels(panelIds: string[]) {
  const allowed = new Set(TOOLKIT_PANELS.map((panel) => panel.id));
  const uniquePanelIds = [...new Set(panelIds)].filter((panelId) =>
    allowed.has(panelId),
  );
  localStorage.setItem(
    TOOLKIT_PINNED_STORAGE_KEY,
    JSON.stringify(uniquePanelIds),
  );
  window.dispatchEvent(
    new CustomEvent(TOOLKIT_PINNED_UPDATED_EVENT, { detail: uniquePanelIds }),
  );
}
