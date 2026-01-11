import { Activity } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";

// Activity Types
export interface CreateActivityDto {
  title: string;
  description?: string;
  type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "CUSTOM";
  contactId?: string;
  companyId?: string;
  dealId?: string;
  campaignId?: string;
  channel?: "EMAIL" | "PHONE" | "WHATSAPP" | "LINKEDIN" | "OTHER";
  outcome?: "SUCCESSFUL" | "FAILED" | "NO_RESPONSE" | "RESCHEDULED";
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  workspaceId: string;
  organizationId?: string;
}

export interface UpdateActivityDto {
  title?: string;
  description?: string;
  type?: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "CUSTOM";
  contactId?: string;
  companyId?: string;
  dealId?: string;
  campaignId?: string;
  channel?: "EMAIL" | "PHONE" | "WHATSAPP" | "LINKEDIN" | "OTHER";
  outcome?: "SUCCESSFUL" | "FAILED" | "NO_RESPONSE" | "RESCHEDULED";
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface QueryActivityDto {
  workspaceId: string;
  organizationId?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  campaignId?: string;
  type?: string;
  channel?: string;
  outcome?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityEnums {
  activityTypes: string[];
  communicationChannels: string[];
  activityOutcomes: string[];
}

class ActivitiesService {
  private baseUrl = API_BASE_URL;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${this.baseUrl}/activities${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Activity operation failed");
    }

    return response.json();
  }

  // Get all activities with filtering
  async getActivities(query: QueryActivityDto): Promise<Activity[]> {
    const params = new URLSearchParams();

    // Required parameters
    params.append("workspaceId", query.workspaceId);

    // Optional parameters
    if (query.organizationId) {
      params.append("organizationId", query.organizationId);
    }
    if (query.contactId) {
      params.append("contactId", query.contactId);
    }
    if (query.companyId) {
      params.append("companyId", query.companyId);
    }
    if (query.dealId) {
      params.append("dealId", query.dealId);
    }
    if (query.campaignId) {
      params.append("campaignId", query.campaignId);
    }
    if (query.type) {
      params.append("type", query.type);
    }
    if (query.channel) {
      params.append("channel", query.channel);
    }
    if (query.outcome) {
      params.append("outcome", query.outcome);
    }
    if (query.userId) {
      params.append("userId", query.userId);
    }
    if (query.startDate) {
      params.append("startDate", query.startDate);
    }
    if (query.endDate) {
      params.append("endDate", query.endDate);
    }
    if (query.limit) {
      params.append("limit", query.limit.toString());
    }
    if (query.offset) {
      params.append("offset", query.offset.toString());
    }

    return this.request<Activity[]>(`?${params.toString()}`);
  }

  // Get activities for a specific contact
  async getContactActivities(
    contactId: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<Activity[]> {
    const params = new URLSearchParams({
      contactId,
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Activity[]>(`?${params.toString()}`);
  }

  // Get activities for a specific company
  async getCompanyActivities(
    companyId: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<Activity[]> {
    const params = new URLSearchParams({
      companyId,
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Activity[]>(`?${params.toString()}`);
  }

  // Get activities for a specific deal
  async getDealActivities(
    dealId: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<Activity[]> {
    const params = new URLSearchParams({
      dealId,
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Activity[]>(`?${params.toString()}`);
  }

  // Get a single activity by ID
  async getActivity(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<Activity> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Activity>(`/${id}?${params.toString()}`);
  }

  // Create a new activity
  async createActivity(data: CreateActivityDto): Promise<Activity> {
    return this.request<Activity>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update an existing activity
  async updateActivity(
    id: string,
    data: UpdateActivityDto,
    workspaceId: string,
    organizationId?: string
  ): Promise<Activity> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Activity>(`/${id}?${params.toString()}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete an activity
  async deleteActivity(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  // Get activity enums (types, channels, outcomes)
  async getActivityEnums(): Promise<ActivityEnums> {
    return this.request<ActivityEnums>("/enums");
  }

  // Bulk delete activities
  async bulkDeleteActivities(
    activityIds: string[],
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/bulk-delete?${params.toString()}`, {
      method: "DELETE",
      body: JSON.stringify({ activityIds }),
    });
  }
}

export default new ActivitiesService();
