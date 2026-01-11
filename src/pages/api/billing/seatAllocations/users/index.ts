import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

/**
 * User Seat Allocations API
 *
 * GET /api/billing/seatAllocations/users?workspaceId=xxx - List user allocations for a workspace
 * POST /api/billing/seatAllocations/users - Create user allocation
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
        // List user allocations for a workspace
        const { workspaceId } = req.query;

        if (!workspaceId || typeof workspaceId !== "string") {
          return res.status(400).json({
            error: "Missing required parameter",
            message: "workspaceId is required",
          });
        }

        const params: ApiPropsType = {
          url: `/billing/seats/users?workspaceId=${workspaceId}`,
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
        // Create user allocation
        const { workspaceId, userId, allocatedSeats } = req.body;

        if (!workspaceId || !userId || typeof allocatedSeats !== "number") {
          return res.status(400).json({
            error: "Missing required fields",
            message: "workspaceId, userId, and allocatedSeats are required",
          });
        }

        const params: ApiPropsType = {
          url: `/billing/seats/users`,
          method: "post",
          headers,
          body: { workspaceId, userId, allocatedSeats },
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
    console.error("Error in billing/seatAllocations/users API:", error);
    return res.status(500).json({
      error: "Failed to process user allocation request",
      message: "Unable to complete the operation",
    });
  }
}
