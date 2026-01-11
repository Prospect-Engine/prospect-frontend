import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    if (!tokenString) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${id}/continue`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
