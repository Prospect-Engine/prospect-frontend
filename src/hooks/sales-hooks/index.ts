/**
 * CRM HOOKS INDEX
 * ===============
 * Export all CRM-related hooks for easy importing.
 */

// Base data hooks
export {
  useCRMData,
  usePaginatedCRMData,
  useDebouncedValue,
  useOptimisticUpdate,
  batchRequests,
  invalidateCache,
  type PaginationParams,
  type PaginatedResponse,
  type UseCRMDataOptions,
  type UseCRMDataResult,
} from "./useCRMData";

// Entity-specific hooks
export {
  useContacts,
  useContact,
  invalidateContactsCache,
} from "./useContacts";

export {
  useCompanies,
  useCompany,
  invalidateCompaniesCache,
} from "./useCompanies";

export {
  useDeals,
  useDeal,
  useDealsPipeline,
  invalidateDealsCache,
} from "./useDeals";

// Re-export existing hooks
export { useAuth } from "./useAuth";
export { useCounts, CountsProvider, useCountsContext } from "./useCounts";
export { useWorkspace, WorkspaceProvider } from "./useWorkspace";
export { useSearchSuggestions } from "./useSearchSuggestions";
export { useGlobalSearch } from "./useGlobalSearch";
export { useNotifications, NotificationProvider } from "./useNotifications";
