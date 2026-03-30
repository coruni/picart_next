"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

type SearchFeedTabsProps = {
  className?: string;
};
export function SearchFeedTabs({ className }: SearchFeedTabsProps) {
  const t = useTranslations("searchFeedTabs");
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q")?.trim();
  const searchSuffix = keyword
    ? `?${new URLSearchParams({ q: keyword }).toString()}`
    : "";

  const tabs: TabItem[] = [
    {
      label: t("article"),
      value: "article",
      href: `/search${searchSuffix}`,
    },
    {
      label: t("topic"),
      value: "topic",
      href: `/search/topic${searchSuffix}`,
    },
    {
      label: t("user"),
      value: "user",
      href: `/search/user${searchSuffix}`,
    },
  ];

  return (
    <NavigationTabs
      tabs={tabs}
      className={className}
      isActive={(currentPath, tabHref) => {
        const targetPath = tabHref.split("?")[0];

        if (targetPath === "/search") {
          return currentPath === "/search";
        }

        return currentPath.startsWith(targetPath);
      }}
    />
  );
}

