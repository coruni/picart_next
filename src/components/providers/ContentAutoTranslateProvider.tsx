"use client";

import { usePathname } from "@/i18n/routing";
import { detectContentLanguage, TRANSLATE_LANGUAGE_MAP } from "@/lib/translate";
import { useTranslateStore } from "@/stores";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import "@/assets/js/translate/translate.js";

const AUTO_TRANSLATE_SELECTOR =
  "[data-auto-translate-content], [data-auto-translate-comment]";
const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const MUTATION_TRANSLATE_DEBOUNCE_MS = 180;
const MIN_TEXT_LENGTH_FOR_DETECTION = 1;

// Extract text content from element for language detection
function extractElementText(element: HTMLElement): string {
  // Get text content, excluding script/style tags
  const clone = element.cloneNode(true) as HTMLElement;
  const scripts = clone.querySelectorAll("script, style");
  scripts.forEach((el) => el.remove());
  return clone.textContent || "";
}

// Check if element's content language matches current locale
function shouldSkipTranslation(element: HTMLElement, locale: string): boolean {
  const text = extractElementText(element).trim();
  if (text.length < MIN_TEXT_LENGTH_FOR_DETECTION) {
    return false; // Too short to detect reliably
  }
  const detectedLang = detectContentLanguage(text);
  if (!detectedLang) {
    return false; // Could not detect, allow translation
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
    (element) => element.dataset.translateBound !== "true" &&
      element.dataset.translateSkipped !== "true",
  );
}

function markTranslateDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    element.dataset.translateBound = "true";
  });
}

function markSkippedDocuments(documents: HTMLElement[]) {
  documents.forEach((element) => {
    element.dataset.translateSkipped = "true";
  });
}

function clearTranslateDocumentMarks() {
  getTranslateDocuments().forEach((element) => {
    delete element.dataset.translateBound;
    delete element.dataset.translateSkipped;
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

  const skippedElementsRef = useRef<Set<HTMLElement>>(new Set());

  // Check if translate.js is loaded
  useEffect(() => {
    const checkTranslateLoaded = () => {
      if (window.translate) {
        disableTranslateLanguageSelector();
        configureSessionStorage();
        setScriptReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkTranslateLoaded()) {
      return;
    }

    // Poll for translate.js to be loaded (it might load async)
    const interval = setInterval(() => {
      if (checkTranslateLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Filter documents that need translation (exclude those matching current locale)
  const filterDocumentsByLanguage = useCallback(
    (documents: HTMLElement[]): { toTranslate: HTMLElement[]; skipped: HTMLElement[] } => {
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

  // Translation effect
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

    if (!autoTranslateContent) {
      translate.reset?.();
      clearTranslateDocumentMarks();
      translatedScopeKeyRef.current = null;
      return;
    }

    if (!targetLanguage) {
      translate.reset?.();
      clearTranslateDocumentMarks();
      translatedScopeKeyRef.current = null;
      return;
    }

    const scopeKey = `${locale}:${pathname}`;
    const shouldRefreshAll =
      !initializedRef.current || translatedScopeKeyRef.current !== scopeKey;

    if (!initializedRef.current) {
      translate.listener?.start?.();
      initializedRef.current = true;
    }

    if (shouldRefreshAll) {
      // Filter by language before translating
      const { toTranslate, skipped } = filterDocumentsByLanguage(documents);

      if (toTranslate.length > 0) {
        translate.setDocuments?.(toTranslate);
        translate.execute(toTranslate);
        markTranslateDocuments(toTranslate);
      }

      // Mark skipped elements
      if (skipped.length > 0) {
        markSkippedDocuments(skipped);
        skipped.forEach((el) => skippedElementsRef.current.add(el));
      }

      translatedScopeKeyRef.current = scopeKey;
    } else {
      translate.setDocuments?.(documents);
      const pending = getPendingTranslateDocuments();

      if (pending.length > 0) {
        const { toTranslate, skipped } = filterDocumentsByLanguage(pending);

        if (toTranslate.length > 0) {
          translate.execute(toTranslate);
          markTranslateDocuments(toTranslate);
        }

        if (skipped.length > 0) {
          markSkippedDocuments(skipped);
          skipped.forEach((el) => skippedElementsRef.current.add(el));
        }
      }
    }

    window.requestAnimationFrame(() => {
      translate.changeLanguage?.(targetLanguage);
    });
  }, [autoTranslateContent, locale, pathname, scriptReady, filterDocumentsByLanguage]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const skippedElements = skippedElementsRef.current;
    return () => {
      initializedRef.current = false;
      translatedScopeKeyRef.current = null;
      skippedElements.clear();
    };
  }, [scriptReady]);

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
      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
      }

      translateTimerRef.current = window.setTimeout(() => {
        const allDocuments = getTranslateDocuments();
        const pending = getPendingTranslateDocuments();

        if (allDocuments.length === 0 || pending.length === 0) {
          return;
        }

        // Filter by language
        const { toTranslate, skipped } = filterDocumentsByLanguage(pending);

        if (toTranslate.length === 0 && skipped.length === 0) {
          return;
        }

        disableTranslateLanguageSelector();
        translate.setDocuments?.(allDocuments);

        if (toTranslate.length > 0) {
          translate.execute(toTranslate);
          markTranslateDocuments(toTranslate);
        }

        if (skipped.length > 0) {
          markSkippedDocuments(skipped);
          skipped.forEach((el) => skippedElementsRef.current.add(el));
        }

        translate.changeLanguage?.(targetLanguage);
      }, MUTATION_TRANSLATE_DEBOUNCE_MS);
    };

    translateObserverRef.current?.disconnect();
    translateObserverRef.current = new MutationObserver((mutations) => {
      const hasTranslatableNodes = mutations.some((mutation) => {
        return Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof Element)) {
            return false;
          }

          return (
            node.matches(AUTO_TRANSLATE_SELECTOR) ||
            !!node.querySelector(AUTO_TRANSLATE_SELECTOR)
          );
        });
      });

      if (hasTranslatableNodes) {
        scheduleTranslate();
      }
    });

    translateObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }
    };
  }, [autoTranslateContent, locale, scriptReady, filterDocumentsByLanguage]);

  return null;
}
