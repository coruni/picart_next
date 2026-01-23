"use client";

import { DropdownMenu, MenuItem } from "@/components/shared";
import { MoreHorizontal, Share, Flag, Bookmark, Link as LinkIcon } from "lucide-react";

type ArticleMenuProps = {
  articleId: string;
  authorId: string;
  isOwner?: boolean;
};

export function ArticleMenu({ articleId, authorId, isOwner = false }: ArticleMenuProps) {
  const menuItems: MenuItem[] = [
    {
      label: "分享",
      icon: <Share size={20} />,
      onClick: () => {
        // TODO: 实现分享功能
        console.log("分享文章", articleId);
      },
    },
    {
      label: "复制链接",
      icon: <LinkIcon size={20} />,
      onClick: () => {
        // TODO: 复制文章链接
        const url = `${window.location.origin}/article/${articleId}`;
        navigator.clipboard.writeText(url);
        console.log("已复制链接", url);
      },
    },
    {
      label: "收藏",
      icon: <Bookmark size={20} />,
      onClick: () => {
        // TODO: 收藏文章
        console.log("收藏文章", articleId);
      },
    },
  ];

  // 如果不是作者，添加举报选项
  if (!isOwner) {
    menuItems.push({
      label: "举报",
      icon: <Flag size={20} />,
      onClick: () => {
        // TODO: 举报文章
        console.log("举报文章", articleId);
      },
      className: "text-red-500",
    });
  }

  return (
    <DropdownMenu
      trigger={
        <button className="cursor-pointer flex items-center hover:text-primary transition-colors">
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>
      }
      items={menuItems}
      title="更多操作"
      position="right"
    />
  );
}
