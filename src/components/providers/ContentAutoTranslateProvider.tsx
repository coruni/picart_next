"use client";

import { usePathname } from "@/i18n/routing";
import { useAppStore } from "@/stores";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    translate?: {
      execute: (documents?: Element[] | NodeListOf<Element>) => void;
      reset?: () => void;
      changeLanguage?: (language: string) => void;
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

const AUTO_TRANSLATE_SELECTOR = "[data-auto-translate-content]";
const ARTICLE_DETAIL_SCOPE_SELECTOR = "[data-auto-translate-article-detail]";
const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const LOCAL_TRANSLATE_SCRIPT_PATH = "/vendor/translate.js/3.18.66/translate.js";
const TRANSLATE_LANGUAGE_MAP: Record<string, string | null> = {
  zh: null,
  en: "english",
};
const TRANSLATE_SCRIPT_ID = "local-translate-js";

function getAutoTranslateDocuments() {
  return Array.from(document.querySelectorAll(AUTO_TRANSLATE_SELECTOR)).filter(
    (element) => !element.closest(ARTICLE_DETAIL_SCOPE_SELECTOR),
  );
}

export function ContentAutoTranslateProvider() {
  const locale = useLocale();
  const pathname = usePathname();
  const [scriptReady, setScriptReady] = useState(false);
  const initializedRef = useRef(false);
  const autoTranslateContent = useAppStore(
    (state) => state.autoTranslateContent,
  );

  useEffect(() => {
    if (window.translate) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById(
      TRANSLATE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => setScriptReady(true);
      existingScript.addEventListener("load", handleLoad);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.id = TRANSLATE_SCRIPT_ID;
    script.src = new URL(LOCAL_TRANSLATE_SCRIPT_PATH, window.location.origin).toString();
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale] ?? null;
    const documents = getAutoTranslateDocuments();

    if (documents.length === 0) {
      return;
    }

    translate.service?.use?.("client.edge");
    translate.language?.setLocal?.(TRANSLATE_LOCAL_LANGUAGE);

    if (!autoTranslateContent) {
      translate.reset?.();
      return;
    }

    if (!targetLanguage) {
      translate.reset?.();
      return;
    }

    if (translate.selectLanguageTag) {
      translate.selectLanguageTag.show = false;
    }

    if (!initializedRef.current) {
      translate.listener?.start?.();
      translate.setDocuments?.(documents);
      translate.execute(documents);
      initializedRef.current = true;
    } else {
      translate.setDocuments?.(documents);
    }

    window.requestAnimationFrame(() => {
      translate.changeLanguage?.(targetLanguage);
    });
  }, [autoTranslateContent, locale, pathname, scriptReady]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    return () => {
      initializedRef.current = false;
    };
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !autoTranslateContent) {
      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const documents = getAutoTranslateDocuments();
    if (documents.length === 0) {
      return;
    }

    translate.setDocuments?.(documents);
    translate.execute(documents);
  }, [pathname, scriptReady, autoTranslateContent]);

  return null;
}
