import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const { checkoutSessionId } = req.body;

    const params: ApiPropsType = {
      url: `/paywall/validate-payment/${checkoutSessionId}`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response to get the actual payment validation data
    const validationData = data?.data || data;

    return res.status(status).json(validationData);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to validate subscription",
      message: "Unable to validate subscription information",
    });
  }
}
