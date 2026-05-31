import type { TasksVisualStyle } from "@/types";

export type { TasksVisualStyle } from "@/types";

const tasksPanelStyles: Record<TasksVisualStyle, string> = {
  default: "font-eudoxus",
  card: "rounded-2xl border border-zinc-200/60 bg-white/70 p-4 font-ppneue shadow-[0_24px_48px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-950/50",
  minimal:
    "border-l-4 border-zinc-400/60 pl-5 font-baron dark:border-zinc-600",
  terminal:
    "rounded-lg border border-emerald-500/35 bg-zinc-950/90 p-4 font-quantify shadow-[inset_0_0_28px_rgba(16,185,129,0.1)] dark:border-emerald-400/30 [&_.font-baron]:font-quantify [&_.font-baron]:tracking-[0.18em] [&_.font-ppneue]:font-quantify [&_h2]:font-quantify [&_h2]:tracking-wide [&_h2]:text-emerald-50 [&_p]:text-emerald-200/75",
  neon: "rounded-xl border border-fuchsia-400/35 bg-zinc-950/85 p-4 font-baron shadow-[0_0_32px_rgba(236,72,153,0.22),inset_0_0_24px_rgba(34,211,238,0.08)] ring-1 ring-cyan-400/20 dark:bg-zinc-950/95 [&_h2]:bg-gradient-to-r [&_h2]:from-fuchsia-200 [&_h2]:to-cyan-200 [&_h2]:bg-clip-text [&_h2]:font-display [&_h2]:text-transparent [&_p]:text-cyan-100/80",
  editorial:
    "border-t border-zinc-300/80 px-1 pt-5 font-sans dark:border-zinc-600/80 [&_.font-baron]:font-sans [&_.font-baron]:font-medium [&_.font-baron]:normal-case [&_.font-baron]:tracking-[0.24em] [&_.font-eudoxus]:font-sans [&_.font-ppneue]:font-sans [&_.font-ppneue]:font-light [&_h2]:font-sans [&_h2]:font-light [&_h2]:tracking-tight",
  outline:
    "rounded-md border-2 border-zinc-800/25 bg-transparent p-4 font-baron dark:border-zinc-300/35 [&_h2]:font-baron [&_h2]:uppercase [&_h2]:tracking-[0.06em]",
  glass:
    "rounded-3xl border border-white/40 bg-white/45 p-4 font-eudoxus shadow-[0_28px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/35 [&_h2]:font-eudoxus [&_h2]:font-bold",
};

/** Layout/typography only — used when a page theme supplies the surface colors. */
const themeAwareTasksStructure: Partial<Record<TasksVisualStyle, string>> = {
  default: "font-eudoxus",
  card: "rounded-2xl p-4 font-ppneue",
  minimal: "border-l-4 pl-5 font-baron",
};

export function getTasksPanelClass(
  style: TasksVisualStyle,
  options?: { themeActive?: boolean },
): string {
  if (options?.themeActive && themeAwareTasksStructure[style]) {
    return themeAwareTasksStructure[style]!;
  }
  return tasksPanelStyles[style] ?? tasksPanelStyles.default;
}
