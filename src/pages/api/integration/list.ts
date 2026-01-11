import config from "@/configs/server-config/integration";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";
import { Integration } from "@/types/integration";
import platformLogo from "@/lib/logo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: config.getListEndpoint,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data: rawData, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response first if it's in this format
    const data = rawData?.data || rawData;

    // Some backends return an array at root; others under { integrations: [] }
    const rawList: Integration[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.integrations)
        ? data.integrations
        : [];

    const list = rawList.map((integration: Integration) => ({
      ...integration,
      icon: platformLogo[integration.type]?.icon,
    }));

    return res.status(status).json(list);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
