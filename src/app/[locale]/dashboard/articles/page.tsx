import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardArticlesPage as default } from "@/components/dashboard/DashboardArticlesPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.articles.title} | ${copy.metaTitle}`,
    description: copy.pages.articles.description,
  };
}
