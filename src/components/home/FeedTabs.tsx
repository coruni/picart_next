"use client";

import { NavigationTabs, TabItem } from "@/components/shared";

const tabs: TabItem[] = [
  { label: "关注", value: "follow", href: "/follow" },
  { label: "推荐", value: "recommend", href: "/" },
  { label: "活动", value: "activity", href: "/activity" },
];

export function FeedTabs() {
  return <NavigationTabs tabs={tabs} />;
}
