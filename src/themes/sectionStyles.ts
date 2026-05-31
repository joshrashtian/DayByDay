import type { BlockVisualStyle, RibbonVisualStyle, TasksVisualStyle } from "@/types";
import type { SectionStyleOption } from "./types";
import { SectionStyleRegistry } from "./sectionStyleRegistry";

export { SectionStyleRegistry } from "./sectionStyleRegistry";

const CORE_BLOCK_STYLE_OPTIONS: SectionStyleOption<BlockVisualStyle>[] = [
  { id: "punchy", label: "Punchy" },
  { id: "clean", label: "Clean" },
  { id: "outline", label: "Outline" },
  { id: "capsule", label: "Capsule" },
  { id: "stacked", label: "Stacked" },
  { id: "terminal", label: "Terminal" },
  { id: "neon", label: "Neon" },
  { id: "sticker", label: "Sticker" },
];

const CORE_RIBBON_STYLE_OPTIONS: SectionStyleOption<RibbonVisualStyle>[] = [
  { id: "default", label: "Default" },
  { id: "muted", label: "Muted" },
  { id: "high-contrast", label: "High Contrast" },
];

const CORE_TASKS_STYLE_OPTIONS: SectionStyleOption<TasksVisualStyle>[] = [
  { id: "default", label: "Default" },
  { id: "card", label: "Card" },
  { id: "minimal", label: "Minimal" },
  { id: "terminal", label: "Terminal" },
  { id: "neon", label: "Neon" },
  { id: "editorial", label: "Editorial" },
  { id: "outline", label: "Outline" },
  { id: "glass", label: "Glass" },
];

export const blockStyleRegistry = new SectionStyleRegistry<BlockVisualStyle>(
  CORE_BLOCK_STYLE_OPTIONS,
);
export const ribbonStyleRegistry = new SectionStyleRegistry<RibbonVisualStyle>(
  CORE_RIBBON_STYLE_OPTIONS,
);
export const tasksStyleRegistry = new SectionStyleRegistry<TasksVisualStyle>(
  CORE_TASKS_STYLE_OPTIONS,
);

export function registerBlockStyleOption(
  option: SectionStyleOption<BlockVisualStyle>,
) {
  blockStyleRegistry.register(option);
}

export function registerRibbonStyleOption(
  option: SectionStyleOption<RibbonVisualStyle>,
) {
  ribbonStyleRegistry.register(option);
}

export function registerTasksStyleOption(
  option: SectionStyleOption<TasksVisualStyle>,
) {
  tasksStyleRegistry.register(option);
}
