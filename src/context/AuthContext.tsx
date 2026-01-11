"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
// import { syncCRMUser } from "@/lib/crm";
import { formatDate } from "@/lib/helper";
import { AuthService } from "@/lib/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_impersonate?: boolean;
  user_id?: string;
  joined_at?: string;
  is_onboarded?: string;
  onboarding_date?: string;
  current_onboarding_step?: any;
  checkout_url?: string;
  username?: string;
  imageUrl?: string | null;
  organization_id?: string;
  workspace_id?: string | null;
  organization_role?: string;
  organization_permissions?: string[];
  workspace_permissions?: string[];
}
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PlanType {
  end_date?: string;
  on_trial?: boolean;
  plan_id?: string;
  plan_code?: string;
  name?: string;
  payment_status?: string;
  start_date?: string;
  interval?: string;
  quantity?: number;
  type?: string;
  is_active?: boolean;
  is_canceled?: boolean;
  is_disabled?: boolean;
  has_previous_subscription?: boolean;
  is_trial?: boolean;
  is_on_grace_period?: boolean;
  is_conflict_resolved?: boolean;
  is_team_subscription?: boolean;
  trial_used?: boolean;
  trial_conflict?: boolean;
  grace_period?: any;
  is_eligible_for_grace?: boolean;
  seat_count?: number;
  plan_duration_type?: string;
  owner_tenant_id?: string;
  user_tenant_id?: string;
  is_selected?: boolean;
  team?: any;
  card_used_before?: boolean;
}

interface TeamPermissionType {
  id: string;
  name: string;
  description?: string;
}
interface SwitchableAccountType {
  name: string;
  user_id: string;
  organization_id: string;
  workspace_id: string | null;
  workspace_name: string;
}

interface JoinWorkspaceType {
  invitation_token: string;
  workspace_id: string;
}

// Legacy alias for backward compatibility
type JoinTeamType = JoinWorkspaceType;

interface ErrCallbackType {
  (error: any): void;
}

interface LoginParams {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  promo_code?: string;
}

interface EmailVerificationParams {
  email: string;
  verification_code: string;
}

interface SwitchWorkspaceRequest {
  workspace_id: string;
}
interface SwitchableAccount {
  name: string;
  user_id: string;
  organization_id: string;
  workspace_id: string | null;
  workspace_name: string;
}

