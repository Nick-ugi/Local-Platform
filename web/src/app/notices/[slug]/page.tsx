import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { NoticeDetailView } from "@/components/local/NoticeDetailView";
import { getNotice } from "@/lib/api/notices";
import { noticeMetadata } from "@/lib/seo/localMetadata";

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page both need the notice; cache() makes that one API call per request.
const loadNotice = cache(getNotice);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notice = await loadNotice(slug);
  if (!notice) {
    return {};
  }
  const tNav = await getTranslations("Nav");
  return noticeMetadata(notice, { siteName: tNav("brand") });
}

export default async function NoticePage({ params }: Props) {
  const { slug } = await params;
  const notice = await loadNotice(slug);
  if (!notice) {
    notFound();
  }
  return <NoticeDetailView notice={notice} />;
}
