import type { RibbonVisualStyle } from "@/types";

export type { RibbonVisualStyle } from "@/types";

const criticalRibbonStyles: Record<RibbonVisualStyle, string> = {
  default:
    "rounded-2xl border border-red-200/70 bg-white/55 p-2 shadow-[0_14px_34px_-26px_rgba(127,29,29,0.65)] backdrop-blur-sm dark:border-red-900/80 dark:bg-zinc-950/35",
  muted:
    "rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-2 opacity-90 saturate-75 shadow-[0_10px_30px_-24px_rgba(24,24,27,0.5)] dark:border-zinc-800 dark:bg-zinc-950/55",
  "high-contrast":
    "rounded-md border-2 border-red-500/90 bg-red-50/70 p-2 contrast-125 saturate-125 shadow-[0_0_0_1px_rgba(239,68,68,0.5)] dark:border-red-400/90 dark:bg-red-950/40",
};

export function getCriticalRibbonClass(style: RibbonVisualStyle): string {
  return criticalRibbonStyles[style];
}
