type TimeTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type DateInput = string | number | Date | null | undefined;
type TimeLocale = string | null | undefined;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
// 兼容带毫秒（.xxx）与 Z / 时区偏移（+08:00）后缀的字符串，
// 直接按字面值解析为本地时间，不做时区转换。
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

function resolveLocale(locale?: TimeLocale) {
  if (locale?.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  if (locale?.toLowerCase().startsWith("en")) {
    return "en-US";
  }

  return locale || "zh-CN";
}

export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const normalizedValue = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const localDateTimeMatch = value.match(LOCAL_DATE_TIME_PATTERN);
  if (localDateTimeMatch) {
    // 直接按字面值解析为本地时间，不做时区转换：
    // 后端返回的 createdAt 通常是本地时间（可能带 Z/偏移后缀），
    // 若交给 new Date(value) 会被按 UTC 解析，产生 8 小时偏差。
    const [, year, month, day, hours, minutes = "0", seconds = "0"] =
      localDateTimeMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateYMD(value: DateInput) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(
  value: DateInput,
  locale?: TimeLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  }).format(date);
}

export function formatShortDate(value: DateInput, locale?: TimeLocale) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  void locale;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

export function formatMonthDayLabel(value: DateInput, locale?: TimeLocale) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTimeHM(value: DateInput, locale?: TimeLocale) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  void locale;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatRelativeTime(
  value: DateInput,
  t: TimeTranslator,
  locale?: TimeLocale,
): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 注意：当时间戳为未来时间（时区/时钟偏差导致 diff 为负）时，
  // 不能直接按 diffInSeconds < 60 判定为"刚刚"——负数恒小于 60，
  // 会导致所有评论永远显示"刚刚"。
  // 取绝对值后再计算相对时间，未来时间也按相同规则展示。
  const absDiffInSeconds = Math.abs(diffInSeconds);

  if (absDiffInSeconds < 60) {
    return t("justNow");
  }

  const diffInMinutes = Math.floor(absDiffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t("minutesAgo", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t("hoursAgo", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 3) {
    return t("daysAgo", { count: diffInDays });
  }

  if (date.getFullYear() !== now.getFullYear()) {
    return formatDateYMD(date);
  }

  return formatShortDate(date, locale);
}

export function formatExpiryTime(
  value: DateInput,
  t: TimeTranslator,
  locale?: TimeLocale,
): string {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const now = new Date();
  const diffDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return t("expired");
  }

  if (diffDays === 0) {
    return t("expireToday");
  }

  if (diffDays <= 30) {
    return t("expireInDays", { days: diffDays });
  }

  return formatDate(date, locale);
}
