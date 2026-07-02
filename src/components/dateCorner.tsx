import { type ReactNode } from "react";
import { WeatherBadge } from "./WeatherBadge";
import { useWeather } from "../hooks/useWeather";
import { useStyle } from "../providers/StyleProvider";
import type { ClockStylePrototype } from "@/types";

type Props = {
  variant?: string;
  rootClassName?: string;
  scale?: number;
};

export const DateCorner = ({
  variant: variantOverride,
  rootClassName,
  scale: scaleOverride,
}: Props) => {
  const today = new Date();
  const { style, getClockStyle } = useStyle();
  const resolvedVariant = variantOverride ?? style ?? "minimal";
  const stylePrototype = getClockStyle(resolvedVariant);
  const weather = useWeather();
  const resolvedScale = scaleOverride ?? 1;

  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const monthShort = today
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const monthLong = today.toLocaleDateString("en-US", { month: "long" });
  const month = today.getMonth() + 1;
  const day = today.getDate().toString().padStart(2, "0");

  const root = rootClassName ?? stylePrototype.rootClassName;
  const wrapperClassName = `${stylePrototype.wrapperClassName} ${stylePrototype.wrapperIdleClassName}`;

  const weatherBadge = (
    <WeatherBadge
      weather={weather}
      compact
      className={stylePrototype.weatherClassName}
      iconClassName={stylePrototype.weatherIconClassName}
      temperatureClassName={stylePrototype.weatherTemperatureClassName}
    />
  );

  const shell = (content: ReactNode) => (
    <div
      className={wrapperClassName}
      style={{
        transform: `scale(${resolvedScale})`,
        transformOrigin: stylePrototype.transformOrigin,
      }}
    >
      {content}
    </div>
  );

  return (
    <div className={root}>
      {renderClockBody(stylePrototype, {
        month,
        monthShort,
        monthLong,
        day,
        weekday,
        weatherBadge,
        shell,
      })}
    </div>
  );
};

type ClockBodyProps = {
  month: number;
  monthShort: string;
  monthLong: string;
  day: string;
  weekday: string;
  weatherBadge: ReactNode;
  shell: (content: ReactNode) => ReactNode;
};

function renderClockBody(
  style: ClockStylePrototype,
  props: ClockBodyProps,
): ReactNode {
  const { month, monthShort, monthLong, day, weekday, weatherBadge, shell } =
    props;

  switch (style.template) {
    case "p5":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <div className={style.dateRowCardClassName}>
              <div className={style.dateRowCardInnerClassName}>
                <span className={style.dateTextClassName}>
                  <span className={style.monthClassName}>{month}/</span>
                  <span className={style.dayClassName}>{day}</span>
                </span>
              </div>
            </div>
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "basic":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <div className={style.dateRowCardClassName}>
              <span className={style.dateTextClassName}>
                <span className={style.monthClassName}>{month}/</span>
                <span className={style.dayClassName}>{day}</span>
              </span>
            </div>
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "terminal":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <span className="font-quantify text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">
              SYS://
            </span>
            <span className={style.dateTextClassName}>
              <span className={style.monthClassName}>
                {month.toString().padStart(2, "0")}.
              </span>
              <span className={style.dayClassName}>{day}</span>
            </span>
            <span
              className="ml-0.5 inline-block h-[1.1em] w-[0.55em] animate-pulse bg-emerald-400/90"
              aria-hidden
            />
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "orbit":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <span
              className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-amber-700/25 dark:border-amber-200/20"
              aria-hidden
            />
            <span className={style.dateTextClassName}>
              <span className={style.monthClassName}>{monthShort}</span>
              <span className={style.dayClassName}>{day}</span>
            </span>
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "neon":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <span
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-cyan-400/15 blur-xl"
              aria-hidden
            />
            <span className={style.dateTextClassName}>
              <span className={style.monthClassName}>{monthShort}</span>
              <span className={style.dayClassName}>{day}</span>
            </span>
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "editorial":
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <span className={style.dateTextClassName}>
              <span className={style.monthClassName}>{monthLong}</span>
              <span className={style.dayClassName}>{day}</span>
            </span>
            <span
              className="mt-2 h-px w-full bg-zinc-300 dark:bg-zinc-600"
              aria-hidden
            />
          </div>
          <div className={style.weekdayRowClassName}>
            <span className={style.weekdayClassName}>{weekday}</span>
            {weatherBadge}
          </div>
        </>,
      );

    case "minimal":
    default:
      return shell(
        <>
          <div className={style.dateRowClassName}>
            <span
              className={style.dateRowOverlayClassName}
              aria-hidden
            />
            <span className={style.dateTextClassName}>
              <span className={style.monthClassName}>{month}/</span>
              <span className={style.dayClassName}>{day}</span>
            </span>
          </div>
          <div className={style.weekdayRowClassName}>
            <h3 className={style.weekdayClassName}>{weekday}</h3>
            {weatherBadge}
          </div>
        </>,
      );
  }
}
