import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardAchievementsPage as default } from "@/components/dashboard/DashboardAchievementsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.achievements.title} | ${copy.metaTitle}`,
    description: copy.pages.achievements.description,
  };
}
