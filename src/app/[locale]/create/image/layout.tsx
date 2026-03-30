import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateCreateImageMetadata } from "@/lib/seo";

type CreateImageLayoutProps = {
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
  return generateCreateImageMetadata(locale);
}

export default function CreateImageLayout({ children }: CreateImageLayoutProps) {
  return <>{children}</>;
}
