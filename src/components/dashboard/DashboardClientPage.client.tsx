"use client";

import {
  articleControllerFindAll,
  commentControllerFindAllComments,
  configControllerFindAll,
  orderControllerGetAllOrders,
  statisticsControllerGetOverview,
  userControllerFindAll,
} from "@/api";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
import { prepareCommentHtmlForDisplay } from "@/lib";
import {
  FileCog,
  FileText,
  MessageSquareText,
  ReceiptText,
  ShieldUser,
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
import {
  compactText,
  formatDashboardCount,
  formatDashboardDate,
  getApiErrorStatus,
  getRoleLabels,
  looksLikeAdminRole,
} from "./utils";
import { useDashboardGuard } from "./useDashboardGuard";

export function DashboardClientPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready, user } = useDashboardGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [data, setData] = useState<DashboardOverviewData | null>(null);

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
        orderControllerGetAllOrders({
          query: { page: 1, limit: 1, status: "PENDING" },
        }),
        configControllerFindAll(),
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

      const [overviewResult, usersResult, articlesResult, commentsResult, ordersResult, pendingResult, configsResult] =
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
          pendingOrdersTotal: pendingOrdersResponse?.data?.data?.meta?.total || 0,
          configsTotal: configsResponse?.data?.data?.data?.length || 0,
        },
        users: usersResponse?.data?.data?.data || [],
        articles: articlesResponse?.data?.data?.data || [],
        comments: commentsResponse?.data?.data?.data || [],
        orders: ordersResponse?.data?.data?.data || [],
        configs: (configsResponse?.data?.data?.data || []).slice(0, 6),
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
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  if (error || !data) {
    return (
      <DashboardErrorView
        title={copy.pages.overview.title}
        description={permissionWarning || copy.common.noPermission}
        retryLabel={copy.common.retry}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <DashboardPageFrame className="h-full overflow-y-auto">
      {permissionWarning ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          {permissionWarning}
        </div>
      ) : null}

      <DashboardStatCards items={summaryItems} locale={locale} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={copy.sections.recentChanges}
            description={copy.shell.description}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  href: "/dashboard/users",
                  label: copy.nav.users,
                  text: copy.shortcuts.users,
                  value: data.summary.usersTotal,
                },
                {
                  href: "/dashboard/articles",
                  label: copy.nav.articles,
                  text: copy.shortcuts.articles,
                  value: data.summary.articlesTotal,
                },
                {
                  href: "/dashboard/comments",
                  label: copy.nav.comments,
                  text: copy.shortcuts.comments,
                  value: data.summary.commentsTotal,
                },
                {
                  href: "/dashboard/orders",
                  label: copy.nav.orders,
                  text: copy.shortcuts.orders,
                  value: data.summary.ordersTotal,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border bg-background px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="text-sm font-semibold text-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.text}
                  </div>
                  <div className="mt-3 text-lg font-semibold text-primary">
                    {formatDashboardCount(item.value, locale)}
                  </div>
                </Link>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={copy.sections.latestUsers}
            action={
              <Link
                href="/dashboard/users"
                className="text-sm font-medium text-primary"
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
                        className="size-10 shrink-0"
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

          <DashboardPanel
            title={copy.sections.latestArticles}
            action={
              <Link
                href="/dashboard/articles"
                className="text-sm font-medium text-primary"
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
                        className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">
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

        <div className="space-y-6">
          <DashboardPanel
            title={copy.sections.latestComments}
            action={
              <Link
                href="/dashboard/comments"
                className="text-sm font-medium text-primary"
              >
                {copy.nav.comments}
              </Link>
            }
          >
            <div className="space-y-3">
              {data.comments.length ? (
                data.comments.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {item.author?.nickname || item.author?.username || "-"}
                    </div>
                    <div
                      className="mt-1 line-clamp-3 overflow-hidden text-sm leading-6 text-muted-foreground [&_p]:m-0 [&_span]:align-middle [&_img]:inline-block [&_img]:align-middle"
                      dangerouslySetInnerHTML={{
                        __html: prepareCommentHtmlForDisplay(
                          String(item.content || ""),
                        ),
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{item.article?.title || "-"}</span>
                      <span>{formatDashboardDate(item.createdAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  {copy.empty.comments}
                </div>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={copy.sections.latestOrders}
            action={
              <Link
                href="/dashboard/orders"
                className="text-sm font-medium text-primary"
              >
                {copy.nav.orders}
              </Link>
            }
          >
            <div className="space-y-3">
              {data.orders.length ? (
                data.orders.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {item.orderNo}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.title}
                        </div>
                      </div>
                      <DashboardStatusBadge value={item.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{item.amount}</span>
                      <span>{formatDashboardDate(item.createdAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  {copy.empty.orders}
                </div>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={copy.sections.latestConfigs}
            action={
              <Link
                href="/dashboard/configs"
                className="text-sm font-medium text-primary"
              >
                {copy.nav.configs}
              </Link>
            }
          >
            <div className="space-y-3">
              {data.configs.length ? (
                data.configs.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {item.key}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.group}
                        </div>
                      </div>
                      <DashboardStatusBadge value={item.public} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {compactText(item.description || item.value, 90)}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  {copy.empty.configs}
                </div>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </DashboardPageFrame>
  );
}
