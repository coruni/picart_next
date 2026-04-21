import { uploadControllerGetUploadConfig } from "@/api";
import { UploadConfigProvider } from "@/components/providers/UploadConfigProvider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export default async function CreateArticleLayout({
  children,
  params,
}: CreateArticleLayoutProps) {
  // 在 SSR 层获取上传配置，避免客户端请求导致的默认值跳动
  let uploadConfig = null;
  try {
    const response = await uploadControllerGetUploadConfig({});
    if (response.data?.data) {
      uploadConfig = response.data.data;
    }
  } catch (error) {
    console.error("[CreateLayout] Failed to fetch upload config:", error);
  }

  return (
    <UploadConfigProvider config={uploadConfig}>
      {children}
    </UploadConfigProvider>
  );
}
