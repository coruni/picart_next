import { CreateArticleDto } from "@/api";
import { cn } from "@/lib";
import { ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";
import { Button } from "../ui/Button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";

type DownloadDialogProps = {
  open: boolean;
  data: CreateArticleDto["downloads"];
  onClose: () => void;
  onSubmit: (data: CreateArticleDto["downloads"]) => void;
};

type DownloadItem = NonNullable<CreateArticleDto["downloads"]>[number];
type DownloadType = DownloadItem["type"];

const DOWNLOAD_TYPES: DownloadType[] = [
  "direct",
  "baidu",
  "aliyun",
  "quark",
  "onedrive",
  "google",
  "dropbox",
  "lanzou",
  "mega",
  "telegram",
  "other",
];

function createEmptyDownload(): DownloadItem {
  return {
    type: "direct",
    url: "",
    password: "",
    extractionCode: "",
    visibleWithoutPermission: false,
  };
}

function DownloadDialog({
  open,
  onClose,
  data,
  onSubmit,
}: DownloadDialogProps) {
  const t = useTranslations("createPost.downloadDialog");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const downloadTypeOptions: Array<{ value: DownloadType; label: string }> =
    DOWNLOAD_TYPES.map((type) => ({
      value: type,
      label: t(`types.${type}`),
    }));

  const getTypeLabel = (type: DownloadType) => {
    return (
      downloadTypeOptions.find((option) => option.value === type)?.label ||
      t("types.other")
    );
  };

  useEffect(() => {
    if (!open) return;
    setDownloads((data || []).map((item) => ({ ...item })));
    setExpandedIndex((data || []).length > 0 ? 0 : null);
  }, [data, open]);

  const handleItemChange = <K extends keyof DownloadItem>(
    index: number,
    key: K,
    value: DownloadItem[K],
  ) => {
    setDownloads((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleAdd = () => {
    setDownloads((prev) => {
      const next = [...prev, createEmptyDownload()];
      setExpandedIndex(next.length - 1);
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setDownloads((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setExpandedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleToggleItem = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = () => {
    const normalized = downloads
      .map((item) => {
        const url = item.url.trim();
        const password = item.password?.trim();
        const extractionCode = item.extractionCode?.trim();

        return {
          type: item.type,
          url,
          visibleWithoutPermission: Boolean(item.visibleWithoutPermission),
          ...(password ? { password } : {}),
          ...(extractionCode ? { extractionCode } : {}),
        };
      })
      .filter((item) => Boolean(item.url));

    onSubmit(normalized);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" max-w-lg p-0! max-h-[70vh] h-full min-h-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pb-0!">
          <DialogTitle className="text-sm">{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-scroll px-4 pb-2 space-y-2 pt-4">
          {downloads.length === 0 ? (
            <div className=" px-4 py-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            downloads.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg hover:bg-primary/10 relative ${expandedIndex === index ? "z-20 bg-primary/10  outline-1 outline-primary/10" : "z-0"}`}
              >
                <div className="flex items-center gap-2 p-2">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    onClick={() => handleToggleItem(index)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium truncate")}>
                          {t("itemTitle", { index: index + 1 })} ·{" "}
                          {getTypeLabel(item.type)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.url || t("itemSummaryEmptyUrl")}
                        </p>
                      </div>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${expandedIndex === index ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full text-xs shrink-0 size-7  p-0"
                    onClick={() => handleRemove(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div
                  className={cn(
                    "transition-all duration-250 ease-out",
                    expandedIndex === index
                      ? "max-h-140 opacity-100 overflow-visible"
                      : "max-h-0 opacity-0 overflow-hidden",
                  )}
                >
                  <div className="p-3 space-y-3 bg-card rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          {t("type")}
                        </label>
                        <Select
                          value={item.type}
                          onChange={(value) =>
                            handleItemChange(
                              index,
                              "type",
                              value as DownloadType,
                            )
                          }
                          options={downloadTypeOptions}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          {t("extractionCode")}
                        </label>
                        <Input
                          fullWidth
                          value={item.extractionCode || ""}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "extractionCode",
                              event.target.value,
                            )
                          }
                          placeholder={t("optional")}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="space-y-1 w-full">
                        <label className="text-xs text-muted-foreground">
                          {t("url")}
                        </label>
                        <Input
                          fullWidth
                          value={item.url}
                          onChange={(event) =>
                            handleItemChange(index, "url", event.target.value)
                          }
                          placeholder={t("urlPlaceholder")}
                        />
                      </div>

                      <div className="space-y-1 w-full">
                        <label className="text-xs text-muted-foreground">
                          {t("password")}
                        </label>
                        <Input
                          fullWidth
                          value={item.password || ""}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "password",
                              event.target.value,
                            )
                          }
                          placeholder={t("optional")}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-sm text-black/70 dark:text-white/80">
                        {t("visibleWithoutPermission")}
                      </p>
                      <Switch
                        checked={Boolean(item.visibleWithoutPermission)}
                        onCheckedChange={(checked) =>
                          handleItemChange(
                            index,
                            "visibleWithoutPermission",
                            checked,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="mt-2 flex flex-col px-4 pb-4">
          <Button
            fullWidth
            type="button"
            variant="outline"
            className="h-9 rounded-full"
            onClick={handleAdd}
          >
            {t("addItem")}
          </Button>
          <div className="flex items-center shrink-0 justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              className="rounded-full"
              onClick={handleSubmit}
            >
              {t("confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default memo(DownloadDialog);
