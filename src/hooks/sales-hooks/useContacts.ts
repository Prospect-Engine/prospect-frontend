/**
 * CONTACTS HOOK
 * =============
 * Optimized hook for fetching contacts with pagination, search, and caching.
 */

import { useCallback, useMemo } from "react";
import { Contact } from "@/types/sales-types";
import { contactService } from "@/services/sales-services/contactService";
import {
  usePaginatedCRMData,
  useCRMData,
  PaginationParams,
  PaginatedResponse,
  invalidateCache,
} from "./useCRMData";

const API_BASE_URL = process.env.NEXT_PUBLIC_CRM_BACKEND_URL || "";

interface UseContactsOptions {
  workspaceId: string;
  organizationId: string;
  enabled?: boolean;
  initialPage?: number;
  initialLimit?: number;
}

interface UseContactsResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
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
}

// Fetch contacts with pagination support
async function fetchContacts(
  workspaceId: string,
  organizationId: string,
  params: PaginationParams
): Promise<PaginatedResponse<Contact>> {
  const token = localStorage.getItem("crm_access_token") || "";

  // Build query string with pagination parameters
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

  // Add filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value) {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/contacts?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contacts: ${response.status}`);
  }

  const data = await response.json();

  // Handle both array response (legacy) and paginated response
  if (Array.isArray(data)) {
    // Client-side pagination for legacy API
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;

    let filtered = data;

    // Client-side search if API doesn't support it
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = data.filter((contact: Contact) =>
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.jobTitle?.toLowerCase().includes(searchLower) ||
        contact.company?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Client-side filtering
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter((contact: Contact) => {
            const contactValue = (contact as Record<string, unknown>)[key];
            if (Array.isArray(value)) {
              return value.includes(String(contactValue));
            }
            return String(contactValue) === value;
          });
        }
      });
    }

    // Client-side sorting
    if (params.sortBy) {
      filtered.sort((a: Contact, b: Contact) => {
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

  // Server-side pagination response
  return {
    data: data.data || data.contacts || [],
    total: data.total || data.count || 0,
    page: data.page || params.page,
    limit: data.limit || params.limit,
    totalPages: data.totalPages || Math.ceil((data.total || 0) / params.limit),
    hasMore: data.hasMore || (data.page < data.totalPages),
  };
}

export function useContacts(options: UseContactsOptions): UseContactsResult {
  const { workspaceId, organizationId, enabled = true, initialPage = 1, initialLimit = 25 } = options;

  const fetcher = useCallback(
    (params: PaginationParams) => fetchContacts(workspaceId, organizationId, params),
    [workspaceId, organizationId]
  );

  const result = usePaginatedCRMData(
    fetcher,
    { page: initialPage, limit: initialLimit },
    {
      enabled: enabled && !!workspaceId && !!organizationId,
      cacheKey: `contacts:${workspaceId}:${organizationId}`,
    }
  );

  return {
    contacts: result.data,
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

// Hook for single contact
export function useContact(
  contactId: string,
  workspaceId: string,
  organizationId: string,
  enabled: boolean = true
) {
  const fetcher = useCallback(async () => {
    const token = localStorage.getItem("crm_access_token") || "";
    const result = await contactService.getContact(
      contactId,
      workspaceId,
      organizationId,
      token
    );
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to fetch contact");
    }
    return result.data;
  }, [contactId, workspaceId, organizationId]);

  return useCRMData(fetcher, [contactId], {
    enabled: enabled && !!contactId && !!workspaceId,
    cacheKey: `contact:${contactId}`,
  });
}

// Invalidate all contact caches
export function invalidateContactsCache(workspaceId?: string): void {
  if (workspaceId) {
    invalidateCache(`contacts:${workspaceId}`);
  } else {
    invalidateCache("contacts:");
  }
  invalidateCache("contact:");
}
