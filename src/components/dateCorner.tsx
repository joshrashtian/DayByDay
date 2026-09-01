import { WeatherBadge } from "./WeatherBadge";
import { useWeather } from "../hooks/useWeather";

type Props = {
  /** Override the outer positioning wrapper (the home page renders it inline). */
  rootClassName?: string;
};

/**
 * The date/weather corner. One look: a skewed accent block holding the date,
 * with the weekday and weather sitting under it.
 */
export const DateCorner = ({ rootClassName }: Props) => {
  const today = new Date();
  const weather = useWeather();

  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const month = today.getMonth() + 1;
  const day = today.getDate().toString().padStart(2, "0");

  return (
    <div className={rootClassName ?? "isolate select-none"}>
      <div className="group relative inline-flex flex-col items-end gap-0.5">
        <div className="relative inline-flex items-baseline gap-1 px-6 py-3">
          <span
            className="pointer-events-none absolute inset-0 -z-10 -skew-x-12 rounded-sm bg-accent shadow-md"
            aria-hidden
          />
          <span className="flex font-baron font-light tracking-wide text-accent-ink">
            <span className="rotate-15 text-3xl">{month}/</span>
            <span className="font-display text-6xl font-bold">{day}</span>
          </span>
        </div>
        <div className="flex w-full flex-nowrap items-baseline justify-end gap-3 pr-0.5">
          <h3 className="shrink-0 text-right font-quantify text-2xl font-black leading-none tracking-wide text-ink sm:text-3xl">
            {weekday}
          </h3>
          <WeatherBadge
            weather={weather}
            compact
            className="shrink-0 -skew-x-12 items-baseline bg-sunken p-1 px-3 text-ink"
            iconClassName="text-ink"
            temperatureClassName="font-quantify skew-x-12 text-2xl font-black tabular-nums tracking-wide text-ink sm:text-3xl"
          />
        </div>
      </div>
    </div>
  );
};
