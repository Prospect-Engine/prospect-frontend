import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Ashborn uses GET /integrations to list all integrations
    // This can be used to check if any integrations exist
    const params: ApiPropsType = {
      url: "/integrations",
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    // Return whether the user has any integrations
    const integrations = Array.isArray(responseData)
      ? responseData
      : responseData?.integrations || [];

    return res.status(status).json({
      hasIntegrations: integrations.length > 0,
      count: integrations.length,
      integrations,
    });
  } catch (err) {
    return res.status(500).json({ err });
  }
}
