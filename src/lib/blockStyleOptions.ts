import { blockStyleRegistry } from "@/themes/sectionStyles";
import type { BlockVisualStyle } from "@/types";

export type BlockStyleOption = {
  id: BlockVisualStyle;
  label: string;
};

export function listBlockStyleOptions(): BlockStyleOption[] {
  return blockStyleRegistry.list();
}

export const BLOCK_STYLE_OPTIONS: BlockStyleOption[] =
  listBlockStyleOptions();

export const BLOCK_STYLE_LABELS: Record<BlockVisualStyle, string> =
  Object.fromEntries(
    BLOCK_STYLE_OPTIONS.map((option) => [option.id, option.label]),
  ) as Record<BlockVisualStyle, string>;
