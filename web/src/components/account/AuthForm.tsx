"use client";

import { ApiError } from "@queenstown/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { logIn, signUp } from "@/lib/auth/account";
import { safeNext } from "@/lib/auth/next";

type Mode = "login" | "signup";

const inputClass = "h-11 rounded-lg border border-neutral-400 px-3 aria-[invalid=true]:border-red-700";

/**
 * Log in and Sign up (wireframe m-login, USER-01, USER-02): the same form, only the button and the
 * link below change. Afterwards the visitor goes back to the screen they came from (?next=).
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field: "email" | "password" | null; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (mode === "login" ? logIn : signUp)(email.trim(), password);
      router.replace(next);
      router.refresh();
    } catch (cause) {
      setError(errorFor(cause));
      setBusy(false);
    }
  }

  function errorFor(cause: unknown): { field: "email" | "password" | null; text: string } {
    if (cause instanceof ApiError) {
      if (cause.code === "INVALID_CREDENTIALS") return { field: null, text: t("wrongCredentials") };
      if (cause.code === "EMAIL_ALREADY_USED") return { field: "email", text: t("emailUsed") };
      if (cause.code === "TOO_MANY_REQUESTS") return { field: null, text: t("tooMany") };
      if (cause.code === "VALIDATION_FAILED") {
        const field = cause.errors[0]?.field;
        return field === "password"
          ? { field: "password", text: t("shortPassword") }
          : { field: "email", text: t("invalidEmail") };
      }
    }
    return { field: null, text: t("failed") };
  }

  const other = mode === "login" ? "/signup" : "/login";
  const otherHref = params.get("next") ? `${other}?next=${encodeURIComponent(next)}` : other;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-semibold">
        {t("email")}
        <input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error?.field === "email" ? true : undefined}
          className={`${inputClass} font-normal`}
          required
        />
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="font-semibold">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error?.field === "password" ? true : undefined}
          aria-describedby={mode === "signup" ? "password-hint" : undefined}
          className={inputClass}
          required
        />
        {mode === "signup" ? (
          <span id="password-hint" className="text-sm text-neutral-600">
            {t("passwordHint")}
          </span>
        ) : null}
      </div>
      <p role="alert" className="text-sm text-red-700 empty:hidden">
        {error?.text}
      </p>
      <button
        type="submit"
        disabled={busy}
        className="h-12 rounded-lg bg-neutral-950 font-semibold text-white disabled:opacity-60"
      >
        {mode === "login" ? t("login") : t("signup")}
      </button>
      <p className="text-center text-neutral-600">
        {mode === "login" ? t("newHere") : t("haveAccount")}{" "}
        <Link href={otherHref} className="font-semibold text-blue-700">
          {mode === "login" ? t("createAccount") : t("login")}
        </Link>
      </p>
    </form>
  );
}
