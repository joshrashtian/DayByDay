/**
 * Spotify uses Authorization Code with PKCE here: this is a desktop app, so
 * there is no safe place to keep a client secret and none is used.
 */

/** Must match `REDIRECT_PORT` in `src-tauri/src/spotify_oauth.rs`. */
export const SPOTIFY_REDIRECT_PORT = 14565;

/**
 * Spotify matches redirect URIs as exact strings and only permits plain HTTP
 * for loopback addresses. It must be `127.0.0.1` — `localhost` is no longer
 * accepted — and this exact string has to be registered in the dashboard.
 */
export const SPOTIFY_REDIRECT_URI = `http://127.0.0.1:${SPOTIFY_REDIRECT_PORT}/callback`;

/** Read-only: enough to read listening history and the current track. */
export const SPOTIFY_SCOPES = [
  "user-read-recently-played",
  "user-read-currently-playing",
] as const;

export const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const ENV_CLIENT_ID = (
  import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
)?.trim();

/**
 * The client ID may come from the build env or be pasted into Settings, so the
 * app stays usable without rebuilding. It is not a secret under PKCE.
 */
export function resolveClientId(stored?: string): string | null {
  const candidate = stored?.trim() || ENV_CLIENT_ID || "";
  return candidate.length > 0 ? candidate : null;
}

export function hasEnvClientId(): boolean {
  return Boolean(ENV_CLIENT_ID);
}
