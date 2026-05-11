"use client";

import { CreateArticleDto } from "@/api";
import { cn, showToast } from "@/lib";
import { Download, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { Button } from "../ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/Dialog";

type ArticleDownloadsPanelProps = {
  open: boolean;
  onClose: () => void;
  downloads?: CreateArticleDto["downloads"];
};

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  direct: "Direct Download",
  baidu: "Baidu Drive",
  aliyun: "Aliyun Drive",
  quark: "Quark Drive",
  onedrive: "OneDrive",
  google: "Google Drive",
  dropbox: "Dropbox",
  lanzou: "Lanzou Drive",
  mega: "Mega",
  telegram: "Telegram",
  other: "Other",
};

function ArticleDownloadsPanel({
  open,
  onClose,
  downloads = [],
}: ArticleDownloadsPanelProps) {
  const t = useTranslations();

  const getTypeLabel = (type?: string): string => {
    return DOWNLOAD_TYPE_LABELS[type || "direct"] || type || "Download";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("articleDownloads.copySuccess"));
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast(t("articleDownloads.copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader className="py-0! pb-4!">
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            {t("articleDownloads.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {downloads && downloads.length > 0 ? (
            downloads.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                {/* Type Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {getTypeLabel(item.type)}
                  </span>
                  {item.visibleWithoutPermission && (
                    <span className="text-xs text-muted-foreground">
                      {t("articleDownloads.public")}
                    </span>
                  )}
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("articleDownloads.url")}:</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex-1 text-sm text-primary hover:underline truncate",
                        !item.url && "text-muted-foreground cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (!item.url) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {item.url || t("articleDownloads.noUrl")}
                      {item.url && <ExternalLink size={14} className="inline ml-1" />}
                    </a>
                    {item.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(item.url!)}
                      >
                        {t("articleDownloads.copy")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Password */}
                {item.password && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("articleDownloads.password")}:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate">
                        {item.password}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(item.password!)}
                      >
                        {t("articleDownloads.copy")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Extraction Code */}
                {item.extractionCode && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("articleDownloads.extractionCode")}:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate">
                        {item.extractionCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(item.extractionCode!)}
                      >
                        {t("articleDownloads.copy")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("articleDownloads.empty")}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(ArticleDownloadsPanel);
