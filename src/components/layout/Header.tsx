"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { Link, usePathname } from "@/i18n/routing";
import { openLoginDialog } from "@/lib/modal-helpers";
import { cn } from "@/lib/utils";
import { useAppStore, useUserStore } from "@/stores";
import { CategoryList } from "@/types";
import { ChevronRight, MessageCircle, PenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { HeaderTabs } from "../home/HeaderTabs";
import { Avatar } from "../ui/Avatar";
import { MessageDropdown } from "./MessageDropdown";
import { SearchBox } from "./SearchBox";
import { UserDropdown } from "./UserDropdown";

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
  const shouldUseTransparentHeader = isTransparentBgPage && !scrolled;

  // 搜索页不显示搜索框，避免重复
  const isSearchPage = pathname === "/search";

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
          <GuardedLink
            href="/create/post"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <svg
                className="size-5 text-orange-600 dark:text-orange-300"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M897.024 328.362667l-538.453333 538.453333a209.322667 209.322667 0 0 1-127.573334 60.16l-122.453333 11.52a20.906667 20.906667 0 0 1-23.04-23.04l11.52-122.453333a209.322667 209.322667 0 0 1 60.16-127.573334l538.453333-538.453333a142.421333 142.421333 0 0 1 201.386667 201.386667z"
                  fill="currentColor"
                />
                <path
                  d="M812.544 256.682667l-74.24 73.813333a30.293333 30.293333 0 0 1-22.613333 9.386667 31.658667 31.658667 0 0 1-22.613334-9.386667 32.170667 32.170667 0 0 1 0-45.226667l74.24-73.813333a32 32 0 0 1 45.226667 45.226667z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium">
              {tHeader("create.article")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </GuardedLink>
          <GuardedLink
            href="/create/image"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3db8f533]">
              <svg
                className="size-5"
                viewBox="0 0 1493 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.256735 237.414653C6.256735 106.250736 115.408321 0 250.041882 0h650.017886C1034.693329 0 1143.844915 106.250736 1143.844915 237.414653v435.241238C1143.844915 803.819808 1034.693329 910.070544 900.059768 910.070544H250.041882C115.408321 910.070544 6.256735 803.819808 6.256735 672.655891V237.414653z"
                  fill="#DCF5F6"
                />
                <path
                  d="M209.373104 514.360495a223.479198 217.620619 0 1 0 446.958396 0 223.479198 217.620619 0 1 0-446.958396 0Z"
                  fill="#04BABE"
                />
                <path
                  d="M867.297228 187.133256a41.237572 41.237572 0 0 0-70.359829 0l-245.491529 414.082097a41.237572 41.237572 0 0 1-70.359829 0l-52.101538-87.821807a41.066933 41.066933 0 0 0-70.359829 0l-244.012665 411.522524c-15.584958 26.278287 3.981559 59.325224 35.265234 59.325223H290.084986c22.410487 0 40.38438 21.386658 59.154585 33.274454 6.256735 3.981559 13.764817 6.313614 22.069211 6.313615H1292.868966c31.283675 0 50.850192-32.990057 35.208354-59.325224L867.297228 187.133256z"
                  fill="#B4EBED"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium">
              {tHeader("create.image")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </GuardedLink>
          <GuardedLink
            href="/create/video"
            className="group/item flex items-center gap-3 rounded-lg bg-[#F6F9FB] px-4 py-2 whitespace-nowrap transition-colors hover:bg-primary/15 hover:text-primary dark:bg-[#242734]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
              <svg
                className="size-5"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M102.4 153.6m76.8 0l665.6 0q76.8 0 76.8 76.8l0 563.2q0 76.8-76.8 76.8l-665.6 0q-76.8 0-76.8-76.8l0-563.2q0-76.8 76.8-76.8Z"
                  fill="#FF7C83"
                />
                <path
                  d="M445.1072 385.0624C425.4976 373.8496 409.6 383.168 409.6 405.696v212.5824c0 22.6176 15.8976 31.8464 35.5072 20.6336l186.2784-106.624c19.6096-11.2128 19.6096-29.4016 0-40.6272l-186.2784-106.5984z"
                  fill="#E05050"
                />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium">
              {tHeader("create.video")}
            </span>
            <ChevronRight className="size-4 transition-colors" />
          </GuardedLink>
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
      <GuardedLink href="/create/post" className={actionButtonClassName}>
        <PenIcon className="size-5" />
      </GuardedLink>
      <GuardedLink href="/messages" className={actionButtonClassName}>
        <MessageCircle className="size-5" />
      </GuardedLink>
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
      root.style.setProperty(
        "--header-height",
        `${headerElement.offsetHeight}px`,
      );
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
        "fixed left-0 right-0 top-0 z-50 transition-colors",
        shouldUseTransparentHeader
          ? "bg-transparent dark:bg-transparent"
          : "bg-card",
      )}
      style={
        shouldUseTransparentHeader
          ? { backgroundColor: "transparent" }
          : undefined
      }
    >
      <div className="mx-auto px-4 md:px-10">
        <div className="flex min-h-15 flex-col justify-center gap-2 py-2 md:h-15 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
          <div className="flex min-w-0 items-center justify-between gap-3 md:flex-none md:justify-start md:gap-4">
            <Link
              href="/"
              className={cn(
                "line-clamp-1 min-w-0 text-nowrap text-2xl font-bold text-primary md:text-3xl",
                shouldUseTransparentHeader && "text-white",
              )}
            >
              {siteConfig?.site_name}
            </Link>
            <div className="hidden md:block">
              <HeaderTabs
                categories={categories ?? []}
                labelClassName={
                  shouldUseTransparentHeader ? "text-white" : undefined
                }
              />
            </div>

            <div className="shrink-0 md:hidden">{renderMobileActions()}</div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <HeaderTabs
              categories={categories ?? []}
              labelClassName={
                shouldUseTransparentHeader ? "text-white" : undefined
              }
            />
            {!isSearchPage && (
              <SearchBox
                categories={categories}
                isAccountPage={isTransparentBgPage}
                scrolled={scrolled}
                mobileVisible
                className="flex-1"
              />
            )}
          </div>

          {!isSearchPage && (
            <SearchBox
              categories={categories}
              isAccountPage={isTransparentBgPage}
              scrolled={scrolled}
            />
          )}

          <div className="hidden md:flex md:items-center md:gap-4">
            {renderActions()}
          </div>
        </div>
      </div>
    </header>
  );
}
