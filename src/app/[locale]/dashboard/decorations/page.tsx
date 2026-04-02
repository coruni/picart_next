import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardDecorationsPage as default } from "@/components/dashboard/DashboardDecorationsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.decorations.title} | ${copy.metaTitle}`,
    description: copy.pages.decorations.description,
  };
}
