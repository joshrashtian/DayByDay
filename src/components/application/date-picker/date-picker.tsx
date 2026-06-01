import { getLocalTimeZone, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type {
  DatePickerProps as AriaDatePickerProps,
  DateValue,
} from "react-aria-components";
import {
  Button as AriaButton,
  DatePicker as AriaDatePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
} from "react-aria-components";
import { cx } from "@/utils/cx";
import { Calendar } from "./calendar";

const highlightedDates = [today(getLocalTimeZone())];

interface DatePickerProps extends AriaDatePickerProps<DateValue> {
  /** The function to call when the apply button is clicked. */
  onApply?: () => void;
  /** The function to call when the cancel button is clicked. */
  onCancel?: () => void;
  size?: "sm" | "md";
}

export const DatePicker = ({
  value: valueProp,
  defaultValue,
  onChange,
  onApply,
  onCancel,
  size = "sm",
  ...props
}: DatePickerProps) => {
  const [value, setValue] = useControlledState(
    valueProp,
    defaultValue || null,
    onChange,
  );

  return (
    <AriaDatePicker
      aria-label="Date picker"
      shouldCloseOnSelect={true}
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        onApply?.();
      }}
    >
      <AriaGroup>
        <AriaButton
          className={cx(
            "inline-flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/60 px-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-800 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
            size === "md" ? "h-10 px-3" : "h-8",
          )}
        >
          <CalendarIcon className="size-3.5" />
        </AriaButton>
      </AriaGroup>
      <AriaPopover
        offset={8}
        placement="bottom right"
        className={({ isEntering, isExiting }) =>
          cx(
            "origin-(--trigger-anchor-point) will-change-transform",
            isEntering &&
              "duration-200 ease-out animate-in fade-in zoom-in-95 placement-bottom:slide-in-from-top-1",
            isExiting &&
              "duration-150 ease-in animate-out fade-out zoom-out-95 placement-bottom:slide-out-to-top-1",
          )
        }
      >
        <AriaDialog
          aria-label="Date picker"
          className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95"
        >
          <div className="p-3">
            <Calendar highlightedDates={highlightedDates} />
          </div>
        </AriaDialog>
      </AriaPopover>
    </AriaDatePicker>
  );
};
