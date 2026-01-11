import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

interface Lead {
  id: string;
  pipeline_id: string;
  urn_id: string;
  name: string;
  headline: string;
  location: string;
  connection_degree: string;
  profile_url: string;
  profile_image_url: string;
  other_details: string;
  created_at: string;
  updated_at: string;
  profile_pic_url: string;
  has_enriched_profile: boolean;
}

interface EnrichedProfile {
  integrationId: string;
  urn_id: string;
  public_id: string;
  aboutThisProfile: {
    name: string;
    joined: string;
    contact_information: string;
    profile_photo: string;
    Verifications: Array<{
      Identity: string;
    }>;
  };
  jobDetails?: {
    currentTitle: string;
    currentCompany: string;
    industry: string;
    reactionType: string;
  };
  contactInfo: {
    profile_public_id: string;
    websites: string[];
    phone: string[];
    address: string[];
    email: string[];
    IM: string[];
    birthday: string;
    connected: string;
  };
  jobPreferences: {
    name: string;
    isOpenToWork: boolean;
    jobTitles: string[];
    locationTypes: string[];
    locationsOnSite: string[];
    locationsRemote: string[];
    startDate: string;
    employmentTypes: string[];
  };
  aboutSection: {
    about: string;
  };
  experience: Array<{
    position: string;
    duration: string;
    location?: string;
    company: string;
    url?: string;
    description: string;
    skills: string;
  }>;
  companies: Array<{
    url: string;
    data: {
      companyName: string;
      headline: string;
      description: string;
      website?: string;
      founded?: string;
      specialities: string[];
      phoneNumber?: string;
      companySize: string;
      industry: string;
    };
  }>;
  leadLocation: {
    location: string;
  };
  fetchedAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { scrapeId, selectedLeadIds } = req.body;

    if (!scrapeId) {
      return res.status(400).json({ error: "scrapeId is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Get all leads for the scrape
    const leadsResponse = await apiCall({
      url: `/pipeline/${scrapeId}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    });

    if (leadsResponse.status !== 200 || !Array.isArray(leadsResponse.data)) {
      return res.status(400).json({
        error: "Failed to fetch leads",
        details: leadsResponse.data,
      });
    }

    let leads: Lead[] = leadsResponse.data;

    // Filter to selected leads if provided
    if (selectedLeadIds && selectedLeadIds.length > 0) {
      leads = leads.filter(lead => selectedLeadIds.includes(lead.id));
    }

    // Fetch enriched data for each lead that has it
    const enrichedData: { [key: string]: EnrichedProfile } = {};

    // Get leads that have enriched profiles
    const enrichedLeads = leads.filter(lead => lead.has_enriched_profile);
    //

    if (enrichedLeads.length > 0) {
      const enrichPromises = enrichedLeads.map(async lead => {
        try {
          //

          const enrichResponse = await apiCall({
            url: "/tools/enrich/getLeadDetails",
            method: "post",
            body: {
              pipelineId: lead.pipeline_id,
              urn_id: lead.urn_id,
            },
            headers: {
              Authorization: `Bearer ${tokenString}`,
              "Content-Type": "application/json",
            },
          });

          if (enrichResponse.status === 200) {
            //

            // Extract enriched data from the API response structure
            const enrichedData =
              enrichResponse.data.profile?.enriched_profile ||
              enrichResponse.data.profile?.basic_details?.enrichedProfile;

            if (enrichedData) {
              return { leadId: lead.id, data: enrichedData };
            } else {
              return null;
            }
          } else {
          }
        } catch (error) {}
        return null;
      });

      const enrichResults = await Promise.all(enrichPromises);
      const successfulEnrichments = enrichResults.filter(
        result => result !== null
      );

      //

      successfulEnrichments.forEach(result => {
        if (result) {
          enrichedData[result.leadId] = result.data;
        }
      });
    }

    // Convert to CSV format
    const csvData = convertToCSV(leads, enrichedData, true);

    // Set headers for file download
    const filename = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csvData);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

function convertToCSV(
  leads: Lead[],
  enrichedData: { [key: string]: EnrichedProfile },
  includeEnriched: boolean
): string {
  // Basic headers
  const basicHeaders = [
    "ID",
    "Name",
    "Headline",
    "Location",
    "Connection Degree",
    "Profile URL",
    "Profile Image URL",
    "Created At",
    "Updated At",
    "Has Enriched Profile",
  ];

  // Enriched headers
  const enrichedHeaders = [
    "Current Title",
    "Current Company",
    "Industry",
    "About",
    "Email",
    "Phone",
    "Website",
    "Experience (Latest)",
    "Company Size",
    "Is Open to Work",
    "Job Titles (Open to Work)",
    "Employment Types",
    "Skills",
    "LinkedIn Joined Date",
  ];

  const headers = includeEnriched
    ? [...basicHeaders, ...enrichedHeaders]
    : basicHeaders;

  // Create CSV content
  const csvRows = [headers.join(",")];

  leads.forEach(lead => {
    const basicRow = [
      escapeCSV(lead.id),
      escapeCSV(lead.name),
      escapeCSV(lead.headline),
      escapeCSV(lead.location),
      escapeCSV(lead.connection_degree),
      escapeCSV(lead.profile_url),
      escapeCSV(lead.profile_image_url || lead.profile_pic_url),
      escapeCSV(lead.created_at),
      escapeCSV(lead.updated_at),
      escapeCSV(lead.has_enriched_profile ? "Yes" : "No"),
    ];

    if (includeEnriched) {
      const enriched = enrichedData[lead.id];

      // Log if lead should have enriched data but doesn't
      if (lead.has_enriched_profile && !enriched) {
      }

      const enrichedRow = [
        escapeCSV(enriched?.jobDetails?.currentTitle || ""),
        escapeCSV(enriched?.jobDetails?.currentCompany || ""),
        escapeCSV(enriched?.jobDetails?.industry || ""),
        escapeCSV(enriched?.aboutSection?.about || ""),
        escapeCSV(enriched?.contactInfo?.email?.join("; ") || ""),
        escapeCSV(enriched?.contactInfo?.phone?.join("; ") || ""),
        escapeCSV(enriched?.contactInfo?.websites?.join("; ") || ""),
        escapeCSV(enriched?.experience?.[0]?.position || ""),
        escapeCSV(enriched?.companies?.[0]?.data?.companySize || ""),
        escapeCSV(enriched?.jobPreferences?.isOpenToWork ? "Yes" : "No"),
        escapeCSV(enriched?.jobPreferences?.jobTitles?.join("; ") || ""),
        escapeCSV(enriched?.jobPreferences?.employmentTypes?.join("; ") || ""),
        escapeCSV(enriched?.experience?.[0]?.skills || ""),
        escapeCSV(enriched?.aboutThisProfile?.joined || ""),
      ];
      csvRows.push([...basicRow, ...enrichedRow].join(","));
    } else {
      csvRows.push(basicRow.join(","));
    }
  });

  return csvRows.join("\n");
}

function escapeCSV(value: string): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  // If the value contains comma, newline, or quote, wrap it in quotes and escape quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
