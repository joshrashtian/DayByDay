import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { WeatherBadge } from "./WeatherBadge";
import { useWeather } from "../hooks/useWeather";
import { useStyle } from "../providers/StyleProvider";
import { useContextMenu } from "../providers/ContextMenuProvider";
import type { ClockStylePrototype, ClockTemplate } from "@/types";
import { IoSunnyOutline } from "react-icons/io5";
import { IoMdClock } from "react-icons/io";

type Props = {
  variant?: string;
  rootClassName?: string;
  scale?: number;
  onScaleChange?: (nextScale: number) => void;
  onVariantChange?: (nextVariant: string) => void;
};

const CLOCK_STYLE_OPTIONS: { id: ClockTemplate; label: string; icon?: ReactNode }[] =
  [
    { id: "minimal", label: "Default", icon: <IoMdClock /> },
    { id: "p5", label: "Persona 5" },
    { id: "basic", label: "Basic", icon: <IoSunnyOutline /> },
    { id: "terminal", label: "Terminal" },
    { id: "orbit", label: "Orbit" },
    { id: "neon", label: "Neon" },
    { id: "editorial", label: "Editorial" },
  ];

export const DateCorner = ({
  variant: variantOverride,
  rootClassName,
  scale: scaleOverride,
  onScaleChange,
  onVariantChange,
}: Props) => {
  const today = new Date();
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const { style, getClockStyle } = useStyle();
  const resolvedVariant = variantOverride ?? variant ?? style ?? "minimal";
  const stylePrototype = getClockStyle(resolvedVariant);
  const weather = useWeather();
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScale = useRef(1);
  const context = useContextMenu();
  const clampScale = (value: number) => Math.min(2, Math.max(0.65, value));
  const resolvedScale = scaleOverride ?? scale;

  const applyScale = (nextScale: number) => {
    const clamped = clampScale(nextScale);
    if (scaleOverride === undefined) setScale(clamped);
    onScaleChange?.(clamped);
  };

  const applyVariant = (nextVariant: string) => {
    if (variantOverride === undefined) setVariant(nextVariant);
    onVariantChange?.(nextVariant);
  };

  const onResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragStartY.current = event.clientY;
    dragStartScale.current = resolvedScale;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const deltaY = event.clientY - dragStartY.current;
    applyScale(dragStartScale.current + deltaY * 0.004);
  };

  const onResizeEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

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
  const wrapperClassName = `${stylePrototype.wrapperClassName} ${
    isDragging ? "" : stylePrototype.wrapperIdleClassName
  }`;

  const weatherBadge = (
    <WeatherBadge
      weather={weather}
      compact
      className={stylePrototype.weatherClassName}
      iconClassName={stylePrototype.weatherIconClassName}
      temperatureClassName={stylePrototype.weatherTemperatureClassName}
    />
  );

  const resizeHandle = (
    <button
      type="button"
      className={stylePrototype.resizeHandleClassName}
      aria-label="Resize date corner"
      onPointerDown={onResizeStart}
      onPointerMove={onResizeMove}
      onPointerUp={onResizeEnd}
      onPointerCancel={onResizeEnd}
    />
  );

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) =>
    context.openMenu(e, [
      {
        id: "Header1",
        type: "header",
        header: "Clock Styles",
      },
      ...CLOCK_STYLE_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        onSelect: () => applyVariant(option.id),
        icon: option.icon,
        type: "item" as const,
      })),
      {
        id: "Break1",
        type: "break",
      },
      {
        id: "Header2",
        type: "header",
        header: "Clock Size",
      },
      {
        id: "Small",
        label: "Small",
        onSelect: () => applyScale(0.65),
        type: "item",
      },
      {
        id: "Medium",
        label: "Medium",
        onSelect: () => applyScale(1),
        type: "item",
      },
      {
        id: "Large",
        label: "Large",
        onSelect: () => applyScale(1.5),
        type: "item",
      },
    ]);

  const shell = (content: ReactNode) => (
    <div
      onContextMenu={onContextMenu}
      className={wrapperClassName}
      style={{
        transform: `scale(${resolvedScale})`,
        transformOrigin: stylePrototype.transformOrigin,
      }}
    >
      {content}
      {resizeHandle}
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
