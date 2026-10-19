import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

// The contact address comes from CONTACT_EMAIL when the page is requested, not when it is built.
export const dynamic = "force-dynamic";

/** The date of this version. Change it with the text. */
const UPDATED = "2026-10-19T00:00:00+13:00";

export async function generateMetadata(): Promise<Metadata> {
  const [tPages, t] = await Promise.all([getTranslations("Pages"), getTranslations("Privacy")]);
  return { title: tPages("privacy"), description: t("description"), alternates: { canonical: "/privacy" } };
}

/** Privacy Policy (MORE-03): what is collected, why, and how to have it removed. */
export default function PrivacyPage() {
  const tPages = useTranslations("Pages");
  const t = useTranslations("Privacy");

  return (
    <LegalPage title={tPages("privacy")} updated={UPDATED}>
      <p>{t("intro")}</p>
      <LegalSection title={t("collectTitle")}>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>{t("account")}</li>
          <li>{t("tokens")}</li>
          <li>{t("logs")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("locationTitle")}>
        <p>{t("location")}</p>
      </LegalSection>
      <LegalSection title={t("cookiesTitle")}>
        <p>{t("cookies")}</p>
      </LegalSection>
      <LegalSection title={t("providersTitle")}>
        <p>{t("providers")}</p>
      </LegalSection>
      <LegalSection title={t("keepTitle")}>
        <p>{t("keep")}</p>
      </LegalSection>
      <LegalSection title={t("choicesTitle")}>
        <p>{t("choices")}</p>
      </LegalSection>
    </LegalPage>
  );
}
