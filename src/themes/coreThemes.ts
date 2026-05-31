import {
  blockAccentByTimeOfDay,
  darkFocusToggle,
  defineHomeTheme,
  lightFocusToggle,
  unifiedBlockAccent,
} from "./presets";

/**
 * Core bundled home page themes.
 *
 * To add a custom theme at runtime, call `registerHomeTheme()` from
 * `src/themes/registry.ts` — see `src/themes/exampleCustomTheme.ts`.
 */
export const CORE_HOME_THEMES = [
  defineHomeTheme({
    id: "minimal",
    label: "Default",
    description: "Skewed blue accent, bold type",
    template: "minimal",
    swatch: "from-blue-600 to-blue-500",
    page: {
      className:
        "bg-zinc-100/50 dark:bg-zinc-950 [--home-muted:theme(colors.zinc.500)]",
    },
    home: {
      ...blockAccentByTimeOfDay({
        default: "bg-zinc-200/70 text-zinc-900",
        earlyMorning: "bg-sky-200/80 text-sky-950",
        afternoon: "bg-amber-200/80 text-amber-950",
        evening: "bg-indigo-200/80 text-indigo-950",
      }),
      focusToggle: lightFocusToggle(),
      styleButton:
        "border-zinc-200/80 bg-white/90 text-zinc-800 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-900",
      ribbonOverlay: "",
      tasksOverlay: "",
      tasksInner: "font-eudoxus",
      tasksDropZone: "rounded-2xl",
      tasksDropZoneActive:
        "border border-sky-400 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30",
    },
  }),
  defineHomeTheme({
    id: "p5",
    label: "Persona 5",
    description: "High-contrast skew cards, dramatic shadows",
    template: "p5",
    swatch: "from-zinc-900 via-blue-700 to-black",
    page: {
      className:
        "bg-gradient-to-br from-zinc-900 via-zinc-950 to-blue-950/50 dark:from-black dark:via-zinc-950 dark:to-blue-950/70 [--home-muted:theme(colors.zinc.400)]",
      contentClassName: "text-zinc-100",
    },
    home: {
      ...unifiedBlockAccent(
        "bg-blue-600/90 text-white shadow-[0_12px_28px_rgba(37,99,235,0.45)]",
      ),
      blockAccent: {
        default:
          "bg-blue-600/90 text-white shadow-[0_12px_28px_rgba(37,99,235,0.45)]",
        earlyMorning: "bg-blue-600/90 text-white",
        afternoon: "bg-blue-700/90 text-white",
        evening: "bg-indigo-700/90 text-white",
      },
      focusToggle: darkFocusToggle(
        "bg-black/40 ring-1 ring-white/10",
        "bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.5)]",
        "text-zinc-400 hover:text-zinc-200",
      ),
      styleButton:
        "border-blue-500/40 bg-zinc-950/85 text-blue-100 hover:bg-zinc-900 dark:border-blue-400/30",
      ribbonOverlay:
        "border-blue-500/30 bg-zinc-950/70 shadow-[0_0_20px_rgba(37,99,235,0.2)]",
      tasksOverlay:
        "rounded-2xl border border-blue-500/25 bg-zinc-950/60 p-4 shadow-[inset_0_0_30px_rgba(37,99,235,0.08)] backdrop-blur-sm",
      tasksInner:
        "[&_.font-baron]:text-blue-100 [&_.font-eudoxus]:text-zinc-400 [&_.font-ppneue]:text-zinc-100 [&_h2]:text-white [&_h3]:text-blue-200",
      tasksDropZone: "rounded-2xl border border-blue-500/15 bg-black/25",
      tasksDropZoneActive:
        "border-blue-400/50 bg-blue-950/35 shadow-[0_0_20px_rgba(37,99,235,0.15)]",
    },
  }),
  defineHomeTheme({
    id: "basic",
    label: "Basic",
    description: "Large quantified numbers, sky tones",
    template: "basic",
    swatch: "from-sky-200 to-blue-400",
    page: {
      className:
        "bg-gradient-to-b from-sky-50/90 via-zinc-50/60 to-zinc-100/50 dark:from-sky-950/25 dark:via-zinc-950 dark:to-zinc-950 [--home-muted:theme(colors.sky.600)]",
    },
    home: {
      ...blockAccentByTimeOfDay({
        default: "bg-sky-100/90 text-sky-950",
        earlyMorning: "bg-sky-200/90 text-sky-950",
        afternoon: "bg-blue-100/90 text-blue-950",
        evening: "bg-indigo-100/90 text-indigo-950",
      }),
      focusToggle: {
        track: "bg-sky-200/50 dark:bg-sky-950/40",
        active: "bg-white text-sky-950 shadow-sm",
        inactive: "text-sky-700/70 hover:text-sky-900 dark:text-sky-300/70",
      },
      styleButton:
        "border-sky-300/60 bg-white/90 text-sky-950 hover:bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/80 dark:text-sky-100",
      ribbonOverlay: "border-sky-300/50 bg-sky-50/45 backdrop-blur-sm",
      tasksOverlay:
        "rounded-2xl border border-sky-200/60 bg-sky-50/40 p-4 shadow-[0_18px_40px_-30px_rgba(14,116,144,0.25)] backdrop-blur-sm",
      tasksInner:
        "[&_.font-baron]:text-sky-900 [&_.font-eudoxus]:text-sky-600/80 [&_.font-ppneue]:text-sky-950",
      tasksDropZone: "rounded-2xl border border-sky-200/50 bg-sky-50/30",
      tasksDropZoneActive: "border-sky-400/60 bg-sky-100/50",
    },
  }),
  defineHomeTheme({
    id: "terminal",
    label: "Terminal",
    description: "Dark CRT, green monospace glow",
    template: "terminal",
    swatch: "from-zinc-950 to-emerald-700",
    page: {
      className:
        "bg-zinc-950 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)] [--home-muted:theme(colors.emerald.500/70)]",
      contentClassName: "text-emerald-50/95",
    },
    home: {
      unifiedBlockAccent: true,
      blockAccent: {
        default:
          "border border-emerald-500/40 bg-zinc-950/80 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.15)]",
        earlyMorning:
          "border border-emerald-500/40 bg-zinc-950/80 text-emerald-300",
        afternoon:
          "border border-emerald-500/35 bg-zinc-950/85 text-emerald-200",
        evening:
          "border border-emerald-400/30 bg-zinc-950/90 text-emerald-200",
      },
      focusToggle: darkFocusToggle(
        "bg-zinc-950/80 ring-1 ring-emerald-500/25",
        "bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
        "text-emerald-700/80 hover:text-emerald-400",
      ),
      styleButton:
        "border-emerald-500/35 bg-zinc-950/90 text-emerald-200 hover:bg-zinc-900 shadow-[0_0_16px_rgba(16,185,129,0.12)]",
      ribbonOverlay:
        "border-emerald-500/30 bg-zinc-950/75 shadow-[inset_0_0_20px_rgba(16,185,129,0.06)]",
      tasksOverlay:
        "rounded-lg border border-emerald-500/30 bg-zinc-950/75 p-4 shadow-[inset_0_0_28px_rgba(16,185,129,0.08)]",
      tasksInner:
        "[&_.font-baron]:font-quantify [&_.font-baron]:text-emerald-400 [&_.font-eudoxus]:text-emerald-600/70 [&_.font-ppneue]:font-quantify [&_.font-ppneue]:text-emerald-100 [&_h2]:font-quantify [&_h2]:text-emerald-50 [&_h3]:text-emerald-400/90 [&_p]:text-emerald-200/70",
      tasksDropZone:
        "rounded-xl border border-emerald-500/20 bg-black/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.04)]",
      tasksDropZoneActive:
        "border-emerald-400/55 bg-emerald-950/45 shadow-[0_0_24px_rgba(16,185,129,0.12)]",
    },
  }),
  defineHomeTheme({
    id: "orbit",
    label: "Orbit",
    description: "Circular medallion, warm amber",
    template: "orbit",
    swatch: "from-amber-200 to-orange-400",
    page: {
      className:
        "bg-gradient-to-br from-amber-50 via-orange-50/40 to-zinc-100 dark:from-amber-950/20 dark:via-zinc-950 dark:to-zinc-950 [--home-muted:theme(colors.amber.700/80)]",
    },
    home: {
      ...blockAccentByTimeOfDay({
        default: "bg-amber-100/90 text-amber-950",
        earlyMorning: "bg-amber-100/90 text-amber-950",
        afternoon: "bg-orange-100/90 text-orange-950",
        evening: "bg-amber-200/80 text-amber-950",
      }),
      focusToggle: {
        track: "bg-amber-200/45 dark:bg-amber-950/30",
        active: "bg-white text-amber-950 shadow-sm",
        inactive: "text-amber-800/60 hover:text-amber-950",
      },
      styleButton:
        "border-amber-300/55 bg-amber-50/80 text-amber-950 hover:bg-amber-100/90 shadow-[0_8px_24px_-16px_rgba(180,83,9,0.35)] dark:border-amber-800/50 dark:bg-amber-950/70 dark:text-amber-100",
      ribbonOverlay: "border-amber-300/45 bg-amber-50/40",
      tasksOverlay:
        "rounded-2xl border border-amber-300/40 bg-amber-50/30 p-4 shadow-[0_20px_40px_-32px_rgba(180,83,9,0.22)] backdrop-blur-sm",
      tasksInner:
        "[&_.font-baron]:text-amber-900 [&_.font-eudoxus]:text-amber-800/70 [&_.font-ppneue]:text-amber-950",
      tasksDropZone:
        "rounded-2xl border border-amber-300/35 bg-amber-100/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
      tasksDropZoneActive: "border-amber-400/55 bg-amber-100/35",
    },
  }),
  defineHomeTheme({
    id: "neon",
    label: "Neon",
    description: "Synthwave glow, cyan and fuchsia",
    template: "neon",
    swatch: "from-fuchsia-600 via-zinc-950 to-cyan-500",
    page: {
      className:
        "bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.1),transparent_55%)] [--home-muted:theme(colors.fuchsia.400/80)]",
      contentClassName: "text-zinc-100",
    },
    home: {
      unifiedBlockAccent: true,
      blockAccent: {
        default:
          "border border-fuchsia-400/35 bg-zinc-950/85 text-fuchsia-200 shadow-[0_0_28px_rgba(236,72,153,0.2)]",
        earlyMorning:
          "border border-cyan-400/35 bg-zinc-950/85 text-cyan-200",
        afternoon:
          "border border-fuchsia-400/35 bg-zinc-950/85 text-fuchsia-200",
        evening:
          "border border-fuchsia-500/40 bg-zinc-950/90 text-fuchsia-100",
      },
      focusToggle: darkFocusToggle(
        "bg-zinc-950/80 ring-1 ring-fuchsia-500/25",
        "bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_14px_rgba(236,72,153,0.35)]",
        "text-cyan-500/70 hover:text-cyan-300",
      ),
      styleButton:
        "border-fuchsia-400/35 bg-zinc-950/90 text-fuchsia-100 hover:bg-zinc-900 shadow-[0_0_18px_rgba(236,72,153,0.15)]",
      ribbonOverlay:
        "border-fuchsia-400/30 bg-zinc-950/70 shadow-[0_0_22px_rgba(236,72,153,0.15)]",
      tasksOverlay:
        "rounded-xl border border-fuchsia-400/30 bg-zinc-950/80 p-4 shadow-[0_0_32px_rgba(236,72,153,0.12),inset_0_0_24px_rgba(34,211,238,0.06)] ring-1 ring-cyan-400/15",
      tasksInner:
        "[&_.font-baron]:text-fuchsia-300 [&_.font-eudoxus]:text-cyan-400/70 [&_.font-ppneue]:text-fuchsia-50 [&_h2]:bg-gradient-to-r [&_h2]:from-fuchsia-200 [&_h2]:to-cyan-200 [&_h2]:bg-clip-text [&_h2]:text-transparent [&_h3]:text-cyan-300",
      tasksDropZone:
        "rounded-xl border border-fuchsia-400/20 bg-zinc-950/50 shadow-[inset_0_0_18px_rgba(236,72,153,0.06)]",
      tasksDropZoneActive:
        "border-fuchsia-400/50 bg-fuchsia-950/35 shadow-[0_0_28px_rgba(236,72,153,0.18)]",
    },
  }),
  defineHomeTheme({
    id: "editorial",
    label: "Editorial",
    description: "Magazine serif, quiet and refined",
    template: "editorial",
    swatch: "from-zinc-100 to-zinc-300",
    page: {
      className:
        "bg-[#faf9f7] dark:bg-zinc-950 [--home-muted:theme(colors.zinc.500)]",
    },
    home: {
      ...blockAccentByTimeOfDay({
        default: "bg-zinc-100/90 text-zinc-900 border-r-2 border-zinc-900/80 pr-4",
        earlyMorning:
          "bg-zinc-50/95 text-zinc-900 border-r-2 border-zinc-800/70 pr-4",
        afternoon:
          "bg-stone-100/90 text-stone-900 border-r-2 border-stone-800/70 pr-4",
        evening:
          "bg-zinc-100/90 text-zinc-900 border-r-2 border-zinc-700/70 pr-4",
      }),
      focusToggle: lightFocusToggle("bg-zinc-200/50 dark:bg-zinc-800/40"),
      styleButton:
        "border-zinc-300/70 bg-[#faf9f7]/95 text-zinc-800 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100",
      ribbonOverlay: "border-zinc-300/60 bg-[#faf9f7]/70",
      tasksOverlay: "border-t border-zinc-300/70 pt-4",
      tasksInner:
        "[&_.font-baron]:font-sans [&_.font-baron]:font-medium [&_.font-baron]:normal-case [&_.font-baron]:tracking-[0.2em] [&_.font-eudoxus]:font-sans [&_.font-ppneue]:font-sans [&_.font-ppneue]:font-light [&_h2]:font-sans [&_h2]:font-light",
      tasksDropZone:
        "rounded-none border-t border-b border-zinc-300/50 bg-transparent",
      tasksDropZoneActive: "border-zinc-500/60 bg-zinc-100/40",
    },
  }),
];
