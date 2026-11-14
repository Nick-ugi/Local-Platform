"use client";

import { ApiError, type AuthUser } from "@queenstown/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { deleteAccount, getAccount } from "@/lib/auth/account";
import { loginPath } from "@/lib/auth/next";

const inputClass = "h-11 rounded-lg border border-neutral-400 px-3 aria-[invalid=true]:border-red-700";

/**
 * Deleting one's own account (Google Play asks apps with sign up for this, in the app and at a web
 * address; this page is that address). It says what goes, takes the password again and confirms.
 * A visitor who is not signed in is sent to Log in and back here.
 */
export function DeleteAccountView() {
  const t = useTranslations("Account");
  const tState = useTranslations("State");
  const router = useRouter();
  const [account, setAccount] = useState<AuthUser | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    let gone = false;
    getAccount().then(
      (user) => !gone && setAccount(user),
      () => !gone && setAccount(null),
    );
    return () => {
      gone = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await deleteAccount(password);
      setDeleted(true);
      // The menus read the session again: it is gone.
      router.refresh();
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : null;
      setProblem(
        code === "WRONG_PASSWORD" ? t("wrongPassword") : code === "TOO_MANY_REQUESTS" ? t("tooMany") : t("deleteFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (deleted) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t("deleted")}</h2>
        <Link href="/" className="font-semibold text-brand underline">
          {tState("goToMap")}
        </Link>
      </section>
    );
  }
  if (account === undefined) {
    return <p className="text-neutral-600">{tState("loading")}</p>;
  }
  if (account === null) {
    return (
      <section className="flex flex-col gap-4">
        <p>{t("deleteLogin")}</p>
        <Link
          href={loginPath("/account/delete")}
          className="flex h-12 items-center justify-center rounded-lg bg-brand font-semibold text-white"
        >
          {t("login")}
        </Link>
      </section>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p>{t("deleteBody", { email: account.email })}</p>
      <label className="flex flex-col gap-1 font-semibold">
        {t("password")}
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={problem === t("wrongPassword")}
          className={`${inputClass} font-normal`}
        />
      </label>
      <p role="alert" className="text-sm text-red-700 empty:hidden">
        {problem}
      </p>
      <button
        type="submit"
        disabled={busy || password === ""}
        className="h-12 rounded-lg bg-red-700 font-semibold text-white disabled:opacity-60"
      >
        {t("deleteConfirm")}
      </button>
    </form>
  );
}
