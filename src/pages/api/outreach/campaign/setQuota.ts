import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { campaignId, per_integration_quota } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "campaignId is required" });
    }

    if (!per_integration_quota) {
      return res
        .status(400)
        .json({ message: "per_integration_quota is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/campaigns/${encodeURIComponent(campaignId)}/quota`,
      method: "put",
      body: { per_integration_quota },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({ err });
  }
}
