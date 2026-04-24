"use client";

import { tagControllerFollowedList } from "@/api";
import { TopicCard } from "@/components/topic/TopicCard";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/stores";
import { TagList } from "@/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const MAX_DISPLAY_TOPICS = 2;

export function FollowedTopicsWidget() {
  const t = useTranslations("sidebar");
  const tTopic = useTranslations("topic");
  const user = useUserStore((state) => state.user);
  const [topics, setTopics] = useState<TagList>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchFollowedTopics = async () => {
      try {
        const response = await tagControllerFollowedList({
          query: {
            page: 1,
            limit: MAX_DISPLAY_TOPICS,
            userId: user.id,
          },
        });
        const fetchedTopics =
          (response.data?.data?.data as TagList | undefined) || [];
        setTopics(fetchedTopics);
      } catch (error) {
        console.error("Failed to fetch followed topics:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowedTopics();
  }, [user?.id]);

  // 如果没有话题或不登录，不显示组件
  if (!user?.id || (!loading && topics.length === 0)) {
    return null;
  }

  return (
    <section className="bg-card  border-b border-border pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-foreground">
          {tTopic("joinedTopics")}
        </span>
        <Link
          href={`/account/${user.id}/topic`}
          className="text-sm text-primary hover:text-primary/80 cursor-pointer"
        >
          {t("viewMore")}
        </Link>
      </div>

      {/* Topics list */}
      <div className="space-y-1 px-2">
        {loading
          ? // Loading skeleton
            Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="p-4 flex items-center space-x-4 animate-pulse"
              >
                <div className="flex items-center flex-1 space-x-3">
                  <div className="size-16.5 shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))
          : topics.map((tag, index) => (
              <TopicCard
                key={tag.id}
                tag={tag}
                showAvatar
                loading={index < 2 ? "eager" : "lazy"}
              />
            ))}
      </div>
    </section>
  );
}
