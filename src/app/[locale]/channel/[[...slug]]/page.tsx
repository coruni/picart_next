import { ChannelArticleListClient } from "@/components/channel/ChannelArticleList.client";
import { redirect } from "@/i18n/routing";
import { getPublicCategories } from "@/lib/seo";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[]; locale: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug, locale } = await params;
  const { sort } = await searchParams;
  const t = await getTranslations("channelPage");
  const sortType = sort === "latest" ? "latest" : "popular";

  const channels = await getPublicCategories();

  if (channels.length === 0) {
    return (
      <div className="page-container">
        <div className="left-container">
          <p>{t("noChannels")}</p>
        </div>
      </div>
    );
  }

  if (!slug || slug.length === 0) {
    const firstChannel = channels[0];
    if (firstChannel.children && firstChannel.children.length > 0) {
      redirect({
        href: `/channel/${firstChannel.id}/${firstChannel.children[0].id}`,
        locale: locale,
      });
    }

    return (
      <div className="page-container">
        <div className="left-container">
          <p>{t("noSubchannels")}</p>
        </div>
      </div>
    );
  }

  const pid = slug[0];
  const currentChannel = channels.find((item) => item.id === Number(pid));

  if (!currentChannel) {
    const firstChannel = channels[0];
    if (firstChannel.children && firstChannel.children.length > 0) {
      redirect({
        href: `/channel/${firstChannel.id}/${firstChannel.children[0].id}`,
        locale: locale,
      });
    }
    redirect({
      href: `/channel/${firstChannel.id}`,
      locale: locale,
    });
  }

  if (slug.length === 1) {
    if (currentChannel?.children && currentChannel.children.length > 0) {
      const firstChild = currentChannel.children[0];
      redirect({
        href: `/channel/${pid}/${firstChild.id}`,
        locale: locale,
      });
    }
  }

  const childId = slug[1];
  const childCategory = currentChannel?.children?.find(
    (item) => item.id === Number(childId),
  );

  if (!childCategory) {
    if (currentChannel?.children && currentChannel.children.length > 0) {
      const firstChild = currentChannel.children[0];
      redirect({
        href: `/channel/${pid}/${firstChild.id}`,
        locale: locale,
      });
    }
    redirect({
      href: `/channel/${pid}`,
      locale: locale,
    });
  }

  const { data } = await serverApi.articleControllerFindAll({
    query: {
      page: 1,
      limit: 20,
      categoryId: Number(childId),
      type: sortType,
    },
  });

  const articles = data?.data.data || [];
  const total = data?.data.meta.total || 0;

  return (
    <ChannelArticleListClient
      initArticles={articles}
      initPage={2}
      initTotal={total}
      categoryId={childId}
      sortType={sortType}
      showFollow={true}
    />
  );
}
