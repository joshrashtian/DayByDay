import type { ManualWeatherCoords } from "@/types";
import { useSettingsStore } from "../stores/settingsStore";

export type { ManualWeatherCoords } from "@/types";

export function getManualWeatherCoords(): ManualWeatherCoords | null {
  return useSettingsStore.getState().weatherCoords;
}

export function setManualWeatherCoords(coords: ManualWeatherCoords): void {
  useSettingsStore.getState().setWeatherCoords(coords);
}

export function clearManualWeatherCoords(): void {
  useSettingsStore.getState().setWeatherCoords(null);
}
