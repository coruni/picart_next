"use client";

import {
  decorationControllerFindOne,
  decorationControllerGetMyDecorations,
  DecorationControllerGetMyDecorationsResponse,
  decorationControllerUnuseDecoration,
  decorationControllerUseDecoration,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/Dialog";
import { formatDate } from "@/lib/utils";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type UserDecorationItem =
  DecorationControllerGetMyDecorationsResponse["data"]["data"][number];

// Type for non-owned decoration details from API
type DecorationDetail = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
};

// Union type for selected item (owned or non-owned)
type SelectedAchievement =
  | ({ isOwned: true } & UserDecorationItem)
  | ({ isOwned: false; decoration: DecorationDetail });

function resolveBadgeName(item: SelectedAchievement | null): string {
  if (!item) return "-";
  if (item.isOwned) {
    return item.decoration?.name || "-";
  }
  return item.decoration?.name || "-";
}

function resolveBadgeDescription(item: SelectedAchievement | null): string {
  if (!item) return "";
  if (item.isOwned) {
    return item.decoration?.description || "";
  }
  return item.decoration?.description || "";
}

function resolveBadgeImage(item: SelectedAchievement | null): string {
  if (!item) return "";
  if (item.isOwned) {
    return item.decoration?.imageUrl || "";
  }
  return item.decoration?.imageUrl || "";
}

function resolveBadgeEarnedAt(item: SelectedAchievement | null): string | undefined {
  if (!item) return undefined;
  if (item.isOwned) {
    return item.createdAt;
  }
  return undefined;
}

function isItemUsing(item: SelectedAchievement | null): boolean {
  if (!item) return false;
  if (item.isOwned) {
    return item.isUsing;
  }
  return false;
}

export function UserAchievementDialog() {
  const t = useTranslations("decorationPage");
  const tc = useTranslations("common");
  const locale = useLocale();
  const achievementDialogOpen = useModalStore((state) =>
    state.isOpen(MODAL_IDS.ACHIEVEMENT_BADGE),
  );
  const closeModal = useModalStore((state) => state.closeModal);
  const getModalData = useModalStore((state) => state.getModalData);
  const modalData = getModalData(MODAL_IDS.ACHIEVEMENT_BADGE);
  const initialItemId = modalData?.achievementId;

  const [items, setItems] = useState<UserDecorationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedAchievement | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  // 加载成就徽章列表
  useEffect(() => {
    if (achievementDialogOpen) {
      fetchBadges();
    }
  }, [achievementDialogOpen]);

  // 处理初始选中项
  useEffect(() => {
    if (!initialItemId || items.length === 0) return;

    const targetItem = items.find((item) => item.decorationId === initialItemId);
    if (targetItem && !selectedItem) {
      setSelectedItem({ ...targetItem, isOwned: true });
    }
  }, [items, initialItemId, selectedItem]);

  // 对话框关闭时重置状态
  useEffect(() => {
    if (!achievementDialogOpen) {
      setSelectedItem(null);
      setItems([]);
    }
  }, [achievementDialogOpen]);

  const fetchBadges = async () => {
    setDialogLoading(true);
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

      const newItems = data?.data?.data || [];
      setItems(newItems);

      // 如果有 initialItemId，先尝试在已拥有列表中查找
      if (initialItemId) {
        const targetItem = newItems.find(
          (item) => item.decorationId === initialItemId,
        );
        if (targetItem) {
          setSelectedItem({ ...targetItem, isOwned: true });
        } else {
          // 如果不在已拥有列表中，通过API获取详情
          await fetchDecorationDetail(initialItemId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch achievement badges:", error);
      setItems([]);
      // 如果有 initialItemId，尝试通过API获取
      if (initialItemId) {
        await fetchDecorationDetail(initialItemId);
      }
    } finally {
      setDialogLoading(false);
    }
  };

  // 获取非拥有的装饰品详情
  const fetchDecorationDetail = async (decorationId: number) => {
    try {
      const response = await decorationControllerFindOne({
        path: { id: String(decorationId) },
      });
      const decoration = response?.data?.data;
      if (decoration) {
        setSelectedItem({
          isOwned: false,
          decoration: decoration as DecorationDetail,
        });
      }
    } catch (error) {
      console.error("Failed to fetch decoration detail:", error);
    }
  };

  const handleCloseDialog = () => {
    closeModal(MODAL_IDS.ACHIEVEMENT_BADGE);
    setSelectedItem(null);
  };

  const handleDecorationEquip = async () => {
    if (!selectedItem || !selectedItem.isOwned) return;

    setIsLoading(true);
    try {
      if (!selectedItem.isUsing) {
        await decorationControllerUseDecoration({
          path: {
            decorationId: String(selectedItem.decorationId),
          },
        });
      } else {
        await decorationControllerUnuseDecoration({
          path: { decorationId: String(selectedItem.decorationId) },
        });
      }
      // 刷新数据
      await fetchBadges();
    } finally {
      setIsLoading(false);
    }
  };

  const selectedImageUrl = resolveBadgeImage(selectedItem);
  const selectedEarnedAt = resolveBadgeEarnedAt(selectedItem);
  const isOwned = selectedItem?.isOwned ?? false;
  const isUsing = isItemUsing(selectedItem);

  return (
    <Dialog open={achievementDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogOverlay className="z-500!" />
      <DialogContent
        className="w-[calc(100vw-1rem)] h-full max-h-[65vh]! overflow-hidden rounded-2xl border-0 p-0 md:max-w-lg z-501!"
        showClose={true}
      >
        {dialogLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-secondary">{tc("loading")}</div>
          </div>
        ) : selectedItem ? (
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

              {/* Earned Date - only show for owned items */}
              {isOwned && selectedEarnedAt && (
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

              {/* Action Button - only show for owned items */}
              {isOwned && (
                <Button
                  fullWidth
                  loading={isLoading}
                  variant={isUsing ? "secondary" : "default"}
                  className="mt-auto h-10 w-full rounded-full"
                  onClick={handleDecorationEquip}
                >
                  {isUsing ? t("unequip") : t("equip")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            {t("emptyByType", { type: t("types.achievement") })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
