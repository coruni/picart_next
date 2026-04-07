import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardEmojisPage as default } from "@/components/dashboard/DashboardEmojisPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.emojis.title} | ${copy.metaTitle}`,
    description: copy.pages.emojis.description,
  };
}
