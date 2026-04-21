"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib";
import { useUserStore } from "@/stores/useUserStore";
import {
  BadgeCheck,
  ChevronRight,
  FileCog,
  FileText,
  FolderTree,
  Images,
  KeyRound,
  LayoutDashboard,
  Medal,
  Menu,
  MessageSquareText,
  ReceiptText,
  Search,
  ShieldUser,
  Smile,
  Sparkles,
  Tags,
  TriangleAlert,
  Trophy,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getDashboardCopy } from "./copy";
import { getRoleLabels, looksLikeAdminRole } from "./utils";

type DashboardShellProps = {
  children: React.ReactNode;
};

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentPath = stripLocalePrefix(pathname);
  const roleLabels = getRoleLabels(user?.roles);
  const isXl = useMediaQuery("(min-width: 1280px)");

  const navItems = [
    {
      href: "/dashboard",
      label: copy.nav.overview,
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/users",
      label: copy.nav.users,
      icon: ShieldUser,
    },
    {
      href: "/dashboard/articles",
      label: copy.nav.articles,
      icon: FileText,
    },
    {
      href: "/dashboard/comments",
      label: copy.nav.comments,
      icon: MessageSquareText,
    },
    {
      href: "/dashboard/orders",
      label: copy.nav.orders,
      icon: ReceiptText,
    },
    {
      href: "/dashboard/points",
      label: copy.nav.points,
      icon: Medal,
    },
    {
      href: "/dashboard/tags",
      label: copy.nav.tags,
      icon: Tags,
    },
    {
      href: "/dashboard/categories",
      label: copy.nav.categories,
      icon: FolderTree,
    },
    {
      href: "/dashboard/roles",
      label: copy.nav.roles,
      icon: BadgeCheck,
    },
    {
      href: "/dashboard/permissions",
      label: copy.nav.permissions,
      icon: KeyRound,
    },
    {
      href: "/dashboard/banners",
      label: copy.nav.banners,
      icon: Images,
    },
    {
      href: "/dashboard/reports",
      label: copy.nav.reports,
      icon: TriangleAlert,
    },
    {
      href: "/dashboard/decorations",
      label: copy.nav.decorations,
      icon: Sparkles,
    },
    {
      href: "/dashboard/emojis",
      label: copy.nav.emojis,
      icon: Smile,
    },
    {
      href: "/dashboard/achievements",
      label: copy.nav.achievements,
      icon: Trophy,
    },
    {
      href: "/dashboard/configs",
      label: copy.nav.configs,
      icon: FileCog,
    },
    {
      href: "/dashboard/search",
      label: copy.nav.search,
      icon: Search,
    },
  ];

  const isActivePath = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? currentPath === href
        : currentPath === href || currentPath.startsWith(`${href}/`),
    [currentPath],
  );

  const activeItem =
    navItems.find((item) => isActivePath(item.href)) || navItems[0];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 同步 sidebar collapsed 状态
  useEffect(() => {
    if (isXl) {
      setSidebarCollapsed(false);
    }
  }, [isXl]);

  const renderNavContent = (isCollapsed: boolean) => (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              "hover:bg-primary/10 hover:text-primary",
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground",
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon
              className={cn(
                "size-5 shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary",
              )}
            />
            <span
              className={cn(
                "transition-all duration-200",
                isCollapsed && "hidden",
              )}
            >
              {item.label}
            </span>
            {active && (
              <ChevronRight className="ml-auto size-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 桌面端侧边栏 */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col border-r border-border bg-card",
          "transition-all duration-300 ease-in-out",
          "xl:flex",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo/Title 区域 */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              A
            </div>
          )}

          <span
            className={cn(
              "font-semibold text-foreground truncate transition-all duration-300",
              sidebarCollapsed && "w-0 opacity-0",
            )}
          >
            {copy.shell.title}
          </span>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
              sidebarCollapsed && "rotate-180 ml-0",
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* 导航区域 */}
        <div className="flex-1 overflow-y-auto py-3">{renderNavContent(sidebarCollapsed)}</div>

        {/* 底部用户信息 */}
        <div
          className={cn(
            "border-t border-border p-3",
            sidebarCollapsed && "px-2",
          )}
        >
          <Link
            href={user?.id ? `/account/${user.id}` : "/"}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted",
              sidebarCollapsed && "justify-center",
            )}
            title={user?.nickname || user?.username}
          >
            <Avatar
              url={user?.avatar}
              frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
              className="size-8 shrink-0"
              alt={user?.nickname || user?.username || "User"}
            />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">
                  {user?.nickname || user?.username || "-"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {roleLabels.length > 0
                    ? roleLabels[0]
                    : copy.shell.noRoleHint}
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200 xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-border bg-card animate-in slide-in-from-left-full duration-200 xl:hidden">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  A
                </div>
                <span className="font-semibold text-foreground">
                  {copy.shell.title}
                </span>
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-2">{renderNavContent(false)}</div>
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-3 rounded-lg p-2">
                <Avatar
                  url={user?.avatar}
                  frameUrl={user?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
                  className="size-8"
                  alt={user?.nickname || user?.username || "User"}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {user?.nickname || user?.username || "-"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {roleLabels.length > 0
                      ? roleLabels[0]
                      : copy.shell.noRoleHint}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* 主内容区域 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground xl:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {activeItem.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {roleLabels.slice(0, 2).map((role, idx) => (
              <span
                key={role}
                className={cn(
                  "hidden rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
                  idx === 0 && looksLikeAdminRole(user?.roles)
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {role}
              </span>
            ))}
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
