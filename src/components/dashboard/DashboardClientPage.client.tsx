"use client";

import {
  articleControllerFindAll,
  commentControllerFindAllComments,
  configControllerFindAll,
  configControllerGetAdvertisementConfig,
  configControllerGetPublicConfigs,
  orderControllerGetAllOrders,
  orderControllerGetPendingOrders,
  statisticsControllerGetOverview,
  userControllerFindAll,
} from "@/api";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
import { prepareCommentHtmlForDisplay } from "@/lib";
import {
  FileCog,
  FileText,
  Medal,
  MessageSquareText,
  ReceiptText,
  Search,
  ShieldUser,
  Sparkles,
  Trophy,
  UserRoundCog,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardErrorView, DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardStatCards } from "./DashboardStatCards";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import { DashboardTable } from "./DashboardTable";
import type { DashboardOverviewData } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import {
  compactText,
  formatDashboardCount,
  formatDashboardDate,
  getApiErrorStatus,
  getRoleLabels,
  looksLikeAdminRole
} from "./utils";

export function DashboardClientPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready, user } = useDashboardGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const overviewText = copy.pages.overview;

  useEffect(() => {
    if (!ready || !user) {
      return;
    }

    const currentUser = user;

    let mounted = true;

    async function loadOverview() {
      setLoading(true);
      setError(false);
      setPermissionWarning(null);

      const results = await Promise.allSettled([
        statisticsControllerGetOverview(),
        userControllerFindAll({ query: { page: 1, limit: 5 } }),
        articleControllerFindAll({ query: { page: 1, limit: 5 } }),
        commentControllerFindAllComments({ query: { page: 1, limit: 5 } }),
        orderControllerGetAllOrders({ query: { page: 1, limit: 5 } }),
        orderControllerGetPendingOrders(),
        configControllerFindAll(),
        configControllerGetPublicConfigs(),
        configControllerGetAdvertisementConfig(),
      ]);

      if (!mounted) {
        return;
      }

      const rejectedStatuses = results
        .filter((result) => result.status === "rejected")
        .map((result) => getApiErrorStatus(result.reason));

      if (results.every((result) => result.status === "rejected")) {
        setError(true);
        if (rejectedStatuses.some((status) => status === 401 || status === 403)) {
          setPermissionWarning(copy.common.noPermission);
        }
        setLoading(false);
        return;
      }

      const [
        overviewResult,
        usersResult,
        articlesResult,
        commentsResult,
        ordersResult,
        pendingResult,
        configsResult,
        publicConfigResult,
        advertisementConfigResult,
      ] =
        results;

      const overviewResponse =
        overviewResult.status === "fulfilled" ? overviewResult.value : null;
      const usersResponse =
        usersResult.status === "fulfilled" ? usersResult.value : null;
      const articlesResponse =
        articlesResult.status === "fulfilled" ? articlesResult.value : null;
      const commentsResponse =
        commentsResult.status === "fulfilled" ? commentsResult.value : null;
      const ordersResponse =
        ordersResult.status === "fulfilled" ? ordersResult.value : null;
      const pendingOrdersResponse =
        pendingResult.status === "fulfilled" ? pendingResult.value : null;
      const configsResponse =
        configsResult.status === "fulfilled" ? configsResult.value : null;
      const publicConfigResponse =
        publicConfigResult.status === "fulfilled" ? publicConfigResult.value : null;
      const advertisementConfigResponse =
        advertisementConfigResult.status === "fulfilled"
          ? advertisementConfigResult.value
          : null;
      const overviewData = overviewResponse?.data?.data;

      if (
        !looksLikeAdminRole(currentUser.roles) &&
        rejectedStatuses.some((status) => status === 403)
      ) {
        setPermissionWarning(copy.common.noPermission);
      } else if (!looksLikeAdminRole(currentUser.roles)) {
        setPermissionWarning(copy.shell.noRoleHint);
      }

      setData({
        user: currentUser,
        summary: {
          usersTotal: overviewData?.users?.total || 0,
          articlesTotal: overviewData?.content?.articles || 0,
          commentsTotal: overviewData?.content?.comments || 0,
          ordersTotal: ordersResponse?.data?.data?.meta?.total || 0,
          pendingOrdersTotal: pendingOrdersResponse?.data?.data?.length || 0,
          configsTotal: configsResponse?.data?.data?.data?.length || 0,
        },
        users: usersResponse?.data?.data?.data || [],
        articles: articlesResponse?.data?.data?.data || [],
        comments: commentsResponse?.data?.data?.data || [],
        orders: ordersResponse?.data?.data?.data || [],
        configs: (configsResponse?.data?.data?.data || []).slice(0, 6),
        publicConfig: publicConfigResponse?.data?.data || null,
        advertisementConfig: advertisementConfigResponse?.data?.data || null,
        pendingOrderNos: (pendingOrdersResponse?.data?.data || []).map((item: unknown) =>
          typeof item === "string" ? item : (item as { orderNo?: string }).orderNo || ""
        ).filter(Boolean),
      });

      setLoading(false);
    }

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, [copy.common.noPermission, copy.shell.noRoleHint, ready, user]);

  const summaryItems = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        key: "users",
        label: copy.summary.users,
        value: data.summary.usersTotal,
        icon: ShieldUser,
        accent: "from-sky-500/18 via-sky-500/8 to-transparent",
      },
      {
        key: "articles",
        label: copy.summary.articles,
        value: data.summary.articlesTotal,
        icon: FileText,
        accent: "from-violet-500/18 via-violet-500/8 to-transparent",
      },
      {
        key: "comments",
        label: copy.summary.comments,
        value: data.summary.commentsTotal,
        icon: MessageSquareText,
        accent: "from-emerald-500/18 via-emerald-500/8 to-transparent",
      },
      {
        key: "orders",
        label: copy.summary.orders,
        value: data.summary.ordersTotal,
        icon: ReceiptText,
        accent: "from-amber-500/18 via-amber-500/8 to-transparent",
      },
      {
        key: "pendingOrders",
        label: copy.summary.pendingOrders,
        value: data.summary.pendingOrdersTotal,
        icon: UserRoundCog,
        accent: "from-rose-500/18 via-rose-500/8 to-transparent",
      },
      {
        key: "configs",
        label: copy.summary.configs,
        value: data.summary.configsTotal,
        icon: FileCog,
        accent: "from-cyan-500/18 via-cyan-500/8 to-transparent",
      },
    ];
  }, [copy.summary, data]);

  if (!ready || loading) {
    return (
      <DashboardPageFrame title={copy.pages.overview.title}>
        <DashboardLoadingView text={copy.common.loading} />
      </DashboardPageFrame>
    );
  }

  if (error || !data) {
    return (
      <DashboardPageFrame title={copy.pages.overview.title}>
        <DashboardErrorView
          title={copy.pages.overview.title}
          description={permissionWarning || copy.common.noPermission}
          retryLabel={copy.common.retry}
          onRetry={() => window.location.reload()}
        />
      </DashboardPageFrame>
    );
  }

  return (
    <DashboardPageFrame
      title={copy.pages.overview.title}
      description={copy.pages.overview.description}
    >
      {permissionWarning ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          {permissionWarning}
        </div>
      ) : null}

      <DashboardStatCards items={summaryItems} locale={locale} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧主要内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 快捷入口 */}
          <DashboardPanel
            title={copy.sections.moduleShortcuts}
            collapsible
            defaultCollapsed={false}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { href: "/dashboard/users", label: copy.nav.users, icon: ShieldUser, desc: copy.shortcuts.users },
                { href: "/dashboard/articles", label: copy.nav.articles, icon: FileText, desc: copy.shortcuts.articles },
                { href: "/dashboard/comments", label: copy.nav.comments, icon: MessageSquareText, desc: copy.shortcuts.comments },
                { href: "/dashboard/orders", label: copy.nav.orders, icon: ReceiptText, desc: copy.shortcuts.orders },
                { href: "/dashboard/points", label: copy.nav.points, icon: Medal, desc: copy.shortcuts.points },
                { href: "/dashboard/decorations", label: copy.nav.decorations, icon: Sparkles, desc: copy.shortcuts.decorations },
                { href: "/dashboard/achievements", label: copy.nav.achievements, icon: Trophy, desc: copy.shortcuts.achievements },
                { href: "/dashboard/configs", label: copy.nav.configs, icon: FileCog, desc: copy.shortcuts.configs },
                { href: "/dashboard/search", label: copy.nav.search, icon: Search, desc: copy.pages.search.description },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                  </Link>
                );
              })}
            </div>
          </DashboardPanel>

          {/* 最近用户 */}
          <DashboardPanel
            title={copy.sections.latestUsers}
            action={
              <Link
                href="/dashboard/users"
                className="text-sm font-medium text-primary hover:underline"
              >
                {copy.nav.users}
              </Link>
            }
          >
            <DashboardTable
              rows={data.users}
              getRowKey={(item) => item.id}
              emptyText={copy.empty.users}
              columns={[
                {
                  key: "user",
                  header: copy.columns.user,
                  render: (item) => (
                    <Link
                      href={`/account/${item.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <Avatar
                        url={item.avatar}
                        frameUrl={item.equippedDecorations?.AVATAR_FRAME?.imageUrl}
                        className="size-9 shrink-0"
                        alt={item.nickname || item.username}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {item.nickname || item.username}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {getRoleLabels(item.roles).join(", ") || "-"}
                        </div>
                      </div>
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: copy.columns.status,
                  render: (item) => (
                    <DashboardStatusBadge value={item.status} />
                  ),
                },
                {
                  key: "updatedAt",
                  header: copy.columns.updatedAt,
                  render: (item) => (
                    <span className="text-sm text-muted-foreground">
                      {formatDashboardDate(item.updatedAt)}
                    </span>
                  ),
                },
              ]}
            />
          </DashboardPanel>

          {/* 最近文章 */}
          <DashboardPanel
            title={copy.sections.latestArticles}
            action={
              <Link
                href="/dashboard/articles"
                className="text-sm font-medium text-primary hover:underline"
              >
                {copy.nav.articles}
              </Link>
            }
          >
            <DashboardTable
              rows={data.articles}
              getRowKey={(item) => item.id}
              emptyText={copy.empty.articles}
              columns={[
                {
                  key: "title",
                  header: copy.columns.article,
                  render: (item) => (
                    <div className="min-w-0">
                      <Link
                        href={`/article/${item.id}`}
                        prefetch={false}
                        className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {item.author?.nickname || item.author?.username || "-"}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "views",
                  header: copy.columns.views,
                  render: (item) => (
                    <span className="text-sm text-foreground">
                      {formatDashboardCount(item.views || 0, locale)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: copy.columns.status,
                  render: (item) => (
                    <DashboardStatusBadge value={item.status} />
                  ),
                },
              ]}
            />
          </DashboardPanel>
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 最新评论 */}
          <DashboardPanel
            title={copy.sections.latestComments}
            action={
              <Link
                href="/dashboard/comments"
                className="text-sm font-medium text-primary hover:underline"
              >
                {copy.nav.comments}
              </Link>
            }
          >
            <div className="space-y-3">
              {data.comments.length ? (
                data.comments.slice(0, 5).map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.author?.nickname || item.author?.username || "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDashboardDate(item.createdAt)}
                      </span>
                    </div>
                    <div
                      className="mt-1 line-clamp-2 text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: prepareCommentHtmlForDisplay(
                          String(item.content || ""),
                        ),
                      }}
                    />
                    <div className="mt-2 truncate text-xs text-muted-foreground">
                      {item.article?.title || "-"}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                  {copy.empty.comments}
                </div>
              )}
            </div>
          </DashboardPanel>

          {/* 最近订单 */}
          <DashboardPanel
            title={copy.sections.latestOrders}
            action={
              <Link
                href="/dashboard/orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                {copy.nav.orders}
              </Link>
            }
          >
            <div className="space-y-3">
              {data.orders.length ? (
                data.orders.slice(0, 5).map((item) => (
                  <article
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {item.orderNo}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.title}
                      </div>
                    </div>
                    <div className="text-right">
                      <DashboardStatusBadge value={item.status} size="sm" />
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDashboardDate(item.createdAt)}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                  {copy.empty.orders}
                </div>
              )}
            </div>
          </DashboardPanel>

          {/* 配置概览 */}
          <DashboardPanel
            title={copy.sections.latestConfigs}
            collapsible
            defaultCollapsed={true}
          >
            <div className="space-y-3">
              {data.publicConfig ? (
                <article className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {overviewText.publicConfig}
                    </span>
                    <DashboardStatusBadge
                      value={data.publicConfig.maintenance_mode ? "inactive" : "active"}
                      size="sm"
                    />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{overviewText.site}</span>
                      <span className="text-foreground">{data.publicConfig.site_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{overviewText.maintenance}</span>
                      <span>{data.publicConfig.maintenance_mode ? copy.status.active : copy.status.inactive}</span>
                    </div>
                  </div>
                </article>
              ) : null}

              {data.advertisementConfig ? (
                <article className="rounded-lg border border-border bg-background p-3">
                  <div className="text-sm font-medium text-foreground">
                    {overviewText.advertisement}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: "homepage", label: overviewText.homepageAd },
                      { key: "articleTop", label: overviewText.articleTopAd },
                      { key: "articleBottom", label: overviewText.articleBottomAd },
                      { key: "global", label: overviewText.globalAd },
                    ].map(({ key, label }) => {
                      const config = data.advertisementConfig?.[key as keyof typeof data.advertisementConfig];
                      const enabled = config?.enabled ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={enabled ? "text-emerald-600" : "text-muted-foreground"}>
                            {enabled ? copy.status.active : copy.status.inactive}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ) : null}

              {data.pendingOrderNos.length > 0 && (
                <article className="rounded-lg border border-border bg-background p-3">
                  <div className="text-sm font-medium text-foreground">
                    {overviewText.pendingQueue}
                  </div>
                  <div className="mt-2 space-y-1">
                    {data.pendingOrderNos.slice(0, 3).map((orderNo) => (
                      <div
                        key={orderNo}
                        className="truncate rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground font-mono"
                      >
                        {orderNo}
                      </div>
                    ))}
                    {data.pendingOrderNos.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{data.pendingOrderNos.length - 3} more
                      </div>
                    )}
                  </div>
                </article>
              )}

              {data.configs.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.key}
                    </span>
                    <DashboardStatusBadge value={item.public} size="sm" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {compactText(item.description || item.value, 50)}
                  </div>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </DashboardPageFrame>
  );
}
