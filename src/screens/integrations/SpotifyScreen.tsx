import { useMemo } from "react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import spotifyIcon from "@/assets/spotifysvg.svg";
import { useSpotifyHistorySync } from "@/hooks/useSpotifyHistorySync";
import {
  formatListeningDuration,
  playsForDay,
  summarizeDay,
} from "@/lib/integrations/spotify/history";
import { useSpotifyStore } from "@/stores/spotifyStore";
import type { SpotifyNowPlaying, SpotifyPlay } from "@/types";

/** How many days back the screen renders; the log itself keeps more. */
const VISIBLE_DAYS = 14;

function NowPlayingCard({ nowPlaying }: { nowPlaying: SpotifyNowPlaying }) {
  const progress = nowPlaying.durationMs
    ? Math.min(100, (nowPlaying.progressMs / nowPlaying.durationMs) * 100)
    : 0;

  return (
    <div className="mt-8 flex w-full max-w-2xl items-center gap-4 rounded-2xl border border-line bg-surface p-4">
      {nowPlaying.albumArtUrl && (
        <img
          src={nowPlaying.albumArtUrl}
          alt=""
          aria-hidden
          className="size-16 shrink-0 rounded-lg ring-1 ring-line/60"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {nowPlaying.isPlaying ? "Now playing" : "Paused"}
        </p>
        <p className="mt-0.5 truncate font-semibold text-ink">
          {nowPlaying.title}
        </p>
        <p className="truncate text-sm text-muted">{nowPlaying.artists}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DaySection({ day, plays }: { day: DateTime; plays: SpotifyPlay[] }) {
  const summary = summarizeDay(plays);
  const isToday = day.hasSame(DateTime.local(), "day");

  return (
    <section className="border-t border-line/60 py-5 first:border-t-0">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-lg font-semibold text-ink">
          {isToday ? "Today" : day.toFormat("cccc, d LLLL")}
        </h2>
        <p className="text-xs text-muted">
          {summary.playCount} {summary.playCount === 1 ? "track" : "tracks"} ·{" "}
          {formatListeningDuration(summary.totalMs)}
          {summary.topArtist ? ` · mostly ${summary.topArtist}` : ""}
        </p>
      </header>

      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {plays.map((play) => (
          <li
            key={play.playedAt}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-sunken"
          >
            <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
              {DateTime.fromISO(play.playedAt).toFormat("h:mm a")}
            </span>
            {play.albumArtUrl ? (
              <img
                src={play.albumArtUrl}
                alt=""
                aria-hidden
                loading="lazy"
                className="size-9 shrink-0 rounded ring-1 ring-line/60"
              />
            ) : (
              <span className="size-9 shrink-0 rounded bg-sunken ring-1 ring-line/60" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">
                {play.title}
              </span>
              <span className="block truncate text-xs text-muted">
                {play.artists}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SpotifyScreen() {
  useSpotifyHistorySync();

  const { plays, nowPlaying, isConnected, status, error, connect } =
    useSpotifyStore(
      useShallow((s) => ({
        plays: s.plays,
        nowPlaying: s.nowPlaying,
        isConnected: Boolean(s.tokens),
        status: s.status,
        error: s.error,
        connect: s.connect,
      })),
    );

  const days = useMemo(() => {
    const today = DateTime.local().startOf("day");
    return Array.from({ length: VISIBLE_DAYS }, (_, offset) => {
      const day = today.minus({ days: offset });
      return { day, plays: playsForDay(plays, day) };
    }).filter((entry) => entry.plays.length > 0);
  }, [plays]);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col items-start px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <div className="flex items-center gap-3">
        <img src={spotifyIcon} alt="" className="h-8 w-8" aria-hidden />
        <h1 className="font-quantify text-4xl text-ink sm:text-5xl">Spotify</h1>
      </div>
      <p className="mt-3 max-w-2xl text-base text-muted">
        A running log of what you listened to, day by day, alongside the work
        you were doing.
      </p>

      {!isConnected && (
        <div className="mt-8 w-full max-w-2xl rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            Connect your account to start logging plays. Spotify keeps only your
            last 50 tracks, so history builds up from the day you connect.
          </p>
          <button
            type="button"
            onClick={() => void connect()}
            disabled={status === "connecting"}
            className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {status === "connecting" ? "Waiting for Spotify…" : "Connect Spotify"}
          </button>
          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      )}

      {nowPlaying && <NowPlayingCard nowPlaying={nowPlaying} />}

      {isConnected && (
        <div className="mt-6 w-full">
          {days.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing logged yet. Play something and it will show up here within
              a few minutes.
            </p>
          ) : (
            days.map(({ day, plays: dayPlays }) => (
              <DaySection key={day.toISODate()} day={day} plays={dayPlays} />
            ))
          )}
        </div>
      )}
    </main>
  );
}
