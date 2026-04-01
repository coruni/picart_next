type CompactNumberLabels = {
  thousand: string;
  tenThousand?: string;
  million?: string;
  billion?: string;
  hundredMillion?: string;
};

type FormatCompactNumberOptions = {
  locale?: string;
  labels: CompactNumberLabels;
};

function truncateToSingleDecimal(value: number) {
  if (value >= 100) {
    return Math.floor(value).toString();
  }

  if (value >= 10) {
    return (Math.floor(value * 10) / 10)
      .toFixed(1)
      .replace(/\.0$/, "");
  }

  return (Math.floor(value * 10) / 10)
    .toFixed(1)
    .replace(/\.0$/, "");
}

export function formatCompactNumber(
  value: number | null | undefined,
  { locale, labels }: FormatCompactNumberOptions,
) {
  const normalizedValue = Number(value || 0);

  if (!Number.isFinite(normalizedValue)) {
    return "0";
  }

  const absoluteValue = Math.abs(normalizedValue);
  const isZhLike = locale?.toLowerCase().startsWith("zh");

  if (isZhLike) {
    if (labels.hundredMillion && absoluteValue >= 100_000_000) {
      return `${truncateToSingleDecimal(absoluteValue / 100_000_000)}${labels.hundredMillion}`;
    }

    if (labels.tenThousand && absoluteValue >= 10_000) {
      return `${truncateToSingleDecimal(absoluteValue / 10_000)}${labels.tenThousand}`;
    }

    if (absoluteValue >= 1_000) {
      return `${truncateToSingleDecimal(absoluteValue / 1_000)}${labels.thousand}`;
    }

    return String(normalizedValue);
  }

  if (labels.billion && absoluteValue >= 1_000_000_000) {
    return `${truncateToSingleDecimal(absoluteValue / 1_000_000_000)}${labels.billion}`;
  }

  if (labels.million && absoluteValue >= 1_000_000) {
    return `${truncateToSingleDecimal(absoluteValue / 1_000_000)}${labels.million}`;
  }

  if (absoluteValue >= 1_000) {
    return `${truncateToSingleDecimal(absoluteValue / 1_000)}${labels.thousand}`;
  }

  return String(normalizedValue);
}
