import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardTagsPage as default } from "@/components/dashboard/DashboardTagsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.tags.title} | ${copy.metaTitle}`,
    description: copy.pages.tags.description,
  };
}
