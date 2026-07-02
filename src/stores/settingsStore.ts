import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampAppZoom } from "@/lib/appZoom";
import { migrateLocalStorageKey } from "@/lib/storageMigration";
import type {
  AudioPrefs,
  BlockConfig,
  CategoryConfig,
  CustomSound,
  HomeVisualPrefs,
  ManualWeatherCoords,
} from "@/types";
import {
  DEFAULT_TASK_CLICK_SOUND_ID,
  customSoundId,
  evictTaskClickSoundFromCache,
  normalizeAudioPrefs,
} from "@/lib/taskClickSounds";
import { DEFAULT_SIDEBAR_STYLE_ID } from "@/themes/sidebarStyles";

type SidebarMode = "tasks" | "social" | "apps";

type SidebarState = {
  open: boolean;
  width: number;
  mode: SidebarMode;
  style: string;
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
  audioPrefs: AudioPrefs;
  customSounds: CustomSound[];
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
  setAudioPrefs: (
    prefs: AudioPrefs | ((prev: AudioPrefs) => AudioPrefs),
  ) => void;
  addCustomSound: (sound: CustomSound) => void;
  removeCustomSound: (id: string) => void;
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
  style: DEFAULT_SIDEBAR_STYLE_ID,
  taskOrder: [],
  socialOrder: [],
  appOrder: [],
};

const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  soundEnabled: true,
  volume: 80,
  taskClickSoundId: DEFAULT_TASK_CLICK_SOUND_ID,
};

function clampAudioVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_AUDIO_PREFS.volume;
  return Math.min(100, Math.max(0, Math.round(volume)));
}

function normalizeSettingsAudio(
  audioPrefs: Partial<AudioPrefs> | undefined,
  customSounds: CustomSound[],
): AudioPrefs {
  return normalizeAudioPrefs(
    {
      ...DEFAULT_AUDIO_PREFS,
      ...audioPrefs,
      volume: clampAudioVolume(audioPrefs?.volume ?? DEFAULT_AUDIO_PREFS.volume),
    },
    customSounds,
  );
}

const SETTINGS_STORAGE_KEY = "risebyday-settings";
migrateLocalStorageKey("daybyday-settings", SETTINGS_STORAGE_KEY);

function readLegacySettingsState(): Partial<SettingsState> | null {
  try {
    const raw = localStorage.getItem("daybyday-settings");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Partial<SettingsState> };
    const state = parsed?.state ?? (parsed as Partial<SettingsState>);
    return state && Object.keys(state).length > 0 ? state : null;
  } catch {
    return null;
  }
}

function migrateLegacyKeys(): Partial<SettingsState> {
  const migrated: Partial<SettingsState> = {};

  try {
    const homeVisual =
      localStorage.getItem("risebyday.home.visual-prefs.v1") ??
      localStorage.getItem("daybyday.home.visual-prefs.v1");
    if (homeVisual) {
      const parsed = JSON.parse(homeVisual);
      migrated.homeVisualPrefs = { ...DEFAULT_HOME_VISUAL_PREFS, ...parsed };
    }
  } catch {}

  try {
    const dt =
      localStorage.getItem("risebyday.home.day-transition.v1") ??
      localStorage.getItem("daybyday.home.day-transition.v1");
    if (dt === "true") migrated.dayTransitionEnabled = true;
    else if (dt === "false") migrated.dayTransitionEnabled = false;
  } catch {}

  try {
    const zoom =
      localStorage.getItem("rbd:zoom-level") ??
      localStorage.getItem("dbd:zoom-level");
    if (zoom) {
      const level = Number(zoom);
      if (Number.isFinite(level)) migrated.zoomLevel = level;
    }
  } catch {}

  try {
    const sidebar =
      localStorage.getItem("rbd-sidebar-state-v2") ??
      localStorage.getItem("dbd-sidebar-state-v2");
    if (sidebar) {
      const parsed = JSON.parse(sidebar);
      migrated.sidebar = { ...DEFAULT_SIDEBAR, ...parsed };
    }
  } catch {}

  try {
    const pinned =
      localStorage.getItem("rbd-toolkit-pinned-panels-v1") ??
      localStorage.getItem("dbd-toolkit-pinned-panels-v1");
    if (pinned) {
      const parsed = JSON.parse(pinned);
      if (Array.isArray(parsed)) migrated.pinnedToolkitPanels = parsed;
    }
  } catch {}

  try {
    const coords =
      localStorage.getItem("rbd.weather.manualCoords") ??
      localStorage.getItem("dbd.weather.manualCoords");
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
    const css =
      localStorage.getItem("rbd.blocks.userCss") ??
      localStorage.getItem("dbd.blocks.userCss");
    if (css) migrated.blocksUserCss = css;
  } catch {}

  try {
    const blocks =
      localStorage.getItem("risebyday-block-configs") ??
      localStorage.getItem("daybyday-block-configs");
    if (blocks) {
      const parsed = JSON.parse(blocks);
      if (Array.isArray(parsed)) migrated.blockConfigs = parsed;
    }
  } catch {}

  try {
    const cats =
      localStorage.getItem("risebyday-category-configs") ??
      localStorage.getItem("daybyday-category-configs");
    if (cats) {
      const parsed = JSON.parse(cats);
      if (Array.isArray(parsed)) migrated.categoryConfigs = parsed;
    }
  } catch {}

  return migrated;
}

