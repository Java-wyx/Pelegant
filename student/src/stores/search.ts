import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Job } from "@/types/job";

interface SearchState {
  searchInput: string;
  activeCategory: string;
  searchResults: Job[];
  setSearchInput: (input: string) => void;
  setActiveCategory: (category: string) => void;
  setSearchResults: (results: Job[]) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      searchInput: '',
      activeCategory: 'All',
      searchResults: [],
      setSearchInput: (input) => set({ searchInput: input }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setSearchResults: (results) => set({ searchResults: results })
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({ 
        searchResults: state.searchResults,
        searchInput: state.searchInput,
        activeCategory: state.activeCategory
      })
    }
  )
);
