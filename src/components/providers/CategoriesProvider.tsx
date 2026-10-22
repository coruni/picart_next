"use client";

import type { CategoryList } from "@/types";
import { createContext, useContext, type ReactNode } from "react";

// 分类树已经在根布局 SSR 取过一次，这里下发给客户端页面复用，
// 避免 create/* 各自再请求一遍（且那几次请求没带 limit，可能被截断）
const CategoriesContext = createContext<CategoryList>([]);

type CategoriesProviderProps = {
  categories: CategoryList;
  children: ReactNode;
};

export function CategoriesProvider({
  categories,
  children,
}: CategoriesProviderProps) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoryList {
  return useContext(CategoriesContext);
}
