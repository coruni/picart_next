"use server";

import { Link } from "@/i18n/routing";
import { formatCompactNumber } from "@/lib";
import { serverApi } from "@/lib/server-api";
import { TagList } from "@/types";
import { getLocale, getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";

// 缓存标签数据 1 小时
async function fetchRecommendTags() {
  const response = await serverApi.tagControllerFindAll({
    query: {
      page: 1,
      limit: 4,
    },
  });
  return response.data?.data?.data || [];
}

const getCachedRecommendTags = unstable_cache(
   fetchRecommendTags,
  ["recommend-tags"],
  {
    revalidate: 3600, // 1 hour
    tags: ["tags"],
  },
);

export const RecommendTagWidget = async () => {
  const t = await getTranslations("sidebar");
  const tAccountInfo = await getTranslations("accountInfo");
  const locale = await getLocale();
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  let tags: TagList = [];
  try {
    tags = await getCachedRecommendTags();
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return (
      <section className="rounded-xl py-4 px-2 bg-card">
        <div
          data-auto-translate-content
          className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-medium px-2 mb-3"
        >
          <span>{t("hotTopics")}</span>
        </div>
        <div
          data-auto-translate-content
          className="text-center py-4 text-muted-foreground text-sm"
        >
          {t("loadError")}
        </div>
      </section>
    );
  }

  const tagCard = (tag: TagList[number]) => {
    return (
      <Link
        href={`/topic/${tag.id}`}
        key={tag.id}
        className="py-2 px-3 rounded-lg cursor-pointer hover:bg-primary/15 block"
      >
        <div data-auto-translate-content className="flex flex-col">
          <div className="text-sm">
            <span>#</span>
            <span className=" font-bold leading-5">{tag.name}</span>
          </div>
          <div className="mt-1 text-secondary text-xs">
            <span>
              {formatCompactNumber(tag.articleCount, {
                locale,
                labels: compactNumberLabels,
              })}{" "}
              {t("posts")} /{" "}
              {formatCompactNumber(tag.followCount, {
                locale,
                labels: compactNumberLabels,
              })}{" "}
              {t("members")}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="rounded-xl py-4 px-2 bg-card">
      <div
        data-auto-translate-content
        className=" text-ellipsis line-clamp-1 overflow-hidden leading-6  font-semibold px-2 mb-3"
      >
        <span>{t("hotTopics")}</span>
      </div>
      {tags.map((tag) => tagCard(tag))}
      <div className="px-2 mt-2">
        <Link
          href="/topic"
          data-auto-translate-content
          className="text-sm text-primary hover:text-primary/80 cursor-pointer"
        >
          {t("viewMore")}
        </Link>
      </div>
    </section>
  );
};
