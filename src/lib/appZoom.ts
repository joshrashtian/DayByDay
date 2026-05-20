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
