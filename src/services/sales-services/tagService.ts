import { ApiResponse } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

// Tag interfaces
export interface Tag {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagWithCounts extends Tag {
  contactCount: number;
  companyCount: number;
  dealCount: number;
}

export interface TagUsage {
  tagId: string;
  tagName: string;
  contactCount: number;
  companyCount: number;
  dealCount: number;
  totalCount: number;
}

export interface TagAssignment {
  id: string;
  tagId: string;
  tagName: string;
  entityId: string;
  entityType: "contact" | "company" | "deal";
  entity: Record<string, unknown>;
  organizationId: string;
  workspaceId: string;
  createdAt: string;
}

// DTOs for tag operations
export interface CreateTagRequest {
  name: string;
  description?: string;
  organizationId: string;
  workspaceId: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
}

export interface AssignTagRequest {
  tagId: string;
  entityId: string;
  entityType: "contact" | "company" | "deal";
  organizationId: string;
  workspaceId: string;
}

export interface BulkAssignTagsRequest {
  tagIds: string[];
  entityIds: string[];
  entityType: "contact" | "company" | "deal";
  organizationId: string;
  workspaceId: string;
}

export interface UnifiedTagRequest {
  operation:
    | "create"
    | "update"
    | "delete"
    | "assign"
    | "unassign"
    | "bulk_assign"
    | "bulk_delete"
    | "get_all"
    | "get_one"
    | "get_popular"
    | "get_usage"
    | "get_entity_tags"
    | "get_tag_assignments"
    | "delete_tag_assignment";
  workspaceId: string;
  organizationId: string;
  tagId?: string;
  tagData?: {
    name?: string;
    description?: string;
    workspaceId?: string;
    organizationId?: string;
  };
  entityId?: string;
  entityIds?: string[];
  entityType?: "contact" | "company" | "deal";
  tagIds?: string[];
  limit?: number;
  assignmentId?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  jobTitle?: string;
  leadType?: string;
  leadScore?: number;
  status?: string;
  source?: string;
  avatar?: string;
  preferredChannel?: string;
  channelPrefs?: Record<string, unknown>;
  customAttributes?: Record<string, unknown>;
  enrichedData?: Record<string, unknown>;
  enrichmentScore?: number;
  lastEnrichedAt?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string;
  company?: Record<string, unknown>;
  owner?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  tags?: Record<string, unknown>[];
  activities?: Record<string, unknown>[];
  deals?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
  notes?: Record<string, unknown>[];
  tasks?: Record<string, unknown>[];
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  stage?: string;
}

class TagService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
    data?: Record<string, unknown>,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
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

  // Unified tag management endpoint
  async executeTagOperation(
    request: UnifiedTagRequest,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.makeRequest<TagWithCounts[]>(
      "/tags/unified",
      "POST",
      request as unknown as Record<string, unknown>,
      token
    );
    if (response.success) {
      // toastService.success('Tags updated successfully');
    } else {
      toastService.error(response.error || "Failed to update tags");
    }
    return response;
  }

