import { Contact } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";

// Contact status enum

export const CONTACT_STATUSES: Contact["status"][] = [
  "ACTIVE",
  "INACTIVE",
  "PROSPECT",
  "CUSTOMER",
  "LOST",
  "WON",
  "DEAD",
  "LEAD",
  "ENGAGED",
  "INTERESTED",
  "WARM",
  "CLOSED",
];

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

export interface UpdateWhatsappNumberRequest {
  whatsappNumber: string;
}

export interface UpdateLinkedinUrlRequest {
  linkedinUrl: string;
}

export interface UpdateTwitterUrlRequest {
  twitterUrl: string;
}

export interface UpdateWebsiteUrlRequest {
  websiteUrl: string;
}

export interface UpdateJobTitleRequest {
  jobTitle: string;
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

export interface UpdateCompanyIdRequest {
  companyId: string;
}

export interface UpdatePriorityRequest {
  priority: "HOT" | "WARM" | "COLD";
}

// LinkedIn field update DTOs
export interface UpdateLinkedinUrnIdRequest {
  linkedinUrnId: string;
}

export interface UpdateLinkedinPublicIdRequest {
  linkedinPublicId: string;
}

export interface UpdateLinkedinLocationRequest {
  linkedinLocation: string;
}

export interface UpdateLinkedinHeadlineRequest {
  linkedinHeadline: string;
}

export interface UpdateLinkedinAboutRequest {
  linkedinAbout: string;
}

export interface UpdateLinkedinJoinedRequest {
  linkedinJoined: string;
}

export interface UpdateLinkedinBirthdayRequest {
  linkedinBirthday: string;
}

export interface UpdateLinkedinConnectedRequest {
  linkedinConnected: string;
}

export interface UpdateLinkedinAddressRequest {
  linkedinAddress: string;
}

export interface UpdateLinkedinIsOpenToWorkRequest {
  linkedinIsOpenToWork: boolean;
}

export interface UpdateLinkedinProfilePhotoRequest {
  linkedinProfilePhoto: string;
}

export interface UpdateLinkedinProfileUpdatedRequest {
  linkedinProfileUpdated: string;
}

export interface UpdateLinkedinContactInfoUpdatedRequest {
  linkedinContactInfoUpdated: string;
}

// LinkedIn Complex Field Interfaces
export interface CreateLinkedInExperienceRequest {
  position: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string;
  skills?: string;
  url?: string;
}

export interface UpdateLinkedInExperienceRequest {
  position?: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string;
  skills?: string;
  url?: string;
}

export interface CreateLinkedInSkillRequest {
  skillName: string;
}

export interface UpdateLinkedInSkillRequest {
  skillName?: string;
}

export interface CreateLinkedInJobPreferenceRequest {
  jobTitle?: string;
  locationType?: string;
  location?: string;
  employmentType?: string;
}

export interface UpdateLinkedInJobPreferenceRequest {
  jobTitle?: string;
  locationType?: string;
  location?: string;
  employmentType?: string;
}

// Existing field update DTOs
export interface UpdateLeadTypeRequest {
  leadType: "COLD" | "WARM" | "HOT";
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

export interface UpdateLeadScoreRequest {
  leadScore: number;
}

export interface UpdateSourceRequest {
  source: string;
}

export interface UpdateAvatarRequest {
  avatar: string;
}

export interface UpdateChannelPrefsRequest {
  channelPrefs: Record<string, string | number | boolean | null>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ContactService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("crm_access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

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
        // Prevent intermediary/browser caches from returning 304 without a body
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build URL without adding unknown query params (backend rejects unknown params)
      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        // Ensure the browser doesn't serve cached responses
        cache: "no-store",
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

  // Core CRUD operations
  async getContacts(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Contact[]>> {
    return this.makeRequest<Contact[]>(
      `/contacts?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async getContact(
    id: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<Contact>> {
    // If the id is a full URL (contains ':' or '/'), encode it to keep the path a single segment
    const safeId =
      /[:/]/.test(id) && !/%/.test(id) ? encodeURIComponent(id) : id;
    return this.makeRequest<Contact>(
      `/contacts/${safeId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createContact(
    workspaceId: string,
    organizationId: string,
    data: Partial<Contact>,
    token: string
  ): Promise<ApiResponse<Contact>> {
    return this.makeRequest<Contact>(
      `/contacts?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "POST",
      data,
      token
    );
  }

  async updateContact(
    id: string,
    workspaceId: string,
    organizationId: string,
    data: Partial<Contact>,
    token: string
  ): Promise<ApiResponse<Contact>> {
    const params = `?workspaceId=${workspaceId}&organizationId=${organizationId}`;
    return this.makeRequest<Contact>(
      `/contacts/${id}${params}`,
      "PATCH",
      data,
      token
    );
  }

  async deleteContact(id: string, token: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `/contacts/${id}`,
      "DELETE",
      undefined,
      token
    );
  }

  async bulkDeleteContacts(
    ids: string[],
    workspaceId: string,
    organizationId: string,
    token: string,
    force: boolean = true,
    deleteRelated: boolean = true
  ): Promise<ApiResponse<void>> {
    const params = `?workspaceId=${workspaceId}&organizationId=${organizationId}`;
    const requestBody = {
      contactIds: ids,
      force: Boolean(force),
      deleteRelated: Boolean(deleteRelated),
    };

    return this.makeRequest<void>(
      `/contacts/bulk${params}`,
      "DELETE",
      requestBody,
      token
    );
  }

  async importContacts(
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
        defaultLeadType?: string;
        defaultStatus?: string;
      };
    },
    token: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const params = `?workspaceId=${workspaceId}&organizationId=${organizationId}`;
    return this.makeRequest<Record<string, unknown>>(
      `/contacts/import${params}`,
      "POST",
      importData,
      token
    );
  }

  async exportContacts(
    workspaceId: string,
    organizationId: string,
    exportData: {
      format: string;
      fields?: string[];
      options?: {
        includeHeaders?: boolean;
        includeCompany?: boolean;
        includeTags?: boolean;
        includeActivities?: boolean;
        includeDeals?: boolean;
        includeNotes?: boolean;
        includeTasks?: boolean;
        dateFormat?: string;
        timezone?: string;
      };
    },
    token: string
  ): Promise<
    ApiResponse<{ fileContent: string; fileName: string; fileSize: number }>
  > {
    const params = `?workspaceId=${workspaceId}&organizationId=${organizationId}`;
    return this.makeFileRequest(
      `/contacts/export${params}`,
      "POST",
      exportData,
      token
    );
  }

  // Individual field update methods
  async updateName(
    contactId: string,
    workspaceId: string,
    data: UpdateNameRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/name?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateEmail(
    contactId: string,
    workspaceId: string,
    data: UpdateEmailRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/email?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updatePhoneNumber(
    contactId: string,
    workspaceId: string,
    data: UpdatePhoneNumberRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/phone-number?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateWhatsappNumber(
    contactId: string,
    workspaceId: string,
    data: UpdateWhatsappNumberRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/whatsapp-number?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinUrl(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinUrlRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-url?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateTwitterUrl(
    contactId: string,
    workspaceId: string,
    data: UpdateTwitterUrlRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/twitter-handle?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateWebsiteUrl(
    contactId: string,
    workspaceId: string,
    data: UpdateWebsiteUrlRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/website-url?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateJobTitle(
    contactId: string,
    workspaceId: string,
    data: UpdateJobTitleRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/job-title?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateCustomAttributes(
    contactId: string,
    workspaceId: string,
    data: UpdateCustomAttributesRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/custom-attributes?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateEnrichedData(
    contactId: string,
    workspaceId: string,
    data: UpdateEnrichedDataRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/enriched-data?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateEnrichmentScore(
    contactId: string,
    workspaceId: string,
    data: UpdateEnrichmentScoreRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/enrichment-score?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLastContactedAt(
    contactId: string,
    workspaceId: string,
    data: UpdateLastContactedAtRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/last-contacted-at?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateNextFollowUpAt(
    contactId: string,
    workspaceId: string,
    data: UpdateNextFollowUpAtRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/next-follow-up-at?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateOwnerId(
    contactId: string,
    workspaceId: string,
    data: UpdateOwnerIdRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/owner-id?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateCompanyId(
    contactId: string,
    workspaceId: string,
    data: UpdateCompanyIdRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/company-id?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  // LinkedIn field update methods
  async updateLinkedinUrnId(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinUrnIdRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-urn-id?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinPublicId(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinPublicIdRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-public-id?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinLocation(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinLocationRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-location?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinHeadline(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinHeadlineRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-headline?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinAbout(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinAboutRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-about?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinJoined(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinJoinedRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-joined?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinBirthday(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinBirthdayRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-birthday?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinConnected(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinConnectedRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-connected?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinAddress(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinAddressRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-address?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinIsOpenToWork(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinIsOpenToWorkRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-is-open-to-work?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinProfilePhoto(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinProfilePhotoRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-profile-photo?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinProfileUpdated(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinProfileUpdatedRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-profile-updated?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLinkedinContactInfoUpdated(
    contactId: string,
    workspaceId: string,
    data: UpdateLinkedinContactInfoUpdatedRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/linkedin-contact-info-updated?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  // Existing field update methods
  async updateLeadType(
    contactId: string,
    workspaceId: string,
    data: UpdateLeadTypeRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/lead-type?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateStatus(
    contactId: string,
    workspaceId: string,
    data: UpdateStatusRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/status?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updatePreferredChannel(
    contactId: string,
    workspaceId: string,
    data: UpdatePreferredChannelRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/preferred-channel?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateLeadScore(
    contactId: string,
    workspaceId: string,
    data: UpdateLeadScoreRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/lead-score?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateSource(
    contactId: string,
    workspaceId: string,
    data: UpdateSourceRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/source?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateAvatar(
    contactId: string,
    workspaceId: string,
    data: UpdateAvatarRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/avatar?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updateChannelPrefs(
    contactId: string,
    workspaceId: string,
    data: UpdateChannelPrefsRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/channel-prefs?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  async updatePriority(
    contactId: string,
    workspaceId: string,
    data: UpdatePriorityRequest
  ): Promise<Contact> {
    const response = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/priority?workspaceId=${workspaceId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Contact>(response);
  }

  // LinkedIn Experience Methods
  async getLinkedInExperience(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      `/contacts/${contactId}/linkedin-experience?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createLinkedInExperience(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    data: CreateLinkedInExperienceRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-experience?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "POST",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async updateLinkedInExperience(
    contactId: string,
    experienceId: string,
    workspaceId: string,
    organizationId: string,
    data: UpdateLinkedInExperienceRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-experience/${experienceId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "PATCH",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async deleteLinkedInExperience(
    contactId: string,
    experienceId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-experience/${experienceId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "DELETE",
      undefined,
      token
    );
  }

  // LinkedIn Skills Methods
  async getLinkedInSkills(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      `/contacts/${contactId}/linkedin-skills?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createLinkedInSkill(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    data: CreateLinkedInSkillRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-skills?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "POST",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async updateLinkedInSkill(
    contactId: string,
    skillId: string,
    workspaceId: string,
    organizationId: string,
    data: UpdateLinkedInSkillRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-skills/${skillId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "PATCH",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async deleteLinkedInSkill(
    contactId: string,
    skillId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-skills/${skillId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "DELETE",
      undefined,
      token
    );
  }

  // LinkedIn Job Preferences Methods
  async getLinkedInJobPreferences(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      `/contacts/${contactId}/linkedin-job-preferences?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "GET",
      undefined,
      token
    );
  }

  async createLinkedInJobPreference(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    data: CreateLinkedInJobPreferenceRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-job-preferences?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "POST",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async updateLinkedInJobPreference(
    contactId: string,
    jobPrefId: string,
    workspaceId: string,
    organizationId: string,
    data: UpdateLinkedInJobPreferenceRequest,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-job-preferences/${jobPrefId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "PATCH",
      data as unknown as Record<string, unknown>,
      token
    );
  }

  async deleteLinkedInJobPreference(
    contactId: string,
    jobPrefId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/contacts/${contactId}/linkedin-job-preferences/${jobPrefId}?workspaceId=${workspaceId}&organizationId=${organizationId}`,
      "DELETE",
      undefined,
      token
    );
  }
}

export const contactService = new ContactService();
export default contactService;
