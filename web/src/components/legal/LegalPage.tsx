import { formatDate } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BackLink } from "@/components/nav/BackLink";
import { contactEmail } from "@/lib/contact";

const ISSUES = "https://github.com/Nick-ugi/Local-Platform/issues";

const linkClass = "font-semibold underline";

/**
 * The frame of Privacy Policy and Terms (MORE-03): a way back to More, the title, the date of the
 * version, the text, and how to reach the operator (CONTACT_EMAIL, or the project's issues).
 */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const t = useTranslations("Legal");
  const email = contactEmail();

  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-4 md:py-8">
      <div className="-mb-2 md:hidden">
        <BackLink fallbackHref="/more" />
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-neutral-500">{t("lastUpdated", { date: formatDate(updated) })}</p>
      {children}
      <p className="rounded-lg bg-neutral-100 px-4 py-3">
        {email
          ? t.rich("contactEmail", {
              email,
              link: (chunks) => (
                <a href={`mailto:${email}`} className={linkClass}>
                  {chunks}
                </a>
              ),
            })
          : t.rich("contactIssues", {
              link: (chunks) => (
                <a href={ISSUES} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {chunks}
                </a>
              ),
            })}
      </p>
    </article>
  );
}

/** A titled part of a legal page. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="pt-2 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
