import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchCurrentlyPlaying,
  fetchProfile,
  fetchRecentlyPlayed,
  refreshAccessToken,
  SpotifyAuthError,
  SpotifyRateLimitError,
} from "@/lib/integrations/spotify/api";
import { resolveClientId } from "@/lib/integrations/spotify/config";
import {
  latestPlayedAtMs,
  mergePlays,
} from "@/lib/integrations/spotify/history";
import {
  createCodeVerifier,
  createState,
  deriveCodeChallenge,
} from "@/lib/integrations/spotify/pkce";
import { isTauri } from "@/lib/tauriEnv";
import type {
  SpotifyAccount,
  SpotifyNowPlaying,
  SpotifyPlay,
  SpotifyTokens,
} from "@/types";

const STORAGE_KEY = "risebyday-spotify";

type OauthCallback = {
  code: string | null;
  state: string | null;
  error: string | null;
};

export type SpotifyStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

type SpotifyState = {
  /** Optional override for `VITE_SPOTIFY_CLIENT_ID`, set in Settings. */
  clientIdOverride?: string;
  tokens?: SpotifyTokens;
  account?: SpotifyAccount;
  /**
   * Append-only local log, newest first. Spotify has no history-by-date API,
   * so this is accumulated by polling and is the only long-term record.
   */
  plays: SpotifyPlay[];
  /** Epoch ms of the first successful poll — history cannot predate it. */
  historyStartedAt?: number;
  lastSyncedAt?: number;

  status: SpotifyStatus;
  error?: string;
  nowPlaying?: SpotifyNowPlaying | null;
  isSyncing: boolean;

  setClientIdOverride: (clientId: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearHistory: () => void;
  syncHistory: () => Promise<void>;
};

/** Serialises refreshes so parallel callers cannot burn the rotated token. */
let refreshInFlight: Promise<SpotifyTokens> | null = null;

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => {
      /** Returns a live access token, refreshing (and rotating) if needed. */
      async function ensureAccessToken(): Promise<string> {
        const { tokens, clientIdOverride } = get();
        if (!tokens) throw new SpotifyAuthError("Spotify is not connected.");
        if (Date.now() < tokens.expiresAt) return tokens.accessToken;

        const clientId = resolveClientId(clientIdOverride);
        if (!clientId) throw new SpotifyAuthError("Missing Spotify client ID.");

        refreshInFlight ??= refreshAccessToken({
          clientId,
          refreshToken: tokens.refreshToken,
        })
          .then((next) => {
            set({ tokens: next });
            return next;
          })
          .finally(() => {
            refreshInFlight = null;
          });

        return (await refreshInFlight).accessToken;
      }

      return {
        plays: [],
        status: "disconnected",
        isSyncing: false,
        nowPlaying: null,

        setClientIdOverride: (clientId) =>
          set({ clientIdOverride: clientId.trim() || undefined }),

        connect: async () => {
          if (get().status === "connecting") return;

          const clientId = resolveClientId(get().clientIdOverride);
          if (!clientId) {
            set({
              status: "error",
              error:
                "Add your Spotify client ID in Settings before connecting.",
            });
            return;
          }
          if (!isTauri()) {
            set({
              status: "error",
              error:
                "Connecting needs the desktop app — the OAuth redirect is caught by a local listener.",
            });
            return;
          }

          set({ status: "connecting", error: undefined });

          try {
            const codeVerifier = createCodeVerifier();
            const state = createState();
            const codeChallenge = await deriveCodeChallenge(codeVerifier);

            // Start listening *before* opening the browser, otherwise a fast
            // redirect can arrive before the port is bound.
            const callback = invoke<OauthCallback>("spotify_oauth_listen", {
              timeoutSecs: 300,
            });

            await openUrl(buildAuthorizeUrl({ clientId, codeChallenge, state }));
            const result = await callback;

            if (result.error) throw new Error(`Spotify denied access: ${result.error}`);
            if (!result.code) throw new Error("Spotify did not return an authorization code.");
            if (result.state !== state) {
              throw new Error("Spotify returned a mismatched state value.");
            }

            const tokens = await exchangeCodeForTokens({
              clientId,
              code: result.code,
              codeVerifier,
            });
            const account = await fetchProfile(tokens.accessToken);

            set({
              tokens,
              account,
              status: "connected",
              error: undefined,
              historyStartedAt: get().historyStartedAt ?? Date.now(),
            });

            await get().syncHistory();
          } catch (error) {
            set({
              status: "error",
              error:
                error instanceof Error ? error.message : "Could not connect to Spotify.",
            });
          }
        },

        disconnect: () =>
          set({
            tokens: undefined,
            account: undefined,
            status: "disconnected",
            error: undefined,
            nowPlaying: null,
          }),

        // The log is kept on disconnect — it is unrecoverable once dropped.
        clearHistory: () =>
          set({ plays: [], historyStartedAt: undefined, lastSyncedAt: undefined }),

        syncHistory: async () => {
          const { tokens, isSyncing, plays } = get();
          if (!tokens || isSyncing) return;

          set({ isSyncing: true });
          try {
            const accessToken = await ensureAccessToken();

            // `after` keeps the response to plays we have not logged yet. On a
            // first sync we take the full window Spotify will give us.
            const cursor = latestPlayedAtMs(plays);
            const [incoming, nowPlaying] = await Promise.all([
              fetchRecentlyPlayed(accessToken, cursor),
              fetchCurrentlyPlaying(accessToken).catch(() => null),
            ]);

            set({
              plays: mergePlays(plays, incoming),
              nowPlaying,
              lastSyncedAt: Date.now(),
              status: "connected",
              error: undefined,
              historyStartedAt: get().historyStartedAt ?? Date.now(),
            });
          } catch (error) {
            if (error instanceof SpotifyRateLimitError) {
              // Transient and self-correcting; the next poll backs off anyway.
              return;
            }
            if (error instanceof SpotifyAuthError) {
              set({
                tokens: undefined,
                account: undefined,
                status: "error",
                error: "Spotify sign-in expired. Reconnect to keep logging plays.",
              });
              return;
            }
            set({
              status: "error",
              error:
                error instanceof Error ? error.message : "Could not reach Spotify.",
            });
          } finally {
            set({ isSyncing: false });
          }
        },
      };
    },
    {
      name: STORAGE_KEY,
      // Transient fields are recomputed on launch; only durable state persists.
      partialize: (state) => ({
        clientIdOverride: state.clientIdOverride,
        tokens: state.tokens,
        account: state.account,
        plays: state.plays,
        historyStartedAt: state.historyStartedAt,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens) state.status = "connected";
      },
    },
  ),
);

export function selectIsSpotifyConnected(state: SpotifyState): boolean {
  return Boolean(state.tokens);
}
