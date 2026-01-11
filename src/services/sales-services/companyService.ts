import { Company } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

// Individual field update DTOs
export interface UpdateNameRequest {
  name: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdatePhoneNumberRequest {
  phoneNumber: string;
}

export interface UpdateWebsiteUrlRequest {
  websiteUrl: string;
}

export interface UpdateLinkedinUrlRequest {
  linkedinUrl: string;
}

export interface UpdateTwitterUrlRequest {
  twitterUrl: string;
}

export interface UpdateDescriptionRequest {
  description: string;
}

export interface UpdateIndustryRequest {
  industry: string;
}

export interface UpdateSizeRequest {
  size: "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";
}

export interface UpdateStatusRequest {
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "PROSPECT"
    | "CUSTOMER"
    | "LOST"
    | "WON"
    | "DEAD"
    | "LEAD"
    | "ENGAGED"
    | "INTERESTED"
    | "WARM"
    | "CLOSED";
}

export interface UpdateCustomAttributesRequest {
  customAttributes: Record<string, string | number | boolean | null>;
}

export interface UpdateEnrichedDataRequest {
  enrichedData: Record<string, string | number | boolean | null>;
}

export interface UpdateEnrichmentScoreRequest {
  enrichmentScore: number;
}

export interface UpdateLastContactedAtRequest {
  lastContactedAt: string;
}

export interface UpdateNextFollowUpAtRequest {
  nextFollowUpAt: string;
}

export interface UpdateOwnerIdRequest {
  ownerId: string;
}

export interface UpdateAvatarRequest {
  avatar: string;
}

export interface UpdateSourceRequest {
  source: string;
}

export interface UpdateAddressRequest {
  address: string;
}

export interface UpdateCityRequest {
  city: string;
}

export interface UpdateStateRequest {
  state: string;
}

export interface UpdateCountryRequest {
  country: string;
}

export interface UpdatePostalCodeRequest {
  postalCode: string;
}

export interface UpdatePreferredChannelRequest {
  preferredChannel:
    | "EMAIL"
    | "PHONE"
    | "WHATSAPP"
    | "LINKEDIN"
    | "TWITTER"
    | "TELEGRAM"
    | "WEBSITE";
}

export interface UpdateChannelPrefsRequest {
  channelPrefs: Record<string, string | number | boolean | null>;
}

export interface UpdateWhatsappNumberRequest {
  whatsappNumber: string;
}

export interface UpdatePriorityRequest {
  priority: "HOT" | "WARM" | "COLD";
}

export interface UpdateFoundedYearRequest {
  foundedYear: number;
}

export interface UpdateRevenueRequest {
  revenue: number;
}

export interface UpdateEmployeeCountRequest {
  employeeCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CompanyService {
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

  async getCompanies(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Company[]>> {
    return this.makeRequest<Company[]>(
      `/companies?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getCompany(
    id: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Company>> {
    return this.makeRequest<Company>(
      `/companies/${id}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createCompany(
    workspaceId: string,
    organizationId: string,
    data: Partial<Company>,
    token: string
  ): Promise<ApiResponse<Company>> {
    return toastService.promise(
      this.makeRequest<Company>(
        `/companies?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        data,
        token
      ),
      {
        loading: "Creating company...",
        success: "Company created successfully!",
        error: "Failed to create company",
      }
    );
  }

  async updateCompany(
    id: string,
    data: Partial<Company>,
    token: string,
    workspaceId?: string
  ): Promise<ApiResponse<Company>> {
    const queryParams = workspaceId ? `?workspaceId=${workspaceId}` : "";
    return toastService.promise(
      this.makeRequest<Company>(
        `/companies/${id}${queryParams}`,
        "PATCH",
        data,
        token
      ),
      {
        loading: "Updating company...",
        success: "Company updated successfully!",
        error: "Failed to update company",
      }
    );
  }

  async deleteCompany(id: string, token: string): Promise<ApiResponse<void>> {
    return toastService.promise(
      this.makeRequest<void>(`/companies/${id}`, "DELETE", undefined, token),
      {
        loading: "Deleting company...",
        success: "Company deleted successfully!",
        error: "Failed to delete company",
      }
    );
  }

  async bulkDeleteCompanies(
    ids: string[],
    workspaceId: string,
    organizationId: string,
    token: string,
    force: boolean = true,
    deleteRelated: boolean = true
  ): Promise<ApiResponse<void>> {
    return toastService.promise(
      this.makeRequest<void>(
        `/companies/bulk?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "DELETE",
        {
          companyIds: ids,
          force,
          deleteRelated,
        },
        token
      ),
      {
        loading: "Deleting companies...",
        success: "Companies deleted successfully!",
        error: "Failed to delete companies",
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

  async importCompanies(
    workspaceId: string,
    organizationId: string,
    importData: {
      format: "csv" | "excel";
      fileContent: string;
      columnMapping: Record<string, string>;
      options: {
        skipHeader: boolean;
        updateExisting: boolean;
        createMissingTags: boolean;
        defaultStatus?: string;
        defaultSize?: string;
      };
    },
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return toastService.promise(
      this.makeRequest<Record<string, unknown>>(
        `/companies/import?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        importData,
        token
      ),
      {
        loading: "Importing companies...",
        success: "Companies imported successfully!",
        error: "Failed to import companies",
      }
    );
  }

  async exportCompanies(
    workspaceId: string,
    organizationId: string,
    exportData: {
      format: "csv" | "excel";
      fields: string[];
      options: {
        includeHeaders: boolean;
        includeContacts?: boolean;
        includeTags?: boolean;
        includeActivities?: boolean;
        includeDeals?: boolean;
        includeNotes?: boolean;
        includeTasks?: boolean;
        dateFormat: string;
        timezone?: string;
      };
    },
    token: string
  ): Promise<
    ApiResponse<{ fileContent: string; fileName: string; fileSize: number }>
  > {
    return toastService.promise(
      this.makeFileRequest(
        `/companies/export?workspaceId=${workspaceId}&organizationId=${organizationId}`,
        "POST",
        exportData,
        token
      ),
      {
        loading: "Exporting companies...",
        success: "Companies exported successfully!",
        error: "Failed to export companies",
      }
    );
  }

  // Single update method for all company fields
  async updateCompanyField(
    companyId: string,
    workspaceId: string,
    fieldName: string,
    value: string | number | boolean | null
  ): Promise<Company> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");

    const updateData = { [fieldName]: value };

    const response = await this.makeRequest<Company>(
      `/companies/${companyId}?workspaceId=${workspaceId}`,
      "PATCH",
      updateData,
      token
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error || `Failed to update company ${fieldName}`
      );
    }

    return response.data;
  }

  async updatePriority(
    companyId: string,
    workspaceId: string,
    data: UpdatePriorityRequest
  ): Promise<Company> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");

    const response = await this.makeRequest<Company>(
      `/companies/${companyId}/priority?workspaceId=${workspaceId}`,
      "PATCH",
      data as unknown as Record<string, unknown>,
      token
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update priority");
    }

    return response.data;
  }
}

const companyService = new CompanyService();
export default companyService;
