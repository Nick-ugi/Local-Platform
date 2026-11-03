import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { DeleteAccountView } from "@/components/account/DeleteAccountView";
import { BackLink } from "@/components/nav/BackLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  // Not a page for search engines (docs/02-information-architecture.md, section 3).
  return { title: t("deleteAccount"), robots: { index: false, follow: false } };
}

/**
 * Delete account: the web address Google Play asks for, where a visitor can delete the account they
 * made in the app or on the site.
 */
export default function DeleteAccountPage() {
  const t = useTranslations("Account");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-4 md:py-10">
      <div className="flex items-center gap-2">
        <BackLink fallbackHref="/more" />
      </div>
      <h1 className="text-2xl font-bold">{t("deleteTitle")}</h1>
      <DeleteAccountView />
    </div>
  );
}
