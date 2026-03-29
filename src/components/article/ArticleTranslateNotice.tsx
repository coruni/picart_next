"use client";

import { useAppStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    translate?: {
      execute: (documents?: Element[] | NodeListOf<Element>) => void;
      changeLanguage?: (language: string) => void;
      reset?: () => void;
      setDocuments?: (documents: Element[] | NodeListOf<Element>) => void;
      listener?: {
        start?: () => void;
      };
      language?: {
        setLocal?: (language: string) => void;
      };
      service?: {
        use?: (service: string) => void;
      };
      selectLanguageTag?: {
        show?: boolean;
      };
    };
  }
}

const DETAIL_TRANSLATE_SCOPE_SELECTOR =
  "[data-auto-translate-article-detail] [data-auto-translate-content]";
const AUTO_TRANSLATE_SELECTOR = "[data-auto-translate-content]";
const ARTICLE_DETAIL_SCOPE_SELECTOR = "[data-auto-translate-article-detail]";
const TRANSLATE_LANGUAGE_MAP: Record<string, string | null> = {
  zh: null,
  en: "english",
};

export function ArticleTranslateNotice() {
  const t = useTranslations("articleDetail");
  const locale = useLocale();
  const autoTranslateContent = useAppStore(
    (state) => state.autoTranslateContent,
  );
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setShowOriginal(false);
  }, [locale]);

  const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale] ?? null;
  const isVisible = !!targetLanguage;

  const providerLabel = useMemo(() => "translate.js", []);

  if (!isVisible) {
    return null;
  }

  const handleToggle = () => {
    const translate = window.translate;
    if (!translate) {
      return;
    }

    const documents = document.querySelectorAll(DETAIL_TRANSLATE_SCOPE_SELECTOR);
    if (documents.length === 0) {
      return;
    }

    if (showOriginal) {
      translate.service?.use?.("client.edge");
      translate.language?.setLocal?.("chinese_simplified");
      if (translate.selectLanguageTag) {
        translate.selectLanguageTag.show = false;
      }
      translate.setDocuments?.(documents);
      translate.listener?.start?.();
      translate.execute(documents);
      translate.changeLanguage?.(targetLanguage!);
      setShowOriginal(false);
      return;
    }

    translate.reset?.();
    if (autoTranslateContent) {
      const autoTranslateDocuments = Array.from(
        document.querySelectorAll(AUTO_TRANSLATE_SELECTOR),
      ).filter((element) => !element.closest(ARTICLE_DETAIL_SCOPE_SELECTOR));

      if (autoTranslateDocuments.length > 0) {
        translate.service?.use?.("client.edge");
        translate.language?.setLocal?.("chinese_simplified");
        translate.setDocuments?.(autoTranslateDocuments);
        translate.execute(autoTranslateDocuments);
        translate.changeLanguage?.(targetLanguage!);
      }
    }
    setShowOriginal(true);
  };

  return (
    <div className="mt-2 flex items-center justify-between rounded-xl bg-muted px-4 py-2 text-xs text-secondary">
      <span>{t("translatedBy", { provider: providerLabel })}</span>
      <button
        type="button"
        onClick={handleToggle}
        className="cursor-pointer font-medium text-primary transition-opacity hover:opacity-80"
      >
        {showOriginal ? t("viewTranslation") : t("viewOriginal")}
      </button>
    </div>
  );
}
