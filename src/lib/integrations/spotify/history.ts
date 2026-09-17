import { DateTime } from "luxon";
import type { SpotifyPlay } from "@/types";

/**
 * Cap on the local play log. Spotify only ever returns the last 50 plays, so
 * this log is the only long-term record — but it lives in localStorage, so it
 * is bounded. ~5k plays is a few months of heavy listening at roughly 1MB.
 */
export const MAX_STORED_PLAYS = 5000;

/** A run of plays with no long silence between them. */
export type ListeningSession = {
  id: string;
  start: DateTime;
  end: DateTime;
  plays: SpotifyPlay[];
};

export type DayListeningSummary = {
  playCount: number;
  totalMs: number;
  uniqueArtists: number;
  topArtist: string | null;
};

function playedAtMs(play: SpotifyPlay): number {
  return new Date(play.playedAt).getTime();
}

/**
 * Merges freshly polled plays into the stored log, newest first. `played_at` is
 * unique per play, so it doubles as the dedupe key across overlapping polls.
 */
export function mergePlays(
  existing: SpotifyPlay[],
  incoming: SpotifyPlay[],
  cap: number = MAX_STORED_PLAYS,
): SpotifyPlay[] {
  if (incoming.length === 0) return existing;

  const byPlayedAt = new Map<string, SpotifyPlay>();
  for (const play of existing) byPlayedAt.set(play.playedAt, play);
  for (const play of incoming) byPlayedAt.set(play.playedAt, play);

  return [...byPlayedAt.values()]
    .sort((a, b) => playedAtMs(b) - playedAtMs(a))
    .slice(0, cap);
}

/** Cursor for the next poll, so Spotify only returns plays we lack. */
export function latestPlayedAtMs(plays: SpotifyPlay[]): number | undefined {
  let latest = 0;
  for (const play of plays) {
    const ms = playedAtMs(play);
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return latest > 0 ? latest : undefined;
}

/** Plays that fall on `day` in the viewer's local timezone, oldest first. */
export function playsForDay(
  plays: SpotifyPlay[],
  day: DateTime,
): SpotifyPlay[] {
  const start = day.startOf("day").toMillis();
  const end = day.endOf("day").toMillis();

  return plays
    .filter((play) => {
      const ms = playedAtMs(play);
      return Number.isFinite(ms) && ms >= start && ms <= end;
    })
    .sort((a, b) => playedAtMs(a) - playedAtMs(b));
}

/**
 * Groups a day's plays into sessions. A gap longer than `gapMinutes` between
 * one play starting and the next ends the session.
 */
export function groupIntoSessions(
  plays: SpotifyPlay[],
  gapMinutes = 30,
): ListeningSession[] {
  const gapMs = gapMinutes * 60_000;
  const sessions: ListeningSession[] = [];

  for (const play of plays) {
    const at = playedAtMs(play);
    if (!Number.isFinite(at)) continue;

    const current = sessions.at(-1);
    if (current && at - current.end.toMillis() <= gapMs) {
      current.plays.push(play);
      current.end = DateTime.fromMillis(at + play.durationMs);
      continue;
    }

    sessions.push({
      id: play.playedAt,
      start: DateTime.fromMillis(at),
      end: DateTime.fromMillis(at + play.durationMs),
      plays: [play],
    });
  }

  return sessions;
}

export function summarizeDay(plays: SpotifyPlay[]): DayListeningSummary {
  const counts = new Map<string, number>();
  let totalMs = 0;

  for (const play of plays) {
    totalMs += play.durationMs;
    // Credit the lead artist only; joint credits would fragment the tally.
    const lead = play.artists.split(",")[0]?.trim();
    if (lead) counts.set(lead, (counts.get(lead) ?? 0) + 1);
  }

  let topArtist: string | null = null;
  let topCount = 0;
  for (const [artist, count] of counts) {
    if (count > topCount) {
      topArtist = artist;
      topCount = count;
    }
  }

  return {
    playCount: plays.length,
    totalMs,
    uniqueArtists: counts.size,
    topArtist,
  };
}

export function formatListeningDuration(totalMs: number): string {
  const minutes = Math.round(totalMs / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
