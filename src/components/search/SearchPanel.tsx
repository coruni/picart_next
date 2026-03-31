"use client";

import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib";
import { useSearchStore } from "@/stores";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { SearchFeedTabs } from "./SearchFeedTabs";

export function SearchPanel() {
  const pathname = usePathname();
  const t = useTranslations("searchPanel");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const { q, category, sort, setSearchParams } = useSearchStore();
  const isArticleSearchPage = pathname === "/search";

  useEffect(() => {
    if (!sortMenuRef.current) return;

    setContentHeight(sortMenuRef.current.scrollHeight);
  }, [isSortMenuOpen]);

  useEffect(() => {
    if (!isArticleSearchPage) {
      setIsSortMenuOpen(false);
    }
  }, [isArticleSearchPage]);

  const handleSortClick = () => {
    setIsSortMenuOpen((prev) => !prev);
  };

  const handleSortChange = (
    nextSort: "relevance" | "latest" | "views" | "likes",
  ) => {
    setSearchParams({
      q,
      category,
      sort: nextSort,
    });
  };

  return (
    <div>
      <div className="mt-2 flex h-12 w-full items-stretch gap-2 border-b border-border px-6 leading-12">
        <SearchFeedTabs className="w-full " />
        {isArticleSearchPage ? (
          <div
            className="flex shrink-0 cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            onClick={handleSortClick}
          >
            <span>{t("moreSort")}</span>
            <Settings2 size={16} />
          </div>
        ) : null}
      </div>

      {isArticleSearchPage ? (
        <div
          className={cn(
            "overflow-hidden transition-[height,opacity] duration-300 ease-out",
            isSortMenuOpen ? "opacity-100" : "opacity-0",
          )}
          style={{ height: isSortMenuOpen ? contentHeight : 0 }}
        >
          <div className="px-6 py-4" ref={sortMenuRef}>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-secondary">
                {t("title")}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-full"
                  variant={sort === "relevance" ? "primary" : "outline"}
                  onClick={() => handleSortChange("relevance")}
                >
                  {t("options.relevance")}
                </Button>
                <Button
                  className="rounded-full"
                  variant={sort === "latest" ? "primary" : "outline"}
                  onClick={() => handleSortChange("latest")}
                >
                  {t("options.latest")}
                </Button>
                <Button
                  className="rounded-full"
                  variant={sort === "views" ? "primary" : "outline"}
                  onClick={() => handleSortChange("views")}
                >
                  {t("options.views")}
                </Button>
                <Button
                  className="rounded-full"
                  variant={sort === "likes" ? "primary" : "outline"}
                  onClick={() => handleSortChange("likes")}
                >
                  {t("options.likes")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
