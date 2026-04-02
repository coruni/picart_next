import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardRolesPage as default } from "@/components/dashboard/DashboardRolesPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.roles.title} | ${copy.metaTitle}`,
    description: copy.pages.roles.description,
  };
}
