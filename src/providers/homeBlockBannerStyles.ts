export type BlockVisualStyle = "punchy" | "clean" | "outline";

export type BlockBannerResolvedClasses = {
  containerClassName: string;
  titleClassName: string;
  timeClassName: string;
};

const sharedTitleClassName = "wrap-break-word text-2xl font-quantify sm:text-4xl";
const sharedTimeClassName = "mt-1 text-xs font-medium opacity-70 sm:text-sm";

const blockBannerStyles: Record<
  BlockVisualStyle,
  Omit<BlockBannerResolvedClasses, "containerClassName"> & {
    containerClassName: string;
  }
> = {
  punchy: {
    containerClassName: "-rotate-2 -skew-x-6 sm:-rotate-3 sm:-skew-x-12",
    titleClassName:
      "wrap-break-word text-2xl font-quantify rotate-2 skew-x-6 sm:rotate-3 sm:skew-x-12 sm:text-4xl",
    timeClassName:
      "mt-1 skew-x-6 text-xs font-medium opacity-70 sm:skew-x-12 sm:text-sm",
  },
  clean: {
    containerClassName:
      "rounded-xl border border-zinc-300/80 bg-white/95 text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100",
    titleClassName: sharedTitleClassName,
    timeClassName: sharedTimeClassName,
  },
  outline: {
    containerClassName:
      "rounded-xl border-2 border-zinc-700/80 bg-transparent text-zinc-900 dark:border-zinc-200 dark:text-zinc-100",
    titleClassName: sharedTitleClassName,
    timeClassName: sharedTimeClassName,
  },
};

export function getBlockBannerClasses(
  style: BlockVisualStyle,
  accentClassName: string,
): BlockBannerResolvedClasses {
  if (style === "punchy") {
    const punchy = blockBannerStyles.punchy;
    return {
      containerClassName: `${accentClassName} ${punchy.containerClassName}`,
      titleClassName: punchy.titleClassName,
      timeClassName: punchy.timeClassName,
    };
  }

  const selected = blockBannerStyles[style];
  return {
    containerClassName: selected.containerClassName,
    titleClassName: selected.titleClassName,
    timeClassName: selected.timeClassName,
  };
}
