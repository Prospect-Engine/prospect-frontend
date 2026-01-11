import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

/**
 * GET /api/billing/seatAllocations/statistics
 *
 * Returns complete 4-tier seat allocation statistics for the organization.
 * Requires MANAGE_BILLING permission.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({ error: "No access token found" });
    }

    const params: ApiPropsType = {
      url: `/billing/seats/statistics`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Unwrap the response if it's wrapped in { success, data } format
    const responseData = data?.success && data?.data ? data.data : data;

    return res.status(status).json(responseData);
  } catch (error) {
    console.error("Error in billing/seatAllocations/statistics API:", error);
    return res.status(500).json({
      error: "Failed to fetch seat statistics",
      message: "Unable to retrieve seat allocation statistics",
    });
  }
}
