export const APP_ZOOM_DEFAULT = 1;
export const APP_ZOOM_MIN = 0.7;
export const APP_ZOOM_MAX = 1.6;
export const APP_ZOOM_STEP = 0.1;

export function clampAppZoom(value: number): number {
  if (!Number.isFinite(value)) return APP_ZOOM_DEFAULT;
  const stepped = Math.round(value / APP_ZOOM_STEP) * APP_ZOOM_STEP;
  return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, stepped));
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function applyCssZoom(z: number): void {
  const html = document.documentElement;
  if (z === APP_ZOOM_DEFAULT) {
    html.style.zoom = "";
    html.removeAttribute("data-app-zoom-active");
  } else {
    html.style.zoom = z.toFixed(2);
    html.setAttribute("data-app-zoom-active", "");
  }
}

/** Apply zoom to the whole app (sidebar, calendar, portaled UI). */
/** Current app zoom from settings (--app-zoom). */
export function getAppZoomLevel(): number {
  if (typeof document === "undefined") return APP_ZOOM_DEFAULT;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--app-zoom")
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : APP_ZOOM_DEFAULT;
}

/**
 * `html { zoom }` scales getBoundingClientRect but `position: fixed` uses
 * unscaled CSS pixels — convert viewport rects before placing portaled menus.
 */
export function isCssHtmlZoomActive(): boolean {
  if (typeof document === "undefined") return false;
  const zoom = document.documentElement.style.zoom;
  return zoom !== "" && zoom !== "normal";
}

export type FixedOverlayRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

export function clientRectToFixedPosition(
  rect: DOMRect | DOMRectReadOnly,
): FixedOverlayRect {
  if (!isCssHtmlZoomActive()) {
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    };
  }
  const z = getAppZoomLevel();
  return {
    top: rect.top / z,
    left: rect.left / z,
    width: rect.width / z,
    height: rect.height / z,
    bottom: rect.bottom / z,
    right: rect.right / z,
  };
}

/** Position a fixed overlay menu directly under `trigger`. */
export function fixedPositionBelowTrigger(
  trigger: HTMLElement,
  gap = 6,
): Pick<FixedOverlayRect, "top" | "left" | "width"> {
  const rect = clientRectToFixedPosition(trigger.getBoundingClientRect());
  const gapPx = isCssHtmlZoomActive() ? gap / getAppZoomLevel() : gap;
  return {
    top: rect.bottom + gapPx,
    left: rect.left,
    width: rect.width,
  };
}

export function applyAppZoomToDocument(zoom: number): void {
  const z = clampAppZoom(zoom);
  const html = document.documentElement;
  html.style.setProperty("--app-zoom", z.toFixed(2));

  if (!isTauri()) {
    applyCssZoom(z);
    return;
  }

  void import("@tauri-apps/api/webview")
    .then(({ getCurrentWebview }) => getCurrentWebview().setZoom(z))
    .then(() => {
      html.style.zoom = "";
      if (z === APP_ZOOM_DEFAULT) {
        html.removeAttribute("data-app-zoom-active");
      } else {
        html.setAttribute("data-app-zoom-active", "");
      }
    })
    .catch(() => {
      applyCssZoom(z);
    });
}
