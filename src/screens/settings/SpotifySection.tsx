import { useId, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { openUrl } from "@tauri-apps/plugin-opener";
import spotifyIcon from "@/assets/spotifysvg.svg";
import {
  hasEnvClientId,
  resolveClientId,
  SPOTIFY_REDIRECT_URI,
} from "@/lib/integrations/spotify/config";
import { formatListeningDuration } from "@/lib/integrations/spotify/history";
import { useSpotifyStore } from "@/stores/spotifyStore";
import Container from "@/ui/settings/Container";
import SettingsHeader from "@/ui/settings/Header";
import {
  IoCheckmarkCircle,
  IoConstructOutline,
  IoOpenOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";

const SPOTIFY_DASHBOARD_URL = "https://developer.spotify.com/dashboard";

const secondaryButton =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink disabled:opacity-50";

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold tabular-nums text-ink"
        aria-hidden
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <p className="text-sm font-medium text-ink">{title}</p>
        <div className="space-y-2 text-xs leading-relaxed text-muted">
          {children}
        </div>
      </div>
    </li>
  );
}

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

  const hasClientId = Boolean(resolveClientId(clientIdOverride));

  const [clientIdDraft, setClientIdDraft] = useState(clientIdOverride ?? "");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  // The guide is only needed until there is a client ID to connect with.
  const [showGuide, setShowGuide] = useState(!hasClientId);

  const totalMs = plays.reduce((sum, play) => sum + play.durationMs, 0);
  const clientIdInputId = `${uid}-client-id`;

  const copyRedirectUri = async () => {
    await navigator.clipboard.writeText(SPOTIFY_REDIRECT_URI);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const saveClientId = (event: React.FormEvent) => {
    event.preventDefault();
    setClientIdOverride(clientIdDraft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="space-y-5">
      <SettingsHeader>
        <div className="flex items-start gap-3">
          <img src={spotifyIcon} alt="" className="mt-1 size-6" aria-hidden />
          <div>
            <SettingsHeader.Title className="text-2xl font-semibold text-ink">
              Spotify
            </SettingsHeader.Title>
            <SettingsHeader.Subtitle>
              See the music you listened to right next to your calendar.
              RiseByDay can only read your listening history — it can't play,
              pause, or change anything in your account.
            </SettingsHeader.Subtitle>
          </div>
        </div>
      </SettingsHeader>

      {/* ── Account ───────────────────────────────────────────────────── */}
      <Container>
        <Container.Header icon={<IoPersonCircleOutline />} heading="Your account" />
        <Container.Body className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {isConnected
                  ? `Connected as ${account?.displayName ?? account?.id ?? "your Spotify account"}`
                  : "Not connected"}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {isConnected
                  ? "Your plays are being saved while RiseByDay is open."
                  : hasClientId
                    ? "Your browser will open so you can sign in to Spotify. Come back here when it says you're done."
                    : "Finish the one-time setup below, then connect."}
              </p>
            </div>

            {isConnected ? (
              <button type="button" onClick={disconnect} className={secondaryButton}>
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void connect()}
                disabled={status === "connecting" || !hasClientId}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#1ED760] disabled:opacity-50"
              >
                <img src={spotifyIcon} alt="" className="size-4 brightness-0" aria-hidden />
                {status === "connecting" ? "Waiting for Spotify…" : "Connect Spotify"}
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
              {!isConnected && hasClientId
                ? " — if Spotify says your account isn't allowed, check step 3 of the setup."
                : null}
            </p>
          )}
        </Container.Body>
      </Container>

      {/* ── History ───────────────────────────────────────────────────── */}
      {(isConnected || plays.length > 0) && (
        <Container>
          <Container.Header icon={<IoTimeOutline />} heading="Listening history" />
          <Container.Body className="px-4 py-4">
            <p className="text-xs leading-relaxed text-muted">
              Spotify only shares your 50 most recent songs, so RiseByDay keeps
              its own running log while the app is open. Your history starts
              from the day you connected.
            </p>

            <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-sunken px-2 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Songs
                </dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                  {plays.length}
                </dd>
              </div>
              <div className="rounded-lg bg-sunken px-2 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Listening time
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
          </Container.Body>

          <Container.Footer className="justify-between px-4">
            <p className="text-[11px] text-muted">
              {lastSyncedAt
                ? `Last updated ${new Date(lastSyncedAt).toLocaleTimeString(undefined, { timeStyle: "short" })}`
                : "Not updated yet"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void syncHistory()}
                disabled={!isConnected}
                className={secondaryButton}
              >
                Update now
              </button>
              <button
                type="button"
                onClick={clearHistory}
                disabled={plays.length === 0}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
              >
                Clear history
              </button>
            </div>
          </Container.Footer>
        </Container>
      )}

      {/* ── Setup ─────────────────────────────────────────────────────── */}
      <Container>
        <Container.Header icon={<IoConstructOutline />} heading="One-time setup" />
        <Container.Body className="space-y-4 px-4 py-4">
          {hasClientId && (
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm text-ink">
                <IoCheckmarkCircle className="size-4 shrink-0 text-emerald-500" aria-hidden />
                {clientIdOverride?.trim()
                  ? "Set up with your own Spotify app."
                  : hasEnvClientId()
                    ? "Already set up — nothing to do here."
                    : "Set up."}
              </p>
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                className={secondaryButton}
              >
                {showGuide ? "Hide steps" : "Use a different app"}
              </button>
            </div>
          )}

          {showGuide && (
            <>
              <p className="text-xs leading-relaxed text-muted">
                Spotify needs a free "app" registered under your account before
                anything can read your history. It takes about two minutes and
                you only do it once.
              </p>

              <ol className="space-y-5">
                <Step n={1} title="Create an app on Spotify's developer site">
                  <p>
                    Log in with your normal Spotify account, click{" "}
                    <strong className="font-semibold text-ink">Create app</strong>,
                    and give it any name and description (e.g. "My RiseByDay").
                  </p>
                  <button
                    type="button"
                    onClick={() => void openUrl(SPOTIFY_DASHBOARD_URL)}
                    className={secondaryButton}
                  >
                    Open Spotify dashboard
                    <IoOpenOutline className="size-3.5" aria-hidden />
                  </button>
                </Step>

                <Step n={2} title="Paste this address as the Redirect URI">
                  <p>
                    On the same form, paste it into{" "}
                    <strong className="font-semibold text-ink">Redirect URIs</strong>{" "}
                    and click Add. It must match exactly. Then tick{" "}
                    <strong className="font-semibold text-ink">Web API</strong>,
                    accept the terms, and save.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-sunken px-3 py-2 font-mono text-xs text-ink">
                      {SPOTIFY_REDIRECT_URI}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyRedirectUri()}
                      className={secondaryButton}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </Step>

                <Step n={3} title="Allow your Spotify account to use it">
                  <p>
                    Open your new app's{" "}
                    <strong className="font-semibold text-ink">Settings → User Management</strong>{" "}
                    and add the name and email of your Spotify account. New
                    Spotify apps only work for people listed there.
                  </p>
                </Step>

                <Step n={4} title="Copy the Client ID into RiseByDay">
                  <p>
                    It's on your app's{" "}
                    <strong className="font-semibold text-ink">Settings</strong>{" "}
                    page. It isn't a password, so it's safe to keep here.
                  </p>
                  <form onSubmit={saveClientId} className="flex items-center gap-2">
                    <label htmlFor={clientIdInputId} className="sr-only">
                      Client ID
                    </label>
                    <input
                      id={clientIdInputId}
                      value={clientIdDraft}
                      onChange={(event) => setClientIdDraft(event.target.value)}
                      placeholder="Paste Client ID"
                      spellCheck={false}
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-ink outline-none ring-accent/40 focus:ring-2"
                    />
                    <button type="submit" className={secondaryButton}>
                      {saved ? "Saved!" : "Save"}
                    </button>
                  </form>
                </Step>
              </ol>

              <p className="text-xs text-muted">
                That's it — scroll up and click{" "}
                <strong className="font-semibold text-ink">Connect Spotify</strong>.
              </p>
            </>
          )}
        </Container.Body>
      </Container>
    </div>
  );
}
