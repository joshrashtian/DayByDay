import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { DateTime } from "luxon";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectedCalendar, CalendarProvider, GoogleTokens } from "@/types";

import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchCalendarList,
  fetchEvents,
  GoogleAuthError,
  refreshAccessToken,
} from "@/lib/integrations/google/api";
import { resolveGoogleClient } from "@/lib/integrations/google/config";
import {
  createCodeVerifier,
  createState,
  deriveCodeChallenge,
} from "@/lib/integrations/oauth/pkce";
import { migrateLocalStorageKey } from "@/lib/storageMigration";
import { isTauri } from "@/lib/tauriEnv";
import { useTasksStore } from "@/stores/tasksStore";

const STORAGE_KEY = "risebyday-calendar-integrations";
migrateLocalStorageKey("daybyday-calendar-integrations", STORAGE_KEY);

/** Same caveat as `spotifyStore`: Tauri rejects with the raw Rust string. */
function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

type OauthCallback = {
  code: string | null;
  state: string | null;
  error: string | null;
};

export type GoogleStatus = "disconnected" | "connecting" | "connected" | "error";

type GoogleConnection = {
  connected: boolean;
  accountEmail?: string;
  calendars: ConnectedCalendar[];
  lastImportAt?: string;
  tokens?: GoogleTokens;
};

export type GoogleImportResult = {
  imported: number;
  skipped: number;
  calendars: number;
};

type CalendarIntegrationsState = {
  google: GoogleConnection;
  googleStatus: GoogleStatus;
  googleError?: string;
  isImportingGoogle: boolean;
  importPastMonths: number;
  importFutureMonths: number;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
  refreshGoogleCalendars: () => Promise<void>;
  /** Pulls events from every enabled calendar into read-only ICS tasks. */
  importGoogleEvents: () => Promise<GoogleImportResult | null>;
  setCalendarEnabled: (
    provider: CalendarProvider,
    calendarId: string,
    enabled: boolean,
  ) => void;
  setImportRange: (pastMonths: number, futureMonths: number) => void;
  lastIcsImportAt?: string;
  lastIcsImportCount?: number;
  markIcsImportComplete: (count: number) => void;
};

const DEFAULT_GOOGLE: GoogleConnection = {
  connected: false,
  calendars: [],
};

/** Serialises refreshes so parallel callers share one token request. */
let refreshInFlight: Promise<GoogleTokens> | null = null;

