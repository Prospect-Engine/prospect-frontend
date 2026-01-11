import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

/**
 * Get user quota status from Ashborn backend.
 *
 * This endpoint is compatible with both white-walker and Ashborn backends.
 * Returns: { used_daily_engine_quota, available_daily_engine_quota }
 *
 * Note: Ashborn's available_daily_engine_quota is "remaining" quota (not total).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const params: ApiPropsType = {
      url: `/user-settings/user-quota-status`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);
    const { used_daily_engine_quota, available_daily_engine_quota } =
      data as any;

    // Remove internal quota types not displayed in UI
    if (used_daily_engine_quota) {
      delete used_daily_engine_quota.decision_check_limit;
      delete used_daily_engine_quota.connection_by_email_limit;
    }
    if (available_daily_engine_quota) {
      delete available_daily_engine_quota.decision_check_limit;
      delete available_daily_engine_quota.connection_by_email_limit;
    }

    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
