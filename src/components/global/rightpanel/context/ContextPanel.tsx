import type { ComponentType } from "react";
import { useLocation } from "react-router-dom";
import {
  resolveContextPanel,
  type ContextPanelId,
} from "@/lib/rightPanelContext";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { SpotifyListeningHistory } from "../SpotifyListeningHistory";
import { BlocksContextPanel } from "./BlocksContextPanel";
import { CalendarContextPanel } from "./CalendarContextPanel";
import { HomeContextPanel } from "./HomeContextPanel";
import { PomodoroContextPanel } from "./PomodoroContextPanel";
import { TasksContextPanel } from "./TasksContextPanel";
import { ToolkitContextPanel } from "./ToolkitContextPanel";
import { EmptyNote } from "./primitives";

function GenericContextPanel() {
  return (
    <EmptyNote>
      Nothing page-specific here yet. Switch tabs above for Spotify.
    </EmptyNote>
  );
}

// Add a page here (and a route rule in lib/rightPanelContext.ts) to give it
// its own companion panel.
const PANELS: Record<ContextPanelId, ComponentType> = {
  home: HomeContextPanel,
  tasks: TasksContextPanel,
  calendar: CalendarContextPanel,
  blocks: BlocksContextPanel,
  pomodoro: PomodoroContextPanel,
  spotify: SpotifyListeningHistory,
  toolkit: ToolkitContextPanel,
  generic: GenericContextPanel,
};

/**
 * The "Page" tab of the right panel: whatever companion content makes sense
 * for the route the user is currently on.
 */
export function ContextPanel() {
  const { pathname } = useLocation();
  const { id, label } = resolveContextPanel(pathname);
  const Body = PANELS[id];

  return (
    <div className="flex flex-col">
      <header className="mb-3 px-1.5">
        <p
          className={`font-mono text-[10px] uppercase tracking-wide ${sidebarTokens.mutedText}`}
        >
          On this page
        </p>
        <h2
          className={`font-eudoxus text-base font-black leading-tight ${sidebarTokens.primaryText}`}
        >
          {label}
        </h2>
      </header>
      {/* Keyed on the page so per-page state resets cleanly when routes change. */}
      <Body key={id} />
    </div>
  );
}
