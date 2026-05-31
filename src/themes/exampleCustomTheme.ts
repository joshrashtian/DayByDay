/**
 * Example: register a custom home theme at app startup.
 *
 * import { registerExampleCustomTheme } from "@/themes/exampleCustomTheme";
 * registerExampleCustomTheme();
 */
import { darkFocusToggle, defineHomeTheme } from "./presets";
import { registerHomeTheme } from "./registry";

export function registerExampleCustomTheme() {
  registerHomeTheme(
    defineHomeTheme({
      id: "midnight-garden",
      label: "Midnight Garden",
      description: "Deep violet page with emerald accents",
      source: "user",
      template: "terminal",
      swatch: "from-violet-950 via-zinc-950 to-emerald-800",
      page: {
        className:
          "bg-violet-950 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_60%)]",
        contentClassName: "text-violet-100",
      },
      home: {
        unifiedBlockAccent: true,
        blockAccent: {
          default:
            "border border-violet-400/35 bg-violet-950/80 text-violet-100",
          earlyMorning:
            "border border-violet-400/35 bg-violet-950/80 text-violet-100",
          afternoon:
            "border border-emerald-400/30 bg-violet-950/85 text-emerald-100",
          evening:
            "border border-violet-300/30 bg-violet-950/90 text-violet-50",
        },
        focusToggle: darkFocusToggle(
          "bg-violet-950/80 ring-1 ring-violet-400/25",
          "bg-violet-500/20 text-violet-100",
          "text-violet-400/70 hover:text-violet-200",
        ),
        styleButton:
          "border-violet-400/35 bg-violet-950/90 text-violet-100 hover:bg-violet-900",
        ribbonOverlay: "border-violet-400/25 bg-violet-950/70",
        tasksOverlay:
          "rounded-xl border border-violet-400/25 bg-violet-950/70 p-4",
        tasksInner: "[&_h2]:text-violet-50 [&_.font-baron]:text-violet-200",
        tasksDropZone: "rounded-xl border border-violet-400/20 bg-black/25",
        tasksDropZoneActive: "border-emerald-400/45 bg-emerald-950/30",
      },
    }),
  );
}
