import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { campaignId, enabled } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "campaignId is required" });
    }

    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ message: "enabled boolean value is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/campaigns/${encodeURIComponent(campaignId)}/weekly-recovery`,
      method: "patch",
      body: { enabled },
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
