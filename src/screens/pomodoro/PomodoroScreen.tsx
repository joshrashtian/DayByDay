import { AnimatePresence, motion } from "motion/react";
import { IoRefresh, IoPlaySkipForward, IoPause, IoPlay } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import {
  formatPomodoroTime,
  POMODORO_DURATIONS,
  usePomodoroStore,
} from "../../stores/pomodoroStore";
import {
  getPomodoroStyle,
  PHASE_LABELS,
  POMODORO_STYLE_LIST,
} from "./PomodoroStyles";

function TimerDigit({ value, animated }: { value: string; animated: boolean }) {
  if (value === ":" || !animated) {
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

function StylePicker() {
  const styleId = usePomodoroStore((s) => s.styleId);
  const setStyleId = usePomodoroStore((s) => s.setStyleId);
  const active = getPomodoroStyle(styleId);
  const others = POMODORO_STYLE_LIST.filter((s) => s.id !== active.id);

  return (
    <div className="group absolute top-12 left-12 flex flex-col font-mono text-xl">
      <span className="uppercase text-muted">{active.label}</span>
      <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {others.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => setStyleId(style.id)}
            className="rounded-lg border border-line bg-raised px-3 py-1.5 text-sm uppercase text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
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
  const styleId = usePomodoroStore((s) => s.styleId);
  const style = getPomodoroStyle(styleId);

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
      className={twMerge(style.container, style.phase.background[phase])}
    >
      <StylePicker />
      <motion.div
        className={twMerge(style.phaseLabel, style.phase.accent[phase])}
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
        className={style.timer}
        style={{ fontSize: "clamp(3rem, 12vw, 15rem)" }}
      >
        {digits.map((char, i) => (
          <TimerDigit key={i} value={char} animated={style.animatedDigits} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-full max-w-md">
        <div
          className={twMerge(style.progressTrack, style.phase.barBg[phase])}
        >
          <motion.div
            className={twMerge(style.progressFill, style.phase.bar[phase])}
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
          className={style.secondaryButton}
        >
          <IoRefresh className="text-lg" aria-hidden />
        </button>

        <button
          type="button"
          onClick={isRunning ? pause : start}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className={twMerge(style.primaryButton, style.phase.button[phase])}
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
          className={style.secondaryButton}
        >
          <IoPlaySkipForward className="text-lg" aria-hidden />
        </button>
      </div>
    </main>
  );
}
