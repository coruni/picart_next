import { bannerControllerFindActive } from "@/api";
import { cn } from "@/lib";
import { ActiveBanners } from "@/types";
import { BannerCarousel } from "./BannerCarousel";

type BannerProps = {
  className?: string;
  autoplayDelay?: number;
  probability?: number;
};

type BannerItem = ActiveBanners[number];
export type BannerHrefType = "internal" | "external";

export type ResolvedBannerItem = {
  image: string;
  href?: string;
  hrefType?: BannerHrefType;
  title: string;
};

function resolveBannerData(banner: unknown): ResolvedBannerItem | null {
  if (!banner || typeof banner !== "object") {
    return null;
  }

  const record = banner as BannerItem;
  const image = (record as Record<string, unknown>).imageUrl as string;

  if (!image || typeof image !== "string" || !image.trim()) {
    return null;
  }

  const rawHref = (record as Record<string, unknown>).linkUrl as string;
  const hrefType = rawHref
    ? /^https?:\/\//i.test(rawHref) || rawHref.startsWith("//")
      ? "external"
      : rawHref.startsWith("/")
        ? "internal"
        : undefined
    : undefined;

  const title = (record as Record<string, unknown>).title as string;

  return {
    image: image.trim(),
    href: hrefType ? rawHref : undefined,
    hrefType,
    title: (typeof title === "string" && title.trim()) || "banner",
  };
}

export async function Banner({ className, autoplayDelay = 4000, probability = 0.3 }: BannerProps) {
  if (Math.random() > probability) {
    return null;
  }

  let banners: ActiveBanners = [];

  try {
    const response = await bannerControllerFindActive({});
    banners = response.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return null;
  }

  const normalizedBanners = banners
    .map(resolveBannerData)
    .filter(Boolean) as ResolvedBannerItem[];

  if (normalizedBanners.length === 0) {
    return null;
  }

  return (
    <BannerCarousel
      banners={normalizedBanners}
      className={cn(className)}
      autoplayDelay={autoplayDelay}
    />
  );
}
