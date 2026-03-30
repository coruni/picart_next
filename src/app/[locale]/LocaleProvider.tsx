"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleProvider() {
  const locale = useLocale();

  useEffect(() => {
    // 动态设置 html 的 lang 属性
    const htmlElement = document.documentElement;
    const langMap: Record<string, string> = {
      zh: "zh-CN",
      en: "en-US",
    };
    htmlElement.lang = langMap[locale] || locale;
  }, [locale]);

  return null;
}
