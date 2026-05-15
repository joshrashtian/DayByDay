import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceString,
} from "@rive-app/react-canvas";

export type DayFocusMode = "current-block" | "all-day";
type TransitionLabels = { from: string; to: string };

type DayTransitionContextType = {
  focusMode: DayFocusMode;
  setFocusMode: (mode: DayFocusMode) => void;
  switchFocusMode: (
    mode: DayFocusMode,
    labels?: Partial<TransitionLabels>,
  ) => void;
  isTransitionAnimationEnabled: boolean;
  setTransitionAnimationEnabled: (enabled: boolean) => void;
};

const DAY_TRANSITION_PREFS_KEY = "daybyday.home.day-transition.v1";
const LOOP_DAY_TRANSITION_PREVIEW = false;
// Keep this comfortably longer than the Rive timeline length so
// the overlay does not disappear before the animation finishes.
const RIVE_TRANSITION_DURATION_MS = 4200;
const DAY_STATE_CHANGE_RIVE_SRC = new URL(
  "../assets/animations/DayStateChange.riv",
  import.meta.url,
).href;
const DAY_STATE_CHANGE_LAYOUT = new Layout({
  fit: Fit.Cover,
  alignment: Alignment.Center,
});
const BEFORE_TEXT_RUN_CANDIDATES = ["beforeLabel", "before.abel", "BeforeText"];
const AFTER_TEXT_RUN_CANDIDATES = ["afterLabel", "after.abel", "AfterText"];

function loadTransitionAnimationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(DAY_TRANSITION_PREFS_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const DayTransitionContext = createContext<
  DayTransitionContextType | undefined
>(undefined);

function LabelAnimation({
  beforeText,
  afterText,
}: {
  beforeText: string;
  afterText: string;
}) {
  const { rive, RiveComponent } = useRive({
    src: DAY_STATE_CHANGE_RIVE_SRC,
    stateMachines: "State Machine 1",
    autoplay: true,
    layout: DAY_STATE_CHANGE_LAYOUT,
  }, {
    shouldResizeCanvasToContainer: true,
  });
  const viewModel = useViewModel(rive, { useDefault: true });
  const defaultViewModelInstance = useViewModelInstance(viewModel, {
    useDefault: true,
    rive,
  });
  const viewModelInstance = defaultViewModelInstance;
  const beforeLabelField = useViewModelInstanceString(
    "beforeLabel",
    viewModelInstance,
  );
  const afterLabelField = useViewModelInstanceString(
    "afterLabel",
    viewModelInstance,
  );

  useEffect(() => {
    if (!rive) return;

    if (viewModelInstance) {
      beforeLabelField.setValue(beforeText);
      afterLabelField.setValue(afterText);
    }

    // Try known run names from Rive editor and keep compatibility
    // with older naming variants.
    for (const runName of BEFORE_TEXT_RUN_CANDIDATES) {
      try {
        rive.setTextRunValue(runName, beforeText);
      } catch {
        // Ignore missing run names.
      }
    }
    for (const runName of AFTER_TEXT_RUN_CANDIDATES) {
      try {
        rive.setTextRunValue(runName, afterText);
      } catch {
        // Ignore missing run names.
      }
    }
  }, [
    rive,
    beforeText,
    afterText,
    viewModelInstance,
    beforeLabelField,
    afterLabelField,
  ]);

  return <RiveComponent className="h-full w-full" />;
}

export const DayTransitionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [focusMode, setFocusMode] = useState<DayFocusMode>("current-block");
  const [isTransitionAnimationEnabled, setTransitionAnimationEnabled] =
    useState<boolean>(() => loadTransitionAnimationEnabled());
  const [activeTransition, setActiveTransition] =
    useState<TransitionLabels | null>(() =>
      LOOP_DAY_TRANSITION_PREVIEW
        ? { from: "Current Block", to: "All Day" }
        : null,
    );
  const clearTransitionTimerRef = useRef<number | null>(null);

  const modeLabel = (mode: DayFocusMode) =>
    mode === "all-day" ? "All Day" : "Current Block";

  useEffect(() => {
    window.localStorage.setItem(
      DAY_TRANSITION_PREFS_KEY,
      String(isTransitionAnimationEnabled),
    );
  }, [isTransitionAnimationEnabled]);

  useEffect(() => {
    return () => {
      if (clearTransitionTimerRef.current) {
        window.clearTimeout(clearTransitionTimerRef.current);
      }
    };
  }, []);

  const switchFocusMode = (
    nextMode: DayFocusMode,
    labels?: Partial<TransitionLabels>,
  ) => {
    if (nextMode === focusMode) return;

    if (isTransitionAnimationEnabled) {
      if (clearTransitionTimerRef.current) {
        window.clearTimeout(clearTransitionTimerRef.current);
      }
      setActiveTransition({
        from: labels?.from?.trim() || modeLabel(focusMode),
        to: labels?.to?.trim() || modeLabel(nextMode),
      });
      if (!LOOP_DAY_TRANSITION_PREVIEW) {
        clearTransitionTimerRef.current = window.setTimeout(() => {
          setActiveTransition(null);
          clearTransitionTimerRef.current = null;
        }, RIVE_TRANSITION_DURATION_MS);
      }
    } else {
      setActiveTransition(null);
    }

    setFocusMode(nextMode);
  };

  const value = useMemo(
    () => ({
      focusMode,
      setFocusMode,
      switchFocusMode,
      isTransitionAnimationEnabled,
      setTransitionAnimationEnabled,
    }),
    [focusMode, isTransitionAnimationEnabled],
  );

  return (
    <DayTransitionContext.Provider value={value}>
      {isTransitionAnimationEnabled && activeTransition ? (
        <div
          key={`${activeTransition.from}-${activeTransition.to}`}
          className="pointer-events-none fixed inset-0 z-9999 "
        >
          <LabelAnimation
            beforeText={activeTransition.from}
            afterText={activeTransition.to}
          />
        </div>
      ) : null}
      {children}
    </DayTransitionContext.Provider>
  );
};

export function useDayTransition() {
  const context = useContext(DayTransitionContext);
  if (!context) {
    throw new Error(
      "useDayTransition must be used within DayTransitionProvider",
    );
  }
  return context;
}
