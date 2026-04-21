import { ReactNode } from "react";
import { DecorationLayoutClient } from "@/components/decoration/DecorationLayoutClient";

interface DecorationLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string; locale: string }>;
}

export default async function DecorationLayout({
  children,
  params,
}: DecorationLayoutProps) {
  const { locale, id } = await params;

  return (
    <div className="page-container">
      <DecorationLayoutClient locale={locale} userId={id}>{children}</DecorationLayoutClient>
    </div>
  );
}