export const WEATHER_MANUAL_COORDS_STORAGE_KEY = "dbd.weather.manualCoords";

export const WEATHER_COORDS_CHANGED = "dbd-weather-coords-changed";

export type ManualWeatherCoords = { lat: number; lon: number };

function parseStored(raw: string | null): ManualWeatherCoords | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (
      typeof v !== "object" ||
      v === null ||
      typeof (v as { lat?: unknown }).lat !== "number" ||
      typeof (v as { lon?: unknown }).lon !== "number"
    ) {
      return null;
    }
    const lat = (v as ManualWeatherCoords).lat;
    const lon = (v as ManualWeatherCoords).lon;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }
    return { lat, lon };
  } catch {
    return null;
  }
}

export function getManualWeatherCoords(): ManualWeatherCoords | null {
  if (typeof window === "undefined") return null;
  return parseStored(
    window.localStorage.getItem(WEATHER_MANUAL_COORDS_STORAGE_KEY),
  );
}

export function setManualWeatherCoords(coords: ManualWeatherCoords): void {
  window.localStorage.setItem(
    WEATHER_MANUAL_COORDS_STORAGE_KEY,
    JSON.stringify(coords),
  );
  window.dispatchEvent(new Event(WEATHER_COORDS_CHANGED));
}

export function clearManualWeatherCoords(): void {
  window.localStorage.removeItem(WEATHER_MANUAL_COORDS_STORAGE_KEY);
  window.dispatchEvent(new Event(WEATHER_COORDS_CHANGED));
}
