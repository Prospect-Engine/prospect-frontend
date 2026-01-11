import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Workspace allocation data structure
 */
export interface WorkspaceAllocation {
  id: string;
  subscriptionId: string;
  workspaceId: string;
  workspaceName: string;
  allocatedSeats: number;
  usedSeats: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * User allocation data structure
 */
export interface UserAllocation {
  id: string;
  workspaceAllocationId: string;
  userId: string;
  userName: string;
  allocatedSeats: number;
  usedSeats: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create workspace allocation input
 */
export interface CreateWorkspaceAllocationInput {
  workspaceId: string;
  allocatedSeats: number;
}

/**
 * Update workspace allocation input
 */
export interface UpdateWorkspaceAllocationInput {
  allocatedSeats: number;
}

/**
 * Create user allocation input
 */
export interface CreateUserAllocationInput {
  workspaceId: string;
  userId: string;
  allocatedSeats: number;
}

/**
 * Update user allocation input
 */
export interface UpdateUserAllocationInput {
  allocatedSeats: number;
}

interface UseSeatAllocationsReturn {
  // Workspace allocations
  workspaceAllocations: WorkspaceAllocation[];
  workspaceAllocationsLoading: boolean;
  workspaceAllocationsError: string | null;

  // User allocations
  userAllocations: UserAllocation[];
  userAllocationsLoading: boolean;
  userAllocationsError: string | null;

  // Workspace allocation operations
  fetchWorkspaceAllocations: () => Promise<void>;
  createWorkspaceAllocation: (
    input: CreateWorkspaceAllocationInput
  ) => Promise<WorkspaceAllocation | null>;
  updateWorkspaceAllocation: (
    allocationId: string,
    input: UpdateWorkspaceAllocationInput
  ) => Promise<WorkspaceAllocation | null>;
  deleteWorkspaceAllocation: (allocationId: string) => Promise<boolean>;

  // User allocation operations
  fetchUserAllocations: (workspaceId: string) => Promise<void>;
  createUserAllocation: (
    input: CreateUserAllocationInput
  ) => Promise<UserAllocation | null>;
  updateUserAllocation: (
    allocationId: string,
    input: UpdateUserAllocationInput
  ) => Promise<UserAllocation | null>;
  deleteUserAllocation: (allocationId: string) => Promise<boolean>;

  // Mutation state
  isMutating: boolean;
  mutationError: string | null;
  clearMutationError: () => void;
}

/**
 * Hook for managing seat allocations (workspace and user level)
 *
 * Provides CRUD operations for the 4-tier hierarchy:
 * Organization → Workspace → User → Integration
 *
 * @example
 * ```tsx
 * const {
 *   workspaceAllocations,
 *   userAllocations,
 *   fetchWorkspaceAllocations,
 *   createWorkspaceAllocation,
 *   updateWorkspaceAllocation,
 *   deleteWorkspaceAllocation,
 *   fetchUserAllocations,
 *   createUserAllocation,
 *   updateUserAllocation,
 *   deleteUserAllocation,
 *   isMutating,
 * } = useSeatAllocations();
 *
 * // Fetch all workspace allocations
 * useEffect(() => {
 *   fetchWorkspaceAllocations();
 * }, []);
 *
 * // Create a new workspace allocation
 * const handleCreate = async () => {
 *   const result = await createWorkspaceAllocation({
 *     workspaceId: "workspace-123",
 *     allocatedSeats: 10,
 *   });
 *   if (result) {
 *     console.log("Created:", result);
 *   }
 * };
 * ```
 */
export const useSeatAllocations = (): UseSeatAllocationsReturn => {
  const { isAuthenticated } = useAuth();

  // Workspace allocations state
  const [workspaceAllocations, setWorkspaceAllocations] = useState<
    WorkspaceAllocation[]
  >([]);
  const [workspaceAllocationsLoading, setWorkspaceAllocationsLoading] =
    useState(false);
  const [workspaceAllocationsError, setWorkspaceAllocationsError] = useState<
    string | null
  >(null);

  // User allocations state
  const [userAllocations, setUserAllocations] = useState<UserAllocation[]>([]);
  const [userAllocationsLoading, setUserAllocationsLoading] = useState(false);
  const [userAllocationsError, setUserAllocationsError] = useState<
    string | null
  >(null);

  // Mutation state
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  // ========================================
  // Workspace Allocation Operations
  // ========================================

  /**
   * Fetch all workspace allocations for the organization
   */
  const fetchWorkspaceAllocations = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaceAllocations([]);
      return;
    }

    setWorkspaceAllocationsLoading(true);
    setWorkspaceAllocationsError(null);

