import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export type PopupApi = {
  open: (content: ReactNode) => void;
  close: () => void;
  isOpen: boolean;
};

const PopupContext = createContext<PopupApi | null>(null);

/** Dialog element ref for anchoring overlays (select menus, etc.) inside popups. */
export const PopupDialogRefContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function usePopupDialogRef(): RefObject<HTMLDivElement | null> | null {
  return useContext(PopupDialogRefContext);
}

export function usePopup(): PopupApi {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return ctx;
}

export function usePopupOptional(): PopupApi | null {
  return useContext(PopupContext);
}

export default function PopupProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setContent(null), []);
  const open = useCallback((node: ReactNode) => setContent(node), []);

  const api = useMemo(
    () => ({
      open,
      close,
      isOpen: content !== null,
    }),
    [open, close, content],
  );

  useEffect(() => {
    if (!content) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, close]);

  useEffect(() => {
    if (!content) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [content]);

  const portal =
    typeof document !== "undefined" &&
    createPortal(
      <AnimatePresence>
        {content ? (
          <motion.div
            key="popup-root"
            role="presentation"
            className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <PopupDialogRefContext.Provider value={dialogRef}>
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                data-popup-dialog
                className="relative z-10 flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line/70 bg-surface/95 shadow-[0_-8px_48px_rgba(15,15,15,0.18)] ring-1 ring-line/5 backdrop-blur-xl dark:bg-overlay dark:shadow-[0_-12px_56px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:shadow-[0_24px_64px_rgba(15,15,15,0.2)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
                  {content}
                </div>
              </motion.div>
            </PopupDialogRefContext.Provider>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <PopupContext.Provider value={api}>
      {children}
      {portal}
    </PopupContext.Provider>
  );
}
