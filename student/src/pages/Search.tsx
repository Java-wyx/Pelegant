import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@/components/search/SearchInput";
import { JobList } from "@/components/job/JobList";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Search as SearchIcon, SearchX } from "lucide-react";
import { toast } from "sonner";
import { JobService } from "@/api/job";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useSearchStore } from "@/stores/search";
import type { Job } from "@/types/job";

const Search = () => {
  const { t } = useTranslation();
  const {
    searchInput,
    activeCategory,
    searchResults,
    setSearchInput,
    setActiveCategory,
    setSearchResults,
  } = useSearchStore();

  const [filteredResults, setFilteredResults] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const navigate = useNavigate();

  const categories = useMemo(() => ({
    [t('search.categories.all')]: "0",
    [t('search.categories.fullTime')]: "1",
    [t('search.categories.internship')]: "2",
  }), [t]);

  const filterByCategory = useCallback((results: Job[], category: string) => {
    if (category === t('search.categories.all')) return results;
    return results.filter(
      (job) => job.type === categories[category as keyof typeof categories]
    );
  }, [categories, t]);

  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const filtered = filterByCategory(searchResults, activeCategory);
      setFilteredResults(filtered);
    }
  }, [searchResults, activeCategory, filterByCategory]);

  // Debounce
  const debounce = <T extends unknown[]>(
    func: (...args: T) => void | Promise<void>,
    delay: number
  ) => {
    let timer: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const handleInputChange = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setFilteredResults([]);
        localStorage.removeItem("searchKeyword");
        localStorage.removeItem("searchCategory");
        return;
      }
      try {
        setIsFiltering(true);
        const results = await JobService.searchJobs(
          value,
          categories[activeCategory as keyof typeof categories]
        );
        const jobsWithSaved = await fetchWithSavedStatus(results);
        setFilteredResults(jobsWithSaved);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Search error:", error);
        setFilteredResults([]);
        if (axiosError.response?.status === 401) {
        toast.error(t('login.error.default'));
        navigate("/login");
      } else {
        toast.error(t('search.searchError'));
      }
      } finally {
        setIsFiltering(false);
      }
    }, 500),
    [activeCategory]
  );

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setFilteredResults([]);
      localStorage.removeItem("searchKeyword");
      localStorage.removeItem("searchCategory");
      return;
    }
    try {
      setIsFiltering(true);
      const results = await JobService.searchJobs(
        searchInput,
        categories[activeCategory as keyof typeof categories]
      );
      const jobsWithSaved = await fetchWithSavedStatus(results);
      setFilteredResults(jobsWithSaved);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Search error:", error);
      setFilteredResults([]);
      if (axiosError.response?.status === 401) {
        toast.error(t('login.error.default'));
        navigate("/login");
      } else {
        toast.error(t('search.searchError'));
      }
    } finally {
      setIsFiltering(false);
    }
  };

  const fetchWithSavedStatus = async (jobs: Job[]) => {
    const jobIds = jobs.map((job) => job.id);
    if (jobIds.length === 0) return jobs;
    
    try {
      const savedStatus = await JobService.getSavedStatusBatch(jobIds);
      const savedIds = Object.entries(savedStatus)
        .filter(([_, isSaved]) => isSaved)
        .map(([id]) => id);
      setSavedJobIds(savedIds);
      return jobs;
    } catch (err) {
      console.error(t('search.fetchSavedError'), err);
      toast.error(t('search.fetchSavedError'));
      return jobs;
    }
  };

  const handleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    try {
      await JobService.saveJob(jobId);
      setSavedJobIds((prevIds) =>
        isSaved ? prevIds.filter((id) => id !== jobId) : [...prevIds, jobId]
      );
    } catch (error) {
      console.error(t('search.saveJobError'), error);
      toast.error(t('search.saveJobError'));
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveCategory(t('search.categories.all'));
  };

  // 🔥 用 useMemo 优化渲染逻辑
  const resultContent = useMemo(() => {
    if (isFiltering) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
          <p className="text-muted-foreground">{t('search.searching')}</p>
        </div>
      );
    }

    if (filteredResults.length > 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm text-muted-foreground">
              {t('search.resultsFound', { count: filteredResults.length })}
            </p>
          </div>
          <JobList
            jobs={filteredResults}
            savedJobIds={savedJobIds}
            onSaveJob={handleSaveJob}
          />
        </div>
      );
    }

    if (searchInput.trim()) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
          <SearchX
            size={48}
            className="mx-auto mb-4 text-muted-foreground opacity-50"
          />
          <h3 className="text-lg font-medium mb-1">{t('search.noResults.title')}</h3>
          <p className="text-muted-foreground">{t('search.noResults.description')}</p>
        </div>
      );
    }

    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
        <SearchIcon
          size={48}
          className="mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse"
        />
        <h3 className="text-lg font-medium mb-1">{t('search.startSearching.title')}</h3>
        <p className="text-muted-foreground">{t('search.startSearching.description')}</p>
      </div>
    );
  }, [isFiltering, filteredResults, searchInput, savedJobIds]);

  return (
    <div className="min-h-screen pb-16 pt-4 px-4 max-w-md mx-auto">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <BlurContainer className="mb-4">
          <SearchInput
            placeholder={t('search.placeholder')}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              handleInputChange(e.target.value);
            }}
            onClear={handleClearSearch}
          />
        </BlurContainer>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {Object.keys(categories).map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === category
                  ? "bg-ios-primary text-white"
                  : "bg-ios-subtle text-foreground hover:bg-ios-muted"
              } transition-colors`}
              onClick={() => {
                setActiveCategory(category);
                setFilteredResults(filterByCategory(searchResults, category));
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden">{resultContent}</div>
      </form>
    </div>
  );
};

export default Search;
