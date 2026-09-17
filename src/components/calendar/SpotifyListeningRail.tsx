import { useMemo } from "react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import spotifyIcon from "@/assets/spotifysvg.svg";
import {
  formatListeningDuration,
  groupIntoSessions,
  playsForDay,
  summarizeDay,
} from "@/lib/integrations/spotify/history";
import { useSpotifyStore } from "@/stores/spotifyStore";
import type { SpotifyPlay } from "@/types";

function TrackRow({ play }: { play: SpotifyPlay }) {
  const playedAt = DateTime.fromISO(play.playedAt);

  return (
    <li className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-sunken">
      <span className="w-11 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted">
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
        <span className="block truncate text-xs font-semibold text-ink">
          {play.title}
        </span>
        <span className="block truncate text-[11px] text-muted">
          {play.artists}
        </span>
      </span>
    </li>
  );
}

function RailShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <aside
      aria-label="Spotify listening history"
      className="flex h-full w-[280px] shrink-0 flex-col border-l border-line/60 bg-surface/60 backdrop-blur-sm"
    >
      <header className="shrink-0 border-b border-line/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={spotifyIcon} alt="" className="h-4 w-4" aria-hidden />
          <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-muted">
            Listened to
          </h2>
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        )}
      </header>
      {children}
    </aside>
  );
}

export function SpotifyListeningRail({ day }: { day: DateTime }) {
  const { plays, isConnected, status, historyStartedAt, connect } =
    useSpotifyStore(
      useShallow((s) => ({
        plays: s.plays,
        isConnected: Boolean(s.tokens),
        status: s.status,
        historyStartedAt: s.historyStartedAt,
        connect: s.connect,
      })),
    );

  const dayPlays = useMemo(() => playsForDay(plays, day), [plays, day]);
  const sessions = useMemo(() => groupIntoSessions(dayPlays), [dayPlays]);
  const summary = useMemo(() => summarizeDay(dayPlays), [dayPlays]);

  if (!isConnected) {
    return (
      <RailShell>
        <div className="flex flex-1 flex-col items-start justify-center gap-3 px-4 text-left">
          <p className="text-xs leading-relaxed text-muted">
            Connect Spotify to log what you play through the day and see it
            beside your calendar.
          </p>
          <button
            type="button"
            onClick={() => void connect()}
            disabled={status === "connecting"}
            className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {status === "connecting" ? "Waiting for Spotify…" : "Connect Spotify"}
          </button>
        </div>
      </RailShell>
    );
  }

  if (dayPlays.length === 0) {
    // History only exists from the moment the account was connected, so an
    // empty past day is expected rather than an error worth alarming about.
    const startedAt = historyStartedAt ? DateTime.fromMillis(historyStartedAt) : null;
    const predatesHistory = Boolean(
      startedAt && day.endOf("day") < startedAt.startOf("day"),
    );

    return (
      <RailShell subtitle={day.toFormat("cccc, d LLL")}>
        <div className="flex flex-1 items-center px-4">
          <p className="text-xs leading-relaxed text-muted">
            {predatesHistory
              ? `No history for this day — RiseByDay started logging on ${startedAt?.toFormat("d LLL yyyy")}.`
              : "Nothing logged for this day yet."}
          </p>
        </div>
      </RailShell>
    );
  }

  return (
    <RailShell
      subtitle={`${summary.playCount} ${summary.playCount === 1 ? "track" : "tracks"} · ${formatListeningDuration(summary.totalMs)}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        {sessions.map((session) => (
          <section key={session.id} className="mb-4 last:mb-0">
            <h3 className="mb-1 px-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
              {session.start.toFormat("h:mm a")} – {session.end.toFormat("h:mm a")}
            </h3>
            <ul className="space-y-0.5">
              {session.plays.map((play) => (
                <TrackRow key={play.playedAt} play={play} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {summary.topArtist && (
        <footer className="shrink-0 border-t border-line/60 px-4 py-2.5">
          <p className="truncate text-[11px] text-muted">
            Most played:{" "}
            <span className="font-semibold text-ink">{summary.topArtist}</span>
          </p>
        </footer>
      )}
    </RailShell>
  );
}
