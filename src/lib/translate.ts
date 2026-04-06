import { franc } from "franc-min";

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
 * Detect the language of a text using franc with Chinese pre-detection
 * @param text - The text to detect (may contain HTML)
 * @returns The detected locale code or null if undetermined
 */
export function detectContentLanguage(text: string): string | null {
  const cleanText = cleanTextForDetection(text);
  if (!cleanText || cleanText.length < 10) {
    return null;
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
    // Fallback to simple Chinese detection using clean text
    return isLikelyChineseContent(cleanText) === (locale === "zh");
  }
  return detectedLang === locale;
}
