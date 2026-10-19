import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

// The contact address comes from CONTACT_EMAIL when the page is requested, not when it is built.
export const dynamic = "force-dynamic";

/** The date of this version. Change it with the text. */
const UPDATED = "2026-10-19T00:00:00+13:00";

export async function generateMetadata(): Promise<Metadata> {
  const [tPages, t] = await Promise.all([getTranslations("Pages"), getTranslations("Terms")]);
  return { title: tPages("terms"), description: t("description"), alternates: { canonical: "/terms" } };
}

/** Terms of Use (MORE-03): the information is borrowed, the original is right, the account is yours. */
export default function TermsPage() {
  const tPages = useTranslations("Pages");
  const t = useTranslations("Terms");

  return (
    <LegalPage title={tPages("terms")} updated={UPDATED}>
      <p>{t("intro")}</p>
      <LegalSection title={t("informationTitle")}>
        <p>{t("information")}</p>
        <p>{t("official")}</p>
      </LegalSection>
      <LegalSection title={t("accountTitle")}>
        <p>{t("account")}</p>
      </LegalSection>
      <LegalSection title={t("linksTitle")}>
        <p>{t("links")}</p>
      </LegalSection>
      <LegalSection title={t("changesTitle")}>
        <p>{t("changes")}</p>
      </LegalSection>
    </LegalPage>
  );
}
