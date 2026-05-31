import { NavLink } from "react-router-dom";
import { TOOLKIT_PANELS, savePinnedToolkitPanels } from "../lib/toolkitPanels";
import { useSettingsStore } from "../stores/settingsStore";

export default function ToolkitScreen() {
  const pinnedPanelIds = useSettingsStore((s) => s.pinnedToolkitPanels);

  const togglePinnedPanel = (panelId: string) => {
    const isPinned = pinnedPanelIds.includes(panelId);
    const next = isPinned
      ? pinnedPanelIds.filter((id) => id !== panelId)
      : [...pinnedPanelIds, panelId];
    savePinnedToolkitPanels(next);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="font-quantify text-4xl text-zinc-900 dark:text-zinc-100 sm:text-5xl">
        Toolkit
      </h1>
      <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
        This is the home for dedicated panels we build inside RiseByDay. Add the
        ones you want to your app bar manually.
      </p>

      <section className="mt-7 w-full max-w-3xl rounded-2xl border border-zinc-200/80 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-900/60">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Available Panels
        </h2>
        <ul className="mt-4 space-y-2">
          {TOOLKIT_PANELS.map((panel) => (
            <li
              key={panel.id}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/70"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {panel.label}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {panel.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePinnedPanel(panel.id)}
                  className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    pinnedPanelIds.includes(panel.id)
                      ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  }`}
                >
                  {pinnedPanelIds.includes(panel.id)
                    ? "Remove from Bar"
                    : "Add to Bar"}
                </button>
                <NavLink
                  to={panel.route}
                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Open Panel
                </NavLink>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
