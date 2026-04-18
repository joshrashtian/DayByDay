import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
};

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bottom-sheet"
          className="fixed inset-0 z-65 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            aria-label="Close sheet"
            className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
            className="relative z-10 mx-auto w-full max-w-lg rounded-t-2xl border border-zinc-200/80 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)] dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <span
                className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600"
                aria-hidden
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 pb-3 pt-1 dark:border-zinc-800">
              {title ? (
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {title}
                </h2>
              ) : (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Bottom sheet
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
            <div className="max-h-[min(55dvh,420px)] overflow-y-auto overscroll-contain px-4 py-4 text-sm text-zinc-700 dark:text-zinc-300">
              {children ?? (
                <p className="leading-relaxed">
                  Pass <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px] dark:bg-zinc-800">children</code>{" "}
                  for content. Tap the backdrop, Done, or Escape to close.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
