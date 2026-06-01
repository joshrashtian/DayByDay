import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  IoChevronDown,
  IoHourglassOutline,
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

const PHASE_DOT: Record<PomodoroPhase, string> = {
  focus: "bg-rose-500",
  shortBreak: "bg-emerald-500",
  longBreak: "bg-sky-500",
};

export function GlobalPomodoroDock() {
  const location = useLocation();
  const phase = usePomodoroStore((s) => s.phase);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const completedFocusSessions = usePomodoroStore(
    (s) => s.completedFocusSessions,
  );
  const linkedTaskTitle = usePomodoroStore((s) => s.linkedTaskTitle);
  const panelOpen = usePomodoroStore((s) => s.panelOpen);
  const dockExpanded = usePomodoroStore((s) => s.dockExpanded);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skipToNextPhase = usePomodoroStore((s) => s.skipToNextPhase);
  const toggleDockExpanded = usePomodoroStore((s) => s.toggleDockExpanded);
  const setPanelOpen = usePomodoroStore((s) => s.setPanelOpen);

  useEffect(() => {
    if (location.pathname !== "/") {
      setPanelOpen(false);
    }
  }, [location.pathname, setPanelOpen]);

  const onHome = location.pathname === "/";
  const onPomodoroScreen = location.pathname === "/pomodoro";
  const hideDock = onPomodoroScreen || (onHome && panelOpen);
  const progress = 1 - secondsLeft / POMODORO_DURATIONS[phase];
  const isActive = isRunning || dockExpanded;

  if (hideDock) return null;

  return (
    <motion.div
      layout
      className="fixed bottom-4 right-4 z-60 font-eudoxus sm:right-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="wait">
        {dockExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="w-[min(100vw-2rem,17rem)] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] backdrop-blur-md dark:border-zinc-700/90 dark:bg-zinc-900/95"
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <motion.div layout className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${PHASE_DOT[phase]}`}
                  aria-hidden
                />
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {PHASE_LABELS[phase]}
                </span>
              </motion.div>
              <button
                type="button"
                onClick={toggleDockExpanded}
                aria-label="Collapse timer"
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <IoChevronDown className="text-base" aria-hidden />
              </button>
            </div>
            <div className="space-y-2 px-3 py-3">
              <p className="font-display text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPomodoroTime(secondsLeft)}
              </p>
              {linkedTaskTitle ? (
                <p className="truncate font-ppneue text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {linkedTaskTitle}
                </p>
              ) : null}
              <p className="text-[10px] text-zinc-400">
                {completedFocusSessions} focus session
                {completedFocusSessions === 1 ? "" : "s"} today
              </p>
              <div
                className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 linear ${PHASE_DOT[phase]}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={isRunning ? pause : start}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isRunning ? <IoPause aria-hidden /> : <IoPlay aria-hidden />}
                  {isRunning ? "Pause" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Reset"
                  className="rounded-full border border-zinc-200 p-2 text-zinc-500 dark:border-zinc-600"
                >
                  <IoRefresh className="text-sm" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={skipToNextPhase}
                  aria-label="Skip"
                  className="rounded-full border border-zinc-200 p-2 text-zinc-500 dark:border-zinc-600"
                >
                  <IoPlaySkipForward className="text-sm" aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={toggleDockExpanded}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-colors ${
              isActive
                ? "border-rose-200/90 bg-white text-rose-600 dark:border-rose-900/50 dark:bg-zinc-900 dark:text-rose-400"
                : "border-zinc-200/90 bg-white/95 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${PHASE_DOT[phase]} ${isRunning ? "animate-pulse" : ""}`}
              aria-hidden
            />
            <IoHourglassOutline className="text-sm" aria-hidden />
            <span className="font-quantify tabular-nums">
              {formatPomodoroTime(secondsLeft)}
            </span>
            <span className="uppercase tracking-[0.08em]">
              {PHASE_LABELS[phase]}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