interface OrganizationType {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: string;
  joined_at: string;
}
interface AuthContextType extends AuthState {
  permissions: TeamPermissionType[];
  switchableAccounts: SwitchableAccountType[];
  organizations: OrganizationType[];
  subscription: PlanType | null;
  login: (
    params: LoginParams,
    errorCallback?: ErrCallbackType
  ) => Promise<void>;
  register: (
    params: RegisterParams,
    errorCallback?: ErrCallbackType
  ) => Promise<void>;
  verifyEmail: (
    params: EmailVerificationParams,
    errorCallback?: ErrCallbackType
  ) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  switchOrganization: (
    organizationId: string
  ) => Promise<{ needsWorkspaceCreation: boolean }>;
  getAllSwitchableAccounts: () => Promise<void>;
  getAllOrganizations: () => Promise<void>;
  getPermissions: (workspaceId?: string) => Promise<void>;
  joinWorkspace: (
    params: JoinWorkspaceType,
    errorCallback?: ErrCallbackType
  ) => Promise<void>;
  /** @deprecated Use joinWorkspace instead */
  joinTeam: (
    params: JoinTeamType,
    errorCallback?: ErrCallbackType
  ) => Promise<void>;
  getSubscription: () => Promise<void>;
  setSubscription: (subscription: PlanType | null) => void;
  updateUser: <K extends keyof User>(field: K, value: User[K]) => void;
  bypassPage: () => Promise<void>;
  startTrial: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Validates checkout_url to prevent malicious redirects
 * Only allows internal application URLs and known payment gateway URLs
 */
const validateCheckoutUrl = (url: string): boolean => {
  try {
    if (url.startsWith("/")) {
      return true;
    }

    const parsedUrl = new URL(url);

    if (
      typeof window !== "undefined" &&
      parsedUrl.origin === window.location.origin
    ) {
      return true;
    }

    const allowedDomains = ["checkout.stripe.com", "stripe.com"];

    const isAllowedDomain = allowedDomains.some(
      domain =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (isAllowedDomain) {
      return true;
    }

    console.warn(
      "[AuthContext] Untrusted checkout URL domain:",
      parsedUrl.hostname
    );
    return false;
  } catch (error) {
    console.error("[AuthContext] Invalid checkout URL:", error);
    return false;
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [permissions, setPermissions] = useState<TeamPermissionType[]>([]);
  const [switchableAccounts, setSwitchableAccounts] = useState<
    SwitchableAccountType[]
  >([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [subscription, setSubscription] = useState<PlanType | null>(null);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const setUser = useCallback((user: User | null) => {
    setAuthState(prev => ({ ...prev, user }));
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("user_data", JSON.stringify(user));
      } else {
        localStorage.removeItem("user_data");
      }
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setAuthState(prev => ({ ...prev, error }));
  }, []);

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/getProfile", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data?.profile;
        if (profile) {
          setAuthState(prev => {
            const prevUser = prev.user;
            const integrationImage =
              data?.integrationStatus?.integration?.proPicurl ??
              data?.integrationStatus?.integration?.profileUrl ??
              null;
            const normalizedUser: User = {
              id:
                profile.id ||
                profile.user_id ||
                prevUser?.id ||
                profile.email ||
                "",
              user_id: profile.user_id || profile.id || prevUser?.user_id || "",
              username:
                profile.username || profile.email || prevUser?.username || "",
              email: profile.email || prevUser?.email || "",
              role:
                profile.organization_role ||
                profile.role ||
                prevUser?.role ||
                "USER",
              name: profile.name || prevUser?.name || "",
              joined_at: profile.joined_at || prevUser?.joined_at,
              is_onboarded:
                profile.is_onboarded ?? prevUser?.is_onboarded ?? false,
              onboarding_date:
                profile.onboarding_date ?? prevUser?.onboarding_date ?? null,
              current_onboarding_step:
                profile.current_onboarding_step ??
                prevUser?.current_onboarding_step ??
                null,
              is_impersonate:
                profile.is_impersonate ?? prevUser?.is_impersonate ?? false,
              imageUrl:
                profile.imageUrl ??
                integrationImage ??
                prevUser?.imageUrl ??
                null,
              organization_id:
                profile.organization_id ??
                profile.tenant_id ??
                prevUser?.organization_id ??
                null,
              workspace_id:
                profile.workspace_id ??
                profile.team_id ??
                prevUser?.workspace_id ??
                null,
              organization_role:
                profile.organization_role ??
                profile.role ??
                prevUser?.organization_role ??
                null,
              organization_permissions:
                profile.organization_permissions ??
                prevUser?.organization_permissions ??
                [],
              workspace_permissions:
                profile.workspace_permissions ??
                prevUser?.workspace_permissions ??
                [],
            };

            if (typeof window !== "undefined") {
              localStorage.setItem("user_data", JSON.stringify(normalizedUser));
            }

            return {
              ...prev,
              user: normalizedUser,
              isAuthenticated: true,
            };
          });
        }
      }
    } catch (error) {
      console.error("[AuthContext] Failed to prefetch profile:", error);
    }
  }, []);

  const login = async (
    params: LoginParams,
    errorCallback?: ErrCallbackType
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await AuthService.login(
        {
          username: params.email.toLowerCase().trim(),
          password: params.password,
        },
        params.rememberMe ?? false
      );

      if ("error" in result && result.error) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Login failed. Please check your credentials.";

        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        if (errorCallback) {
          errorCallback(result.error);
        }

        throw new Error(errorMessage);
      }

      const loginData = result as any;
      if (!loginData?.success || !loginData?.data) {
        const errorMessage =
          loginData?.message ||
          loginData?.error ||
          "Login failed. Please check your credentials.";

        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        if (errorCallback) {
          errorCallback(errorMessage);
        }

        throw new Error(errorMessage);
      }

      const payload = loginData.data;

      const userData = {
        id: payload.user_id,
        user_id: payload.user_id,
        username: payload.username,
        email: payload.username,
        role: payload.role_id,
        name: payload.name,
        joined_at: formatDate(new Date(payload.joined_at)),
        is_onboarded: payload.is_onboarded,
        onboarding_date: payload.onboarding_date,
        current_onboarding_step: payload.current_onboarding_step,
        imageUrl: payload.image_url ?? payload.imageUrl ?? null,
      };

