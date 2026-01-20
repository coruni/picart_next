"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc === "zh" ? "中文" : "English"}
        </option>
      ))}
    </select>
  );
}
