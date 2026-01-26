"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function TopicTabs() {
  const t = useTranslations("topic");
  const params = useParams();
  const topicId = params.id as string;

  const tabs: TabItem[] = [
    { label: t("tabs.hot"), value: "hot", href: `/topic/${topicId}` },
    { label: t("tabs.new"), value: "new", href: `/topic/${topicId}/new` },
  ];

  // 自定义匹配逻辑：精确匹配
  const isActive = (currentPath: string, tabHref: string) => {
    // 移除 locale 前缀进行比较
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "");
    const normalizedHref = tabHref.replace(/^\/(zh|en)/, "");

    // 精确匹配
    return normalizedPath === normalizedHref;
  };

  return <NavigationTabs tabs={tabs} isActive={isActive} />;
}
