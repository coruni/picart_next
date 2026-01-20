"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChevronRight, PenIcon } from "lucide-react";
import { MessageDropdown } from "./MessageDropdown";
import { UserDropdown } from "./UserDropdown";
import { useAppStore } from "@/stores";
import { HeaderTabs } from "../home/HeaderTabs";
import { CategoryList } from "@/types";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";

type HeaderProps = {
  categories?: CategoryList;
};

export function Header({ categories }: HeaderProps) {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const siteConfig = useAppStore((state) => state.siteConfig);
  const pathname = usePathname();

  // 判断是否在 account 页面
  const isAccountPage = pathname.includes("/account/");

  // 使用自定义 hook 监听滚动
  const scrolled = useScrollThreshold(240, isAccountPage);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 ",
        isAccountPage && !scrolled ? "bg-transparent" : "bg-card"
      )}
    >
      <div className="px-10 mx-auto">
        <div className="flex items-center justify-between gap-4 h-15">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className={cn("text-primary text-3xl font-bold line-clamp-1 text-nowrap", isAccountPage && !scrolled && ("text-white"))}>
              {siteConfig?.site_name}
            </Link>

            <HeaderTabs categories={categories!} labelClassName={isAccountPage && !scrolled ? "text-white" : undefined} />

          </div>

          {/* 搜索框 */}
          <div className="flex-1 items-center justify-center hidden md:flex">
            <div className="relative group max-w-md h-9 w-full">
              <input
                type="text"
                placeholder={t("search")}
                className={cn(
                  "w-full h-full pl-12 pr-4 rounded-full transition-all",
                  "placeholder:text-secondary placeholder:text-sm",
                  "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                  // 普通页面样式
                  (!isAccountPage || scrolled) && [
                    "bg-[#f1f4f9] border border-border",
                    "hover:bg-card hover:border-primary hover:ring-1 hover:ring-primary",
                    "focus:bg-card",
                  ],
                  // Account 页面未滚动时的透明样式
                  isAccountPage && !scrolled && [
                    "bg-[#00000066] border border-[#ffffff66]",
                    "hover:border-white hover:ring-1 hover:ring-white/50",
                    "focus:border-white focus:ring-white/50",
                    "placeholder:text-white/70"
                  ]
                )}
              />
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-4">
            {/* 用户菜单 */}
            <div className="flex items-center gap-4">
              {/* 创作按钮 */}
              <div className="relative group">
                <div className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <PenIcon className="size-5" />
                </div>
                {/* Hover 面板 */}
                <div className="absolute right-0 mt-2 w-auto min-w-xs bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 space-y-2">
                    <Link
                      href="/create/post"
                      className="flex items-center gap-3 px-4 py-2 bg-[#F6F9FB] hover:bg-primary/15 hover:text-primary rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                        <PenIcon className="size-5 text-green-600 dark:text-green-300" />
                      </div>
                      <span className="text-sm font-medium flex-1">{tHeader("create.article")}</span>
                      <ChevronRight className="size-4 transition-colors" />
                    </Link>
                    <Link
                      href="/create/image"
                      className="flex items-center gap-3 px-4 py-2 bg-[#F6F9FB] hover:bg-primary/15 hover:text-primary rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                        <svg className="size-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{tHeader("create.image")}</span>
                      <ChevronRight className="size-4 transition-colors" />
                    </Link>
                    <Link
                      href="/create/video"
                      className="flex items-center gap-3 px-4 py-2 bg-[#F6F9FB] hover:bg-primary/15 hover:text-primary rounded-lg transition-colors group/item whitespace-nowrap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
                        <svg className="size-5 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{tHeader("create.video")}</span>
                      <ChevronRight className="size-4 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 消息按钮 */}
              <MessageDropdown />

              {/* 用户头像 */}
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
