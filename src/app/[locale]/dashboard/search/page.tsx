import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardSearchPage as default } from "@/components/dashboard/DashboardSearchPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.search.title} | ${copy.metaTitle}`,
    description: copy.pages.search.description,
  };
}
