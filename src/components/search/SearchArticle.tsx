"use client";

import { Link } from "@/i18n/routing";
import { cn, formatCompactNumber, prepareRichTextHtmlForSummary } from "@/lib";
import { ArticleList } from "@/types";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { Avatar } from "../ui/Avatar";
import { getImageUrl } from "@/types/image";

type SearchArticleProps = {
  border?: boolean;
  article: ArticleList[number];
  keyword?: string;
};

function highlightText(text: string, keyword?: string) {
  const normalizedKeyword = keyword?.trim();
  if (!normalizedKeyword) return text;

  const regex = new RegExp(
    `(${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === normalizedKeyword.toLowerCase()) {
      return (
        <span key={index} className="text-primary">
          {part}
        </span>
      );
    }

    return part;
  });
}

export function SearchArticle({
  border,
  article,
  keyword,
}: SearchArticleProps) {
  const locale = useLocale();
  const tAccountInfo = useTranslations("accountInfo");
  const summaryHtml =
    article.summary && typeof article.summary === "string"
      ? prepareRichTextHtmlForSummary(article.summary)
      : "";
  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  return (
    <article>
      <Link
        href={`/article/${article.id}`}
        className={cn(
          "flex items-stretch gap-3 py-4 transition-opacity hover:opacity-90",
          border && "border-b border-border",
        )}
      >
        <div className="flex flex-1 flex-col justify-between w-full shrink-0">
          <div className="flex flex-col gap-2 w-full">
            <h2
              data-auto-translate-content
              className="line-clamp-2 font-semibold text-foreground"
            >
              {highlightText(article.title || "", keyword)}
            </h2>
            {summaryHtml && (
              <p
                data-auto-translate-content
                className="article-summary-html mt-1 px-0! text-secondary text-sm leading-5 line-clamp-2  overflow-hidden cursor-pointer"
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            )}
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center flex-1">
                <Avatar
                  url={article.author?.avatar}
                  alt={article.author?.nickname || article.author.username}
                  frameUrl={
                    article.author.equippedDecorations?.AVATAR_FRAME?.imageUrl
                  }
                  className="size-6"
                />
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  {article.author?.nickname || article.author?.username}
                </span>
              </div>
              <div className="flex items-center text-secondary text-xs">
                <Eye size={16}/>
                <span className="ml-1 text-xs text-muted-foreground">
                  {formatCompactNumber(article.views, {
                    locale,
                    labels: compactNumberLabels,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-56 aspect-5/3 overflow-hidden relative rounded-lg shrink-0">
          <ImageWithFallback
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-lg"
            fill
            src={typeof article.cover === "string" ? article.cover : getImageUrl(article.cover, "small")}
            alt={article.title || "article cover"}
          />
        </div>
      </Link>
    </article>
  );
}
