import { bannerControllerFindActive } from "@/api";
import { cn } from "@/lib";
import { ActiveBanners } from "@/types";
import { BannerCarousel } from "./BannerCarousel";

type BannerProps = {
  className?: string;
  autoplayDelay?: number;
};

type BannerItem = ActiveBanners[number];
type BannerField =
  | "imageUrl"
  | "image"
  | "cover"
  | "coverUrl"
  | "bannerUrl"
  | "pic"
  | "picture"
  | "url"
  | "link"
  | "href"
  | "targetUrl"
  | "jumpUrl"
  | "title"
  | "name"
  | "alt"
  | "description";

export type ResolvedBannerItem = {
  image: string;
  href?: string;
  title: string;
};

function pickStringValue(
  source: BannerItem,
  keys: BannerField[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function resolveBannerData(banner: unknown): ResolvedBannerItem | null {
  if (!banner || typeof banner !== "object") {
    return null;
  }

  const record = banner as BannerItem;
  const image = pickStringValue(record, [
    "imageUrl",
    "image",
    "cover",
    "coverUrl",
    "bannerUrl",
    "pic",
    "picture",
    "url",
  ]);

  if (!image) {
    return null;
  }

  return {
    image,
    href: pickStringValue(record, ["link", "href", "targetUrl", "jumpUrl"]),
    title:
      pickStringValue(record, ["title", "name", "alt", "description"]) ||
      "banner",
  };
}

export async function Banner({ className, autoplayDelay = 4000 }: BannerProps) {
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
