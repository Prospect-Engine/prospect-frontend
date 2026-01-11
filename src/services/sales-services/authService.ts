import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ApiResponse,
  User,
} from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    data?: Record<string, unknown>,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}`,
          data: responseData,
        };
      }

      return {
        success: true,
        data: responseData,
        message: responseData.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async signup(data: SignupRequest): Promise<ApiResponse<SignupResponse>> {
    // Create payload object, excluding undefined/empty fields
    const payload: Record<string, unknown> = {
      email: data.email,
      password: data.password,
      name: data.name,
      organizationName: data.organizationName,
      workspaceName: data.workspaceName,
    };

    // Only include phoneNumber if it's provided and not empty
    if (data.phoneNumber && data.phoneNumber.trim()) {
      payload.phoneNumber = data.phoneNumber;
    }

    // Include optional fields if they exist
    if (data.promo_code) payload.promo_code = data.promo_code;
    if (data.on_trial !== undefined) payload.on_trial = data.on_trial;
    if (data.plan_code) payload.plan_code = data.plan_code;

    return toastService.promise(
      this.makeRequest<SignupResponse>("/auth/signup", "POST", payload),
      {
        loading: "Signing up...",
        success: "Signup successful!",
        error: "Failed to sign up",
      }
    );
  }

  async verifyEmail(
    data: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>("/auth/verify-email", "POST", {
        token: data.token,
      }),
      {
        loading: "Verifying email...",
        success: "Email verified!",
        error: "Failed to verify email",
      }
    );
  }

  async resendVerification(
    data: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/resend-verification",
        "POST",
        {
          email: data.email,
        }
      ),
      {
        loading: "Resending verification...",
        success: "Verification email sent!",
        error: "Failed to resend verification",
      }
    );
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return toastService.promise(
      this.makeRequest<LoginResponse>("/auth/login", "POST", {
        email: data.email,
        password: data.password,
      }),
      {
        loading: "Signing in...",
        success: "Signed in successfully!",
        error: "Failed to sign in",
      }
    );
  }

  async tenantLogin(data: {
    tenantId: string;
  }): Promise<ApiResponse<LoginResponse>> {
    // Don't use toast for this as it's a background CRM authentication
    return this.makeRequest<LoginResponse>("/auth/tenant-login", "POST", {
      tenantId: data.tenantId,
    });
  }

  async forgotPassword(
    data: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/forgot-password",
        "POST",
        {
          email: data.email,
        }
      ),
      {
        loading: "Sending reset link...",
        success: "Reset link sent!",
        error: "Failed to send reset link",
      }
    );
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/reset-password",
        "POST",
        {
          token: data.otp,
          newPassword: data.password,
        }
      ),
      {
        loading: "Resetting password...",
        success: "Password reset successfully!",
        error: "Failed to reset password",
      }
    );
  }

  async getProfile(
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.makeRequest<Record<string, unknown>>(
      "/auth/profile",
      "GET",
      undefined,
      token
    );
  }

  async updateProfile(
    data: Record<string, unknown>,
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/profile",
        "PUT",
        data,
        token
      ),
      {
        loading: "Updating profile...",
        success: "Profile updated!",
        error: "Failed to update profile",
      }
    );
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/change-password",
        "PUT",
        {
          currentPassword,
          newPassword,
        },
        token
      ),
      {
        loading: "Changing password...",
        success: "Password changed!",
        error: "Failed to change password",
      }
    );

    return response;
  }

  // Helper method to create a user object from API response
  createUserFromResponse(data: LoginResponse): User {
    // The backend returns { accessToken, refreshToken, user }
    // So we need to access data.user, not data directly
    const userData = data.user;

    if (!userData) {
      throw new Error("No user data found in login response");
    }

    const user = {
      ...userData,
      // Ensure all required fields are present
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      phoneNumber: userData.phoneNumber,
      timezone: userData.timezone,
      globalRole: userData.globalRole,
      isActive: userData.isActive,
      emailVerified: userData.emailVerified,
      emailVerifiedAt: userData.emailVerifiedAt,
      lastLoginAt: userData.lastLoginAt,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      permissions: userData.permissions,
      organizations: userData.organizations,
      workspaces: userData.workspaces,
    };

    return user;
  }

  // Workspace Management Methods
  async createWorkspace(data: {
    name: string;
    description?: string;
    organizationId: string;
  }): Promise<ApiResponse<{ message: string; workspaceId: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string; workspaceId: string }>(
      "/auth/workspace",
      "POST",
      data,
      token || undefined
    );
  }

  async updateWorkspace(
    workspaceId: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string }>(
      `/auth/workspace/${workspaceId}`,
      "PUT",
      data,
      token || undefined
    );
  }

  async deleteWorkspace(
    workspaceId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string }>(
      `/auth/workspace/${workspaceId}`,
      "DELETE",
      undefined,
      token || undefined
    );
  }

  async getWorkspacesByOrganization(
    organizationId: string
  ): Promise<ApiResponse<Record<string, unknown>[]>> {
    const token = this.getAccessToken();
    return this.makeRequest<Record<string, unknown>[]>(
      `/auth/organization/${organizationId}/workspaces`,
      "GET",
      undefined,
      token || undefined
    );
  }

  // Organization Management Methods
  async createOrganization(data: {
    name: string;
    description?: string;
    website?: string;
  }): Promise<ApiResponse<{ message: string; organizationId: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string; organizationId: string }>(
      "/auth/organization",
      "POST",
      data,
      token || undefined
    );
  }

  async updateOrganization(
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      website?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string }>(
      `/auth/organization/${organizationId}`,
      "PUT",
      data,
      token || undefined
    );
  }

  async deleteOrganization(
    organizationId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const token = this.getAccessToken();
    return this.makeRequest<{ message: string }>(
      `/auth/organization/${organizationId}`,
      "DELETE",
      undefined,
      token || undefined
    );
  }

  // Store tokens in localStorage
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("crm_access_token", accessToken);
    localStorage.setItem("crm_refresh_token", refreshToken);
  }

  // Get access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem("crm_access_token");
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    return localStorage.getItem("crm_refresh_token");
  }

  // Remove tokens from localStorage
  removeTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  // Store user data in localStorage
  setUser(user: User): void {
    localStorage.setItem("crm_user", JSON.stringify(user));
  }

  // Get user data from localStorage
  getUser(): User | null {
    const userStr = localStorage.getItem("crm_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);

        return user;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Remove user data from localStorage
  removeUser(): void {
    localStorage.removeItem("user");
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Clear all auth data
  clearAuth(): void {
    this.removeTokens();
    this.removeUser();
  }
}

export const authService = new AuthService();
export default authService;
