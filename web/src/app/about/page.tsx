import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/nav/BackLink";

export async function generateMetadata(): Promise<Metadata> {
  const [tPages, t] = await Promise.all([getTranslations("Pages"), getTranslations("About")]);
  return { title: tPages("about"), description: t("description"), alternates: { canonical: "/about" } };
}

/** About (MORE-01): what the service is and where its information comes from. */
export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-4 md:py-8">
      <div className="-mb-2 md:hidden">
        <BackLink fallbackHref="/more" />
      </div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p>{t("intro")}</p>
      <p>{t("audience")}</p>
      <h2 className="pt-2 text-lg font-bold">{t("sourcesTitle")}</h2>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>{t("places")}</li>
        <li>{t("events")}</li>
        <li>{t("notices")}</li>
      </ul>
      <p className="rounded-lg bg-neutral-100 px-4 py-3">{t("original")}</p>
    </article>
  );
}
