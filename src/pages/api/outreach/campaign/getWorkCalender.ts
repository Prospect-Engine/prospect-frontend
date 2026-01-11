import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { campaignId } = req.query;

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(campaignId as string)}/work-calender`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({ err });
  }
}
