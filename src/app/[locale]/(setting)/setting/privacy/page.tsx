"use client";

import { useEffect, useState } from "react";

import {
  userControllerGetUserConfig,
  userControllerUpdateUserConfig,
} from "@/api";
import { Switch } from "@/components/ui/Switch";
import { useUserStore } from "@/stores";
import { useTranslations } from "next-intl";

type PrivacyConfigState = {
  hideFavorites: boolean;
  hideComments: boolean;
  hideCollections: boolean;
  hideFollowers: boolean;
  hideFollowings: boolean;
  hideTags: boolean;
};

function SettingItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex py-2 gap-4 items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function normalizePrivacyConfig(
  data?: Partial<PrivacyConfigState> | null,
): PrivacyConfigState {
  return {
    hideFavorites: Boolean(data?.hideFavorites),
    hideComments: Boolean(data?.hideComments),
    hideCollections: Boolean(data?.hideCollections),
    hideFollowers: Boolean(data?.hideFollowers),
    hideFollowings: Boolean(data?.hideFollowings),
    hideTags: Boolean(data?.hideTags),
  };
}

export default function SettingPrivacyPage() {
  const t = useTranslations("privacySettingPage");
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const initialConfig = normalizePrivacyConfig(user?.config);
  const [config, setConfig] = useState<PrivacyConfigState>(initialConfig);
  const [savingKey, setSavingKey] = useState<keyof PrivacyConfigState | null>(
    null,
  );

  useEffect(() => {
    const storeConfig = normalizePrivacyConfig(user?.config);
    const hasStoreConfig = Object.values(storeConfig).some(Boolean);

    setConfig(storeConfig);

    if (hasStoreConfig) {
      return;
    }

    const loadConfig = async () => {
      try {
        const response = await userControllerGetUserConfig();
        const nextConfig = normalizePrivacyConfig(
          response.data?.data as Partial<PrivacyConfigState> | undefined,
        );

        setConfig(nextConfig);
        updateUser({
          config: {
            ...user?.config,
            ...(nextConfig as any),
          },
        });
      } catch (error) {
        console.error("Failed to load privacy config:", error);
      }
    };

    void loadConfig();
  }, [updateUser, user?.config]);

  const handleToggle = async (
    key: keyof PrivacyConfigState,
    nextValue: boolean,
  ) => {
    const previousValue = config[key];

    setConfig((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
    setSavingKey(key);

    try {
      await userControllerUpdateUserConfig({
        body: {
          [key]: nextValue,
        },
      });

      const response = await userControllerGetUserConfig();
      const latestConfig = normalizePrivacyConfig(
        response.data?.data as Partial<PrivacyConfigState> | undefined,
      );

      setConfig(latestConfig);
      updateUser({
        config: {
          ...user?.config,
          ...(latestConfig as any),
        },
      });
    } catch (error) {
      console.error(`Failed to update privacy config for ${key}:`, error);
      setConfig((prev) => ({
        ...prev,
        [key]: previousValue,
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const items: Array<{ key: keyof PrivacyConfigState; label: string }> = [
    { key: "hideFavorites", label: t("hideFavorites") },
    { key: "hideComments", label: t("hideComments") },
    { key: "hideCollections", label: t("hideCollections") },
    { key: "hideFollowers", label: t("hideFollowers") },
    { key: "hideFollowings", label: t("hideFollowings") },
    { key: "hideTags", label: t("hideTags") },
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
