import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardCommentsPage as default } from "@/components/dashboard/DashboardCommentsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.comments.title} | ${copy.metaTitle}`,
    description: copy.pages.comments.description,
  };
}
