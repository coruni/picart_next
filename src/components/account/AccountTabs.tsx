"use client";

import { NavigationTabs, TabItem } from "@/components/shared";
import { useParams } from "next/navigation";

export function AccountTabs() {
  const params = useParams();
  const userId = params.id as string;

  const tabs: TabItem[] = [
    { label: "帖子", value: "article", href: `/account/${userId}` },
    { label: "评论", value: "comment", href: `/account/${userId}/comment` },
    { label: "收藏", value: "favorite", href: `/account/${userId}/favorite` },
    { label: "话题", value: "tag", href: `/account/${userId}/tag` },
  ];

  // 自定义匹配逻辑：精确匹配或子路径匹配
  const isActive = (currentPath: string, tabHref: string) => {
    // 移除 locale 前缀进行比较
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "");
    const normalizedHref = tabHref.replace(/^\/(zh|en)/, "");

    // 精确匹配
    if (normalizedPath === normalizedHref) return true;

    // 子路径匹配（但不匹配主页）
    if (normalizedHref.includes("/account/") && !normalizedHref.endsWith(`/account/${userId}`)) {
      return normalizedPath.startsWith(normalizedHref);
    }

    return false;
  };

  return <NavigationTabs tabs={tabs} isActive={isActive} />;
}
