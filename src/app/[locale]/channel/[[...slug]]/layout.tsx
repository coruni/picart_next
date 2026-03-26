import {
  categoryControllerFindAll,
  configControllerGetPublicConfigs,
} from "@/api";
import { ReactNode } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChannelTabs } from "@/components/channel/ChannelTabs";
import { ChannelNav } from "@/components/channel/ChannelNav";
import { generateSiteMetadata } from "@/lib/seo";

interface ChannelLayoutProps {
  children: ReactNode;
  params: Promise<{ slug?: string[]; locale: string }>;
}

export async function generateMetadata({ params }: ChannelLayoutProps) {
  const { slug, locale } = await params;

  // 如果没有 slug 或者 slug 为空，返回默认 SEO
  if (!slug || slug.length === 0) {
    return generateSiteMetadata(locale);
  }

  const pid = slug[0];

  // 获取分类列表
  const { data } = await categoryControllerFindAll({
    query: { page: 1, limit: 100 },
  });
  const currentChannel = data?.data.data.find(
    (item) => item.id === Number(pid),
  );

  if (!currentChannel) {
    return generateSiteMetadata(locale);
  }

  // 获取公共配置
  const config = await configControllerGetPublicConfigs();
  const siteName = config?.data?.data.site_name || "PicArt";

  // 返回主分类的 SEO
  const title = currentChannel.name;
  const description =
    currentChannel.description ||
    `${currentChannel.articleCount || 0} 篇文章 · ${currentChannel.followCount || 0} 人关注`;

  return {
    title: title,
    description: description,
    openGraph: {
      type: "website",
      locale: locale,
      siteName: siteName,
      title: title,
      description: description,
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
      title: title,
      description: description,
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

  // 如果没有 slug 或者 slug 为空，不显示背景
  if (!slug || slug.length === 0) {
    return <>{children}</>;
  }

  const pid = slug[0];

  // 获取分类列表
  const { data } = await categoryControllerFindAll({
    query: { page: 1, limit: 100 },
  });
  const currentChannel = data?.data.data.find(
    (item) => item.id === Number(pid),
  );

  if (!currentChannel) {
    return <>{children}</>;
  }

  return (
    <>
      {/* 背景 */}
      <div className="fixed top-15 h-101 w-full z-0">
        <Image
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
              "linear-gradient(180deg, rgba(245, 246, 251, 0) 0%, #f5f6fb 100%)",
          }}
        />
      </div>

      {/* 频道切换 */}
      <ChannelNav channels={data?.data.data || []} currentId={Number(pid)} />

      {/* 页面内容 */}
      <div className="mt-60 w-full z-10 relative dark:bg-gray-800">
        <div className="page-container">
          <div className="left-container">
            <div className="px-10 h-14 flex items-center border-b border-border sticky top-15 bg-card z-5 rounded-t-xl">
              <ChannelTabs parentId={pid}>
                {currentChannel.children}
              </ChannelTabs>
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
