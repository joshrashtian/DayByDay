import { useSettingsStore } from "../stores/settingsStore";

export function getBlocksUserCss(): string {
  return useSettingsStore.getState().blocksUserCss;
}

export function setBlocksUserCss(css: string): void {
  useSettingsStore.getState().setBlocksUserCss(css);
}

export function clearBlocksUserCss(): void {
  useSettingsStore.getState().setBlocksUserCss("");
}
