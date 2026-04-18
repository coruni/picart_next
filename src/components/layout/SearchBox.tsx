"use client";

import { articleControllerFindHotSearch } from "@/api";
import menuPng from "@/assets/images/placeholder/menu.png";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/stores";
import { CategoryList } from "@/types";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";

export interface SearchBoxParams {
  q: string;
  category?: string;
}

// 高亮匹配文本
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.trim().toLowerCase()) {
      return (
        <span key={index} className="text-primary">
          {part}
        </span>
      );
    }
    return part;
  });
}

interface SearchBoxProps {
  categories?: CategoryList;
  isAccountPage?: boolean;
  scrolled?: boolean;
  placeholder?: string;
  className?: string;
  mobileVisible?: boolean;
  alwaysVisible?: boolean;
  block?: boolean;
  defaultValue?: string;
  defaultCategoryId?: string | number;
  syncSearchStore?: boolean;
}

export function SearchBox({
  categories,
  isAccountPage = false,
  scrolled = false,
  placeholder,
  className,
  mobileVisible = false,
  alwaysVisible = false,
  block = false,
  defaultValue = "",
  defaultCategoryId,
  syncSearchStore = false,
}: SearchBoxProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryList[0] | undefined
  >(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [hotSearches, setHotSearches] = useState<string[]>([]);
  const [panelHotSearches, setPanelHotSearches] = useState<string[]>([]);
  const [currentHotSearchIndex, setCurrentHotSearchIndex] = useState(0);
  const [isPlaceholderAnimating, setIsPlaceholderAnimating] = useState(false);
  const [isPlaceholderResetting, setIsPlaceholderResetting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(
    "searchHistory",
    [],
  );
  const sort = useSearchStore((state) => state.sort);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);

  const searchBoxRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null);
  const hotSearchLoadedRef = useRef(false);
  const hotSearchAbortControllerRef = useRef<AbortController | null>(null);

  // Close search panel when clicking outside
  useClickOutside<HTMLDivElement>(searchBoxRef, () => {
    setIsSearchPanelOpen(false);
  });

  // 构建选择菜单，只显示可搜索的分类
  const menuItems = useMemo(
    () => categories?.filter((category) => !category.link) || [],
    [categories],
  );

  useEffect(() => {
    setSearchQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (defaultCategoryId == null) {
      setSelectedCategory(undefined);
      return;
    }

    const matchedCategory = menuItems.find(
      (category) => String(category.id) === String(defaultCategoryId),
    );
    setSelectedCategory(matchedCategory);
  }, [defaultCategoryId, menuItems]);

  // 默认选中第一个分类或”全部”
  const currentCategory = selectedCategory || {
    id: 0,
    name: t("all"),
    avatar: menuPng,
    description: t("searchAll"),
  };
  const currentHotSearchKeyword = hotSearches[currentHotSearchIndex] || "";
  const shouldShowAnimatedPlaceholder =
    !placeholder && !searchQuery.trim() && Boolean(currentHotSearchKeyword);
  const effectivePlaceholder = shouldShowAnimatedPlaceholder
    ? ""
    : placeholder || t("search");

  const fetchHotSearches = useCallback(
    async (keyword?: string, signal?: AbortSignal) => {
      const response = await articleControllerFindHotSearch({
        query: {
          limit: 8,
          ...(keyword ? { keyword } : {}),
        },
        signal,
      });

      const items = response.data?.data?.data;
      if (!Array.isArray(items)) {
        return [];
      }

      return items
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
    },
    [],
  );
  useEffect(() => {
    if (!syncSearchStore) return;

    setSearchParams({
      q: searchQuery.trim(),
      ...(selectedCategory?.id && { category: String(selectedCategory.id) }),
      sort,
    });
  }, [searchQuery, selectedCategory, setSearchParams, sort, syncSearchStore]);

  useEffect(() => {
    if (hotSearchLoadedRef.current) {
      return;
    }

    hotSearchLoadedRef.current = true;

    void (async () => {
      try {
        const keywords = await fetchHotSearches();
        setHotSearches(keywords);
        setPanelHotSearches(keywords);
      } catch (error) {
        console.error("Hot search error:", error);
      }
    })();
  }, [fetchHotSearches]);

  useEffect(() => {
    if (hotSearches.length <= 1) {
      setCurrentHotSearchIndex(0);
      return;
    }

    let resetTimer: number | undefined;
    const timer = window.setInterval(() => {
      setIsPlaceholderAnimating(true);

      resetTimer = window.setTimeout(() => {
        setIsPlaceholderResetting(true);
        setCurrentHotSearchIndex((prev) => (prev + 1) % hotSearches.length);
        setIsPlaceholderAnimating(false);
        window.requestAnimationFrame(() => {
          setIsPlaceholderResetting(false);
        });
      }, 420);
    }, 20000);

    return () => {
      window.clearInterval(timer);
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
    };
  }, [hotSearches]);

  useEffect(() => {
    if (!isSearchPanelOpen) {
      hotSearchAbortControllerRef.current?.abort();
      hotSearchAbortControllerRef.current = null;
      setIsSearching(false);
      return;
    }

    const keyword = searchQuery.trim();
    const abortController = new AbortController();
    hotSearchAbortControllerRef.current?.abort();
    hotSearchAbortControllerRef.current = abortController;
    const timer = window.setTimeout(() => {
      setIsSearching(true);

      void fetchHotSearches(keyword, abortController.signal)
        .then((keywords) => {
          if (hotSearchAbortControllerRef.current !== abortController) {
            return;
          }

          setPanelHotSearches(keywords);
        })
        .catch((error) => {
          if (abortController.signal.aborted) {
            return;
          }

          console.error("Search hot keyword error:", error);
          setPanelHotSearches([]);
        })
        .finally(() => {
          if (hotSearchAbortControllerRef.current === abortController) {
            hotSearchAbortControllerRef.current = null;
            setIsSearching(false);
          }
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
      if (hotSearchAbortControllerRef.current === abortController) {
        hotSearchAbortControllerRef.current = null;
      }
    };
  }, [fetchHotSearches, isSearchPanelOpen, searchQuery]);

  // 跳转到搜索页面
  const goToSearchPage = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      // Add to search history
      const newHistory = [
        query.trim(),
        ...searchHistory.filter((item) => item !== query.trim()),
      ].slice(0, 10);
      setSearchHistory(newHistory);

      // 根据当前路径确定跳转的搜索 tab
      let searchPath = "/search";
      if (pathname.startsWith("/search/topic")) {
        searchPath = "/search/topic";
      } else if (pathname.startsWith("/search/user")) {
        searchPath = "/search/user";
      }

      // 跳转到搜索页面
      const params = new URLSearchParams({ q: query.trim() });
      if (searchPath === "/search" && selectedCategory?.id) {
        params.set("category", String(selectedCategory.id));
      }
      router.push(`${searchPath}?${params.toString()}`);
      setIsSearchPanelOpen(false);
    },
    [router, searchHistory, setSearchHistory, selectedCategory, pathname],
  );

  const handleSearch = (query: string) => {
    const normalizedQuery = query.trim() || currentHotSearchKeyword;
    if (!normalizedQuery) return;

    setSearchQuery(normalizedQuery);
    goToSearchPage(normalizedQuery);
  };

  const handleSearchFromHistory = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleInputFocus = () => {
    setIsSearchPanelOpen(true);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleCategorySelect = (category: CategoryList[0] | undefined) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  return (
    <div
      className={cn(
        "flex-1 items-center justify-center",
        alwaysVisible
          ? "flex"
          : mobileVisible
            ? "flex md:hidden"
            : "hidden md:flex",
        className,
      )}
    >
      <div
        ref={searchBoxRef}
        className={cn(
          "relative group max-w-md h-9 w-full p-1 rounded-full transition-all flex items-center",
          "focus-within:ring-1 focus-within:ring-primary",
          block ? "w-full max-w-full" : "max-w-md",
          // 普通页面样式
          (!isAccountPage || scrolled) && [
            "bg-muted border border-border",
            "hover:bg-card hover:border-primary hover:ring-1 hover:ring-primary",
            "focus-within:bg-card",
          ],
          // Account 页面未滚动时的透明样式
          isAccountPage &&
            !scrolled && [
              "bg-[#00000066] border border-[#ffffff66]",
              "hover:border-white hover:ring-1 hover:ring-white/50",
              "focus-within:border-white focus-within:ring-white/50",
            ],
        )}
      >
        {/* 选择菜单 */}
        <div className="flex items-center h-full">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsSearchPanelOpen(false);
            }}
            className="flex items-center h-full rounded-l-full transition-colors cursor-pointer"
          >
            <div
              className="size-7 rounded-full bg-cover bg-center flex items-center justify-center text-lg"
              style={{
                backgroundImage:
                  typeof currentCategory.avatar === "string" &&
                  currentCategory.avatar.startsWith("http")
                    ? `url(${currentCategory.avatar})`
                    : undefined,
              }}
            >
              {typeof currentCategory.avatar === "string" &&
                currentCategory.avatar.startsWith("/") && (
                  <ImageWithFallback
                    src={currentCategory.avatar}
                    width={28}
                    height={28}
                    alt={currentCategory.name}
                    className="rounded-full"
                  />
                )}
              {typeof currentCategory.avatar === "object" && (
                <ImageWithFallback
                  src={currentCategory.avatar}
                  width={28}
                  height={28}
                  alt={currentCategory.name}
                  className="rounded-full"
                />
              )}
              {typeof currentCategory.avatar === "string" &&
                !currentCategory.avatar.startsWith("http") &&
                !currentCategory.avatar.startsWith("/") &&
                currentCategory.avatar}
            </div>
            <div className="flex items-center justify-center size-5 ml-1">
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  isDropdownOpen && "rotate-180",
                  isAccountPage && !scrolled && ["text-white/70"],
                )}
              />
            </div>
          </button>
          <span
            className={cn(
              "ml-2 w-px h-4",
              !isAccountPage || scrolled ? "bg-[#c1ccd9]" : "bg-white/30",
            )}
          ></span>
        </div>

        {/* 搜索输入框 */}
        <div className="relative h-full flex-1">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={effectivePlaceholder}
            className={cn(
              "relative z-10 w-full h-full rounded-full transition-all px-2 bg-transparent border-none",
              "placeholder:text-secondary placeholder:text-xs text-xs",
              "focus:outline-none",
              // 普通模式
              !isAccountPage || scrolled
                ? "text-black/80 dark:text-white/80 dark:placeholder:text-white/60"
                : "text-white/90 placeholder:text-white/70",
            )}
          />
          {shouldShowAnimatedPlaceholder && (
            <div className="pointer-events-none absolute inset-0 flex items-center px-2 text-xs">
              <div className="w-full h-5 overflow-hidden">
                <div
                  className={cn(
                    "w-full",
                    !isPlaceholderResetting &&
                      "transition-transform duration-400",
                    isPlaceholderAnimating ? "-translate-y-5" : "translate-y-0",
                  )}
                >
                  <span
                    className={cn(
                      "block h-5 leading-5 truncate text-secondary dark:text-white/60",
                      isAccountPage && !scrolled && "text-white/70",
                    )}
                  >
                    {currentHotSearchKeyword}
                  </span>
                  <span
                    className={cn(
                      "block h-5 leading-5 truncate text-secondary dark:text-white/60",
                      isAccountPage && !scrolled && "text-white/70",
                    )}
                  >
                    {hotSearches[
                      (currentHotSearchIndex + 1) % hotSearches.length
                    ] || currentHotSearchKeyword}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 搜索按钮 */}
        <button
          onClick={() => handleSearch(searchQuery)}
          className={cn(
            "flex items-center justify-center size-7 rounded-full transition-colors",
            "hover:bg-primary/10",
            !isAccountPage || scrolled
              ? "text-secondary hover:text-primary"
              : "text-white/70 hover:text-white",
          )}
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>

        {/* 搜索面板 */}
        {isSearchPanelOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="p-4">
              {!searchQuery ? (
                <>
                  {/* 历史搜索 */}
                  {searchHistory.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground">
                          {t("searchHistory")}
                        </h3>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t("clear")}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchFromHistory(item)}
                            className="px-3 py-1 cursor-pointer text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 热门搜索 */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      {t("hotSearches")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hotSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchFromHistory(item)}
                          className="px-3 py-1 cursor-pointer text-sm bg-primary/10 hover:bg-primary/20 rounded-full transition-colors text-primary"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 没有搜索历史时的提示 */}
                  {searchHistory.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {t("noSearchHistory")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 热词建议 */}
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2
                        size={20}
                        className="animate-spin text-muted-foreground"
                      />
                    </div>
                  ) : panelHotSearches.length > 0 ? (
                    <div className="space-y-1 -mx-2">
                      {panelHotSearches.map((keyword, index) => (
                        <button
                          key={`${keyword}-${index}`}
                          onClick={() => handleSearchFromHistory(keyword)}
                          className="cursor-pointer h-9 px-3 w-full flex-1 text-left rounded-md hover:bg-primary/10 text-nowrap text-ellipsis line-clamp-1 text-sm"
                        >
                          <span className="text-black/65 dark:text-white font-semibold">
                            {highlightText(keyword, searchQuery)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {t("noData")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 分类下拉菜单 */}
        <>
          {/* 遮罩层 */}
          <div
            className={cn(
              "fixed inset-0 z-40 transition-opacity duration-150",
              isDropdownOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* 菜单内容 */}
          <div
            className={cn(
              "absolute top-full left-0 mt-2 z-50 w-full max-h-102 overflow-y-auto rounded-xl border border-border bg-card shadow-lg scroll-auto",
              "origin-top transition-all duration-150 will-change-transform",
              isDropdownOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-98 opacity-0",
            )}
          >
            <div className="p-2">
              {/* 全部选项 */}
              <button
                onClick={() => handleCategorySelect(undefined)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer hover:bg-primary/15",
                  !selectedCategory && "text-primary",
                )}
              >
                <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <ImageWithFallback
                    src={menuPng}
                    width={32}
                    height={32}
                    alt="all menu"
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{t("all")}</div>
                </div>
              </button>

              {/* 分类选项 */}
              {menuItems.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer hover:bg-primary/15 hover:text-primary",
                    selectedCategory?.id === category.id && "text-primary",
                  )}
                >
                  <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center relative">
                    {category.avatar && (
                      <ImageWithFallback
                        src={category.avatar}
                        fill
                        alt={category.name}
                        className="rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
