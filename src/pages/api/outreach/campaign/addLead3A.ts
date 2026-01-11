import { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { getCookie } from "cookies-next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";

// Import URLs and Upload CSV -> target-leads (ADDITIVE - adds to existing leads)
// POST {BASE}/{id}/target-leads

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { campaignId, payload } = req.body || {};
    if (!campaignId || !payload) {
      return res
        .status(400)
        .json({ message: "campaignId and payload are required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.targetLeadsEndpoint}/${encodeURIComponent(campaignId)}/target-leads?append=true`,
      method: "post",
      body: payload,
      headers: { Authorization: `Bearer ${tokenString}` },
    };

    const { data, status } = await apiCall(params);

    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to add target leads",
      error: String(error?.message || error),
    });
  }
}
