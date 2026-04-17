import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardConfigsPageV2 as default } from "@/components/dashboard/DashboardConfigsPageV2.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.configs.title} | ${copy.metaTitle}`,
    description: copy.pages.configs.description,
  };
}
