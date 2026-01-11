// CRM API Service for integrating with crm_backend contacts API
// Independent from White Walker API infrastructure

// Helper to safely access localStorage (SSR-safe)
const getStorageItem = (key: string): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) ?? "";
  }
  return "";
};

// Helper to get cookie value by name (SSR-safe)
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue || null;
  }
  return null;
};

// CRM configuration with lazy access to localStorage
const getCrmConfig = () => ({
  accessToken: getStorageItem("crm_access_token"),
  workspaceId: getStorageItem("selectedWorkspaceId"),
  organizationId: getStorageItem("selectedOrganizationId"),
  baseUrl: process.env.NEXT_PUBLIC_CRM_BACKEND_URL,
});

// Flag to prevent multiple sync attempts
let crmSyncInProgress = false;
let crmSyncAttempted = false;

/**
 * Attempt to sync CRM authentication using the outreach tenant ID.
 * This should be called when CRM token is missing but user is authenticated in outreach.
 */
export async function syncCrmAuthentication(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (crmSyncInProgress || crmSyncAttempted) return false;

  // Check if we already have a CRM token
  const existingToken = getStorageItem("crm_access_token");
  if (existingToken) return true;

  // Get the access_token cookie from outreach
  const accessToken = getCookie("access_token");
  if (!accessToken) return false;

  crmSyncInProgress = true;
  crmSyncAttempted = true;

  try {
    // Decode the JWT to get tenant_id (organization ID)
    const tokenParts = accessToken.split(".");
    if (tokenParts.length !== 3) return false;

    const payload = JSON.parse(atob(tokenParts[1]));
    const tenantId = payload.tenant_id;

    if (!tenantId) return false;

    // Call tenant-login on CRM backend to get CRM tokens
    const { authService } = await import("./sales-services/authService");
    const response = await authService.tenantLogin({ tenantId });

    if (response.success && response.data?.accessToken) {
      // Store CRM tokens
      localStorage.setItem("crm_access_token", response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem("crm_refresh_token", response.data.refreshToken);
      }
      if (response.data.user) {
        localStorage.setItem("crm_user", JSON.stringify(response.data.user));
      }
      return true;
    }

    return false;
  } catch (error) {
    console.warn("CRM authentication sync failed:", error);
    return false;
  } finally {
    crmSyncInProgress = false;
  }
}

// Response wrapper to match crm_frontend pattern
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Individual field update DTOs (matching crm_frontend exactly)
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
  preferredChannel: string;
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
  channelPrefs: Record<string, unknown>;
}

// Types based on the CRM backend DTOs
export interface Contact {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  jobTitle?: string;
  avatar?: string;
  leadType?: string;
  status?: string;
  preferredChannel?: string;
  leadScore?: number;
  source?: string;
  priority?: string;
  customAttributes?: Record<string, any>;
  enrichedData?: Record<string, any>;
  enrichmentScore?: number;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  ownerId?: string;
  companyId?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  company?: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    size?: string;
    location?: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  tags?: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
      color?: string;
    };
  }>;

  // LinkedIn fields
  linkedinUrnId?: string;
  linkedinPublicId?: string;
  linkedinLocation?: string;
  linkedinHeadline?: string;
  linkedinAbout?: string;
  linkedinJoined?: string;
  linkedinBirthday?: string;
  linkedinConnected?: boolean;
  linkedinAddress?: string;
  linkedinIsOpenToWork?: boolean;
  linkedinProfilePhoto?: string;
  linkedinProfileUpdated?: string;
  linkedinContactInfoUpdated?: string;

  // LinkedIn Premium & Connection
  linkedinIsPremium?: boolean;
  linkedinIsOpenProfile?: boolean;
  linkedinConnectionDegree?: string;
  linkedinConnectedOn?: string;

  // LinkedIn Experience
  linkedinExperience?: Array<{
    position: string;
    company: string;
    duration?: string;
    location?: string;
    description?: string;
    skills?: string;
    url?: string;
    isCurrent?: boolean;
  }>;

  // LinkedIn Skills
  linkedinSkills?: Array<{
    name: string;
    endorsements?: number;
  }>;

  // LinkedIn Education
  linkedinEducation?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startYear?: string;
    endYear?: string;
  }>;

  // LinkedIn Recommendations
  linkedinRecommendations?: Array<{
    name: string;
    headline?: string;
    text: string;
    recommenderUrn?: string;
  }>;

  // LinkedIn Contact Info
  linkedinWebsites?: string[];
  linkedinPhones?: string[];
  linkedinEmails?: string[];
  linkedinIM?: string[];

  // LinkedIn Job Preferences
  linkedinJobTitles?: string[];
  linkedinLocationTypes?: string[];
  linkedinEmploymentTypes?: string[];

  // Mutual Connections
  linkedinMutualConnections?: Array<{
    name: string;
    headline?: string;
    urn?: string;
  }>;
  linkedinMutualConnectionsCount?: number;

  // Company enriched data
  linkedinCompanySize?: string;
  linkedinCompanyIndustry?: string;
  linkedinCompanyWebsite?: string;
  linkedinCompanyFounded?: string;
  linkedinCompanySpecialties?: string[];
}

