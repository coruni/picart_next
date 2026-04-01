"use client";

import { Link } from "@/i18n/routing";
import { formatCompactNumber } from "@/lib";
import { TagList } from "@/types";
import { ChevronRight, Hash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type TopicCardProps = {
  tag: TagList[number];
  showAvatar?: boolean;
  showMembers?: boolean;
  loading?: "eager" | "lazy";
};
export const TopicCard = ({
  tag,
  showAvatar = false,
  showMembers: _showMembers = false,
  loading = "lazy",
}: TopicCardProps) => {
  const t = useTranslations("tagCard");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  return (
    <article className="border-b border-border last-of-type:border-b-0">
      <Link
        href={`/topic/${tag.id}`}
        className="group p-4 flex items-center space-x-4 rounded-xl cursor-pointer hover:bg-primary/15"
      >
        <div className="flex items-center flex-1 space-x-3">
          {showAvatar && (
            <div className="relative flex items-center justify-center size-16.5 shrink-0 rounded-lg overflow-hidden">
              <ImageWithFallback
                fill
                quality={95}
                src={tag.avatar || "/placeholder/no_tag.webp"}
                alt={tag.name}
                loading={loading}
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex-1 flex items-center">
            <div className="flex-1 flex flex-col">
              <div
                data-auto-translate-content
                className="flex items-center space-x-2"
              >
                <div className="relative flex size-4 shrink-0 items-center justify-center rounded-full bg-primary p-0.5 text-white after:absolute after:bottom-0 after:right-0 after:h-0 after:w-0 after:border-l-[6px] after:border-l-primary after:border-t-[6px] after:border-t-transparent after:content-[''] after:-rotate-90">
                  <Hash size={14} strokeWidth={2} />
                </div>
                <span className="font-semibold">{tag.name}</span>
              </div>
              <div data-auto-translate-content className="py-2 leading-4">
                <span className="text-secondary text-xs">
                  {tag.description}
                </span>
              </div>
              <span className="text-xs text-secondary">
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
            <div className="flex items-center">
              <ChevronRight size={16} className="text-secondary" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
