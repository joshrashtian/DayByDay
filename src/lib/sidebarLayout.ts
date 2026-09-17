/**
 * Adaptive sidebar sizing.
 *
 * The sidebar has three layout modes, picked from how much horizontal room the
 * app window actually has:
 *
 * - `expanded` — the normal sidebar; the user controls open state and width.
 * - `rail`     — a simplified icon-only strip: no labels, no inline task list.
 * - `overlay`  — too narrow to give the sidebar any permanent room, so it
 *                collapses to the edge handle and floats above content when
 *                opened.
 *
 * Thresholds carry hysteresis so dragging the window edge across a breakpoint
 * does not make the sidebar flicker between two modes.
 */

export type SidebarLayoutMode = "expanded" | "rail" | "overlay";

/** Width of the icon-only rail. Fits a 36px icon plus item + container padding. */
export const SIDEBAR_RAIL_WIDTH = 68;

/** Below this app width the sidebar drops to the icon rail. */
export const SIDEBAR_RAIL_BREAKPOINT = 900;

/** Below this app width the sidebar collapses out of the layout entirely. */
export const SIDEBAR_OVERLAY_BREAKPOINT = 680;

/** Extra width required to climb back out of a narrower mode. */
export const SIDEBAR_LAYOUT_HYSTERESIS = 24;

/** The sidebar never claims more than this share of the window when expanded. */
export const SIDEBAR_MAX_VIEWPORT_FRACTION = 0.38;

/** Space kept visible to the right of the sidebar when it floats as an overlay. */
export const SIDEBAR_OVERLAY_GUTTER = 56;

/**
 * Pick the layout mode for a given app width. Pass the mode currently in use as
 * `previous` so the hysteresis band applies.
 */
export function resolveSidebarLayoutMode(
  viewportWidth: number,
  previous: SidebarLayoutMode = "expanded",
): SidebarLayoutMode {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return previous;

  const leavingOverlay = previous === "overlay";
  const leavingRail = previous === "rail" || leavingOverlay;

  const overlayThreshold =
    SIDEBAR_OVERLAY_BREAKPOINT +
    (leavingOverlay ? SIDEBAR_LAYOUT_HYSTERESIS : 0);
  const railThreshold =
    SIDEBAR_RAIL_BREAKPOINT + (leavingRail ? SIDEBAR_LAYOUT_HYSTERESIS : 0);

  if (viewportWidth < overlayThreshold) return "overlay";
  if (viewportWidth < railThreshold) return "rail";
  return "expanded";
}

/** Keep an expanded sidebar from eating the window on mid-size layouts. */
export function clampSidebarWidthToViewport(
  width: number,
  viewportWidth: number,
): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return width;
  const ceiling = Math.round(viewportWidth * SIDEBAR_MAX_VIEWPORT_FRACTION);
  return Math.max(SIDEBAR_RAIL_WIDTH, Math.min(width, ceiling));
}

/** Width of the floating panel in overlay mode. */
export function resolveOverlayPanelWidth(
  width: number,
  viewportWidth: number,
): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return width;
  return Math.max(
    SIDEBAR_RAIL_WIDTH,
    Math.min(width, viewportWidth - SIDEBAR_OVERLAY_GUTTER),
  );
}
