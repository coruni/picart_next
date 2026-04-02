import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardUsersPage as default } from "@/components/dashboard/DashboardUsersPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.users.title} | ${copy.metaTitle}`,
    description: copy.pages.users.description,
  };
}
