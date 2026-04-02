import { formatCompactNumber, formatDateYMD } from "@/lib";

export function getApiErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const value = error as {
    status?: number;
    response?: { status?: number };
    error?: { status?: number };
  };

  return value.status || value.response?.status || value.error?.status || null;
}

export function formatDashboardDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return formatDateYMD(value);
}

export function getStatusLabel(
  dictionary: Record<string, string>,
  value?: string | boolean | null,
) {
  if (typeof value === "boolean") {
    return value ? dictionary.public : dictionary.private;
  }

  if (!value) {
    return "-";
  }

  return dictionary[value] || value;
}

export function getStatusClassName(value?: string | boolean | null) {
  const normalized =
    typeof value === "boolean"
      ? value
        ? "public"
        : "private"
      : String(value || "").toUpperCase();

  if (normalized === "PUBLISHED" || normalized === "PAID" || normalized === "ACTIVE") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  }

  if (normalized === "PENDING" || normalized === "PROCESSING" || normalized === "DRAFT") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "REFUNDED" ||
    normalized === "REJECTED" ||
    normalized === "DELETED" ||
    normalized === "INACTIVE" ||
    normalized === "PRIVATE"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }

  if (normalized === "RESOLVED" || normalized === "PUBLIC") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function getRoleLabels(
  roles?: Array<{ displayName?: string; name?: string }> | null,
) {
  return (roles || [])
    .map((role) => role.displayName || role.name)
    .filter((value): value is string => Boolean(value));
}

export function looksLikeAdminRole(
  roles?: Array<{ displayName?: string; name?: string }> | null,
) {
  return getRoleLabels(roles).some((role) =>
    /admin|root|super|manage|运营|管理/i.test(role),
  );
}

export function compactText(value?: string | null, maxLength = 72) {
  if (!value) {
    return "-";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

export function formatDashboardCount(value: number | null | undefined, locale?: string) {
  return formatCompactNumber(value, {
    locale,
    labels: {
      thousand: locale?.startsWith("zh") ? "千" : "k",
      tenThousand: locale?.startsWith("zh") ? "万" : undefined,
      hundredMillion: locale?.startsWith("zh") ? "亿" : undefined,
      million: locale?.startsWith("zh") ? undefined : "m",
      billion: locale?.startsWith("zh") ? undefined : "b",
    },
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeUnknownListResponse(value: unknown) {
  if (!isRecord(value)) {
    return { data: [] as Record<string, unknown>[], total: 0, totalPages: 1 };
  }

  const rootData = isRecord(value.data) ? value.data : null;
  const nestedData = rootData && isRecord(rootData.data) ? rootData.data : null;
  const rows = nestedData?.data;
  const meta = nestedData && isRecord(nestedData.meta) ? nestedData.meta : null;

  return {
    data: Array.isArray(rows)
      ? rows.filter(isRecord)
      : rootData && Array.isArray(rootData.data)
        ? rootData.data.filter(isRecord)
        : [],
    total:
      typeof meta?.total === "number"
        ? meta.total
        : Array.isArray(rows)
          ? rows.length
          : 0,
    totalPages:
      typeof meta?.totalPages === "number"
        ? meta.totalPages
        : 1,
  };
}

export function getStringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function getNumberField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : 0;
}

export function getBooleanField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}
