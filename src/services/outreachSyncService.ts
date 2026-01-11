/**
 * OUTREACH SYNC SERVICE
 * =====================
 * Service to sync LinkedIn connections from Outreach (Ashborn) to CRM.
 * Handles fetching connections and creating/updating CRM contacts.
 */

import { Connection, ConnectionListParams, ConnectionListResponse } from "@/types/connection";
import { Contact, CrmApiService } from "./crmApi";
import outreachConfig from "@/configs/outreach";

export interface OutreachSyncResult {
  success: boolean;
  totalFetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ connectionId: string; error: string }>;
}

export interface OutreachConnection extends Connection {
  // Extended fields from LeadProfile
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  publicId?: string;
  about?: string;
  skills?: Array<{ name: string; endorsements?: number }>;
  experience?: Array<{
    position: string;
    company: string;
    duration?: string;
    location?: string;
    description?: string;
    isCurrent?: boolean;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startYear?: string;
    endYear?: string;
  }>;
  languages?: string[];
  websites?: string[];
  isPremium?: boolean;
  isOpenProfile?: boolean;
  isOpenToWork?: boolean;
  connectionDegree?: string;
  mutualConnectionsCount?: number;
  companySize?: string;
  companyIndustry?: string;
  followerCount?: number;
  connectionCount?: number;
}

/**
 * Fetch connections from the outreach backend
 */
async function fetchOutreachConnections(
  params: ConnectionListParams = {}
): Promise<ConnectionListResponse | null> {
  try {
    const response = await fetch(outreachConfig.getConnectionList, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        page: params.page || 1,
        limit: params.limit || 100,
        orderBy: params.order_by || "connected_on",
        sortType: params.sort_type || "desc",
        filter: params.integration_id
          ? `integration_id=${params.integration_id}`
          : "",
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch connections:", response.status);
      return null;
    }

    const data = await response.json();
    // Handle Ashborn wrapped response format
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      return data.data as ConnectionListResponse;
    }
    return data as ConnectionListResponse;
  } catch (error) {
    console.error("Error fetching outreach connections:", error);
    return null;
  }
}

/**
 * Convert an outreach connection to CRM contact format
 */
function connectionToContact(conn: OutreachConnection): Partial<Contact> {
  // Parse name into first and last
  const nameParts = (conn.name || "").split(" ");
  const firstName = conn.firstName || nameParts[0] || "";
  const lastName = conn.lastName || nameParts.slice(1).join(" ") || "";

  return {
    name: conn.name || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email: conn.email,
    phoneNumber: conn.phone,
    jobTitle: conn.position,
    linkedinUrl: conn.profile_url,
    linkedinUrnId: conn.urn_id,
    linkedinPublicId: conn.publicId,
    linkedinHeadline: conn.headline,
    linkedinProfilePhoto: conn.profile_pic_url,
    linkedinLocation: conn.location,
    linkedinAbout: conn.about,
    linkedinConnectedOn: conn.connected_on,
    linkedinConnectionDegree: conn.connectionDegree || "1st",
    linkedinIsPremium: conn.isPremium,
    linkedinIsOpenProfile: conn.isOpenProfile,
    linkedinIsOpenToWork: conn.isOpenToWork,
    linkedinMutualConnectionsCount: conn.mutualConnectionsCount,
    linkedinCompanySize: conn.companySize,
    linkedinCompanyIndustry: conn.companyIndustry,
    linkedinFollowerCount: conn.followerCount,
    linkedinConnectionCount: conn.connectionCount,
    linkedinSkills: conn.skills,
    linkedinExperience: conn.experience,
    linkedinEducation: conn.education,
    linkedinLanguages: conn.languages,
    linkedinWebsites: conn.websites,
    source: "LINKEDIN_OUTREACH",
    status: "LEAD",
    company: conn.company
      ? {
          id: "",
          name: conn.company,
          industry: conn.companyIndustry,
          size: conn.companySize,
        }
      : undefined,
  };
}

/**
 * Sync a single connection to CRM
 */
async function syncConnectionToCRM(
  conn: OutreachConnection,
  existingContacts: Contact[]
): Promise<{ action: "created" | "updated" | "skipped"; error?: string }> {
  try {
    // Check if contact already exists by LinkedIn URN ID
    const existing = existingContacts.find(
      (c) =>
        c.linkedinUrnId === conn.urn_id ||
        (c.linkedinUrl && conn.profile_url && c.linkedinUrl === conn.profile_url)
    );

    const contactData = connectionToContact(conn);

    if (existing) {
      // Update existing contact with new data
      const { status } = await CrmApiService.updateContact(existing.id, contactData);
      if (status >= 200 && status < 300) {
        return { action: "updated" };
      }
      return { action: "skipped", error: `Update failed with status ${status}` };
    } else {
      // Create new contact
      const { status } = await CrmApiService.createContact(contactData);
      if (status >= 200 && status < 300) {
        return { action: "created" };
      }
      return { action: "skipped", error: `Create failed with status ${status}` };
    }
  } catch (error) {
    return {
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main sync function - sync all connections from outreach to CRM
 */
export async function syncOutreachToCRM(
  options: {
    integrationId?: string;
    limit?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<OutreachSyncResult> {
  const result: OutreachSyncResult = {
    success: false,
    totalFetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch connections from outreach
    const connectionsResponse = await fetchOutreachConnections({
      integration_id: options.integrationId,
      limit: options.limit || 100,
      page: 1,
    });

    if (!connectionsResponse) {
      result.errors.push({ connectionId: "N/A", error: "Failed to fetch connections" });
      return result;
    }

    result.totalFetched = connectionsResponse.data.length;

    // Fetch existing CRM contacts to check for duplicates
    const { data: existingContacts } = await CrmApiService.getContacts({ limit: 1000 });
    const contacts: Contact[] = Array.isArray(existingContacts) ? existingContacts : [];

    // Sync each connection
    for (let i = 0; i < connectionsResponse.data.length; i++) {
      const conn = connectionsResponse.data[i] as OutreachConnection;

      if (options.onProgress) {
        options.onProgress(i + 1, result.totalFetched);
      }

      const { action, error } = await syncConnectionToCRM(conn, contacts);

      switch (action) {
        case "created":
          result.created++;
          break;
        case "updated":
          result.updated++;
          break;
        case "skipped":
          if (error) {
            result.failed++;
            result.errors.push({ connectionId: conn.id, error });
          } else {
            result.skipped++;
          }
          break;
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push({
      connectionId: "N/A",
      error: error instanceof Error ? error.message : "Unknown sync error",
    });
    return result;
  }
}

/**
 * Sync a specific connection by ID
 */
export async function syncSingleConnection(connectionId: string): Promise<{
  success: boolean;
  action?: "created" | "updated" | "skipped";
  error?: string;
}> {
  try {
    // Fetch the specific connection
    const response = await fetchOutreachConnections({ limit: 1000 });
    if (!response) {
      return { success: false, error: "Failed to fetch connections" };
    }

    const conn = response.data.find((c) => c.id === connectionId);
    if (!conn) {
      return { success: false, error: "Connection not found" };
    }

    // Get existing contacts
    const { data: existingContacts } = await CrmApiService.getContacts({ limit: 1000 });
    const contacts: Contact[] = Array.isArray(existingContacts) ? existingContacts : [];

    const { action, error } = await syncConnectionToCRM(conn as OutreachConnection, contacts);
    return { success: !error, action, error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const OutreachSyncService = {
  fetchConnections: fetchOutreachConnections,
  syncToCRM: syncOutreachToCRM,
  syncSingleConnection,
};

export default OutreachSyncService;
