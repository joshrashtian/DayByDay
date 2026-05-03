import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem =
  | {
      id: string;
      label: string;
      onSelect: () => void;
      disabled?: boolean;
      icon?: React.ReactNode;
      destructive?: boolean;
      type?: "item";
    }
  | {
      id: string;
      type: "break";
    }
  | {
      id: string;
      type: "header";
      header: string;
    };

type MenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
};

type ContextMenuApi = {
  openMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
};

const ContextMenuContext = createContext<ContextMenuApi | null>(null);

export function useContextMenu(): ContextMenuApi {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  }
  return ctx;
}

export function useContextMenuOptional(): ContextMenuApi | null {
  return useContext(ContextMenuContext);
}

export default function ContextMenuProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [placed, setPlaced] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback(
    (event: React.MouseEvent, items: ContextMenuItem[]) => {
      event.preventDefault();
      event.stopPropagation();
      if (items.length === 0) return;
      setMenu({
        x: event.clientX,
        y: event.clientY,
        items,
      });
      setPlaced({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const api = useMemo(
    () => ({
      openMenu,
      closeMenu,
    }),
    [openMenu, closeMenu],
  );

  useLayoutEffect(() => {
    if (!menu) return;
    const el = menuPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let x = menu.x;
    let y = menu.y;
    if (x + rect.width > window.innerWidth - pad) {
      x = window.innerWidth - rect.width - pad;
    }
    if (y + rect.height > window.innerHeight - pad) {
      y = window.innerHeight - rect.height - pad;
    }
    if (x < pad) x = pad;
    if (y < pad) y = pad;
    setPlaced({ x, y });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const onScroll = () => closeMenu();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menu, closeMenu]);

  const portal =
    menu &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-50"
          aria-hidden
          onMouseDown={closeMenu}
          style={{ background: "transparent" }}
        />
        <div
          ref={menuPanelRef}
          role="menu"
          aria-label="Context menu"
          className="fixed z-60 min-w-44 overflow-hidden rounded-xl border border-white/70 bg-white/90 py-1 shadow-[0_12px_40px_rgba(15,15,15,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/5 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/95 dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] dark:ring-white/10"
          style={{ left: placed.x, top: placed.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {menu.items.map((item) => {
            if (item.type === "break") {
              return (
                <div
                  key={item.id}
                  className="h-px w-3/5 mx-auto bg-zinc-200 my-2"
                />
              );
            }
            if (item.type === "header") {
              return (
                <div
                  key={item.id}
                  className="px-3 py-2 text-left text-sm font-medium"
                >
                  {item.header}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.type === "item" ? item.disabled : false}
                className={`flex w-full items-center flex-row gap-2 px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  item.destructive
                    ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/15"
                    : "text-zinc-800 hover:bg-zinc-500/10 dark:text-zinc-100 dark:hover:bg-white/10"
                }`}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect();
                  closeMenu();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </>,
      document.body,
    );

  return (
    <ContextMenuContext.Provider value={api}>
      {children}
      {portal}
    </ContextMenuContext.Provider>
  );
}
