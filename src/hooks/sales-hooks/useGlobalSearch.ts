"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWorkspace } from "@/hooks/sales-hooks/useWorkspace";
import {
  globalSearchService,
  GlobalSearchParams,
} from "@/services/sales-services/globalSearchService";

export interface SearchResult {
  id: string;
  type: "lead" | "task" | "deal" | "company" | "contact";
  title: string;
  description?: string;
  url: string;
  priority?: string;
  status?: string;
  assignee?: string;
  tags?: string[];
}

export const useGlobalSearch = () => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setHasError(false);
  }, []);

  const performSearch = useCallback(
    async (term: string) => {
      if (!selectedWorkspace?.id || !selectedOrganization?.id) {
        return;
      }

      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setHasError(false);
      try {
        const params: GlobalSearchParams = {
          query: term,
          workspaceId: selectedWorkspace.id,
          organizationId: selectedOrganization.id,
          limit: 20,
        };

        const results = await globalSearchService.search(params);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
        setHasError(true);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedWorkspace?.id, selectedOrganization?.id]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term);
      }, 300);
    },
    [performSearch]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    searchResults,
    isSearchOpen,
    isSearching,
    hasError,
    openSearch,
    closeSearch,
  };
};
