"use client";

import type { AuthUser } from "@queenstown/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getAccount, logOut } from "@/lib/auth/account";

const rowClass = "flex min-h-14 w-full items-center justify-between px-4 font-semibold";

function Chevron() {
  return (
    <span aria-hidden="true" className="text-xl text-neutral-500">
      ›
    </span>
  );
}

/**
 * The account rows of More (wireframe m-more, 2): "Log in" and Favorites for a visitor, the
 * account, Favorites and "Log out" once signed in (USER-02, FAV-02).
 */
export function AccountMenu() {
  const t = useTranslations("Account");
  const router = useRouter();
  const [account, setAccount] = useState<AuthUser | null | undefined>(undefined);

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

  async function signOut() {
    await logOut().catch(() => undefined);
    setAccount(null);
    router.refresh();
  }

  if (account === undefined) {
    // Holds the rows' place while the account is looked up.
    return <li aria-hidden="true" className="min-h-28" />;
  }

  return (
    <>
      {account ? (
        <li className="flex min-h-14 items-center justify-between gap-3 px-4">
          <span className="min-w-0 truncate text-neutral-600">{t("signedInAs", { email: account.email })}</span>
          <button type="button" onClick={() => void signOut()} className="min-h-11 shrink-0 font-semibold underline">
            {t("logout")}
          </button>
        </li>
      ) : (
        <li>
          <Link href="/login?next=%2Fmore" className={rowClass}>
            {t("login")}
            <Chevron />
          </Link>
        </li>
      )}
      <li>
        <Link href="/favorites" className={rowClass}>
          {t("favorites")}
          <Chevron />
        </Link>
      </li>
    </>
  );
}
