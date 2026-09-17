import { useEffect, useState } from "react";

/**
 * The app's usable width in layout pixels.
 *
 * Reads `documentElement.clientWidth` rather than `window.innerWidth` so the
 * value stays correct under both zoom paths in `lib/appZoom`: Tauri's webview
 * zoom (which rescales `innerWidth`) and the CSS `html { zoom }` fallback
 * (which does not).
 */
const readAppWidth = () => {
  if (typeof document === "undefined") return 0;
  return document.documentElement.clientWidth || window.innerWidth;
};

export function useAppViewportWidth(): number {
  const [width, setWidth] = useState(readAppWidth);

  useEffect(() => {
    // Set state straight from the handler rather than debouncing through
    // requestAnimationFrame: rAF is paused while the window is hidden or
    // occluded, which would leave the measured width stale. React batches
    // these, and an unchanged value bails out of re-rendering anyway.
    const sync = () => setWidth(readAppWidth());

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(document.documentElement);
    window.addEventListener("resize", sync);
    sync();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return width;
}
