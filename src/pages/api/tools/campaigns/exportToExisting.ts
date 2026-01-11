import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { campaignId, lead_ids, pipelineId } = req.body || {};

    if (!campaignId || !Array.isArray(lead_ids) || !pipelineId) {
      return res.status(400).json({
        message: "campaignId, pipelineId and lead_ids[] are required",
      });
    }

    const params: ApiPropsType = {
      url: `/pipeline/${campaignId}/add-to-exsisting-campaign`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      body: { lead_ids, pipelineId },
      applyDefaultDomain: true,
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
