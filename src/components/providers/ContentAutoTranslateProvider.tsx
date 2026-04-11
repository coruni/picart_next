"use client";

import { usePathname } from "@/i18n/routing";
import { detectContentLanguage, TRANSLATE_LANGUAGE_MAP } from "@/lib/translate";
import { useTranslateStore } from "@/stores";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

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

const ORIGINAL_HTML_ATTR = "data-translate-original-html";
const TRANSLATE_BOUND_ATTR = "data-translate-bound";
const TRANSLATE_SKIPPED_ATTR = "data-translate-skipped";

function extractTextFromHtml(html: string): string {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;

  temp.querySelectorAll("script, style").forEach((el) => el.remove());

  return temp.textContent || "";
}

function extractElementText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style").forEach((el) => el.remove());
  return clone.textContent || "";
}

function captureOriginalHtml(element: HTMLElement) {
  if (!element.getAttribute(ORIGINAL_HTML_ATTR)) {
    element.setAttribute(ORIGINAL_HTML_ATTR, element.innerHTML);
  }
}

function captureOriginalHtmlForDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    captureOriginalHtml(element);
  });
}

function restoreOriginalHtml(element: HTMLElement) {
  const originalHtml = element.getAttribute(ORIGINAL_HTML_ATTR);
  if (originalHtml != null) {
    element.innerHTML = originalHtml;
  }
}

function restoreOriginalHtmlForDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    restoreOriginalHtml(element);
  });
}

function clearTranslateDocumentMarks() {
  getTranslateDocuments().forEach((element) => {
    delete element.dataset.translateBound;
    delete element.dataset.translateSkipped;
  });
}

function clearStoredOriginalHtml() {
  getTranslateDocuments().forEach((element) => {
    element.removeAttribute(ORIGINAL_HTML_ATTR);
  });
}

function getOriginalText(element: HTMLElement): string {
  const originalHtml = element.getAttribute(ORIGINAL_HTML_ATTR);
  if (originalHtml != null) {
    return extractTextFromHtml(originalHtml);
  }
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

export function ContentAutoTranslateProvider() {
  const locale = useLocale();
  const pathname = usePathname();
  const [scriptReady, setScriptReady] = useState(false);

  const initializedRef = useRef(false);
  const translatedScopeKeyRef = useRef<string | null>(null);
  const translateObserverRef = useRef<MutationObserver | null>(null);
  const translateTimerRef = useRef<number | null>(null);

  const autoTranslateContent = useTranslateStore(
    (state) => state.autoTranslateContent,
  );

  const resetTranslationState = useCallback((restoreOriginal = false) => {
    const documents = getTranslateDocuments();

    if (restoreOriginal) {
      restoreOriginalHtmlForDocuments(documents);
    }

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

      captureOriginalHtmlForDocuments(documents);

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
    const loadTranslateScript = async () => {
      if (typeof window === "undefined") return;

      if (!window.translate) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.staticfile.net/translate.js/3.18.66/translate.js";
        script.async = true;
        script.onload = () => {
          setScriptReady(true);
        };
        script.onerror = () => {
          console.error("Failed to load translate.js");
        };
        document.head.appendChild(script);
      } else {
        setScriptReady(true);
      }
    };

    loadTranslateScript();
  }, []);

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

    translate.service?.use?.("client.edge");
    translate.language?.setLocal?.(TRANSLATE_LOCAL_LANGUAGE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (translate.language as any).translateLocal = true;
    disableTranslateLanguageSelector();

    if (!autoTranslateContent || !targetLanguage) {
      translate.reset?.();
      resetTranslationState(true);
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
      resetTranslationState(true);
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
      const lastManualToggle = window.__lastManualTranslateToggle;
      if (lastManualToggle && Date.now() - lastManualToggle < 500) {
        return;
      }

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
      }

      translateTimerRef.current = window.setTimeout(() => {
        const pending = getPendingTranslateDocuments();
        if (pending.length === 0) return;

        runTranslateForDocuments(pending);
        translate.changeLanguage?.(targetLanguage);
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
      clearStoredOriginalHtml();
    };
  }, [scriptReady]);

  return null;
}