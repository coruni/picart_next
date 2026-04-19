"use client";

import {
  decorationControllerGetMyDecorations,
  DecorationControllerGetMyDecorationsResponse,
  decorationControllerUnuseDecoration,
  decorationControllerUseDecoration,
} from "@/api";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { Button } from "../ui/Button";

type UserDecorationItem =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][number];

function resolveBadgeName(item: UserDecorationItem) {
  return item.decoration?.name || "-";
}

function resolveBadgeDescription(item: UserDecorationItem) {
  return item.decoration?.description || "";
}

function resolveBadgeImage(item: UserDecorationItem) {
  return item.decoration?.imageUrl || "";
}

function resolveBadgeEarnedAt(item: UserDecorationItem) {
  return item.createdAt;
}

export function AchievementBadgeList() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [items, setItems] = useState<UserDecorationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserDecorationItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const response = await decorationControllerGetMyDecorations({
          query: { type: "ACHIEVEMENT_BADGE", page: 1, limit: 100 },
        });
        const data = response?.data as
          | {
              data?: {
                data?: UserDecorationItem[];
              };
            }
          | undefined;

        setItems(data?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch achievement badges:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchBadges();
  }, []);

  const handleItemClick = (item: UserDecorationItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const handleDecorationEquip = async (data: UserDecorationItem) => {
    setIsLoading(true);
    try {
      if (!data.isUsing) {
        // Use decorationId for equipping
        await decorationControllerUseDecoration({
          path: {
            decorationId: String(data.decorationId),
          },
        });
      } else {
        await decorationControllerUnuseDecoration({
          path: { decorationId: String(data.decorationId) },
        });
      }
      // 刷新数据
      const response = await decorationControllerGetMyDecorations({
        query: { type: "ACHIEVEMENT_BADGE", page: 1, limit: 100 },
      });
      const resData = response?.data as
        | {
            data?: {
              data?: UserDecorationItem[];
            };
          }
        | undefined;
      const newItems = resData?.data?.data || [];
      setItems(newItems);
      // 更新选中项状态
      const updatedItem = newItems.find(
        (item) => item.decorationId === data.decorationId,
      );
      if (updatedItem) {
        setSelectedItem(updatedItem);
      }
    } finally {
      setIsLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-secondary">{tc("loading")}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-secondary">
        <div className="mb-2 text-4xl">-</div>
        <div>{t("emptyByType", { type: t("types.achievement") })}</div>
      </div>
    );
  }

  const selectedImageUrl = selectedItem ? resolveBadgeImage(selectedItem) : "";
  const selectedEarnedAt = selectedItem
    ? resolveBadgeEarnedAt(selectedItem)
    : "";

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
          {items.map((item, index) => {
            const imageUrl = resolveBadgeImage(item);
            const earnedAt = resolveBadgeEarnedAt(item);

            return (
              <div
                key={item.id ?? `${resolveBadgeName(item)}-${index}`}
                className="flex cursor-pointer flex-col items-center rounded-2xl bg-muted p-4 hover:bg-primary/15"
                onClick={() => handleItemClick(item)}
              >
                {/* Badge Image */}
                <div className="relative my-3 aspect-square size-26 w-full overflow-hidden md:size-30">
                  {imageUrl ? (
                    <ImageWithFallback
                      src={imageUrl}
                      alt={resolveBadgeName(item)}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      -
                    </div>
                  )}
                </div>

                {/* Badge Name */}
                <div className="my-2 text-center text-sm font-semibold">
                  {resolveBadgeName(item)}
                </div>

                {/* Earned Date */}
                {earnedAt && (
                  <div className="flex items-center gap-1 pt-3 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{formatDate(earnedAt, locale)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent
          className="h-full max-h-[65vh]! overflow-hidden rounded-2xl border-0 p-0 md:max-w-lg"
          showClose={true}
        >
          {selectedItem && (
            <div className="flex h-full flex-1 flex-col">
              {/* Header with badge image */}
              <div className="relative flex h-48 items-center justify-center bg-linear-to-br from-green-200 to-green-100 dark:from-green-800 dark:to-green-900">
                {selectedImageUrl ? (
                  <ImageWithFallback
                    draggable={false}
                    src={selectedImageUrl}
                    alt={resolveBadgeName(selectedItem)}
                    width={158}
                    height={158}
                    className="object-contain"
                  />
                ) : (
                  <div className="text-6xl text-muted-foreground">-</div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col items-center px-6 pt-4 pb-6">
                {/* Badge Name */}
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {resolveBadgeName(selectedItem)}
                </h3>

                {/* Earned Date */}
                {selectedEarnedAt && (
                  <div className="mb-4 flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Clock size={14} />
                    <span>
                      {formatDate(selectedEarnedAt, locale)} {t("unlocked")}
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  {resolveBadgeDescription(selectedItem)}
                </p>

                {/* Action Button */}
                <Button
                  fullWidth
                  loading={isLoading}
                  variant={selectedItem.isUsing ? "secondary" : "default"}
                  className="mt-auto h-10 w-full rounded-full"
                  onClick={() => handleDecorationEquip(selectedItem)}
                >
                  {selectedItem?.isUsing ? t("unequip") : t("equip")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
