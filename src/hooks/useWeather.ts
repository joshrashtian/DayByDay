import { useEffect, useRef, useState } from "react";
import { getManualWeatherCoords } from "../lib/weatherCoords";
import { useSettingsStore } from "../stores/settingsStore";

const FALLBACK_LAT = 34.0549;
const FALLBACK_LON = -118.2452;

export type { WeatherState } from "@/types";
import type { WeatherState } from "@/types";

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });
  const weatherCoords = useSettingsStore((s) => s.weatherCoords);
  const ranOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchForCoords = async (lat: number, lon: number) => {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: "temperature_2m,weather_code",
        temperature_unit: "fahrenheit",
      });
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      );
      if (!res.ok) throw new Error("weather http");
      const data = (await res.json()) as {
        current?: { temperature_2m?: number; weather_code?: number };
      };
      const t = data.current?.temperature_2m;
      const code = data.current?.weather_code;
      if (typeof t !== "number" || typeof code !== "number") {
        throw new Error("weather parse");
      }
      if (!cancelled) setState({ status: "ok", tempF: Math.round(t), code });
    };

    const resolveCoords = async (): Promise<{ lat: number; lon: number }> => {
      const manual = getManualWeatherCoords();
      if (manual) return manual;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                maximumAge: 600_000,
                timeout: 10_000,
              });
            },
          );
          return { lat: pos.coords.latitude, lon: pos.coords.longitude };
        } catch {
          /* use fallback */
        }
      }
      return { lat: FALLBACK_LAT, lon: FALLBACK_LON };
    };

    const run = async () => {
      if (!cancelled) setState({ status: "loading" });
      try {
        const { lat, lon } = await resolveCoords();
        await fetchForCoords(lat, lon);
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    };

    void run();
    ranOnce.current = true;

    return () => {
      cancelled = true;
    };
  }, [weatherCoords]);

  return state;
}
