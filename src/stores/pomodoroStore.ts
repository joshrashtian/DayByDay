import { create } from "zustand";
import { persist } from "zustand/middleware";
import { migrateLocalStorageKey } from "@/lib/storageMigration";

const POMODORO_STORAGE_KEY = "risebyday-pomodoro";
migrateLocalStorageKey("daybyday-pomodoro", POMODORO_STORAGE_KEY);

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

export const POMODORO_DURATIONS: Record<PomodoroPhase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const LONG_BREAK_EVERY = 4;

function getDayKey(date = new Date()): string {
  return date.toDateString();
}

type PomodoroState = {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedFocusSessions: number;
  /** Calendar day (toDateString) the session count last belonged to */
  lastActiveDay: string;
  linkedTaskTitle?: string;
  /** Home focus-zone overlay */
  panelOpen: boolean;
  /** Floating dock expanded */
  dockExpanded: boolean;

  start: () => void;
  pause: () => void;
  reset: () => void;
  skipToNextPhase: () => void;
  tick: () => void;
  checkDayReset: () => void;
  setLinkedTaskTitle: (title?: string) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanelOpen: () => void;
  setDockExpanded: (expanded: boolean) => void;
  toggleDockExpanded: () => void;
};

function nextPhaseAfterFocus(
  completedFocusSessions: number,
): PomodoroPhase {
  const nextCount = completedFocusSessions + 1;
  return nextCount > 0 && nextCount % LONG_BREAK_EVERY === 0
    ? "longBreak"
    : "shortBreak";
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      phase: "focus",
      secondsLeft: POMODORO_DURATIONS.focus,
      isRunning: false,
      completedFocusSessions: 0,
      lastActiveDay: getDayKey(),
      linkedTaskTitle: undefined,
      panelOpen: false,
      dockExpanded: false,

      checkDayReset: () => {
        const { lastActiveDay } = get();
        const today = getDayKey();
        if (lastActiveDay === today) return;
        set({ completedFocusSessions: 0, lastActiveDay: today });
      },

      start: () => {
        get().checkDayReset();
        set({ isRunning: true });
      },
      pause: () => set({ isRunning: false }),

      reset: () => {
        const { phase } = get();
        set({
          isRunning: false,
          secondsLeft: POMODORO_DURATIONS[phase],
        });
      },

      skipToNextPhase: () => {
        const { phase, completedFocusSessions } = get();
        if (phase === "focus") {
          const nextCount = completedFocusSessions + 1;
          const nextPhase = nextPhaseAfterFocus(completedFocusSessions);
          set({
            isRunning: false,
            completedFocusSessions: nextCount,
            phase: nextPhase,
            secondsLeft: POMODORO_DURATIONS[nextPhase],
          });
          return;
        }
        set({
          isRunning: false,
          phase: "focus",
          secondsLeft: POMODORO_DURATIONS.focus,
        });
      },

      tick: () => {
        get().checkDayReset();
        const { isRunning, secondsLeft, phase, completedFocusSessions } = get();
        if (!isRunning) return;

        if (secondsLeft > 1) {
          set({ secondsLeft: secondsLeft - 1 });
          return;
        }

        if (phase === "focus") {
          const nextCount = completedFocusSessions + 1;
          const nextPhase = nextPhaseAfterFocus(completedFocusSessions);
          set({
            isRunning: false,
            completedFocusSessions: nextCount,
            phase: nextPhase,
            secondsLeft: POMODORO_DURATIONS[nextPhase],
          });
          return;
        }

        set({
          isRunning: false,
          phase: "focus",
          secondsLeft: POMODORO_DURATIONS.focus,
        });
      },

      setLinkedTaskTitle: (title) => set({ linkedTaskTitle: title }),
      setPanelOpen: (open) => set({ panelOpen: open }),
      togglePanelOpen: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setDockExpanded: (expanded) => set({ dockExpanded: expanded }),
      toggleDockExpanded: () =>
        set((s) => ({ dockExpanded: !s.dockExpanded })),
    }),
    {
      name: POMODORO_STORAGE_KEY,
      partialize: (state) => ({
        phase: state.phase,
        secondsLeft: state.secondsLeft,
        isRunning: state.isRunning,
        completedFocusSessions: state.completedFocusSessions,
        lastActiveDay: state.lastActiveDay,
        linkedTaskTitle: state.linkedTaskTitle,
      }),
    },
  ),
);

export function formatPomodoroTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
