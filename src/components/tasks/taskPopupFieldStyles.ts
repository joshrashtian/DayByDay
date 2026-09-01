/** Shared field chrome for task create/edit popups (zinc glass, not Untitled tokens). */
export const taskPopupField = {
  label:
    "text-sm font-semibold uppercase font-quantify text-muted",
  sectionTitle:
    "text-base font-bold uppercase font-quantify text-faint",
  input:
    "w-full rounded-xl  bg-surface/90 px-3.5 py-2.5 text-sm text-ink border border-line/90 outline-none placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line/35",
  selectLabel:
    "text-sm font-semibold uppercase font-quantify text-muted",
  selectTrigger:
    "rounded-xl border border-line/90 bg-surface/90 shadow-sm ring-0 transition-[box-shadow,border-color] hover:border-line-strong focus:ring-2 focus:ring-line/35 [&_*[data-icon]]:text-zinc-500 dark:[&_*[data-icon]]:text-zinc-400 [&_p]:text-zinc-900 dark:[&_p]:text-zinc-100",
  selectPopover:
    "z-[100] overflow-hidden rounded-xl border border-line/95 bg-surface py-1 shadow-[0_18px_48px_rgba(15,15,15,0.14)] ring-1 ring-line/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)]",
  selectMenu:
    "z-[110] overflow-hidden rounded-xl border border-line/95 bg-surface py-1 shadow-[0_18px_48px_rgba(15,15,15,0.14)] ring-1 ring-line/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)]",
  selectItem:
    "[&_[slot=label]]:text-zinc-900 dark:[&_[slot=label]]:text-zinc-100 [&_[slot=description]]:text-zinc-500 dark:[&_[slot=description]]:text-zinc-400",
  panel:
    "py-4 border-b border-line",
  weekdayActive:
    "border-transparent bg-ink text-white shadow-sm",
  weekdayIdle:
    "border border-line/90 bg-surface/80 text-muted hover:border-line-strong",
} as const;
