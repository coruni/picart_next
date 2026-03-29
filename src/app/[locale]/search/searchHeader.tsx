"use client";

import { SearchBox } from "@/components/layout/SearchBox";
import { CategoryList } from "@/types";
import { useSearchParams } from "next/navigation";

type SearchHeaderProps = {
  categories: CategoryList;
  className?: string;
};

export function SearchHeader({ categories, className }: SearchHeaderProps) {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;

  return (
    <SearchBox
      key={`${keyword}-${category || ""}`}
      categories={categories}
      block
      defaultValue={keyword}
      defaultCategoryId={category}
      syncSearchStore
      className={className || "w-full"}
    />
  );
}
