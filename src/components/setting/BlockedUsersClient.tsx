"use client";

import {
  messageControllerGetBlockedUsers,
  messageControllerUnblockPrivateUser,
} from "@/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useRouter } from "@/i18n/routing";
import { cn, formatDate, showToast, getErrorMessage } from "@/lib";
import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type BlockedUser = {
  id: number;
  userId: number;
  username: string;
  nickname?: string;
  avatar?: string;
  blockedAt: string;
};

export function BlockedUsersClient() {
  const t = useTranslations("setting.blockedUsers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await messageControllerGetBlockedUsers();
      // API 返回的是用户ID数组，需要额外获取用户信息
      const userIds = response?.data?.data?.data || [];
      // 这里简化处理，实际应该根据 userIds 获取用户信息
      // 目前先显示空列表，等待后端提供完整的用户信息接口
      setBlockedUsers([]);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
      showToast(getErrorMessage(error, "加载失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlockedUsers();
  }, [loadBlockedUsers]);

  const openUnblockDialog = (user: BlockedUser) => {
    setSelectedUser(user);
    setUnblockDialogOpen(true);
  };

  const handleUnblock = async () => {
    if (!selectedUser || unblockSubmitting) return;

    setUnblockSubmitting(true);
    try {
      await messageControllerUnblockPrivateUser({
        path: { userId: String(selectedUser.userId) },
      });
      setUnblockDialogOpen(false);
      setSelectedUser(null);
      // 刷新列表
      await loadBlockedUsers();
    } catch (error) {
      console.error("Failed to unblock user:", error);
      showToast(getErrorMessage(error, "解除屏蔽失败"));
    } finally {
      setUnblockSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Ban className="size-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{t("description")}</div>

      <div className="space-y-2">
        {blockedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar
                url={user.avatar}
                className="size-10"
                alt={user.nickname || user.username}
              />
              <div>
                <p className={cn("font-medium text-foreground")}>
                  {user.nickname || user.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("blockedAt")}: {formatDate(user.blockedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-4"
                onClick={() => router.push(`/account/${user.userId}`)}
              >
                {t("viewProfile")}
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-full px-4"
                onClick={() => openUnblockDialog(user)}
              >
                {t("unblock")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 取消拉黑确认 Dialog */}
      <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>{t("unblockConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("unblockConfirmDescription", {
                username:
                  selectedUser?.nickname || selectedUser?.username || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 rounded-full px-6 min-w-20"
              onClick={() => setUnblockDialogOpen(false)}
              disabled={unblockSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              className="h-8 rounded-full px-6 min-w-20"
              onClick={handleUnblock}
              loading={unblockSubmitting}
              disabled={unblockSubmitting}
            >
              {t("unblock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
