"use client";

import { categoryControllerFindAll } from "@/api";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CategoryOption = {
  value: string;
  label: string;
  avatar?: string;
};

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options?: CategoryOption[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  parentId?: string;
};

const PAGE_SIZE = 12;

const mergeCategoryOptions = (
  baseOptions: CategoryOption[],
  searchOptions: CategoryOption[],
) => {
  const seen = new Set(baseOptions.map((option) => option.value));
  return [
    ...baseOptions,
    ...searchOptions.filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }),
  ];
};

export const CategorySelect = ({
  value,
  onChange,
  options = [],
  placeholder,
  className,
  inputClassName,
  disabled = false,
  parentId,
}: CategorySelectProps) => {
  const t = useTranslations("categorySelect");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedOptions, setFetchedOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestAbortControllerRef = useRef<AbortController | null>(null);
  const activeQueryRef = useRef("");
  const initializedRef = useRef(false);

  // 传入的 options 作为固定选项始终显示在顶部
  const resolvedOptions = useMemo(
    () => mergeCategoryOptions(options, fetchedOptions),
    [fetchedOptions, options],
  );
  const selectedOption = resolvedOptions.find(
    (option) => option.value === value,
  );
  const normalizedQuery = searchQuery.trim();

  const fetchCategories = useCallback(
    async (query: string, pageToLoad: number, append: boolean) => {
      if (parentId === "") {
        requestAbortControllerRef.current?.abort();
        requestAbortControllerRef.current = null;
        setFetchedOptions([]);
        setHasMore(false);
        return;
      }

      requestAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      requestAbortControllerRef.current = abortController;
      setLoading(true);
      try {
        const numericParentId = parentId ? Number(parentId) : undefined;
        const response = await categoryControllerFindAll({
          query: {
            page: pageToLoad,
            limit: PAGE_SIZE,
            ...(query.trim() ? { name: query.trim() } : {}),
            ...(numericParentId ? { parentId: numericParentId } : {}),
          },
          signal: abortController.signal,
        });

        if (requestAbortControllerRef.current !== abortController) {
          return;
        }

        const rawCategories = response.data?.data?.data;
        const categories = Array.isArray(rawCategories) ? rawCategories : [];
        const mappedOptions = categories
          .filter((category) =>
            numericParentId
              ? category.parentId === numericParentId
              : !category.parentId || category.parentId === 0,
          )
          .map((category) => ({
            value: String(category.id),
            label: category.name,
            ...(category.avatar ? { avatar: category.avatar } : {}),
          }));

        const meta = (response.data?.data as { meta?: { totalPages?: number } })
          ?.meta;
        setHasMore(
          typeof meta?.totalPages === "number"
            ? pageToLoad < meta.totalPages
            : mappedOptions.length >= PAGE_SIZE,
        );
        setPage(pageToLoad);
        activeQueryRef.current = query.trim();
        setFetchedOptions((current) =>
          append ? mergeCategoryOptions(current, mappedOptions) : mappedOptions,
        );
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error("Failed to fetch categories:", error);
      } finally {
        if (requestAbortControllerRef.current === abortController) {
          requestAbortControllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [parentId],
  );

  useEffect(() => {
    return () => {
      requestAbortControllerRef.current?.abort();
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = searchQuery.trim();

    // 空查询时不发请求，由 parentId useEffect 处理初始化
    if (!trimmed) {
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      void fetchCategories(trimmed, 1, false);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchCategories, searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setFetchedOptions([]);
    setHasMore(true);
    setPage(1);
    initializedRef.current = false;

    if (parentId === "") {
      return;
    }

    initializedRef.current = true;
    void fetchCategories("", 1, false);
  }, [fetchCategories, parentId]);

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
      void fetchCategories(activeQueryRef.current, page + 1, true);
    },
  });

  const handleSelect = (option: CategoryOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative  max-w-full", className)}>
      <div
        className={cn(
          "relative min-h-10  h-full min-w-0 rounded-lg border border-border bg-card px-3 py-2",
          "flex items-center justify-between gap-2 overflow-hidden",
          "focus-within:border-primary focus-within:ring-primary",
          "hover:border-primary transition-colors",
          disabled && "cursor-not-allowed opacity-50",
          inputClassName,
        )}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        {selectedOption && !searchQuery ? (
          <span className="inline-flex h-7.5 max-w-full shrink items-center gap-2 overflow-hidden rounded-full bg-muted px-2 py-1">
            {selectedOption.avatar ? (
              <Image
                src={selectedOption.avatar}
                alt={selectedOption.label}
                width={20}
                height={20}
                className="aspect-square shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span
              className={cn(
                "truncate text-xs text-muted-foreground max-w-full ",
                selectedOption.avatar && "hidden md:inline ",
              )}
            >
              {selectedOption.label}
            </span>
          </span>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            if (!disabled) setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          placeholder={
            selectedOption && !searchQuery
              ? t("searchPlaceholder")
              : placeholder || t("placeholder")
          }
          className={cn(
            "min-w-10 flex-1 bg-transparent text-sm outline-none",
            "placeholder:text-gray-400",
            disabled && "cursor-not-allowed",
            selectedOption && !searchQuery && "hidden md:block",
          )}
        />

        <div className="flex items-center">
          <div className="flex size-6 shrink-0 items-center justify-center">
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : selectedOption || searchQuery ? (
              <button
                type="button"
                aria-label={t("placeholder")}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClear();
                }}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen) {
                  setTimeout(() => inputRef.current?.focus(), 0);
                }
              }
            }}
            disabled={disabled}
            className="flex size-5 shrink-0 items-center justify-center"
          >
            <ChevronDown
              className={cn(
                "size-4 text-gray-500 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "absolute z-20 mt-1 left-0 right-0 min-w-0 origin-top",
          "overflow-hidden rounded-lg border border-border bg-card shadow-lg",
          "transition-[opacity,transform] duration-160 ease-out will-change-transform",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div
          ref={scrollContainerRef}
          className="max-h-100 overflow-auto py-2 px-2"
        >
          {resolvedOptions.length === 0 ? (
            <div className="px-3 py-2 text-center text-sm text-muted-foreground">
              {normalizedQuery ? t("noMatched") : t("noCategories")}
            </div>
          ) : (
            resolvedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "relative mb-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
                  "transition-colors hover:bg-primary/10",
                  option.value === value && "bg-primary/10 text-primary",
                )}
              >
                {option.avatar ? (
                  <Image
                    src={option.avatar}
                    alt={option.label}
                    width={30}
                    height={30}
                    className="aspect-square shrink-0 rounded-full object-cover"
                  />
                ) : null}
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}

          <InfiniteScrollStatus
            observerRef={observerRef}
            hasMore={hasMore}
            loading={loading}
            loadingText={t("loading")}
            idleText={t("loadMore")}
            allLoadedText={t("allLoaded")}
            emptyText={t("noCategories")}
            containerClassName="py-3"
            loadingClassName="text-secondary"
            idleTextClassName="text-secondary"
            endClassName="text-muted-foreground"
            emptyClassName="text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
};
