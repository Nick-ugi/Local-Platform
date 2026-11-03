import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { BottomNav } from "@/components/nav/BottomNav";
import { TopNav } from "@/components/nav/TopNav";
import { siteMetadata } from "@/lib/seo/siteMetadata";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// viewport-fit=cover lets the bottom tabs read the safe-area inset on phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return siteMetadata(t("brand"), siteUrl());
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="antialiased">
      {/* dvh, not vh: on phones vh includes the area under the browser's address bar. */}
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <TopNav />
          <main className="flex flex-1 flex-col">{children}</main>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
