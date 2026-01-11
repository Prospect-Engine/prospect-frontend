/**
 * OPTIMIZED CRM DATA HOOKS
 * ========================
 * Provides caching, pagination, debounced search, and optimistic updates
 * for all CRM data fetching operations.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Contact } from "@/types/sales-types";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300; // 300ms for search

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    key,
  });
}

export function invalidateCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string | string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseCRMDataOptions<T> {
  enabled?: boolean;
  cacheKey?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number;
  staleTime?: number;
}

export interface UseCRMDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Generic data fetching hook with caching
export function useCRMData<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[],
  options: UseCRMDataOptions<T> = {}
): UseCRMDataResult<T> {
  const {
    enabled = true,
    cacheKey,
    onSuccess,
    onError,
    refetchInterval,
    staleTime = CACHE_DURATION,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;

    // Check cache first
    if (cacheKey && !isRefetch) {
      const cached = getFromCache<T>(cacheKey);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }
    }

    if (isRefetch) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetcher();

      // Only update if this is still the latest request
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setData(result);
        if (cacheKey) {
          setCache(cacheKey, result);
        }
        onSuccess?.(result);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
      }
    } finally {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [enabled, cacheKey, fetcher, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    fetchData(true);
  }, [cacheKey, fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [...dependencies, enabled]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  return { data, isLoading, isRefetching, error, refetch, invalidate };
}

// Debounced search hook
export function useDebouncedValue<T>(value: T, delay: number = DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Paginated data hook
export function usePaginatedCRMData<T>(
  fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  initialParams: Partial<PaginationParams> = {},
  options: UseCRMDataOptions<PaginatedResponse<T>> = {}
): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Record<string, string | string[]>) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 25,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    filters: {},
    ...initialParams,
  });

  const debouncedSearch = useDebouncedValue(params.search || "", DEBOUNCE_DELAY);

  const effectiveParams = useMemo(() => ({
    ...params,
    search: debouncedSearch,
  }), [params.page, params.limit, params.sortBy, params.sortOrder, params.filters, debouncedSearch]);

  const cacheKey = options.cacheKey
    ? getCacheKey(options.cacheKey, effectiveParams)
    : undefined;

  const {
    data: response,
    isLoading,
    isRefetching,
    error,
    refetch,
    invalidate,
  } = useCRMData(
    () => fetcher(effectiveParams),
    [effectiveParams],
    { ...options, cacheKey }
  );

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setFilters = useCallback((filters: Record<string, string | string[]>) => {
    setParams((prev) => ({ ...prev, filters, page: 1 }));
  }, []);

  const setSorting = useCallback((sortBy: string, sortOrder: "asc" | "desc") => {
    setParams((prev) => ({ ...prev, sortBy, sortOrder }));
  }, []);

  return {
    data: response?.data || [],
    pagination: {
      page: response?.page || params.page,
      limit: response?.limit || params.limit,
      total: response?.total || 0,
      totalPages: response?.totalPages || 0,
      hasMore: response?.hasMore || false,
    },
    isLoading,
    isRefetching,
    error,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    setSorting,
    refetch,
    invalidate,
  };
}

// Optimistic update helper
export function useOptimisticUpdate<T extends { id: string }>(
  data: T[],
  setData: (data: T[]) => void
) {
  const update = useCallback((id: string, updates: Partial<T>) => {
    setData(data.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [data, setData]);

  const remove = useCallback((id: string) => {
    setData(data.filter((item) => item.id !== id));
  }, [data, setData]);

  const add = useCallback((item: T) => {
    setData([item, ...data]);
  }, [data, setData]);

  return { update, remove, add };
}

// Batch request helper for multiple parallel requests
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }

  return results;
}
