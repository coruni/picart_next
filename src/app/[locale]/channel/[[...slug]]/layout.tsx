import { ChannelNav } from "@/components/channel/ChannelNav";
import { ChannelTabs } from "@/components/channel/ChannelTabs";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Sidebar } from "@/components/sidebar/Sidebar";
import {
  buildLocalizedAlternates,
  generateSiteMetadata,
  getLocalizedPath,
  getPublicCategories,
  getPublicConfig,
} from "@/lib/seo";
import { ReactNode } from "react";

interface ChannelLayoutProps {
  children: ReactNode;
  params: Promise<{ slug?: string[]; locale: string }>;
}

export async function generateMetadata({ params }: ChannelLayoutProps) {
  const { slug, locale } = await params;

  if (!slug || slug.length === 0) {
    return generateSiteMetadata(locale);
  }

  const pid = slug[0];

  const categories = await getPublicCategories();
  const currentChannel = categories.find(
    (item) => item.id === Number(pid),
  );

  if (!currentChannel) {
    return generateSiteMetadata(locale);
  }

  const config = await getPublicConfig();
  const siteName = config?.site_name || "PicArt";

  const title = currentChannel.name;
  const description =
    currentChannel.description ||
    `${currentChannel.articleCount || 0} posts · ${currentChannel.followCount || 0} followers`;
  const path = slug.length > 0 ? `/channel/${slug.join("/")}` : "/channel";

  return {
    title,
    description,
    alternates: buildLocalizedAlternates(locale, path),
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: getLocalizedPath(locale, path),
      title,
      description,
      images:
        currentChannel.cover || currentChannel.avatar
          ? [
              {
                url: currentChannel.cover || currentChannel.avatar,
                width: 1200,
                height: 630,
                alt: currentChannel.name,
              },
            ]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images:
        currentChannel.cover || currentChannel.avatar
          ? [currentChannel.cover || currentChannel.avatar]
          : undefined,
    },
  };
}

export default async function ChannelLayout({
  children,
  params,
}: ChannelLayoutProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return <>{children}</>;
  }

  const pid = slug[0];

  const categories = await getPublicCategories();
  const currentChannel = categories.find(
    (item) => item.id === Number(pid),
  );

  if (!currentChannel) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="top-header fixed h-101 w-full z-0">
        <ImageWithFallback
          quality={95}
          src={
            currentChannel?.background ||
            currentChannel?.avatar ||
            "/placeholder/empty.png"
          }
          fill
          alt={`${currentChannel?.name} background image`}
          className="w-full h-full object-cover"
          />
        <div
          className="absolute bottom-0 left-0 w-full z-2 h-70"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--background) 0%, transparent) 0%, var(--background) 100%)",
          }}
        />
      </div>

      <ChannelNav channels={categories} currentId={Number(pid)} />

      <div className="relative z-10 mt-60 w-full">
        <div className="page-container">
          <div className="left-container">
            <div className="top-header px-6 h-14 flex items-center border-b border-border sticky bg-card z-5 rounded-t-xl">
              <ChannelTabs parentId={pid}>{currentChannel.children}</ChannelTabs>
            </div>
            {children}
          </div>
          <div className="right-container">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
}
