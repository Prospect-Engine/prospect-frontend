import { Deal, DealPipeline } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

// Individual field update DTOs
export interface UpdateTitleRequest {
  title: string;
}

export interface UpdateDescriptionRequest {
  description: string;
}

export interface UpdateValueRequest {
  value: number;
}

export interface UpdateCurrencyRequest {
  currency: string;
}

export interface UpdateProbabilityRequest {
  probability: number;
}

export interface UpdateExpectedCloseDateRequest {
  expectedCloseDate: string;
}

export interface UpdateActualCloseDateRequest {
  actualCloseDate: string;
}

export interface UpdateStatusRequest {
  status: "OPEN" | "WON" | "LOST" | "PAUSED";
}

export interface UpdateOwnerIdRequest {
  ownerId: string;
}

export interface UpdateContactIdRequest {
  contactId: string;
}

export interface UpdateCompanyIdRequest {
  companyId: string;
}

export interface UpdateCustomAttributesRequest {
  customAttributes: Record<string, string | number | boolean | null>;
}

export interface UpdateDealStatusRequest {
  status: "OPEN" | "WON" | "LOST" | "PAUSED";
  actualCloseDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class DealService {
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

  async getDeals(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getDeal(
    id: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return this.makeRequest<Deal>(
      `/deals/${id}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createDeal(
    workspaceId: string,
    organizationId: string,
    data: Partial<Deal>,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return toastService.promise(
      this.makeRequest<Deal>(
        `/deals?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        data,
        token
      ),
      {
        loading: "Creating deal...",
        success: "Deal created successfully!",
        error: "Failed to create deal",
      }
    );
  }

  async updateDeal(
    id: string,
    data: Partial<Deal>,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${id}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "PATCH",
        data,
        token
      ),
      {
        loading: "Updating deal...",
        success: "Deal updated successfully!",
        error: "Failed to update deal",
      }
    );
  }

  async deleteDeal(
    id: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<void>> {
    return toastService.promise(
      this.makeRequest<void>(
        `/deals/${id}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "DELETE",
        undefined,
        token
      ),
      {
        loading: "Deleting deal...",
        success: "Deal deleted successfully!",
        error: "Failed to delete deal",
      }
    );
  }

  async bulkDeleteDeals(
    ids: string[],
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<
    ApiResponse<{ deleted: number; failed: number; errors: string[] }>
  > {
    return toastService.promise(
      this.makeRequest<{
        deleted: number;
        failed: number;
        errors: string[];
      }>(
        `/deals/bulk-delete?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        { dealIds: ids },
        token
      ),
      {
        loading: "Deleting deals...",
        success: "Deals deleted successfully!",
        error: "Failed to delete deals",
      }
    );
  }

  async getDealPipeline(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<DealPipeline[]>> {
    return this.makeRequest<DealPipeline[]>(
      `/deals/pipeline?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async updateDealStatus(
    id: string,
    data: UpdateDealStatusRequest,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${id}/status?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "PATCH",
        data as unknown as Record<string, unknown>,
        token
      ),
      {
        loading: "Updating deal status...",
        success: "Deal status updated!",
        error: "Failed to update deal status",
      }
    );
  }

  async addTagToDeal(
    id: string,
    tagId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${id}/tags/${tagId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        undefined,
        token
      ),
      {
        loading: "Adding tag...",
        success: "Tag added to deal!",
        error: "Failed to add tag to deal",
      }
    );
  }

  async removeTagFromDeal(
    id: string,
    tagId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal>> {
    return toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${id}/tags/${tagId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "DELETE",
        undefined,
        token
      ),
      {
        loading: "Removing tag...",
        success: "Tag removed from deal!",
        error: "Failed to remove tag from deal",
      }
    );
  }

  async getDealActivities(
    id: string,
    workspaceId: string,
    token: string
  ): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.makeRequest<Record<string, unknown>[]>(
      `/deals/${id}/activities?workspaceId=${workspaceId}`,
      "GET",
      undefined,
      token
    );
  }

  async getDealsByContact(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/by-contact/${contactId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getDealsByCompany(
    companyId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/by-company/${companyId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getDealsByOwner(
    ownerId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/by-owner/${ownerId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getUpcomingCloses(
    workspaceId: string,
    organizationId: string,
    days: number = 30,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/upcoming-closes?workspaceId=${workspaceId}&organizationId=${organizationId}&days=${days}`,
      "GET",
      undefined,
      token
    );
  }

  async getHighValueDeals(
    workspaceId: string,
    organizationId: string,
    minValue: number = 10000,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/high-value?workspaceId=${workspaceId}&organizationId=${organizationId}&minValue=${minValue}`,
      "GET",
      undefined,
      token
    );
  }

  async getRecentlyUpdatedDeals(
    workspaceId: string,
    organizationId: string,
    days: number = 7,
    token: string
  ): Promise<ApiResponse<Deal[]>> {
    return this.makeRequest<Deal[]>(
      `/deals/recently-updated?workspaceId=${workspaceId}&organizationId=${organizationId}&days=${days}`,
      "GET",
      undefined,
      token
    );
  }

  // Single update method for all deal fields
  async updateDealField(
    dealId: string,
    workspaceId: string,
    organizationId: string,
    fieldName: string,
    value: string | number | boolean | null
  ): Promise<Deal> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");

    const updateData = { [fieldName]: value };

    const response = await toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${dealId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "PATCH",
        updateData,
        token
      ),
      {
        loading: `Updating deal ${fieldName}...`,
        success: `Deal ${fieldName} updated!`,
        error: `Failed to update deal ${fieldName}`,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || `Failed to update deal ${fieldName}`);
    }

    return response.data;
  }

  async updateStatus(
    dealId: string,
    workspaceId: string,
    organizationId: string,
    data: UpdateDealStatusRequest
  ): Promise<Deal> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");

    const response = await toastService.promise(
      this.makeRequest<Deal>(
        `/deals/${dealId}/status?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "PATCH",
        data as unknown as Record<string, unknown>,
        token
      ),
      {
        loading: "Updating deal status...",
        success: "Deal status updated!",
        error: "Failed to update status",
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update status");
    }

    return response.data;
  }

  // Import deals from file
  async importDeals(
    workspaceId: string,
    organizationId: string,
    importData: {
      format: string;
      fileContent: string;
      columnMapping?: Record<string, string>;
      options?: {
        skipHeader: boolean;
        updateExisting: boolean;
        createMissingTags: boolean;
        createMissingCompanies: boolean;
        createMissingContacts: boolean;
        defaultStatus: string;
        defaultCurrency: string;
        defaultProbability: number;
      };
    },
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        `/deals/import?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        importData,
        token
      ),
      {
        loading: "Importing deals...",
        success: "Deals imported successfully!",
        error: "Failed to import deals",
      }
    );
  }

  private async makeFileRequest(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    data?: Record<string, unknown>,
    token?: string
  ): Promise<
    ApiResponse<{ fileContent: string; fileName: string; fileSize: number }>
  > {
    try {
      const headers: Record<string, string> = {
        Accept: "*/*",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (data) {
        headers["Content-Type"] = "application/json";
      }

      const requestUrl = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(requestUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "download";

      // Get the file content as blob
      const blob = await response.blob();

      // Create object URL for the blob
      const objectUrl = window.URL.createObjectURL(blob);

      // Create a link and trigger download
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);

      return {
        success: true,
        data: {
          fileContent: "", // We don't need this anymore since we handled the download
          fileName,
          fileSize: blob.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Export deals to file
  async exportDeals(
    workspaceId: string,
    organizationId: string,
    format: "CSV" | "EXCEL",
    fields: string[],
    options: {
      includeHeaders: boolean;
      includeCompany: boolean;
      includeContact: boolean;
      includeTags: boolean;
      includeActivities: boolean;
      includeNotes: boolean;
      includeTasks: boolean;
      dateFormat: string;
    },
    token: string
  ): Promise<
    ApiResponse<{ fileContent: string; fileName: string; fileSize: number }>
  > {
    return toastService.promise(
      this.makeFileRequest(
        `/deals/export?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        {
          format: format.toLowerCase(),
          fields,
          options,
        },
        token
      ),
      {
        loading: "Exporting deals...",
        success: "Deals exported successfully!",
        error: "Failed to export deals",
      }
    );
  }
}

const dealService = new DealService();
export default dealService;
