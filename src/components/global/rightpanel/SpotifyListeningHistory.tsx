import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import { useSpotifyHistorySync } from "@/hooks/useSpotifyHistorySync";
import {
  formatListeningDuration,
  groupIntoSessions,
  playsForDay,
  summarizeDay,
  type ListeningSession,
} from "@/lib/integrations/spotify/history";
import { useSpotifyStore } from "@/stores/spotifyStore";
import type { SpotifyNowPlaying, SpotifyPlay } from "@/types";
import { sidebarTokens } from "../sidebar/sidebarTokens";
import { useSpotifyNowPlayingSync } from "@/hooks/useSpotifyNowPlayingSync";
import { useDominantColor } from "@/hooks/useDominantColor";
import Tilt from "react-parallax-tilt";
import { now } from "@internationalized/date";
/** How many days back the panel renders; the log itself keeps more. */
const VISIBLE_DAYS = 14;

function TrackRow({ play }: { play: SpotifyPlay }) {
  const playedAt = DateTime.fromISO(play.playedAt);

  return (
    <li
      className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors ${sidebarTokens.rowHover}`}
    >
      <span
        className={`w-11 shrink-0 text-right font-mono text-[10px] tabular-nums ${sidebarTokens.mutedText}`}
      >
        {playedAt.isValid ? playedAt.toFormat("h:mm a") : ""}
      </span>
      {play.albumArtUrl ? (
        <img
          src={play.albumArtUrl}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-8 shrink-0 rounded ring-1 ring-line/60"
        />
      ) : (
        <span className="size-8 shrink-0 rounded bg-sunken ring-1 ring-line/60" />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-xs font-semibold ${sidebarTokens.primaryText}`}
        >
          {play.title}
        </span>
        <span
          className={`block truncate text-[11px] ${sidebarTokens.mutedText}`}
        >
          {play.artists}
        </span>
      </span>
    </li>
  );
}

