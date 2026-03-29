"use client";

import { useAppStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

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
const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
};

export function ArticleTranslateNotice({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations("articleDetail");
  const locale = useLocale();
  const autoTranslateContent = useAppStore((state) => state.autoTranslateContent);

  const [showOriginal, setShowOriginal] = useState(true);
  const pendingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const translate = (window as any).translate;
    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];

    const getCurrentDisplayedLanguage = () => {
      if (!translate) return undefined;
      return translate.language && typeof translate.language.getCurrent === "function"
        ? translate.language.getCurrent()
        : translate.to || translate.storage?.get?.("to");
    };

    const updateState = () => {
      const currentDisplayedLanguage = getCurrentDisplayedLanguage();
      const hasTranslatedNodes = !!translate?.node?.data?.size;
      const isTranslated = !!(
        translate &&
        targetLanguage &&
        autoTranslateContent &&
        (currentDisplayedLanguage === targetLanguage || (hasTranslatedNodes && translate.to === targetLanguage))
      );
      const next = !isTranslated;

      // defer state update to avoid setState during other components' render
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      pendingTimerRef.current = window.setTimeout(() => {
        setShowOriginal(next);
        pendingTimerRef.current = null;
      }, 0);
    };

    // initial sync
    updateState();

    if (!translate || !translate.storage || typeof translate.storage.set !== "function") {
      return;
    }

    // wrap storage.set to detect changes to 'to' without polling
    const originalSet = translate.storage.set.bind(translate.storage);
    const wrapped = (translate.storage as any).__wrapped_for_app === true;
    if (!wrapped) {
      const newSet = function (key: string, value: any) {
        try {
          const res = originalSet(key, value);
          // If translation target changed, update state
          if (key === "to") {
            updateState();
          }
          return res;
        } catch (e) {
          // still call original to preserve behavior
          try {
            return originalSet(key, value);
          } catch (err) {
            return undefined;
          }
        }
      };

      try {
        (translate.storage as any).set = newSet;
        (translate.storage as any).__wrapped_for_app = true;
      } catch (e) {
        // ignore if cannot override
      }
    }

    // also try to observe translate.node.data changes via monkey-patch of Map.prototype.set
    let restoreMapSet: (() => void) | undefined;
    if (translate.node && translate.node.data instanceof Map) {
      const map = translate.node.data as Map<any, any>;
      const proto = Object.getPrototypeOf(map);
      if (proto && !((proto as any).__translate_node_set_wrapped)) {
        const originalMapSet = proto.set;
        (proto as any).set = function (key: any, value: any) {
          const result = originalMapSet.call(this, key, value);
          try {
            updateState();
          } catch (e) {
            // ignore
          }
          return result;
        };
        (proto as any).__translate_node_set_wrapped = true;
        restoreMapSet = () => {
          try {
            proto.set = originalMapSet;
            delete (proto as any).__translate_node_set_wrapped;
          } catch (e) {
            // ignore
          }
        };
      }
    }

    return () => {
      // clear pending timer
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      // no-op cleanup for storage override (leave wrapped to persist)
      if (restoreMapSet) restoreMapSet();
    };
  }, [locale, autoTranslateContent]);

  const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
  const isVisible = !!targetLanguage;

  const providerLabel = useMemo(() => "translate.js", []);

  if (!enabled || !isVisible) {
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

    // determine whether the page is already translated to targetLanguage
    const currentDisplayedLanguage =
      (translate.language && typeof translate.language.getCurrent === "function"
        ? translate.language.getCurrent()
        : undefined) || (translate as any).to || (translate as any).storage?.get?.("to");

    const hasTranslatedNodes = !!(translate as any).node?.data?.size;
    const isCurrentlyTranslated = !!(
      currentDisplayedLanguage &&
      targetLanguage &&
      currentDisplayedLanguage === targetLanguage &&
      hasTranslatedNodes
    );

    if (showOriginal) {
      // If already translated by auto-translate, just update state and do nothing.
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
      translate.changeLanguage?.(targetLanguage!);
      setShowOriginal(false);
      return;
    }

    translate.reset?.();
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
