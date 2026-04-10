"use client";

import { isContentMatchingLocale, TRANSLATE_LANGUAGE_MAP } from "@/lib/translate";
import { useTranslateStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DETAIL_TRANSLATE_SCOPE_SELECTOR =
  "[data-auto-translate-article-detail] [data-auto-translate-content]";
const DEBOUNCE_DELAY = 150;

function getTranslateApi() {
  if (typeof window === "undefined") return null;
  return window.translate ?? null;
}

function getArticleDetailText(): string {
  if (typeof document === "undefined") {
    return "";
  }

  return Array.from(
    document.querySelectorAll<HTMLElement>(DETAIL_TRANSLATE_SCOPE_SELECTOR),
  )
    .map((element) => element.innerText || element.textContent || "")
    .join(" ")
    .trim();
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
  const autoTranslateContent = useTranslateStore((state) => state.autoTranslateContent);

  const [showOriginal, setShowOriginal] = useState(true);
  const [shouldHideNotice, setShouldHideNotice] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const isUserTogglingRef = useRef(false);

  const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
  const isVisible = !!targetLanguage;
  const providerLabel = useMemo(() => "translate.js", []);

  // Debounced state update to avoid excessive re-renders during translation
  const debouncedUpdateState = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      // Skip auto-update if user is actively toggling
      if (isUserTogglingRef.current) {
        debounceTimerRef.current = null;
        return;
      }

      const translate = getTranslateApi();
      const articleText = getArticleDetailText();
      const matchesLocale = articleText
        ? isContentMatchingLocale(articleText, locale)
        : false;
      setShouldHideNotice(matchesLocale);

      if (matchesLocale) {
        setShowOriginal(true);
        debounceTimerRef.current = null;
        return;
      }

      const isTranslated = translate && targetLanguage && autoTranslateContent
        ? isTranslatedToTarget(translate, targetLanguage)
        : false;
      setShowOriginal(!isTranslated);
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY);
  }, [targetLanguage, autoTranslateContent, locale]);

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

    // Mark that user is actively toggling to prevent auto-detection interference
    isUserTogglingRef.current = true;

    if (showOriginal) {
      // If already translated by auto-translate, just update state
      if (isCurrentlyTranslated) {
        setShowOriginal(false);
        // Reset toggle flag after state update
        window.requestAnimationFrame(() => {
          isUserTogglingRef.current = false;
        });
        return;
      }

      // Immediately set state before translation
      setShowOriginal(false);

      translate.service?.use?.("client.edge");
      translate.language?.setLocal?.("chinese_simplified");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (translate.language as any).translateLocal = true;
      translate.setDocuments?.(documents);
      translate.listener?.start?.();
      translate.execute(documents);
      
      // Use requestAnimationFrame to ensure changeLanguage happens after execute
      window.requestAnimationFrame(() => {
        translate.changeLanguage?.(targetLanguage);
        // Reset toggle flag after translation is triggered
        window.setTimeout(() => {
          isUserTogglingRef.current = false;
        }, 200);
      });
      return;
    }

    // Immediately set state before reset
    setShowOriginal(true);
    translate.reset?.();
    
    // Reset toggle flag after reset is triggered
    window.setTimeout(() => {
      isUserTogglingRef.current = false;
    }, 200);
  }, [showOriginal, targetLanguage]);

  if (!enabled || !isVisible || shouldHideNotice) {
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
