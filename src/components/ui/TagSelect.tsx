"use client";

import { tagControllerFindAll } from "@/api";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { cn } from "@/lib/utils";
import { ChevronDown, Hash, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TagOption = {
  value: string;
  label: string;
};

type TagSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  customValue: string[];
  onCustomChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialSelectedOptions?: TagOption[];
};

const PAGE_SIZE = 10;

const mergeTagOptions = (baseOptions: TagOption[], nextOptions: TagOption[]) => {
  const seen = new Set(baseOptions.map((option) => option.value));
  return [
    ...baseOptions,
    ...nextOptions.filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }),
  ];
};

const resolveSelectedOption = (
  value: string,
  options: TagOption[],
  initialSelectedOptions: TagOption[],
) =>
  options.find((option) => option.value === value) ||
  initialSelectedOptions.find((option) => option.value === value);

export const TagSelect = ({
  value,
  onChange,
  customValue,
  onCustomChange,
  placeholder,
  className,
  disabled = false,
  initialSelectedOptions = [],
}: TagSelectProps) => {
  const t = useTranslations("tagSelect");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef("");
  const prevSearchQueryRef = useRef("");

  const resolvedSelectedOptions = useMemo(() => {
    const selected = value
      .map((selectedValue) =>
        resolveSelectedOption(selectedValue, options, initialSelectedOptions),
      )
      .filter(Boolean) as TagOption[];

    return mergeTagOptions([], selected);
  }, [initialSelectedOptions, options, value]);

  const normalizedQuery = searchQuery.trim();
  const hasExactMatch = normalizedQuery
    ? options.some(
        (option) => option.label.trim().toLowerCase() === normalizedQuery.toLowerCase(),
      ) ||
      customValue.some(
        (item) => item.trim().toLowerCase() === normalizedQuery.toLowerCase(),
      )
    : false;

  const fetchTags = useCallback(
    async (query: string, pageToLoad: number, append: boolean) => {
      setLoading(true);
      try {
        const response = await tagControllerFindAll({
          query: {
            page: pageToLoad,
            limit: PAGE_SIZE,
            ...(query.trim() ? { name: query.trim() } : {}),
          },
        });

        const fetchedTags =
          response.data?.data?.data?.map((tag) => ({
            value: String(tag.id),
            label: tag.name,
          })) || [];

        const meta = response.data?.data?.meta;
        setHasMore(
          typeof meta?.totalPages === "number"
            ? pageToLoad < meta.totalPages
            : fetchedTags.length >= PAGE_SIZE,
        );
        setPage(pageToLoad);
        activeQueryRef.current = query.trim();

        setOptions((current) => {
          const base = append ? mergeTagOptions(current, fetchedTags) : fetchedTags;
          const selected = value
            .map((selectedValue) =>
              resolveSelectedOption(
                selectedValue,
                mergeTagOptions(base, current),
                initialSelectedOptions,
              ),
            )
            .filter(Boolean) as TagOption[];

          return mergeTagOptions(base, selected);
        });
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setLoading(false);
      }
    },
    [initialSelectedOptions, value],
  );

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = searchQuery.trim();
    const prevTrimmed = prevSearchQueryRef.current.trim();
    prevSearchQueryRef.current = searchQuery;

    if (!trimmed) {
      if (prevTrimmed) {
        void fetchTags("", 1, false);
      }
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      void fetchTags(trimmed, 1, false);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchTags, searchQuery]);

  useEffect(() => {
    void fetchTags("", 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    rootRef: scrollContainerRef,
    enabled: isOpen && hasMore && !loading,
    rootMargin: "40px",
    onIntersect: () => {
      if (loading || !hasMore) return;
      void fetchTags(activeQueryRef.current, page + 1, true);
    },
  });

  const handleToggle = (option: TagOption) => {
    const exists = value.includes(option.value);
    const nextValue = exists
      ? value.filter((selectedValue) => selectedValue !== option.value)
      : [...value, option.value];

    onChange(nextValue);
    setSearchQuery("");
    setIsOpen(true);
  };

  const handleCreateCustom = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    if (customValue.some((item) => item.trim().toLowerCase() === normalized.toLowerCase())) {
      setSearchQuery("");
      setIsOpen(true);
      return;
    }

    onCustomChange([...customValue, normalized]);
    setSearchQuery("");
    setIsOpen(true);
  };

  const handleRemoveSelected = (optionValue: string) => {
    onChange(value.filter((selectedValue) => selectedValue !== optionValue));
    inputRef.current?.focus();
  };

  const handleRemoveCustom = (optionName: string) => {
    onCustomChange(
      customValue.filter(
        (selectedValue) => selectedValue.trim().toLowerCase() !== optionName.trim().toLowerCase(),
      ),
    );
    inputRef.current?.focus();
  };

  const handleClearAll = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange([]);
    onCustomChange([]);
    setSearchQuery("");
    setIsOpen(false);
    void fetchTags("", 1, false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "relative min-h-10 rounded-lg border border-border bg-card px-3 py-2",
          "flex flex-wrap items-center gap-2",
          "focus-within:border-primary focus-within:ring-primary",
          "hover:border-primary transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        {resolvedSelectedOptions.map((option) => (
          <span
            key={option.value}
            className="inline-flex max-w-full h-7.5 min-w-0 items-center gap-1 rounded-full bg-[#f1f4f9] px-3 py-1"
          >
            <span className="truncate text-sm">{option.label}</span>
            <button
              type="button"
              aria-label={t("removeSelected")}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleRemoveSelected(option.value);
              }}
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full cursor-pointer",
                "bg-card/65 text-secondary transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {customValue.map((name) => (
          <span
            key={name}
            className="inline-flex max-w-full h-7.5 min-w-0 items-center gap-1 rounded-full bg-[#eef7ff] px-3 py-1"
          >
            <span className="truncate text-sm">{name}</span>
            <button
              type="button"
              aria-label={t("removeSelected")}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleRemoveCustom(name);
              }}
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full cursor-pointer",
                "bg-card/65 text-secondary transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (!normalizedQuery || hasExactMatch) return;
            e.preventDefault();
            handleCreateCustom(normalizedQuery);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          placeholder={
            resolvedSelectedOptions.length > 0
              ? placeholder || t("searchPlaceholder")
              : placeholder || t("placeholder")
          }
          className={cn(
            "min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
            disabled && "cursor-not-allowed",
          )}
        />
        {searchQuery || resolvedSelectedOptions.length > 0 ? (
          <button
            type="button"
            aria-label={t("clearAll")}
            onClick={handleClearAll}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors cursor-pointer",
              "hover:bg-muted hover:text-foreground",
            )}
          >
            <X size={14} />
          </button>
        ) : null}
        {loading && (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-gray-500 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-20 w-full mt-1",
            "bg-card border border-border",
            "drop-shadow-lg",
            "rounded-lg",
            "overflow-hidden",
          )}
        >
          <div className="px-4 pt-4">
            <span className="font-semibold text-sm">{t("recommended")}</span>
          </div>
          <div
            ref={scrollContainerRef}
            className="max-h-60 overflow-auto py-2 px-2"
          >
            {normalizedQuery && !hasExactMatch ? (
              <button
                type="button"
                onClick={() => handleCreateCustom(normalizedQuery)}
                className={cn(
                  "mb-2 relative w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm",
                  "flex items-center gap-2 border border-dashed border-primary/30 bg-primary/5 text-primary",
                  "hover:bg-primary/10 transition-colors",
                )}
              >
                <span className="relative flex size-4 shrink-0 items-center justify-center rounded-xl bg-primary p-0.5 text-white after:absolute after:bottom-0 after:right-0 after:h-0 after:w-0 after:border-l-[6px] after:border-l-primary after:border-t-[6px] after:border-t-transparent after:content-[''] after:-rotate-90">
                  <Hash size={14} strokeWidth={2} />
                </span>
                <span className="truncate">
                  {t("createTopic", { name: normalizedQuery })}
                </span>
              </button>
            ) : null}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                {searchQuery
                  ? hasExactMatch
                    ? t("noTags")
                    : null
                  : t("noTags")}
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={cn(
                      "mb-1 relative w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm",
                      "flex items-center gap-2",
                      "hover:bg-primary/10 transition-colors",
                      isSelected && "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="relative flex size-4 shrink-0 items-center justify-center rounded-xl bg-primary p-0.5 text-white after:absolute after:bottom-0 after:right-0 after:h-0 after:w-0 after:border-l-[6px] after:border-l-primary after:border-t-[6px] after:border-t-transparent after:content-[''] after:-rotate-90">
                      <Hash size={14} strokeWidth={2} />
                    </span>
                    <span className="truncate">{option.label}</span>
                    {/* {isSelected ? (
                      <span className="ml-auto text-xs text-primary">
                        {t("removeSelected")}
                      </span>
                    ) : null} */}
                  </button>
                );
              })
            )}

            <InfiniteScrollStatus
              observerRef={observerRef}
              hasMore={hasMore}
              loading={loading}
              loadingText={t("loading")}
              idleText={t("loadMore")}
              allLoadedText={t("allLoaded")}
              emptyText={t("noTags")}
              containerClassName="py-3"
              loadingClassName="text-secondary"
              idleTextClassName="text-secondary"
              endClassName="text-muted-foreground"
              emptyClassName="text-muted-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
};
