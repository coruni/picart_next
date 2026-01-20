"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryList } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useClickOutside } from "@/hooks/useClickOutside";

interface SearchBoxProps {
  categories?: CategoryList;
  isAccountPage?: boolean;
  scrolled?: boolean;
  onSearch?: (query: string, categoryId?: number) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({
  categories,
  isAccountPage = false,
  scrolled = false,
  onSearch,
  placeholder,
  className
}: SearchBoxProps) {
  const t = useTranslations("common");
  const [selectedCategory, setSelectedCategory] = useState<CategoryList[0] | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>("searchHistory", []);
  
  const searchBoxRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mock hot searches data - in real app this would come from API
  const hotSearches = ["签到", "原神", "崩坏", "星穹铁道", "绝区零"];

  // Close search panel when clicking outside
  useClickOutside<HTMLDivElement>(searchBoxRef, () => {
    setIsSearchPanelOpen(false);
  });

  // 构建选择菜单 - 过滤掉有链接的分类，只显示可搜索的分类
  const menuItems = categories?.filter((category) => !category.link) || [];

  // 默认选择第一个分类或"全部"
  const currentCategory = selectedCategory || {
    id: 0,
    name: t("all"),
    avatar: "/placeholder/menu.png",
    description: t("searchAll")
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Add to search history
      const newHistory = [query.trim(), ...searchHistory.filter(item => item !== query.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      setIsSearchPanelOpen(false);
      onSearch?.(query, selectedCategory?.id);
    }
  };

  const handleSearchFromHistory = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    setIsSearchPanelOpen(true);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleCategorySelect = (category: CategoryList[0] | undefined) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
    // 如果有搜索内容，重新搜索
    if (searchQuery) {
      onSearch?.(searchQuery, category?.id);
    }
  };

  return (
    <div className={cn("flex-1 items-center justify-center hidden md:flex", className)}>
      <div 
        ref={searchBoxRef}
        className={cn(
          "relative group max-w-md h-9 w-full p-1 rounded-full transition-all flex items-center",
          "focus-within:ring-1 focus-within:ring-primary",
          // 普通页面样式
          (!isAccountPage || scrolled) && [
            "bg-[#f1f4f9] border border-border",
            "hover:bg-card hover:border-primary hover:ring-1 hover:ring-primary",
            "focus-within:bg-card",
          ],
          // Account 页面未滚动时的透明样式
          isAccountPage && !scrolled && [
            "bg-[#00000066] border border-[#ffffff66]",
            "hover:border-white hover:ring-1 hover:ring-white/50",
            "focus-within:border-white focus-within:ring-white/50",
          ]
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
                backgroundImage: currentCategory.avatar?.startsWith('http')
                  ? `url(${currentCategory.avatar})`
                  : undefined
              }}
            >
              {currentCategory.avatar?.startsWith('/') && (
                <Image
                  src={currentCategory.avatar}
                  width={28}
                  height={28}
                  alt={currentCategory.name}
                  className="rounded-full"
                />
              )}
              {!currentCategory.avatar?.startsWith('http') && !currentCategory.avatar?.startsWith('/') && (
                currentCategory.avatar
              )}
            </div>
            <div className="flex items-center justify-center size-5 ml-1">
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </div>
          </button>
          <span className={cn(
            "ml-2 w-px h-4",
            (!isAccountPage || scrolled) ? "bg-[#c1ccd9]" : "bg-white/30"
          )}></span>
        </div>

        {/* 搜索输入框 */}
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
            "placeholder:text-secondary placeholder:text-sm",
            "focus:outline-none",
            // Account 页面未滚动时的透明样式
            isAccountPage && !scrolled && [
              "placeholder:text-white/70"
            ]
          )}
        />

        {/* 搜索按钮 */}
        <button
          onClick={() => searchQuery.trim() && handleSearch(searchQuery)}
          className={cn(
            "flex items-center justify-center size-7 rounded-full transition-colors",
            "hover:bg-primary/10",
            (!isAccountPage || scrolled) ? "text-secondary hover:text-primary" : "text-white/70 hover:text-white"
          )}
        >
          <Search size={16} />
        </button>

        {/* 搜索面板 */}
        {isSearchPanelOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="p-4">
              {/* 历史搜索 */}
              {searchHistory.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground">{t("searchHistory")}</h3>
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

              {/* 热门搜索 */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">{t("hotSearches")}</h3>
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

              {/* 无搜索历史时的提示 */}
              {searchHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">{t("noSearchHistory")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 分类下拉菜单 */}
        {isDropdownOpen && (
          <>
            {/* 遮罩层 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* 菜单内容 */}
            <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-102 overflow-y-auto scroll-auto">
              <div className="p-2">
                {/* 全部选项 */}
                <button
                  onClick={() => handleCategorySelect(undefined)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer hover:bg-primary/15",
                    !selectedCategory && ("text-primary")
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

                {/* 分类选项 */}
                {menuItems.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer hover:bg-primary/15 hover:text-primary",
                      selectedCategory?.id === category.id && ("text-primary")
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