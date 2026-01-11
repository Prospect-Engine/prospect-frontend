import { useState, useEffect, useCallback, useMemo, useRef } from "react";

export interface WorkspaceMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  workspace_id?: string;
  workspace_name?: string;
  is_connected: boolean;
  last_activity: string | null;
  has_active_campaign: boolean;
  campaign_count: number;
  invite_send_count: number;
  lead_connected_count: number;
  message_send_count: number;
  message_reply_count: number;
  inemail_send_count: number;
  follow_count: number;
  endorse_count: number;
  like_post_count: number;
  completed_sequence_lead_count: number;
  fail_count: number;
  ignored_count: number;
  withdrawn_count: number;
  pasued_lead_count: number;
  black_listed_count: number;
  awaiting_lead_count: number;
  profile_viewed_count: number;
  in_progress_lead_count: number;
  profile_verified_count: number;
}

// Legacy alias for backward compatibility during transition
export type TeamMember = WorkspaceMember;

export interface WorkspaceStatsResponse {
  data: WorkspaceMember[];
  page: number;
  limit: number;
  total: number;
}

export interface WorkspaceStatsTotalsResponse {
  total_invites_sent: number;
  total_leads_connected: number;
  total_messages_sent: number;
  total_messages_received: number;
  total_inmails_sent: number;
}

export interface WorkspaceStatsFilters {
  page?: number;
  limit?: number;
  orderBy?: string;
  sortType?: "asc" | "desc";
  teamFilter?: string;
  statusFilter?: string;
  campaignFilter?: string;
  searchTerm?: string;
  dateRange?: string;
  customDateFrom?: string;
  customDateTo?: string;
}

export interface WorkspaceStatsData {
  members: WorkspaceMember[];
  totalMembers: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<WorkspaceStatsFilters>) => void;
  updateDateFilters: (filters: Partial<WorkspaceStatsFilters>) => void;
  updateNonDateFilters: (
    filters: Partial<WorkspaceStatsFilters>,
    options?: { refreshTotals?: boolean }
  ) => void;
  filters: WorkspaceStatsFilters;
  overallTotals: {
    totalInvites: number;
    totalConnected: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    totalInmailSent: number;
  };
  totalsLoading: boolean;
  totalsError: string | null;
}

const DEFAULT_TOTALS = {
  totalInvites: 0,
  totalConnected: 0,
  totalMessagesSent: 0,
  totalMessagesReceived: 0,
  totalInmailSent: 0,
};

type FilterAction = "initial" | "filters" | "pagination";

