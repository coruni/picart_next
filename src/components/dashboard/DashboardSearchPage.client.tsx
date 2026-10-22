"use client";

import {
  articleControllerFindHotSearch,
  searchControllerClearArticles,
  searchControllerGetStatus,
  searchControllerSyncArticles,
} from "@/api";
import type {
  ArticleControllerFindHotSearchResponse,
  SearchControllerGetStatusResponse,
} from "@/api/types.gen";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  AlertTriangle,
  Database,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardStatCards } from "./DashboardStatCards";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount } from "./utils";

type SearchStatus = NonNullable<
  SearchControllerGetStatusResponse["data"]
>["data"];

type HotSearchItem = NonNullable<
  ArticleControllerFindHotSearchResponse["data"]
>["data"][number];

export function DashboardSearchPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<SearchStatus | null>(null);
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, hotRes] = await Promise.all([
        searchControllerGetStatus(),
        articleControllerFindHotSearch(),
      ]);

      const statusData = statusRes.data?.data?.data;
      setStatus(statusData || null);

      const hotData = hotRes.data?.data?.data;
      setHotSearches(Array.isArray(hotData) ? hotData : []);
    } catch (error) {
      console.error("Failed to load search data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      loadData();
    }
  }, [ready]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await searchControllerSyncArticles();
      await loadData();
    } catch (error) {
      console.error("Failed to sync articles:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await searchControllerClearArticles();
      setShowClearDialog(false);
      await loadData();
    } catch (error) {
      console.error("Failed to clear articles:", error);
    } finally {
      setClearing(false);
    }
  };

  const statusItems = useMemo(
    () => [
      {
        key: "enabled",
        label: copy.pages.search.indexStatus,
        icon: Database,
        accent: "from-sky-500/18 via-sky-500/8 to-transparent",
        valueNode: status ? (
          <DashboardStatusBadge value={status.enabled ? "active" : "inactive"} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      },
      {
        key: "documents",
        label: copy.pages.search.documentCount,
        value: status?.documentCount || 0,
        icon: Search,
        accent: "from-violet-500/18 via-violet-500/8 to-transparent",
      },
      {
        key: "size",
        label: copy.pages.search.indexSize,
        icon: Database,
        accent: "from-emerald-500/18 via-emerald-500/8 to-transparent",
        valueNode: (
          <span className="text-base">{status?.indexSize || "-"}</span>
        ),
      },
      {
        key: "lastSync",
        label: copy.pages.search.lastSyncTime,
        icon: RefreshCw,
        accent: "from-amber-500/18 via-amber-500/8 to-transparent",
        valueNode: <span className="text-base">-</span>,
      },
    ],
    [copy.pages.search, status],
  );

  if (!ready || loading) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame
      title={copy.pages.search.title}
      description={copy.pages.search.description}
      className="h-full overflow-y-auto"
    >
      <DashboardStatCards
        items={statusItems}
        locale={locale}
        gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      />

      {/* Actions */}
      <DashboardPanel title={copy.pages.search.syncStatus}>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleSync}
            loading={syncing}
            className="rounded-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {copy.pages.search.syncArticles}
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowClearDialog(true)}
            className="rounded-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {copy.pages.search.clearArticles}
          </Button>
        </div>
      </DashboardPanel>

      {/* Hot Search */}
      <DashboardPanel
        title={copy.pages.search.hotSearch}
        description={copy.pages.search.hotSearchManagement}
      >
        {hotSearches.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {copy.common.noData}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotSearches.map((item, index) => (
              <div
                key={item.keyword}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index < 3
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {item.keyword}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {copy.pages.search.searchCount.replace(
                      "{count}",
                      formatDashboardCount(item.count || 0, locale),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* Clear Confirm Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="max-w-lg p-0!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {copy.pages.search.clearArticles}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 px-6">
            <p className="text-sm text-muted-foreground">
              {copy.pages.search.clearConfirm}
            </p>
          </div>
          <DialogFooter className="px-4 pb-4 gap-4!">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setShowClearDialog(false)}
              disabled={clearing}
            >
              {copy.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleClear}
              className="rounded-full"
              loading={clearing}
            >
              {copy.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageFrame>
  );
}
