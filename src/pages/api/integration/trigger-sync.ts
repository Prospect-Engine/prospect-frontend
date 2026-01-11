import { apiCall, ApiPropsType } from "@/lib/apiCall";
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

    if (!tokenString) {
      return res.status(401).json({
        message: "Authentication required. Please login again.",
        status_code: 401,
        time: new Date().toISOString(),
      });
    }

    // Get integration_id from query parameter (id or integration_id)
    const integration_id = (req.query.id || req.query.integration_id) as string;

    if (!integration_id) {
      return res.status(400).json({
        message: "Integration ID is required",
      });
    }

    // Ashborn uses POST /integrations/:id/sync/connections to trigger sync
    const params: ApiPropsType = {
      url: `/integrations/${integration_id}/sync/connections`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    console.error("Error triggering sync:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
