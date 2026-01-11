import type { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, type ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const campId = (req.query?.camp_id || req.query?.id) as string | undefined;
  if (!campId) {
    return res.status(400).json({ message: "camp_id is required" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(campId)}/target-leads`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
      applyDefaultDomain: true,
    };
    const { data: rawData, status } = await apiCall(params);

    // Unwrap Ashborn response format
    const data = unwrapAshbornResponse<{
      success?: boolean;
      target_leads?: Array<{ data_source?: string }>;
      data_source?: string;
    }>(rawData);

    // Extract data_source from the response
    // The API returns: { success: true, target_leads: [{ data_source: "CSV", ... }] }
    const dataSource =
      data?.target_leads?.[0]?.data_source || data?.data_source || null;

    return res.status(status).json({
      success: data?.success || true,
      data_source: dataSource,
      target_leads: data?.target_leads || [],
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch lead type",
      err: String((err as Error)?.message || err),
    });
  }
}
