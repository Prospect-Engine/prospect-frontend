"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Campaign } from "@/types/campaign";
import { useAuth } from "@/context/AuthContext";

interface ActivityStats {
  activity_type: string;
  count: number;
}

interface Person {
  name: string;
  profile_url: string;
  profile_pic_url: string | null;
  headline: string;
  position: string;
  company: string;
  email: string;
  location: string;
  phone: string;
}

interface Activity {
  id: string;
  leadId: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  description: string;
  createdAt: string;
  person: Person;
}

interface Reply {
  profile_url: string;
  id: string;
  name: string;
  headline: string;
  conversation_url: string;
  campaign: string;
  conversation_urn_id: string;
  sequence_resumed: boolean;
  last_reply: string;
  received_on: string;
}

interface FilterObject {
  time_filter?: string;
  time_zone?: string;
  start_date?: string;
  end_date?: string;
}

interface DashboardData {
  stats: ActivityStats[];
  activities: Activity[];
  replies: Reply[];
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  statsLoading: boolean;
  activitiesLoading: boolean;
  repliesLoading: boolean;
  campaignsLoading: boolean;
}

export const useDashboardData = (filter?: string) => {
  // Get auth context to listen for user changes
  const { user } = useAuth();

  // Use refs to store the actual data to prevent unnecessary re-renders
  const dataRef = useRef<DashboardData>({
    stats: [],
    activities: [],
    replies: [],
    campaigns: [],
    loading: true,
    error: null,
    statsLoading: false,
    activitiesLoading: false,
    repliesLoading: false,
    campaignsLoading: false,
  });

  // Only track loading states and errors in state to minimize re-renders
  const [loadingStates, setLoadingStates] = useState({
    statsLoading: false,
    activitiesLoading: false,
    repliesLoading: false,
    campaignsLoading: false,
    error: null as string | null,
  });

  const [filterObject, setFilterObject] = useState<FilterObject>({
    time_filter: filter || "today",
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Force update function to trigger minimal re-render when data changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Debounce utility
  const debounce = useMemo(
    () =>
      <T extends (...args: any[]) => void>(func: T, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      },
    []
  );

  // Helper function to create validated filter params
  const createFilterParams = useCallback(() => {
    const isValidDate = (dateString: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    const filterParams: Record<string, string> = {
      time_filter: filterObject.time_filter || "today",
      time_zone:
        filterObject.time_zone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Only add dates if they are valid
    if (filterObject.start_date && isValidDate(filterObject.start_date)) {
      filterParams.from_date = filterObject.start_date;
    }
    if (filterObject.end_date && isValidDate(filterObject.end_date)) {
      filterParams.to_date = filterObject.end_date;
    }

    return new URLSearchParams(filterParams).toString();
  }, [filterObject]);

  // Helper function to check if custom filter has valid dates
  const isCustomFilterValid = useCallback(() => {
    if (filterObject.time_filter !== "custom") return true;

    const isValidDate = (dateString: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    return (
      filterObject.start_date &&
      filterObject.end_date &&
      isValidDate(filterObject.start_date) &&
      isValidDate(filterObject.end_date)
    );
  }, [
    filterObject.time_filter,
    filterObject.start_date,
    filterObject.end_date,
  ]);

  // Fetch stats data
  const fetchStats = useCallback(async () => {
    try {
      // Update loading state only
      setLoadingStates(prev => ({ ...prev, statsLoading: true, error: null }));

      // Skip API call if custom filter is selected but doesn't have valid dates
      if (!isCustomFilterValid()) {
        setLoadingStates(prev => ({ ...prev, statsLoading: false }));
        return;
      }

      const filter = createFilterParams();

      const response = await fetch("/api/analytics/activity/getStats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({ filter }),
      });

      if (!response.ok) {
        throw new Error(`Stats API failed: ${response.status}`);
      }

      const statsData = await response.json().catch(() => ({}));

      // Update data in ref without triggering re-render
      dataRef.current.stats = statsData.stats || [];
      dataRef.current.statsLoading = false;

      // Only update loading state, not the data itself
      setLoadingStates(prev => ({ ...prev, statsLoading: false }));

      // Trigger minimal re-render to update UI
      triggerUpdate();
    } catch (error) {
      dataRef.current.statsLoading = false;
      setLoadingStates(prev => ({
        ...prev,
        statsLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch stats",
      }));
    }
  }, [isCustomFilterValid, createFilterParams, triggerUpdate]);

  // Fetch activities data (debounced)
  const fetchActivities = useCallback(
    debounce(async () => {
      try {
        setLoadingStates(prev => ({ ...prev, activitiesLoading: true }));

        // Skip API call if custom filter is selected but doesn't have valid dates
        if (!isCustomFilterValid()) {
          setLoadingStates(prev => ({ ...prev, activitiesLoading: false }));
          return;
        }

        const filter = createFilterParams();

        const response = await fetch("/api/analytics/activity/getList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify({
            page: 1,
            limit: 10,
            filter,
          }),
        });

        if (!response.ok) {
          throw new Error(`Activities API failed: ${response.status}`);
        }

        const activitiesData = await response.json().catch(() => ({}));

        // Update data in ref without triggering re-render
        dataRef.current.activities = activitiesData.activity || [];
        dataRef.current.activitiesLoading = false;

        // Only update loading state
        setLoadingStates(prev => ({ ...prev, activitiesLoading: false }));

        // Trigger minimal re-render to update UI
        triggerUpdate();
      } catch (error) {
        dataRef.current.activitiesLoading = false;
        setLoadingStates(prev => ({
          ...prev,
          activitiesLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch activities",
        }));
      }
    }, 300),
    [filterObject, isCustomFilterValid, createFilterParams, triggerUpdate]
  );

  // Fetch replies data (debounced)
  const fetchReplies = useCallback(
    debounce(async () => {
      try {
        setLoadingStates(prev => ({ ...prev, repliesLoading: true }));

        // Skip API call if custom filter is selected but doesn't have valid dates
        if (!isCustomFilterValid()) {
          setLoadingStates(prev => ({ ...prev, repliesLoading: false }));
          return;
        }

        const filter = createFilterParams();

        const response = await fetch("/api/analytics/activity/getReplyList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify({
            page: 1,
            limit: 10,
            filter,
          }),
        });

        // if (!response.ok) {
        //   throw new Error(`Replies API failed: ${response.status}`);
        // }

        const repliesData = await response.json().catch(() => ({}));

        // Update data in ref without triggering re-render
        dataRef.current.replies = repliesData.replies || [];
        dataRef.current.repliesLoading = false;

        // Only update loading state
        setLoadingStates(prev => ({ ...prev, repliesLoading: false }));

        // Trigger minimal re-render to update UI
        triggerUpdate();
      } catch (error) {
        dataRef.current.repliesLoading = false;
        setLoadingStates(prev => ({
          ...prev,
          repliesLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch replies",
        }));
      }
    }, 300),
    [filterObject, isCustomFilterValid, createFilterParams, triggerUpdate]
  );

  // Fetch campaigns data
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, campaignsLoading: true }));

      const response = await fetch("/api/outreach/campaign/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({
          page: 1,
          limit: 10,
          orderBy: "id",
          sortType: "desc",
          filter: "process_status=PROCESSING",
        }),
      });

      // if (!response.ok) {
      //   throw new Error(`Campaigns API failed: ${response.status}`);
      // }

      const campaignsData = await response
        .json()
        .catch(() => ({ campaigns: [] }));

      // Update data in ref without triggering re-render
      dataRef.current.campaigns = Array.isArray(campaignsData.campaigns)
        ? campaignsData.campaigns
        : [];
      dataRef.current.campaignsLoading = false;

      // Only update loading state
      setLoadingStates(prev => ({ ...prev, campaignsLoading: false }));

      // Trigger minimal re-render to update UI
      triggerUpdate();
    } catch (error) {
      dataRef.current.campaigns = []; // Set empty array on error
      dataRef.current.campaignsLoading = false;
      setLoadingStates(prev => ({
        ...prev,
        campaignsLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch campaigns",
      }));
    }
  }, [triggerUpdate]);

  // Main fetch function that calls all APIs
  const fetchDashboardData = useCallback(async () => {
    dataRef.current.loading = true;
    setLoadingStates(prev => ({ ...prev, error: null }));

    try {
      await Promise.all([
        fetchStats(),
        fetchActivities(),
        fetchReplies(),
        fetchCampaigns(),
      ]);
    } catch (error) {
      setLoadingStates(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
      }));
    } finally {
      dataRef.current.loading = false;
      triggerUpdate();
    }
  }, [
    fetchStats,
    fetchActivities,
    fetchReplies,
    fetchCampaigns,
    triggerUpdate,
  ]);

  // Update filter function
  const updateFilter = useCallback((key: keyof FilterObject, value: string) => {
    setFilterObject(prev => ({ ...prev, [key]: value }));
  }, []);

  // Effect to trigger data fetch when filter changes (only for initial load)
  useEffect(() => {
    // Only fetch on initial mount, not on every filter change
    if (
      dataRef.current.stats.length === 0 &&
      dataRef.current.activities.length === 0 &&
      dataRef.current.replies.length === 0
    ) {
      fetchDashboardData();
    }
  }, []);

  // Effect to handle filter changes with debouncing
  useEffect(() => {
    // Skip if this is the initial load (handled by the effect above)
    if (
      dataRef.current.stats.length === 0 &&
      dataRef.current.activities.length === 0 &&
      dataRef.current.replies.length === 0
    ) {
      return;
    }

    // Debounce filter changes to prevent rapid API calls
    const timeoutId = setTimeout(async () => {
      try {
        // Fetch all data in parallel but update state smoothly
        await Promise.all([
          fetchStats(),
          fetchActivities(),
          fetchReplies(),
          fetchCampaigns(),
        ]);
      } catch (error) {}
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    filterObject.time_filter,
    filterObject.start_date,
    filterObject.end_date,
  ]);

  // Effect to update filter when prop changes
  useEffect(() => {
    if (filter && filter !== filterObject.time_filter) {
      setFilterObject(prev => ({ ...prev, time_filter: filter }));
    }
  }, [filter, filterObject.time_filter]);

  // Effect to refresh data when user changes (account switching)
  useEffect(() => {
    if (user) {
      // Clear existing data and refetch when user changes
      dataRef.current.stats = [];
      dataRef.current.activities = [];
      dataRef.current.replies = [];
      dataRef.current.campaigns = [];

      // Trigger a fresh data fetch
      fetchDashboardData();
    }
  }, [user]);

  // Return the current data from ref combined with loading states
  return {
    stats: dataRef.current.stats,
    activities: dataRef.current.activities,
    replies: dataRef.current.replies,
    campaigns: dataRef.current.campaigns,
    loading: dataRef.current.loading,
    error: loadingStates.error,
    statsLoading: loadingStates.statsLoading,
    activitiesLoading: loadingStates.activitiesLoading,
    repliesLoading: loadingStates.repliesLoading,
    campaignsLoading: loadingStates.campaignsLoading,
    refetch: fetchDashboardData,
    updateFilter,
    filterObject,
  };
};
