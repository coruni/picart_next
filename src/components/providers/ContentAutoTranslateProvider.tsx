"use client";

import { usePathname } from "@/i18n/routing";
import { detectContentLanguage, TRANSLATE_LANGUAGE_MAP } from "@/lib/translate";
import "@/lib/edge-translate";
import { useTranslateStore } from "@/stores";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    __lastManualTranslateToggle?: number;
  }
}

const AUTO_TRANSLATE_SELECTOR =
  "[data-auto-translate-content], [data-auto-translate-comment]";
const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const MUTATION_TRANSLATE_DEBOUNCE_MS = 260;
const MIN_TEXT_LENGTH_FOR_DETECTION = 1;
const MANUAL_TOGGLE_PAUSE_MS = 1200;

function extractElementText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style").forEach((el) => el.remove());
  return clone.textContent || "";
}

function clearTranslateDocumentMarks() {
  getTranslateDocuments().forEach((element) => {
    delete element.dataset.translateBound;
    delete element.dataset.translateSkipped;
  });
}

function getOriginalText(element: HTMLElement): string {
  return extractElementText(element);
}

function shouldSkipTranslation(element: HTMLElement, locale: string): boolean {
  const text = getOriginalText(element).trim();

  if (text.length < MIN_TEXT_LENGTH_FOR_DETECTION) {
    return false;
  }

  const detectedLang = detectContentLanguage(text);
  if (!detectedLang) {
    return false;
  }

  return detectedLang === locale;
}

function getTranslateDocuments() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(AUTO_TRANSLATE_SELECTOR),
  );
}

function getPendingTranslateDocuments() {
  return getTranslateDocuments().filter(
    (element) =>
      element.dataset.translateBound !== "true" &&
      element.dataset.translateSkipped !== "true",
  );
}

function markTranslateDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    element.dataset.translateBound = "true";
    delete element.dataset.translateSkipped;
  });
}

function markSkippedDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    element.dataset.translateSkipped = "true";
    delete element.dataset.translateBound;
  });
}

function disableTranslateLanguageSelector() {
  const translate = window.translate;

  if (translate?.selectLanguageTag) {
    translate.selectLanguageTag.show = false;
  }

  document.getElementById("translateSelectLanguage")?.remove();

  const container = document.getElementById("translate");
  if (container?.childElementCount === 0) {
    container.remove();
  }
}

function configureSessionStorage() {
  const translate = window.translate;
  if (!translate?.storage) return;

  translate.storage.set = (key: string, value: unknown) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  translate.storage.get = (key: string): unknown => {
    const item = sessionStorage.getItem(key);
    if (item === null) return undefined;

    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  };
}

function isManualTogglePaused(): boolean {
  const lastManualToggle = window.__lastManualTranslateToggle;
  if (!lastManualToggle) {
    return false;
  }

  return Date.now() - lastManualToggle < MANUAL_TOGGLE_PAUSE_MS;
}

