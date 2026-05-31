import { useEffect } from "react";
import { HomeStyleEditor } from "../components/home/HomeStyleEditor";
import { useSettingsStore } from "../stores/settingsStore";
import { IoClose, IoColorPaletteOutline } from "react-icons/io5";
import { isTauri } from "../lib/tauriEnv";

export function HomeStyleWindowScreen() {
  const visualPrefs = useSettingsStore((s) => s.homeVisualPrefs);
  const setVisualPrefs = useSettingsStore((s) => s.setHomeVisualPrefs);

  useEffect(() => {
    document.title = "Home Style — Rise By Day";
  }, []);

  const handleClose = async () => {
    if (isTauri()) {
      try {
        const { getCurrentWebviewWindow } = await import(
          "@tauri-apps/api/webviewWindow"
        );
        await getCurrentWebviewWindow().close();
        return;
      } catch {
        // fall through
      }
    }

    window.close();
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 sm:px-6">
        <div className="flex items-center gap-2">
          <IoColorPaletteOutline className="text-lg text-zinc-700 dark:text-zinc-200" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Home Style
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Changes apply live on your home page.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleClose()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <IoClose className="text-base" />
          Close
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <HomeStyleEditor
            prefs={visualPrefs}
            onPrefsChange={setVisualPrefs}
            layout="window"
          />
        </div>
      </main>
    </div>
  );
}
