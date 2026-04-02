"use client";

import { CategoryList } from "@/types";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

type AppChromeProps = {
  categories: CategoryList;
  children: React.ReactNode;
};

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
}

export function AppChrome({ categories, children }: AppChromeProps) {
  const pathname = usePathname();
  const normalizedPathname = stripLocalePrefix(pathname);
  const isDashboardRoute =
    normalizedPathname === "/dashboard" ||
    normalizedPathname.startsWith("/dashboard/");

  return (
    <>
      {isDashboardRoute ? null : <Header categories={categories} />}
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
    </>
  );
}