      AuthService.storeAuthData(payload, params.rememberMe ?? false);
      setUser(userData);
      setAuthState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      await getAllSwitchableAccounts();
      await fetchProfileData();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Network error. Please try again.";

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      if (errorCallback) errorCallback(error);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  };

  const register = async (
    params: RegisterParams,
    errorCallback?: ErrCallbackType
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/auth/signup/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        router.replace({
          pathname: "/verify-otp",
          query: {
            email: params.email,
            ...(router.query.returnUrl
              ? { returnUrl: router.query.returnUrl }
              : {}),
          },
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || "Registration failed",
        }));
        if (errorCallback && data.message.includes("SE-001")) {
          errorCallback(data);
        }
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: "Network error. Please try again.",
      }));
      if (errorCallback) errorCallback(error);
    }
  };

  const verifyEmail = async (
    params: EmailVerificationParams,
    errorCallback?: ErrCallbackType
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const responseData = data.data || {};
        const user_id = responseData.user_id || responseData.id;
        const username = responseData.username || responseData.email;
        const name = responseData.name;
        const role_id = responseData.role_id || responseData.role;
        const joined_at = responseData.joined_at;
        const is_onboarded = responseData.is_onboarded;
        const onboarding_date = responseData.onboarding_date;
        const current_onboarding_step = responseData.current_onboarding_step;
        const checkout_url = responseData.checkout_url;

        if (!user_id || !name) {
          console.error("[AuthContext] Missing required user data");
          throw new Error("Incomplete user data from backend");
        }

        const userData = {
          id: user_id,
          user_id,
          username: username || "",
          email: username || "",
          role: role_id || "USER",
          name,
          joined_at: joined_at ? formatDate(new Date(joined_at)) : "",
          is_onboarded: is_onboarded || false,
          onboarding_date: onboarding_date || null,
          current_onboarding_step: current_onboarding_step || null,
          checkout_url: checkout_url || null,
          imageUrl: responseData.image_url ?? responseData.imageUrl ?? null,
        };
        setUser(userData);
        setAuthState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));

        if (userData.checkout_url) {
          const isValidUrl = validateCheckoutUrl(userData.checkout_url);

          if (isValidUrl) {
            router.replace(userData.checkout_url);
            return;
          }
        }

        await getSubscription();
        await fetchProfileData();
        await handleOnboardingFlow();
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || "OTP verification failed",
        }));
        if (errorCallback) errorCallback(data);
      }
    } catch (error) {
      console.error("[AuthContext] Email verification error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Network error. Please try again.";

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      if (errorCallback) errorCallback(error);
    }
  };

  const resendOtp = async (email: string): Promise<void> => {
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // Always clear local state and redirect regardless of API response
      localStorage.removeItem("user_data");
      setUser(null);
      setSubscription(null);
      setPermissions([]);
      setSwitchableAccounts([]);
      // Use window.location.href for immediate redirect
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    } catch (err) {
      localStorage.removeItem("user_data");
      setUser(null);
      setSubscription(null);
      setPermissions([]);
      setSwitchableAccounts([]);
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getAllSwitchableAccounts = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/workspaces/all-accounts", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const accounts = Array.isArray(data.data) ? data.data : [];
        const transformedAccounts: SwitchableAccountType[] = accounts.map(
          (account: any) => ({
            name: account.name || "Unnamed Member",
            user_id: account.user_id,
            organization_id: account.organization_id || account.tenant_id,
            workspace_id: account.workspace_id || account.team_id,
            workspace_name:
              account.workspace_name ||
              account.team_name ||
              "Current Workspace",
          })
        );
        setSwitchableAccounts(transformedAccounts);
      } else {
        setSwitchableAccounts([]);
      }
    } catch (error) {
      setSwitchableAccounts([]);
    }
  }, []);

  const getAllOrganizations = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/organizations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const orgs = Array.isArray(data.organizations)
          ? data.organizations
          : [];
        setOrganizations(orgs);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      setOrganizations([]);
    }
  }, []);

  const switchWorkspace = async (workspaceId: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/auth/switch-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      const data = await response.json();
      if (response.ok && data.success !== false) {
        await handleUserData(data);
        await Promise.all([getSubscription(), getAllSwitchableAccounts()]);
        router.replace("/sales");
      } else {
        const errorMessage =
          data.message || data.error || "Failed to switch workspace";
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw new Error(errorMessage);
      }
    } catch (error) {
      let errorMessage = "Network error during workspace switch";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  const switchOrganization = async (
    organizationId: string
  ): Promise<{ needsWorkspaceCreation: boolean }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Call switch-organization endpoint which auto-selects first workspace
      const response = await fetch("/api/auth/switch-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organization_id: organizationId }),
      });

      const data = await response.json();
      if (response.ok && data.success !== false) {
        await handleUserData(data);
        await Promise.all([
          getSubscription(),
          getAllSwitchableAccounts(),
          getAllOrganizations(),
        ]);

        // Check if user needs to create a workspace (no workspaces in org)
        const needsWorkspaceCreation =
          !data.workspace_id && data.needs_workspace_creation;

        if (needsWorkspaceCreation) {
          router.replace("/settings/workspaces/create");
          return { needsWorkspaceCreation: true };
        }

        router.replace("/sales");
        return { needsWorkspaceCreation: false };
      } else {
        const errorMessage =
          data.message || data.error || "Failed to switch organization";
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw new Error(errorMessage);
      }
    } catch (error) {
      let errorMessage = "Network error during organization switch";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  const getPermissions = useCallback(
    async (workspaceId?: string): Promise<void> => {
      try {
        const currentWorkspaceId = workspaceId || authState.user?.workspace_id;
        if (!currentWorkspaceId) {
          setPermissions([]);
          return;
        }

        const response = await fetch(
          `/api/workspaces/permissions?workspace_id=${currentWorkspaceId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const userPermissions = Array.isArray(data.permissions)
            ? data.permissions
            : [];
          setPermissions(userPermissions);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        setPermissions([]);
      }
    },
    [authState.user?.workspace_id]
  );

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      getAllSwitchableAccounts();
      getAllOrganizations();
      getPermissions();
    }
  }, [
    authState.isAuthenticated,
    authState.user,
    getAllSwitchableAccounts,
    getAllOrganizations,
    getPermissions,
  ]);

  // Additional methods for enhanced functionality
  const handleUserData = async (responseData: any): Promise<User> => {
    const {
      user_id,
      username,
      name,
      role_id,
      joined_at,
      is_onboarded,
      onboarding_date,
      current_onboarding_step,
      is_impersonate,
      team_id,
      tenant_id,
      organization_id,
      workspace_id,
      organization_role,
      organization_permissions,
      workspace_permissions,
    } = responseData;
    const userData: User = {
      id: user_id,
      user_id,
      username,
      email: username,
      role: organization_role || role_id,
      name,
      joined_at: formatDate(new Date(joined_at)),
      is_onboarded,
      onboarding_date,
      current_onboarding_step,
      is_impersonate: !!is_impersonate,
      imageUrl: responseData.image_url ?? responseData.imageUrl ?? null,
      organization_id: organization_id || tenant_id,
      workspace_id: workspace_id || team_id,
      organization_role: organization_role || role_id,
      organization_permissions: organization_permissions || [],
      workspace_permissions: workspace_permissions || [],
    };
    setUser(userData);
    setAuthState(prev => ({
      ...prev,
      user: userData,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }));

    const workspaceId = userData?.workspace_id;
    if (userData?.is_impersonate && workspaceId) {
      await getPermissions(workspaceId);
    } else if (workspaceId) {
      await getPermissions(workspaceId);
    }
    return userData;
  };

  const joinWorkspace = async (
    params: JoinWorkspaceType,
    errorCallback?: ErrCallbackType
  ): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_token: params.invitation_token,
          workspace_id: params.workspace_id,
        }),
      });
      if (response.ok) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        router.replace(!authState.user ? "/auth" : "/sales");
      } else {
        const data = await response.json();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data?.message || "Failed to join workspace",
        }));
        if (errorCallback) errorCallback(data);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: "Network error. Please try again.",
      }));
      if (errorCallback) errorCallback(error);
    }
  };

  /** @deprecated Use joinWorkspace instead */
  const joinTeam = async (
    params: JoinTeamType,
    errorCallback?: ErrCallbackType
  ): Promise<void> => {
    // Delegate to joinWorkspace for backward compatibility
    return joinWorkspace(
      {
        invitation_token: params.invitation_token,
        workspace_id: params.workspace_id,
      },
      errorCallback
    );
  };

  const getSubscription = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch("/api/subscription/getsubscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("[AuthContext] getSubscription error:", error);
      setSubscription(null);
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { AuthService } = await import("@/lib/auth");
        const isValidAuth = await AuthService.validateAuthState();
        if (isValidAuth) {
          const userData = AuthService.getUserData();
          if (userData) {
            setAuthState({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            await getSubscription();
            await getAllSwitchableAccounts();
            await fetchProfileData();
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to initialize authentication",
        }));
      }
    };
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfileData]);

  const updateUser = <K extends keyof User>(field: K, value: User[K]): void => {
    if (authState.user) {
      const updatedUser: User = {
        ...authState.user,
        [field]: value,
      };
      setUser(updatedUser);
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
    }
  };

  const bypassPage = async (): Promise<void> => {
    if (!router.isReady) return;

    try {
      const response = await fetch("/api/subscription/getsubscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        router.replace("/onboarding/choose-plan");
        return;
      }

      const data = await response.json();

      if (!data?.subscription) {
        router.replace("/onboarding/choose-plan");
        return;
      }

      if (needsSubscriptionSetup(data.subscription)) {
        router.replace("/onboarding/choose-plan");
        return;
      }

      if (isTrialAbuseAttempt(data.subscription)) {
        router.replace("/onboarding/warning");
        return;
      }

      if (authState.user?.current_onboarding_step === "INTEGRATION") {
        router.replace({
          pathname: "/sales",
          query: {
            ...(router.query.returnUrl
              ? { returnUrl: router.query.returnUrl }
              : {}),
          },
        });
        return;
      }

      const returnUrl = authState.user
        ? (router.query.returnUrl ?? "/sales")
        : "/auth";

      router.replace(returnUrl as string);
    } catch (error) {
      console.error("[AuthContext] bypassPage error:", error);
      router.replace("/onboarding/choose-plan");
    }
  };

  const startTrial = async (): Promise<void> => {
    try {
      const response = await fetch("/api/subscription/check-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.trialUsed) {
          router.replace("/onboarding/warning");
        } else {
          router.replace("/sales");
        }
      } else {
        throw new Error("Failed to check trial status");
      }
    } catch (error) {
      throw error;
    }
  };

  const hasActiveSubscription = (sub: PlanType): boolean => {
    return !!(sub.is_active && sub.is_selected);
  };

  const needsSubscriptionSetup = (sub: PlanType | null): boolean => {
    if (!sub) return true;
    return !!(
      !sub.is_active &&
      !sub.has_previous_subscription &&
      !sub.is_on_grace_period
    );
  };

  const isTrialAbuseAttempt = (sub: PlanType): boolean => {
    return !!sub.card_used_before;
  };

  const handleOnboardingFlow = async (): Promise<void> => {
    if (!subscription) {
      router.replace("/onboarding/choose-plan");
      return;
    }

    if (needsSubscriptionSetup(subscription)) {
      router.replace("/onboarding/choose-plan");
      return;
    }

    if (isTrialAbuseAttempt(subscription)) {
      router.replace("/onboarding/warning");
      return;
    }

    if (hasActiveSubscription(subscription)) {
      router.replace("/sales");
      return;
    }

    console.warn("[AuthContext] Unexpected subscription state:", {
      is_active: subscription.is_active,
      is_selected: subscription.is_selected,
      has_previous_subscription: subscription.has_previous_subscription,
      is_on_grace_period: subscription.is_on_grace_period,
    });
    router.replace("/onboarding/choose-plan");
  };

  useEffect(() => {
    if (authState.user?.workspace_id) {
      getPermissions(authState.user.workspace_id);
    } else {
      setPermissions([]);
    }
  }, [authState.user?.workspace_id, getPermissions]);

  useEffect(() => {
    if (authState.user && authState.isAuthenticated) {
      if (authState.user.workspace_id) {
        getPermissions(authState.user.workspace_id);
      }
    }
  }, [authState.user, authState.isAuthenticated, getPermissions]);

  const value: AuthContextType = {
    ...authState,
    permissions,
    switchableAccounts,
    organizations,
    subscription,
    login,
    register,
    verifyEmail,
    resendOtp,
    logout,
    clearError,
    setUser,
    setLoading,
    setError,
    switchWorkspace,
    switchOrganization,
    getAllSwitchableAccounts,
    getAllOrganizations,
    getPermissions,
    joinWorkspace,
    joinTeam,
    getSubscription,
    setSubscription,
    updateUser,
    bypassPage,
    startTrial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
