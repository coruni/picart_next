import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardPointsPage as default } from "@/components/dashboard/DashboardPointsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.points.title} | ${copy.metaTitle}`,
    description: copy.pages.points.description,
  };
}
