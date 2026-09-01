import { useId, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const uid = useId();
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
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
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">
        {mode === "signUp" ? "Sign up" : "Sign in"}
      </h2>

      <div className="space-y-1">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      {error ? (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signUp" ? "signIn" : "signUp");
            setError(null);
          }}
          className="text-sm underline"
        >
          {mode === "signUp" ? "Have an account? Sign in" : "Need an account? Sign up"}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-ink px-3 py-1.5 text-sm text-white disabled:opacity-60"
        >
          {isSubmitting ? "…" : mode === "signUp" ? "Create account" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
