import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardReportsPage as default } from "@/components/dashboard/DashboardReportsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.reports.title} | ${copy.metaTitle}`,
    description: copy.pages.reports.description,
  };
}
