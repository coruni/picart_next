import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardBannersPage as default } from "@/components/dashboard/DashboardBannersPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.banners.title} | ${copy.metaTitle}`,
    description: copy.pages.banners.description,
  };
}
