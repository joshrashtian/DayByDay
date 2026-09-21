import { useNavigate, useParams } from "react-router-dom";
import { IoOpenOutline, IoPin, IoPinOutline } from "react-icons/io5";
import {
  loadPinnedToolkitPanels,
  savePinnedToolkitPanels,
  TOOLKIT_PANELS,
} from "@/lib/toolkitPanels";
import { useSettingsStore } from "@/stores/settingsStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { PanelSection } from "./primitives";

/** Toolbox: every panel, with pin state and a shortcut to open it. */
export function ToolkitContextPanel() {
  const navigate = useNavigate();
  const { panelId } = useParams<{ panelId?: string }>();
  // Subscribed so pin toggles re-render; loadPinnedToolkitPanels reads the store.
  useSettingsStore((s) => s.pinnedToolkitPanels);
  const pinned = new Set(loadPinnedToolkitPanels());

  const togglePin = (id: string) => {
    const next = new Set(pinned);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    savePinnedToolkitPanels([...next]);
  };

  return (
    <PanelSection title="Panels" aside={`${pinned.size} pinned`}>
      <ul className="space-y-0.5">
        {TOOLKIT_PANELS.map((panel) => {
          const isPinned = pinned.has(panel.id);
          const isCurrent = panel.id === panelId;
          return (
            <li
              key={panel.id}
              className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 ${
                isCurrent ? sidebarTokens.focusedItem : sidebarTokens.rowHover
              }`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-xs font-semibold ${sidebarTokens.primaryText}`}
                >
                  {panel.label}
                </span>
                <span
                  className={`block truncate text-[11px] ${sidebarTokens.mutedText}`}
                >
                  {panel.description}
                </span>
              </span>
              <button
                type="button"
                onClick={() => togglePin(panel.id)}
                aria-label={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                aria-pressed={isPinned}
                title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                className={`flex size-7 shrink-0 items-center justify-center rounded-md text-sm transition-colors ${
                  isPinned ? "text-accent" : sidebarTokens.utilityButton
                }`}
              >
                {isPinned ? <IoPin /> : <IoPinOutline />}
              </button>
              <button
                type="button"
                onClick={() => navigate(panel.route)}
                aria-label={`Open ${panel.label}`}
                title={`Open ${panel.label}`}
                className={`flex size-7 shrink-0 items-center justify-center rounded-md text-sm transition-colors ${sidebarTokens.utilityButton}`}
              >
                <IoOpenOutline />
              </button>
            </li>
          );
        })}
      </ul>
    </PanelSection>
  );
}
