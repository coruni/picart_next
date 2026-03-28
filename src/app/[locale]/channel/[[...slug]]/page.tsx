import { ChannelArticleListClient } from "@/components/channel/ChannelArticleList.client";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ slug?: string[]; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations("channelPage");

  const { data: categoryData } = await serverApi.categoryControllerFindAll({
    query: { page: 1, limit: 100 },
  });

  const channels = categoryData?.data.data || [];

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
      redirect(`/${locale}/channel/${firstChannel.id}/${firstChannel.children[0].id}`);
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
      redirect(`/${locale}/channel/${firstChannel.id}/${firstChannel.children[0].id}`);
    }
    redirect(`/${locale}/channel/${firstChannel.id}`);
  }

  if (slug.length === 1) {
    if (currentChannel.children && currentChannel.children.length > 0) {
      const firstChild = currentChannel.children[0];
      redirect(`/${locale}/channel/${pid}/${firstChild.id}`);
    }
  }

  const childId = slug[1];
  const childCategory = currentChannel.children?.find((item) => item.id === Number(childId));

  if (!childCategory) {
    if (currentChannel.children && currentChannel.children.length > 0) {
      const firstChild = currentChannel.children[0];
      redirect(`/${locale}/channel/${pid}/${firstChild.id}`);
    }
    redirect(`/${locale}/channel/${pid}`);
  }

  const { data } = await serverApi.articleControllerFindAll({
    query: {
      page: 1,
      limit: 10,
      categoryId: Number(childId),
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
      showFollow={true}
    />
  );
}