export interface ContactEnums {
  leadTypes: string[];
  contactStatuses: string[];
  communicationChannels: string[];
}

export interface CreateContactDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  jobTitle?: string;
  avatar?: string;
  leadType?: string;
  status?: string;
  preferredChannel?: string;
  leadScore?: number;
  source?: string;
  priority?: string;
  customAttributes?: Record<string, any>;
  companyId?: string;
  ownerId?: string;
  // LinkedIn Information fields
  linkedinUrnId?: string;
  linkedinPublicId?: string;
  linkedinLocation?: string;
  linkedinHeadline?: string;
  linkedinAbout?: string;
  linkedinJoined?: string;
  linkedinBirthday?: string;
  linkedinConnected?: boolean;
  linkedinAddress?: string;
  linkedinIsOpenToWork?: boolean;
  linkedinProfilePhoto?: string;
  linkedinProfileUpdated?: string;
  linkedinContactInfoUpdated?: string;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {
  id: string;
}

export interface QueryContactParams {
  workspaceId: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  search?: string;
  leadType?: string;
  status?: string;
  source?: string;
  priority?: string;
  ownerId?: string;
  companyId?: string;
}

// Independent CRM API call function - completely separate from White Walker API
// Falls back to outreach authentication if CRM token is not available
async function crmApiCall<T extends Record<string, any> = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    params?: Record<string, any>;
  } = {}
): Promise<{ data: T; status: number }> {
  const { method = "GET", body, params } = options;

  // Build URL with query parameters
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Complete URL with CRM base URL
  const fullUrl = `${getCrmConfig().baseUrl}${url}`;

  let status = 500;
  let data: any;

  try {
    const crmToken = getCrmConfig().accessToken;

    // Build headers - use CRM token if available, otherwise rely on cookies
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if we have a CRM token
    if (crmToken) {
      headers["Authorization"] = `Bearer ${crmToken}`;
    }

    const fetchParams: RequestInit = {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(body),
      // Include credentials to send HTTP-only cookies as fallback auth
      credentials: "include" as RequestCredentials,
    };

    let response = await fetch(fullUrl, fetchParams);

    status = response.status;
    let responseText = await response.text();

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: "Invalid JSON response", rawResponse: responseText };
    }

    // If we get a 401 and don't have a CRM token, try to sync authentication
    if (status === 401 && !crmToken && !crmSyncAttempted) {
      const synced = await syncCrmAuthentication();
      if (synced) {
        // Retry the request with the new token
        const newToken = getCrmConfig().accessToken;
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          fetchParams.headers = headers;
          response = await fetch(fullUrl, fetchParams);
          status = response.status;
          responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { error: "Invalid JSON response", rawResponse: responseText };
          }
        }
      }
    }

    // Handle errors - but don't show toast for 401 as it might just mean CRM sync isn't available
    if (!response.ok && status !== 401) {
      if (typeof window !== "undefined") {
        // Only import and use UI components on client side
        const { default: ShowShortMessage } = await import(
          "@/base-component/ShowShortMessage"
        );
        ShowShortMessage(data?.message || `CRM API error: ${status}`, "error");
      }
    }
  } catch (error) {
    if (typeof window !== "undefined") {
      const { default: ShowShortMessage } = await import(
        "@/base-component/ShowShortMessage"
      );
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        // Don't show error for CRM connection issues - let the page fall back to mock data
        console.warn("Cannot connect to CRM backend:", error);
      } else {
        ShowShortMessage("CRM API request failed. Please try again.", "error");
      }
    }
  }

  return { data, status };
}

