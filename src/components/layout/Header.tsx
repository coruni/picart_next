"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChevronRight, MessageCircle, PenIcon } from "lucide-react";
import { MessageDropdown } from "./MessageDropdown";
import { UserDropdown } from "./UserDropdown";
import { useAppStore, useUserStore } from "@/stores";
import { HeaderTabs } from "../home/HeaderTabs";
import { CategoryList } from "@/types";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { SearchBox } from "./SearchBox";
import { Avatar } from "../ui/Avatar";
import { openLoginDialog } from "@/lib/modal-helpers";

type HeaderProps = {
  categories?: CategoryList;
};

export function Header({ categories }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const tHeader = useTranslations("header");
  const siteConfig = useAppStore((state) => state.siteConfig);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const pathname = usePathname();
  const allowedPages = ["/account/", "/topic/"];
  const deniedPages = ["/edit", "/decoration"];
  const isTransparentBgPage =
    allowedPages.some((path) => pathname.includes(path)) &&
    !deniedPages.some((path) => pathname.includes(path));
  const scrolled = useScrollThreshold(240, isTransparentBgPage);

  const actionButtonClassName = cn(
    "flex items-center justify-center rounded-full p-2 transition-colors",
    "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
    "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
    isTransparentBgPage && !scrolled && "text-white",
  );

  const renderCreateMenu = () => (
    <div className="relative group">
      <div className={actionButtonClassName}>
        <PenIcon className="size-5" />
      </div>
      <div className="absolute right-0 z-50 mt-2 invisible w-auto min-w-xs rounded-xl border border-border bg-card opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="space-y-2 p-3">
          <Link
            href="/create/post"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <PenIcon className="size-5 text-green-600 dark:text-green-300" />
            </div>
            <span className="flex-1 text-sm font-medium">
              {tHeader("create.article")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </Link>
          <Link
            href="/create/image"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <svg
                className="size-5 text-blue-600 dark:text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">
              {tHeader("create.image")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </Link>
          <Link
            href="/create/video"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <svg
                className="size-5 text-orange-600 dark:text-orange-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">
              {tHeader("create.video")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="flex items-center gap-4">
      {renderCreateMenu()}
      <MessageDropdown
        isTransparentBgPage={isTransparentBgPage}
        scrolled={scrolled}
      />
      <UserDropdown />
    </div>
  );

  const renderMobileActions = () => (
    <div className="flex items-center gap-2">
      <Link href="/create/post" className={actionButtonClassName}>
        <PenIcon className="size-5" />
      </Link>
      <Link href="/messages" className={actionButtonClassName}>
        <MessageCircle className="size-5" />
      </Link>
      {isAuthenticated && user ? (
        <Link
          href={`/account/${user.id}`}
          className="flex shrink-0 items-center justify-center rounded-full bg-primary/20 transition-all"
        >
          <Avatar
            bordered
            url={user.avatar}
            frameUrl={user.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            className="size-10"
          />
        </Link>
      ) : (
        <button
          type="button"
          onClick={openLoginDialog}
          className="flex shrink-0 items-center justify-center rounded-full bg-primary/20 transition-all"
        >
          <Avatar bordered className="size-10" />
        </button>
      )}
    </div>
  );

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    const root = document.documentElement;
    const updateHeaderHeight = () => {
      root.style.setProperty("--header-height", `${headerElement.offsetHeight}px`);
    };

    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerElement);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed left-0 right-0 top-0 z-50",
        isTransparentBgPage && !scrolled ? "bg-transparent" : "bg-card",
      )}
    >
      <div className="mx-auto px-4 md:px-10">
        <div className="flex min-h-15 flex-col justify-center gap-2 py-2 md:h-15 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
          <div className="flex min-w-0 items-center justify-between gap-3 md:flex-none md:justify-start md:gap-4">
            <Link
              href="/"
              className={cn(
                "line-clamp-1 min-w-0 text-nowrap text-2xl font-bold text-primary md:text-3xl",
                isTransparentBgPage && !scrolled && "text-white",
              )}
            >
              {siteConfig?.site_name}
            </Link>

            <div className="shrink-0 md:hidden">{renderMobileActions()}</div>
          </div>

          <HeaderTabs
            categories={categories ?? []}
            labelClassName={
              isTransparentBgPage && !scrolled ? "text-white" : undefined
            }
          />

          <SearchBox
            categories={categories}
            isAccountPage={isTransparentBgPage}
            scrolled={scrolled}
          />

          <div className="hidden md:flex md:items-center md:gap-4">
            {renderActions()}
          </div>
        </div>
      </div>
    </header>
  );
}
