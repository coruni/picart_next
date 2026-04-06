"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib";
import { useUserStore } from "@/stores/useUserStore";
import {
  BadgeCheck,
  FileCog,
  FileText,
  FolderTree,
  Images,
  KeyRound,
  LayoutDashboard,
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
import { useEffect, useState } from "react";
import { getDashboardCopy } from "./copy";
import { getRoleLabels, looksLikeAdminRole } from "./utils";

type DashboardShellProps = {
  children: React.ReactNode;
};

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPath = stripLocalePrefix(pathname);
  const roleLabels = getRoleLabels(user?.roles);

  const navItems = [
    {
      href: "/dashboard",
      label: copy.nav.overview,
      description: copy.pages.overview.description,
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/users",
      label: copy.nav.users,
      description: copy.pages.users.description,
      icon: ShieldUser,
    },
    {
      href: "/dashboard/articles",
      label: copy.nav.articles,
      description: copy.pages.articles.description,
      icon: FileText,
    },
    {
      href: "/dashboard/comments",
      label: copy.nav.comments,
      description: copy.pages.comments.description,
      icon: MessageSquareText,
    },
    {
      href: "/dashboard/tags",
      label: copy.nav.tags,
      description: copy.pages.tags.description,
      icon: Tags,
    },
    {
      href: "/dashboard/categories",
      label: copy.nav.categories,
      description: copy.pages.categories.description,
      icon: FolderTree,
    },
    {
      href: "/dashboard/roles",
      label: copy.nav.roles,
      description: copy.pages.roles.description,
      icon: BadgeCheck,
    },
    {
      href: "/dashboard/permissions",
      label: copy.nav.permissions,
      description: copy.pages.permissions.description,
      icon: KeyRound,
    },
    {
      href: "/dashboard/banners",
      label: copy.nav.banners,
      description: copy.pages.banners.description,
      icon: Images,
    },
    {
      href: "/dashboard/reports",
      label: copy.nav.reports,
      description: copy.pages.reports.description,
      icon: TriangleAlert,
    },
    {
      href: "/dashboard/decorations",
      label: copy.nav.decorations,
      description: copy.pages.decorations.description,
      icon: Sparkles,
    },
    {
      href: "/dashboard/emojis",
      label: copy.nav.emojis,
      description: copy.pages.emojis.description,
      icon: Smile,
    },
    {
      href: "/dashboard/achievements",
      label: copy.nav.achievements,
      description: copy.pages.achievements.description,
      icon: Trophy,
    },
    {
      href: "/dashboard/orders",
      label: copy.nav.orders,
      description: copy.pages.orders.description,
      icon: ReceiptText,
    },
    {
      href: "/dashboard/configs",
      label: copy.nav.configs,
      description: copy.pages.configs.description,
      icon: FileCog,
    },
    {
      href: "/dashboard/search",
      label: copy.nav.search,
      description: copy.pages.search.description,
      icon: Search,
    },
  ];

  const isActivePath = (href: string) =>
    href === "/dashboard"
      ? currentPath === href
      : currentPath === href || currentPath.startsWith(`${href}/`);

  const activeItem =
    navItems.find((item) => isActivePath(item.href)) || navItems[0];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navContent = (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-primary/8 hover:text-primary",
            )}
          >
            <Icon className="size-4.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen overflow-hidden">
      <div className="flex h-full">
        <aside className="hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-border/80 bg-card/90 backdrop-blur xl:flex xl:flex-col">
          <div className="border-b border-border p-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
              {copy.shell.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {copy.shell.title}
            </h2>
            {/* <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.shell.description}
            </p> */}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-3">
            {navContent}
          </div>
        </aside>

        {mobileMenuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/45 animate-in fade-in-0 duration-200 xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close dashboard menu"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-76 max-w-[84vw] flex-col border-r border-border/80 bg-card animate-in slide-in-from-left-8 duration-200 xl:hidden">
              <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
                    {copy.shell.eyebrow}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {copy.shell.title}
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close dashboard menu"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {navContent}
              </div>
            </aside>
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/80 bg-background/85 backdrop-blur">
            <div className="px-4 py-4 md:px-6">
              <div className="flex  gap-4 lg:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground xl:hidden"
                      onClick={() => setMobileMenuOpen(true)}
                      aria-label="Open dashboard menu"
                    >
                      <Menu className="size-4.5" />
                    </button>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
                        {copy.shell.eyebrow}
                      </p>
                      <h2 className="text-lg font-semibold text-foreground">
                        {activeItem.label}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {roleLabels.length ? (
                    roleLabels.map((role) => (
                      <span
                        key={role}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        looksLikeAdminRole(user?.roles)
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-700",
                      )}
                    >
                      {copy.shell.noRoleHint}
                    </span>
                  )}

                  <Link
                    href={user?.id ? `/account/${user.id}` : "/"}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <Avatar
                      url={user?.avatar}
                      frameUrl={
                        user?.equippedDecorations?.AVATAR_FRAME?.imageUrl
                      }
                      className="size-6 shrink-0"
                      alt={user?.nickname || user?.username || "dashboard user"}
                    />
                    <div className="hidden min-w-0 sm:block">
                      <div className="truncate text-sm font-medium text-foreground">
                        {user?.nickname || user?.username || "-"}
                      </div>
                      {/* <div className="truncate text-xs text-muted-foreground">
                        {copy.shell.accountEntry}
                      </div> */}
                    </div>
                  </Link>
                </div>
              </div>

            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}