export const useWorkspaceStats = (
  initialFilters?: Partial<WorkspaceStatsFilters>
): WorkspaceStatsData => {
  const [filters, setFilters] = useState<WorkspaceStatsFilters>({
    page: 1,
    limit: 10,
    orderBy: "workspace_id",
    sortType: "asc",
    teamFilter: undefined,
    statusFilter: undefined,
    campaignFilter: undefined,
    searchTerm: "",
    dateRange: "All",
    customDateFrom: undefined,
    customDateTo: undefined,
    ...initialFilters,
  });

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overallTotals, setOverallTotals] = useState(DEFAULT_TOTALS);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [totalsError, setTotalsError] = useState<string | null>(null);

  const filtersRef = useRef(filters);
  const lastActionRef = useRef<FilterAction>("initial");
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const timeZone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }, []);

  const normalizeStatusValue = (value?: string) => {
    if (!value) return undefined;
    return value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  const normalizeWorkspaceMember = (member: any): WorkspaceMember => {
    return {
      ...member,
      workspace_id: member.workspace_id || member.team_id,
      workspace_name: member.workspace_name || member.team_name,
    };
  };

  const buildQueryParams = useCallback(
    (targetFilters: WorkspaceStatsFilters) => {
      const params = new URLSearchParams();

      const page = targetFilters.page ?? 1;
      const limit = targetFilters.limit ?? 10;

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (targetFilters.orderBy) {
        params.set("order_by", targetFilters.orderBy);
      }
      if (targetFilters.sortType) {
        params.set("sort_type", targetFilters.sortType);
      }

      const trimmedSearch = targetFilters.searchTerm?.trim();
      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      if (
        targetFilters.teamFilter &&
        targetFilters.teamFilter !== "All Teams"
      ) {
        params.set("workspace_id", targetFilters.teamFilter);
      }

      if (
        targetFilters.statusFilter &&
        targetFilters.statusFilter !== "All Status"
      ) {
        const statusValue = normalizeStatusValue(targetFilters.statusFilter);
        if (statusValue) {
          params.set("status", statusValue);
        }
      }

      if (
        targetFilters.campaignFilter &&
        targetFilters.campaignFilter !== "All Campaigns"
      ) {
        const campaignValue = normalizeStatusValue(
          targetFilters.campaignFilter
        );
        if (campaignValue) {
          params.set("campaign_status", campaignValue);
        }
      }

      const timeFilterMap: Record<string, string> = {
        Today: "today",
        Yesterday: "yesterday",
        "This week": "this_week",
        "This month": "this_month",
        "This year": "this_year",
      };

      if (targetFilters.dateRange && targetFilters.dateRange !== "All") {
        if (
          targetFilters.dateRange === "Custom" &&
          targetFilters.customDateFrom &&
          targetFilters.customDateTo
        ) {
          const fromDate = new Date(targetFilters.customDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(targetFilters.customDateTo);
          toDate.setHours(23, 59, 59, 999);

          params.set("from_date", fromDate.toISOString());
          params.set("to_date", toDate.toISOString());
          params.set("time_zone", timeZone);
        } else {
          const mapped =
            timeFilterMap[targetFilters.dateRange] ||
            normalizeStatusValue(targetFilters.dateRange);
          if (mapped) {
            params.set("time_filter", mapped);
          }
          params.set("time_zone", timeZone);
        }
      }

      return params.toString();
    },
    [timeZone]
  );

  const fetchWorkspaceStats = useCallback(
    async (options?: {
      useInitial?: boolean;
      overrides?: Partial<WorkspaceStatsFilters>;
    }) => {
      const targetFilters = {
        ...filtersRef.current,
        ...options?.overrides,
      };

      const query = buildQueryParams(targetFilters);

      const endpoint = options?.useInitial
        ? "/api/analytics/workspace-stats/getInitial"
        : "/api/analytics/workspace-stats/getList";

      try {
        if (!options?.useInitial) {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(`${endpoint}${query ? `?${query}` : ""}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load workspace statistics (${response.status})`
          );
        }

        const responseData: WorkspaceStatsResponse = await response.json();
        const membersData = Array.isArray(responseData.data)
          ? responseData.data.map(normalizeWorkspaceMember)
          : [];

        const nextTotalMembers =
          typeof responseData.total === "number"
            ? responseData.total
            : membersData.length;
        const nextPage =
          typeof responseData.page === "number"
            ? responseData.page
            : (targetFilters.page ?? 1);
        const limit = targetFilters.limit ?? 10;
        const computedTotalPages = Math.max(
          1,
          Math.ceil(nextTotalMembers / limit)
        );

        setMembers(membersData);
        setTotalMembers(nextTotalMembers);
        setCurrentPage(nextPage);
        setTotalPages(computedTotalPages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch workspace statistics"
        );
        setMembers([]);
        setTotalMembers(0);
        setCurrentPage(1);
        setTotalPages(1);
      } finally {
        if (!options?.useInitial) {
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [buildQueryParams]
  );

  const fetchTotals = useCallback(
    async (overrides?: Partial<WorkspaceStatsFilters>) => {
      const targetFilters = {
        ...filtersRef.current,
        ...overrides,
      };

      const query = buildQueryParams(targetFilters);

      try {
        setTotalsLoading(true);
        setTotalsError(null);

        const response = await fetch(
          `/api/analytics/workspace-stats/getTotals${query ? `?${query}` : ""}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load totals (${response.status})`);
        }

        const data: WorkspaceStatsTotalsResponse = await response.json();

        setOverallTotals({
          totalInvites: Number(data.total_invites_sent) || 0,
          totalConnected: Number(data.total_leads_connected) || 0,
          totalMessagesSent: Number(data.total_messages_sent) || 0,
          totalMessagesReceived: Number(data.total_messages_received) || 0,
          totalInmailSent: Number(data.total_inmails_sent) || 0,
        });
      } catch (err) {
        setTotalsError(
          err instanceof Error ? err.message : "Failed to load totals"
        );
        setOverallTotals(DEFAULT_TOTALS);
      } finally {
        setTotalsLoading(false);
      }
    },
    [buildQueryParams]
  );

  const applyFilterUpdate = useCallback(
    (
      newFilters: Partial<WorkspaceStatsFilters>,
      action: FilterAction = "filters"
    ) => {
      lastActionRef.current = action;
      setFilters(prev => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const updateFiltersHandler = useCallback(
    (newFilters: Partial<WorkspaceStatsFilters>) => {
      applyFilterUpdate(newFilters, "filters");
    },
    [applyFilterUpdate]
  );

  const updateDateFilters = useCallback(
    (newFilters: Partial<WorkspaceStatsFilters>) => {
      applyFilterUpdate(
        {
          page: 1,
          ...newFilters,
        },
        "filters"
      );
    },
    [applyFilterUpdate]
  );

  const updateNonDateFilters = useCallback(
    (
      newFilters: Partial<WorkspaceStatsFilters>,
      options?: { refreshTotals?: boolean }
    ) => {
      const action =
        options?.refreshTotals === false ? "pagination" : "filters";
      applyFilterUpdate(newFilters, action);
    },
    [applyFilterUpdate]
  );

  const refetch = useCallback(async () => {
    await Promise.all([fetchWorkspaceStats(), fetchTotals()]);
  }, [fetchWorkspaceStats, fetchTotals]);

  useEffect(() => {
    if (!isInitialLoadRef.current) return;

    isInitialLoadRef.current = false;
    lastActionRef.current = "initial";

    const initialPage = filtersRef.current.page ?? 1;
    const initialLimit = filtersRef.current.limit ?? 10;

    Promise.all([
      fetchWorkspaceStats({
        useInitial: true,
        overrides: { page: initialPage, limit: initialLimit },
      }),
      fetchTotals(),
    ]).then(() => {
      lastActionRef.current = "filters";
    });
  }, [fetchWorkspaceStats, fetchTotals]);

  useEffect(() => {
    if (isInitialLoadRef.current) return;

    if (lastActionRef.current === "pagination") {
      fetchWorkspaceStats();
    } else {
      Promise.all([fetchWorkspaceStats(), fetchTotals()]);
    }
  }, [filters, fetchWorkspaceStats, fetchTotals]);

  return {
    members,
    totalMembers,
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
    updateFilters: updateFiltersHandler,
    updateDateFilters,
    updateNonDateFilters,
    filters,
    overallTotals,
    totalsLoading,
    totalsError,
  };
};

// Legacy alias for backward compatibility during transition
export const useTeamStats = useWorkspaceStats;
