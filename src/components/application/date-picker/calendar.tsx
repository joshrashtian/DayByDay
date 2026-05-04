import type { PropsWithChildren, ReactNode } from "react";
import { Fragment, useState } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import type { CalendarProps as AriaCalendarProps, DateValue } from "react-aria-components";
import {
    Button as AriaButton,
    Calendar as AriaCalendar,
    CalendarContext as AriaCalendarContext,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    Heading as AriaHeading,
    useSlottedContext,
} from "react-aria-components";
import { cx } from "@/utils/cx";
import { CalendarCell } from "./cell";

export const CalendarContextProvider = ({ children }: PropsWithChildren) => {
    const [value, onChange] = useState<DateValue | null>(null);
    const [focusedValue, onFocusChange] = useState<DateValue | undefined>();

    return <AriaCalendarContext.Provider value={{ value, onChange, focusedValue, onFocusChange }}>{children}</AriaCalendarContext.Provider>;
};

interface CalendarProps extends AriaCalendarProps<DateValue> {
    /** The dates to highlight. */
    highlightedDates?: DateValue[];
    /**
     * The content to render between the header and the calendar grid.
     * If not provided, a default layout will be rendered with a date input and a today button.
     */
    children?: ReactNode;
}

export const Calendar = ({ highlightedDates, className, children, ...props }: CalendarProps) => {
    const context = useSlottedContext(AriaCalendarContext);

    const ContextWrapper = context ? Fragment : CalendarContextProvider;

    return (
        <ContextWrapper>
            <AriaCalendar
                {...props}
                className={(state) =>
                    cx(
                        "flex flex-col gap-3 rounded-xl border border-zinc-200/70 bg-white/70 p-3 dark:border-zinc-700/70 dark:bg-zinc-900/60",
                        typeof className === "function" ? className(state) : className,
                    )
                }
            >
                {({ state }) => (
                    <>
                        <header className="flex items-center justify-between">
                            <AriaButton
                                slot="previous"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-zinc-300/80 bg-white/80 text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                                <ChevronLeft className="size-4" />
                            </AriaButton>
                            <AriaHeading className="text-sm font-semibold text-zinc-800 dark:text-zinc-100" />
                            <AriaButton
                                slot="next"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-zinc-300/80 bg-white/80 text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                                <ChevronRight className="size-4" />
                            </AriaButton>
                        </header>

                        {children || (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        state.setValue(today(getLocalTimeZone()));
                                        state.setFocusedDate(today(getLocalTimeZone()));
                                    }}
                                    className="rounded-lg border border-zinc-300/80 bg-white/80 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                >
                                    Today
                                </button>
                            </div>
                        )}

                        <AriaCalendarGrid weekdayStyle="short" className="w-max">
                            <AriaCalendarGridHeader className="border-b border-zinc-200/70 dark:border-zinc-700/70">
                                {(day) => (
                                    <AriaCalendarHeaderCell className="p-0">
                                        <div className="flex size-10 items-center justify-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                                            {day.slice(0, 2)}
                                        </div>
                                    </AriaCalendarHeaderCell>
                                )}
                            </AriaCalendarGridHeader>
                            <AriaCalendarGridBody className="[&_td]:p-0 [&_tr]:border-b border-zinc-100/80 [&_tr:last-of-type]:border-none dark:[&_tr]:border-zinc-800/70">
                                {(date) => (
                                    <CalendarCell
                                        date={date}
                                        isHighlighted={highlightedDates?.some((highlightedDate) => date.compare(highlightedDate) === 0)}
                                    />
                                )}
                            </AriaCalendarGridBody>
                        </AriaCalendarGrid>
                    </>
                )}
            </AriaCalendar>
        </ContextWrapper>
    );
};
