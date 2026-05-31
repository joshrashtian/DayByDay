import { isTauri } from "./tauriEnv";

export const HOME_STYLE_WINDOW_LABEL = "home-style";

let browserStyleWindow: Window | null = null;

function getHomeStyleWindowUrl(): string {
  const hashRoute = "#/home/style";
  if (typeof window === "undefined") return `index.html${hashRoute}`;

  const { origin, pathname } = window.location;
  if (origin && origin !== "null") {
    return `${origin}${pathname}${hashRoute}`;
  }

  const base = pathname.endsWith("index.html") ? pathname : "/index.html";
  return `${base}${hashRoute}`;
}

export async function openHomeStyleWindow(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const existing = await WebviewWindow.getByLabel(HOME_STYLE_WINDOW_LABEL);
      if (existing) {
        await existing.show();
        await existing.setFocus();
        return true;
      }

      const webview = new WebviewWindow(HOME_STYLE_WINDOW_LABEL, {
        url: getHomeStyleWindowUrl(),
        title: "Home Style",
        width: 980,
        height: 820,
        minWidth: 640,
        minHeight: 520,
        center: true,
        resizable: true,
        decorations: true,
      });

      webview.once("tauri://error", (event) => {
        console.error("Failed to open home style window", event);
      });

      return true;
    } catch (error) {
      console.error("Tauri home style window unavailable", error);
    }
  }

  if (browserStyleWindow && !browserStyleWindow.closed) {
    browserStyleWindow.focus();
    return true;
  }

  browserStyleWindow = window.open(
    getHomeStyleWindowUrl(),
    HOME_STYLE_WINDOW_LABEL,
    "popup=yes,width=980,height=820,noopener,noreferrer",
  );

  return Boolean(browserStyleWindow);
}

export async function isHomeStyleWindowOpen(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const existing = await WebviewWindow.getByLabel(HOME_STYLE_WINDOW_LABEL);
      return Boolean(existing);
    } catch {
      return false;
    }
  }

  return Boolean(browserStyleWindow && !browserStyleWindow.closed);
}
