"use client";

import { useAppStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DETAIL_TRANSLATE_SCOPE_SELECTOR =
  "[data-auto-translate-article-detail] [data-auto-translate-content]";
const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
};
const DEBOUNCE_DELAY = 150;

function getTranslateApi() {
  if (typeof window === "undefined") return null;
  return window.translate ?? null;
}

function getCurrentDisplayedLanguage(translate: typeof window.translate): string | undefined {
  if (!translate) return undefined;
  if (translate.language && typeof translate.language.getCurrent === "function") {
    return translate.language.getCurrent();
  }
  const storageValue = translate.storage?.get?.("to");
  return typeof storageValue === "string" ? storageValue : undefined;
}

function isTranslatedToTarget(
  translate: typeof window.translate,
  targetLanguage: string
): boolean {
  if (!translate) return false;
  const currentLanguage = getCurrentDisplayedLanguage(translate);
  const hasTranslatedNodes = !!(translate.node?.data?.size);
  return (
    !!currentLanguage &&
    currentLanguage === targetLanguage &&
    hasTranslatedNodes
  );
}

export function ArticleTranslateNotice({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations("articleDetail");
  const locale = useLocale();
  const autoTranslateContent = useAppStore((state) => state.autoTranslateContent);

  const [showOriginal, setShowOriginal] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);

  const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
  const isVisible = !!targetLanguage;
  const providerLabel = useMemo(() => "translate.js", []);

  // Debounced state update to avoid excessive re-renders during translation
  const debouncedUpdateState = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      const translate = getTranslateApi();
      const isTranslated = translate && targetLanguage && autoTranslateContent
        ? isTranslatedToTarget(translate, targetLanguage)
        : false;
      setShowOriginal(!isTranslated);
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY);
  }, [targetLanguage, autoTranslateContent]);

  useEffect(() => {
    if (!enabled || !isVisible) return;

    const translate = getTranslateApi();
    if (!translate) return;

    // Initial check
    debouncedUpdateState();

    // Use MutationObserver with debounce to detect translation completion
    const observeTarget = document.querySelector(DETAIL_TRANSLATE_SCOPE_SELECTOR);
    let observer: MutationObserver | undefined;

    if (observeTarget) {
      observer = new MutationObserver(debouncedUpdateState);
      // Only observe text changes, not all attributes
      observer.observe(observeTarget, {
        characterData: true,
        subtree: true,
      });
    }

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      observer?.disconnect();
    };
  }, [enabled, isVisible, debouncedUpdateState]);

  const handleToggle = useCallback(() => {
    const translate = getTranslateApi();
    if (!translate || !targetLanguage) return;

    const documents = document.querySelectorAll(DETAIL_TRANSLATE_SCOPE_SELECTOR);
    if (documents.length === 0) return;

    const isCurrentlyTranslated = isTranslatedToTarget(translate, targetLanguage);

    if (showOriginal) {
      // If already translated by auto-translate, just update state
      if (isCurrentlyTranslated) {
        setShowOriginal(false);
        return;
      }

      translate.service?.use?.("client.edge");
      translate.language?.setLocal?.("chinese_simplified");
      if (translate.selectLanguageTag) {
        translate.selectLanguageTag.show = false;
      }
      translate.setDocuments?.(documents);
      translate.listener?.start?.();
      translate.execute(documents);
      translate.changeLanguage?.(targetLanguage);
      setShowOriginal(false);
      return;
    }

    translate.reset?.();
    setShowOriginal(true);
  }, [showOriginal, targetLanguage]);

  if (!enabled || !isVisible) {
    return null;
  }

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