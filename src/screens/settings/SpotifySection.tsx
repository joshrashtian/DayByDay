import { useId, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import spotifyIcon from "@/assets/spotifysvg.svg";
import {
  hasEnvClientId,
  resolveClientId,
  SPOTIFY_REDIRECT_URI,
} from "@/lib/integrations/spotify/config";
import { formatListeningDuration } from "@/lib/integrations/spotify/history";
import { useSpotifyStore } from "@/stores/spotifyStore";

export function SpotifySection() {
  const uid = useId();
  const {
    account,
    status,
    error,
    plays,
    lastSyncedAt,
    historyStartedAt,
    clientIdOverride,
    isConnected,
    connect,
    disconnect,
    clearHistory,
    setClientIdOverride,
    syncHistory,
  } = useSpotifyStore(
    useShallow((s) => ({
      account: s.account,
      status: s.status,
      error: s.error,
      plays: s.plays,
      lastSyncedAt: s.lastSyncedAt,
      historyStartedAt: s.historyStartedAt,
      clientIdOverride: s.clientIdOverride,
      isConnected: Boolean(s.tokens),
      connect: s.connect,
      disconnect: s.disconnect,
      clearHistory: s.clearHistory,
      setClientIdOverride: s.setClientIdOverride,
      syncHistory: s.syncHistory,
    })),
  );

  const [clientIdDraft, setClientIdDraft] = useState(clientIdOverride ?? "");
  const [copied, setCopied] = useState(false);

  const hasClientId = Boolean(resolveClientId(clientIdOverride));
  const totalMs = plays.reduce((sum, play) => sum + play.durationMs, 0);

  const copyRedirectUri = async () => {
    await navigator.clipboard.writeText(SPOTIFY_REDIRECT_URI);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <img src={spotifyIcon} alt="" className="mt-1 h-6 w-6" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-ink">Spotify</h2>
          <p className="mt-1 text-sm text-muted">
            Logs what you listen to so it can appear beside your calendar.
            Read-only — RiseByDay never controls playback.
          </p>
        </div>
      </header>

      {/* ── Setup ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink">Developer app</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Create an app at developer.spotify.com/dashboard and add this exact
          redirect URI. Spotify matches it as a literal string, so the port and
          the <code className="font-mono">127.0.0.1</code> host must match.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-sunken px-3 py-2 font-mono text-xs text-ink">
            {SPOTIFY_REDIRECT_URI}
          </code>
          <button
            type="button"
            onClick={() => void copyRedirectUri()}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <label
          htmlFor={`${uid}-client-id`}
          className="mt-4 block text-xs font-semibold text-ink"
        >
          Client ID
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            id={`${uid}-client-id`}
            value={clientIdDraft}
            onChange={(event) => setClientIdDraft(event.target.value)}
            onBlur={() => setClientIdOverride(clientIdDraft)}
            placeholder={
              hasEnvClientId()
                ? "Using VITE_SPOTIFY_CLIENT_ID from the build"
                : "Paste your Spotify client ID"
            }
            spellCheck={false}
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-ink outline-none ring-sky-400/40 focus:ring-2"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Safe to store here — the PKCE flow uses no client secret.
        </p>
      </section>

      {/* ── Connection ────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">
              {isConnected ? "Connected" : "Not connected"}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted">
              {isConnected
                ? (account?.displayName ?? account?.id ?? "Spotify account")
                : "Authorize in your browser to start logging plays."}
            </p>
          </div>

          {isConnected ? (
            <button
              type="button"
              onClick={disconnect}
              className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={status === "connecting" || !hasClientId}
              className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {status === "connecting" ? "Waiting for Spotify…" : "Connect"}
            </button>
          )}
        </div>

        {!hasClientId && (
          <p className="mt-3 text-xs text-muted">
            Add a client ID above to enable connecting.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </section>

      {/* ── History ───────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink">Listening history</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Spotify only returns your last 50 plays and cannot be queried by date,
          so RiseByDay keeps its own log, topped up while the app is open. Days
          before you connected cannot be backfilled.
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-sunken px-2 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted">
              Plays
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
              {plays.length}
            </dd>
          </div>
          <div className="rounded-lg bg-sunken px-2 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted">
              Logged
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {formatListeningDuration(totalMs)}
            </dd>
          </div>
          <div className="rounded-lg bg-sunken px-2 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted">
              Since
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {historyStartedAt
                ? new Date(historyStartedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted">
            {lastSyncedAt
              ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString(undefined, { timeStyle: "short" })}`
              : "Not synced yet"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void syncHistory()}
              disabled={!isConnected}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink disabled:opacity-50"
            >
              Sync now
            </button>
            <button
              type="button"
              onClick={clearHistory}
              disabled={plays.length === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
            >
              Clear log
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
