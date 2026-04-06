import { franc } from "franc-min";

// Locale to translate.js language code mapping
export const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
  ja: "japanese",
  ko: "korean",
  fr: "french",
  es: "spanish",
  de: "german",
  ru: "russian",
  it: "italian",
  pt: "portuguese",
};

// franc language code mapping to our locale
const FRANC_TO_LOCALE: Record<string, string> = {
  cmn: "zh", // Chinese (Mandarin)
  eng: "en", // English
  jpn: "ja", // Japanese
  kor: "ko", // Korean
  fra: "fr", // French
  spa: "es", // Spanish
  deu: "de", // German
  rus: "ru", // Russian
  ita: "it", // Italian
  por: "pt", // Portuguese
};

// Clean text for language detection by removing common non-language content
function cleanTextForDetection(value: string): string {
  return (
    value
      // Strip HTML
      .replace(/<[^>]+>/g, " ")
      // Remove URLs
      .replace(/https?:\/\/\S+/g, " ")
      // Remove @mentions
      .replace(/@\w+/g, " ")
      // Remove hashtags
      .replace(/#\w+/g, " ")
      // Remove email addresses
      .replace(/\S+@\S+\.\S+/g, " ")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Check if text contains Japanese characters (Hiragana or Katakana)
function containsJapaneseCharacters(value: string): boolean {
  // Hiragana: \u3040-\u309F, Katakana: \u30A0-\u30FF
  const japaneseMatches = value.match(/[\u3040-\u309F\u30A0-\u30FF]/g);
  return (japaneseMatches?.length ?? 0) > 0;
}

function isLikelyChineseContent(value: string): boolean {
  const text = value.replace(/\s+/g, "");
  if (!text) {
    return false;
  }

  const chineseMatches = text.match(
    /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g,
  );
  const letterMatches = text.match(/[A-Za-z]/g);
  const chineseCount = chineseMatches?.length ?? 0;
  const letterCount = letterMatches?.length ?? 0;

  // If has Chinese characters and Chinese count >= English letter count
  return chineseCount > 0 && chineseCount >= letterCount;
}

/**
 * Detect the language of a text using franc with pre-detection
 * @param text - The text to detect (may contain HTML)
 * @returns The detected locale code or null if undetermined
 */
export function detectContentLanguage(text: string): string | null {
  const cleanText = cleanTextForDetection(text);
  if (!cleanText || cleanText.length < 10) {
    return null;
  }

  // Pre-check: detect Japanese first (before Chinese, since Japanese uses kanji)
  // This is important because Japanese uses Chinese characters (kanji) plus hiragana/katakana
  if (containsJapaneseCharacters(cleanText)) {
    return "ja";
  }

  // Pre-check: if content is mostly Chinese, return zh directly
  // This is more reliable than franc for Chinese content
  if (isLikelyChineseContent(cleanText)) {
    return "zh";
  }

  // Use franc for other languages
  const langCode = franc(cleanText.slice(0, 1000));
  if (langCode === "und") {
    return null;
  }

  return FRANC_TO_LOCALE[langCode] || langCode;
}

/**
 * Check if content language matches the current locale
 * @param text - The text to check (may contain HTML)
 * @param locale - The current locale
 * @returns true if content matches locale, false otherwise
 */
export function isContentMatchingLocale(
  text: string,
  locale: string,
): boolean {
  // Always use cleaned text
  const cleanText = cleanTextForDetection(text);
  const detectedLang = detectContentLanguage(cleanText);
  if (!detectedLang) {
    // Fallback: check for specific languages
    if (containsJapaneseCharacters(cleanText)) {
      return locale === "ja";
    }
    return isLikelyChineseContent(cleanText) === (locale === "zh");
  }
  return detectedLang === locale;
}
