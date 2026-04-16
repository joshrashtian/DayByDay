import { useEffect, useState } from "react";

//los angeles
const FALLBACK_LAT = 34.0549;
const FALLBACK_LON = -118.2452;

export type WeatherState =
  | { status: "loading" }
  | { status: "ok"; tempF: number; code: number }
  | { status: "error" };

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

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

    const run = async () => {
      let lat = FALLBACK_LAT;
      let lon = FALLBACK_LON;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              maximumAge: 600_000,
              timeout: 10_000,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          /* use fallback */
        }
      }
      try {
        await fetchForCoords(lat, lon);
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
