
"use client";

import { createContext, useContext, type ReactNode } from "react";

interface HotSearchContextType {
  hotSearchKeywords: string[] | undefined;
}

const HotSearchContext = createContext<HotSearchContextType>({
  hotSearchKeywords: undefined,
});

interface HotSearchProviderProps {
  children: ReactNode;
  hotSearchKeywords?: string[];
}

export function HotSearchProvider({
  children,
  hotSearchKeywords,
}: HotSearchProviderProps) {
  return (
    <HotSearchContext.Provider value={{ hotSearchKeywords }}>
      {children}
    </HotSearchContext.Provider>
  );
}

export function useHotSearch() {
  return useContext(HotSearchContext);
}
