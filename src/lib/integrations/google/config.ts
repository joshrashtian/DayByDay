/**
 * Google Calendar uses Authorization Code with PKCE through a "Desktop app"
 * OAuth client. Unlike Spotify, Google still expects that client's secret on
 * the token endpoint; Google documents it as non-confidential for installed
 * apps, so it ships in the build alongside the client ID.
 */

/** Must match `REDIRECT_PORT` in `src-tauri/src/google_calendar_oauth.rs`. */
export const GOOGLE_REDIRECT_PORT = 14566;

/**
 * Desktop-app clients accept any loopback port without registering it, but the
 * redirect URI sent to `/token` must match the one sent to `/auth` exactly.
 */
export const GOOGLE_REDIRECT_URI = `http://127.0.0.1:${GOOGLE_REDIRECT_PORT}`;

/** Read-only: calendar list and events, nothing else. */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export type GoogleClientConfig = {
  clientId: string;
  clientSecret: string;
};

export function resolveGoogleClient(): GoogleClientConfig | null {
  const clientId = (
    import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  )?.trim();
  const clientSecret = (
    import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string | undefined
  )?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}
