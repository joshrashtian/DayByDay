import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BlockConfig,
  CategoryConfig,
  HomeVisualPrefs,
  ManualWeatherCoords,
} from "@/types";

type SidebarMode = "tasks" | "social" | "apps";

type SidebarState = {
  open: boolean;
  width: number;
  mode: SidebarMode;
  taskOrder: string[];
  socialOrder: string[];
  appOrder: string[];
};

type SettingsState = {
  homeVisualPrefs: HomeVisualPrefs;
  dayTransitionEnabled: boolean;
  zoomLevel: number;
  sidebar: SidebarState;
  pinnedToolkitPanels: string[];
  weatherCoords: ManualWeatherCoords | null;
  blocksUserCss: string;
  blockConfigs: BlockConfig[];
  categoryConfigs: CategoryConfig[];

  setHomeVisualPrefs: (
    prefs: HomeVisualPrefs | ((prev: HomeVisualPrefs) => HomeVisualPrefs),
  ) => void;
  setDayTransitionEnabled: (enabled: boolean) => void;
  setZoomLevel: (level: number) => void;
  setSidebar: (state: Partial<SidebarState>) => void;
  setPinnedToolkitPanels: (panelIds: string[]) => void;
  setWeatherCoords: (coords: ManualWeatherCoords | null) => void;
  setBlocksUserCss: (css: string) => void;
  setBlockConfigs: (configs: BlockConfig[]) => void;
  setCategoryConfigs: (configs: CategoryConfig[]) => void;
};

const DEFAULT_HOME_VISUAL_PREFS: HomeVisualPrefs = {
  blockStyle: "punchy",
  blockScale: 1,
  ribbonStyle: "default",
  ribbonScale: 1,
  tasksStyle: "default",
  tasksScale: 1,
  clockStyle: "p5",
  clockScale: 1,
};

const DEFAULT_SIDEBAR: SidebarState = {
  open: true,
  width: 220,
  mode: "tasks",
  taskOrder: [],
  socialOrder: [],
  appOrder: [],
};

function migrateLegacyKeys(): Partial<SettingsState> {
  const migrated: Partial<SettingsState> = {};

  try {
    const homeVisual = localStorage.getItem("daybyday.home.visual-prefs.v1");
    if (homeVisual) {
      const parsed = JSON.parse(homeVisual);
      migrated.homeVisualPrefs = { ...DEFAULT_HOME_VISUAL_PREFS, ...parsed };
    }
  } catch {}

  try {
    const dt = localStorage.getItem("daybyday.home.day-transition.v1");
    if (dt === "true") migrated.dayTransitionEnabled = true;
    else if (dt === "false") migrated.dayTransitionEnabled = false;
  } catch {}

  try {
    const zoom = localStorage.getItem("dbd:zoom-level");
    if (zoom) {
      const level = Number(zoom);
      if (Number.isFinite(level)) migrated.zoomLevel = level;
    }
  } catch {}

  try {
    const sidebar = localStorage.getItem("dbd-sidebar-state-v2");
    if (sidebar) {
      const parsed = JSON.parse(sidebar);
      migrated.sidebar = { ...DEFAULT_SIDEBAR, ...parsed };
    }
  } catch {}

  try {
    const pinned = localStorage.getItem("dbd-toolkit-pinned-panels-v1");
    if (pinned) {
      const parsed = JSON.parse(pinned);
      if (Array.isArray(parsed)) migrated.pinnedToolkitPanels = parsed;
    }
  } catch {}

  try {
    const coords = localStorage.getItem("dbd.weather.manualCoords");
    if (coords) {
      const parsed = JSON.parse(coords);
      if (
        typeof parsed?.lat === "number" &&
        typeof parsed?.lon === "number" &&
        Number.isFinite(parsed.lat) &&
        Number.isFinite(parsed.lon)
      ) {
        migrated.weatherCoords = { lat: parsed.lat, lon: parsed.lon };
      }
    }
  } catch {}

  try {
    const css = localStorage.getItem("dbd.blocks.userCss");
    if (css) migrated.blocksUserCss = css;
  } catch {}

  try {
    const blocks = localStorage.getItem("daybyday-block-configs");
    if (blocks) {
      const parsed = JSON.parse(blocks);
      if (Array.isArray(parsed)) migrated.blockConfigs = parsed;
    }
  } catch {}

  try {
    const cats = localStorage.getItem("daybyday-category-configs");
    if (cats) {
      const parsed = JSON.parse(cats);
      if (Array.isArray(parsed)) migrated.categoryConfigs = parsed;
    }
  } catch {}

  return migrated;
}

function cleanupLegacyKeys(): void {
  const keys = [
    "daybyday.home.visual-prefs.v1",
    "daybyday.home.day-transition.v1",
    "dbd:zoom-level",
    "dbd-sidebar-state-v2",
    "dbd-toolkit-pinned-panels-v1",
    "dbd.weather.manualCoords",
    "dbd.blocks.userCss",
    "daybyday-block-configs",
    "daybyday-category-configs",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      homeVisualPrefs: DEFAULT_HOME_VISUAL_PREFS,
      dayTransitionEnabled:
        typeof window !== "undefined"
          ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          : true,
      zoomLevel: 1,
      sidebar: DEFAULT_SIDEBAR,
      pinnedToolkitPanels: [],
      weatherCoords: null,
      blocksUserCss: "",
      blockConfigs: [],
      categoryConfigs: [],

      setHomeVisualPrefs: (prefs) =>
        set((s) => ({
          homeVisualPrefs:
            typeof prefs === "function" ? prefs(s.homeVisualPrefs) : prefs,
        })),
      setDayTransitionEnabled: (enabled) =>
        set({ dayTransitionEnabled: enabled }),
      setZoomLevel: (level) => set({ zoomLevel: level }),
      setSidebar: (partial) =>
        set((s) => ({ sidebar: { ...s.sidebar, ...partial } })),
      setPinnedToolkitPanels: (panelIds) =>
        set({ pinnedToolkitPanels: panelIds }),
      setWeatherCoords: (coords) => set({ weatherCoords: coords }),
      setBlocksUserCss: (css) => set({ blocksUserCss: css }),
      setBlockConfigs: (configs) => set({ blockConfigs: configs }),
      setCategoryConfigs: (configs) => set({ categoryConfigs: configs }),
    }),
    {
      name: "daybyday-settings",
      partialize: (state) => ({
        homeVisualPrefs: state.homeVisualPrefs,
        dayTransitionEnabled: state.dayTransitionEnabled,
        zoomLevel: state.zoomLevel,
        sidebar: state.sidebar,
        pinnedToolkitPanels: state.pinnedToolkitPanels,
        weatherCoords: state.weatherCoords,
        blocksUserCss: state.blocksUserCss,
        blockConfigs: state.blockConfigs,
        categoryConfigs: state.categoryConfigs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        if (p && Object.keys(p).length > 0) {
          return { ...current, ...p } as SettingsState;
        }
        const legacy = migrateLegacyKeys();
        if (Object.keys(legacy).length > 0) {
          setTimeout(cleanupLegacyKeys, 1000);
          return { ...current, ...legacy } as SettingsState;
        }
        return current as SettingsState;
      },
    },
  ),
);

export type { SidebarMode, SidebarState };
