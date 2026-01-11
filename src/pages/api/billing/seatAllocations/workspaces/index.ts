import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

/**
 * Workspace Seat Allocations API
 *
 * GET /api/billing/seatAllocations/workspaces - List all workspace allocations
 * POST /api/billing/seatAllocations/workspaces - Create workspace allocation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({ error: "No access token found" });
    }

    const headers = {
      Authorization: `Bearer ${tokenString}`,
      "Content-Type": "application/json",
    };

    switch (req.method) {
      case "GET": {
        // List all workspace allocations
        const params: ApiPropsType = {
          url: `/billing/seats/workspaces`,
          method: "get",
          headers,
        };

        const { data, status } = await apiCall(params);
        // Unwrap the response if it's wrapped in { success, data } format
        const responseData = data?.success && data?.data ? data.data : data;
        // Extract allocations array from the response
        const allocations = responseData?.allocations || responseData;
        return res.status(status).json(allocations);
      }

      case "POST": {
        // Create workspace allocation
        const { workspaceId, allocatedSeats } = req.body;

        if (!workspaceId || typeof allocatedSeats !== "number") {
          return res.status(400).json({
            error: "Missing required fields",
            message: "workspaceId and allocatedSeats are required",
          });
        }

        const params: ApiPropsType = {
          url: `/billing/seats/workspaces`,
          method: "post",
          headers,
          body: { workspaceId, allocatedSeats },
        };

        const { data, status } = await apiCall(params);
        // Unwrap the response if it's wrapped in { success, data } format
        const responseData = data?.success && data?.data ? data.data : data;
        return res.status(status).json(responseData);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in billing/seatAllocations/workspaces API:", error);
    return res.status(500).json({
      error: "Failed to process workspace allocation request",
      message: "Unable to complete the operation",
    });
  }
}
