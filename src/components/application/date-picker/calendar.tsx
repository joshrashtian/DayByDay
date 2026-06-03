import type { PropsWithChildren, ReactNode } from "react";
import { Fragment, useState } from "react";
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
                        "flex flex-col gap-2",
                        typeof className === "function" ? className(state) : className,
                    )
                }
            >
                {() => (
                    <>
                        <header className="flex items-center justify-between px-1 pb-1">
                            <AriaButton
                                slot="previous"
                                className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                                <ChevronLeft className="size-3.5" />
                            </AriaButton>
                            <AriaHeading className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-200" />
                            <AriaButton
                                slot="next"
                                className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                                <ChevronRight className="size-3.5" />
                            </AriaButton>
                        </header>

                        {children || null}

                        <AriaCalendarGrid weekdayStyle="short" className="w-max">
                            <AriaCalendarGridHeader>
                                {(day) => (
                                    <AriaCalendarHeaderCell className="p-0">
                                        <div className="flex size-8 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                            {day.slice(0, 2)}
                                        </div>
                                    </AriaCalendarHeaderCell>
                                )}
                            </AriaCalendarGridHeader>
                            <AriaCalendarGridBody className="[&_td]:p-0">
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
