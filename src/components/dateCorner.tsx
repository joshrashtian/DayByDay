import { useRef, useState, type PointerEvent } from "react";
import { WeatherBadge } from "./WeatherBadge";
import { useWeather } from "../hooks/useWeather";
import { useStyle } from "../providers/StyleProvider";

type DateCornerVariant = "minimal" | "p5";

type Props = {
  variant?: DateCornerVariant;
  rootClassName?: string;
};

const defaultRoot = "fixed right-4 top-4 z-10 select-none";

export const DateCorner = ({ variant, rootClassName }: Props) => {
  const today = new Date();
  const { style } = useStyle();
  const resolvedVariant: DateCornerVariant = variant ?? style ?? "minimal";
  const weather = useWeather();
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScale = useRef(1);

  const clampScale = (value: number) => Math.min(2, Math.max(0.65, value));

  const onResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragStartY.current = event.clientY;
    dragStartScale.current = scale;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const deltaY = event.clientY - dragStartY.current;
    setScale(clampScale(dragStartScale.current + deltaY * 0.004));
  };

  const onResizeEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const month = today.getMonth() + 1;
  const day = today.getDate().toString().padStart(2, "0");

  const root = rootClassName ?? defaultRoot;

  if (resolvedVariant === "p5") {
    return (
      <div className={root}>
        <div
          className={`group relative inline-flex flex-col items-end ${
            isDragging ? "" : "transition-transform duration-150"
          }`}
          style={{ transform: `scale(${scale})`, transformOrigin: "top right" }}
        >
          <div className="relative inline-flex items-center">
            <div className="relative -skew-x-12 bg-blue-600 px-5 py-3 shadow-[0_16px_30px_rgba(37,99,235,0.55)]">
              <div className="skew-x-12">
                <span className="flex items-baseline gap-1 font-fava text-white">
                  <span className="text-2xl leading-none">{month}/</span>
                  <span className="text-5xl leading-none">{day}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-0.5 -ml-2 inline-flex max-w-full flex-nowrap items-center gap-3 -rotate-2 bg-black px-3 py-1 font-baron text-sm tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
            <span className="shrink-0">{weekday}</span>
            <WeatherBadge
              weather={weather}
              compact
              className="shrink-0 -skew-x-12 items-center text-white"
              iconClassName="text-zinc-900"
              temperatureClassName="font-quantify text-xl font-black tabular-nums tracking-wide text-white"
            />
          </div>

          <button
            type="button"
            className="absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-blue-600/80 bg-blue-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70"
            aria-label="Resize date corner"
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={root}>
      <div
        className={`group relative inline-flex flex-col items-end gap-0.5 ${
          isDragging ? "" : "transition-transform duration-150"
        }`}
        style={{ transform: `scale(${scale})`, transformOrigin: "top right" }}
      >
        <div className="relative inline-flex items-baseline gap-1 px-6 py-3">
          <span
            className="pointer-events-none absolute inset-0 -z-10 -skew-x-12 rounded-sm bg-blue-600 shadow-md dark:bg-blue-500"
            aria-hidden
          />
          <span className="flex font-quantify font-light tracking-wide text-white">
            <span className="rotate-15 text-3xl">{month}/</span>
            <span className="font-display text-6xl font-bold">{day}</span>
          </span>
        </div>
        <div className="flex w-full flex-nowrap items-center justify-end gap-3 pr-0.5">
          <h3 className="shrink-0 text-right font-quantify text-2xl font-black tracking-wide text-zinc-900 sm:text-3xl">
            {weekday}
          </h3>
          <WeatherBadge
            weather={weather}
            compact
            className="shrink-0 -skew-x-12 bg-zinc-200/70 px-3 p-1 items-center text-zinc-900"
            iconClassName="text-zinc-900"
            temperatureClassName="font-quantify skew-x-12 text-2xl font-black tabular-nums tracking-wide text-zinc-900 sm:text-3xl"
          />
        </div>

        <button
          type="button"
          className="absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-blue-600/80 bg-blue-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70"
          aria-label="Resize date corner"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      </div>
    </div>
  );
};
