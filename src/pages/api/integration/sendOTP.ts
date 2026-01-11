import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body = req.body;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Ashborn expects { integrationId, code }
    // Support both integration_id and integrationId field names
    const requestBody = {
      integrationId: body.integrationId || body.integration_id,
      code: body.code || body.otp,
    };

    const params: ApiPropsType = {
      url: "/integrations/send-otp",
      method: "post",
      body: requestBody,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err });
  }
}
