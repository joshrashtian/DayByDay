import type { SpotifyAccount, SpotifyNowPlaying, SpotifyPlay, SpotifyTokens } from "@/types";
import {
  SPOTIFY_ACCOUNTS_BASE,
  SPOTIFY_API_BASE,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from "./config";

export class SpotifyAuthError extends Error {}
export class SpotifyRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Spotify rate limit reached.");
  }
}

// ── Authorization ─────────────────────────────────────────────────────────

export function buildAuthorizeUrl(options: {
  clientId: string;
  codeChallenge: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: options.codeChallenge,
    state: options.state,
    scope: SPOTIFY_SCOPES.join(" "),
  });
  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
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
    throw new SpotifyAuthError(`Spotify token request failed: ${detail}`);
  }
  return payload;
}

function toTokens(
  payload: TokenResponse,
  fallbackRefreshToken?: string,
): SpotifyTokens {
  const refreshToken = payload.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) {
    throw new SpotifyAuthError("Spotify did not return a refresh token.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken,
    // Expire a minute early so an in-flight request cannot land on a dead token.
    expiresAt: Date.now() + (payload.expires_in - 60) * 1000,
    scope: payload.scope ?? SPOTIFY_SCOPES.join(" "),
  };
}

export async function exchangeCodeForTokens(options: {
  clientId: string;
  code: string;
  codeVerifier: string;
}): Promise<SpotifyTokens> {
  const payload = await postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: options.code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: options.clientId,
      code_verifier: options.codeVerifier,
    }),
  );
  return toTokens(payload);
}

/** Spotify rotates PKCE refresh tokens, so the old one is only a fallback. */
export async function refreshAccessToken(options: {
  clientId: string;
  refreshToken: string;
}): Promise<SpotifyTokens> {
  const payload = await postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: options.refreshToken,
      client_id: options.clientId,
    }),
  );
  return toTokens(payload, options.refreshToken);
}

// ── Web API ───────────────────────────────────────────────────────────────

async function apiGet<T>(path: string, accessToken: string): Promise<T | null> {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 is Spotify's "nothing is playing".
  if (response.status === 204) return null;
  if (response.status === 401) {
    throw new SpotifyAuthError("Spotify access token rejected.");
  }
  if (response.status === 429) {
    throw new SpotifyRateLimitError(
      Number(response.headers.get("Retry-After") ?? "5") || 5,
    );
  }
  if (!response.ok) {
    throw new Error(`Spotify request failed (${response.status}) for ${path}`);
  }
  return (await response.json()) as T;
}

type ApiTrack = {
  id: string | null;
  name: string;
  duration_ms: number;
  album?: { name?: string; images?: { url: string; width: number }[] };
  artists?: { name: string }[];
  external_urls?: { spotify?: string };
};

/** Prefers the smallest image at least 160px wide; the rail renders them tiny. */
function pickArtwork(track: ApiTrack): string | undefined {
  const images = [...(track.album?.images ?? [])].sort(
    (a, b) => a.width - b.width,
  );
  return (images.find((image) => image.width >= 160) ?? images.at(-1))?.url;
}

function mapTrack(track: ApiTrack) {
  return {
    trackId: track.id ?? `${track.name}-${track.duration_ms}`,
    title: track.name,
    artists: (track.artists ?? []).map((artist) => artist.name).join(", "),
    album: track.album?.name ?? "",
    albumArtUrl: pickArtwork(track),
    durationMs: track.duration_ms,
    trackUrl: track.external_urls?.spotify,
  };
}

export async function fetchProfile(
  accessToken: string,
): Promise<SpotifyAccount> {
  const profile = await apiGet<{ id: string; display_name?: string }>(
    "/me",
    accessToken,
  );
  if (!profile) throw new Error("Spotify returned an empty profile.");
  return { id: profile.id, displayName: profile.display_name ?? undefined };
}

/**
 * Returns at most the 50 most recent plays. Spotify exposes no way to query
 * history by date, so callers accumulate their own log from repeated calls.
 * `afterMs` asks only for plays newer than a timestamp we already have.
 */
export async function fetchRecentlyPlayed(
  accessToken: string,
  afterMs?: number,
): Promise<SpotifyPlay[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (afterMs) params.set("after", String(afterMs));

  const payload = await apiGet<{
    items: { track: ApiTrack; played_at: string }[];
  }>(`/me/player/recently-played?${params.toString()}`, accessToken);

  return (payload?.items ?? [])
    .filter((item) => item.track && item.played_at)
    .map((item) => ({ ...mapTrack(item.track), playedAt: item.played_at }));
}

export async function fetchCurrentlyPlaying(
  accessToken: string,
): Promise<SpotifyNowPlaying | null> {
  const payload = await apiGet<{
    item: ApiTrack | null;
    progress_ms: number | null;
    is_playing: boolean;
    currently_playing_type?: string;
  }>("/me/player/currently-playing", accessToken);

  // Podcasts and local files arrive without a usable track object.
  if (!payload?.item) return null;
  return {
    ...mapTrack(payload.item),
    progressMs: payload.progress_ms ?? 0,
    isPlaying: Boolean(payload.is_playing),
  };
}
