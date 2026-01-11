import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  updatedAt?: string;
  avatar?: string | null;
  role?: string;
  is_impersonate?: boolean;
  // Legacy fields
  team_id?: string | null;
  tenant_id?: string;
  // New canonical fields
  workspace_id?: string | null;
  organization_id?: string;
  organization_role?: string;
  organization_permissions?: string[];
  workspace_permissions?: string[];
  user_id?: string;
  joined_at?: string;
  is_onboarded?: string;
  onboarding_date?: string;
  current_onboarding_step?: any;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Normalizes profile data to support both legacy and new canonical field names.
 * Maps new fields to legacy fields for backward compatibility.
 */
const normalizeProfileData = (data: any): UserProfile => {
  return {
    ...data,
    // Map new canonical fields to legacy fields for backward compatibility
    tenant_id: data.tenant_id ?? data.organization_id,
    team_id: data.team_id ?? data.workspace_id,
    role: data.role ?? data.organization_role,
    // Preserve new canonical fields
    organization_id: data.organization_id ?? data.tenant_id,
    workspace_id: data.workspace_id ?? data.team_id,
    organization_role: data.organization_role ?? data.role,
    organization_permissions: data.organization_permissions,
    workspace_permissions: data.workspace_permissions,
  };
};

export const useUserProfile = (): UseUserProfileReturn => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/getProfile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          const integrationImage =
            data?.integrationStatus?.integration?.proPicurl ?? null;

          const normalizedProfile = normalizeProfileData({
            ...data.profile,
            avatar:
              data.profile.imageUrl ??
              integrationImage ??
              authUser?.imageUrl ??
              null,
          });

          setProfile(normalizedProfile);
        } else {
          // Fallback to auth context user data if API fails
          setProfile(
            authUser
              ? normalizeProfileData({
                  id: authUser.id || "",
                  name: authUser.name || "",
                  email: authUser.email || "",
                  role: authUser.role || "",
                  is_impersonate: authUser.is_impersonate,
                  workspace_id: authUser.workspace_id,
                  organization_id: authUser.organization_id,
                  organization_role: authUser.organization_role,
                  organization_permissions: authUser.organization_permissions,
                  workspace_permissions: authUser.workspace_permissions,
                  user_id: authUser.user_id,
                  joined_at: authUser.joined_at,
                  is_onboarded: authUser.is_onboarded,
                  onboarding_date: authUser.onboarding_date,
                  current_onboarding_step: authUser.current_onboarding_step,
                  avatar: authUser.imageUrl ?? null,
                })
              : null
          );
        }
      } else {
        // Fallback to auth context user data if API fails
        setProfile(
          authUser
            ? normalizeProfileData({
                id: authUser.id || "",
                name: authUser.name || "",
                email: authUser.email || "",
                role: authUser.role || "",
                is_impersonate: authUser.is_impersonate,
                workspace_id: authUser.workspace_id,
                organization_id: authUser.organization_id,
                organization_role: authUser.organization_role,
                organization_permissions: authUser.organization_permissions,
                workspace_permissions: authUser.workspace_permissions,
                user_id: authUser.user_id,
                joined_at: authUser.joined_at,
                is_onboarded: authUser.is_onboarded,
                onboarding_date: authUser.onboarding_date,
                current_onboarding_step: authUser.current_onboarding_step,
                avatar: authUser.imageUrl ?? null,
              })
            : null
        );
      }
    } catch (err) {
      setError("Failed to fetch profile data");
      // Fallback to auth context user data
      setProfile(
        authUser
          ? normalizeProfileData({
              id: authUser.id || "",
              name: authUser.name || "",
              email: authUser.email || "",
              role: authUser.role || "",
              is_impersonate: authUser.is_impersonate,
              workspace_id: authUser.workspace_id,
              organization_id: authUser.organization_id,
              organization_role: authUser.organization_role,
              organization_permissions: authUser.organization_permissions,
              workspace_permissions: authUser.workspace_permissions,
              user_id: authUser.user_id,
              joined_at: authUser.joined_at,
              is_onboarded: authUser.is_onboarded,
              onboarding_date: authUser.onboarding_date,
              current_onboarding_step: authUser.current_onboarding_step,
              avatar: authUser.imageUrl ?? null,
            })
          : null
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authUser]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      // Use auth context data immediately for better UX
      setProfile(
        normalizeProfileData({
          id: authUser.id || "",
          name: authUser.name || "",
          email: authUser.email || "",
          role: authUser.role || "",
          is_impersonate: authUser.is_impersonate,
          workspace_id: authUser.workspace_id,
          organization_id: authUser.organization_id,
          organization_role: authUser.organization_role,
          organization_permissions: authUser.organization_permissions,
          workspace_permissions: authUser.workspace_permissions,
          user_id: authUser.user_id,
          joined_at: authUser.joined_at,
          is_onboarded: authUser.is_onboarded,
          onboarding_date: authUser.onboarding_date,
          current_onboarding_step: authUser.current_onboarding_step,
          avatar: authUser.imageUrl ?? null,
        })
      );
      // Then fetch fresh data from API
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, authUser, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
  };
};
