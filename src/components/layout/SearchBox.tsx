"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn, debounce } from "@/lib/utils";
import { CategoryList } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useRouter } from "@/i18n/routing";
import { articleControllerSearch } from "@/api";

interface SearchResult {
  id: number;
  title: string;
  cover?: string;
}

// 楂樹寒鍖归厤鏂囨湰
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.trim().toLowerCase()) {
      return <span key={index} className="text-primary">{part}</span>;
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
}

export function SearchBox({
  categories,
  isAccountPage = false,
  scrolled = false,
  placeholder,
  className,
  mobileVisible = false,
}: SearchBoxProps) {
  const t = useTranslations("common");
  const tSearch = useTranslations("searchBox");
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryList[0] | undefined
  >(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(
    "searchHistory",
    [],
  );

  const searchBoxRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock hot searches data - in real app this would come from API
  const hotSearches = tSearch.raw("hotSearches") as string[];

  // Close search panel when clicking outside
  useClickOutside<HTMLDivElement>(searchBoxRef, () => {
    setIsSearchPanelOpen(false);
  });

  // 鏋勫缓閫夋嫨鑿滃崟 - 杩囨护鎺夋湁閾炬帴鐨勫垎绫伙紝鍙樉绀哄彲鎼滅储鐨勫垎绫?
  const menuItems = categories?.filter((category) => !category.link) || [];

  // 榛樿閫夋嫨绗竴涓垎绫绘垨"鍏ㄩ儴"
  const currentCategory = selectedCategory || {
    id: 0,
    name: t("all"),
    avatar: "/placeholder/menu.png",
    description: t("searchAll"),
  };

  // 鎼滅储寤鸿锛堥槻鎶栵級
  const searchSuggestions = useCallback(
    debounce((query: string) => {
      (async () => {
        if (!query.trim()) {
          setSearchResults([]);
          return;
        }

        setIsSearching(true);
        try {
          const response = await articleControllerSearch({
            query: {
              keyword: query.trim(),
              limit: 3,
              ...(selectedCategory?.id && { categoryId: selectedCategory.id }),
            },
          });
          setSearchResults(response?.data?.data?.data || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300),
    [selectedCategory],
  );

  // 娓呯┖鎼滅储缁撴灉
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // 璺宠浆鍒版悳绱㈤〉闈?
  const goToSearchPage = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      // Add to search history
      const newHistory = [
        query.trim(),
        ...searchHistory.filter((item) => item !== query.trim()),
      ].slice(0, 10);
      setSearchHistory(newHistory);

      // 璺宠浆鍒版悳绱㈤〉闈?
      const params = new URLSearchParams({ q: query.trim() });
      if (selectedCategory?.id) {
        params.set("category", String(selectedCategory.id));
      }
      router.push(`/search?${params.toString()}`);
      setIsSearchPanelOpen(false);
    },
    [router, searchHistory, setSearchHistory, selectedCategory],
  );

  // 璺宠浆鍒版枃绔犺鎯?
  const goToArticle = useCallback(
    (articleId: number) => {
      router.push(`/article/${articleId}`);
      setIsSearchPanelOpen(false);
    },
    [router],
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    goToSearchPage(query);
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
    if (e.key === "Enter" && searchQuery.trim()) {
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
    searchSuggestions(value);
  };

  return (
    <div
      className={cn(
        "flex-1 items-center justify-center",
        mobileVisible ? "flex md:hidden" : "hidden md:flex",
        className,
      )}
    >
      <div
        ref={searchBoxRef}
        className={cn(
          "relative group max-w-md h-9 w-full p-1 rounded-full transition-all flex items-center",
          "focus-within:ring-1 focus-within:ring-primary",
          // 鏅€氶〉闈㈡牱寮?
          (!isAccountPage || scrolled) && [
            "bg-[#f1f4f9] border border-border dark:bg-[#343746]",
            "hover:bg-card hover:border-primary hover:ring-1 hover:ring-primary",
            "focus-within:bg-card",
          ],
          // Account 椤甸潰鏈粴鍔ㄦ椂鐨勯€忔槑鏍峰紡
          isAccountPage &&
            !scrolled && [
              "bg-[#00000066] border border-[#ffffff66]",
              "hover:border-white hover:ring-1 hover:ring-white/50",
              "focus-within:border-white focus-within:ring-white/50",
            ],
        )}
      >
        {/* 閫夋嫨鑿滃崟 */}
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
                backgroundImage: currentCategory.avatar?.startsWith("http")
                  ? `url(${currentCategory.avatar})`
                  : undefined,
              }}
            >
              {currentCategory.avatar?.startsWith("/") && (
                <Image
                  src={currentCategory.avatar}
                  width={28}
                  height={28}
                  alt={currentCategory.name}
                  className="rounded-full"
                />
              )}
              {!currentCategory.avatar?.startsWith("http") &&
                !currentCategory.avatar?.startsWith("/") &&
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

        {/* 鎼滅储杈撳叆妗?*/}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t("search")}
          className={cn(
            "w-full h-full rounded-full transition-all px-2 bg-transparent border-none",
            "placeholder:text-secondary placeholder:text-xs text-xs text-black/80",
            "focus:outline-none",
            // Account 椤甸潰鏈粴鍔ㄦ椂鐨勯€忔槑鏍峰紡
            isAccountPage && !scrolled && ["placeholder:text-white/70"],
          )}
        />

        {/* 鎼滅储鎸夐挳 */}
        <button
          onClick={() => searchQuery.trim() && handleSearch(searchQuery)}
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

        {/* 鎼滅储闈㈡澘 */}
        {isSearchPanelOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="p-4">
              {!searchQuery ? (
                <>
                  {/* 鍘嗗彶鎼滅储 */}
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
                            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 鐑棬鎼滅储 */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      {t("hotSearches")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hotSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchFromHistory(item)}
                          className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 rounded-full transition-colors text-primary"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 鏃犳悳绱㈠巻鍙叉椂鐨勬彁绀?*/}
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
                  {/* 鎼滅储寤鸿 */}
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2
                        size={20}
                        className="animate-spin text-muted-foreground"
                      />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1 -mx-2">
                      {searchResults.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => goToArticle(article.id)}
                          className="cursor-pointer h-9 px-3 w-full flex-1 text-left rounded-md hover:bg-primary/10 text-nowrap text-ellipsis line-clamp-1 text-sm"
                        >
                          <span className="text-black/65 dark:text-white font-semibold">
                            {highlightText(article.title, searchQuery)}
                          </span>
                        </button>
                      ))}
                      {/* 鏌ョ湅鏇村 */}
                      <button
                        onClick={() => goToSearchPage(searchQuery)}
                        className="w-full text-center py-2 text-sm text-primary hover:underline"
                      >
                        {t("viewAllResults")}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {t("noResults")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 鍒嗙被涓嬫媺鑿滃崟 */}
        {isDropdownOpen && (
          <>
            {/* 閬僵灞?*/}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* 鑿滃崟鍐呭 */}
            <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-102 overflow-y-auto scroll-auto">
              <div className="p-2">
                {/* 鍏ㄩ儴閫夐」 */}
                <button
                  onClick={() => handleCategorySelect(undefined)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer hover:bg-primary/15",
                    !selectedCategory && "text-primary",
                  )}
                >
                  <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Image
                      src="/placeholder/menu.png"
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

                {/* 鍒嗙被閫夐」 */}
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
                        <Image
                          src={category.avatar}
                          fill
                          quality={95}
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
        )}
      </div>
    </div>
  );
}

