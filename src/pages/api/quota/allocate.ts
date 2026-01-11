import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

/**
 * Admin endpoint to manually trigger quota allocation for an integration.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { integration_id, organization_id, plan_code } = req.body;

    if (!integration_id) {
      return res.status(400).json({ message: "integration_id is required" });
    }

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Call the admin quota allocation endpoint
    const params: ApiPropsType = {
      url: `/admin/quota/allocate/${integration_id}`,
      method: "post",
      body: {
        organizationId: organization_id,
        planCode: plan_code || "pro",
      },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
