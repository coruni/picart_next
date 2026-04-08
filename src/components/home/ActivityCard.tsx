"use client";

import type { DecorationControllerFindAllActivitiesResponse } from "@/api/types.gen";
import { Link } from "@/i18n/routing";
import { cn, formatDateYMD, prepareRichTextHtmlForSummary } from "@/lib";
import { getImageUrl } from "@/types/image";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type ActivityItem =
  DecorationControllerFindAllActivitiesResponse["data"]["data"][0];

interface ActivityCardProps {
  activity: ActivityItem;
  className?: string;
}

/**
 * 检查活动是否进行中
 */
function isActivityActive(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

/**
 * 活动卡片组件
 * 展示活动封面图、状态标签、标题、摘要和时间范围
 */
export function ActivityCard({ activity, className }: ActivityCardProps) {
  const t = useTranslations("activity");
  const active = isActivityActive(activity.startTime, activity.endTime);

  return (
    <article
      key={activity.id}
      data-auto-translate-content
      className={className}
    >
      <Link
        className="flex flex-col md:flex-row items-stretch gap-3 py-4 px-1 border-b border-border last:border-0 last-of-type:border-none"
        href={`/article/${activity?.article?.id}`}
        prefetch={false}
      >
        {/* 封面图区域 */}
        <div className="relative h-28 md:h-32 md:aspect-4/2 rounded-md bg-muted">
          <ImageWithFallback
            fill
            src={
              activity.article?.cover ||
              (activity.article?.images?.[0]
                ? getImageUrl(activity.article.images[0], "small")
                : undefined) ||
              activity.decoration?.imageUrl ||
              ""
            }
            alt={activity.name || activity.article?.title || "Activity title"}
            className="object-cover"
          />
          {/* 状态标签 */}
          <div className="absolute top-0 left-0">
            <div
              className={cn(
                "text-xs h-5 leading-5 px-2 rounded-tl-md rounded-br-md",
                active
                  ? "bg-green-400 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span>{active ? t("active") : t("ended")}</span>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex flex-col flex-1">
          <h3 className="font-semibold w-full truncate">
            {activity.name || activity.article?.title}
          </h3>

          {activity.article?.summary && (
            <p
              className="article-summary-html flex-1 mt-1 px-0! text-secondary text-sm leading-5 line-clamp-2 overflow-hidden cursor-pointer"
              dangerouslySetInnerHTML={{
                __html: prepareRichTextHtmlForSummary(
                  activity.article?.summary,
                ),
              }}
            />
          )}

          {/* 时间范围 */}
          <div
            className={cn(
              "mt-auto px-4 py-2 rounded-md space-x-2 flex items-center",
              active
                ? "bg-green-400/60 text-white"
                : " bg-muted text-secondary",
            )}
          >
            <Clock size={12} />
            <span className="text-xs flex-1">
              {formatDateYMD(activity.startTime)} -{" "}
              {formatDateYMD(activity.endTime)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
