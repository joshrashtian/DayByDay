import { useEffect } from "react";
import { useSpotifyStore } from "@/stores/spotifyStore";

/**
 * Keeps `nowPlaying` fresh while the caller is mounted. The history poll
 * refreshes it too, but only every few minutes — far too slow for a card that
 * claims to show what is playing right now.
 */
const POLL_INTERVAL_MS = 20_000;

export function useSpotifyNowPlayingSync(): void {
  const isConnected = useSpotifyStore((s) => Boolean(s.tokens));
  const syncNowPlaying = useSpotifyStore((s) => s.syncNowPlaying);

  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      if (!cancelled) void syncNowPlaying();
    };

    sync();
    const timer = window.setInterval(sync, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [isConnected, syncNowPlaying]);
}
