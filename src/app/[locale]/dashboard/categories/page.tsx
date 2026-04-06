import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardCategoriesPage as default } from "@/components/dashboard/DashboardCategoriesPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.categories.title} | ${copy.metaTitle}`,
    description: copy.pages.categories.description,
  };
}
