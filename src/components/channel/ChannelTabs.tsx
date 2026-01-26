"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useParams } from "next/navigation";
import { CategoryDetail } from "@/types";

type ChannelTabsProps = {
  children: CategoryDetail['children'];
  parentId: string;
};

export function ChannelTabs({ children, parentId }: ChannelTabsProps) {
  const params = useParams();
  
  if (!children || children.length === 0) {
    return null;
  }

  const tabs: TabItem[] = children.map((child) => ({
    label: child.name,
    value: child.id.toString(),
    href: `/channel/${parentId}/${child.id}`,
  }));

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
