import { useTranslations } from "next-intl";
import { contactEmail, ISSUES_URL, mailtoHref } from "@/lib/contact";

/**
 * Under Log in: there is no reset by email yet, so a visitor who forgot their password asks the
 * operator (CONTACT_EMAIL), or the project's issues without an address. Rendered on the server,
 * where CONTACT_EMAIL is read.
 */
export function ForgotPassword() {
  const t = useTranslations("Account");
  const href = mailtoHref(contactEmail(), t("forgotSubject"), t("forgotBody"));

  return (
    <p className="text-center text-neutral-600">
      {t("forgotPassword")}{" "}
      {href ? (
        <a href={href} className="font-semibold text-brand">
          {t("forgotEmail")}
        </a>
      ) : (
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">
          {t("forgotIssues")}
        </a>
      )}
    </p>
  );
}
