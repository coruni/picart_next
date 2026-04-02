import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardPermissionsPage as default } from "@/components/dashboard/DashboardPermissionsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.permissions.title} | ${copy.metaTitle}`,
    description: copy.pages.permissions.description,
  };
}
