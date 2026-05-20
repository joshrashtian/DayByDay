import type {
  ClockStylePrototype,
  ClockStylePrototypeInput,
  ClockTemplate,
} from "@/types";

export const CLOCK_TEMPLATE_IDS: ClockTemplate[] = [
  "minimal",
  "p5",
  "basic",
  "terminal",
  "orbit",
  "neon",
  "editorial",
];

export const isClockTemplate = (value: string): value is ClockTemplate =>
  CLOCK_TEMPLATE_IDS.includes(value as ClockTemplate);

export type {
  ClockTemplate,
  ClockStyleSource,
  ClockStylePrototype,
  ClockStylePrototypeInput,
  ClockStylePack,
} from "@/types";

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
  terminal: {
    id: "terminal",
    template: "terminal",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end gap-1",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName:
      "inline-flex items-baseline gap-2 rounded border border-emerald-500/40 bg-zinc-950 px-3 py-2 shadow-[0_0_24px_rgba(16,185,129,0.15)]",
    dateTextClassName:
      "flex items-baseline gap-0.5 font-quantify text-emerald-400 tabular-nums",
    monthClassName: "text-lg opacity-70",
    dayClassName: "text-3xl font-black tracking-wider",
    weekdayRowClassName:
      "flex max-w-full flex-nowrap items-center justify-end gap-2 pr-0.5",
    weekdayClassName:
      "shrink-0 font-quantify text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-500/80",
    weatherClassName: "shrink-0 items-center text-emerald-400",
    weatherIconClassName: "text-emerald-400",
    weatherTemperatureClassName:
      "font-quantify text-sm font-bold tabular-nums text-emerald-300",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-sm border border-emerald-500/60 bg-emerald-600/80 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70",
  },
  orbit: {
    id: "orbit",
    template: "orbit",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-center gap-2",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName:
      "relative flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center rounded-full border-[3px] border-zinc-900 bg-gradient-to-br from-amber-50 to-amber-100 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_12px_28px_rgba(0,0,0,0.18)] dark:border-zinc-100 dark:from-zinc-800 dark:to-zinc-900",
    dateTextClassName: "flex flex-col items-center leading-none",
    monthClassName:
      "font-eudoxus text-[10px] font-bold uppercase tracking-[0.42em] text-amber-800/70 dark:text-amber-200/60",
    dayClassName:
      "font-display -mt-0.5 text-5xl font-black tabular-nums text-zinc-900 dark:text-zinc-50",
    weekdayRowClassName:
      "flex max-w-full flex-nowrap items-center justify-center gap-2",
    weekdayClassName:
      "shrink-0 font-baron text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400",
    weatherClassName: "shrink-0 items-center text-zinc-700 dark:text-zinc-300",
    weatherIconClassName: "text-amber-700 dark:text-amber-300",
    weatherTemperatureClassName:
      "font-quantify text-sm font-black tabular-nums text-zinc-800 dark:text-zinc-200",
    resizeHandleClassName:
      "absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border border-amber-700/50 bg-amber-500/90 opacity-40 shadow-sm transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-70",
  },
  neon: {
    id: "neon",
    template: "neon",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end gap-1.5",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName:
      "relative overflow-hidden rounded-lg bg-zinc-950 px-5 py-4 shadow-[0_0_40px_rgba(236,72,153,0.35),inset_0_0_30px_rgba(34,211,238,0.08)] ring-1 ring-fuchsia-500/40",
    dateTextClassName: "flex flex-col items-end leading-none",
    monthClassName:
      "font-quantify text-sm font-black uppercase tracking-[0.5em] text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]",
    dayClassName:
      "bg-gradient-to-l from-fuchsia-300 via-pink-200 to-cyan-200 bg-clip-text font-display text-7xl font-black tabular-nums text-transparent drop-shadow-[0_0_18px_rgba(236,72,153,0.65)]",
    weekdayRowClassName:
      "inline-flex max-w-full flex-nowrap items-center gap-2 rounded-full border border-cyan-400/30 bg-zinc-950/90 px-3 py-1 shadow-[0_0_16px_rgba(34,211,238,0.25)]",
    weekdayClassName:
      "shrink-0 font-baron text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-300",
    weatherClassName: "shrink-0 items-center text-cyan-200",
    weatherIconClassName: "text-cyan-300",
    weatherTemperatureClassName:
      "font-quantify text-sm font-black tabular-nums text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border border-fuchsia-400/70 bg-fuchsia-500/80 opacity-50 shadow-[0_0_10px_rgba(236,72,153,0.6)] transition-all duration-150 hover:scale-125 hover:opacity-100 group-hover:opacity-80",
  },
  editorial: {
    id: "editorial",
    template: "editorial",
    source: "core",
    rootClassName: "fixed right-4 top-4 z-10 select-none",
    wrapperClassName: "group relative inline-flex flex-col items-end gap-3",
    wrapperIdleClassName: "transition-transform duration-150",
    transformOrigin: "top right",
    dateRowClassName:
      "flex min-w-[9rem] flex-col items-end border-r-2 border-zinc-900 pr-4 dark:border-zinc-100",
    dateTextClassName: "flex flex-col items-end leading-tight",
    monthClassName:
      "font-sans text-sm font-light italic tracking-[0.12em] text-zinc-500 dark:text-zinc-400",
    dayClassName:
      "font-sans text-6xl font-light tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50",
    weekdayRowClassName:
      "flex max-w-full flex-nowrap items-baseline justify-end gap-3",
    weekdayClassName:
      "shrink-0 font-sans text-[10px] font-medium uppercase tracking-[0.38em] text-zinc-500 dark:text-zinc-400",
    weatherClassName: "shrink-0 items-baseline text-zinc-600 dark:text-zinc-300",
    weatherIconClassName: "text-zinc-500 dark:text-zinc-400",
    weatherTemperatureClassName:
      "font-sans text-xs font-medium tabular-nums tracking-wide text-zinc-600 dark:text-zinc-300",
    resizeHandleClassName:
      "absolute -bottom-1 -left-1 h-2.5 w-2.5 cursor-nesw-resize rounded-none border border-zinc-400 bg-zinc-300 opacity-40 transition-all duration-150 hover:opacity-100 group-hover:opacity-70 dark:border-zinc-600 dark:bg-zinc-700",
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
