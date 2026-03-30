import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type CreateArticleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "create" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default function CreateArticleLayout({ children }: CreateArticleLayoutProps) {
  return <>{children}</>;
}
