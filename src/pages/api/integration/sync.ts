import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    const { id } = req.body;

    // Ashborn uses GET /integrations/:id for single integration
    const params: ApiPropsType = {
      url: `/integrations/${id}`,
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
