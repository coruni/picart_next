"use client";

import { useEffect, useState } from "react";

import {
  userControllerGetUserConfig,
  userControllerUpdateNotificationSettings,
} from "@/api";
import { Switch } from "@/components/ui/Switch";
import { showToast, getErrorMessage } from "@/lib";
import { useUserStore } from "@/stores";
import { useTranslations } from "next-intl";

type NotificationConfigState = {
  enableSystemNotification: boolean;
  enableCommentNotification: boolean;
  enableLikeNotification: boolean;
  enableFollowNotification: boolean;
  enableMessageNotification: boolean;
  enableOrderNotification: boolean;
  enablePaymentNotification: boolean;
  enableInviteNotification: boolean;
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  enablePushNotification: boolean;
};

function SettingItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function normalizeNotificationConfig(
  data?: Partial<NotificationConfigState> | null,
): NotificationConfigState {
  return {
    enableSystemNotification: Boolean(data?.enableSystemNotification),
    enableCommentNotification: Boolean(data?.enableCommentNotification),
    enableLikeNotification: Boolean(data?.enableLikeNotification),
    enableFollowNotification: Boolean(data?.enableFollowNotification),
    enableMessageNotification: Boolean(data?.enableMessageNotification),
    enableOrderNotification: Boolean(data?.enableOrderNotification),
    enablePaymentNotification: Boolean(data?.enablePaymentNotification),
    enableInviteNotification: Boolean(data?.enableInviteNotification),
    enableEmailNotification: Boolean(data?.enableEmailNotification),
    enableSmsNotification: Boolean(data?.enableSmsNotification),
    enablePushNotification: Boolean(data?.enablePushNotification),
  };
}

export default function SettingNotificationPage() {
  const t = useTranslations("notificationSettingPage");
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const initialConfig = normalizeNotificationConfig(user?.config);
  const [config, setConfig] = useState<NotificationConfigState>(initialConfig);
  const [savingKey, setSavingKey] = useState<
    keyof NotificationConfigState | null
  >(null);

  useEffect(() => {
    const storeConfig = normalizeNotificationConfig(user?.config);
    const hasStoreConfig = Object.values(storeConfig).some(Boolean);

    setConfig(storeConfig);

    if (hasStoreConfig) {
      return;
    }

    const loadConfig = async () => {
      try {
        const response = await userControllerGetUserConfig();
        const nextConfig = normalizeNotificationConfig(
          response.data?.data as Partial<NotificationConfigState> | undefined,
        );

        setConfig(nextConfig);
        // 使用函数式更新避免依赖 user
        const currentUser = useUserStore.getState().user;
        useUserStore.getState().updateUser({
          config: {
            ...currentUser?.config,
            ...(nextConfig as any),
          },
        });
      } catch (error) {
        console.error("Failed to load notification config:", error);
      }
    };

    void loadConfig();
    // 只在挂载时运行，或当 user?.config 从 undefined 变为有值时
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (
    key: keyof NotificationConfigState,
    nextValue: boolean,
  ) => {
    const previousValue = config[key];

    setConfig((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
    setSavingKey(key);

    try {
      await userControllerUpdateNotificationSettings({
        body: {
          [key]: nextValue,
        },
      });

      const response = await userControllerGetUserConfig();
      const latestConfig = normalizeNotificationConfig(
        response.data?.data as Partial<NotificationConfigState> | undefined,
      );

      setConfig(latestConfig);
      updateUser({
        config: {
          ...user?.config,
          ...(latestConfig as any),
        },
      });
    } catch (error) {
      console.error(`Failed to update notification config for ${key}:`, error);
      showToast(getErrorMessage(error, "设置保存失败"));
      setConfig((prev) => ({
        ...prev,
        [key]: previousValue,
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const items: Array<{ key: keyof NotificationConfigState; label: string }> = [
    { key: "enableSystemNotification", label: t("enableSystemNotification") },
    { key: "enableCommentNotification", label: t("enableCommentNotification") },
    { key: "enableLikeNotification", label: t("enableLikeNotification") },
    { key: "enableFollowNotification", label: t("enableFollowNotification") },
    { key: "enableMessageNotification", label: t("enableMessageNotification") },
    { key: "enableOrderNotification", label: t("enableOrderNotification") },
    { key: "enablePaymentNotification", label: t("enablePaymentNotification") },
    { key: "enableInviteNotification", label: t("enableInviteNotification") },
    { key: "enableEmailNotification", label: t("enableEmailNotification") },
    { key: "enableSmsNotification", label: t("enableSmsNotification") },
    { key: "enablePushNotification", label: t("enablePushNotification") },
  ];

  return (
    <div className="px-3">
      {items.map((item) => (
        <SettingItem key={item.key} title={item.label}>
          <div className="flex h-8 items-center justify-end md:justify-start">
            <Switch
              checked={config[item.key]}
              onCheckedChange={(checked) =>
                void handleToggle(item.key, checked)
              }
              loading={savingKey === item.key}
            />
          </div>
        </SettingItem>
      ))}
    </div>
  );
}