    try {
      const response = await fetch("/api/billing/seatAllocations/workspaces", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaceAllocations(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setWorkspaceAllocationsError(
          errorData.message || "Failed to fetch workspace allocations"
        );
        setWorkspaceAllocations([]);
      }
    } catch (err) {
      console.error(
        "[useSeatAllocations] Fetch workspace allocations error:",
        err
      );
      setWorkspaceAllocationsError("Failed to fetch workspace allocations");
      setWorkspaceAllocations([]);
    } finally {
      setWorkspaceAllocationsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Create a new workspace allocation
   */
  const createWorkspaceAllocation = useCallback(
    async (
      input: CreateWorkspaceAllocationInput
    ): Promise<WorkspaceAllocation | null> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return null;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch(
          "/api/billing/seatAllocations/workspaces",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(input),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Optimistically add to the list
          setWorkspaceAllocations(prev => [...prev, data]);
          return data;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to create workspace allocation"
          );
          return null;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Create workspace allocation error:",
          err
        );
        setMutationError("Failed to create workspace allocation");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Update an existing workspace allocation
   */
  const updateWorkspaceAllocation = useCallback(
    async (
      allocationId: string,
      input: UpdateWorkspaceAllocationInput
    ): Promise<WorkspaceAllocation | null> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return null;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch(
          `/api/billing/seatAllocations/workspaces/${allocationId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(input),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Optimistically update in the list
          setWorkspaceAllocations(prev =>
            prev.map(allocation =>
              allocation.id === allocationId ? data : allocation
            )
          );
          return data;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to update workspace allocation"
          );
          return null;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Update workspace allocation error:",
          err
        );
        setMutationError("Failed to update workspace allocation");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Delete a workspace allocation
   */
  const deleteWorkspaceAllocation = useCallback(
    async (allocationId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return false;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch(
          `/api/billing/seatAllocations/workspaces/${allocationId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          // Optimistically remove from the list
          setWorkspaceAllocations(prev =>
            prev.filter(allocation => allocation.id !== allocationId)
          );
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to delete workspace allocation"
          );
          return false;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Delete workspace allocation error:",
          err
        );
        setMutationError("Failed to delete workspace allocation");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  // ========================================
  // User Allocation Operations
  // ========================================

  /**
   * Fetch user allocations for a specific workspace
   */
  const fetchUserAllocations = useCallback(
    async (workspaceId: string) => {
      if (!isAuthenticated) {
        setUserAllocations([]);
        return;
      }

      setUserAllocationsLoading(true);
      setUserAllocationsError(null);

      try {
        const response = await fetch(
          `/api/billing/seatAllocations/users?workspaceId=${workspaceId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserAllocations(Array.isArray(data) ? data : []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setUserAllocationsError(
            errorData.message || "Failed to fetch user allocations"
          );
          setUserAllocations([]);
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Fetch user allocations error:",
          err
        );
        setUserAllocationsError("Failed to fetch user allocations");
        setUserAllocations([]);
      } finally {
        setUserAllocationsLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Create a new user allocation
   */
  const createUserAllocation = useCallback(
    async (
      input: CreateUserAllocationInput
    ): Promise<UserAllocation | null> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return null;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch("/api/billing/seatAllocations/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (response.ok) {
          const data = await response.json();
          // Optimistically add to the list
          setUserAllocations(prev => [...prev, data]);
          return data;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to create user allocation"
          );
          return null;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Create user allocation error:",
          err
        );
        setMutationError("Failed to create user allocation");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Update an existing user allocation
   */
  const updateUserAllocation = useCallback(
    async (
      allocationId: string,
      input: UpdateUserAllocationInput
    ): Promise<UserAllocation | null> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return null;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch(
          `/api/billing/seatAllocations/users/${allocationId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(input),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Optimistically update in the list
          setUserAllocations(prev =>
            prev.map(allocation =>
              allocation.id === allocationId ? data : allocation
            )
          );
          return data;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to update user allocation"
          );
          return null;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Update user allocation error:",
          err
        );
        setMutationError("Failed to update user allocation");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Delete a user allocation
   */
  const deleteUserAllocation = useCallback(
    async (allocationId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        setMutationError("Not authenticated");
        return false;
      }

      setIsMutating(true);
      setMutationError(null);

      try {
        const response = await fetch(
          `/api/billing/seatAllocations/users/${allocationId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          // Optimistically remove from the list
          setUserAllocations(prev =>
            prev.filter(allocation => allocation.id !== allocationId)
          );
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMutationError(
            errorData.message || "Failed to delete user allocation"
          );
          return false;
        }
      } catch (err) {
        console.error(
          "[useSeatAllocations] Delete user allocation error:",
          err
        );
        setMutationError("Failed to delete user allocation");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated]
  );

  return {
    // Workspace allocations
    workspaceAllocations,
    workspaceAllocationsLoading,
    workspaceAllocationsError,

    // User allocations
    userAllocations,
    userAllocationsLoading,
    userAllocationsError,

    // Workspace allocation operations
    fetchWorkspaceAllocations,
    createWorkspaceAllocation,
    updateWorkspaceAllocation,
    deleteWorkspaceAllocation,

    // User allocation operations
    fetchUserAllocations,
    createUserAllocation,
    updateUserAllocation,
    deleteUserAllocation,

    // Mutation state
    isMutating,
    mutationError,
    clearMutationError,
  };
};

export default useSeatAllocations;