export class CrmApiService {
  // Use getter to avoid SSR issues with localStorage
  private static get baseUrl() {
    return getCrmConfig().baseUrl;
  }

  // Core CRUD operations (matching crm_frontend exactly)
  static async getContacts(
    params: Partial<QueryContactParams> = {}
  ): Promise<{ data: Contact[]; status: number }> {
    const queryParams = {
      workspaceId: getCrmConfig().workspaceId,
      organizationId: getCrmConfig().organizationId,
      ...params,
    };

    return crmApiCall<Contact[]>(`/contacts`, {
      method: "GET",
      params: queryParams,
    });
  }

  // Get single contact
  static async getContact(
    id: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${id}`, {
      method: "GET",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Create contact
  static async createContact(
    contactData: CreateContactDto
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts`, {
      method: "POST",
      body: {
        ...contactData,
        workspaceId: getCrmConfig().workspaceId,
      },
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  // Update contact
  static async updateContact(
    id: string,
    contactData: Partial<CreateContactDto>
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${id}`, {
      method: "PATCH",
      body: contactData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Delete contact
  static async deleteContact(
    id: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${id}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Get contact enums
  static async getContactEnums(): Promise<{
    data: ContactEnums;
    status: number;
  }> {
    return crmApiCall<ContactEnums>(`/contacts/enums`, {
      method: "GET",
    });
  }

  // Search contacts
  static async searchContacts(
    query: string,
    filters: Partial<QueryContactParams> = {}
  ): Promise<{ data: Contact[]; status: number }> {
    const params = {
      workspaceId: getCrmConfig().workspaceId,
      organizationId: getCrmConfig().organizationId,
      search: query,
      ...filters,
    };

    return this.getContacts(params);
  }

  // Individual field update methods (like CRM frontend)
  static async updateName(
    contactId: string,
    name: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/name`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { name },
    });
  }

