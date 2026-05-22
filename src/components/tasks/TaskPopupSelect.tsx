import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { IoChevronDown } from "react-icons/io5";
import { fixedPositionBelowTrigger } from "../../lib/appZoom";
import { useSettingsStore } from "../../stores/settingsStore";
import { isReactComponent } from "@/utils/is-react-component";
import { isValidElement } from "react";
import { taskPopupField } from "./taskPopupFieldStyles";

export type TaskPopupSelectOption = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | ReactNode;
};

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: TaskPopupSelectOption[];
  placeholder?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export function TaskPopupSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: Props) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const zoomLevel = useSettingsStore((s) => s.zoomLevel);
  const selected = options.find((opt) => opt.id === value);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setMenuPos(fixedPositionBelowTrigger(trigger));
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
    const onLayout = () => updateMenuPosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, zoomLevel]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(listboxId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, listboxId]);

  const renderIcon = (icon: TaskPopupSelectOption["icon"]) => {
    if (!icon) return null;
    if (isReactComponent(icon)) {
      const Icon = icon;
      return <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />;
    }
    if (isValidElement(icon)) return icon;
    return null;
  };

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 200,
            }}
            className={`max-h-56 overflow-y-auto ${taskPopupField.selectMenu}`}
          >
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    {renderIcon(opt.icon)}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{opt.label}</span>
                      {opt.description ? (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {opt.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="relative flex flex-col gap-1.5">
      <span className={taskPopupField.label}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm ${taskPopupField.selectTrigger}`}
      >
        {renderIcon(selected?.icon)}
        <span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-100">
          {selected?.label ?? placeholder}
        </span>
        <IoChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
