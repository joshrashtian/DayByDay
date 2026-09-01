import { useId, useState } from "react";
import { useProfile } from "@/providers/ProfileProvider";
import { useAuthStore } from "@/stores/authStore";
import { useSyncStatus } from "@/lib/tasksSync";

function AccountForm() {
  const uid = useId();
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      const { error } =
        mode === "signUp"
          ? await signUp(email, password)
          : await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
      if (mode === "signUp") {
        setNotice("Account created. Check your email if confirmation is required.");
      }
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor={emailId}
          className="text-sm font-medium text-muted"
        >
          Email
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={passwordId}
          className="text-sm font-medium text-muted"
        >
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60"
        >
          {isSubmitting
            ? "Please wait…"
            : mode === "signUp"
              ? "Create account"
              : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signUp" ? "signIn" : "signUp");
            setError(null);
            setNotice(null);
          }}
          className="text-sm font-medium text-muted underline-offset-2 hover:underline"
        >
          {mode === "signUp"
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </form>
  );
}

function SyncStatusLine() {
  const status = useSyncStatus();

  const label =
    status === "syncing"
      ? "Syncing…"
      : status === "offline"
        ? "Offline — changes will sync when you're back online"
        : status === "error"
          ? "Last sync failed — will retry automatically"
          : status === "synced"
            ? "Synced"
            : "Idle";

  const tone =
    status === "error"
      ? "text-red-600 dark:text-red-400"
      : status === "synced"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted";

  return (
    <p className={`text-sm ${tone}`} role="status">
      {label}
    </p>
  );
}

export function ProfileSection() {
  const { profile } = useProfile();
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted">
          Your local RiseByDay profile.
        </p>
      </div>

      <dl className="rounded-2xl border border-line/80 bg-surface/70 p-4 dark:bg-overlay">
        <div className="grid gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Name
          </dt>
          <dd className="text-base text-ink">
            {profile?.name ?? "RiseByDay User"}
          </dd>
        </div>
        <div className="mt-4 grid gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </dt>
          <dd className="text-base text-ink">
            {profile?.email ?? "you@example.com"}
          </dd>
        </div>
      </dl>

      <section className="overflow-hidden rounded-2xl border border-line/80 bg-surface/70 dark:bg-overlay">
        <div className="border-b border-line px-4 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">
            Account & sync
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            Sign in to sync your tasks across devices. Everything keeps working
            offline whether you're signed in or not.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          {authStatus === "loading" ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : authStatus === "signedIn" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Signed in as{" "}
                <span className="font-medium">{authUser?.email}</span>
              </p>
              <SyncStatusLine />
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <AccountForm />
          )}
        </div>
      </section>
    </div>
  );
}
