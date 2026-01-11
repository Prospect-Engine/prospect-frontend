import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

interface ToggleWeeklyRecoveryBody {
  integrationId?: string;
  isEnabled: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Accept integrationId from query parameter or body
    const integrationIdFromQuery = req.query.integrationId;
    const { integrationId: integrationIdFromBody, isEnabled } =
      req.body as ToggleWeeklyRecoveryBody;

    const integrationId =
      (typeof integrationIdFromQuery === "string"
        ? integrationIdFromQuery
        : undefined) || integrationIdFromBody;

    if (!integrationId) {
      return res.status(400).json({ message: "Integration ID is required" });
    }

    if (typeof isEnabled !== "boolean") {
      return res.status(400).json({ message: "isEnabled must be a boolean" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/integrations/${integrationId}/weekly-quota-recovery`,
      method: "patch",
      body: { isEnabled },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({ err });
  }
}
