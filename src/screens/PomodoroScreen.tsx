import { motion } from "motion/react";
import {
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
} from "../stores/pomodoroStore";

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

const PHASE_ACCENT: Record<PomodoroPhase, string> = {
  focus: "text-rose-500",
  shortBreak: "text-emerald-500",
  longBreak: "text-sky-500",
};

const PHASE_RING: Record<PomodoroPhase, string> = {
  focus: "stroke-rose-500",
  shortBreak: "stroke-emerald-500",
  longBreak: "stroke-sky-500",
};

const PHASE_BG: Record<PomodoroPhase, string> = {
  focus:
    "from-rose-50/80 via-white/60 to-zinc-50/40 dark:from-rose-950/30 dark:via-zinc-950/50 dark:to-zinc-950",
  shortBreak:
    "from-emerald-50/80 via-white/60 to-zinc-50/40 dark:from-emerald-950/25 dark:via-zinc-950/50 dark:to-zinc-950",
  longBreak:
    "from-sky-50/80 via-white/60 to-zinc-50/40 dark:from-sky-950/25 dark:via-zinc-950/50 dark:to-zinc-950",
};

const RING_RADIUS = 132;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatDurationMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

export default function PomodoroScreen() {
  const phase = usePomodoroStore((s) => s.phase);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const completedFocusSessions = usePomodoroStore(
    (s) => s.completedFocusSessions,
  );
  const linkedTaskTitle = usePomodoroStore((s) => s.linkedTaskTitle);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skipToNextPhase = usePomodoroStore((s) => s.skipToNextPhase);

  const totalForPhase = POMODORO_DURATIONS[phase];
  const progress = 1 - secondsLeft / totalForPhase;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <main
      aria-label="Pomodoro"
      className={`relative mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200/70 bg-linear-to-b px-4 pb-24 pt-16 sm:px-8 sm:pt-20 ${PHASE_BG[phase]}`}
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:text-zinc-300"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <IoHourglassOutline className="text-base" aria-hidden />
          <span className="font-baron uppercase tracking-[0.14em]">
            Pomodoro
          </span>
        </motion.div>

        <p
          className={`font-baron text-xs font-bold uppercase tracking-[0.2em] ${PHASE_ACCENT[phase]}`}
        >
          {PHASE_LABELS[phase]}
        </p>

        <div className="relative mt-6 flex items-center justify-center">
          <svg
            className="h-72 w-72 -rotate-90 sm:h-80 sm:w-80"
            viewBox="0 0 280 280"
            role="img"
            aria-label={`Timer progress: ${Math.round(progress * 100)} percent`}
          >
            <circle
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              className="stroke-zinc-200/90 dark:stroke-zinc-800"
              strokeWidth="10"
            />
            <circle
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              className={`${PHASE_RING[phase]} transition-[stroke-dashoffset] duration-1000 ease-linear`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p
              className={`font-quantify text-6xl font-semibold tabular-nums leading-none sm:text-7xl ${PHASE_ACCENT[phase]}`}
            >
              {formatPomodoroTime(secondsLeft)}
            </p>
            <p className="font-eudoxus text-sm text-zinc-500 dark:text-zinc-400">
              {formatDurationMinutes(totalForPhase)} session
            </p>
          </div>
        </div>

        {linkedTaskTitle ? (
          <p className="mt-5 max-w-sm truncate font-ppneue text-base font-medium text-zinc-700 dark:text-zinc-200">
            {linkedTaskTitle}
          </p>
        ) : (
          <p className="mt-5 font-eudoxus text-sm text-zinc-500 dark:text-zinc-400">
            Link a task from Home or Tasks to focus on it here.
          </p>
        )}

        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {completedFocusSessions} focus session
          {completedFocusSessions === 1 ? "" : "s"} completed today
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={isRunning ? pause : start}
            className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isRunning ? (
              <IoPause className="text-lg" aria-hidden />
            ) : (
              <IoPlay className="text-lg" aria-hidden />
            )}
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset timer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <IoRefresh aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={skipToNextPhase}
            aria-label="Skip to next phase"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <IoPlaySkipForward aria-hidden />
            Skip
          </button>
        </div>

        <ul className="mt-10 grid w-full max-w-md grid-cols-3 gap-2 text-left">
          {(
            [
              ["focus", "Focus"],
              ["shortBreak", "Break"],
              ["longBreak", "Long"],
            ] as const
          ).map(([id, label]) => {
            const isCurrent = phase === id;
            return (
              <li
                key={id}
                className={`rounded-xl border px-3 py-2.5 transition-colors ${
                  isCurrent
                    ? "border-zinc-300 bg-white/90 shadow-sm dark:border-zinc-600 dark:bg-zinc-900/90"
                    : "border-transparent bg-white/40 dark:bg-zinc-900/30"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                    isCurrent ? PHASE_ACCENT[id] : "text-zinc-400"
                  }`}
                >
                  {label}
                </p>
                <p className="mt-0.5 font-quantify text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                  {formatDurationMinutes(POMODORO_DURATIONS[id])}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
