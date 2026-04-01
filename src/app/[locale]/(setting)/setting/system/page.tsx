"use client";

import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useAppStore, useTranslateStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";

function SettingItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-muted-foreground ">
          {title}
        </div>
      </div>
      <div className="shrink-0 ">{children}</div>
    </div>
  );
}

export default function SettingSystemPage() {
  const tHeader = useTranslations("header");
  const tTheme = useTranslations("themeSwitcher");
  const tLanguage = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const autoTranslateContent = useTranslateStore(
    (state) => state.autoTranslateContent,
  );
  const setAutoTranslateContent = useTranslateStore(
    (state) => state.setAutoTranslateContent,
  );

  const languageOptions = routing.locales.map((value) => ({
    value,
    label: value === "zh" ? tLanguage("zh") : tLanguage("en"),
  }));

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === locale) {
      return;
    }

    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="px-3">
      <SettingItem title={tHeader("appearanceSettings")}>
        <Select
          className="border-none"
          value={theme}
          onChange={(value) => setTheme(value as "light" | "dark" | "system")}
          options={[
            { value: "system", label: tTheme("system") },
            { value: "light", label: tTheme("light") },
            { value: "dark", label: tTheme("dark") },
          ]}
        />
      </SettingItem>

      <SettingItem title={tHeader("switchLanguage")}>
        <Select
          className="border-none"
          value={locale}
          onChange={handleLocaleChange}
          options={languageOptions}
        />
      </SettingItem>

      <SettingItem title={tHeader("autoTranslate")}>
        <div className="flex h-10 items-center justify-end md:justify-start">
          <Switch
            checked={autoTranslateContent}
            onCheckedChange={setAutoTranslateContent}
          />
        </div>
      </SettingItem>
    </div>
  );
}
