import { getDashboardCopy } from "@/components/dashboard/copy";
import type { Metadata } from "next";

export { DashboardCertificationsPage as default } from "@/components/dashboard/DashboardCertificationsPage.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDashboardCopy(locale);

  return {
    title: `${copy.pages.certifications.title} | ${copy.metaTitle}`,
    description: copy.pages.certifications.description,
  };
}
