"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslations } from "next-intl";

export type CategoryOption = {
  value: string;
  label: string;
  avatar?: string;
};

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
};

export const CategorySelect = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  loading = false,
  onSearch,
}: CategorySelectProps) => {
  const t = useTranslations("categorySelect");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  useEffect(() => {
    if (!onSearch || !searchQuery.trim()) return;

    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleSelect = (option: CategoryOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-10 rounded-lg border border-border cursor-pointer",
          "px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-primary focus:border-primary",
          "hover:border-primary transition-colors",
          "flex items-center justify-between gap-2",
          "bg-card",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.avatar && (
            <Image
              src={selectedOption.avatar}
              alt={selectedOption.label}
              width={30}
              height={30}
              className="rounded-xl shrink-0 object-cover aspect-square"
            />
          )}
          <span className={cn("truncate", !selectedOption && "text-gray-400")}>
            {selectedOption ? selectedOption.label : placeholder || t("placeholder")}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-gray-500 transition-transform shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

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
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className={cn(
                  "w-full h-8 pl-8 pr-3 text-sm",
                  "rounded-md border border-border",
                  "focus:outline-none focus:border-primary",
                  "bg-background",
                )}
              />
              {loading && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          <div className="max-h-100 overflow-auto py-2 px-2">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                {searchQuery ? t("noMatched") : t("noCategories")}
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left cursor-pointer relative mb-1 rounded-xl",
                    "flex items-center gap-2",
                    "hover:bg-primary/10 transition-colors",
                    option.value === value && "bg-primary/10 text-primary",
                  )}
                >
                  {option.avatar && (
                    <Image
                      src={option.avatar}
                      alt={option.label}
                      width={30}
                      height={30}
                      className="rounded-md shrink-0 object-cover aspect-square"
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
