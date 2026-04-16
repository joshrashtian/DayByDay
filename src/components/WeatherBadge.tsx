import type { ReactNode } from "react";
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiFog,
  WiSprinkle,
  WiRain,
  WiSnow,
  WiShowers,
  WiThunderstorm,
} from "react-icons/wi";
import type { WeatherState } from "../hooks/useWeather";

const iconSize = (compact: boolean) => (compact ? "h-5 w-5" : "h-8 w-8");

function iconForWmoCode(code: number, compact: boolean): ReactNode {
  const s = iconSize(compact);
  if (code === 0) return <WiDaySunny className={s} aria-hidden />;
  if (code <= 3) return <WiDayCloudy className={s} aria-hidden />;
  if (code <= 48) return <WiFog className={s} aria-hidden />;
  if (code <= 57) return <WiSprinkle className={s} aria-hidden />;
  if (code <= 67) return <WiRain className={s} aria-hidden />;
  if (code <= 77) return <WiSnow className={s} aria-hidden />;
  if (code <= 82) return <WiShowers className={s} aria-hidden />;
  if (code <= 86) return <WiSnow className={s} aria-hidden />;
  if (code <= 99) return <WiThunderstorm className={s} aria-hidden />;
  return <WiCloudy className={s} aria-hidden />;
}

type Props = {
  weather: WeatherState;
  className?: string;
  iconClassName?: string;

  temperatureClassName?: string;

  compact?: boolean;
};

export function WeatherBadge({
  weather,
  className = "-skew-x-12",
  iconClassName = "",
  temperatureClassName = "text-sm font-medium tabular-nums tracking-tight",
  compact = false,
}: Props) {
  const loadIcon = compact ? "h-4 w-4" : "h-8 w-8";
  if (weather.status === "loading") {
    return (
      <div
        className={`flex items-center gap-1 opacity-70 ${className}`}
        aria-live="polite"
        aria-busy="true"
      >
        <WiDayCloudy className={`${loadIcon} animate-pulse ${iconClassName}`} />
        <span className={temperatureClassName}>…</span>
      </div>
    );
  }

  if (weather.status === "error") {
    return (
      <div
        className={`flex items-center gap-1 opacity-50 ${className}`}
        title="Weather unavailable"
      >
        <WiCloudy
          className={`${loadIcon} text-zinc-900 ${iconClassName}`}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-zinc-900 ${className}`}
      title="Current weather (Open-Meteo)"
    >
      <span className={`shrink-0 ${iconClassName}`}>
        {iconForWmoCode(weather.code, compact)}
      </span>
      <span className={temperatureClassName}>{weather.tempF}°</span>
    </div>
  );
}
