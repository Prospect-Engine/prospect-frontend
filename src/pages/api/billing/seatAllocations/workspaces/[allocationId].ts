import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

/**
 * Workspace Seat Allocation API (Single Resource)
 *
 * PUT /api/billing/seatAllocations/workspaces/[allocationId] - Update allocation
 * DELETE /api/billing/seatAllocations/workspaces/[allocationId] - Delete allocation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { allocationId } = req.query;

  if (!allocationId || typeof allocationId !== "string") {
    return res.status(400).json({ error: "Invalid allocation ID" });
  }

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
      case "PUT": {
        // Update workspace allocation
        const { allocatedSeats } = req.body;

        if (typeof allocatedSeats !== "number") {
          return res.status(400).json({
            error: "Missing required fields",
            message: "allocatedSeats is required",
          });
        }

        const params: ApiPropsType = {
          url: `/billing/seats/workspaces/${allocationId}`,
          method: "put",
          headers,
          body: { allocatedSeats },
        };

        const { data, status } = await apiCall(params);
        return res.status(status).json(data);
      }

      case "DELETE": {
        // Delete workspace allocation
        const params: ApiPropsType = {
          url: `/billing/seats/workspaces/${allocationId}`,
          method: "delete",
          headers,
        };

        const { data, status } = await apiCall(params);
        return res.status(status).json(data);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error(
      "Error in billing/seatAllocations/workspaces/[allocationId] API:",
      error
    );
    return res.status(500).json({
      error: "Failed to process workspace allocation request",
      message: "Unable to complete the operation",
    });
  }
}
