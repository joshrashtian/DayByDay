import { useEffect } from "react";
import { GOOGLE_CALENDAR_ENABLED } from "@/lib/featureFlags";
import { useCalendarIntegrationsStore } from "@/stores/calendarIntegrationsStore";

/**
 * Re-imports enabled Google calendars on launch, when the window comes back
 * into view, and on a slow interval, so new events appear without a trip to
 * Settings. Imports dedupe on the event UID, so repeats are cheap no-ops.
 */
const POLL_INTERVAL_MS = 15 * 60_000;

export function useGoogleCalendarSync(): void {
  const isConnected = useCalendarIntegrationsStore((s) =>
    Boolean(s.google.tokens),
  );
  const importGoogleEvents = useCalendarIntegrationsStore(
    (s) => s.importGoogleEvents,
  );

  useEffect(() => {
    if (!GOOGLE_CALENDAR_ENABLED || !isConnected) return;

    const sync = () => {
      if (document.visibilityState !== "visible") return;
      void importGoogleEvents();
    };

    sync();
    const timer = window.setInterval(sync, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [isConnected, importGoogleEvents]);
}
