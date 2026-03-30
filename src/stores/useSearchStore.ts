import { create } from "zustand";

export interface SearchParamsState {
  q: string;
  category?: string;
  sort: "relevance" | "latest" | "views" | "likes";
}

interface SearchStore extends SearchParamsState {
  setSearchParams: (params: SearchParamsState) => void;
  resetSearchParams: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  q: "",
  category: undefined,
  sort: "relevance",
  setSearchParams: ({ q, category, sort }) =>
    set({
      q,
      category: category || undefined,
      sort,
    }),
  resetSearchParams: () =>
    set({
      q: "",
      category: undefined,
      sort: "relevance",
    }),
}));
