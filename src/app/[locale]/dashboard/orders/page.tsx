import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardOrdersPage as default } from "@/components/dashboard/DashboardOrdersPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.orders.title} | ${copy.metaTitle}`,
    description: copy.pages.orders.description,
  };
}
