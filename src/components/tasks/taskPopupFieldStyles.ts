/** Shared field chrome for task create/edit popups (zinc glass, not Untitled tokens). */
export const taskPopupField = {
  label:
    "text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
  sectionTitle:
    "text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500",
  input:
    "w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 transition-[box-shadow,border-color] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-300/35 dark:border-zinc-600/90 dark:bg-zinc-950/65 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-600/35",
  selectLabel:
    "text-[11px]! font-semibold! uppercase! tracking-wider! text-zinc-500! dark:text-zinc-400!",
  selectTrigger:
    "rounded-xl! border! border-zinc-200/90! bg-white/90! shadow-sm! ring-0! transition-[box-shadow,border-color]! hover:border-zinc-300! focus:ring-2! focus:ring-zinc-300/35! dark:border-zinc-600/90! dark:bg-zinc-950/65! dark:hover:border-zinc-500! dark:focus:ring-zinc-600/35! [&_*[data-icon]]:text-zinc-500! dark:[&_*[data-icon]]:text-zinc-400! [&_p]:text-zinc-900! dark:[&_p]:text-zinc-100!",
  selectPopover:
    "z-[100]! overflow-hidden! rounded-xl! border! border-zinc-200/95! bg-white! py-1! shadow-[0_18px_48px_rgba(15,15,15,0.14)]! ring-1! ring-zinc-200/80! dark:border-zinc-600! dark:bg-zinc-900! dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)]! dark:ring-zinc-700/80!",
  selectMenu:
    "z-[110] overflow-hidden rounded-xl border border-zinc-200/95 bg-white py-1 shadow-[0_18px_48px_rgba(15,15,15,0.14)] ring-1 ring-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-900 dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)] dark:ring-zinc-700/80",
  selectItem:
    "[&_[slot=label]]:text-zinc-900! dark:[&_[slot=label]]:text-zinc-100! [&_[slot=description]]:text-zinc-500! dark:[&_[slot=description]]:text-zinc-400!",
  panel:
    "rounded-2xl border border-zinc-200/70 bg-white/50 p-4 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-950/35",
  weekdayActive:
    "border-transparent bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
  weekdayIdle:
    "border border-zinc-200/90 bg-white/80 text-zinc-700 hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:border-zinc-500",
} as const;
