import { useEffect } from "react";
import { useSpotifyStore } from "@/stores/spotifyStore";

/**
 * Keeps the local play log topped up. Spotify only exposes the last 50 plays
 * and nothing older, so the log only grows while the app is running — which is
 * why this polls rather than fetching on demand.
 */
const POLL_INTERVAL_MS = 3 * 60_000;

export function useSpotifyHistorySync(): void {
  const isConnected = useSpotifyStore((s) => Boolean(s.tokens));
  const syncHistory = useSpotifyStore((s) => s.syncHistory);

  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;
    const sync = () => {
      // Polling a backgrounded window just burns rate limit; the visibility
      // handler below catches up as soon as the user returns.
      if (document.visibilityState !== "visible") return;
      if (!cancelled) void syncHistory();
    };

    sync();
    const timer = window.setInterval(sync, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [isConnected, syncHistory]);
}
