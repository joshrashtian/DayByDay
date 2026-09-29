import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBreadcrumbStore } from "@/stores/breadcrumbStore";
import { Breadcrumb } from "./Breadcrumb";

/** Pointer within this many px of the content's top edge reveals the bar. */
const REVEAL_PX = 36;
/** Once shown, the bar stays until the pointer drops below this (hysteresis). */
const HIDE_PX = 88;

type TopBreadcrumbBarProps = {
  /** Horizontal insets so the bar centers over the content, not the sidebar/right panel. */
  left: number;
  right: number;
};

/**
 * Hover-to-reveal breadcrumb pill at the top of the content area. Pages opt in
 * with `useBreadcrumbs`; a single-item trail is just the page title, so the bar
 * only appears when there is somewhere to go back to.
 */
export function TopBreadcrumbBar({ left, right }: TopBreadcrumbBarProps) {
  const items = useBreadcrumbStore((s) => s.items);
  const hasTrail = items.length > 1;
  const areaRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!hasTrail) {
      setRevealed(false);
      return;
    }
    const onMove = (event: MouseEvent) => {
      const area = areaRef.current?.getBoundingClientRect();
      if (!area) return;
      const inColumn = event.clientX >= area.left && event.clientX <= area.right;
      const offsetY = event.clientY - area.top;
      setRevealed((shown) =>
        inColumn && offsetY < (shown ? HIDE_PX : REVEAL_PX),
      );
    };
    const onLeave = () => setRevealed(false);
    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [hasTrail]);

  return (
    <div
      ref={areaRef}
      className="pointer-events-none absolute top-0 z-40 flex justify-center"
      style={{ left, right }}
    >
      <AnimatePresence>
        {hasTrail && revealed ? (
          <motion.div
            key="top-breadcrumb"
            data-tauri-drag-region="false"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="pointer-events-auto mt-1.5 rounded-full border border-line/70 bg-surface/80 px-4 py-1.5 shadow-sm backdrop-blur-xl"
          >
            <Breadcrumb items={items} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
