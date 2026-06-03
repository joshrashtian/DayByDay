import type { RibbonVisualStyle } from "@/types";

export type { RibbonVisualStyle } from "@/types";

/**
 * Tone tokens drive the *inner* content of the critical reminder so that each
 * style reads as a single, cohesive object instead of a loud red ribbon dropped
 * inside a tinted frame.
 */
export type RibbonTone = {
  /** "CRITICAL REMINDER" eyebrow text classes. */
  eyebrow: string;
  /** Badge container fill/ring (layout is owned by the component). */
  badge: string;
  /** Status icon color inside the badge. */
  badgeIcon: string;
  /** Small status word (OVERDUE / DUE TODAY / CRITICAL) inside the badge. */
  badgeStatus: string;
  /** Primary task title. */
  title: string;
  /** Tag chip. */
  tag: string;
  /** "+N MORE" footnote. */
  more: string;
};

export type RibbonStylePreset = {
  /** Outer card frame (border / bg / radius / padding / shadow). */
  wrapper: string;
  /** Inner content tone. */
  tone: RibbonTone;
  /** When true, render the original animated skewed-ribbon graphic. */
  animated?: boolean;
  /**
   * Whether the active page theme is allowed to retint this card. Solid styles
   * opt out so their fill survives.
   */
  themeable: boolean;
};

const ribbonStylePresets: Record<RibbonVisualStyle, RibbonStylePreset> = {
  // Refined red-tinted card — the new cohesive default.
  default: {
    themeable: true,
    wrapper:
      "rounded-2xl border border-red-200/70 bg-red-50/60 px-3.5 py-3 shadow-[0_14px_34px_-26px_rgba(127,29,29,0.65)] backdrop-blur-sm dark:border-red-900/70 dark:bg-red-950/30",
    tone: {
      eyebrow:
        "text-[10px] font-black uppercase italic leading-none tracking-[0.28em] text-red-500/90 dark:text-red-400/90",
      badge: "bg-red-500 text-white shadow-sm shadow-red-900/30",
      badgeIcon: "text-white",
      badgeStatus: "text-white/90",
      title: "text-red-950 dark:text-red-50",
      tag: "border-red-300/60 bg-red-100/70 text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-200",
      more: "text-red-500/80 dark:text-red-400/80",
    },
  },

  // Neutral surface, red used only as an accent — blends in the most.
  muted: {
    themeable: true,
    wrapper:
      "rounded-2xl border border-zinc-200/80 bg-white/70 px-3.5 py-3 shadow-[0_10px_30px_-24px_rgba(24,24,27,0.5)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50",
    tone: {
      eyebrow:
        "text-[10px] font-bold uppercase leading-none tracking-[0.28em] text-zinc-400 dark:text-zinc-500",
      badge:
        "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800",
      badgeIcon: "text-red-500",
      badgeStatus: "text-red-500 dark:text-red-400",
      title: "text-zinc-900 dark:text-zinc-50",
      tag: "border-zinc-200/80 bg-zinc-100/80 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      more: "text-zinc-400 dark:text-zinc-500",
    },
  },

  // Bold, unmissable — strong border and saturated red.
  "high-contrast": {
    themeable: true,
    wrapper:
      "rounded-lg border-2 border-red-500 bg-red-50 px-3.5 py-3 shadow-[0_0_0_1px_rgba(239,68,68,0.4)] dark:border-red-400 dark:bg-red-950/50",
    tone: {
      eyebrow:
        "text-[10px] font-black uppercase italic leading-none tracking-[0.3em] text-red-600 dark:text-red-300",
      badge: "bg-red-600 text-white shadow-sm shadow-red-900/40",
      badgeIcon: "text-white",
      badgeStatus: "text-white",
      title: "text-red-950 dark:text-white",
      tag: "border-red-400/70 bg-red-100 text-red-700 dark:border-red-500/60 dark:bg-red-950/60 dark:text-red-100",
      more: "text-red-600 dark:text-red-300",
    },
  },

  // Solid filled card — opts out of theme retint to keep its gradient.
  solid: {
    themeable: false,
    wrapper:
      "rounded-2xl border border-red-500/50 bg-gradient-to-br from-red-600 to-red-700 px-3.5 py-3 shadow-[0_18px_40px_-24px_rgba(220,38,38,0.9)]",
    tone: {
      eyebrow:
        "text-[10px] font-black uppercase italic leading-none tracking-[0.28em] text-white/80",
      badge: "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm",
      badgeIcon: "text-white",
      badgeStatus: "text-white",
      title: "text-white",
      tag: "border-white/25 bg-white/10 text-white/90",
      more: "text-white/75",
    },
  },

  // Frosted glass — translucent, picks up the theme behind it.
  glass: {
    themeable: true,
    wrapper:
      "rounded-2xl border border-white/40 bg-white/25 px-3.5 py-3 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5",
    tone: {
      eyebrow:
        "text-[10px] font-bold uppercase leading-none tracking-[0.28em] text-red-500 dark:text-red-300",
      badge:
        "bg-red-500/90 text-white ring-1 ring-white/30 shadow-sm shadow-red-900/30 backdrop-blur-sm",
      badgeIcon: "text-white",
      badgeStatus: "text-white/90",
      title: "text-zinc-900 dark:text-white",
      tag: "border-white/40 bg-white/30 text-zinc-700 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100",
      more: "text-red-500/80 dark:text-red-300/80",
    },
  },

  // Minimal outline — transparent fill, the lightest footprint.
  outline: {
    themeable: true,
    wrapper:
      "rounded-xl border border-red-400/60 bg-transparent px-3.5 py-3 dark:border-red-500/50",
    tone: {
      eyebrow:
        "text-[10px] font-bold uppercase leading-none tracking-[0.28em] text-red-500/90 dark:text-red-400/90",
      badge:
        "border border-red-400/70 bg-red-50/40 text-red-600 dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-300",
      badgeIcon: "text-red-500 dark:text-red-400",
      badgeStatus: "text-red-500 dark:text-red-400",
      title: "text-zinc-900 dark:text-zinc-50",
      tag: "border-red-300/50 bg-transparent text-red-600 dark:border-red-800/60 dark:text-red-300",
      more: "text-red-500/70 dark:text-red-400/70",
    },
  },

  // The original animated skewed ribbon, preserved for those who want it.
  classic: {
    themeable: true,
    animated: true,
    wrapper:
      "rounded-2xl border border-red-200/70 bg-white/55 p-2 shadow-[0_14px_34px_-26px_rgba(127,29,29,0.65)] backdrop-blur-sm dark:border-red-900/80 dark:bg-zinc-950/35",
    tone: {
      eyebrow:
        "text-[20px] font-black italic leading-none tracking-[0.18em] font-baron text-red-500",
      badge: "",
      badgeIcon: "",
      badgeStatus: "",
      title: "",
      tag: "",
      more: "",
    },
  },
};

export function getCriticalRibbonStyle(
  style: RibbonVisualStyle,
): RibbonStylePreset {
  return ribbonStylePresets[style] ?? ribbonStylePresets.default;
}

export function getCriticalRibbonClass(style: RibbonVisualStyle): string {
  return getCriticalRibbonStyle(style).wrapper;
}

export function ribbonStyleIsThemeable(style: RibbonVisualStyle): boolean {
  return getCriticalRibbonStyle(style).themeable;
}
