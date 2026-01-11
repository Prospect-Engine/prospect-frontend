import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface UsePermissionsReturn {
  permissions: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isImpersonated: boolean;
  canAccessFeature: (feature: string) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImpersonated = !!user?.is_impersonate && !!user.workspace_id;

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentWorkspaceId = user?.workspace_id;

        if (!currentWorkspaceId) {
          setPermissions([]);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/workspaces/permissions?workspace_id=${currentWorkspaceId}`,
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

          // Handle different response formats
          // Combine workspace and organization permissions
          let userPermissions: string[] = [];

          // Add workspace permissions if present
          if (
            Array.isArray(data.workspace_permissions) &&
            data.workspace_permissions.length > 0
          ) {
            userPermissions = [
              ...userPermissions,
              ...data.workspace_permissions,
            ];
          }

          // Add organization permissions if present
          if (
            Array.isArray(data.organization_permissions) &&
            data.organization_permissions.length > 0
          ) {
            userPermissions = [
              ...userPermissions,
              ...data.organization_permissions,
            ];
          }

          // Fallback to other formats if no permissions found yet
          if (userPermissions.length === 0) {
            if (
              Array.isArray(data.permissions) &&
              data.permissions.length > 0
            ) {
              userPermissions = data.permissions;
            } else if (Array.isArray(data.data) && data.data.length > 0) {
              userPermissions = data.data;
            } else if (Array.isArray(data) && data.length > 0) {
              userPermissions = data;
            }
          }

          // Remove duplicates
          userPermissions = [...new Set(userPermissions)];

          setPermissions(userPermissions);
        } else {
          setError("Failed to fetch permissions");
          setPermissions([]);
        }
      } catch (err) {
        setError("Error fetching permissions");
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user?.user_id, user?.workspace_id, user?.is_impersonate]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!isImpersonated) return true;

    const featurePermissions: Record<string, string[]> = {
      integrations: ["INTEGRATE_ACCOUNT"],
      connections: ["VIEW_CONNECTIONS"],
      invitations: ["VIEW_INVITATION", "MANAGE_INVITATION"],
      messages: ["VIEW_MESSAGES", "MANAGE_MESSAGES"],
      billing: ["VIEW_BILLING"],
      campaigns: ["MANAGE_CAMPAIGNS"],
      analytics: ["VIEW_ANALYTICS"],
    };

    const requiredPermissions = featurePermissions[feature] || [];
    return hasAnyPermission(requiredPermissions);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isImpersonated,
    canAccessFeature,
  };
};
