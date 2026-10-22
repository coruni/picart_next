"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib";
import { useUserStore } from "@/stores/useUserStore";
import { ChevronRight, ExternalLink, Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";
import { getDashboardCopy } from "./copy";
import { dashboardNavGroups } from "./nav";
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
    const listener = () => setMatches(media.matches);

    listener();
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

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

  const isActivePath = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? currentPath === href
        : currentPath === href || currentPath.startsWith(`${href}/`),
    [currentPath],
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 同步 sidebar collapsed 状态
  useEffect(() => {
    if (isXl) {
      setSidebarCollapsed(false);
    }
  }, [isXl]);

  // 抽屉打开时锁定页面滚动，并支持 Esc 关闭
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const renderNavContent = (isCollapsed: boolean) => (
    <div className="flex flex-col gap-1 px-2">
      {dashboardNavGroups.map((group) => (
        <div key={group.labelKey ?? "root"} className="space-y-1">
          {group.labelKey ? (
            isCollapsed ? (
              <div className="mx-2 my-2 h-px bg-border" aria-hidden="true" />
            ) : (
              <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {copy.navGroups[group.labelKey]}
              </div>
            )
          ) : null}
          {group.items.map((item) => {
            const Icon = item.icon;
            const label = copy.nav[item.navKey];
            const active = isActivePath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-primary/10 hover:text-primary",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground",
                )}
                title={isCollapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
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
                    "transition-all duration-200 truncate text-nowrap",
                    isCollapsed && "hidden",
                  )}
                >
                  {label}
                </span>
                {active && !isCollapsed && (
                  <ChevronRight className="ml-auto size-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
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
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 border-b border-border",
            sidebarCollapsed ? "justify-center px-2" : "px-3",
          )}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              aria-label={copy.common.expand}
              aria-expanded={false}
              className="group flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <span className="group-hover:hidden">A</span>
              <ChevronRight
                className="hidden size-4 group-hover:block"
                aria-hidden="true"
              />
            </button>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-3 rounded-lg"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  A
                </span>
                <span className="truncate font-semibold text-foreground">
                  {copy.shell.title}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                aria-label={copy.common.collapse}
                aria-expanded
                className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4 rotate-180" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {/* 导航区域 */}
        <nav
          aria-label={copy.shell.title}
          className="flex-1 overflow-y-auto overscroll-contain py-3"
        >
          {renderNavContent(sidebarCollapsed)}
        </nav>

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
                  {roleLabels.length > 0 ? roleLabels[0] : copy.shell.noRoleHint}
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
            aria-label={copy.common.collapse}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200 xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-border bg-card animate-in slide-in-from-left-full duration-200 xl:hidden">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  A
                </span>
                <span className="font-semibold text-foreground">
                  {copy.shell.title}
                </span>
              </div>
              <button
                type="button"
                aria-label={copy.common.collapse}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav
              aria-label={copy.shell.title}
              className="flex-1 overflow-y-auto overscroll-contain py-3"
            >
              {renderNavContent(false)}
            </nav>
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
                    {roleLabels.length > 0 ? roleLabels[0] : copy.shell.noRoleHint}
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
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label={copy.common.expand}
            aria-expanded={mobileMenuOpen}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground xl:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <DashboardBreadcrumb pathname={currentPath} />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href={user?.id ? `/account/${user.id}` : "/"}
              aria-label={copy.shell.accountEntry}
              title={copy.shell.accountEntry}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
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
