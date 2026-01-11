import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

/**
 * Set campaign quotas.
 *
 * NOTE: Ashborn architecture change:
 * - In white-walker, quotas were per-campaign
 * - In Ashborn, quotas are per-integration (derived from subscription plan)
 * - Campaign-level quota editing is not directly supported in Ashborn
 *
 * This endpoint is kept for backwards compatibility but may return 404
 * when running against Ashborn backend. The frontend settings page
 * should gracefully handle this case.
 *
 * Future: Ashborn may add campaign-level quota distribution, but the
 * source-of-truth quota limits come from the subscription plan.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { campaign_quotas } = req.body;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const params: ApiPropsType = {
      url: `/user-settings/set-quota`,
      method: "post",
      body: { campaign_quotas },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);

    // If Ashborn returns 404 (endpoint not supported), return success with warning
    if (status === 404) {
      return res.status(200).json({
        success: true,
        warning:
          "Campaign quota distribution is managed at the integration level in this version",
      });
    }

    return res.status(status).json(data);
  } catch (err) {
    // If the endpoint doesn't exist, return graceful success
    const error = err as { response?: { status?: number } };
    if (error?.response?.status === 404) {
      return res.status(200).json({
        success: true,
        warning:
          "Campaign quota distribution is managed at the integration level",
      });
    }
    return res.status(500).json({ err });
  }
}
