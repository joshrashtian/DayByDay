import type { PomodoroPhase } from "../../stores/pomodoroStore";

export type PomodoroStyleId = "animated" | "minimal";

export const DEFAULT_POMODORO_STYLE: PomodoroStyleId = "animated";

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

type PhaseClasses = Record<PomodoroPhase, string>;

export type PomodoroStyle = {
  id: PomodoroStyleId;
  label: string;
  /** if digits will roll */
  animatedDigits: boolean;
  /** Screen container; phase-specific classes are appended */
  container: string;
  /** Phase label row above the timer */
  phaseLabel: string;
  timer: string;
  progressTrack: string;
  progressFill: string;
  /** Reset / skip buttons */
  secondaryButton: string;
  /** Play / pause button; phase-specific classes are appended */
  primaryButton: string;
  phase: {
    accent: PhaseClasses;
    bar: PhaseClasses;
    barBg: PhaseClasses;
    button: PhaseClasses;
    background: PhaseClasses;
  };
};

const animated: PomodoroStyle = {
  id: "animated",
  label: "Animated",
  animatedDigits: true,
  container:
    "relative flex min-h-[calc(100dvh-7rem)] w-full flex-col items-center justify-center rounded-3xl bg-surface bg-linear-to-b",
  phaseLabel: "mb-10 flex items-center gap-2 text-xs font-bold uppercase",
  timer:
    "flex items-baseline justify-center font-display tabular-nums font-black leading-none tracking-tight text-ink",
  progressTrack: "relative h-2.5 w-full overflow-hidden rounded-full",
  progressFill: "absolute inset-y-0 left-0 rounded-full",
  secondaryButton:
    "flex h-12 w-12 items-center justify-center rounded-full border border-line/80 bg-surface/80 text-muted shadow-sm transition-all hover:bg-surface hover:text-muted",
  primaryButton:
    "flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95",
  phase: {
    accent: {
      focus: "text-red-500",
      shortBreak: "text-emerald-500",
      longBreak: "text-sky-500",
    },
    bar: {
      focus: "bg-red-400",
      shortBreak: "bg-emerald-400",
      longBreak: "bg-sky-400",
    },
    barBg: {
      focus: "bg-red-200/60",
      shortBreak: "bg-emerald-200/60",
      longBreak: "bg-sky-200/60",
    },
    button: {
      focus: "bg-rose-400 hover:bg-rose-500",
      shortBreak: "bg-emerald-400 hover:bg-emerald-500",
      longBreak: "bg-sky-400 hover:bg-sky-500",
    },
    background: {
      focus: "from-danger-soft via-danger-soft/50 to-transparent",
      shortBreak: "from-success-soft via-success-soft/50 to-transparent",
      longBreak: "from-accent-soft via-accent-soft/50 to-transparent",
    },
  },
};

const minimal: PomodoroStyle = {
  id: "minimal",
  label: "Minimal",
  animatedDigits: true,
  container:
    "relative flex min-h-[calc(100dvh-7rem)] w-full flex-col items-center justify-center rounded-3xl bg-surface",
  phaseLabel:
    "mb-8 flex items-center gap-2 text-xs font-black uppercase",
  timer:
    "flex items-baseline justify-center font-eudoxus font-black text-ink",
  progressTrack: "relative h-px w-full overflow-hidden",
  progressFill: "absolute inset-y-0 left-0",
  secondaryButton:
    "flex h-10 w-10 items-center justify-center rounded-full text-faint transition-colors hover:text-ink",
  primaryButton:
    "flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
  phase: {
    accent: {
      focus: "text-muted",
      shortBreak: "text-muted",
      longBreak: "text-muted",
    },
    bar: {
      focus: "bg-ink",
      shortBreak: "bg-ink",
      longBreak: "bg-ink",
    },
    barBg: {
      focus: "bg-line",
      shortBreak: "bg-line",
      longBreak: "bg-line",
    },
    button: {
      focus: "border-ink text-ink hover:bg-ink hover:text-surface",
      shortBreak: "border-ink text-ink hover:bg-ink hover:text-surface",
      longBreak: "border-ink text-ink hover:bg-ink hover:text-surface",
    },
    background: { focus: "", shortBreak: "", longBreak: "" },
  },
};

export const POMODORO_STYLES: Record<PomodoroStyleId, PomodoroStyle> = {
  animated,
  minimal,
};

export const POMODORO_STYLE_LIST: PomodoroStyle[] = [animated, minimal];

export function getPomodoroStyle(id: PomodoroStyleId | undefined): PomodoroStyle {
  return (id && POMODORO_STYLES[id]) || POMODORO_STYLES[DEFAULT_POMODORO_STYLE];
}