function cleanupLegacyKeys(): void {
  const keys = [
    "daybyday-settings",
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
      audioPrefs: DEFAULT_AUDIO_PREFS,
      customSounds: [],
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
      setZoomLevel: (level) => set({ zoomLevel: clampAppZoom(level) }),
      setSidebar: (partial) =>
        set((s) => ({ sidebar: { ...s.sidebar, ...partial } })),
      setPinnedToolkitPanels: (panelIds) =>
        set({ pinnedToolkitPanels: panelIds }),
      setWeatherCoords: (coords) => set({ weatherCoords: coords }),
      setAudioPrefs: (prefs) =>
        set((s) => {
          const next =
            typeof prefs === "function" ? prefs(s.audioPrefs) : prefs;
          return {
            audioPrefs: normalizeSettingsAudio(next, s.customSounds),
          };
        }),
      addCustomSound: (sound) =>
        set((s) => ({
          customSounds: [...s.customSounds, sound],
          audioPrefs: normalizeSettingsAudio(
            {
              ...s.audioPrefs,
              taskClickSoundId: customSoundId(sound.id),
            },
            [...s.customSounds, sound],
          ),
        })),
      removeCustomSound: (id) =>
        set((s) => {
          const customSounds = s.customSounds.filter((sound) => sound.id !== id);
          evictTaskClickSoundFromCache(customSoundId(id));
          return {
            customSounds,
            audioPrefs: normalizeSettingsAudio(s.audioPrefs, customSounds),
          };
        }),
      setBlocksUserCss: (css) => set({ blocksUserCss: css }),
      setBlockConfigs: (configs) => set({ blockConfigs: configs }),
      setCategoryConfigs: (configs) => set({ categoryConfigs: configs }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      partialize: (state) => ({
        homeVisualPrefs: state.homeVisualPrefs,
        dayTransitionEnabled: state.dayTransitionEnabled,
        zoomLevel: state.zoomLevel,
        sidebar: state.sidebar,
        pinnedToolkitPanels: state.pinnedToolkitPanels,
        weatherCoords: state.weatherCoords,
        audioPrefs: state.audioPrefs,
        customSounds: state.customSounds,
        blocksUserCss: state.blocksUserCss,
        blockConfigs: state.blockConfigs,
        categoryConfigs: state.categoryConfigs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        if (p && Object.keys(p).length > 0) {
          const customSounds = Array.isArray(p.customSounds) ? p.customSounds : [];
          return {
            ...current,
            ...p,
            audioPrefs: normalizeSettingsAudio(p.audioPrefs, customSounds),
          } as SettingsState;
        }
        const previousSettings = readLegacySettingsState();
        if (previousSettings) {
          setTimeout(cleanupLegacyKeys, 1000);
          return { ...current, ...previousSettings } as SettingsState;
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

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === SETTINGS_STORAGE_KEY) {
      void useSettingsStore.persist.rehydrate();
    }
  });
}

export type { SidebarMode, SidebarState };
