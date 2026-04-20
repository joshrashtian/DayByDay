export const BLOCKS_USER_CSS_STORAGE_KEY = "dbd.blocks.userCss";

export const BLOCKS_USER_CSS_CHANGED = "dbd-blocks-user-css-changed";

export function getBlocksUserCss(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(BLOCKS_USER_CSS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setBlocksUserCss(css: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BLOCKS_USER_CSS_STORAGE_KEY, css);
    window.dispatchEvent(new Event(BLOCKS_USER_CSS_CHANGED));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearBlocksUserCss(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BLOCKS_USER_CSS_STORAGE_KEY);
    window.dispatchEvent(new Event(BLOCKS_USER_CSS_CHANGED));
  } catch {
    /* ignore */
  }
}
