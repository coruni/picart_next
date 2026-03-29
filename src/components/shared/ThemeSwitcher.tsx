"use client";

import { useAppStore } from "@/stores";
import { useTranslations } from "next-intl";

export function ThemeSwitcher() {
  const { theme, setTheme } = useAppStore();
  const t = useTranslations("themeSwitcher");

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
      className="px-3 py-2 border rounded-md bg-white "
    >
      <option value="light">{t("light")}</option>
      <option value="dark">{t("dark")}</option>
      <option value="system">{t("system")}</option>
    </select>
  );
}
