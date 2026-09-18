/**
 * Right panel sizing.
 *
 * The right panel has two layout modes, picked from the app window's width:
 *
 * - `docked`  — sits in the layout and pushes content left; the user controls
 *               its width by dragging the left edge.
 * - `overlay` — the window is too narrow to give both side panels permanent
 *               room, so it floats above content instead.
 *
 * Thresholds carry hysteresis so dragging the window edge across the
 * breakpoint does not flicker between modes.
 */

import {
  SIDEBAR_LAYOUT_HYSTERESIS,
  SIDEBAR_MAX_VIEWPORT_FRACTION,
  SIDEBAR_OVERLAY_GUTTER,
  SIDEBAR_RAIL_BREAKPOINT,
} from "./sidebarLayout";

export type RightPanelLayoutMode = "docked" | "overlay";

/** Widths the resize handle snaps to on release. */
export const RIGHT_PANEL_SNAP_WIDTHS = [280, 320, 400, 520] as const;

export const RIGHT_PANEL_DEFAULT_WIDTH = RIGHT_PANEL_SNAP_WIDTHS[1];

/** Drag range while resizing; the release snaps back into the list above. */
export const RIGHT_PANEL_MIN_WIDTH = RIGHT_PANEL_SNAP_WIDTHS[0] - 16;
export const RIGHT_PANEL_MAX_WIDTH =
  RIGHT_PANEL_SNAP_WIDTHS[RIGHT_PANEL_SNAP_WIDTHS.length - 1] + 16;

/** Below this app width the panel floats instead of claiming layout room. */
export const RIGHT_PANEL_OVERLAY_BREAKPOINT = SIDEBAR_RAIL_BREAKPOINT;

export function resolveRightPanelLayoutMode(
  viewportWidth: number,
  previous: RightPanelLayoutMode = "docked",
): RightPanelLayoutMode {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return previous;
  const threshold =
    RIGHT_PANEL_OVERLAY_BREAKPOINT +
    (previous === "overlay" ? SIDEBAR_LAYOUT_HYSTERESIS : 0);
  return viewportWidth < threshold ? "overlay" : "docked";
}

export function clampRightPanelWidth(value: number): number {
  return Math.min(
    RIGHT_PANEL_MAX_WIDTH,
    Math.max(RIGHT_PANEL_MIN_WIDTH, value),
  );
}

export function getNearestRightPanelSnapWidth(value: number): number {
  return RIGHT_PANEL_SNAP_WIDTHS.reduce((closest, width) =>
    Math.abs(width - value) < Math.abs(closest - value) ? width : closest,
  );
}

/** Keep a docked panel from eating the window on mid-size layouts. */
export function clampRightPanelWidthToViewport(
  width: number,
  viewportWidth: number,
): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return width;
  const ceiling = Math.round(viewportWidth * SIDEBAR_MAX_VIEWPORT_FRACTION);
  return Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(width, ceiling));
}

/** Width of the floating panel in overlay mode. */
export function resolveRightPanelOverlayWidth(
  width: number,
  viewportWidth: number,
): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return width;
  return Math.max(
    RIGHT_PANEL_MIN_WIDTH,
    Math.min(width, viewportWidth - SIDEBAR_OVERLAY_GUTTER),
  );
}
