"use client";

import { routing, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 border rounded-md bg-white "
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc === "zh" ? t("zh") : t("en")}
        </option>
      ))}
    </select>
  );
}
