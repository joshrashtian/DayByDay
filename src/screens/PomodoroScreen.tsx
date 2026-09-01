import { AnimatePresence, motion } from "motion/react";
import { IoRefresh, IoPlaySkipForward, IoPause, IoPlay } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";
import {
  formatPomodoroTime,
  POMODORO_DURATIONS,
  usePomodoroStore,
  type PomodoroPhase,
} from "../stores/pomodoroStore";

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

const PHASE_ACCENT: Record<PomodoroPhase, string> = {
  focus: "text-rose-500",
  shortBreak: "text-emerald-500",
  longBreak: "text-sky-500",
};

const PHASE_BAR: Record<PomodoroPhase, string> = {
  focus: "bg-rose-400",
  shortBreak: "bg-emerald-400",
  longBreak: "bg-sky-400",
};

const PHASE_BAR_BG: Record<PomodoroPhase, string> = {
  focus: "bg-rose-200/60",
  shortBreak: "bg-emerald-200/60",
  longBreak: "bg-sky-200/60",
};

const PHASE_BTN: Record<PomodoroPhase, string> = {
  focus: "bg-rose-400 hover:bg-rose-500",
  shortBreak: "bg-emerald-400 hover:bg-emerald-500",
  longBreak: "bg-sky-400 hover:bg-sky-500",
};

const PHASE_BG: Record<PomodoroPhase, string> = {
  focus: "from-rose-100/80 via-rose-50/40 to-white/80",
  shortBreak: "from-emerald-100/80 via-emerald-50/40 to-white/80",
  longBreak: "from-sky-100/80 via-sky-50/40 to-white/80",
};

function TimerDigit({ value }: { value: string }) {
  if (value === ":") {
    return (
      <span className="inline-block overflow-visible leading-none select-none">
        {value}
      </span>
    );
  }
  return (
    <span
      className="relative inline-block overflow-visible leading-none"
      style={{ height: "1.05em" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="inline-block leading-none"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            duration: 0.18,
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function PomodoroScreen() {
  const phase = usePomodoroStore((s) => s.phase);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const completedFocusSessions = usePomodoroStore(
    (s) => s.completedFocusSessions,
  );
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const linkedTaskTitle = usePomodoroStore((s) => s.linkedTaskTitle);
  const skipToNextPhase = usePomodoroStore((s) => s.skipToNextPhase);

  const totalForPhase = POMODORO_DURATIONS[phase];
  const progress = 1 - secondsLeft / totalForPhase;

  const elapsedSeconds = totalForPhase - secondsLeft;
  const minIn = Math.floor(elapsedSeconds / 60);
  const minLeft = Math.ceil(secondsLeft / 60);

  const roundNumber =
    phase === "focus" ? completedFocusSessions + 1 : completedFocusSessions;

  const digits = formatPomodoroTime(secondsLeft).split("");

  return (
    <main
      className={`relative flex min-h-[calc(100dvh-7rem)] w-full flex-col items-center justify-center rounded-3xl bg-linear-to-b ${PHASE_BG[phase]}`}
    >
      {/* Header */}
      <motion.div
        className={`mb-10 flex items-center gap-2 text-xs font-bold uppercase ${PHASE_ACCENT[phase]}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        key={phase}
      >
        <TbTargetArrow className="text-base" aria-hidden />
        <span>
          {PHASE_LABELS[phase]}
          {phase === "focus" && (
            <span className="text-faint"> · Round {roundNumber}</span>
          )}
        </span>
      </motion.div>

      {/* Timer display */}
      <div
        className="flex items-baseline justify-center font-display tabular-nums font-black leading-none tracking-tight text-ink"
        style={{ fontSize: "clamp(3rem, 12vw, 15rem)" }}
      >
        {digits.map((char, i) => (
          <TimerDigit key={i} value={char} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-full max-w-md">
        <div
          className={`relative h-2.5 w-full overflow-hidden rounded-full ${PHASE_BAR_BG[phase]}`}
        >
          <motion.div
            className={`absolute inset-y-0 border-2 left-0 rounded-full ${PHASE_BAR[phase]}`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "linear" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-faint">
          <span>{minIn} min in</span>
          <span>{minLeft} min left</span>
        </div>
      </div>

      {/* Linked task */}
      <div className="mt-6 flex min-h-[1.5rem] items-center justify-center px-8">
        {linkedTaskTitle ? (
          <p className="max-w-xs truncate text-center text-sm font-medium text-muted">
            {linkedTaskTitle}
          </p>
        ) : (
          <p className="text-xs text-faint">No task linked</p>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={reset}
          aria-label="Reset timer"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line/80 bg-surface/80 text-muted shadow-sm transition-all hover:bg-surface hover:text-muted"
        >
          <IoRefresh className="text-lg" aria-hidden />
        </button>

        <button
          type="button"
          onClick={isRunning ? pause : start}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${PHASE_BTN[phase]}`}
        >
          {isRunning ? (
            <IoPause className="text-2xl" aria-hidden />
          ) : (
            <IoPlay className="ml-0.5 text-2xl" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={skipToNextPhase}
          aria-label="Skip to next phase"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line/80 bg-surface/80 text-muted shadow-sm transition-all hover:bg-surface hover:text-muted"
        >
          <IoPlaySkipForward className="text-lg" aria-hidden />
        </button>
      </div>
    </main>
  );
}
