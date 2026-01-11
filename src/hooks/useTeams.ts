import { useState, useEffect, useCallback, useRef } from "react";

// Workspace data structure based on API response
export interface Workspace {
  id: string;
  name: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
  is_current?: boolean;
  is_favorite?: boolean;
  is_recent?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  workspace_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspacesData {
  workspaces: Workspace[];
  organizations: Organization[];
  currentWorkspaceId: string | null;
  currentOrganizationId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTeams = (): WorkspacesData => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(null);

  // Use refs to store the actual data to prevent unnecessary re-renders
  const dataRef = useRef<{
    workspaces: Workspace[];
    organizations: Organization[];
  }>({
    workspaces: [],
    organizations: [],
  });

  // Force update function to trigger minimal re-render when data changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Helper function to normalize API response fields
  const normalizeWorkspaceFields = (workspace: any): Workspace => {
    return {
      id: workspace.id?.toString() || "",
      name: workspace.name || "Unnamed Workspace",
      organization_id: workspace.organization_id?.toString(),
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      member_count: workspace.member_count || 0,
      is_current: workspace.is_current || false,
      is_favorite: workspace.is_favorite || false,
      is_recent: workspace.is_recent || false,
    };
  };

  // Fetch workspaces data
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workspaces/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Workspaces API failed: ${response.status}`);
      }

      const responseData = await response.json();

      // Validate and sanitize the data
      // Handle both wrapped { data: [...] } and unwrapped [...] responses
      const workspaces = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData.data)
          ? responseData.data
          : [];

      // Transform workspaces data to match our interface
      const transformedWorkspaces: Workspace[] = workspaces.map(
        normalizeWorkspaceFields
      );

      // Update data in ref without triggering re-render
      dataRef.current = {
        ...dataRef.current,
        workspaces: transformedWorkspaces,
      };

      // Set current workspace if available
      const currentWorkspace = transformedWorkspaces.find(
        workspace => workspace.is_current
      );
      if (currentWorkspace) {
        setCurrentWorkspaceId(currentWorkspace.id);
        setCurrentOrganizationId(currentWorkspace.organization_id || null);
      }

      // Trigger minimal re-render to update UI
      triggerUpdate();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch workspaces"
      );

      // Set empty data on error
      dataRef.current = {
        ...dataRef.current,
        workspaces: [],
      };
    } finally {
      setLoading(false);
    }
  }, [triggerUpdate]);

  // Fetch organizations data (if available)
  const fetchOrganizations = useCallback(async () => {
    try {
      // Create organizations based on workspaces
      const workspaces = dataRef.current.workspaces;
      const organizationMap = new Map<string, Organization>();

      workspaces.forEach(workspace => {
        if (workspace.organization_id) {
          if (!organizationMap.has(workspace.organization_id)) {
            organizationMap.set(workspace.organization_id, {
              id: workspace.organization_id,
              name: `Organization ${workspace.organization_id}`,
              workspace_count: 0,
            });
          }
          const org = organizationMap.get(workspace.organization_id)!;
          org.workspace_count = (org.workspace_count || 0) + 1;
        }
      });

      const organizations = Array.from(organizationMap.values());

      // Update data in ref without triggering re-render
      dataRef.current = {
        ...dataRef.current,
        organizations,
      };

      // Trigger minimal re-render to update UI
      triggerUpdate();
    } catch (error) {}
  }, [triggerUpdate]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Initial data fetch
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Update organizations when workspaces change
  useEffect(() => {
    if (dataRef.current.workspaces.length > 0) {
      fetchOrganizations();
    }
  }, [dataRef.current.workspaces.length, fetchOrganizations]);

  return {
    workspaces: dataRef.current.workspaces,
    organizations: dataRef.current.organizations,
    currentWorkspaceId,
    currentOrganizationId,
    loading,
    error,
    refetch,
  };
};
