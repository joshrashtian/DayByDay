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
      "-rotate-2 -skew-x-6 rounded-lg border border-black/5 px-1 py-0.5 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.8)] sm:-rotate-3 sm:-skew-x-12",
    titleClassName:
      "wrap-break-word rotate-2 skew-x-6 text-2xl font-display font-black uppercase tracking-tight sm:rotate-3 sm:skew-x-12 sm:text-4xl",
    timeClassName:
      "mt-1 skew-x-6 text-xs font-semibold uppercase tracking-[0.14em] opacity-80 sm:skew-x-12 sm:text-sm",
  },
  clean: {
    containerClassName:
      "rounded-2xl border border-black/[0.06] shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65",
    titleClassName: `${sharedTitleClassName} font-eudoxus font-bold`,
    timeClassName: `${sharedTimeClassName} font-eudoxus font-medium`,
  },
  outline: {
    containerClassName:
      "rounded-md border-2 border-zinc-800/30 bg-transparent dark:border-zinc-300/40",
    titleClassName: `${sharedTitleClassName} font-baron font-extrabold uppercase tracking-[0.08em]`,
    timeClassName: `${sharedTimeClassName} font-baron font-bold tracking-[0.18em]`,
  },
};

export function getBlockBannerClasses(
  style: BlockVisualStyle,
  accentClassName: string,
): BlockBannerResolvedClasses {
  const selected = blockBannerStyles[style];
  return {
    containerClassName: `${accentClassName} ${selected.containerClassName}`,
    titleClassName: selected.titleClassName,
    timeClassName: selected.timeClassName,
  };
}