  // Convenience methods for common operations
  async getAllTags(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_all",
        workspaceId,
        organizationId,
      },
      token
    );
    if (response.success) {
      // toastService.success('Tags fetched successfully');
    } else {
      toastService.error(response.error || "Failed to fetch tags");
    }
    return response;
  }

  async getPopularTags(
    workspaceId: string,
    organizationId: string,
    limit: number = 10,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_popular",
        workspaceId,
        organizationId,
        limit,
      },
      token
    );
    if (response.success) {
      // toastService.success('Popular tags fetched successfully');
    } else {
      toastService.error(response.error || "Failed to fetch popular tags");
    }
    return response;
  }

  async getTagUsage(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_usage",
        workspaceId,
        organizationId,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag usage fetched successfully");
    } else {
      toastService.error(response.error || "Failed to fetch tag usage");
    }
    return response;
  }

  async getTagAssignments(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_tag_assignments",
        workspaceId,
        organizationId,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag assignments fetched successfully");
    } else {
      toastService.error(response.error || "Failed to fetch tag assignments");
    }
    return response;
  }

  async createTag(
    data: CreateTagRequest,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    return toastService.promise(
      this.executeTagOperation(
        {
          operation: "create",
          workspaceId: data.workspaceId,
          organizationId: data.organizationId,
          tagData: {
            name: data.name,
            description: data.description,
            workspaceId: data.workspaceId,
            organizationId: data.organizationId,
          },
        },
        token
      ),
      {
        loading: "Creating tag...",
        success: "Tag created successfully!",
        error: "Failed to create tag",
      }
    );
  }

  async updateTag(
    tagId: string,
    data: UpdateTagRequest,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "update",
        workspaceId,
        organizationId,
        tagId,
        tagData: data,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag updated successfully");
    } else {
      toastService.error(response.error || "Failed to update tag");
    }
    return response;
  }

  async deleteTag(
    tagId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "delete",
        workspaceId,
        organizationId,
        tagId,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag deleted successfully");
    } else {
      toastService.error(response.error || "Failed to delete tag");
    }
    return response;
  }

  async assignTag(
    data: AssignTagRequest,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "assign",
        workspaceId: data.workspaceId,
        organizationId: data.organizationId,
        tagId: data.tagId,
        entityId: data.entityId,
        entityType: data.entityType,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag assigned successfully");
    } else {
      toastService.error(response.error || "Failed to assign tag");
    }
    return response;
  }

  async unassignTag(
    tagId: string,
    entityId: string,
    entityType: "contact" | "company" | "deal",
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "unassign",
        workspaceId,
        organizationId,
        tagId,
        entityId,
        entityType,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag unassigned successfully");
    } else {
      toastService.error(response.error || "Failed to unassign tag");
    }
    return response;
  }

  async bulkAssignTags(
    data: BulkAssignTagsRequest,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "bulk_assign",
        workspaceId: data.workspaceId,
        organizationId: data.organizationId,
        tagIds: data.tagIds,
        entityIds: data.entityIds,
        entityType: data.entityType,
      },
      token
    );
    if (response.success) {
      toastService.success("Tags bulk assigned successfully");
    } else {
      toastService.error(response.error || "Failed to bulk assign tags");
    }
    return response;
  }

  async bulkDeleteTags(
    tagIds: string[],
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "bulk_delete",
        workspaceId,
        organizationId,
        tagIds,
      },
      token
    );
    if (response.success) {
      toastService.success("Tags bulk deleted successfully");
    } else {
      toastService.error(response.error || "Failed to bulk delete tags");
    }
    return response;
  }

  async getTag(
    tagId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_one",
        workspaceId,
        organizationId,
        tagId,
      },
      token
    );
    if (response.success) {
      toastService.success("Tag fetched successfully");
    } else {
      toastService.error(response.error || "Failed to fetch tag");
    }
    return response;
  }

  async getEntityTags(
    entityId: string,
    entityType: "contact" | "company" | "deal",
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const response = await this.executeTagOperation(
      {
        operation: "get_entity_tags",
        workspaceId,
        organizationId,
        entityId,
        entityType,
      },
      token
    );
    if (response.success) {
      // toastService.success('Entity tags fetched successfully');
    } else {
      toastService.error(response.error || "Failed to fetch entity tags");
    }
    return response;
  }

  async deleteTagAssignment(
    assignmentId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TagWithCounts[]>> {
    const request: UnifiedTagRequest = {
      operation: "delete_tag_assignment",
      workspaceId,
      organizationId,
      assignmentId,
    };

    const response = await this.executeTagOperation(request, token);
    if (response.success) {
      toastService.success("Tag assignment deleted successfully");
    } else {
      toastService.error(response.error || "Failed to delete tag assignment");
    }
    return response;
  }

  // Entity loading methods
  async loadContacts(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Contact[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/contacts?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
          data: [],
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data, // Handle both {data: [...]} and [...] formats
        error: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load contacts",
        data: [],
      };
    }
  }

  async loadCompanies(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Company[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
          data: [],
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data, // Handle both {data: [...]} and [...] formats
        error: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load companies",
        data: [],
      };
    }
  }

  async loadDeals(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    try {
      // Deals module not implemented yet - return empty array

      return {
        success: true,
        error: undefined,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load deals",
        data: [],
      };
    }
  }
}

export const tagService = new TagService();
export default tagService;
