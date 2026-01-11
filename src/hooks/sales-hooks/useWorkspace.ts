"use client";

import { useContext } from "react";
import { WorkspaceContext } from "@/contexts/sales-contexts/WorkspaceContext";

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    // During SSR, return default values
    if (typeof window === "undefined") {
      return {
        selectedOrganization: null,
        selectedWorkspace: null,
        setSelectedOrganization: () => {},
        setSelectedWorkspace: () => {},
        organizations: [],
        workspaces: [],
        getWorkspacesForOrganization: () => [],
        isLoading: true,
        refreshData: () => {},
      };
    }
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
