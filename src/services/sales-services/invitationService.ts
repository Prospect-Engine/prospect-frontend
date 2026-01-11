import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

export interface Invitation {
  id: string;
  email: string;
  name: string;
  type: "ORGANIZATION_WIDE" | "WORKSPACE_SPECIFIC" | "MULTIPLE_WORKSPACES";
  organizationName: string;
  inviterName: string;
  expiresAt: string;
  isAccepted: boolean;
  organizationRole?: string;
  workspaceName?: string;
  workspaceRole?: string;
  workspaceInvitations?: WorkspaceInvitation[];
}

export interface WorkspaceInvitation {
  workspaceId: string;
  workspaceName: string;
  role: string;
}

export interface InviteUserRequest {
  email: string;
  name: string;
  type: "ORGANIZATION_WIDE" | "WORKSPACE_SPECIFIC" | "MULTIPLE_WORKSPACES";
  organizationId: string;
  organizationRole?: string;
  workspaceId?: string;
  workspaceRole?: string;
  workspaceInvitations?: {
    workspaceId: string;
    role: string;
  }[];
}

export interface AcceptInvitationRequest {
  token: string;
  password?: string;
  name?: string;
}

export interface InvitationResponse {
  message: string;
  email: string;
  organizationName: string;
  invitationId: string;
  token: string;
  type: string;
  expiresAt: string;
}

export interface GetInvitationResponse {
  invitation: Invitation | null;
  isValid: boolean;
  message?: string;
  userExists?: boolean;
  existingUserName?: string;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class InvitationService {
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
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

  async inviteUser(
    inviteData: InviteUserRequest,
    token: string
  ): Promise<ApiResponse<InvitationResponse>> {
    return toastService.promise(
      this.makeRequest<InvitationResponse>(
        "/auth/invite-user",
        "POST",
        inviteData as unknown as Record<string, unknown>,
        token
      ),
      {
        loading: "Sending invitation...",
        success: "Invitation sent!",
        error: "Failed to send invitation",
      }
    );
  }

  async getInvitation(
    token: string
  ): Promise<ApiResponse<GetInvitationResponse>> {
    return this.makeRequest<GetInvitationResponse>(
      `/auth/invitation/${token}`,
      "GET"
    );
  }

  async acceptInvitation(
    acceptData: AcceptInvitationRequest
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        "/auth/accept-invitation",
        "POST",
        acceptData as unknown as Record<string, unknown>
      ),
      {
        loading: "Accepting invitation...",
        success: "Invitation accepted!",
        error: "Failed to accept invitation",
      }
    );
  }

  async getInvitations(
    organizationId: string,
    token: string
  ): Promise<ApiResponse<InvitationListResponse>> {
    return this.makeRequest<InvitationListResponse>(
      `/auth/invitations/${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async resendInvitation(
    invitationId: string,
    token: string
  ): Promise<ApiResponse<InvitationResponse>> {
    return toastService.promise(
      this.makeRequest<InvitationResponse>(
        "/auth/resend-invitation",
        "POST",
        { invitationId },
        token
      ),
      {
        loading: "Resending invitation...",
        success: "Invitation resent!",
        error: "Failed to resend invitation",
      }
    );
  }

  async cancelInvitation(
    invitationId: string,
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    return toastService.promise(
      this.makeRequest<{ message: string }>(
        "/auth/cancel-invitation",
        "DELETE",
        { invitationId },
        token
      ),
      {
        loading: "Cancelling invitation...",
        success: "Invitation cancelled!",
        error: "Failed to cancel invitation",
      }
    );
  }
}

export const invitationService = new InvitationService();
export default invitationService;
