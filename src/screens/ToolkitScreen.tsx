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
      <h1 className="font-quantify text-4xl text-ink sm:text-5xl">
        Toolkit
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted">
        This is the home for dedicated panels we build inside RiseByDay. Add the
        ones you want to your app bar manually.
      </p>

      <section className="mt-7 w-full max-w-3xl rounded-2xl border border-line/80 bg-surface/70 p-5">
        <h2 className="text-lg font-semibold text-ink">
          Available Panels
        </h2>
        <ul className="mt-4 space-y-2">
          {TOOLKIT_PANELS.map((panel) => (
            <li
              key={panel.id}
              className="rounded-xl border border-line/80 bg-surface/70 p-3"
            >
              <p className="text-sm font-semibold text-ink">
                {panel.label}
              </p>
              <p className="mt-1 text-xs text-muted">
                {panel.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePinnedPanel(panel.id)}
                  className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    pinnedPanelIds.includes(panel.id)
                      ? "bg-sunken text-ink hover:bg-zinc-300"
                      : "bg-ink text-white hover:bg-ink"
                  }`}
                >
                  {pinnedPanelIds.includes(panel.id)
                    ? "Remove from Bar"
                    : "Add to Bar"}
                </button>
                <NavLink
                  to={panel.route}
                  className="inline-flex items-center justify-center rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-sunken"
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
