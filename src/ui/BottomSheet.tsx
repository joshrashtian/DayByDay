import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";

export type SnapPoint = "peek" | "half" | "full";

export const SNAP_POINT_ORDER: readonly SnapPoint[] = ["peek", "half", "full"];

const SNAP_MAX_HEIGHT: Record<SnapPoint, string> = {
  peek: "min(58dvh, 480px)",
  half: "min(72dvh, 620px)",
  full: "min(92dvh, 800px)",
};

function normalizeSnapForEnabled(
  snap: SnapPoint,
  enabled: readonly SnapPoint[],
): SnapPoint {
  if (enabled.includes(snap)) return snap;
  return enabled[0] ?? "peek";
}

function getEnabledSnapPoints(snapPoints: readonly SnapPoint[]): SnapPoint[] {
  const filtered = SNAP_POINT_ORDER.filter((p) => snapPoints.includes(p));
  return filtered.length > 0 ? filtered : [...SNAP_POINT_ORDER];
}

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Which snap heights are available, in ascending order (subset of {@link SNAP_POINT_ORDER}). */
  snapPoints?: readonly SnapPoint[];
  defaultSnap?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  children?: ReactNode;
};

export default function BottomSheet({
  open,
  onClose,
  title,
  snapPoints = SNAP_POINT_ORDER,
  defaultSnap = "peek",
  onSnapChange,
  children,
}: BottomSheetProps) {
  const snapPointsKey = [...snapPoints].sort().join();
  const stableEnabled = useMemo(
    () => getEnabledSnapPoints(snapPoints),
    [snapPointsKey],
  );

  const [snap, setSnap] = useState<SnapPoint>(() =>
    normalizeSnapForEnabled(defaultSnap, getEnabledSnapPoints(snapPoints)),
  );
  const dragControls = useDragControls();

  useEffect(() => {
    if (open) {
      setSnap(normalizeSnapForEnabled(defaultSnap, stableEnabled));
    }
  }, [open, defaultSnap, stableEnabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function cycleSnap() {
    const i = stableEnabled.indexOf(snap);
    const idx = i < 0 ? 0 : i;
    const next = stableEnabled[(idx + 1) % stableEnabled.length] ?? snap;
    setSnap(next);
    onSnapChange?.(next);
  }

  function handleDragEnd(
    _: unknown,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    const { offset, velocity } = info;
    if (velocity.y > 500) {
      onClose();
      return;
    }

    const idx = stableEnabled.indexOf(snap);
    if (idx < 0) return;

    // Strong upward flick: jump to the next higher snap if any.
    if (velocity.y < -520 && idx < stableEnabled.length - 1) {
      const next = stableEnabled[idx + 1]!;
      setSnap(next);
      onSnapChange?.(next);
      return;
    }

    const down = offset.y;
    const up = -offset.y;

    // Drag down: lower snap, or dismiss from peek.
    if (down > 72) {
      if (idx === 0) {
        if (down > 110) onClose();
        return;
      }
      const next = stableEnabled[idx - 1]!;
      setSnap(next);
      onSnapChange?.(next);
      return;
    }

    // Drag up: higher snap.
    if (up > 56 && idx < stableEnabled.length - 1) {
      const next = stableEnabled[idx + 1]!;
      setSnap(next);
      onSnapChange?.(next);
    }
  }

  if (typeof document === "undefined") return null;

  const maxHeight = SNAP_MAX_HEIGHT[snap];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="bottom-sheet-root"
          className="fixed inset-0 z-65 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* backdrop */}
          <motion.button
            type="button"
            aria-label="Close sheet"
            className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            className="relative z-10 mx-auto w-full max-w-lg flex flex-col rounded-t-2xl border border-zinc-200/80 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)] dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
            style={{ maxHeight }}
            initial={{ y: "100%" }}
            animate={{
              y: 0,
              maxHeight,
            }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* drag handle */}
            <div
              className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
            >
              <span
                className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600"
                aria-hidden
              />
            </div>

            {/* header */}
            <div className="flex  items-center justify-between gap-3 border-b border-zinc-100 px-4 pb-3 pt-1 dark:border-zinc-800 flex-shrink-0">
              {title ? (
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-quantify -skew-x-3 font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {title}
                </h2>
              ) : (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Bottom sheet
                </span>
              )}

              <div className="flex items-center gap-1">
                {/* snap toggle */}
                <button
                  type="button"
                  onClick={cycleSnap}
                  aria-label={
                    stableEnabled.length < 2
                      ? "Snap height"
                      : snap === stableEnabled[stableEnabled.length - 1]
                        ? "Use shorter snap"
                        : "Use taller snap"
                  }
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  {snap === stableEnabled[stableEnabled.length - 1] ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 5l4.5 4.5L11.5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 9l4.5-4.5L11.5 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* done / close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Done
                </button>
              </div>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-sm text-zinc-700 dark:text-zinc-300">
              {children ?? (
                <p className="leading-relaxed">
                  Pass{" "}
                  <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                    children
                  </code>{" "}
                  for content. Drag the handle, tap the backdrop, or press
                  Escape to close.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