  static async updateEmail(
    contactId: string,
    email: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/email`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { email },
    });
  }

  static async updatePhoneNumber(
    contactId: string,
    phoneNumber: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/phone-number`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { phoneNumber },
    });
  }

  static async updateWhatsappNumber(
    contactId: string,
    whatsappNumber: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/whatsapp-number`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { whatsappNumber },
    });
  }

  static async updateJobTitle(
    contactId: string,
    jobTitle: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/job-title`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { jobTitle },
    });
  }

  static async updateLinkedinUrl(
    contactId: string,
    linkedinUrl: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-url`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinUrl },
    });
  }

  static async updateTwitterUrl(
    contactId: string,
    twitterUrl: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/twitter-handle`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { twitterUrl },
    });
  }

  static async updateWebsiteUrl(
    contactId: string,
    websiteUrl: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/website-url`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { websiteUrl },
    });
  }

  static async updateStatus(
    contactId: string,
    status: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/status`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { status },
    });
  }

  static async updatePriority(
    contactId: string,
    priority: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/priority`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { priority },
    });
  }

  static async updateLeadType(
    contactId: string,
    leadType: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/lead-type`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { leadType },
    });
  }

  static async updateLeadScore(
    contactId: string,
    leadScore: number
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/lead-score`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { leadScore },
    });
  }

  static async updateSource(
    contactId: string,
    source: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/source`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { source },
    });
  }

  static async updatePreferredChannel(
    contactId: string,
    preferredChannel: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/preferred-channel`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { preferredChannel },
    });
  }

  // Additional field update methods to match crm_frontend exactly
  static async updateCustomAttributes(
    contactId: string,
    data: UpdateCustomAttributesRequest
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/custom-attributes`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: data,
    });
  }

  static async updateEnrichedData(
    contactId: string,
    data: UpdateEnrichedDataRequest
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/enriched-data`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: data,
    });
  }

  static async updateEnrichmentScore(
    contactId: string,
    enrichmentScore: number
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/enrichment-score`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { enrichmentScore },
    });
  }

  static async updateLastContactedAt(
    contactId: string,
    lastContactedAt: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/last-contacted-at`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { lastContactedAt },
    });
  }

  static async updateNextFollowUpAt(
    contactId: string,
    nextFollowUpAt: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/next-follow-up-at`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { nextFollowUpAt },
    });
  }

  static async updateOwnerId(
    contactId: string,
    ownerId: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/owner-id`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { ownerId },
    });
  }

  static async updateCompanyId(
    contactId: string,
    companyId: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/company-id`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { companyId },
    });
  }

  static async updateAvatar(
    contactId: string,
    avatar: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/avatar`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { avatar },
    });
  }

  static async updateChannelPrefs(
    contactId: string,
    data: UpdateChannelPrefsRequest
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/channel-prefs`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: data,
    });
  }

  // LinkedIn Information field update methods
  static async updateLinkedinUrnId(
    contactId: string,
    linkedinUrnId: string
  ): Promise<{ data: Contact; status: number }> {
    const result = await crmApiCall<Contact>(
      `/contacts/${contactId}/linkedin-urn-id`,
      {
        method: "PATCH",
        params: { workspaceId: getCrmConfig().workspaceId },
        body: { linkedinUrnId },
      }
    );
    return result;
  }

  static async updateLinkedinPublicId(
    contactId: string,
    linkedinPublicId: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-public-id`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinPublicId },
    });
  }

  static async updateLinkedinLocation(
    contactId: string,
    linkedinLocation: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-location`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinLocation },
    });
  }

  static async updateLinkedinHeadline(
    contactId: string,
    linkedinHeadline: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-headline`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinHeadline },
    });
  }

  static async updateLinkedinAbout(
    contactId: string,
    linkedinAbout: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-about`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinAbout },
    });
  }

  static async updateLinkedinJoined(
    contactId: string,
    linkedinJoined: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-joined`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinJoined },
    });
  }

  static async updateLinkedinBirthday(
    contactId: string,
    linkedinBirthday: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-birthday`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinBirthday },
    });
  }

  static async updateLinkedinConnected(
    contactId: string,
    linkedinConnected: boolean
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-connected`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinConnected },
    });
  }

  static async updateLinkedinAddress(
    contactId: string,
    linkedinAddress: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(`/contacts/${contactId}/linkedin-address`, {
      method: "PATCH",
      params: { workspaceId: getCrmConfig().workspaceId },
      body: { linkedinAddress },
    });
  }

  static async updateLinkedinIsOpenToWork(
    contactId: string,
    linkedinIsOpenToWork: boolean
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(
      `/contacts/${contactId}/linkedin-is-open-to-work`,
      {
        method: "PATCH",
        params: { workspaceId: getCrmConfig().workspaceId },
        body: { linkedinIsOpenToWork },
      }
    );
  }

  static async updateLinkedinProfilePhoto(
    contactId: string,
    linkedinProfilePhoto: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(
      `/contacts/${contactId}/linkedin-profile-photo`,
      {
        method: "PATCH",
        params: { workspaceId: getCrmConfig().workspaceId },
        body: { linkedinProfilePhoto },
      }
    );
  }

  static async updateLinkedinProfileUpdated(
    contactId: string,
    linkedinProfileUpdated: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(
      `/contacts/${contactId}/linkedin-profile-updated`,
      {
        method: "PATCH",
        params: { workspaceId: getCrmConfig().workspaceId },
        body: { linkedinProfileUpdated },
      }
    );
  }

  static async updateLinkedinContactInfoUpdated(
    contactId: string,
    linkedinContactInfoUpdated: string
  ): Promise<{ data: Contact; status: number }> {
    return crmApiCall<Contact>(
      `/contacts/${contactId}/linkedin-contact-info-updated`,
      {
        method: "PATCH",
        params: { workspaceId: getCrmConfig().workspaceId },
        body: { linkedinContactInfoUpdated },
      }
    );
  }

  // Bulk operations
  static async bulkDeleteContacts(
    ids: string[],
    force: boolean = true,
    deleteRelated: boolean = true
  ): Promise<{ data: any; status: number }> {
    const requestBody = {
      contactIds: ids,
      force: Boolean(force),
      deleteRelated: Boolean(deleteRelated),
    };

    return crmApiCall(`/contacts/bulk`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
      body: requestBody,
    });
  }

  // Activities API methods
  static async getActivities(
    contactId?: string
  ): Promise<{ data: any[]; status: number }> {
    const params: any = {
      workspaceId: getCrmConfig().workspaceId,
      organizationId: getCrmConfig().organizationId,
    };
    if (contactId) {
      params.contactId = contactId;
    }

    return crmApiCall(`/activities`, {
      method: "GET",
      params,
    });
  }

  static async createActivity(
    activityData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/activities`, {
      method: "POST",
      body: {
        ...activityData,
        workspaceId: getCrmConfig().workspaceId,
      },
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async deleteActivity(
    id: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/activities/${id}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Update activity method
  static async updateActivity(
    id: string,
    activityData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/activities/${id}`, {
      method: "PATCH",
      body: activityData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Deals API methods
  static async getDeals(
    entityId?: string,
    entityType?: string
  ): Promise<{ data: any[]; status: number }> {
    const params: any = {
      workspaceId: getCrmConfig().workspaceId,
      organizationId: getCrmConfig().organizationId,
    };

    // Use specific endpoints for getting deals by contact or company
    let endpoint = "/deals";

    if (entityId && entityType) {
      if (entityType === "contact") {
        // Use the by-contact endpoint for contact-specific deals
        endpoint = `/deals/by-contact/${entityId}`;
      } else if (entityType === "company") {
        // Use the by-company endpoint for company-specific deals
        endpoint = `/deals/by-company/${entityId}`;
      }
    } else {
    }

    return crmApiCall(endpoint, {
      method: "GET",
      params,
    });
  }

  static async createDeal(
    dealData: any
  ): Promise<{ data: any; status: number }> {
    // Do NOT add workspaceId to body - it should only be in query params
    return crmApiCall(`/deals`, {
      method: "POST",
      body: dealData, // Send only the deal data, no additional fields
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async deleteDeal(id: string): Promise<{ data: any; status: number }> {
    return crmApiCall(`/deals/${id}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Notes API methods with local storage fallback
  static async getNotes(
    contactId: string
  ): Promise<{ data: any[]; status: number }> {
    try {
      // Try the proper API endpoint pattern first
      const response = await crmApiCall(`/notes`, {
        method: "GET",
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
          contactId: contactId,
        },
      });
      return response;
    } catch (error) {
      // If the API doesn't exist yet, return empty array with local storage fallback
      if (typeof window !== "undefined") {
        const localNotes = localStorage.getItem(`notes_${contactId}`);
        const parsedNotes = localNotes ? JSON.parse(localNotes) : [];
        return {
          data: parsedNotes,
          status: 200,
        };
      }
      return { data: [], status: 200 };
    }
  }

  static async createNote(
    contactId: string,
    noteData: { title?: string; content: string }
  ): Promise<{ data: any; status: number }> {
    try {
      // Use the proper API endpoint pattern
      return await crmApiCall(`/notes`, {
        method: "POST",
        body: {
          ...noteData,
          contactId: contactId,
        },
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
      });
    } catch (error) {
      // Fallback to local storage if API not available
      const newNote = {
        id: `note_${Date.now()}`,
        ...noteData,
        createdAt: new Date().toISOString(),
        author: "You",
        contactId,
      };
      if (typeof window !== "undefined") {
        const localNotes = localStorage.getItem(`notes_${contactId}`);
        const notes = localNotes ? JSON.parse(localNotes) : [];
        notes.push(newNote);
        localStorage.setItem(`notes_${contactId}`, JSON.stringify(notes));
      }
      return {
        data: newNote,
        status: 201,
      };
    }
  }

  static async updateNote(
    contactId: string,
    noteId: string,
    noteData: { title?: string; content?: string }
  ): Promise<{ data: any; status: number }> {
    try {
      // Use the proper API endpoint pattern
      return await crmApiCall(`/notes/${noteId}`, {
        method: "PATCH",
        body: noteData,
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
      });
    } catch (error) {
      // Fallback to local storage if API not available
      let updatedNote = null;
      if (typeof window !== "undefined") {
        const localNotes = localStorage.getItem(`notes_${contactId}`);
        const notes = localNotes ? JSON.parse(localNotes) : [];
        const noteIndex = notes.findIndex((note: any) => note.id === noteId);
        if (noteIndex >= 0) {
          notes[noteIndex] = {
            ...notes[noteIndex],
            ...noteData,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(`notes_${contactId}`, JSON.stringify(notes));
          updatedNote = notes[noteIndex];
        }
      }
      return {
        data: updatedNote,
        status: 200,
      };
    }
  }

  static async deleteNote(
    contactId: string,
    noteId: string
  ): Promise<{ data: any; status: number }> {
    try {
      // Use the proper API endpoint pattern
      return await crmApiCall(`/notes/${noteId}`, {
        method: "DELETE",
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
      });
    } catch (error) {
      // Fallback to local storage if API not available
      if (typeof window !== "undefined") {
        const localNotes = localStorage.getItem(`notes_${contactId}`);
        const notes = localNotes ? JSON.parse(localNotes) : [];
        const updatedNotes = notes.filter((note: any) => note.id !== noteId);
        localStorage.setItem(`notes_${contactId}`, JSON.stringify(updatedNotes));
      }
      return {
        data: { success: true },
        status: 200,
      };
    }
  }

  // Tasks API methods
  static async getTasks(
    entityId?: string,
    entityType?: string
  ): Promise<{ data: any[]; status: number }> {
    const params: any = {
      workspaceId: getCrmConfig().workspaceId,
      organizationId: getCrmConfig().organizationId,
    };

    if (entityId && entityType) {
      // Use the correct endpoint structure based on entity type
      if (entityType === "contact") {
        return crmApiCall(`/tasks/contacts/${entityId}`, {
          method: "GET",
          params,
        });
      } else if (entityType === "company") {
        return crmApiCall(`/tasks/companies/${entityId}`, {
          method: "GET",
          params,
        });
      } else if (entityType === "deal") {
        return crmApiCall(`/tasks/deals/${entityId}`, {
          method: "GET",
          params,
        });
      }
    }

    // Fallback to general tasks endpoint if no specific entity
    return crmApiCall(`/tasks`, {
      method: "GET",
      params,
    });
  }

  static async createTask(
    taskData: any
  ): Promise<{ data: any; status: number }> {
    // Do NOT add workspaceId to body - it should only be in query params
    // Remove only workspaceId from body as API doesn't expect it
    // Keep contactId, companyId, dealId as they are required by the API
    const { workspaceId, ...cleanTaskData } = taskData;

    return crmApiCall(`/tasks`, {
      method: "POST",
      body: cleanTaskData, // Send only the task data, no additional fields
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async updateTask(
    id: string,
    taskData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/tasks/${id}`, {
      method: "PATCH",
      body: taskData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async deleteTask(id: string): Promise<{ data: any; status: number }> {
    return crmApiCall(`/tasks/${id}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  // Task status update method - Use general task update endpoint
  static async updateTaskStatus(
    id: string,
    status: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/tasks/${id}`, {
      method: "PATCH",
      body: { status },
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  // Deal update method
  static async updateDeal(
    id: string,
    dealData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/deals/${id}`, {
      method: "PATCH",
      body: dealData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Deal status update method
  static async updateDealStatus(
    id: string,
    status: string,
    actualCloseDate?: string
  ): Promise<{ data: any; status: number }> {
    const body: any = { status };
    if (actualCloseDate) {
      body.actualCloseDate = actualCloseDate;
    }

    return crmApiCall(`/deals/${id}/status`, {
      method: "PATCH",
      body,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // LinkedIn Experience API methods
  static async getLinkedinExperience(
    contactId: string
  ): Promise<{ data: any[]; status: number }> {
    return crmApiCall(`/contacts/${contactId}/linkedin-experience`, {
      method: "GET",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async addLinkedinExperience(
    contactId: string,
    experienceData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${contactId}/linkedin-experience`, {
      method: "POST",
      body: experienceData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async updateLinkedinExperience(
    contactId: string,
    experienceId: string,
    experienceData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(
      `/contacts/${contactId}/linkedin-experience/${experienceId}`,
      {
        method: "PATCH",
        body: experienceData,
        params: {
          workspaceId: getCrmConfig().workspaceId,
        },
      }
    );
  }

  static async deleteLinkedinExperience(
    contactId: string,
    experienceId: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(
      `/contacts/${contactId}/linkedin-experience/${experienceId}`,
      {
        method: "DELETE",
        params: {
          workspaceId: getCrmConfig().workspaceId,
        },
      }
    );
  }

  // LinkedIn Skills API methods
  static async getLinkedinSkills(
    contactId: string
  ): Promise<{ data: any[]; status: number }> {
    return crmApiCall(`/contacts/${contactId}/linkedin-skills`, {
      method: "GET",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async addLinkedinSkill(
    contactId: string,
    skillData: any
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${contactId}/linkedin-skills`, {
      method: "POST",
      body: skillData,
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async deleteLinkedinSkill(
    contactId: string,
    skillId: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${contactId}/linkedin-skills/${skillId}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  // Tags API methods
  static async getContactTags(
    contactId: string
  ): Promise<{ data: any[]; status: number }> {
    return crmApiCall(`/tags/entity/contact/${contactId}`, {
      method: "GET",
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async assignTagToContact(
    contactId: string,
    tagId: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${contactId}/tags/${tagId}`, {
      method: "POST",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async removeTagFromContact(
    contactId: string,
    tagId: string
  ): Promise<{ data: any; status: number }> {
    return crmApiCall(`/contacts/${contactId}/tags/${tagId}`, {
      method: "DELETE",
      params: {
        workspaceId: getCrmConfig().workspaceId,
      },
    });
  }

  static async getAllTags(): Promise<{ data: any[]; status: number }> {
    return crmApiCall(`/tags`, {
      method: "GET",
      params: {
        workspaceId: getCrmConfig().workspaceId,
        // organizationId: getCrmConfig().organizationId,
      },
    });
  }

  static async createTag(tagData: any): Promise<{ data: any; status: number }> {
    return crmApiCall(`/tags`, {
      method: "POST",
      body: {
        ...tagData,
        workspaceId: getCrmConfig().workspaceId,
      },
      params: {
        workspaceId: getCrmConfig().workspaceId,
        organizationId: getCrmConfig().organizationId,
      },
    });
  }

  // Messages/Conversations API methods
  static async getMessages(
    contactId?: string
  ): Promise<{ data: any[]; status: number }> {
    // For now, return empty array as messages functionality might not be fully implemented
    // In the future, this would integrate with WhatsApp or conversation endpoints
    return Promise.resolve({ data: [], status: 200 });
  }

  static async sendMessage(
    messageData: any
  ): Promise<{ data: any; status: number }> {
    // For now, return success as placeholder
    // In the future, this would integrate with WhatsApp or email sending
    return Promise.resolve({ data: messageData, status: 200 });
  }

  // Export/Import methods for contacts
  static async exportContacts(exportData: {
    format: string;
    fields?: string[];
    includeHeaders?: boolean;
    includeCompany?: boolean;
    includeActivities?: boolean;
    includeNotes?: boolean;
    includeTasks?: boolean;
    includeDeals?: boolean;
    dateFormat?: string;
  }): Promise<{ data: any; status: number; error?: string }> {
    try {
      return await crmApiCall(`/contacts/export`, {
        method: "POST",
        body: {
          ...exportData,
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
      });
    } catch (error) {
      return {
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  static async importContacts(importData: {
    format: string;
    fileContent: string;
    columnMapping?: Record<string, string>;
    options?: {
      skipHeader: boolean;
      updateExisting: boolean;
      createMissingCompanies: boolean;
      defaultLeadType: string;
      defaultStatus: string;
    };
  }): Promise<{ data: any; status: number; error?: string }> {
    try {
      return await crmApiCall(`/contacts/import`, {
        method: "POST",
        body: {
          ...importData,
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
        params: {
          workspaceId: getCrmConfig().workspaceId,
          organizationId: getCrmConfig().organizationId,
        },
      });
    } catch (error) {
      return {
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Import failed",
      };
    }
  }
}

export default CrmApiService;
