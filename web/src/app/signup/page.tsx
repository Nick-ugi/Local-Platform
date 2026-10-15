import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";
import { BackLink } from "@/components/nav/BackLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  // Not a page for search engines (docs/02-information-architecture.md, section 3).
  return { title: t("signup"), robots: { index: false, follow: false } };
}

/** Sign up (wireframe m-login with "Create account", USER-01). */
export default function SignupPage() {
  const t = useTranslations("Pages");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-4 md:py-10">
      <div className="flex items-center gap-2">
        <BackLink fallbackHref="/more" />
      </div>
      <h1 className="text-2xl font-bold">{t("signup")}</h1>
      {/* The form reads ?next=, which a prerendered page cannot know. */}
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
