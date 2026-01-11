import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const { conversationUrn, campaign_id } = req.body;
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const params: ApiPropsType = {
      url: `/unified/getconversationforreply?conversationId=${conversationUrn}&campaign_id=${campaign_id}`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
      credentials: "include",
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
