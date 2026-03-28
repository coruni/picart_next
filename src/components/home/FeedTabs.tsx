"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useTranslations } from "next-intl";

export function FeedTabs() {
  const t = useTranslations("feedTabs");

  const tabs: TabItem[] = [
    { label: t("follow"), value: "follow", href: "/follow" },
    { label: t("recommend"), value: "recommend", href: "/" },
    { label: t("activity"), value: "activity", href: "/activity" },
  ];

  return <NavigationTabs tabs={tabs} />;
}
