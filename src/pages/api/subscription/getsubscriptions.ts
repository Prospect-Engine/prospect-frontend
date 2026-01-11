import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";
import { normalizeSubscriptionResponse } from "@/utils/subscriptionAdapter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({ error: "No access token found" });
    }

    const params: ApiPropsType = {
      url: `/paywall/subscription/me`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    const normalized = normalizeSubscriptionResponse(data);

    return res.status(status).json(normalized);
  } catch (error) {
    console.error("Error in getsubscriptions API:", error);
    return res.status(500).json({
      error: "Failed to fetch subscription data",
      message: "Unable to retrieve subscription information",
    });
  }
}
