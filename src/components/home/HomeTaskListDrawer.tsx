import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { IoChevronUp } from "react-icons/io5";

type DrawerSnap = "collapsed" | "expanded";

const COLLAPSED_HEIGHT = 44;
const DEFAULT_EXPANDED_HEIGHT = 240;
const OPEN_THRESHOLD = 72;
const COLLAPSE_THRESHOLD = 64;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDefaultMaxHeight() {
  if (typeof window === "undefined") return 480;
  return Math.min(Math.floor(window.innerHeight * 0.72), 520);
}

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultSnap?: DrawerSnap;
  fullWidth?: boolean;
  maxHeightPx?: number;
};

export function HomeTaskListDrawer({
  title,
  subtitle,
  children,
  defaultSnap = "collapsed",
  fullWidth = false,
  maxHeightPx,
}: Props) {
  const [heightPx, setHeightPx] = useState(
    defaultSnap === "expanded" ? DEFAULT_EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
  );
  const [maxHeight, setMaxHeight] = useState(
    () => maxHeightPx ?? getDefaultMaxHeight(),
  );
  const lastExpandedHeight = useRef(DEFAULT_EXPANDED_HEIGHT);
  const dragStartHeight = useRef(heightPx);
  const dragStartY = useRef(0);

  useEffect(() => {
    setHeightPx(
      defaultSnap === "expanded" ? DEFAULT_EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
    );
  }, [defaultSnap]);

  useEffect(() => {
    if (maxHeightPx !== undefined) {
      setMaxHeight(maxHeightPx);
      return;
    }
    const updateMax = () => setMaxHeight(getDefaultMaxHeight());
    updateMax();
    window.addEventListener("resize", updateMax);
    return () => window.removeEventListener("resize", updateMax);
  }, [maxHeightPx]);

  useEffect(() => {
    setHeightPx((current) => clamp(current, COLLAPSED_HEIGHT, maxHeight));
  }, [maxHeight]);

  const isOpen = heightPx > OPEN_THRESHOLD;

  const toggleSnap = () => {
    if (isOpen) {
      lastExpandedHeight.current = heightPx;
      setHeightPx(COLLAPSED_HEIGHT);
    } else {
      setHeightPx(
        clamp(lastExpandedHeight.current, OPEN_THRESHOLD, maxHeight),
      );
    }
  };

  const finishResize = useCallback(
    (nextHeight: number, velocityY = 0) => {
      let next = clamp(nextHeight, COLLAPSED_HEIGHT, maxHeight);

      if (next < COLLAPSE_THRESHOLD || velocityY > 420) {
        next = COLLAPSED_HEIGHT;
      } else if (next < OPEN_THRESHOLD && velocityY < -280) {
        next = OPEN_THRESHOLD;
      }

      if (next > COLLAPSED_HEIGHT) {
        lastExpandedHeight.current = next;
      }

      setHeightPx(next);
    },
    [maxHeight],
  );

  const handleTopPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragStartHeight.current = heightPx;
    dragStartY.current = event.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - dragStartY.current;
      setHeightPx(
        clamp(dragStartHeight.current - deltaY, COLLAPSED_HEIGHT, maxHeight),
      );
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      const deltaY = upEvent.clientY - dragStartY.current;
      const velocityY =
        "vy" in upEvent && typeof upEvent.vy === "number" ? upEvent.vy : 0;
      finishResize(dragStartHeight.current - deltaY, velocityY);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  return (
    <motion.div
      className={`${fullWidth ? "w-full" : "w-[min(100%,17.5rem)]"} relative shrink-0 self-start overflow-hidden rounded-t-2xl bg-surface/30 ring-1 ring-line/80 backdrop-blur-3xl dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)]`}
      style={{ height: heightPx, maxHeight }}
      transition={{ height: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize tasks panel"
        onPointerDown={handleTopPointerDown}
        className="absolute inset-x-0 top-0 z-10 flex h-5 cursor-ns-resize touch-none items-center justify-center"
      >
        <span
          className="h-1 w-10 rounded-full bg-zinc-300/90"
          aria-hidden
        />
      </div>

      <div className="flex h-full min-h-0 flex-col pt-4">
        <button
          type="button"
          onClick={toggleSnap}
          className="flex w-full shrink-0 items-center gap-2 border-b border-line px-3 py-2"
          aria-expanded={isOpen}
        >
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate font-display text-md font-bold text-muted">
              {title}
            </span>
            {subtitle ? (
              <span className="block truncate font-eudoxus text-[10px] text-faint">
                {subtitle}
              </span>
            ) : null}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-faint"
          >
            <IoChevronUp className="text-base" aria-hidden />
          </motion.span>
        </button>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 no-scrollbar transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          <div className="space-y-1.5">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}
