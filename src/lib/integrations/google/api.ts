import { DateTime } from "luxon";

import type {
  ConnectedCalendar,
  GoogleTokens,
  ImportIcsTaskPayload,
} from "@/types";
import {
  GOOGLE_AUTH_URL,
  GOOGLE_CALENDAR_API_BASE,
  GOOGLE_REDIRECT_URI,
  GOOGLE_SCOPES,
  GOOGLE_TOKEN_URL,
  type GoogleClientConfig,
} from "./config";

export class GoogleAuthError extends Error {}

// ── Authorization ─────────────────────────────────────────────────────────

export function buildAuthorizeUrl(options: {
  clientId: string;
  codeChallenge: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    response_type: "code",
    redirect_uri: GOOGLE_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: options.codeChallenge,
    state: options.state,
    scope: GOOGLE_SCOPES.join(" "),
    // Without both, Google only issues a refresh token on the very first
    // consent, so a reconnect would leave us with an hour-long session.
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => null)) as
    | (TokenResponse & { error?: string; error_description?: string })
    | null;

  if (!response.ok || !payload?.access_token) {
    const detail =
      payload?.error_description ?? payload?.error ?? `HTTP ${response.status}`;
    throw new GoogleAuthError(`Google token request failed: ${detail}`);
  }
  return payload;
}

function toTokens(
  payload: TokenResponse,
  fallbackRefreshToken?: string,
): GoogleTokens {
  const refreshToken = payload.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) {
    throw new GoogleAuthError("Google did not return a refresh token.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken,
    // Expire a minute early so an in-flight request cannot land on a dead token.
    expiresAt: Date.now() + (payload.expires_in - 60) * 1000,
    scope: payload.scope ?? GOOGLE_SCOPES.join(" "),
  };
}

export async function exchangeCodeForTokens(
  client: GoogleClientConfig,
  options: { code: string; codeVerifier: string },
): Promise<GoogleTokens> {
  const payload = await postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: options.code,
      redirect_uri: GOOGLE_REDIRECT_URI,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      code_verifier: options.codeVerifier,
    }),
  );
  return toTokens(payload);
}

/** Google does not rotate refresh tokens, so the old one is carried forward. */
export async function refreshAccessToken(
  client: GoogleClientConfig,
  refreshToken: string,
): Promise<GoogleTokens> {
  const payload = await postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: client.clientId,
      client_secret: client.clientSecret,
    }),
  );
  return toTokens(payload, refreshToken);
}

// ── Calendar API ──────────────────────────────────────────────────────────

async function apiGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401) {
    throw new GoogleAuthError("Google access token rejected.");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      payload?.error?.message ??
        `Google Calendar request failed (${response.status}).`,
    );
  }
  return (await response.json()) as T;
}

type ApiCalendarListEntry = {
  id: string;
  summary: string;
  summaryOverride?: string;
  backgroundColor?: string;
  primary?: boolean;
  selected?: boolean;
};

export type GoogleCalendarList = {
  /** The primary calendar's ID is the account's email address. */
  accountEmail?: string;
  calendars: ConnectedCalendar[];
};

export async function fetchCalendarList(
  accessToken: string,
): Promise<GoogleCalendarList> {
  const entries: ApiCalendarListEntry[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "250" });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await apiGet<{
      items?: ApiCalendarListEntry[];
      nextPageToken?: string;
    }>(`/users/me/calendarList?${params.toString()}`, accessToken);
    entries.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  // Primary first, then Google's own order.
  entries.sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)));

  return {
    accountEmail: entries.find((entry) => entry.primary)?.id,
    calendars: entries.map((entry) => ({
      id: entry.id,
      provider: "google",
      name: entry.summaryOverride ?? entry.summary,
      color: entry.backgroundColor,
      // Mirror what the user already shows in Google Calendar itself.
      enabled: entry.primary || Boolean(entry.selected),
    })),
  };
}

type ApiEventTime = { date?: string; dateTime?: string };

type ApiEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: ApiEventTime;
  end?: ApiEventTime;
};

/**
 * All-day events carry a bare `date`. They are pinned to the end of that local
 * day, matching how `parseIcsFile` treats date-only `DTSTART` values.
 */
function parseEventTime(time?: ApiEventTime): { date: Date; allDay: boolean } | null {
  if (time?.dateTime) {
    const dt = DateTime.fromISO(time.dateTime);
    return dt.isValid ? { date: dt.toJSDate(), allDay: false } : null;
  }
  if (time?.date) {
    const dt = DateTime.fromISO(time.date, { zone: "local" }).endOf("day");
    return dt.isValid ? { date: dt.toJSDate(), allDay: true } : null;
  }
  return null;
}

/** Namespaced so Google event IDs cannot collide with `.ics` file UIDs. */
export function googleEventUid(calendarId: string, eventId: string): string {
  return `google:${calendarId}:${eventId}`;
}

/**
 * Fetches events in `[timeMin, timeMax)` with recurring events expanded into
 * individual instances, already shaped for `importIcsTasks`.
 */
export async function fetchEvents(
  accessToken: string,
  calendar: Pick<ConnectedCalendar, "id" | "name">,
  range: { timeMin: Date; timeMax: Date },
): Promise<ImportIcsTaskPayload[]> {
  const events: ImportIcsTaskPayload[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: range.timeMin.toISOString(),
      timeMax: range.timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await apiGet<{ items?: ApiEvent[]; nextPageToken?: string }>(
      `/calendars/${encodeURIComponent(calendar.id)}/events?${params.toString()}`,
      accessToken,
    );

    for (const event of page.items ?? []) {
      if (event.status === "cancelled") continue;
      const start = parseEventTime(event.start);
      if (!start) continue;
      const end = start.allDay ? null : parseEventTime(event.end);

      events.push({
        title: event.summary?.trim() || "(No title)",
        dueDate: start.date,
        ...(end ? { endDate: end.date } : {}),
        ...(event.location ? { classLocation: event.location } : {}),
        ...(event.description ? { description: event.description } : {}),
        icsUid: googleEventUid(calendar.id, event.id),
      });
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return events;
}
