import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

/**
 * Get quota list from Ashborn backend.
 *
 * Note: Ashborn uses `/user-settings/user-quota-status` endpoint which returns
 * the same structure: { used_daily_engine_quota, available_daily_engine_quota }
 *
 * The available_daily_engine_quota from Ashborn is already the "remaining" quota,
 * so we need to add used to get the total limit.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Ashborn uses user-quota-status endpoint for quota information
    const params: ApiPropsType = {
      url: `/user-settings/user-quota-status`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);

    const { available_daily_engine_quota, used_daily_engine_quota } =
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

    // Ashborn's available_daily_engine_quota is "remaining" quota.
    // Add used quota to get total limit for UI display.
    if (used_daily_engine_quota && available_daily_engine_quota) {
      for (const key in available_daily_engine_quota) {
        available_daily_engine_quota[key] =
          (available_daily_engine_quota as any)[key] +
          (used_daily_engine_quota as any)[key];
      }
    }

    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
