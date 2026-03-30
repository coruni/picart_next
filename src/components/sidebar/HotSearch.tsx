"use client";

import { articleControllerFindHotSearch } from "@/api";
import { useRouter } from "@/i18n/routing";
import { useSearchStore } from "@/stores";
import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// 热搜缓存时间：30 分钟
const HOT_SEARCH_CACHE_KEY = "hot-search-widget";
const HOT_SEARCH_CACHE_TIME = 30 * 60 * 1000; // 毫秒

export function HotSearch() {
  const t = useTranslations("common");
  const tSearch = useTranslations("searchBox");
  const router = useRouter();
  const category = useSearchStore((state) => state.category);
  const sort = useSearchStore((state) => state.sort);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);
  const [hotSearches, setHotSearches] = useState<string[]>(
    () => (tSearch.raw("hotSearches") as string[]) || [],
  );

  useEffect(() => {
    const fallbackHotSearches = (tSearch.raw("hotSearches") as string[]) || [];

    // 尝试从缓存读取
    const getCachedHotSearches = () => {
      try {
        const cached = sessionStorage.getItem(HOT_SEARCH_CACHE_KEY);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // 检查缓存是否过期
        if (now - timestamp < HOT_SEARCH_CACHE_TIME) {
          return data as string[];
        }

        // 清除过期缓存
        sessionStorage.removeItem(HOT_SEARCH_CACHE_KEY);
        return null;
      } catch {
        return null;
      }
    };

    // 缓存热搜数据
    const setCachedHotSearches = (data: string[]) => {
      try {
        sessionStorage.setItem(
          HOT_SEARCH_CACHE_KEY,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          }),
        );
      } catch {}
    };

    // 优先使用缓存
    const cached = getCachedHotSearches();
    if (cached && cached.length > 0) {
      setHotSearches(cached);
      return;
    }

    void (async () => {
      try {
        const response = await articleControllerFindHotSearch({
          query: {
            limit: 8,
          },
        });

        const items = response.data?.data?.data;
        if (!Array.isArray(items)) {
          setHotSearches(fallbackHotSearches);
          return;
        }

        const keywords = items
          .map((item) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "keyword" in item &&
              typeof item.keyword === "string"
            ) {
              return item.keyword.trim();
            }
            return "";
          })
          .filter(Boolean);

        const finalKeywords = keywords.length > 0 ? keywords : fallbackHotSearches;
        setHotSearches(finalKeywords);
        setCachedHotSearches(finalKeywords);
      } catch (error) {
        console.error("Hot search sidebar error:", error);
        setHotSearches(fallbackHotSearches);
      }
    })();
  }, [tSearch]);

  const handleSearch = (keyword: string) => {
    const q = keyword.trim();
    if (!q) return;

    setSearchParams({
      q,
      category,
      sort,
    });

    const params = new URLSearchParams({ q });
    if (category) {
      params.set("category", category);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="rounded-xl bg-card px-2 py-4">
      <div className="mb-3 px-2">
        <div className="line-clamp-1 overflow-hidden text-ellipsis leading-6 font-semibold">
          <span>{t("hotSearches")}</span>
        </div>
      </div>

      {hotSearches.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-2">
          {hotSearches.map((item, index) => (
            <button
              key={`${item}-${index}`}
              type="button"
              onClick={() => handleSearch(item)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-left text-sm text-primary transition-colors hover:bg-primary/20"
            >
              <Flame size={14} className="shrink-0" />
              <span className="line-clamp-1 flex-1">{item}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
          {t("noData")}
        </div>
      )}
    </section>
  );
}
