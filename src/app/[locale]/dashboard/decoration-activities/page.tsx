import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardDecorationActivitiesPage as default } from "@/components/dashboard/DashboardDecorationActivitiesPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.decorationActivities.title} | ${copy.metaTitle}`,
    description: copy.pages.decorationActivities.description,
  };
}
