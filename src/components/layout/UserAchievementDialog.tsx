"use client";

import {
  decorationControllerGetMyDecorations,
  DecorationControllerGetMyDecorationsResponse,
  decorationControllerUnuseDecoration,
  decorationControllerUseDecoration,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { formatDate } from "@/lib/utils";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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
  const [selectedItem, setSelectedItem] = useState<UserDecorationItem | null>(
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
    if (targetItem) {
      setSelectedItem(targetItem);
    }
  }, [items, initialItemId]);

  // 对话框关闭时重置状态
  useEffect(() => {
    if (!achievementDialogOpen) {
      setSelectedItem(null);
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

      // 如果有 initialItemId，设置选中项
      if (initialItemId) {
        const targetItem = newItems.find(
          (item) => item.decorationId === initialItemId,
        );
        if (targetItem) {
          setSelectedItem(targetItem);
        }
      }
    } catch (error) {
      console.error("Failed to fetch achievement badges:", error);
      setItems([]);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCloseDialog = () => {
    closeModal(MODAL_IDS.ACHIEVEMENT_BADGE);
    setSelectedItem(null);
  };

  const handleDecorationEquip = async () => {
    if (!selectedItem) return;

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

  const selectedImageUrl = selectedItem ? resolveBadgeImage(selectedItem) : "";
  const selectedEarnedAt = selectedItem ? resolveBadgeEarnedAt(selectedItem) : "";

  return (
    <Dialog open={achievementDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent
        className="h-full max-h-[65vh]! overflow-hidden rounded-2xl border-0 p-0 md:max-w-lg"
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
                onClick={handleDecorationEquip}
              >
                {selectedItem?.isUsing ? t("unequip") : t("equip")}
              </Button>
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
