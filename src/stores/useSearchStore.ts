import { create } from "zustand";

export interface SearchParamsState {
  q: string;
  category?: string;
}

interface SearchStore extends SearchParamsState {
  setSearchParams: (params: SearchParamsState) => void;
  resetSearchParams: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  q: "",
  category: undefined,
  setSearchParams: ({ q, category }) =>
    set({
      q,
      category: category || undefined,
    }),
  resetSearchParams: () =>
    set({
      q: "",
      category: undefined,
    }),
}));
