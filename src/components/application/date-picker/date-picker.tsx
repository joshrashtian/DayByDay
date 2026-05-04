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
  const formatter = useDateFormatter({
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const [value, setValue] = useControlledState(
    valueProp,
    defaultValue || null,
    onChange,
  );

  const formattedDate = value
    ? formatter.format(value.toDate(getLocalTimeZone()))
    : "Select date";

  return (
    <AriaDatePicker
      aria-label="Date picker"
      shouldCloseOnSelect={false}
      {...props}
      value={value}
      onChange={setValue}
    >
      <AriaGroup>
        <AriaButton
          className={cx(
            "inline-flex items-center gap-2 rounded-xl border border-zinc-300/80 bg-white/70 px-3 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:bg-zinc-900",
            size === "md" ? "h-10 px-3.5" : "h-9",
          )}
        >
          <CalendarIcon className="size-4 text-zinc-500 dark:text-zinc-400" />
        </AriaButton>
      </AriaGroup>
      <AriaPopover
        offset={8}
        placement="bottom right"
        className={({ isEntering, isExiting }) =>
          cx(
            "origin-(--trigger-anchor-point) will-change-transform",
            isEntering &&
              "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
            isExiting &&
              "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
          )
        }
      >
        <AriaDialog
          aria-label="Date picker"
          className="rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.18)] ring-1 ring-white/40 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/90 dark:ring-white/10"
        >
          {({ close }) => (
            <>
              <div className="flex px-4 py-4">
                <Calendar highlightedDates={highlightedDates} />
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-zinc-200/70 p-4 dark:border-zinc-700/70">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300/80 bg-white/80 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  onClick={() => {
                    onCancel?.();
                    close();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                  onClick={() => {
                    onApply?.();
                    close();
                  }}
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDatePicker>
  );
};