export function ContentAutoTranslateProvider() {
  const locale = useLocale();
  const pathname = usePathname();
  // 自定义 Edge 翻译模块由 src/lib/edge-translate 静态引入，始终就绪
  const scriptReady = true;

  const initializedRef = useRef(false);
  const translatedScopeKeyRef = useRef<string | null>(null);
  const translateObserverRef = useRef<MutationObserver | null>(null);
  const translateTimerRef = useRef<number | null>(null);

  const autoTranslateContent = useTranslateStore(
    (state) => state.autoTranslateContent,
  );

  const resetTranslationState = useCallback(() => {
    // 注意：只清理翻译标记，不要用 innerHTML 整体恢复。
    // 文本还原由调用方 translate.reset() 完成（仅还原文本节点，不破坏 DOM 结构）；
    // innerHTML 整体替换会销毁 ArtPlayer 等 React 组件的 DOM，
    // 导致视频播放器失效、React 虚拟 DOM 与实际 DOM 失同步。
    clearTranslateDocumentMarks();
  }, []);

  const filterDocumentsByLanguage = useCallback(
    (
      documents: HTMLElement[],
    ): { toTranslate: HTMLElement[]; skipped: HTMLElement[] } => {
      const toTranslate: HTMLElement[] = [];
      const skipped: HTMLElement[] = [];

      for (const doc of documents) {
        if (shouldSkipTranslation(doc, locale)) {
          skipped.push(doc);
        } else {
          toTranslate.push(doc);
        }
      }

      return { toTranslate, skipped };
    },
    [locale],
  );

  const runTranslateForDocuments = useCallback(
    (documents: HTMLElement[]) => {
      const translate = window.translate;
      if (!translate || documents.length === 0) {
        return;
      }

      const { toTranslate, skipped } = filterDocumentsByLanguage(documents);

      if (toTranslate.length > 0) {
        translate.setDocuments?.(documents);
        translate.execute?.(toTranslate);
        markTranslateDocuments(toTranslate);
      }

      if (skipped.length > 0) {
        markSkippedDocuments(skipped);
      }
    },
    [filterDocumentsByLanguage],
  );

  useEffect(() => {
    if (!scriptReady) return;

    const translate = window.translate;
    if (!translate) return;

    disableTranslateLanguageSelector();
    configureSessionStorage();
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    const documents = getTranslateDocuments();

    if (documents.length === 0) {
      return;
    }

    translate.language?.setLocal?.(TRANSLATE_LOCAL_LANGUAGE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (translate.language as any).translateLocal = true;
    disableTranslateLanguageSelector();

    if (!autoTranslateContent || !targetLanguage) {
      translate.reset?.();
      resetTranslationState();
      translatedScopeKeyRef.current = null;
      return;
    }

    const scopeKey = `${locale}:${pathname}`;
    const scopeChanged = translatedScopeKeyRef.current !== scopeKey;
    const shouldRefreshAll = !initializedRef.current || scopeChanged;

    if (!initializedRef.current) {
      translate.listener?.start?.();
      initializedRef.current = true;
    }

    if (scopeChanged) {
      translate.reset?.();
      resetTranslationState();
    }

    if (shouldRefreshAll) {
      runTranslateForDocuments(documents);
      translatedScopeKeyRef.current = scopeKey;
    } else {
      const pending = getPendingTranslateDocuments();
      if (pending.length > 0) {
        runTranslateForDocuments(pending);
      }
    }

    window.requestAnimationFrame(() => {
      translate.changeLanguage?.(targetLanguage);
    });
  }, [
    autoTranslateContent,
    locale,
    pathname,
    scriptReady,
    resetTranslationState,
    runTranslateForDocuments,
  ]);

  useEffect(() => {
    if (!scriptReady || !autoTranslateContent) {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }

      return;
    }

    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    if (!targetLanguage) {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }

      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const scheduleTranslate = () => {
      // Skip if user just manually toggled translation (prevents interference with manual restore)
      if (isManualTogglePaused()) {
        return;
      }

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
      }

      translateTimerRef.current = window.setTimeout(() => {
        const pending = getPendingTranslateDocuments();
        if (pending.length === 0) return;

        // Only translate new content, do NOT call changeLanguage here.
        // changeLanguage calls reset() internally which rolls back all previously
        // translated nodes, then re-translates only the limited setDocuments scope.
        // Since translate.to is already set from the initial changeLanguage call,
        // calling execute() directly through runTranslateForDocuments is sufficient.
        if (!translate.to && targetLanguage) {
          translate.to = targetLanguage;
          translate.storage?.set?.("to", targetLanguage);
        }
        runTranslateForDocuments(pending);
      }, MUTATION_TRANSLATE_DEBOUNCE_MS);
    };

    translateObserverRef.current?.disconnect();
    translateObserverRef.current = new MutationObserver((mutations) => {
      const hasRelevantMutation = mutations.some((mutation) => {
        if (mutation.type === "childList") {
          return Array.from(mutation.addedNodes).some((node) => {
            if (!(node instanceof Element)) {
              return false;
            }

            return (
              node.matches(AUTO_TRANSLATE_SELECTOR) ||
              !!node.querySelector(AUTO_TRANSLATE_SELECTOR) ||
              !!node.closest?.(AUTO_TRANSLATE_SELECTOR)
            );
          });
        }

        if (mutation.type === "characterData") {
          return !!mutation.target.parentElement?.closest(AUTO_TRANSLATE_SELECTOR);
        }

        return false;
      });

      if (hasRelevantMutation) {
        scheduleTranslate();
      }
    });

    translateObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }
    };
  }, [autoTranslateContent, locale, scriptReady, runTranslateForDocuments]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const handlePageShow = () => {
      const translate = window.translate;
      const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
      if (!translate || !autoTranslateContent || !targetLanguage) return;

      window.setTimeout(() => {
        const pending = getPendingTranslateDocuments();
        if (pending.length > 0) {
          runTranslateForDocuments(pending);
          translate.changeLanguage?.(targetLanguage);
        }
      }, 150);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [autoTranslateContent, locale, scriptReady, runTranslateForDocuments]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    return () => {
      initializedRef.current = false;
      translatedScopeKeyRef.current = null;
      clearTranslateDocumentMarks();
    };
  }, [scriptReady]);

  return null;
}