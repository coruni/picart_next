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
import { useEffect, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardPanel } from "./DashboardPanel";
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

  if (!ready || loading) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="h-full overflow-y-auto">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {copy.pages.search.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {copy.pages.search.description}
            </p>
          </div>
        </div>

        {/* Index Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium text-muted-foreground">
                {copy.pages.search.indexStatus}
              </div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {status ? (
                <DashboardStatusBadge
                  value={status.enabled ? "active" : "inactive"}
                />
              ) : (
                "-"
              )}
            </div>
          </div>

          {/* Document Count Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium text-muted-foreground">
                {copy.pages.search.documentCount}
              </div>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatDashboardCount(status?.documentCount || 0, locale)}
            </div>
          </div>

          {/* Index Size Card */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium text-muted-foreground">
                {copy.pages.search.indexSize}
              </div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {status?.indexSize || "-"}
            </div>
          </div>

          {/* Last Sync Time Card - 从其他 API 获取或从 status 扩展 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium text-muted-foreground">
                {copy.pages.search.lastSyncTime}
              </div>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold">-</div>
          </div>
        </div>

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
              className="rounded-full "
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
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index < 3
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.keyword}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatDashboardCount(item.count || 0, locale)} 次搜索
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>

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
          <DialogFooter className="px-6 pb-4 gap-4!">
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
