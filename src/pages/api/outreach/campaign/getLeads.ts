import { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

// Fetch list of target leads for a campaign
// GET {BASE}/{camp_id}/target-leads
// Per latest spec, this should hit /white-walker/v1/campaigns/{camp_id}/target-leads (no /virtual)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { camp_id } = (req.method === "POST" ? req.body : req.query) as any;
    if (!camp_id) {
      return res.status(400).json({ message: "camp_id is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(camp_id)}/target-leads`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
    };
    const { data, status } = await apiCall(params);

    // Unwrap nested data structure from backend
    // Backend returns: { success: true, data: { success: true, target_leads: [...] } }
    const responseData = unwrapAshbornResponse<{
      target_leads?: any[];
      lead_count?: number;
      data_source?: string;
    }>(data);

    let rawList: any[] = [];
    if (Array.isArray(responseData?.target_leads)) {
      rawList = responseData.target_leads as any[];
    } else if (Array.isArray(responseData)) {
      rawList = responseData as any[];
    }

    let target_leads = rawList.map((item: any) => ({
      id: item.id || item.target_id || item.uuid,
      lead_ids: item.lead_ids || item.leads || [],
      search_url: item.search_url || item.url || null,
      data_source: item.data_source || item.source || "UNKNOWN",
      total_leads:
        item.total_leads || (item.lead_ids ? item.lead_ids.length : 0),
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
      error_message: item.error_message || item.error || undefined,
    }));

    // Fallback: summary-only response after addLead3A
    if (target_leads.length === 0 && responseData?.lead_count) {
      target_leads = [
        {
          id: `summary_${Date.now()}`,
          lead_ids: [],
          search_url: null,
          data_source: responseData.data_source || "CSV",
          total_leads: responseData.lead_count || 0,
          created_at: new Date().toISOString(),
          error_message: undefined,
        },
      ];
    }

    return res.status(status).json({ success: true, target_leads });
  } catch (err) {
    return res.status(500).json({ err });
  }
}
