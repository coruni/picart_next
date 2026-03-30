import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateCreatePostMetadata } from "@/lib/seo";

type CreatePostLayoutProps = {
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
  return generateCreatePostMetadata(locale);
}

export default function CreatePostLayout({ children }: CreatePostLayoutProps) {
  return <>{children}</>;
}