function NowPlayingCard({ nowPlaying }: { nowPlaying: SpotifyNowPlaying }) {
  const tint = useDominantColor(nowPlaying.albumArtUrl);

  // Spotify is only polled every 20s, so advance the bar locally in between.
  const [elapsedMs, setElapsedMs] = useState(nowPlaying.progressMs);
  useEffect(() => {
    setElapsedMs(nowPlaying.progressMs);
    if (!nowPlaying.isPlaying) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedMs(
        Math.min(
          nowPlaying.durationMs,
          nowPlaying.progressMs + (Date.now() - startedAt),
        ),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [nowPlaying]);

  const progress = nowPlaying.durationMs
    ? Math.min(100, (elapsedMs / nowPlaying.durationMs) * 100)
    : 0;

  // `color-mix` keeps the tint legible on both themes: it is blended into the
  // surface colour rather than painted on top of it.
  const tintStyle = tint
    ? {
        background: `linear-gradient(135deg, color-mix(in oklab, ${tint} 22%, var(--surface)), var(--surface) 70%)`,
        borderColor: `color-mix(in oklab, ${tint} 35%, var(--line))`,
      }
    : undefined;

  return (
    <div
      className={`@container mb-3 rounded-xl border p-4 ${sidebarTokens.divider} ${sidebarTokens.surface}`}
      style={tintStyle}
    >
      <h3
        className={`mb-3 font-display text-xs font-semibold  ${sidebarTokens.primaryText}`}
      >
        {nowPlaying.isPlaying ? "Now Playing" : "Paused"}
      </h3>

      {/* Stacks in a narrow panel; sits side-by-side once there is room.
          Both are driven by the card's own width, not the window's. */}
      <div className="flex flex-col items-center gap-4 @min-[340px]:flex-row">
        <div
          className="relative shrink-0 rounded-full"
          style={{
            // Scale the record with the panel, within sane bounds.
            width: "clamp(88px, 36cqw, 150px)",
            height: "clamp(88px, 36cqw, 150px)",
          }}
        >
          {nowPlaying.albumArtUrl ? (
            <Tilt
              className={`absolute inset-0 h-full w-full rounded-full object-cover ring-2 ring-ink/70  motion-reduce:animate-none `}
            >
              <img
                src={nowPlaying.albumArtUrl}
                className={`rounded-full ${nowPlaying.isPlaying ? "animate-spin-slow" : ""}`}
                alt=""
                aria-hidden
              />
            </Tilt>
          ) : (
            <div className="absolute inset-0 rounded-full bg-sunken ring-2 ring-ink/70" />
          )}

          <div className="absolute left-1/2 top-1/2 size-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-canvas ring-2 ring-ink/70" />
        </div>

        <div className="w-full min-w-0 flex-1 text-center @min-[340px]:text-left">
          <p
            className={`truncate font-eudoxus text-xl font-black @min-[420px]:text-lg ${sidebarTokens.primaryText}`}
          >
            {nowPlaying.title}
          </p>
          <p className={`truncate text-xs ${sidebarTokens.mutedText}`}>
            {nowPlaying.artists} - {nowPlaying.album}
          </p>
          <div className="mt-2 h-1 group hover:h-2 duration-300 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{
                width: `${progress}%`,
                background: tint ?? "var(--accent)",
              }}
            />
            <p className="opacity-0 absolute font-mono text-slate-500 translate-y-0 duration-300 group-hover:translate-y-1 group-hover:opacity-100">
              {Math.floor((elapsedMs % 3600000) / 60000) % 60}:
              {Math.floor(elapsedMs / 1000) % 60 < 10
                ? `0${Math.floor(elapsedMs / 1000) % 60}`
                : Math.floor(elapsedMs / 1000) % 60}
              /{Math.floor((nowPlaying.durationMs % 3600000) / 60000) % 60}:
              {Math.floor(nowPlaying.durationMs / 1000) % 60 < 10
                ? `0${Math.floor(nowPlaying.durationMs / 1000) % 60}`
                : Math.floor(nowPlaying.durationMs / 1000) % 60}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionGroup({ session }: { session: ListeningSession }) {
  return (
    <section className="mb-3 last:mb-0">
      <h4
        className={`mb-1 px-1.5 font-mono text-[10px] uppercase tracking-wide ${sidebarTokens.mutedText}`}
      >
        {session.start.toFormat("h:mm a")} – {session.end.toFormat("h:mm a")}
      </h4>
      <ul className="space-y-0.5">
        {session.plays.map((play) => (
          <TrackRow key={play.playedAt} play={play} />
        ))}
      </ul>
    </section>
  );
}

function DaySection({ day, plays }: { day: DateTime; plays: SpotifyPlay[] }) {
  // Newest session first so the top of the panel is what just played.
  const sessions = useMemo(() => groupIntoSessions(plays).reverse(), [plays]);
  const summary = useMemo(() => summarizeDay(plays), [plays]);
  const isToday = day.hasSame(DateTime.local(), "day");

  return (
    <section
      className={`border-t py-3 first:border-t-0 first:pt-0 ${sidebarTokens.divider}`}
    >
      <header className="mb-2 px-1.5">
        <h3
          className={`font-display text-xs font-semibold uppercase tracking-wide ${sidebarTokens.primaryText}`}
        >
          {isToday ? "Today" : day.toFormat("ccc, d LLL")}
        </h3>
        <p className={`text-[11px] ${sidebarTokens.mutedText}`}>
          {summary.playCount} {summary.playCount === 1 ? "track" : "tracks"} ·{" "}
          {formatListeningDuration(summary.totalMs)}
          {summary.topArtist ? ` · mostly ${summary.topArtist}` : ""}
        </p>
      </header>
      {sessions.map((session) => (
        <SessionGroup key={session.id} session={session} />
      ))}
    </section>
  );
}

/**
 * The user's own Spotify play log, newest day first, for the right panel.
 * Spotify only exposes the last 50 plays, so this keeps polling while it is
 * mounted — the panel being open is what grows the history.
 */
export function SpotifyListeningHistory() {
  useSpotifyHistorySync();
  useSpotifyNowPlayingSync();
  const nowPlaying = useSpotifyStore((s) => s.nowPlaying);

  const { plays, isConnected, status, error, connect } = useSpotifyStore(
    useShallow((s) => ({
      plays: s.plays,
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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-start gap-3 px-1.5 py-2">
        <p className={`text-xs leading-relaxed ${sidebarTokens.mutedText}`}>
          Connect Spotify to log what you play. History builds up from the day
          you connect.
        </p>
        <button
          type="button"
          onClick={() => void connect()}
          disabled={status === "connecting"}
          className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {status === "connecting" ? "Waiting for Spotify…" : "Connect Spotify"}
        </button>
        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <p
        className={`px-1.5 py-2 text-xs leading-relaxed ${sidebarTokens.mutedText}`}
      >
        Nothing logged yet. Play something and it will show up here within a few
        minutes.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {nowPlaying && <NowPlayingCard nowPlaying={nowPlaying} />}
      {days.map(({ day, plays: dayPlays }) => (
        <DaySection key={day.toISODate()} day={day} plays={dayPlays} />
      ))}
    </div>
  );
}
