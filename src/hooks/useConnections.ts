"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Connection,
  ConnectionListParams,
  ConnectionListResponse,
} from "@/types/connection";

/**
 * Options for the useConnections hook.
 * Extends ConnectionListParams with an enabled flag.
 */
export interface UseConnectionsOptions extends ConnectionListParams {
  /** Whether to enable fetching. Defaults to true. */
  enabled?: boolean;
}

/**
 * Return type for the useConnections hook.
 */
export interface UseConnectionsReturn {
  /** List of connections for the current page */
  connections: Connection[];
  /** Total number of connections matching the filters */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Whether a fetch is in progress */
  isLoading: boolean;
  /** Error object if fetch failed, null otherwise */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
  /** Set the current page */
  setPage: (page: number) => void;
  /** Set items per page */
  setLimit: (limit: number) => void;
  /** Set search query (searches name, headline, company) */
  setSearch: (search: string) => void;
  /** Set integration ID filter */
  setIntegrationId: (id: string | undefined) => void;
  /** Set is_excluded filter */
  setIsExcluded: (excluded: boolean | undefined) => void;
  /** Set sort field */
  setOrderBy: (orderBy: "connected_on" | "created_at" | "name") => void;
  /** Set sort direction */
  setSortType: (sortType: "asc" | "desc") => void;
}

/**
 * Hook for fetching and managing LinkedIn connections with pagination and filtering.
 *
 * Features:
 * - Pagination support
 * - Search by name, headline, or company
 * - Filter by integration
 * - Filter by excluded status
 * - Sort by connected date, created date, or name
 * - Automatic page reset when filters change
 *
 * @param initialOptions - Initial options for the hook
 * @returns UseConnectionsReturn object with data and control functions
 *
 * @example
 * ```tsx
 * const {
 *   connections,
 *   total,
 *   isLoading,
 *   setSearch,
 *   setPage,
 * } = useConnections({ limit: 20 });
 * ```
 */
export function useConnections(
  initialOptions: UseConnectionsOptions = {}
): UseConnectionsReturn {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter state
  const [page, setPageState] = useState(initialOptions.page || 1);
  const [limit, setLimitState] = useState(initialOptions.limit || 20);
  const [search, setSearchState] = useState(initialOptions.search || "");
  const [integrationId, setIntegrationIdState] = useState(
    initialOptions.integration_id
  );
  const [isExcluded, setIsExcludedState] = useState(initialOptions.is_excluded);
  const [orderBy, setOrderByState] = useState<
    "connected_on" | "created_at" | "name"
  >(initialOptions.order_by || "connected_on");
  const [sortType, setSortTypeState] = useState<"asc" | "desc">(
    initialOptions.sort_type || "desc"
  );

  // Track if this is the initial mount to prevent double fetching
  const isInitialMount = useRef(true);

  // Track if we should skip the next filter change reset
  const skipPageReset = useRef(false);

  // Fetch connections from the API
  const fetchConnections = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (search) {
        params.set("search", search);
      }
      if (integrationId) {
        params.set("integration_id", integrationId);
      }
      if (isExcluded !== undefined) {
        params.set("is_excluded", String(isExcluded));
      }
      params.set("order_by", orderBy);
      params.set("sort_type", sortType);

      const response = await fetch(
        `/api/connections/list?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data: ConnectionListResponse = await response.json();
      setConnections(data.data);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setConnections([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, integrationId, isExcluded, orderBy, sortType]);

  // Initial fetch on mount
  useEffect(() => {
    if (initialOptions.enabled !== false) {
      fetchConnections();
    }
    isInitialMount.current = false;
  }, []); // Only run on mount

  // Refetch when dependencies change (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    if (initialOptions.enabled !== false) {
      fetchConnections();
    }
  }, [
    page,
    limit,
    search,
    integrationId,
    isExcluded,
    orderBy,
    sortType,
    fetchConnections,
    initialOptions.enabled,
  ]);

  // Reset to page 1 when filters change (not page or limit)
  useEffect(() => {
    if (isInitialMount.current || skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    // Only reset if we're not already on page 1
    if (page !== 1) {
      skipPageReset.current = true;
      setPageState(1);
    }
  }, [search, integrationId, isExcluded, orderBy, sortType]);

  // Setter functions
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
  }, []);

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
  }, []);

  const setIntegrationId = useCallback((id: string | undefined) => {
    setIntegrationIdState(id);
  }, []);

  const setIsExcluded = useCallback((excluded: boolean | undefined) => {
    setIsExcludedState(excluded);
  }, []);

  const setOrderBy = useCallback(
    (newOrderBy: "connected_on" | "created_at" | "name") => {
      setOrderByState(newOrderBy);
    },
    []
  );

  const setSortType = useCallback((newSortType: "asc" | "desc") => {
    setSortTypeState(newSortType);
  }, []);

  return {
    connections,
    total,
    page,
    limit,
    isLoading,
    error,
    refetch: fetchConnections,
    setPage,
    setLimit,
    setSearch,
    setIntegrationId,
    setIsExcluded,
    setOrderBy,
    setSortType,
  };
}

export default useConnections;
