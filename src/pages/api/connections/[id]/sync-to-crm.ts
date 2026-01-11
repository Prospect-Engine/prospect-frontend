/**
 * API Route: Sync Connection to CRM
 * ==================================
 * POST /api/connections/[id]/sync-to-crm
 *
 * Triggers manual CRM sync for a specific connection.
 * This calls the main backend which then sends a webhook to the CRM service.
 */

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

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Connection ID is required" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({
        message: "Authentication required. Please login again.",
        status_code: 401,
        time: new Date().toISOString(),
      });
    }

    const { organization_id, workspace_id, force_update } = req.body || {};

    if (!organization_id || !workspace_id) {
      return res.status(400).json({
        message: "organization_id and workspace_id are required",
      });
    }

    // Call the main backend to trigger CRM sync
    const params: ApiPropsType = {
      url: `/connections/${id}/sync-to-crm`,
      method: "post",
      data: {
        organization_id,
        workspace_id,
        force_update: force_update || false,
      },
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Return the response from the backend
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    console.error("Error syncing connection to CRM:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
