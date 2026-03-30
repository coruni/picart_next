"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "@/i18n/routing";
import { useSearchStore } from "@/stores";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchHistory() {
  const t = useTranslations("common");
  const router = useRouter();
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(
    "searchHistory",
    [],
  );
  const category = useSearchStore((state) => state.category);
  const sort = useSearchStore((state) => state.sort);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);

  const handleSearch = (keyword: string) => {
    const q = keyword.trim();
    if (!q) return;

    setSearchHistory(
      [q, ...searchHistory.filter((item) => item !== q)].slice(0, 10),
    );

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
      <div className="mb-3 flex items-center justify-between px-2">
        <div className="line-clamp-1 overflow-hidden text-ellipsis leading-6 font-semibold">
          <span>{t("searchHistory")}</span>
        </div>
        {searchHistory.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchHistory([])}
            className="cursor-pointer rounded-full flex items-center gap-1  px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Trash2 size={14} />
            <span>{t("clear")}</span>
          </button>
        )}
      </div>

      {searchHistory.length > 0 ? (
        <div className="flex gap-2">
          {searchHistory.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSearch(item)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full text-sm bg-muted hover:bg-muted/80 px-3 py-1 text-left transition-colors"
            >
              <span className="line-clamp-1 flex-1 text-sm text-foreground/65">
                {item}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
          {t("noSearchHistory")}
        </div>
      )}
    </section>
  );
}
