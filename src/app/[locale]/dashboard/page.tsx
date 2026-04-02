import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardClientPage as default } from "@/components/dashboard/DashboardClientPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}
