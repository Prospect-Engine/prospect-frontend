import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

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

    // Unwrap ashborn response format: { success: true, data: {...} }
    const quotaData = unwrapAshbornResponse<{
      used_daily_engine_quota?: Record<string, unknown>;
      available_daily_engine_quota?: Record<string, unknown>;
    }>(data);
    const { used_daily_engine_quota, available_daily_engine_quota } = quotaData;

    if (used_daily_engine_quota) {
      delete used_daily_engine_quota.decision_check_limit;
      delete used_daily_engine_quota.connection_by_email_limit;
      // delete used_daily_engine_quota.inmail_limit;
    }
    if (available_daily_engine_quota) {
      delete available_daily_engine_quota.decision_check_limit;
      delete available_daily_engine_quota.connection_by_email_limit;
      // delete available_daily_engine_quota.inmail_limit;
    }

    return res.status(status).json(quotaData);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
