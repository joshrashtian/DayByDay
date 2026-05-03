export type ClockTemplate = "minimal" | "p5" | "basic";

export type ClockStyleSource = "core" | "user" | "marketplace";

export type ClockStylePrototype = {
  id: string;
  template: ClockTemplate;
  source: ClockStyleSource;
  rootClassName: string;
  wrapperClassName: string;
  wrapperIdleClassName: string;
  transformOrigin: string;
  dateRowClassName: string;
  dateRowOverlayClassName?: string;
  dateRowCardClassName?: string;
  dateRowCardInnerClassName?: string;
  dateTextClassName: string;
  monthClassName: string;
  dayClassName: string;
  weekdayRowClassName: string;
  weekdayClassName: string;
  weatherClassName: string;
  weatherIconClassName: string;
  weatherTemperatureClassName: string;
  resizeHandleClassName: string;
};

export type ClockStylePrototypeInput = {
  template?: ClockTemplate;
  source?: ClockStyleSource;
} & Partial<Omit<ClockStylePrototype, "id" | "template" | "source">>;

export type ClockStylePack = Record<string, ClockStylePrototypeInput>;

export const defaultClockStyles: Record<string, ClockStylePrototype> = {
  minimal: {
    id: "minimal",
    template: "minimal",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end gap-0.5",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName: "relative inline-flex items-baseline gap-1 px-6 py-3",
    dateRowOverlayClassName:
      "pointer-events-none absolute inset-0 -z-10 -skew-x-12 rounded-sm bg-blue-600 shadow-md dark:bg-blue-500",
    dateTextClassName: "flex font-baron font-light tracking-wide text-white",
    monthClassName: "rotate-15 text-3xl",
    dayClassName: "font-display text-6xl font-bold",
    weekdayRowClassName:
      "flex w-full flex-nowrap items-baseline justify-end gap-3 pr-0.5",
    weekdayClassName:
      "shrink-0 text-right font-quantify text-2xl font-black leading-none tracking-wide text-zinc-900 sm:text-3xl",
    weatherClassName:
      "shrink-0 -skew-x-12 bg-zinc-200/70 px-3 p-1 items-baseline text-zinc-900",
    weatherIconClassName: "text-zinc-900",
    weatherTemperatureClassName:
      "font-quantify skew-x-12 text-2xl font-black tabular-nums tracking-wide text-zinc-900 sm:text-3xl",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-blue-600/80 bg-blue-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70",
  },
  p5: {
    id: "p5",
    template: "p5",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName: "relative inline-flex items-center",
    dateRowCardClassName:
      "relative -skew-x-12 bg-blue-600 px-5 py-3 shadow-[0_16px_30px_rgba(37,99,235,0.55)]",
    dateRowCardInnerClassName: "skew-x-12",
    dateTextClassName: "flex items-baseline gap-1 font-fava text-white",
    monthClassName: "text-2xl leading-none",
    dayClassName: "text-5xl leading-none",
    weekdayRowClassName:
      "mt-0.5 -ml-2 inline-flex max-w-full flex-nowrap items-center gap-3 -rotate-2 bg-black px-3 py-1 font-baron text-sm tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)]",
    weekdayClassName: "shrink-0",
    weatherClassName: "shrink-0 -skew-x-12 items-center text-white",
    weatherIconClassName: "text-zinc-900",
    weatherTemperatureClassName:
      "font-quantify text-xl font-black tabular-nums tracking-wide text-white",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-blue-600/80 bg-blue-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70",
  },
  basic: {
    id: "basic",
    template: "basic",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName: "relative inline-flex items-center",
    dateRowCardClassName:
      "relative px-5 py-3 shadow-[0_16px_30px_rgba(37,99,235,0.55)]",
    dateTextClassName: "flex items-baseline font-quantify gap-1 text-blue-800",
    monthClassName: "text-7xl leading-none",
    dayClassName: "text-7xl leading-none",
    weekdayRowClassName:
      "mt-0.5 -ml-2 inline-flex max-w-full flex-nowrap items-center gap-3 text-blue-800 px-3 py-1 font-baron text-sm tracking-[0.18em] shadow-[0_10px_20px_rgba(0,0,0,0.4)]",
    weekdayClassName: "shrink-0",
    weatherClassName: "shrink-0 items-center text-blue-800",
    weatherIconClassName: "text-blue-800",
    weatherTemperatureClassName:
      "font-quantify text-2xl font-black tabular-nums tracking-wide text-blue-800",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-blue-600/80 bg-blue-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70",
  },
};

export const buildClockStylePrototype = (
  styleId: string,
  input: ClockStylePrototypeInput,
  existing?: ClockStylePrototype,
): ClockStylePrototype => {
  const template = input.template ?? existing?.template ?? "minimal";
  const source = input.source ?? existing?.source ?? "user";
  const templateBase = defaultClockStyles[template];
  return {
    ...templateBase,
    ...existing,
    ...input,
    id: styleId,
    template,
    source,
  };
};
