/**
 * COMPANIES HOOK
 * ==============
 * Optimized hook for fetching companies with pagination, search, and caching.
 */

import { useCallback } from "react";
import { Company } from "@/types/sales-types";
import { companyService } from "@/services/sales-services/companyService";
import {
  usePaginatedCRMData,
  useCRMData,
  PaginationParams,
  PaginatedResponse,
  invalidateCache,
} from "./useCRMData";

const API_BASE_URL = process.env.NEXT_PUBLIC_CRM_BACKEND_URL || "";

interface UseCompaniesOptions {
  workspaceId: string;
  organizationId: string;
  enabled?: boolean;
  initialPage?: number;
  initialLimit?: number;
}

// Fetch companies with pagination support
async function fetchCompanies(
  workspaceId: string,
  organizationId: string,
  params: PaginationParams
): Promise<PaginatedResponse<Company>> {
  const token = localStorage.getItem("crm_access_token") || "";

  const queryParams = new URLSearchParams({
    workspaceId,
    organizationId,
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  if (params.search) {
    queryParams.append("search", params.search);
  }

  if (params.sortBy) {
    queryParams.append("sortBy", params.sortBy);
    queryParams.append("sortOrder", params.sortOrder || "desc");
  }

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value) {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/companies?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.status}`);
  }

  const data = await response.json();

  // Handle both array response (legacy) and paginated response
  if (Array.isArray(data)) {
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;

    let filtered = data;

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = data.filter((company: Company) =>
        company.name?.toLowerCase().includes(searchLower) ||
        company.email?.toLowerCase().includes(searchLower) ||
        company.industry?.toLowerCase().includes(searchLower) ||
        company.domain?.toLowerCase().includes(searchLower)
      );
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter((company: Company) => {
            const companyValue = (company as Record<string, unknown>)[key];
            if (Array.isArray(value)) {
              return value.includes(String(companyValue));
            }
            return String(companyValue) === value;
          });
        }
      });
    }

    if (params.sortBy) {
      filtered.sort((a: Company, b: Company) => {
        const aVal = (a as Record<string, unknown>)[params.sortBy!];
        const bVal = (b as Record<string, unknown>)[params.sortBy!];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = String(aVal).localeCompare(String(bVal));
        return params.sortOrder === "asc" ? comparison : -comparison;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasMore: params.page < totalPages,
    };
  }

  return {
    data: data.data || data.companies || [],
    total: data.total || data.count || 0,
    page: data.page || params.page,
    limit: data.limit || params.limit,
    totalPages: data.totalPages || Math.ceil((data.total || 0) / params.limit),
    hasMore: data.hasMore || (data.page < data.totalPages),
  };
}

export function useCompanies(options: UseCompaniesOptions) {
  const { workspaceId, organizationId, enabled = true, initialPage = 1, initialLimit = 25 } = options;

  const fetcher = useCallback(
    (params: PaginationParams) => fetchCompanies(workspaceId, organizationId, params),
    [workspaceId, organizationId]
  );

  const result = usePaginatedCRMData(
    fetcher,
    { page: initialPage, limit: initialLimit },
    {
      enabled: enabled && !!workspaceId && !!organizationId,
      cacheKey: `companies:${workspaceId}:${organizationId}`,
    }
  );

  return {
    companies: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages,
    hasMore: result.pagination.hasMore,
    isLoading: result.isLoading,
    isRefetching: result.isRefetching,
    error: result.error,
    setPage: result.setPage,
    setLimit: result.setLimit,
    setSearch: result.setSearch,
    setFilters: result.setFilters,
    setSorting: result.setSorting,
    refetch: result.refetch,
    invalidate: result.invalidate,
  };
}

// Hook for single company
export function useCompany(
  companyId: string,
  workspaceId: string,
  organizationId: string,
  enabled: boolean = true
) {
  const fetcher = useCallback(async () => {
    const token = localStorage.getItem("crm_access_token") || "";
    const result = await companyService.getCompany(
      companyId,
      workspaceId,
      organizationId,
      token
    );
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to fetch company");
    }
    return result.data;
  }, [companyId, workspaceId, organizationId]);

  return useCRMData(fetcher, [companyId], {
    enabled: enabled && !!companyId && !!workspaceId,
    cacheKey: `company:${companyId}`,
  });
}

export function invalidateCompaniesCache(workspaceId?: string): void {
  if (workspaceId) {
    invalidateCache(`companies:${workspaceId}`);
  } else {
    invalidateCache("companies:");
  }
  invalidateCache("company:");
}
