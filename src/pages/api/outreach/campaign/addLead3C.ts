import { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

// Sales Navigator leads
// POST {BASE}/{id}/target-url

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

    const url = `${config.getCampaignsEndpoint}/${encodeURIComponent(campaignId)}/target-url?append=true`;

    const params: ApiPropsType = {
      url,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "X-Operation": "append", // Explicitly indicate this is an append operation
        Authorization: `Bearer ${tokenString}`,
      },
      body: payload,
    };
    const { data, status } = await apiCall(params);

    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      message: "Failed to add sales navigator leads",
      err: String((err as Error)?.message || err),
    });
  }
}
