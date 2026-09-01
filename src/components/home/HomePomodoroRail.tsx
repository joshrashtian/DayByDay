import { AnimatePresence, motion } from "motion/react";
import {
  IoPause,
  IoPlay,
  IoPlaySkipForward,
  IoRefresh,
} from "react-icons/io5";
import {
  formatPomodoroTime,
  POMODORO_DURATIONS,
  usePomodoroStore,
  type PomodoroPhase,
} from "../../stores/pomodoroStore";

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Break",
  longBreak: "Long break",
};

const PHASE_ACCENT: Record<PomodoroPhase, string> = {
  focus: "text-rose-500",
  shortBreak: "text-emerald-500",
  longBreak: "text-sky-500",
};

export function HomePomodoroToggle() {
  const panelOpen = usePomodoroStore((s) => s.panelOpen);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const togglePanelOpen = usePomodoroStore((s) => s.togglePanelOpen);
  const isActive = panelOpen || isRunning;

  return (
    <button
      type="button"
      onClick={togglePanelOpen}
      aria-expanded={panelOpen}
      aria-label={panelOpen ? "Hide focus timer" : "Show focus timer"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-eudoxus text-xs font-medium tracking-wide transition-all ${
        isActive
          ? "bg-surface text-rose-600 shadow-sm dark:text-rose-400"
          : "text-muted hover:text-muted"
      }`}
    >
      <span className="font-quantify tabular-nums">
        {formatPomodoroTime(secondsLeft)}
      </span>
      <span className="uppercase tracking-[0.1em]">
        {panelOpen ? "Hide" : "Focus"}
      </span>
    </button>
  );
}

export function HomePomodoroPanel({
  linkedTaskTitle,
}: {
  linkedTaskTitle?: string;
}) {
  const panelOpen = usePomodoroStore((s) => s.panelOpen);
  const phase = usePomodoroStore((s) => s.phase);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const completedFocusSessions = usePomodoroStore(
    (s) => s.completedFocusSessions,
  );
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skipToNextPhase = usePomodoroStore((s) => s.skipToNextPhase);

  const totalForPhase = POMODORO_DURATIONS[phase];
  const progress = 1 - secondsLeft / totalForPhase;

  return (
    <AnimatePresence>
      {panelOpen ? (
        <motion.div
          key="pomodoro-panel"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end rounded-2xl pt-2 pr-0 sm:pt-3"
        >
          <div
            className="absolute inset-0 rounded-2xl bg-linear-to-bl from-zinc-100/95 via-zinc-50/55 to-transparent dark:from-zinc-950/92 dark:via-zinc-950/45"
            aria-hidden
          />
          <motion.div className="pointer-events-auto relative flex max-w-[min(100%,13rem)] flex-col items-end gap-2 px-1 text-right sm:max-w-[15rem]">
            <div className="space-y-0.5">
              <p className="font-baron text-[10px] font-bold uppercase tracking-[0.2em] text-faint">
                Pomodoro
              </p>
              <p
                className={`font-quantify text-3xl font-semibold tabular-nums leading-none sm:text-4xl ${PHASE_ACCENT[phase]}`}
              >
                {formatPomodoroTime(secondsLeft)}
              </p>
              <p className="font-eudoxus text-[11px] text-muted">
                {PHASE_LABELS[phase]}
                {completedFocusSessions > 0
                  ? ` · ${completedFocusSessions} today`
                  : ""}
              </p>
            </div>
            {linkedTaskTitle ? (
              <p className="max-w-full truncate font-ppneue text-sm font-medium text-muted">
                {linkedTaskTitle}
              </p>
            ) : null}
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-sunken/80"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className={`h-full rounded-full ${
                  phase === "focus"
                    ? "bg-rose-500"
                    : phase === "shortBreak"
                      ? "bg-emerald-500"
                      : "bg-sky-500"
                }`}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.35, ease: "linear" }}
              />
            </div>
            <ol className="flex items-center gap-1.5">
              <li>
                <button
                  type="button"
                  onClick={isRunning ? pause : start}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-medium text-muted shadow-sm"
                >
                  {isRunning ? (
                    <IoPause className="text-sm" aria-hidden />
                  ) : (
                    <IoPlay className="text-sm" aria-hidden />
                  )}
                  {isRunning ? "Pause" : "Start"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Reset timer"
                  className="rounded-full bg-surface p-2 text-muted shadow-sm"
                >
                  <IoRefresh className="text-sm" aria-hidden />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={skipToNextPhase}
                  aria-label="Skip phase"
                  className="rounded-full bg-surface p-2 text-muted shadow-sm"
                >
                  <IoPlaySkipForward className="text-sm" aria-hidden />
                </button>
              </li>
            </ol>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
