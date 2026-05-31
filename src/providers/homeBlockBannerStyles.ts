import type { BlockBannerResolvedClasses, BlockVisualStyle } from "@/types";

export type { BlockVisualStyle, BlockBannerResolvedClasses } from "@/types";

const sharedTitleClassName =
  "wrap-break-word text-2xl tracking-tight sm:text-4xl";
const sharedTimeClassName =
  "mt-1 text-[11px] uppercase tracking-[0.14em] opacity-70 sm:text-sm";

const blockBannerStyles: Record<
  BlockVisualStyle,
  Omit<BlockBannerResolvedClasses, "containerClassName"> & {
    containerClassName: string;
  }
> = {
  punchy: {
    containerClassName:
      "flex-row flex-wrap items-baseline gap-1.5 -rotate-2 -skew-x-6 rounded-lg border border-black/5 px-1 py-0.5 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.8)] sm:-rotate-3 sm:-skew-x-12 sm:gap-2",
    titleClassName:
      "wrap-break-word rotate-2 skew-x-6 text-2xl font-display font-black uppercase tracking-tight sm:rotate-3 sm:skew-x-12 sm:text-4xl",
    timeClassName:
      "mt-1 skew-x-6 text-xs font-semibold uppercase tracking-[0.14em] opacity-80 sm:skew-x-12 sm:text-sm",
  },
  clean: {
    containerClassName:
      "flex-row flex-wrap items-baseline gap-2 rounded-2xl border border-black/[0.06] shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65",
    titleClassName: `${sharedTitleClassName} font-eudoxus font-bold`,
    timeClassName: `${sharedTimeClassName} font-eudoxus font-medium`,
  },
  outline: {
    containerClassName:
      "flex-row flex-wrap items-baseline gap-2 rounded-md border-2 border-zinc-800/30 bg-transparent dark:border-zinc-300/40",
    titleClassName: `${sharedTitleClassName} font-baron font-extrabold uppercase tracking-[0.08em]`,
    timeClassName: `${sharedTimeClassName} font-baron font-bold tracking-[0.18em]`,
  },
  capsule: {
    containerClassName:
      "flex-col items-start gap-0.5 rounded-full border border-black/10 px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:px-8 sm:py-3.5",
    titleClassName:
      "wrap-break-word text-xl font-quantify font-black uppercase tracking-[0.06em] sm:text-3xl",
    timeClassName:
      "text-[10px] font-quantify font-bold uppercase tracking-[0.28em] opacity-75 sm:text-xs",
  },
  stacked: {
    containerClassName:
      "flex-col items-start gap-1 border-l-[5px] border-black/25 bg-black/[0.03] pl-5 pr-4 py-3 dark:border-white/25 dark:bg-white/[0.04]",
    titleClassName:
      "wrap-break-word text-2xl font-sans font-light tracking-tight sm:text-4xl",
    timeClassName:
      "text-[10px] font-sans font-medium uppercase tracking-[0.32em] opacity-65 sm:text-xs",
  },
  terminal: {
    containerClassName:
      "flex-col items-start gap-1 rounded border border-black/20 bg-black/10 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] dark:border-white/15 dark:bg-black/25",
    titleClassName:
      "wrap-break-word font-quantify text-xl font-black uppercase tracking-wider sm:text-3xl",
    timeClassName:
      "font-quantify text-[10px] font-bold uppercase tracking-[0.35em] opacity-80 before:mr-1.5 before:content-['>_'] sm:text-xs",
  },
  neon: {
    containerClassName:
      "flex-col items-start gap-0.5 -rotate-1 rounded-lg border border-white/20 px-4 py-3 shadow-[0_0_28px_rgba(255,255,255,0.18),inset_0_0_18px_rgba(255,255,255,0.08)] ring-1 ring-white/30 sm:-rotate-2",
    titleClassName:
      "wrap-break-word text-2xl font-display font-black uppercase tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.45)] sm:text-4xl",
    timeClassName:
      "mt-0.5 text-[10px] font-baron font-bold uppercase tracking-[0.24em] opacity-90 sm:text-xs",
  },
  sticker: {
    containerClassName:
      "flex-col items-start gap-0.5 rotate-2 rounded-sm border-2 border-dashed border-black/25 px-4 py-3 shadow-[4px_4px_0_rgba(0,0,0,0.18)] sm:rotate-3 dark:border-white/30 dark:shadow-[4px_4px_0_rgba(255,255,255,0.12)]",
    titleClassName:
      "wrap-break-word -rotate-1 text-2xl font-fava font-black uppercase tracking-tight sm:-rotate-2 sm:text-4xl",
    timeClassName:
      "mt-1 text-xs font-eudoxus font-bold uppercase tracking-[0.16em] opacity-75",
  },
};

export function getBlockBannerClasses(
  style: BlockVisualStyle,
  accentClassName: string,
): BlockBannerResolvedClasses {
  const selected = blockBannerStyles[style] ?? blockBannerStyles.punchy;
  return {
    containerClassName: `${accentClassName} ${selected.containerClassName}`,
    titleClassName: selected.titleClassName,
    timeClassName: selected.timeClassName,
  };
}
