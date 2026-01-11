"use client";

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { User } from "../../types/sales-types";

interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  plan?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  permissions?: string[];
  members?: unknown[];
  workspaces?: unknown[];
  [key: string]: unknown;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  organizationId: string;
  organizationName: string;
  createdAt?: string;
  members?: unknown[];
  [key: string]: unknown;
}

interface WorkspaceContextType {
  selectedOrganization: Organization | null;
  selectedWorkspace: Workspace | null;
  setSelectedOrganization: (org: Organization | null) => void;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
  organizations: Organization[];
  workspaces: Workspace[];
  getWorkspacesForOrganization: (organizationId: string) => Workspace[];
  isLoading: boolean;
  refreshData: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
}) => {
  const { user, refreshUserData: authRefreshUserData } = useAuth();
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to process user data and update workspace context
  const processUserData = useCallback((userData: User) => {
    //
    //
    //
    //
    //

    const userOrgs = userData.organizations || [];
    const userWorkspaces = userData.workspaces || [];

    // Filter out inactive organizations and workspaces
    const activeOrganizations = userOrgs.filter(org => org.isActive);
    const activeWorkspaces = userWorkspaces.filter(ws => ws.isActive);

    //
    //
    //
    //
    //
    //

    setOrganizations(activeOrganizations);
    setWorkspaces(activeWorkspaces);

    // Try to get stored selections from localStorage
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    const storedWorkspaceId = localStorage.getItem("selectedWorkspaceId");

    //
    //

    // Set default organization (first one or stored one)
    let defaultOrg: Organization | null = null;
    if (
      storedOrgId &&
      activeOrganizations.find(org => org.id === storedOrgId)
    ) {
      defaultOrg =
        activeOrganizations.find(org => org.id === storedOrgId) || null;
    } else if (activeOrganizations.length > 0) {
      defaultOrg = activeOrganizations[0];
    }

    //
    //

    // Set default workspace (first one in selected org or stored one)
    let defaultWorkspace: Workspace | null = null;
    if (defaultOrg) {
      const orgWorkspaces = activeWorkspaces.filter(
        ws => ws.organizationId === defaultOrg!.id
      );

      //
      //

      if (
        storedWorkspaceId &&
        orgWorkspaces.find(ws => ws.id === storedWorkspaceId)
      ) {
        defaultWorkspace =
          orgWorkspaces.find(ws => ws.id === storedWorkspaceId) || null;
      } else if (orgWorkspaces.length > 0) {
        defaultWorkspace = orgWorkspaces[0];
      }
    }

    //
    //

    setSelectedOrganization(defaultOrg as Organization | null);
    setSelectedWorkspace(defaultWorkspace as Workspace | null);
    setIsLoading(false);
  }, []);

  // Initialize workspace selection from user data
  useEffect(() => {
    if (user) {
      processUserData(user);
    } else {
      //
      setIsLoading(false);
    }
  }, [user, processUserData]);

  const handleSetSelectedOrganization = (org: Organization | null) => {
    setSelectedOrganization(org);
    if (org) {
      localStorage.setItem("selectedOrganizationId", org.id);

      // Reset workspace selection to first workspace in the new organization
      const orgWorkspaces = workspaces.filter(
        ws => ws.organizationId === org.id
      );
      const newWorkspace = orgWorkspaces.length > 0 ? orgWorkspaces[0] : null;
      setSelectedWorkspace(newWorkspace);

      if (newWorkspace) {
        localStorage.setItem("selectedWorkspaceId", newWorkspace.id);
      } else {
        localStorage.removeItem("selectedWorkspaceId");
      }
    } else {
      localStorage.removeItem("selectedOrganizationId");
      localStorage.removeItem("selectedWorkspaceId");
    }
  };

  const handleSetSelectedWorkspace = (workspace: Workspace | null) => {
    setSelectedWorkspace(workspace);
    if (workspace) {
      localStorage.setItem("selectedWorkspaceId", workspace.id);
    } else {
      localStorage.removeItem("selectedWorkspaceId");
    }
  };

  const getWorkspacesForOrganization = (
    organizationId: string
  ): Workspace[] => {
    return workspaces.filter(ws => ws.organizationId === organizationId);
  };

  const refreshData = useCallback(() => {
    if (user) {
      processUserData(user);
    }
  }, [user, processUserData]);

  return (
    <WorkspaceContext.Provider
      value={{
        selectedOrganization,
        selectedWorkspace,
        setSelectedOrganization: handleSetSelectedOrganization,
        setSelectedWorkspace: handleSetSelectedWorkspace,
        organizations,
        workspaces,
        getWorkspacesForOrganization,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
