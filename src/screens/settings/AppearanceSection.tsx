import { useSettingsStore } from "@/stores/settingsStore";
import {
  listSidebarStyles,
  normalizeSidebarStyleId,
} from "@/themes/sidebarStyles";
import { HomeStyleEditor } from "@/components/home/HomeStyleEditor";

export function AppearanceSection() {
  const sidebarStyle = useSettingsStore((s) => s.sidebar.style);
  const setSidebar = useSettingsStore((s) => s.setSidebar);
  const homeVisualPrefs = useSettingsStore((s) => s.homeVisualPrefs);
  const setHomeVisualPrefs = useSettingsStore((s) => s.setHomeVisualPrefs);

  const activeId = normalizeSidebarStyleId(sidebarStyle);
  const styles = listSidebarStyles();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Customize how the app looks — the sidebar and the home page.
        </p>
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Sidebar Style
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {styles.map((style) => {
            const selected = activeId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSidebar({ style: style.id })}
                aria-pressed={selected}
                className={`flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                  selected
                    ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-white dark:ring-white/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className={`h-14 bg-gradient-to-br ${style.swatch}`}
                  aria-hidden
                />
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {style.label}
                  </span>
                  <span className="line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {style.description}
                  </span>
                  {selected ? (
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Active
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Home Page
        </h3>
        <div className="mt-4">
          <HomeStyleEditor
            prefs={homeVisualPrefs}
            onPrefsChange={setHomeVisualPrefs}
            layout="window"
          />
        </div>
      </section>
    </div>
  );
}
