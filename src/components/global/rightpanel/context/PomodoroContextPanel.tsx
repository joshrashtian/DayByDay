import { useShallow } from "zustand/react/shallow";
import { IoPause, IoPlay, IoPlaySkipForward, IoRefresh } from "react-icons/io5";
import {
  POMODORO_DURATIONS,
  usePomodoroStore,
  type PomodoroPhase,
} from "@/stores/pomodoroStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { PanelSection, StatTile } from "./primitives";

const PHASE_LABEL: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Pomodoro: the live timer, session tally, and transport controls. */
export function PomodoroContextPanel() {
  const {
    phase,
    secondsLeft,
    isRunning,
    completedFocusSessions,
    linkedTaskTitle,
    start,
    pause,
    reset,
    skipToNextPhase,
  } = usePomodoroStore(
    useShallow((s) => ({
      phase: s.phase,
      secondsLeft: s.secondsLeft,
      isRunning: s.isRunning,
      completedFocusSessions: s.completedFocusSessions,
      linkedTaskTitle: s.linkedTaskTitle,
      start: s.start,
      pause: s.pause,
      reset: s.reset,
      skipToNextPhase: s.skipToNextPhase,
    })),
  );

  const total = POMODORO_DURATIONS[phase];
  const progress = total ? 1 - secondsLeft / total : 0;
  const focusMinutesToday = Math.round(
    (completedFocusSessions * POMODORO_DURATIONS.focus) / 60,
  );

  const controlClass = `flex h-9 w-9 items-center justify-center rounded-lg text-base transition-colors ${sidebarTokens.utilityButton}`;

  return (
    <div>
      <PanelSection
        title={PHASE_LABEL[phase]}
        aside={isRunning ? "running" : "paused"}
      >
        <div
          className={`mx-1.5 rounded-xl border px-3 py-3 ${sidebarTokens.divider} ${
            phase === "focus" ? "bg-accent-soft" : sidebarTokens.surface
          } ${isRunning ? "bg-blue-300/50" : "bg-white"} duration-500`}
        >
          <p
            className={`font-mono text-3xl font-bold tabular-nums leading-none ${
              phase === "focus" ? "text-accent" : sidebarTokens.primaryText
            }`}
          >
            {formatClock(secondsLeft)}
          </p>
          {linkedTaskTitle ? (
            <p className={`mt-1.5 truncate text-xs ${sidebarTokens.mutedText}`}>
              {linkedTaskTitle}
            </p>
          ) : null}
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={isRunning ? pause : start}
              aria-label={isRunning ? "Pause" : "Start"}
              title={isRunning ? "Pause" : "Start"}
              className={`${controlClass} bg-accent text-white hover:bg-accent-hover hover:text-white`}
            >
              {isRunning ? <IoPause /> : <IoPlay />}
            </button>
            <button
              type="button"
              onClick={skipToNextPhase}
              aria-label="Skip to next phase"
              title="Skip to next phase"
              className={controlClass}
            >
              <IoPlaySkipForward />
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset timer"
              title="Reset timer"
              className={controlClass}
            >
              <IoRefresh />
            </button>
          </div>
        </div>
      </PanelSection>

      <div className="grid grid-cols-2 gap-2 px-1.5">
        <StatTile label="Sessions Today" value={completedFocusSessions} />
        <StatTile label="Focused" value={`${focusMinutesToday}m`} />
      </div>
    </div>
  );
}
