import { useEffect } from "react";
import { applyAppZoomToDocument } from "../lib/appZoom";
import { useSettingsStore } from "../stores/settingsStore";

export function useAppZoom() {
  const zoomLevel = useSettingsStore((s) => s.zoomLevel);

  useEffect(() => {
    applyAppZoomToDocument(zoomLevel);
  }, [zoomLevel]);
}
