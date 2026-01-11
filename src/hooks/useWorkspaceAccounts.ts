import { useState, useEffect, useCallback } from "react";

// Workspace account data structure based on API response
export interface WorkspaceAccount {
  id: string;
  name: string;
  workspace_name: string;
  user_id?: string;
  organization_id?: string;
  workspace_id?: string;
  organization_role?: string;
  organization_permissions?: string[];
  workspace_permissions?: string[];
  is_impersonate?: boolean;
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

export interface WorkspaceAccountsData {
  workspaces: WorkspaceAccount[];
  organizations: Organization[];
  currentWorkspaceId: string | null;
  currentOrganizationId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAccounts = (): WorkspaceAccountsData => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceAccount[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Build organizations from workspaces data
  const buildOrganizations = useCallback((workspaces: WorkspaceAccount[]) => {
    const organizationMap = new Map<string, Organization>();

    workspaces.forEach(workspace => {
      if (workspace.workspace_name) {
        if (!organizationMap.has(workspace.workspace_name)) {
          organizationMap.set(workspace.workspace_name, {
            id: workspace.workspace_name,
            name: workspace.workspace_name,
            workspace_count: 0,
          });
        }
        const org = organizationMap.get(workspace.workspace_name)!;
        org.workspace_count = (org.workspace_count || 0) + 1;
      }
    });

    const orgs = Array.from(organizationMap.values());
    setOrganizations(orgs);
  }, []);

  // Fetch workspace accounts data
  const fetchWorkspaceAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workspaces/all-accounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Handle 403 and 404 errors gracefully
        if (response.status === 403 || response.status === 404) {
          setWorkspaces([]);
          setOrganizations([]);
          setLoading(false);
          return;
        }
        throw new Error(`Workspaces API failed: ${response.status}`);
      }

      const responseData = await response.json();

      // Validate and sanitize the data
      const workspacesData = Array.isArray(responseData.data)
        ? responseData.data
        : [];

      // Transform workspaces data to match our interface
      const transformedWorkspaces: WorkspaceAccount[] = workspacesData.map(
        (workspace: any) => ({
          id:
            workspace.workspace_id?.toString() ||
            workspace.id?.toString() ||
            "",
          name: workspace.name || "Current Member",
          workspace_name: workspace.workspace_name || "Current Workspace",
          user_id: workspace.user_id,
          organization_id: workspace.organization_id?.toString(),
          workspace_id:
            workspace.workspace_id?.toString() || workspace.id?.toString(),
          organization_role: workspace.organization_role,
          organization_permissions: workspace.organization_permissions,
          workspace_permissions: workspace.workspace_permissions,
          is_impersonate: workspace.is_impersonate || false,
          is_current: workspace.is_current || false,
          is_favorite: workspace.is_favorite || false,
          is_recent: workspace.is_recent || false,
        })
      );

      // Update workspaces state
      setWorkspaces(transformedWorkspaces);

      // Set current workspace if available
      const currentWorkspace =
        transformedWorkspaces.find(ws => ws.is_current) ||
        transformedWorkspaces[0];
      if (currentWorkspace) {
        setCurrentWorkspaceId(currentWorkspace.id);
        setCurrentOrganizationId(currentWorkspace.organization_id || null);
      }

      // Build organizations from workspaces data
      buildOrganizations(transformedWorkspaces);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch workspace accounts"
      );

      // Set empty data on error
      setWorkspaces([]);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [buildOrganizations]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchWorkspaceAccounts();
  }, [fetchWorkspaceAccounts]);

  // Initial data fetch - empty dependency array to run only once on mount
  useEffect(() => {
    fetchWorkspaceAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    workspaces,
    organizations,
    currentWorkspaceId,
    currentOrganizationId,
    loading,
    error,
    refetch,
  };
};
