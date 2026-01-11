import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Organization-level seat statistics
 */
interface OrganizationStats {
  subscriptionId: string;
  totalSeats: number;
  allocatedSeats: number;
  usedSeats: number;
  availableSeats: number;
  utilizationPercentage: number;
}

/**
 * User statistics within a workspace
 */
interface UserStats {
  userId: string;
  userName: string;
  allocatedSeats: number;
  usedSeats: number;
  availableSeats: number;
  utilizationPercentage: number;
}

/**
 * Workspace statistics
 */
interface WorkspaceStats {
  workspaceId: string;
  workspaceName: string;
  allocatedSeats: number;
  usedSeats: number;
  availableSeats: number;
  utilizationPercentage: number;
  users: UserStats[];
}

/**
 * Complete seat statistics response
 */
export interface SeatStatistics {
  organization: OrganizationStats;
  workspaces: WorkspaceStats[];
}

interface UseSeatStatisticsReturn {
  statistics: SeatStatistics | null;
  isLoading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
}

/**
 * Hook for fetching organization seat allocation statistics
 *
 * Provides the 4-tier hierarchy: Organization → Workspace → User → Integration
 *
 * @example
 * ```tsx
 * const { statistics, isLoading, error, refreshStatistics } = useSeatStatistics();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     <h2>Total Seats: {statistics?.organization.totalSeats}</h2>
 *     <p>Used: {statistics?.organization.usedSeats}</p>
 *     <p>Available: {statistics?.organization.availableSeats}</p>
 *   </div>
 * );
 * ```
 */
export const useSeatStatistics = (): UseSeatStatisticsReturn => {
  const { isAuthenticated } = useAuth();
  const [statistics, setStatistics] = useState<SeatStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) {
      setStatistics(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/seatAllocations/statistics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to fetch seat statistics");
        setStatistics(null);
      }
    } catch (err) {
      console.error("[useSeatStatistics] Fetch error:", err);
      setError("Failed to fetch seat statistics");
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshStatistics = async () => {
    await fetchStatistics();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatistics();
    } else {
      setStatistics(null);
    }
  }, [isAuthenticated, fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
  };
};

export default useSeatStatistics;
