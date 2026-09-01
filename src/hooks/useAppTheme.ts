import { useEffect } from "react";
import { applyTheme, watchSystemTheme } from "@/lib/appTheme";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Keeps the `dark` class on <html> in sync with the stored preference, and —
 * while the preference is "system" — with the OS appearance as it changes.
 *
 * Mount once, near the root.
 */
export function useAppTheme(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    return watchSystemTheme(() => applyTheme("system"));
  }, [theme]);
}