export const useCalendarIntegrationsStore = create<CalendarIntegrationsState>()(
  persist(
    (set, get) => {
      /** Returns a live access token, refreshing it if needed. */
      async function ensureAccessToken(): Promise<string> {
        const { tokens } = get().google;
        if (!tokens) throw new GoogleAuthError("Google is not connected.");
        if (Date.now() < tokens.expiresAt) return tokens.accessToken;

        const client = resolveGoogleClient();
        if (!client) throw new GoogleAuthError("Missing Google client credentials.");

        refreshInFlight ??= refreshAccessToken(client, tokens.refreshToken)
          .then((next) => {
            set((state) => ({ google: { ...state.google, tokens: next } }));
            return next;
          })
          .finally(() => {
            refreshInFlight = null;
          });

        return (await refreshInFlight).accessToken;
      }

      /** Auth failures drop the session; the calendar selection is kept. */
      function handleGoogleError(error: unknown, fallback: string) {
        if (error instanceof GoogleAuthError) {
          set((state) => ({
            google: { ...state.google, connected: false, tokens: undefined },
            googleStatus: "error",
            googleError: "Google sign-in expired. Reconnect to keep importing.",
          }));
          return;
        }
        set({ googleStatus: "error", googleError: describeError(error, fallback) });
      }

      return {
        google: DEFAULT_GOOGLE,
        googleStatus: "disconnected",
        isImportingGoogle: false,
        importPastMonths: 3,
        importFutureMonths: 12,

        connectGoogle: async () => {
          if (get().googleStatus === "connecting") return;

          const client = resolveGoogleClient();
          if (!client) {
            set({
              googleStatus: "error",
              googleError:
                "Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET before connecting.",
            });
            return;
          }
          if (!isTauri()) {
            set({
              googleStatus: "error",
              googleError:
                "Connecting needs the desktop app — the OAuth redirect is caught by a local listener.",
            });
            return;
          }

          set({ googleStatus: "connecting", googleError: undefined });

          try {
            const codeVerifier = createCodeVerifier();
            const state = createState();
            const codeChallenge = await deriveCodeChallenge(codeVerifier);

            // Listen before opening the browser so a fast redirect is not
            // missed; awaited together so a bind failure is caught.
            const [result] = await Promise.all([
              invoke<OauthCallback>("google_oauth_listen", { timeoutSecs: 300 }),
              openUrl(
                buildAuthorizeUrl({ clientId: client.clientId, codeChallenge, state }),
              ),
            ]);

            if (result.error) throw new Error(`Google denied access: ${result.error}`);
            if (!result.code) throw new Error("Google did not return an authorization code.");
            if (result.state !== state) {
              throw new Error("Google returned a mismatched state value.");
            }

            const tokens = await exchangeCodeForTokens(client, {
              code: result.code,
              codeVerifier,
            });
            const { accountEmail, calendars } = await fetchCalendarList(
              tokens.accessToken,
            );

            set((current) => ({
              google: {
                ...current.google,
                connected: true,
                tokens,
                accountEmail,
                calendars: mergeCalendarSelection(current.google.calendars, calendars),
              },
              googleStatus: "connected",
              googleError: undefined,
            }));

            // Import straight away so connecting alone puts events on the calendar.
            await get().importGoogleEvents();
          } catch (error) {
            set({
              googleStatus: "error",
              googleError: describeError(error, "Could not connect to Google."),
            });
          }
        },

        disconnectGoogle: () => {
          const token = get().google.tokens?.refreshToken;
          // Best effort: revoking also clears the grant from the user's
          // Google account. A failure here must not block disconnecting.
          if (token) {
            void fetch(
              `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
              { method: "POST" },
            ).catch(() => undefined);
          }
          set({
            google: DEFAULT_GOOGLE,
            googleStatus: "disconnected",
            googleError: undefined,
          });
        },

        refreshGoogleCalendars: async () => {
          if (!get().google.tokens) return;
          try {
            const accessToken = await ensureAccessToken();
            const { accountEmail, calendars } = await fetchCalendarList(accessToken);
            set((state) => ({
              google: {
                ...state.google,
                accountEmail: accountEmail ?? state.google.accountEmail,
                calendars: mergeCalendarSelection(state.google.calendars, calendars),
              },
            }));
          } catch (error) {
            handleGoogleError(error, "Could not load your Google calendars.");
          }
        },

        importGoogleEvents: async () => {
          const { google, isImportingGoogle, importPastMonths, importFutureMonths } =
            get();
          if (!google.tokens || isImportingGoogle) return null;
          const enabled = google.calendars.filter((calendar) => calendar.enabled);
          if (enabled.length === 0) return { imported: 0, skipped: 0, calendars: 0 };

          set({ isImportingGoogle: true, googleError: undefined });
          try {
            const accessToken = await ensureAccessToken();
            const now = DateTime.local();
            const range = {
              timeMin: now.minus({ months: importPastMonths }).startOf("day").toJSDate(),
              timeMax: now.plus({ months: importFutureMonths }).endOf("day").toJSDate(),
            };

            const batches = await Promise.all(
              enabled.map((calendar) => fetchEvents(accessToken, calendar, range)),
            );
            // Dedupes on `icsUid`, so re-importing only adds new events.
            const { imported, skipped } = useTasksStore
              .getState()
              .importIcsTasks(batches.flat());

            set((state) => ({
              google: { ...state.google, lastImportAt: new Date().toISOString() },
              googleStatus: "connected",
            }));
            return { imported, skipped, calendars: enabled.length };
          } catch (error) {
            handleGoogleError(error, "Could not import from Google Calendar.");
            return null;
          } finally {
            set({ isImportingGoogle: false });
          }
        },

        setCalendarEnabled: (provider, calendarId, enabled) =>
          set((state) => {
            if (provider !== "google" || !state.google.connected) return state;
            return {
              google: {
                ...state.google,
                calendars: state.google.calendars.map((calendar) =>
                  calendar.id === calendarId ? { ...calendar, enabled } : calendar,
                ),
              },
            };
          }),

        setImportRange: (pastMonths, futureMonths) =>
          set({
            importPastMonths: Math.max(0, Math.min(pastMonths, 24)),
            importFutureMonths: Math.max(1, Math.min(futureMonths, 36)),
          }),

        lastIcsImportAt: undefined,
        lastIcsImportCount: undefined,

        markIcsImportComplete: (count) =>
          set({
            lastIcsImportAt: new Date().toISOString(),
            lastIcsImportCount: count,
          }),
      };
    },
    {
      name: STORAGE_KEY,
      // Status and in-flight flags are recomputed on launch.
      partialize: (state) => ({
        google: state.google,
        importPastMonths: state.importPastMonths,
        importFutureMonths: state.importFutureMonths,
        lastIcsImportAt: state.lastIcsImportAt,
        lastIcsImportCount: state.lastIcsImportCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Older builds persisted a mock connection with no tokens.
        if (state.google.connected && !state.google.tokens) {
          state.google = DEFAULT_GOOGLE;
        }
        if (state.google.tokens) state.googleStatus = "connected";
      },
    },
  ),
);

/** Keeps the user's on/off choices for calendars that still exist. */
function mergeCalendarSelection(
  previous: ConnectedCalendar[],
  next: ConnectedCalendar[],
): ConnectedCalendar[] {
  const enabledById = new Map(previous.map((calendar) => [calendar.id, calendar.enabled]));
  return next.map((calendar) => ({
    ...calendar,
    enabled: enabledById.get(calendar.id) ?? calendar.enabled,
  }));
}

export function formatLastImport(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
