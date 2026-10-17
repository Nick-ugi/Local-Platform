import { ApiError } from "@queenstown/shared";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import { NotAdminError } from "./session";

/** Admin Login (wireframe ad-login, ADMIN-01). Only an account with the admin role gets in. */
export function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Back to the screen that asked for the sign-in.
  const from = (location.state as { from?: string } | null)?.from ?? "/places";
  if (auth.status === "signedIn") {
    return <Navigate to={from} replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.login(email.trim(), password);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Admin</h1>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-neutral-400 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-neutral-400 px-3 py-2 font-normal"
          />
        </label>
        <p role="alert" className="min-h-5 text-sm text-red-700">
          {error}
        </p>
        <button
          type="submit"
          disabled={busy || auth.status === "checking"}
          className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Log in
        </button>
      </form>
    </main>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof NotAdminError) {
    return "This account cannot use the admin.";
  }
  if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
    return "The email or password is wrong.";
  }
  return "We couldn't sign you in. Check that the backend is running and try again.";
}
