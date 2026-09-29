/**
 * Routes inside the calendar section. The grid is the index route; sub-pages
 * such as Blocks hang off it (see `CalendarScreen`).
 */

export const CALENDAR_PATH = "/calendar";
export const CALENDAR_BLOCKS_PATH = "/calendar/blocks";

/**
 * True only on the calendar grid itself. Sub-pages share the `/calendar`
 * prefix but have no drop targets, so drag-to-schedule must stay off there.
 */
export function isCalendarGridPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, "") === CALENDAR_PATH;
}
