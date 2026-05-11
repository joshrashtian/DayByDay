export type RibbonVisualStyle = "default" | "muted" | "high-contrast";

const criticalRibbonStyles: Record<RibbonVisualStyle, string> = {
  default: "",
  muted: "opacity-85 saturate-80",
  "high-contrast": "contrast-125 saturate-125",
};

export function getCriticalRibbonClass(style: RibbonVisualStyle): string {
  return criticalRibbonStyles[style];
}
